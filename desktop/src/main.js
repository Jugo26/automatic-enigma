'use strict';
const {app,BrowserWindow,WebContentsView,ipcMain,net,dialog,safeStorage}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const {patchEngineSource}=require('./engine-hooks');
const {EXPRESSION}=require('./game-state');
const {COLLECT_EXPRESSION}=require('./shared-collector');
const {createSharedCenter}=require('./shared-center');
const MOTOR_URL='https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.user.js';
// Portal brasileiro para navegador indicado pelo suporte oficial do Grepolis.
const START_URL='https://br-play.grepolis.com/';
const LAYOUT={sidebar:196,toolbar:80,panel:400};
let shell,gameView,engineCode='',lastEngineError='',retrievedAt=0,injecting=false;
let shared,sharedSyncing,engineVersion='',updateStatus='';
function emit(name,data){if(shell&&!shell.isDestroyed())shell.webContents.send(name,data)}
function isGameURL(u){try{const x=new URL(u);return /^([a-z0-9-]+\.)*grepolis\.com$/i.test(x.hostname)&&x.pathname.startsWith('/game')}catch{return false}}
function normalURL(input){
  const s=String(input||'').trim();
  if(!s) return START_URL;
  if(/^https?:\/\//i.test(s)){const u=new URL(s);if(!['https:','http:'].includes(u.protocol))throw Error('Endereço inválido');return u.href}
  if(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i.test(s))return 'https://'+s;
  return 'https://www.google.com/search?q='+encodeURIComponent(s);
}
function bounds(){
  if(!shell||!gameView)return;
  const [width,height]=shell.getContentSize();
  gameView.setBounds({x:LAYOUT.sidebar,y:LAYOUT.toolbar,
    width:Math.max(100,width-LAYOUT.sidebar-LAYOUT.panel),height:Math.max(100,height-LAYOUT.toolbar)});
}
async function fetchMotor(){
  const cache=path.join(app.getPath('userData'),'grepopilot-engine.js');
  if(engineCode&&Date.now()-retrievedAt<3600000)return engineCode;
  try{
    const resp=await net.fetch(MOTOR_URL,{cache:'no-store'});
    if(!resp.ok)throw Error('HTTP '+resp.status);
    const body=await resp.text();
    engineVersion=body.match(/^\/\/ @version\s+(\S+)/m)?.[1]||'desconhecido';
    engineCode=patchEngineSource(body);
    fs.writeFileSync(cache,engineCode,'utf8');
    retrievedAt=Date.now();lastEngineError='';
  }catch(e){
    lastEngineError=String(e?.message||e);
    if(!engineCode&&fs.existsSync(cache))engineCode=fs.readFileSync(cache,'utf8');
    if(!engineCode)throw Error('Não foi possível baixar o motor: '+lastEngineError);
  }
  return engineCode;
}
async function tryInject(){
  if(!gameView||injecting||!isGameURL(gameView.webContents.getURL()))return;
  injecting=true;
  try{
    const pageReady=await gameView.webContents.executeJavaScript('!!(window.Game?.player_id&&window.GameData?.units)',true);
    if(!pageReady){emit('engine-status','Aguardando a autenticação no mundo...');return}
    const installed=await gameView.webContents.executeJavaScript('!!window.__GREPOPILOT_DESKTOP_API__',true);
    if(installed){emit('engine-status','Motor conectado à interface nativa');return}
    const code=await fetchMotor();
    await gameView.webContents.executeJavaScript(code,true);
    const ok=await gameView.webContents.executeJavaScript('!!window.__GREPOPILOT_DESKTOP_API__',true);
    if(!ok)throw Error('O motor não expôs a API do Desktop');
    emit('engine-status','Motor GrepoPilot conectado');
  }catch(e){emit('engine-status','Integração indisponível: '+String(e.message||e));}
  finally{injecting=false}
}
async function gameExecute(code){
  if(!gameView||gameView.webContents.isDestroyed())throw Error('Navegador indisponível');
  if(!isGameURL(gameView.webContents.getURL()))throw Error('Entre em um mundo do Grepolis');
  return gameView.webContents.executeJavaScript(code,true);
}
async function perform(method,args){
  await tryInject();
  const json=JSON.stringify(args);
  const code=`(() => {const a=window.__GREPOPILOT_DESKTOP_API__;if(!a)throw Error('Motor ainda não conectado');return a[${JSON.stringify(method)}](...${json});})()`;
  return gameExecute(code);
}
async function syncShared(){
  if(sharedSyncing)return sharedSyncing;
  if(!shared?.ready())return null;
  sharedSyncing=(async()=>{
    try{return await shared.sync(await gameExecute(COLLECT_EXPRESSION))}
    catch(e){shared.failed(e);return null}
    finally{sharedSyncing=null;emit('shared-status',shared.publicConfig())}
  })();
  return sharedSyncing;
}
function setupUpdater(){
  if(!app.isPackaged){updateStatus='Desenvolvimento: atualizações do instalador disponíveis após instalação';return}
  try{
    const {autoUpdater}=require('electron-updater');
    autoUpdater.autoDownload=true;
    autoUpdater.autoInstallOnAppQuit=true;
    autoUpdater.on('checking-for-update',()=>{updateStatus='Verificando versão do Desktop';emit('update-status',updateStatus)});
    autoUpdater.on('update-available',info=>{updateStatus='Versão '+info.version+' disponível, baixando';emit('update-status',updateStatus)});
    autoUpdater.on('update-not-available',()=>{updateStatus='Desktop atualizado';emit('update-status',updateStatus)});
    autoUpdater.on('update-downloaded',info=>{updateStatus='Versão '+info.version+' pronta; instala ao fechar o Desktop';emit('update-status',updateStatus)});
    autoUpdater.on('error',err=>{updateStatus='Atualização: '+String(err.message||err);emit('update-status',updateStatus)});
    const check=()=>autoUpdater.checkForUpdates().catch(err=>{
      updateStatus='Atualização: '+String(err.message||err);emit('update-status',updateStatus);
    });
    setTimeout(check,12000).unref?.();
    setInterval(check,8*60*60*1000).unref?.();
  }catch(e){updateStatus='Atualizador não disponível: '+String(e.message||e)}
}
function makeWindow(){
  shell=new BrowserWindow({width:1580,height:950,minWidth:1100,minHeight:620,
    backgroundColor:'#14191f',title:'GrepoPilot Desktop',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  shell.setMenuBarVisibility(false);
  shell.loadFile(path.join(__dirname,'index.html'));
  gameView=new WebContentsView({webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,partition:'persist:grepopilot-game'}});
  shell.contentView.addChildView(gameView);
  bounds();shell.on('resize',bounds);
  gameView.webContents.setWindowOpenHandler(({url})=>{
    if(/^https?:\/\//.test(url))gameView.webContents.loadURL(url).catch(()=>{});
    return {action:'deny'};
  });
  gameView.webContents.on('did-navigate',(_e,u)=>{emit('location',u);setTimeout(tryInject,1100)});
  gameView.webContents.on('did-navigate-in-page',(_e,u)=>{emit('location',u);setTimeout(tryInject,1100)});
  gameView.webContents.on('did-finish-load',()=>{emit('location',gameView.webContents.getURL());setTimeout(tryInject,1250)});
  gameView.webContents.on('did-fail-load',(_event,code,description,validatedURL,isMainFrame)=>{
    if(isMainFrame && code!==-3) emit('engine-status',
      'Falha ao abrir '+validatedURL+': '+description+' (erro '+code+'). Tente https://br-play.grepolis.com/');
  });
  gameView.webContents.loadURL(START_URL).catch(e=>emit('engine-status',e.message));
  const timer=setInterval(tryInject,8000);timer.unref?.();
  shell.on('closed',()=>{clearInterval(timer);gameView=null;shell=null});
}
app.whenReady().then(()=>{
  shared=createSharedCenter({file:path.join(app.getPath('userData'),'shared-center.json'),crypto:safeStorage});
  ipcMain.handle('app-info',()=>({version:app.getVersion(),engineVersion,updateStatus}));
  ipcMain.handle('shared-config',()=>shared.publicConfig());
  ipcMain.handle('shared-connect',(_e,data)=>shared.configure(data));
  ipcMain.handle('shared-disconnect',()=>{shared.clear();return shared.publicConfig()});
  ipcMain.handle('shared-state',()=>shared.getState());
  ipcMain.handle('shared-sharing',(_e,enabled)=>shared.setSharing(enabled));
  ipcMain.handle('shared-sync',()=>syncShared());
  ipcMain.handle('navigate',async(_e,value)=>{const url=normalURL(value);await gameView.webContents.loadURL(url);return url});
  ipcMain.handle('nav',async(_e,action)=>{
    const wc=gameView.webContents;
    if(action==='back'&&wc.canGoBack())wc.goBack();
    else if(action==='forward'&&wc.canGoForward())wc.goForward();
    else if(action==='reload')wc.reload(); // Somente recarga manual pelo usuário.
    return wc.getURL();
  });
  ipcMain.handle('get-state',async()=>{
    if(!gameView)return {ready:false,reason:'Navegador não iniciado'};
    await tryInject();
    try{return await gameExecute(EXPRESSION)}catch(e){return {ready:false,url:gameView.webContents.getURL(),reason:String(e.message||e)}}
  });
  ipcMain.handle('patch',(_e,path,value)=>perform('patch',[path,value]));
  ipcMain.handle('start-recruit',()=>perform('startRecruit',[]));
  ipcMain.handle('start-dodge',()=>perform('startDodge',[]));
  ipcMain.handle('dodge-info',(_e,townId)=>perform('dodgeInfo',[townId]));
  ipcMain.handle('dodge-target',(_e,townId,dest)=>perform('setDodgeTarget',[townId,dest]));
  ipcMain.handle('apply-template',(_e,kind,key,townId,myth)=>perform('applyTemplate',[kind,key,townId,myth||'']));
  ipcMain.handle('run-test',(_e,id,live)=>perform('runTest',[id,live]));
  ipcMain.handle('stop-test',()=>perform('stopTest',[]));
  ipcMain.handle('verify',()=>perform('verify',[]));
  ipcMain.handle('select-json',async()=>{
    const result=await dialog.showOpenDialog(shell,{properties:['openFile'],filters:[{name:'JSON',extensions:['json']}]});
    if(result.canceled||!result.filePaths.length)return null;
    const text=fs.readFileSync(result.filePaths[0],'utf8');
    if(text.length>1000000)throw Error('Arquivo maior que 1 MB');
    return text;
  });
  ipcMain.handle('save-json',async(_e,body)=>{
    if(typeof body!=='string'||body.length>1000000)throw Error('Dados inválidos');
    const {canceled,filePath}=await dialog.showSaveDialog(shell,{defaultPath:'GrepoPilot-perfil.json',filters:[{name:'JSON',extensions:['json']}]});
    if(!canceled&&filePath)fs.writeFileSync(filePath,body,'utf8');
    return !canceled;
  });
  makeWindow();
  setupUpdater();
  setInterval(()=>syncShared().catch(()=>{}),15000).unref?.();
  setTimeout(()=>syncShared().catch(()=>{}),16000).unref?.();
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
module.exports={normalURL,isGameURL};
