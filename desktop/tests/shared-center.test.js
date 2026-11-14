'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createSharedCenter,validServerUrl}=require('../src/shared-center');
const {COLLECT_EXPRESSION}=require('../src/shared-collector');

test('aceita HTTPS externo e HTTP apenas local',()=>{
 assert.equal(validServerUrl('https://central.example/'),'https://central.example');
 assert.equal(validServerUrl('http://127.0.0.1:8787'),'http://127.0.0.1:8787');
 for(const url of ['http://central.example','ftp://x.com','https://user:pass@example.com','https://example.com/other'])
  assert.throws(()=>validServerUrl(url));
});

test('coleta ataques, apoios e comércio das cidades sem inventar tropas',()=>{
 const movement=(attrs)=>({attributes:attrs});
 const world={Game:{player_id:24,player_name:'Teste',alliance_name:'Aliança'},
  ITowns:{towns:{'10':{getName:()=> 'Atenas'},'11':{getName:()=> 'Corinto'}}},
  MM:{getModels:()=>({MovementsUnits:[
   movement({id:101,type:'attack',origin_town_id:10,destination_town_id:44,arrival_at:1731600000,units:{sword:100}}),
   movement({id:102,type:'support',origin_town_id:44,destination_town_id:11,arrival_at:1731600200}),
   movement({id:999,type:'attack',origin_town_id:77,destination_town_id:88})],
   MovementsTrades:[movement({id:103,origin_town_id:11,destination_town_id:10,wood:500,stone:200})]})}};
 const get=new Function('window','location',`return ${COLLECT_EXPRESSION}`);
 const snapshot=get(world,{hostname:'br123.grepolis.com'});
 assert.equal(snapshot.world,'br123');assert.equal(snapshot.playerId,'24');
 assert.equal(snapshot.movements.length,3);
 assert.equal(snapshot.movements[0].type,'attack');
 assert.equal(snapshot.movements[1].direction,'incoming');
 assert.deepEqual(snapshot.movements[1].units,{});
 assert.equal(snapshot.movements[2].type,'trade');
 assert.equal(snapshot.movements[2].resources.wood,500);
});

test('aguarda modelos e reconhece navio colonizador e aliases usados pelo motor',()=>{
 const get=new Function('window','location',`return ${COLLECT_EXPRESSION}`);
 const location={hostname:'br123.grepolis.com'};
 const world={Game:{player_id:24},ITowns:{towns:{}},MM:{getModels:()=>({})}};
 assert.equal(get(world,location).ready,false);
 world.ITowns.towns={10:{name:'Atenas'}};
 assert.equal(get(world,location).ready,false);
 world.MM.getOnlyCollectionByName=name=>name==='MovementsUnits'?{models:[{attributes:{
  id:101,type:'attack',home_town_id:10,target_id:44,time_of_arrival:1731600000,
  troops:{colonize_ship:1}
 }}]}:undefined;
 const snapshot=get(world,location);
 assert.equal(snapshot.ready,true);
 assert.deepEqual(snapshot.movements.map(m=>[m.type,m.direction,m.arriveAt]),[
  ['colonization','outgoing',new Date(1731600000000).toISOString()]
 ]);
 world.MM.getOnlyCollectionByName=()=>({models:[]});
 assert.deepEqual(get(world,location).movements,[]);
});

test('exige token do mesmo jogador e grava somente token criptografado',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'grepo-center-'));
 const file=path.join(folder,'config.json');
 let syncCalls=0;
 const crypto={isEncryptionAvailable:()=>true,encryptString:s=>Buffer.from(s,'utf8').reverse(),decryptString:b=>b.reverse().toString('utf8')};
 const fetchImpl=async (url,opts)=>{
  if(url.endsWith('/api/sync'))syncCalls++;
  return {ok:true,json:async()=>url.endsWith('/api/state')?{
   world:'br123',selfId:'1',users:[{id:'1',playerId:'24',name:'Teste'}],movements:[]}: {ok:true}};
 };
 const svc=createSharedCenter({file,crypto,fetchImpl});
 await svc.configure({serverUrl:'https://central.example',token:'abcdefghijklmnopqrstuvwx'});
 assert.doesNotMatch(fs.readFileSync(file,'utf8'),/abcdefghijklmnopqrstuvwx/);
 assert.equal(svc.publicConfig().configured,true);
 await assert.rejects(()=>svc.sync({ready:true,world:'br124',playerId:'24',movements:[]}),/outro mundo/);
 await assert.rejects(()=>svc.sync({ready:true,world:'br123',playerId:'25',movements:[]}),/outro mundo/);
 assert.equal(syncCalls,0);
 await svc.sync({ready:true,world:'br123',playerId:'24',movements:[],alliance:'A'});
 assert.equal(syncCalls,1);
 const restored=createSharedCenter({file,crypto,fetchImpl});
 assert.equal(restored.publicConfig().configured,true);
 svc.clear();fs.rmSync(folder,{recursive:true,force:true});
});

test('versão do cabeçalho é preenchida pelo aplicativo',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','src','index.html'),'utf8');
 const render=fs.readFileSync(path.join(__dirname,'..','src','renderer.js'),'utf8');
 const main=fs.readFileSync(path.join(__dirname,'..','src','main.js'),'utf8');
 const pkg=require('../package.json');
 assert.equal(pkg.version,require('../package-lock.json').version);
 assert.match(html,/id="app-version"/);
 assert.doesNotMatch(html,/DESKTOP <b>0\.2\.1/);
 assert.match(render,/appInfo\(\)/);
 assert.match(main,/app\.getVersion\(\)/);
 assert.match(render,/Central compartilhada/);
});

test('troca de conexão durante a leitura invalida o snapshot da conta anterior',async t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'grepo-center-'));
 t.after(()=>fs.rmSync(folder,{force:true,recursive:true}));
 const tokenA='a'.repeat(24),tokenB='b'.repeat(24);
 const calls=[];
 const response=playerId=>({ok:true,json:async()=>({
  world:'br123',selfId:'me',users:[{id:'me',playerId}],movements:[]
 })});
 let finish;
 const svc=createSharedCenter({file:path.join(folder,'config.json'),fetchImpl:async (url,opts)=>{
  calls.push({url,token:opts.headers.Authorization});
  if(finish&&url==='https://first.example/api/state'){
   return new Promise(resolve=>{finish=()=>resolve(response('24'))});
  }
  return response(url.startsWith('https://first.example')?'24':'25');
 }});
 await svc.configure({serverUrl:'https://first.example',token:tokenA});
 await assert.rejects(svc.configure({serverUrl:'https://second.example'}),/token/i);
 assert.equal(calls.length,1);
 finish=()=>{};
 const pending=svc.sync({ready:true,world:'br123',playerId:'24',movements:[{id:'only-A'}]});
 await svc.configure({serverUrl:'https://second.example',token:tokenB});
 finish();
 assert.equal(await pending,null);
 assert.equal(calls.some(({url})=>url.endsWith('/api/sync')),false);
});
