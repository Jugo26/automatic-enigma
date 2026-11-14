'use strict';
const fs=require('node:fs');
const path=require('node:path');

function validServerUrl(value){
  const u=new URL(String(value||''));
  if(u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('Use somente a URL raiz do servidor');
  const isLocal=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
  if(u.protocol!=='https:'&&!(isLocal&&u.protocol==='http:'))throw Error('Servidor remoto exige HTTPS');
  return u.origin;
}
function createSharedCenter({file,crypto,fetchImpl=fetch}={}){
  if(!file)throw Error('Caminho de configuração obrigatório');
  let serverUrl='',token='',stored='',lastError='',lastSynced=0;
  let configuration=0,connection=0;
  try{
    const saved=JSON.parse(fs.readFileSync(file,'utf8'));
    serverUrl=validServerUrl(saved.serverUrl);
    stored=String(saved.encryptedToken||'');
    if(stored&&crypto?.isEncryptionAvailable?.())token=crypto.decryptString(Buffer.from(stored,'base64'));
  }catch{token='';stored=''}
  const ready=()=>Boolean(serverUrl&&/^[a-z0-9_-]{20,200}$/i.test(token));
  async function request(method,route,data,url=serverUrl,accessToken=token){
    if(!url||!accessToken)throw Error('Configure a URL e o token da central');
    const response=await fetchImpl(url+route,{method,
      headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},redirect:'error',
      ...(data===undefined?{}:{body:JSON.stringify(data)}),signal:AbortSignal.timeout(10000)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(String(result.error||`Central: HTTP ${response.status}`));
    return result;
  }
  function publicConfig(){return {configured:ready(),serverUrl,tokenStored:!!stored,lastError,lastSynced}}
  async function configure(input){
    const url=validServerUrl(input.serverUrl);
    const nextToken=String(input.token||(url===serverUrl?token:'')).trim();
    if(!/^[a-z0-9_-]{20,200}$/i.test(nextToken))throw Error('Token da central inválido');
    const attempt=++configuration;
    const profile=await request('GET','/api/state',undefined,url,nextToken);
    if(attempt!==configuration)throw Error('A conexão da central mudou');
    if(!profile.world||!profile.selfId||!Array.isArray(profile.users)||
      !profile.users.some(user=>user.id===profile.selfId))throw Error('Resposta inválida da central');
    const encrypted=crypto?.isEncryptionAvailable?.()?crypto.encryptString(nextToken).toString('base64'):'';
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const temp=file+'.tmp';
    fs.writeFileSync(temp,JSON.stringify({serverUrl:url,encryptedToken:encrypted}),{mode:0o600});
    fs.renameSync(temp,file);
    serverUrl=url;token=nextToken;stored=encrypted;lastError='';lastSynced=0;connection++;
    return {config:publicConfig(),state:profile};
  }
  async function getState(){return request('GET','/api/state')}
  async function setSharing(sharing){return request('POST','/api/profile',{sharing:!!sharing})}
  async function sync(snapshot){
    if(!ready())return null;
    if(!snapshot?.ready)throw Error(snapshot?.reason||'Entre em um mundo do Grepolis');
    const current=connection;
    // Impede compartilhar dados de outra conta/mundo com o token salvo.
    const state=await getState();
    if(current!==connection)return null;
    const me=state.users?.find(u=>u.id===state.selfId);
    if(String(state.world)!==snapshot.world||String(me?.playerId)!==snapshot.playerId)
      throw Error('Token pertence a outro mundo ou jogador; sincronização bloqueada');
    const result=await request('POST','/api/sync',{
      world:snapshot.world,playerId:snapshot.playerId,movements:snapshot.movements,alliance:snapshot.alliance
    });
    if(current!==connection)return null;
    lastSynced=Date.now();lastError='';return result;
  }
  function failed(error){lastError=String(error?.message||error)}
  function clear(){
    try{fs.unlinkSync(file)}catch(error){if(error.code!=='ENOENT')throw error}
    configuration++;connection++;serverUrl='';token='';stored='';lastSynced=0;lastError='';
  }
  return {publicConfig,configure,getState,setSharing,sync,failed,clear,ready};
}
module.exports={createSharedCenter,validServerUrl};
