'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {runInNewContext}=require('node:vm');
const {ANCHOR,patchEngineSource}=require('../src/engine-hooks');
const {stateExpression}=require('../src/game-state');
const src=fs.readFileSync(require('node:path').join(__dirname,'..','src','renderer.js'),'utf8');
test('preserva motor e injeta API sem carregar a interface antiga',()=>{
 const original=`// GrepoPilot\n(() => {\n let config={};\n ${ANCHOR}\n host.style.cssText='position:fixed;z-index:2147483000;top:90px;right:20px';\n try{mount();contextualStart();}catch(e){}\n})();`;
 const result=patchEngineSource(original);
 assert.match(result,/__GREPOPILOT_DESKTOP_API__/);
 assert.match(result,/applyTemplate/);
 assert.match(result,/host.style.cssText='display:none!important'/);
 assert.match(result,/try\{mount\(\);\}/);
 assert.doesNotMatch(result,/try\{mount\(\);contextualStart\(\);\}/);
 assert.doesNotThrow(()=>new Function(result));
});
test('não altera motor incompatível',()=>{
 assert.throws(()=>patchEngineSource('GrepoPilot sem âncora'),/ponto de integração/);
});
test('lê apenas os detalhes da aba aberta e reaproveita os sprites por catálogo',()=>{
 const calls=[],styleCalls=[];
 const detail=name=>(...args)=>{calls.push([name,...args]);return name;};
 const catalog={cities:[{id:'10'},{id:'20'}],units:[{id:'slinger'}],researches:[{id:'navigational_chart'}]};
 const window={Game:{player_id:1},GameData:{units:{}},__GREPOPILOT_DESKTOP_API__:{
   catalog:()=>catalog,snapshot:()=>({}),status:()=>({}),templates:detail('templates'),recruitPlan:detail('recruit'),
   caveInfo:detail('cave'),tutorialInfo:detail('tutorial'),islandQuestStatus:detail('island'),dodgeInfo:detail('dodge')
 }};
 const ctx={window,location:{href:'https://br123.grepolis.com/game/'},
   document:{createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
   getComputedStyle(node,pseudo){
     if(!pseudo)styleCalls.push(node.className);
     return {backgroundImage:'url("https://img.example/sprites.png")',backgroundPosition:'-40px 0px'};
   }
 };
 const read=(page,town)=>runInNewContext(stateExpression(page,town),ctx);
 assert.equal(read('INÍCIO').ready,true);
 assert.equal(read('COMPARTILHADA').catalog.units[0].id,'slinger');
 assert.deepEqual(calls,[]);
 assert.deepEqual(styleCalls,[]);
 assert.equal(read('QUARTEL','20').icons.units.slinger.backgroundPosition,'-40px 0px');
 assert.equal(read('ACADEMIA').icons.researches.navigational_chart.backgroundPosition,'-40px 0px');
 assert.equal(read('PORTO','999').recruitPlan,'recruit');
 assert.equal(read('MODELOS').templates,'templates');
 assert.equal(read('ECONOMIA').cave,'cave');
 const missions=read('MISSÕES');
 assert.equal(missions.tutorial,'tutorial');
 assert.equal(missions.islandQuests,'island');
 assert.equal(read('ESQUIVA','20').dodgeInfo,'dodge');
 assert.deepEqual(calls,[['recruit','20'],['recruit','10'],['templates'],['cave'],['tutorial'],['island'],['dodge','20']]);
 assert.deepEqual(styleCalls,['unit_icon40x40 slinger','research_icon research40x40 navigational_chart']);
 delete window.__GREPOPILOT_DESKTOP_API__;
 assert.equal(read('INÍCIO').needsEngine,true);
 delete window.GameData;
 assert.equal(read('INÍCIO').needsEngine,false);
});
test('mantém o DOM do painel nas leituras idênticas e atualiza mudanças reais',()=>{
 const writes={},nodes={};
 const ctx={document:{getElementById:id=>nodes[id]??={set innerHTML(html){writes[id]=(writes[id]||0)+1;}}}};
 runInNewContext(src.slice(0,src.indexOf('// Eventos delegados'))+`
   S={ready:true,config:{enabled:false},catalog:{cities:[{id:'10',name:'Cidade'}]}};
   rendered(false);
   rendered(false);
   S.config.enabled=true;
   rendered(false);
   rendered(false);`,ctx);
 assert.deepEqual(writes,{nav:1,'panel-heading':1,city:1,'panel-content':2});
});
test('telas incluem imagens de edifícios, unidades, pesquisas e ações',()=>{
 for(const name of ['Quartel','Porto','Academia','Senado','Modelos','Aldeias','Esquiva','Diagnóstico'])assert.ok(src.includes(name),name);
 assert.match(src,/gpnl\.innogamescdn\.com\/images\/game\/main/);
 assert.match(src,/function portrait/);
 assert.match(src,/data-research/);
 assert.match(src,/data-building/);
 assert.match(src,/data-unit/);
});

test('abre portal brasileiro e exibe fallback de navegacao',()=>{
 const main=fs.readFileSync(require('node:path').join(__dirname,'..','src','main.js'),'utf8');
 assert.match(main,/const START_URL='https:\/\/br-play\.grepolis\.com\/';/);
 assert.match(main,/did-fail-load/);
 assert.doesNotMatch(main,/const START_URL='https:\/\/www\.grepolis\.com\/';/);
});
test('scripts do Windows usam call e preservam diagnostico',()=>{
 const root=require('node:path').join(__dirname,'..');
 const build=fs.readFileSync(require('node:path').join(root,'CRIAR-INSTALADOR-WINDOWS.bat'),'utf8');
 const start=fs.readFileSync(require('node:path').join(root,'INICIAR-WINDOWS.bat'),'utf8');
 assert.match(build,/call npm\.cmd install/);
 assert.match(build,/call npm\.cmd run check/);
 assert.match(build,/call npm\.cmd run dist/);
 assert.match(build,/instalador\.log/);
 assert.match(build,/pause/);
 assert.match(start,/call npm\.cmd start/);
});


test('a esquiva na HUD configura aliados, destino e mostra bloqueios',()=>{
  assert.match(src,/function dodgePage\(\)/);
  assert.match(src,/dodge\.destinationMode/);
  assert.match(src,/data-dodge-target/);
  assert.match(src,/start-dodge/);
  assert.match(src,/configurações pausadas|Esquiva não está operacional/);
});

test('as opções exibem português e preservam chaves e valores gravados pelo motor',()=>{
 const engine=fs.readFileSync(require('node:path').join(__dirname,'../../GrepoPilot.user.js'),'utf8');
 const window={},nodes={};
 runInNewContext(engine.replace("  if(document.readyState==='loading')",
   "  window.settings=config;return;\n  if(document.readyState==='loading')"),{
   window,location:{host:'teste.grepolis.com'},localStorage:{getItem:()=>null}
 });
 window.settings.recruit.targets={'42':{bireme:10}};
 window.settings.dodge.colonyBaselineMinutes={'2:42':100};
 window.settings.trade.routes=[{from:42,to:2,wood:500}];
 runInNewContext(src.slice(0,src.indexOf('// Eventos delegados'))+
   "\nS={ready:true,config,catalog:{cities:[{id:'42',name:'Esparta'}]}};active='AVANÇADO';rendered()",{
   config:window.settings,document:{getElementById:id=>nodes[id]??={}}
 });
 const html=nodes['panel-content'].innerHTML,menu=nodes.nav.innerHTML;
 assert.doesNotMatch(html,/Opção adicional/);
 assert.match(html,/>Intervalos de execução</);
 assert.match(html,/>Duração da coleta/);
 assert.match(html,/>Construção automática</);
 assert.match(html,/data-number="intervals\.farm"/);
 assert.match(html,/data-choice="sync\.role"[^>]*>[^<]*<option value="primary" selected>Principal/);
 assert.match(html,/>Esparta</);
 assert.match(html,/>Birreme</);
 assert.match(html,/data-number="recruit\.targets\.42\.bireme" value="10"/);
 assert.match(html,/data-json-text="trade\.routes"[^>]*>[\s\S]*?&quot;wood&quot;: 500/);
 assert.match(html,/data-json-text="dodge\.colonyBaselineMinutes"[^>]*>[\s\S]*?&quot;2:42&quot;: 100/);
 assert.doesNotMatch(html,/>\s*(intervals|farm|build|bridge|dryRun|primary|intelligent)\s*</);
 for(const page of ['CIDADES','FILA','AUTOMAÇÕES']){
   assert.match(menu,new RegExp('data-page="'+page+'"[^>]*><span[^>]+ui-icon'));
 }
});

test('o registro apresenta a ação simulada e permite consultar o comando original',()=>{
 const message='SIMULACAO frontend_bridge/execute {"action_name":"storeIron","arguments":{"iron_to_store":500}}';
 const html=runInNewContext(src.slice(0,src.indexOf('// Eventos delegados'))+
   "\nS={status:{logs:[{level:'INFO',stamp:'10:00',message}]}};logPage()",{message});
 assert.match(html,/>Informação</);
 assert.match(html,/>Simulação · depósito de prata na Gruta</);
 assert.match(html,/<details[^>]*><summary>Detalhes do comando<\/summary><pre>SIMULACAO frontend_bridge\/execute /);
});

test('a aba Missões separa o tutorial, as missões da ilha e as opções de recompensa',()=>{
 const html=runInNewContext(src.slice(0,src.indexOf('// Eventos delegados'))+
   "\nS={config:{modules:{tutorial:true,quests:false}},tutorial:{rows:[{name:'Expandir a Fazenda',state:'running',reason:'Aguardando recursos'}]},islandQuests:[{name:'O pescador',state:'satisfied',reason:'Recompensa pronta'}]};missionsPage()",{});
 assert.match(html,/data-path="modules\.tutorial" checked/);
 assert.doesNotMatch(html,/data-path="modules\.quests" checked/);
 assert.match(html,/data-path="quests\.autoObjectives"/);
 assert.match(html,/data-choice="quests\.rewardAction"/);
 assert.match(html,/>Expandir a Fazenda</);
 assert.match(html,/>O pescador</);
});
