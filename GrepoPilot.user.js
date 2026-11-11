// ==UserScript==
// @name         GrepoPilot - Painel de Automacao
// @namespace    https://grepolis.com/
// @version      0.9.7
// @updateURL    https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.meta.js
// @downloadURL  https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.user.js
// @homepageURL  https://github.com/Jugo26/automatic-enigma/tree/grepopilot-updates
// @supportURL   https://github.com/Jugo26/automatic-enigma/blob/grepopilot-updates/GrepoPilot-INSTALACAO-PUBLICA.md
// @description  Painel modular local: farm, obras, tropas, academia, comercio, aldeias, cultura, acampamento PvE, modelos de cidades/tropas, desbloqueio e evolução de aldeias, recompensas de missões/bandidos, conclusão grátis e comandos agendados.
// @match        https://*.grepolis.com/game
// @match        https://*.grepolis.com/game/*
// @run-at       document-idle
// @grant        unsafeWindow
// @grant        GM_setClipboard
// ==/UserScript==
(() => {
  'use strict';
  if (window.__GREPOPILOT_ACTIVE__) return;
  window.__GREPOPILOT_ACTIVE__ = true;
  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const SCRIPT = 'GrepoPilot';
  const BUILDINGS = ['main','storage','farm','lumber','stoner','ironer','academy','barracks','docks','market','temple','hide','wall'];
  const MODULES = {
    farm: ['🌾 Coleta de aldeias','ECONOMIA',60],
    build: ['🏗️ Construção automática','CIDADES',55],
    smartQueue: ['💰 Fila inteligente: menor custo','FILA',25],
    finishFree: ['⏱️ Conclusão grátis (5 min)','CIDADES',5],
    recruit: ['⚔️ Recrutamento','TROPAS',40],
    research: ['🎓 Pesquisas','CIDADES',130],
    trade: ['🚚 Comércio entre cidades','ECONOMIA',100],
    ruralTrade: ['🏺 Trocas com aldeias','ECONOMIA',250],
    ruralUnlock: ['🔓 Desbloquear aldeias','ALDEIAS',60],
    ruralUpgrade: ['⬆️ Evoluir aldeias','ALDEIAS',75],
    quests: ['🎁 Recompensas de missões de ilha','MISSÕES',20],
    banditRewards: ['🎁 Recompensas dos bandidos','MISSÕES',12],
    culture: ['🎭 Festivais e cultura','CIDADES',430],
    bootcamp: ['🏹 Ataques PvE aos bandidos','COMBATE',30],
    cave: ['🕳️ Guardar ferro na gruta','ECONOMIA',350],
    commands: ['🚩 Ataques/apoios agendados','COMBATE',2],
    alerts: ['🚨 Alertas de movimentos','COMBATE',8],
    dodge: ['🛡️ Esquiva com retorno calculado','ESQUIVA',0.125]
  };
  // Modelos orientativos: níveis e tropas são metas configuráveis, não garantia de desempenho.
  const CITY_TEMPLATES = Object.freeze({
    attack_land: {
      title:'⚔️ Ataque terrestre', description:'Tropas terrestres ofensivas, quartel forte e academia.',
      buildings:{main:24,farm:40,storage:31,lumber:35,stoner:35,ironer:35,barracks:30,academy:30,docks:15,market:10,temple:10,wall:15},
      researches:['slinger','hoplite','rider'], units:{slinger:1000,hoplite:500,rider:200}
    },
    defense_land: {
      title:'🛡️ Defesa terrestre', description:'Foco em muralha, tropas defensivas e população.',
      buildings:{main:24,farm:45,storage:30,lumber:33,stoner:33,ironer:33,barracks:30,academy:25,docks:10,temple:10,wall:25},
      researches:['archer','hoplite'], units:{sword:700,archer:800,hoplite:450}
    },
    attack_naval: {
      title:'🚢 Ataque naval', description:'Navios ofensivos e transporte.',
      buildings:{main:24,farm:43,storage:30,lumber:35,stoner:35,ironer:35,barracks:10,academy:28,docks:30,market:12,temple:8,wall:12},
      researches:['attack_ship','small_transporter'], units:{attack_ship:150,small_transporter:25}
    },
    defense_naval: {
      title:'⚓ Defesa naval', description:'Biremes, defesa costeira e porto.',
      buildings:{main:24,farm:43,storage:30,lumber:35,stoner:35,ironer:35,barracks:10,academy:28,docks:30,market:10,temple:8,wall:20},
      researches:['bireme','trireme'], units:{bireme:180,trireme:25}
    },
    mythical: {
      title:'🐉 Criaturas míticas', description:'Templo e favor divino: selecione a criatura do deus da cidade.',
      buildings:{main:24,farm:42,storage:32,lumber:35,stoner:35,ironer:35,barracks:20,academy:25,docks:20,market:10,temple:25,wall:18},
      researches:[], units:{}
    },
    balanced: {
      title:'⚖️ Cidade equilibrada', description:'Economia, defesa e ataque moderados.',
      buildings:{main:24,farm:42,storage:30,lumber:35,stoner:35,ironer:35,barracks:25,academy:28,docks:25,market:15,temple:20,wall:20},
      researches:['archer','hoplite','bireme'], units:{sword:300,archer:300,hoplite:200,bireme:60}
    },
    colony: {
      title:'🏛️ Colonização', description:'Porto, academia e navio de colonização.',
      buildings:{main:24,farm:42,storage:32,lumber:35,stoner:35,ironer:35,barracks:15,academy:28,docks:30,market:15,temple:10,wall:15},
      researches:['colonize_ship','attack_ship'], units:{colonize_ship:1,attack_ship:40,big_transporter:15}
    },
    economy: {
      title:'🌾 Economia / suporte', description:'Recursos, mercado, armazenamento e desenvolvimento.',
      buildings:{main:25,farm:42,storage:35,lumber:40,stoner:40,ironer:40,barracks:15,academy:25,docks:20,market:25,temple:20,wall:18},
      researches:['architecture','plow'], units:{}
    }
  });
  const TROOP_TEMPLATES = Object.freeze({
    land_attack: {title:'⚔️ Ataque terrestre',help:'Foco em dano terrestre e mobilidade.',units:{slinger:1200,rider:250,hoplite:500}},
    land_defense: {title:'🛡️ Defesa terrestre',help:'Segurar ataques e reforçar muralhas.',units:{sword:750,archer:850,hoplite:500}},
    sea_attack: {title:'🚢 Frota ofensiva',help:'Navios de ataque e transportes.',units:{attack_ship:160,small_transporter:20}},
    sea_defense: {title:'⚓ Frota defensiva',help:'Biremes com cobertura naval.',units:{bireme:180,trireme:20}},
    fast_attack: {title:'🐎 Ataque rápido',help:'Cavalaria e infantaria móvel.',units:{rider:500,harpy:0,slinger:200}},
    balanced: {title:'⚖️ Exército equilibrado',help:'Unidades de ataque, defesa e marinha.',units:{sword:350,archer:350,hoplite:250,slinger:400,bireme:50}},
    mythical: {title:'🐉 Exército mítico',help:'Escolha a criatura compatível com o deus da cidade.',units:{}}
  });
  const MYTH_GODS = Object.freeze({
    minotaur:'zeus',manticore:'zeus',cyclops:'poseidon',sea_monster:'poseidon',
    centaur:'athena',pegasus:'athena',harpy:'hera',medusa:'hera',
    cerberus:'hades',fury:'hades',griffin:'artemis',calydonian_boar:'artemis',
    siren:'aphrodite',satyr:'aphrodite',spartoi:'ares',ladon:'ares'
  });
  const BASE = {
    enabled: false, dryRun: true,
    modules: Object.fromEntries(Object.keys(MODULES).map(x => [x,false])),
    intervals: Object.fromEntries(Object.entries(MODULES).map(([x,p]) => [x,p[2]])),
    farm: {duration:10,captainBulk:false},
    build: {targets:{},priority:BUILDINGS.slice(),allowDemolition:false},
    finishFree: {maxRemainingSeconds:285},
    cityProfiles: {},
    recruit: {targets:{},maxBatch:35,minBatch:10,shipBatch:8,minShipBatch:3,mythicalBatch:2,minMythicalBatch:2,maxQueueSlots:2},
    research: {queue:{}},
    smartQueue: {items:[],maxBatch:35,mode:'intelligent',autoPrereqs:true},
    trade: {routes:[],minReserve:2500,maxFill:0.90,intelligent:false,minCargo:200,cooldownMinutes:5,pendingMinutes:15,maxGoals:8},
    ruralTrade: {wanted:'wood',minRatio:1,maxAmount:3000},
    ruralUpgrade: {unlock:false,upgrade:false,targetLevel:3},
    troopProfiles: {},
    quests: {rewardAction:'stash',onlySatisfied:true,autoObjectives:false,preferred:'wise',allowResourceCost:false,maxResourceCost:1500,allowTroopCost:false,maxTroopCost:50},
    banditRewards: {stashIfPossible:true},
    culture: {festival:false,triumph:false,theater:false},
    bootcamp: {homeTownId:0,stashRewards:true,useHero:true},
    cave: {minIron:15000,keepIron:5000},
    commands: {jobs:[]},
    alerts: {desktop:true,checkAll:true},
    dodge: {version:2,leadSeconds:60,returnAfterSeconds:15,waveGapSeconds:12,land:true,naval:true,targets:{}},
    attackTest: {delay:120,wave:0,mode:'preview'},
    sync: {role:'primary'},
    security: {notify:true,resumeAfterSeconds:5,pacingEnabled:true,minActionIntervalSeconds:15,maxActionsPerHour:100,postCaptchaCooldownMinutes:15},
    autoReload: {enabled:true,minutes:30,safeWindowSeconds:180},
    onboarding: {completed:false},
    ui: {x:null,y:90,tab:'COMEÇAR',collapsed:false}
  };
  const clone = v => JSON.parse(JSON.stringify(v));
  const merge = (a,b) => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return a;
    for (const [k,v] of Object.entries(b)) {
      if (['__proto__','constructor','prototype'].includes(k)) continue;
      if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) && v && typeof v === 'object' && !Array.isArray(v)) merge(a[k],v);
      else a[k] = v;
    }
    return a;
  };
  // Nunca reutilizar metas ou runtime de outra conta, mesmo no mesmo navegador.
  const currentPlayerId=()=>{
    const id=Number(W.Game?.player_id);
    return Number.isSafeInteger(id)&&id>0?id:0;
  };
  const currentScope=()=>`${location.host}:${currentPlayerId()||'unknown'}`;
  let scope=currentScope();
  let STORE = `grepopilot:config:${scope}`;
  let LOCK = `grepopilot:lock:${scope}`;
  let FIRED = `grepopilot:fired:${scope}`;
  let RUNTIME = `grepopilot:runtime:${scope}`;
  let DODGE_STORE = `grepopilot:dodge:${scope}`;
  let DODGE_LOCK = `grepopilot:dodge-lock:${scope}`;
  let TEST_STORE = `grepopilot:attacktest:${scope}`;
  const old = (() => {try {return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}})();
  const numOrFinite=(value,defaultValue)=>Number.isFinite(Number(value))?Number(value):defaultValue;
  const migrate = (cfg,raw={}) => {
    if(raw?.modules?.ruralUpgrade && raw?.ruralUpgrade?.unlock && raw?.modules?.ruralUnlock===undefined) cfg.modules.ruralUnlock=true;
    if(raw?.modules?.ruralUpgrade && raw?.ruralUpgrade?.upgrade===false) cfg.modules.ruralUpgrade=false;
    if(cfg?.ui?.tab==='MILITAR')cfg.ui.tab='TROPAS';
    if(cfg?.ui?.tab==='CONFIG')cfg.ui.tab='AJUSTES';
    if(cfg?.ui?.tab==='PRESENÇA')cfg.ui.tab='INÍCIO';
    if(raw&&Object.keys(raw).length>0&&Number(raw?.dodge?.version)!==2){
      // Atualiza valores legados projetados para uma janela de 1–5 s, insuficiente para a margem de chegada.
      if(numOrFinite(raw?.dodge?.leadSeconds,5)<=5)cfg.dodge.leadSeconds=60;
      if(numOrFinite(raw?.dodge?.returnAfterSeconds,1)<10)cfg.dodge.returnAfterSeconds=15;
      cfg.dodge.version=2;
    }
    if(raw?.attackTest?.delay===20&&raw?.dodge?.version!==2)cfg.attackTest.delay=120;
    delete cfg.presence;
    if(raw&&Object.keys(raw).length>0&&raw.onboarding===undefined)cfg.onboarding={completed:true};
    return cfg;
  };
  let config = migrate(merge(clone(BASE),old),old);
  let logs = [];
  let running = false;
  let nextRun = {};
  let booted = false;
  let seenAttacks = new Set();
  let rendered = false;
  const health={startedAt:Date.now(),lastHeartbeat:0,lastClientReadyAt:0,lastTickResult:'aguardando primeiro ciclo',mountErrors:0,lastMountError:'',lastRenderError:'',storageCache:null};
  function rescope(){
    const newScope=currentScope();
    if(newScope===scope)return;
    scope=newScope;STORE=`grepopilot:config:${scope}`;LOCK=`grepopilot:lock:${scope}`;FIRED=`grepopilot:fired:${scope}`;RUNTIME=`grepopilot:runtime:${scope}`;DODGE_STORE=`grepopilot:dodge:${scope}`;DODGE_LOCK=`grepopilot:dodge-lock:${scope}`;TEST_STORE=`grepopilot:attacktest:${scope}`;
    try{const raw=JSON.parse(localStorage.getItem(STORE)||'{}');config=migrate(merge(clone(BASE),raw),raw);}catch{config=clone(BASE);}
    nextRun={};seenAttacks=new Set();
    selectedCity='';
    log(`Conta/mundo detectado: ${scope}`);render();
  }
  const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cleanStr = text => String(text??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const num = (v,def=0) => Number.isFinite(Number(v)) ? Number(v) : def;
  const tName = t => t?.getName?.() || t?.name || `Cidade ${t?.id}`;
  const save = () => {
    if(!currentPlayerId()||scope!==currentScope())return;
    try{localStorage.setItem(STORE,JSON.stringify(config));}
    catch(e){health.lastMountError='Falha ao salvar configurações: '+e.message;console.error('[GrepoPilot] '+health.lastMountError);}
  };

  const syncRole=()=>config.sync?.role==='standby'?'standby':'primary';
  const syncExport=()=>{
    const cfg=clone(config);
    cfg.enabled=false;cfg.sync={role:'standby'};
    return JSON.stringify({format:'grepopilot-profile',schema:1,world:String(location.host),
      playerId:String(W.Game?.player_id||'unknown'),exportedAt:new Date().toISOString(),config:cfg},null,2);
  };
  function syncImport(text){
    if(typeof text!=='string'||text.length>1000000)throw Error('Perfil inválido ou grande demais (limite 1 MB)');
    let data;
    try{data=JSON.parse(text);}catch{throw Error('Cole um perfil JSON válido exportado do GrepoPilot');}
    if(data?.format!=='grepopilot-profile'||data?.schema!==1||!data?.config||typeof data.config!=='object'||Array.isArray(data.config))
      throw Error('Formato de perfil não reconhecido');
    if(data.world!==String(location.host)||String(data.playerId)!==String(W.Game?.player_id||'unknown'))
      throw Error('Perfil de outra conta ou mundo: abra a mesma conta e servidor do Grepolis');
    const imported=migrate(merge(clone(BASE),data.config),data.config);
    imported.enabled=false;
    imported.sync={role:'standby'};
    imported.ui={...imported.ui,tab:'AJUSTES',x:null,y:90,collapsed:false};
    config=imported;
    nextRun={};save();
    log('Perfil importado como PC SECUNDÁRIO, com automação pausada');
    return true;
  }

  // Modelo compartilhável sem IDs de cidades, ordens de ataque nem dados pessoais.

  const templateKeys=['farm','finishFree','recruit','smartQueue','trade',
    'ruralTrade','ruralUpgrade','quests','banditRewards','culture','cave',
    'alerts','security','autoReload','dodge'];
  const templateSettings=()=>{
    const output={
      modules:Object.fromEntries(Object.keys(MODULES).map(id=>[id,Boolean(config.modules?.[id])])),
      intervals:Object.fromEntries(Object.keys(MODULES).map(id=>[id,Number(config.intervals?.[id]??MODULES[id][2])]))
    };
    // Campos declarados no padrão: nenhum identificador pessoal pode entrar em um modelo público.
    for(const key of templateKeys){
      const allowed=Object.entries(BASE[key]||{}).filter(([,value])=>['number','string','boolean'].includes(typeof value));
      output[key]=Object.fromEntries(allowed.map(([sub,defaultValue])=>{
        const value=config[key]?.[sub];
        return [sub,typeof value===typeof defaultValue?value:defaultValue];
      }));
    }
    return output;
  };
  const templatePayload=()=>({
    format:'grepopilot-template',schema:1,version:'0.9.4',
    exportedAt:new Date().toISOString(),settings:templateSettings()
  });
  const templateExport=()=>JSON.stringify(templatePayload(),null,2);
  function templateImport(rawText){
    if(typeof rawText!=='string'||rawText.length>1000000)throw Error('Modelo muito grande ou inválido');
    let source;
    try{source=JSON.parse(rawText);}catch{throw Error('O modelo não é um JSON válido');}
    if(source?.format!=='grepopilot-template'||source?.schema!==1||
      !source.settings||typeof source.settings!=='object'||Array.isArray(source.settings))
      throw Error('Formato incorreto: use Exportar modelo para jogadores');
    if(!currentPlayerId()||scope!==currentScope())throw Error('Abra sua conta no Grepolis antes de importar');
    const incoming=source.settings;
    const safe={};
    const allowed=['modules','intervals','farm','finishFree','smartQueue','recruit','trade',
      'ruralTrade','ruralUpgrade','quests','banditRewards','culture','cave',
      'alerts','security','autoReload','dodge'];
    const clean=templatePayload().settings;
    for(const key of allowed){
      if(!incoming[key]||typeof incoming[key]!=='object'||Array.isArray(incoming[key]))continue;
      // Escolhe somente campos permitidos na estrutura padrão, descartando rotas e identificadores pessoais.
      const filtered={};
      for(const sub of Object.keys(clean[key]||{})){
        if(!Object.prototype.hasOwnProperty.call(incoming[key],sub))continue;
        const value=incoming[key][sub];
        const expected=clean[key][sub];
        if(typeof value===typeof expected&&
          (typeof value!=='number'||Number.isFinite(value)))filtered[sub]=value;
      }
      safe[key]=filtered;
    }
    // Configurações existentes de cidades continuam exclusivas do jogador que importa.
    merge(config,safe);
    config.enabled=false;
    config.dryRun=true;
    config.onboarding={completed:true};
    config.ui.tab='VERIFICAR';
    nextRun={};save();
    log('Modelo público importado: metas e cidades pessoais foram mantidas; execução em simulação');
    return true;
  }
  const onboardingContent=()=>{
    const id=currentPlayerId(),ready=connected(),n=towns().length;
    return `${section('Bem-vindo ao GrepoPilot')}
      <div class="helpbox"><b>${ready?'✅ Conta detectada: jogador #'+id:'⏳ Aguardando o Grepolis carregar sua conta'}</b>
        <p class="smallnote">Servidor: ${cleanStr(location.host)} · ${n} cidade(s) detectada(s).
        Cada jogador recebe um perfil separado. As funções começam desligadas e em modo simulação.</p></div>
      ${section('Primeiros passos')}
      <div class="city"><b>1. Confirme sua conta</b><div class="smallnote">Abra VERIFICAR para confirmar que o cliente, suas cidades e o armazenamento estão disponíveis.</div></div>
      <div class="city"><b>2. Escolha os módulos</b><div class="smallnote">Configure apenas as cidades, construções e tropas da sua própria conta.</div></div>
      <div class="city"><b>3. Faça uma simulação</b><div class="smallnote">O modo simulação permite acompanhar decisões sem enviar comandos ao jogo.</div></div>
      <div class="tools"><button data-tab="VERIFICAR">Verificar minha conta</button>
        <button class="primary" data-action="onboardingDemo" ${ready?'':'disabled'}>Testar Auto Farm em simulação</button>
        <button data-action="onboardingFinish" ${ready?'':'disabled'}>Configurar manualmente</button></div>
      ${section('Compartilhar configurações com amigos')}
      <p class="smallnote">Um modelo público compartilha somente opções gerais. Nunca copia IDs de cidades, metas específicas, rotas, comandos ou informações de outro jogador.</p>
      <div class="tools"><button data-action="templateExport">Exportar modelo .json</button></div>
      <textarea id="templateImportText" style="height:100px" spellcheck="false" placeholder="Cole aqui um modelo público GrepoPilot"></textarea>
      <div class="tools"><button data-action="templateImport" ${ready?'':'disabled'}>Importar modelo público</button></div>`;
  };
  const syncPanel=()=>`
    ${section('Perfil entre computadores')}
    <div class="helpbox">Transfira metas, rotas e preferências entre computadores por <b>código JSON ou arquivo</b>. Sem servidor de sincronização a transferência é manual. O PC que recebe o perfil entra em modo <b>secundário (pausado)</b>.</div>
    <div class="formrow"><span>Papel deste computador</span><select data-setting="sync.role">${optionList([['primary','Principal · pode executar'],['standby','Secundário · sem automação']],syncRole())}</select></div>
    <p class="smallnote">Conta ${cleanStr(W.Game?.player_id||'?')} · mundo ${cleanStr(location.host)}. Para trocar de PC, pause o anterior antes de ativar este: não existe bloqueio de execução entre redes distintas sem servidor compartilhado.</p>
    <div class="tools"><button data-action="syncCopy">Copiar perfil</button><button data-action="syncDownload">Baixar perfil .json</button></div>
    <textarea id="syncImportText" spellcheck="false" style="height:95px" placeholder="Cole aqui o perfil JSON copiado do outro PC"></textarea>
    <div class="formrow"><span>Ou escolha o arquivo .json</span><input type="file" id="syncImportFile" accept=".json,application/json" style="max-width:210px"></div>
    <div class="tools"><button class="primary" data-action="syncApply">Importar código neste PC</button><button data-action="syncApplyFile">Importar arquivo .json</button></div>
    <p class="smallnote">Importar substitui metas, rotas e preferências locais, mas sempre pausa a execução. Não transfere logs, comandos em trânsito nem bloqueios de sessão.</p>`;
  const log = (message,level='INFO') => {
    const stamp = new Date().toLocaleTimeString('pt-BR');
    logs.unshift({stamp,level,message:String(message)});
    logs = logs.slice(0,150);
    if (level === 'ERROR') console.error(`[${SCRIPT}] ${message}`);
    else console.info(`[${SCRIPT}] ${message}`);
    if (config.ui.tab === 'LOG') render();
  };
  const delay = ms => new Promise(r=>setTimeout(r,ms));
  const connected = () => Boolean(currentPlayerId() && W.ITowns?.towns && typeof W.MM?.getModels==='function' && typeof W.MM?.getOnlyCollectionByName==='function' && typeof W.gpAjax?.ajaxPost==='function');
  const towns = () => connected()? Object.values(W.ITowns.towns).filter(t=>t && t.id): [];
  const townBy = id => W.ITowns?.towns?.[id] || W.ITowns?.getTown?.(id);
  const models = key => {
    try {return W.MM.getOnlyCollectionByName(key)?.models || []} catch {return []}
  };
  const resource = t => t?.resources?.() || {};

  // Limites conservadores para ações de rotina. Não tenta resolver nem contornar verificações.
  const pacingConfig=()=>({
    enabled:config.security?.pacingEnabled!==false,
    intervalMs:Math.max(5,Math.min(120,num(config.security?.minActionIntervalSeconds,15)))*1000,
    hourLimit:Math.max(10,Math.min(300,Math.floor(num(config.security?.maxActionsPerHour,100)))),
    afterCaptchaMs:Math.max(0,Math.min(120,num(config.security?.postCaptchaCooldownMinutes,15)))*60000
  });
  function pacingInfo(now=Date.now()){
    const rt=readRuntime(),p=rt.requestPacing||{},lim=pacingConfig();
    const attempts=(Array.isArray(p.attempts)?p.attempts:[])
      .filter(ts=>Number.isFinite(Number(ts))&&Number(ts)<=now&&now-Number(ts)<3600000)
      .map(Number).sort((a,b)=>a-b);
    const last=Number(p.lastAt)||0,until=Number(p.cooldownUntil)||0;
    const intervalRemaining=Math.max(0,last+lim.intervalMs-now);
    const volumeRemaining=attempts.length>=lim.hourLimit?
      Math.max(0,attempts[attempts.length-lim.hourLimit]+3600000-now):0;
    const cooldownRemaining=Math.max(0,until-now);
    return {enabled:lim.enabled,intervalMs:lim.intervalMs,hourLimit:lim.hourLimit,
      attempts:attempts.length,remainingMs:lim.enabled?Math.max(intervalRemaining,volumeRemaining,cooldownRemaining):0,
      cooldownUntil:until,lastAt:last};
  }
  function pacingRecord(now=Date.now()){
    const rt=readRuntime(),p=rt.requestPacing||{};
    const recent=(Array.isArray(p.attempts)?p.attempts:[]).filter(ts=>
      Number.isFinite(Number(ts))&&now-Number(ts)>=0&&now-Number(ts)<3600000);
    recent.push(now);
    rt.requestPacing={...p,attempts:recent.slice(-600),lastAt:now};
    writeRuntime(rt);
  }
  function pacingCoolDown(minutes,now=Date.now()){
    const rt=readRuntime(),p=rt.requestPacing||{};
    rt.requestPacing={...p,cooldownUntil:Math.max(Number(p.cooldownUntil)||0,
      now+Math.max(0,Number(minutes)||0)*60000)};
    writeRuntime(rt);
  }
  const actionIsTimeCritical=(controller,method)=>(
    controller==='command_info'&&method==='cancel_command'||
    controller==='town_info'&&method==='send_units'
  );
  function pacingWaitError(waitMs){
    const error=new Error('Ritmo de solicitações: ação de rotina aguardando '+Math.ceil(waitMs/1000)+' segundos');
    error.code='GP_PACING';error.waitMs=waitMs;
    return error;
  }
  let inFlightActions=0;
  const action = async (controller,method,data,forceLive=false) => {
    if(!currentPlayerId()||scope!==currentScope())throw Error('Conta/mundo em transição: ação bloqueada');
    if(securityWatch())throw new Error('CAPTCHA ativo: comando suspenso até a verificação ser resolvida');
    if (config.dryRun && !forceLive) {log(`SIMULACAO ${controller}/${method} ${JSON.stringify(data).slice(0,160)}`);return {dryRun:true};}
    if (!connected()) throw new Error('Cliente Grepolis indisponível.');
    const urgent=actionIsTimeCritical(controller,method),pace=pacingInfo();
    if(pace.enabled&&!urgent&&pace.remainingMs>0)throw pacingWaitError(pace.remainingMs);
    if(pace.enabled)pacingRecord();
    inFlightActions++;
    const requestScope=scope;
    return new Promise((resolve,reject) => {
      let done=false;
      const timeout=setTimeout(()=>{if(!done){done=true;reject(new Error(`Resposta não confirmada: ${controller}/${method}`));}},13000);
      try {
        W.gpAjax.ajaxPost(controller,method,data,false,response=>{
          if(done) return;
          done=true;clearTimeout(timeout);
          if(scope!==requestScope||currentScope()!==requestScope)
            return reject(new Error('Conta mudou durante a solicitação; resposta antiga descartada'));
          if(response?.success===false || response?.json?.success===false || response?.error || response?.json?.error){
            const reason=JSON.stringify(response?.json?.error || response?.error || 'Falha reportada pelo jogo');
            if(/(?:too many requests|rate.limi(?:t|ted)|\b429\b|too frequent)/i.test(reason)){
              try{pacingCoolDown(20);}catch{}
              log('Grepolis sinalizou excesso de requisições: ações de rotina pausadas por 20 minutos','WARN');
            }
            return reject(new Error(reason));
          }
          resolve(response);
        });
      } catch(e){if(!done){done=true;clearTimeout(timeout);reject(e)}}
    }).finally(()=>{inFlightActions=Math.max(0,inFlightActions-1);});
  };
  const bridge = async (townId,modelUrl,actionName,args) => action('frontend_bridge','execute',{
    model_url:modelUrl,action_name:actionName,arguments:args,town_id:Number(townId)
  });
  const readRuntime=()=>{try{return JSON.parse(localStorage.getItem(RUNTIME)||'{}')}catch{return {}}};
  const writeRuntime=o=>localStorage.setItem(RUNTIME,JSON.stringify(o));
  const godOf=t=>{
    if(!t)return '';
    const info=typeof t.god==='function'?t.god():t.god;
    const other=typeof t.getGod==='function'?t.getGod():null;
    return String(info?.id||info?.attributes?.god_id||info?.attributes?.id||info||other?.id||other||t.getGodId?.()||t.attributes?.god||t.attributes?.god_id||'').toLowerCase();
  };
  const isMythical=(key,def)=>Boolean(def?.is_mythical||def?.is_mythic||def?.god_id||def?.god||MYTH_GODS[key]);
  const mythUnits=t=>Object.entries(W.GameData?.units||{}).filter(([k,def])=>{
    if(!isMythical(k,def))return false;
    const god=String(def?.god_id||def?.god||MYTH_GODS[k]||'').toLowerCase();
    return Boolean(god) && (!godOf(t)||god===godOf(t));
  }).map(([k])=>k);
  const templateDetails=(name,t,mythUnit='')=>{
    const raw=CITY_TEMPLATES[name];if(!raw||!t)throw new Error('Modelo ou cidade inválidos');
    const buildings={};
    for(const [k,v] of Object.entries(raw.buildings)) {
      const cap=W.GameData?.buildings?.[k]?.max_level;
      buildings[k]=Number.isFinite(Number(cap))&&Number(cap)>0?Math.min(v,Number(cap)):v;
    }
    const researches=raw.researches.filter(k=>Boolean(W.GameData?.researches?.[k]));
    const units=Object.fromEntries(Object.entries(raw.units).filter(([k])=>Boolean(W.GameData?.units?.[k])));
    if(name==='mythical'){
      const possible=mythUnits(t);
      if(!mythUnit||!possible.includes(mythUnit))throw new Error('Selecione uma criatura do deus atual da cidade; o jogo deve informar a divindade.');
      units[mythUnit]=10;
    }
    return {buildings,researches,units};
  };
  const troopTemplateDetails=(key,t,mythUnit='')=>{
    const profile=TROOP_TEMPLATES[key];if(!profile||!t)throw new Error('Modelo de tropas ou cidade inválido');
    const units=Object.fromEntries(Object.entries(profile.units).filter(([u,n])=>n>0&&Boolean(W.GameData?.units?.[u])));
    if(key==='mythical'){
      if(!mythUnit || !mythUnits(t).includes(mythUnit))throw new Error('Selecione uma criatura compatível com o deus da cidade');
      units[mythUnit]=10;
    }
    if(!Object.keys(units).length)throw new Error('Nenhuma tropa desse modelo está disponível neste mundo');
    return units;
  };
  const availableRes=(t,cost,pad=0) => {
    const res=resource(t);
    return ['wood','stone','iron'].every(k=>num(res[k])>=num(cost?.[k])+pad);
  };
  const eligibleTown = t => t && !t.attributes?.on_small_island;

  const securityState={active:false,since:0,clearSince:0,lastCheck:0,source:''};
  // Somente detecção de verificação visível; nenhum CAPTCHA é resolvido ou contornado.
  const securitySelectors=[
    'iframe[src*="captcha"]','iframe[src*="recaptcha"]','iframe[src*="hcaptcha"]',
    'iframe[src*="arkoselabs"]','.captcha_container','.recaptcha-wrapper',
    '.g-recaptcha','.h-captcha','#captcha',
    '[id*="captcha"]','[class*="captcha"]'
  ];
  function securityVisible(node){
    if(!node||node.closest?.('#grepopilot-host'))return false;
    if(node.hidden||node.getAttribute?.('aria-hidden')==='true')return false;
    try{
      if(node.getClientRects?.().length===0)return false;
      if(typeof window.getComputedStyle==='function'){
        const css=window.getComputedStyle(node);
        if(css?.display==='none'||css?.visibility==='hidden'||css?.visibility==='collapse')return false;
      }
    }catch{return false;}
    return true;
  }
  function securityProbe(){
    if(typeof document.querySelectorAll!=='function')return '';
    for(const selector of securitySelectors){
      let nodes;
      try{nodes=document.querySelectorAll(selector);}catch{continue;}
      for(const node of nodes)if(securityVisible(node))return selector;
    }
    return '';
  }
  function securityWatch(){
    const now=Date.now(),source=securityProbe();
    securityState.lastCheck=now;
    if(source){
      securityState.clearSince=0;
      if(!securityState.active){
        securityState.active=true;securityState.since=now;securityState.source=source;
        log('Verificação CAPTCHA detectada: automações temporariamente suspensas','WARN');
        // Impede que um teste prático continue usando horários vencidos após a verificação.
        try{
          const activeTest=testRead().active;
          if(activeTest?.state==='active'&&activeTest.mode==='live'){
            testStop();
            log('CAPTCHA: teste prático interrompido; apoios identificados serão cancelados quando o jogo permitir','WARN');
          }
        }catch(e){log('CAPTCHA: não foi possível interromper o teste: '+e.message,'WARN');}
        if(config.security?.notify!==false)notify('CAPTCHA no Grepolis: resolva a verificação na página para retomar o GrepoPilot');
        if(shadow)render();
      }
      return true;
    }
    if(!securityState.active)return false;
    if(!securityState.clearSince)securityState.clearSince=now;
    const delay=Math.max(1,Math.min(30,num(config.security?.resumeAfterSeconds,5)))*1000;
    if(now-securityState.clearSince<delay)return true;
    securityState.active=false;securityState.since=0;securityState.clearSince=0;securityState.source='';
    if(pacingConfig().enabled&&pacingConfig().afterCaptchaMs>0){
      pacingCoolDown(pacingConfig().afterCaptchaMs/60000);
      log('CAPTCHA concluído: ações de rotina aguardam '+pacingConfig().afterCaptchaMs/60000+' minuto(s) antes de retomar','WARN');
    }
    log('Verificação não está mais visível: operações liberadas novamente');
    nextRun={};
    if(config.security?.notify!==false)notify('Verificação concluída: GrepoPilot pode retomar as rotinas habilitadas');
    if(shadow)render();
    return false;
  }
  const securityBlocked=()=>securityState.active;
  const canRun = () => config.enabled && syncRole()==='primary' && connected() && scope===currentScope() && !securityWatch();
  const notify = text => {
    log(text,'ALERT');
    if(config.alerts.desktop && 'Notification' in window && Notification.permission==='granted') new Notification('GrepoPilot',{body:text});
  };

  // A cidade só pausa a coleta quando os três recursos atingirem a capacidade.
  // Com qualquer recurso abaixo dela, volta a ser elegível no próximo ciclo.
  const farmStorageState=t=>{
    const r=resource(t);
    const direct=Number(r.storage);
    let cap=Number.isFinite(direct)&&direct>0?direct:NaN;
    if(!Number.isFinite(cap)){
      const getter=['getStorage','getStorageCapacity','getResourceStorage'].find(name=>typeof t?.[name]==='function');
      if(getter){const value=Number(t[getter]());if(Number.isFinite(value)&&value>0)cap=value;}
    }
    const amounts=Object.fromEntries(['wood','stone','iron'].map(k=>[k,Number(r[k])]));
    const known=Number.isFinite(cap)&&cap>0&&Object.values(amounts).every(v=>Number.isFinite(v)&&v>=0);
    const full=known&&['wood','stone','iron'].every(k=>amounts[k]>=cap);
    return {known,full,cap,amounts};
  };
  const farmLastFull=new Map();
  const farmWarnedUnknown=new Set();
  const farmEligibleCities=()=>{
    const active=[];
    for(const t of towns().filter(eligibleTown)){
      const state=farmStorageState(t),id=String(t.id);
      if(!state.known){
        if(!farmWarnedUnknown.has(id)){
          farmWarnedUnknown.add(id);
          log(`Auto farm: capacidade de armazenamento indisponível em ${tName(t)}; coleta aguardando dados`,'WARN');
        }
        continue;
      }
      farmWarnedUnknown.delete(id);
      const prior=farmLastFull.get(id);
      if(prior!==state.full){
        farmLastFull.set(id,state.full);
        if(state.full)log(`Auto farm: ${tName(t)} pausada — madeira, pedra e ferro cheios (${state.cap} cada)`);
        else if(prior===true)log(`Auto farm: ${tName(t)} retomada — pelo menos um recurso deixou de estar cheio`);
      }
      if(!state.full)active.push(t);
    }
    return active;
  };
  async function farm(){
    const active=farmEligibleCities();
    if(!active.length) return false;
    const time=Math.max(5,num(config.farm.duration,10));
    if(config.farm.captainBulk && W.GameDataPremium?.isAdvisorActivated?.('captain')){
      await action('farm_town_overviews','claim_loads_multiple',{
        towns:active.map(t=>t.id),time_option_base:time>10?1200:300,time_option_booty:time>10?2400:600,claim_factor:'normal'
      });
      log(`Coleta geral solicitada (${active.length} cidades)`); return true;
    }
    const rs=models('FarmTownPlayerRelation'), fs=models('FarmTown');
    const now=Math.floor(Date.now()/1000);
    for(const t of active) for(const f of fs){
      if(f.attributes?.island_x!==t.getIslandCoordinateX?.() || f.attributes?.island_y!==t.getIslandCoordinateY?.()) continue;
      const relation=rs.find(r=>r.attributes?.farm_town_id===f.attributes?.id && r.attributes?.relation_status===1);
      if(!relation) continue;
      if(num(relation.attributes?.lootable_at)>now) continue;
      await bridge(t.id,`FarmTownPlayerRelation/${relation.id}`,'claim',{
        farm_town_id:f.attributes.id,type:'resources',option:time>=20?2:1
      });
      log(`${tName(t)}: coleta em ${f.attributes?.name||f.attributes?.id}`);
      return true;
    }
    return false;
  }
  // Ativa o buyInstant APENAS com folga dentro da janela gratuita (<5 min).
  // Tenta somente o primeiro pedido de cada fila e nunca compra antecipações de tropas.
  async function finishFree(){
    const now=Date.now();const runtime=readRuntime();
    for(const t of towns()){
      const orders=t.buildingOrders?.()?.models||[];
      const o=orders[0];if(!o)continue;
      const orderId=Number(o.id||o.attributes?.id);
      if(!Number.isSafeInteger(orderId)||orderId<1)continue;
      let remaining=Number(o.getTimeLeft?.());
      if(typeof o.getTimeLeft!=='function'){
        const end=Number(o.attributes?.to_be_completed_at);
        if(!end)continue;
        remaining=end-now/1000;
      }
      const safeLimit=Math.min(285,Math.max(1,num(config.finishFree.maxRemainingSeconds,285)));
      if(!Number.isFinite(remaining)||remaining<=2||remaining>safeLimit)continue;
      const marker=`${t.id}:${orderId}`;
      if(runtime.lastFreeAttempt?.[marker] && now-runtime.lastFreeAttempt[marker]<60000)continue;
      if(!config.dryRun){
        runtime.lastFreeAttempt=runtime.lastFreeAttempt||{};
        runtime.lastFreeAttempt[marker]=now;
        runtime.lastFreeAttempt=Object.fromEntries(Object.entries(runtime.lastFreeAttempt).filter(([,ts])=>now-ts<3600000));
        writeRuntime(runtime);
      }
      await bridge(t.id,`BuildingOrder/${orderId}`,'buyInstant',{order_id:orderId});
      log(`${tName(t)}: ${config.dryRun?'SIMULAÇÃO ':''}conclusão grátis da ordem ${orderId} (${Math.ceil(remaining)}s restantes)`);
      return true;
    }
    return false;
  }
const queueManagesTown=id=>Boolean(config.modules.smartQueue && config.smartQueue.items?.some(j=>String(j.townId)===String(id)));
  const queueCost = raw=>{
    if(!raw || typeof raw!=='object' || !['wood','stone','iron'].some(k=>Object.prototype.hasOwnProperty.call(raw,k)))return null;
    const out={};
    for(const k of ['wood','stone','iron']){
      const n=Number(raw[k]??0);
      if(!Number.isFinite(n)||n<0)return null;
      out[k]=Math.ceil(n);
    }
    return out;
  };
  const queueSum = cost=>cost?cost.wood+cost.stone+cost.iron:Infinity;
  const queueMoney = cost=>cost?`${Math.floor(cost.wood)} madeira · ${Math.floor(cost.stone)} pedra · ${Math.floor(cost.iron)} ferro`:'Custo indisponível';
  const queueJobs=()=>Array.isArray(config.smartQueue.items)?config.smartQueue.items:[];
  const queueName = j=>{
    const town=townBy(j.townId);
    const kind={building:'Construção',troop:'Tropa',ship:'Navio',research:'Pesquisa'}[j.kind]||j.kind;
    return `${kind} · ${j.key}${j.kind==='research'?'':` → ${j.target}`} · ${tName(town)}`;
  };
function policyForUnit(key,def){
 const rc=config.recruit||{}, naval=!!def.is_naval, mythical=isMythical(key,def);
 const full=Math.max(1,Math.floor(num(mythical?rc.mythicalBatch:naval?rc.shipBatch:rc.maxBatch,mythical?2:naval?8:35)));
 const minimum=Math.max(1,Math.floor(num(mythical?rc.minMythicalBatch:naval?rc.minShipBatch:rc.minBatch,mythical?1:naval?3:10)));
 const maxSlots=Math.max(1,Math.min(6,Math.floor(num(rc.maxQueueSlots,2))));
 return {full,minimum:Math.min(minimum,full),maxSlots,naval,mythical};
}
  function planRecruitBatch(t,key,goal,extraMax=0){
 const result=(state,reason,cost=null,amount=0)=>({state,reason,cost,amount});
 const def=W.GameData?.units?.[key];
 if(!def)return result('blocked','Unidade indisponível');
 const policy=policyForUnit(key,def);
 const building=t.buildings?.()?.attributes?.[policy.naval?'docks':'barracks'];
 if(num(building)<1)return result('wait',policy.naval?'Aguardando porto':'Aguardando quartel');
 if(policy.mythical){
   const expectedGod=String(def.god_id||def.god||MYTH_GODS[key]||'').toLowerCase();
   if(expectedGod&&godOf(t)&&expectedGod!==godOf(t))return result('blocked','Unidade de outra divindade');
 }
 const orders=t.getUnitOrdersCollection?.()?.models||[];
 const laneOrders=orders.filter(o=>{
   const item=W.GameData?.units?.[o.attributes?.unit_type];
   return !item||!!item.is_naval===policy.naval;
 });
 const owned=Math.max(0,num(t.units?.()?.[key]))+Math.max(0,num(t.unitsOuter?.()?.[key]));
 const queued=orders.reduce((sum,o)=>sum+(o.attributes?.unit_type===key?Math.max(0,num(o.attributes?.units_left??o.attributes?.count??o.attributes?.amount)):0),0);
 const missing=Math.max(0,Math.floor(num(goal))-owned-queued);
 if(!missing)return result(owned>=num(goal)?'done':'wait',owned>=num(goal)?'Meta atingida':'Tropas em treinamento');
 if(orders.length>=6||laneOrders.length>=policy.maxSlots)return result('wait','Limite de fila: '+laneOrders.length+'/'+policy.maxSlots+' espaços usados');
 const raw=queueCost(def.resources);
 if(!raw)return result('blocked','Custo por unidade indisponível');
 const multiplier=Number(W.GeneralModifications?.getUnitBuildResourcesModification?.(Number(t.id),def)??1);
 if(!Number.isFinite(multiplier)||multiplier<=0)return result('blocked','Modificador de custo inválido');
 const per=queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,raw[k]*multiplier])));
 if(!per)return result('blocked','Custo calculado indisponível');
 const res=resource(t),popCost=Math.max(1,num(def.population,1));
 const freePop=Math.max(0,num(t.getAvailablePopulation?.()??res.population,0));
 let canBuy=Math.floor(freePop/popCost),storageFit=Infinity;
 const storage=num(res.storage,0);
 if(storage>0)for(const k of ['wood','stone','iron'])if(per[k]>0)storageFit=Math.min(storageFit,Math.floor(storage/per[k]));
 for(const k of ['wood','stone','iron'])if(per[k]>0)canBuy=Math.min(canBuy,Math.floor(Math.max(0,num(res[k]))/per[k]));
 if(policy.mythical&&num(def.favor)>0){
   const favor=t.getCurrentFavor?.()??t.getFavor?.();
   if(favor===undefined||favor===null)return result('wait','Favor divino indisponível');
   canBuy=Math.min(canBuy,Math.floor(num(favor)/num(def.favor)));
 }
 const extraLimit=extraMax>0?Math.max(1,Math.floor(extraMax)):Infinity;
 const minimum=Math.max(1,Math.min(policy.minimum,extraLimit));
 if(storageFit<Math.min(minimum,missing))return result('wait','Armazém não comporta o lote mínimo de '+Math.min(minimum,missing));
 const ideal=Math.max(1,Math.min(policy.full,extraLimit,storageFit));
 const wanted=Math.min(missing,ideal);
 let amount=0;
 if(missing<minimum){
   if(laneOrders.length)return result('wait','Aguardando esvaziar fila para o lote final de '+missing);
   if(canBuy<missing)return result('wait','Aguardando recursos para lote final de '+missing);
   amount=missing;
 }else if(canBuy>=wanted){
   amount=wanted;
 }else if(canBuy>=minimum){
   amount=Math.floor(Math.min(canBuy,wanted)/minimum)*minimum;
 }else return result('wait','Aguardando lote mínimo de '+minimum+' unidade(s)');
 if(amount<1)return result('wait','Aguardando recursos suficientes');
 const cost=queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,per[k]*amount])));
 const rt=readRuntime(),lane=t.id+':'+(policy.naval?'mar':'terra');
 if(Date.now()-num(rt.recruitLanes?.[lane])<25000)return result('wait','Aguardando atualização da fila',cost);
 return result('ready','Lote '+amount+' '+key+' ('+laneOrders.length+'/'+policy.maxSlots+' espaços)',cost,amount);
}
  function markRecruitLane(t,def){
 if(config.dryRun)return;
 const r=readRuntime();r.recruitLanes??={};
 r.recruitLanes[t.id+':'+(def.is_naval?'mar':'terra')]=Date.now();
 r.recruitLanes=Object.fromEntries(Object.entries(r.recruitLanes).filter(([,time])=>Date.now()-num(time)<300000));
 writeRuntime(r);
}
  function queueAnalyze(j){
    const t=townBy(j.townId);
    const out=(state,why,cost=null,amount=0)=>({state,why,cost,amount,score:queueSum(cost),job:j,town:t});
    if(!t)return out('blocked','Cidade não encontrada');
    if(!j.key)return out('blocked','Selecione um item');
    const target=Math.max(1,Math.floor(num(j.target,1)));
    if(j.kind==='building'){
      const currentBuildings=t.buildings?.()?.attributes||{};
      if(!(j.key in currentBuildings))return out('blocked','Edifício não identificado');
      const orders=t.buildingOrders?.()?.models||[];
      const current=num(currentBuildings[j.key]);
      const same=orders.filter(o=>String(o.attributes?.building_type)===j.key);
      const planned=current+same.reduce((sum,o)=>sum+(o.attributes?.tear_down?-1:1),0);
      if(current>=target)return out('done',`Nível ${current} alcançado`);
      const cap=num(W.GameData?.buildings?.[j.key]?.max_level,0);
      if(cap>0&&current>=cap)return out('blocked',`Nível máximo ${cap} atingido`);
      if(planned>=target || same.length)return out('wait','Construção deste edifício em andamento');
      const capacity=W.GameDataPremium?.isAdvisorActivated?.('curator')?7:2;
      if(orders.length>=capacity)return out('wait','Fila de obras do jogo cheia');
      const data=W.MM?.getModels?.()?.BuildingBuildData?.[t.id]?.attributes?.building_data?.[j.key];
      for(const [name,required] of [...queueLevelDependencies(W.GameData?.buildings?.[j.key]?.requirements),...queueLevelDependencies(data?.requirements)]){
        if(num(currentBuildings[name])<required)return out('wait',`Requer ${name} nível ${required}`);
      }
      const cost=queueCost(data?.resources_for);
      if(!cost)return out('blocked','Custo da próxima obra não encontrado');
      if(num(t.getAvailablePopulation?.())<num(data.population_for))return out('wait','População insuficiente',cost);
      if(!availableRes(t,cost))return out('wait','Aguardando recursos',cost);
      return out('ready',`Construir nível ${current+1}`,cost,1);
    }
    if(j.kind==='troop'||j.kind==='ship'){
      const def=W.GameData?.units?.[j.key];
      if(!def)return out('blocked','Unidade não disponível neste mundo');
      if(!!def.is_naval!==(j.kind==='ship'))return out('blocked','Tipo de unidade incompatível');
      const current=t.buildings?.()?.attributes||{};
      for(const [name,required] of [...queueLevelDependencies(def.requirements),...queueLevelDependencies(def.required_buildings)]){
        if(num(current[name])<required)return out('wait',`Requer ${name} nível ${required}`);
      }
      const plan=planRecruitBatch(t,j.key,target,num(config.smartQueue.maxBatch,35));
      return out(plan.state,plan.reason,plan.cost,plan.amount);
    }
    if(j.kind==='research'){
      const def=W.GameData?.researches?.[j.key];
      if(!def)return out('blocked','Pesquisa não disponível neste mundo');
      if(t.researches?.()?.attributes?.[j.key])return out('done','Pesquisa concluída');
      const orders=t.getResearchOrdersCollection?.()?.models || t.researchOrders?.()?.models || [];
      if(orders.some(o=>String(o.attributes?.research_type||o.attributes?.research_id||o.attributes?.research)===j.key))return out('wait','Pesquisa em andamento');
      if(orders.length)return out('wait','Outra pesquisa em andamento');
      const academyReq=num(def.academy_level??def.building_level??def.building_lvl,0);
      if(academyReq && num(t.buildings?.()?.attributes?.academy)<academyReq)return out('wait',`Academia precisa do nível ${academyReq}`);
      const current=t.buildings?.()?.attributes||{};
      for(const [name,required] of [...queueLevelDependencies(def.requirements),...queueLevelDependencies(def.required_buildings)]){
        if(num(current[name])<required)return out('wait',`Requer ${name} nível ${required}`);
      }
      const pointsReq=num(def.research_points,0);
      if(pointsReq && typeof t.getAvailableResearchPoints==='function' && num(t.getAvailableResearchPoints())<pointsReq)return out('wait','Pontos de pesquisa insuficientes');
      const cost=queueCost(def.resources||def.costs);
      if(!cost)return out('blocked','Custo da pesquisa não identificado');
      if(!availableRes(t,cost))return out('wait','Aguardando recursos',cost);
      return out('ready','Iniciar pesquisa',cost,1);
    }
    return out('blocked','Tipo inválido');
  }

  const queueMode=()=>config.smartQueue.mode==='cheapest'?'cheapest':'intelligent';
  const queueUrgency=j=>['normal','high','urgent'].includes(j?.urgency)?j.urgency:'normal';
  const queueBuildingLevel=(t,key)=>Math.max(0,Math.floor(num(t.buildings?.()?.attributes?.[key])));
  const queuePlannedBuildingLevel=(t,key)=>{
    const orders=t.buildingOrders?.()?.models||[];
    return queueBuildingLevel(t,key)+orders.filter(o=>o.attributes?.building_type===key).reduce((n,o)=>n+(o.attributes?.tear_down?-1:1),0);
  };
  const queueLevelDependencies=raw=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return [];
    return Object.entries(raw).filter(([key,value])=>BUILDINGS.includes(key)&&Number.isFinite(Number(value))&&Number(value)>0)
      .map(([key,value])=>[key,Math.floor(Number(value))]);
  };
  function queueStructuralNeed(job,assessment){
    if(assessment.state==='done'||assessment.state==='ready'||!assessment.town)return null;
    const t=assessment.town;
    const snapshot=t.buildings?.()?.attributes||{};
    const needed=[];
    const requireLevel=(key,level,reason)=>{
      if(!BUILDINGS.includes(key)||!Number.isFinite(level)||level<=num(snapshot[key]))return;
      const cap=num(W.GameData?.buildings?.[key]?.max_level,0);
      if(cap>0&&num(snapshot[key])>=cap)return;
      // Do not queue the next level while an order for this building is still pending.
      if(queuePlannedBuildingLevel(t,key)>num(snapshot[key]))return;
      needed.push({key,target:num(snapshot[key])+1,reason});
    };
    const unit=W.GameData?.units?.[job.key],research=W.GameData?.researches?.[job.key];
    const def=job.kind==='building'?W.GameData?.buildings?.[job.key]:job.kind==='research'?research:unit;
    if(job.kind==='research'){
      const min=num(research?.academy_level??research?.building_level??research?.building_lvl,0);
      if(min>0)requireLevel('academy',min,'academia necessária para pesquisa');
      const points=num(research?.research_points,0);
      if(points>0&&typeof t.getAvailableResearchPoints==='function'&&num(t.getAvailableResearchPoints())<points){
        requireLevel('academy',Math.max(1,num(snapshot.academy)+1),'pontos de pesquisa insuficientes');
      }
    }
    if(job.kind==='ship'||job.kind==='troop'){
      if(!unit)return null;
      requireLevel(job.kind==='ship'?'docks':'barracks',1,'edifício militar necessário');
    }
    for(const entry of queueLevelDependencies(def?.requirements)){
      requireLevel(entry[0],entry[1],'pré-requisito conhecido do jogo');
    }
    for(const entry of queueLevelDependencies(def?.required_buildings)){
      requireLevel(entry[0],entry[1],'pré-requisito conhecido do jogo');
    }
    if(job.kind==='building'){
      const data=W.MM?.getModels?.()?.BuildingBuildData?.[t.id]?.attributes?.building_data?.[job.key];
      for(const entry of queueLevelDependencies(data?.requirements))requireLevel(entry[0],entry[1],'pré-requisito de construção');
    }
    const res=resource(t),cap=num(res.storage,0);
    const requireStorage=(cost)=>{
      if(cap<=0||!cost)return;
      if(['wood','stone','iron'].some(k=>num(cost[k])>cap)){
        requireLevel('storage',num(snapshot.storage)+1,'armazém não comporta o custo');
      }
    };
    if(job.kind==='building'){
      const d=W.MM?.getModels?.()?.BuildingBuildData?.[t.id]?.attributes?.building_data?.[job.key];
      requireStorage(queueCost(d?.resources_for));
      if(num(d?.population_for,0)>num(t.getAvailablePopulation?.()??res.population,0)){
        requireLevel('farm',num(snapshot.farm)+1,'população insuficiente para a obra');
      }
    }else if(job.kind==='research'){
      requireStorage(queueCost(research?.resources||research?.costs));
    }else if(unit){
      const policy=policyForUnit(job.key,unit);
      const min=Math.min(policy.minimum,Math.max(1,num(job.target)));
      const unitCost=queueCost(unit.resources);
      const modifier=Number(W.GeneralModifications?.getUnitBuildResourcesModification?.(Number(t.id),unit)??1);
      if(unitCost&&Number.isFinite(modifier)&&modifier>0){
        requireStorage(queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,unitCost[k]*modifier*min]))));
      }
      const free=num(t.getAvailablePopulation?.()??res.population,0);
      if(free<Math.max(1,num(unit.population,1))*min){
        requireLevel('farm',num(snapshot.farm)+1,'população insuficiente para recrutamento');
      }
    }
    return needed[0]||null;
  }
  function queueCandidates(){
    const rows=queueJobs().map((job,index)=>({...queueAnalyze(job),index,automatic:false,unlocks:0}));
    if(queueMode()==='intelligent'&&config.smartQueue.autoPrereqs!==false){
      const auto=new Map();
      for(const row of rows){
        const need=queueStructuralNeed(row.job,row);
        if(!need)continue;
        const key=String(row.job.townId)+':'+need.key;
        const existing=rows.find(other=>other.job.kind==='building'&&String(other.job.townId)===String(row.job.townId)
          &&other.job.key===need.key&&other.state==='ready');
        if(existing){
          existing.unlocks=(existing.unlocks||0)+1;
          continue;
        }
        if(!auto.has(key)){
          const job={id:'AUTO-'+key,townId:Number(row.job.townId),kind:'building',key:need.key,
            target:need.target,urgency:queueUrgency(row.job),automatic:true};
          const analysis=queueAnalyze(job);
          auto.set(key,{...analysis,index:rows.length+auto.size,automatic:true,unlocks:0,reasons:[]});
        }
        const candidate=auto.get(key);
        candidate.unlocks++;
        candidate.reasons.push(need.reason+' → '+queueName(row.job));
        const rank={normal:0,high:1,urgent:2};
        if(rank[queueUrgency(row.job)]>rank[queueUrgency(candidate.job)])candidate.job.urgency=queueUrgency(row.job);
      }
      rows.push(...auto.values());
    }
    const relevant=rows.filter(x=>x.state==='ready');
    for(const row of relevant){
      const cost=queueSum(row.cost);
      if(queueMode()==='cheapest'){row.rank=cost;row.benefit='menor custo';continue;}
      const j=row.job,t=row.town,r=resource(t);
      const importance={normal:0,high:2,urgent:5}[queueUrgency(j)];
      let bonus=importance+Math.min(12,(row.unlocks||0)*4);
      const used=Math.max(num(r.wood),num(r.stone),num(r.iron)),cap=num(r.storage,0);
      if(j.kind==='building'){
        if(j.key==='storage'&&cap>0&&used/cap>=0.85)bonus+=1.5;
        if(j.key==='farm'&&num(t.getAvailablePopulation?.()??r.population,0)<=10)bonus+=1.5;
        if(j.key==='main'&&queueJobs().some(k=>String(k.townId)===String(j.townId)&&k.kind==='building'))bonus+=0.4;
        if(['lumber','stoner','ironer'].includes(j.key)&&queueJobs().some(k=>String(k.townId)===String(j.townId)&&k.kind==='building'))bonus+=0.65;
      }
      row.rank=cost/(1+bonus);
      row.benefit=(row.unlocks?'desbloqueia '+row.unlocks+' meta(s) · ':'')+
         (importance?'urgência '+queueUrgency(j)+' · ':'')+'valor/custo';
    }
    relevant.sort((a,b)=>a.rank-b.rank||a.score-b.score||a.index-b.index);
    return {rows,ready:relevant,best:relevant[0]||null};
  }
  async function smartQueue(){
    const jobs=queueJobs();
    if(!jobs.length)return false;
    const rt=readRuntime();
    const now=Date.now();
    const plan=queueCandidates();
    const next=plan.ready.find(x=>now-num(rt.smartQueueAttempts?.[x.job.id])>=30000);
    if(!next)return false;
    const j=next.job, id=Number(j.townId), key=j.key;
    try{
      if(j.kind==='building')await bridge(id,'BuildingOrder','buildUp',{building_id:key});
      else if(j.kind==='research')await bridge(id,'ResearchOrder','research',{id:key});
      else {await action(j.kind==='ship'?'building_docks':'building_barracks','build',{unit_id:key,amount:next.amount,town_id:id});markRecruitLane(next.town,W.GameData.units[key]);}
      if(!config.dryRun){
        rt.smartQueueAttempts=rt.smartQueueAttempts||{};
        rt.smartQueueAttempts[j.id]=Date.now();
        rt.smartQueueAttempts=Object.fromEntries(Object.entries(rt.smartQueueAttempts).filter(([,time])=>Date.now()-num(time)<3600000));
        writeRuntime(rt);
      }
      log(`Fila ${queueMode()==='cheapest'?'menor custo':'inteligente'}: ${next.automatic?'PRÉ-REQUISITO · ':''}${queueName(j)} · ${next.why} · ${queueMoney(next.cost)} (total ${next.score}, prioridade ${Number(next.rank).toFixed(1)})`);
      return true;
    }catch(e){
      rt.smartQueueAttempts=rt.smartQueueAttempts||{};
      rt.smartQueueAttempts[j.id]=Date.now();
      if(!config.dryRun)writeRuntime(rt);
      log(`Fila econômica: ${queueName(j)} · ${e.message}`,'ERROR');
      return true;
    }
  }
  async function build(){
    for(const [id,targets] of Object.entries(config.build.targets)){
      const t=townBy(id); if(!t || !targets || !Object.keys(targets).length || queueManagesTown(id)) continue;
      const current={...(t.buildings?.()?.attributes||{})};
      const queued=t.buildingOrders?.()?.models || [];
      const full=W.GameDataPremium?.isAdvisorActivated?.('curator') ? 7 : 2;
      if(queued.length>=full) continue;
      for(const q of queued){const n=q.attributes?.building_type;if(n in current)current[n]+=q.attributes?.tear_down?-1:1;}
      for(const k of config.build.priority){
        if(!Object.prototype.hasOwnProperty.call(targets,k)) continue;
        const wanted=num(targets[k]);const lvl=num(current[k]);
        if(wanted===lvl) continue;
        if(wanted<lvl){
          if(!config.build.allowDemolition) continue;
          await bridge(id,'BuildingOrder','tearDown',{building_id:k});
          log(`${tName(t)}: demolir ${k}`);return true;
        }
        const data=W.MM.getModels?.()?.BuildingBuildData?.[id]?.attributes?.building_data?.[k];
        if(!data || !availableRes(t,data.resources_for,5) || num(t.getAvailablePopulation?.())<num(data.population_for)) continue;
        await bridge(id,'BuildingOrder','buildUp',{building_id:k});
        log(`${tName(t)}: construir ${k} ${lvl+1}`);return true;
      }
    }
    return false;
  }
  async function recruit(){
    const candidates=[];
    for(const [id,goals] of Object.entries(config.recruit.targets)){
      const t=townBy(id);if(!t||!goals||queueManagesTown(id))continue;
      for(const [unit,wanted] of Object.entries(goals)){
        const plan=planRecruitBatch(t,unit,wanted);
        if(plan.state==='ready')candidates.push({t,unit,plan});
      }
    }
    candidates.sort((a,b)=>queueSum(a.plan.cost)-queueSum(b.plan.cost));
    const best=candidates[0];if(!best)return false;
    const def=W.GameData.units[best.unit];
    await action(def.is_naval?'building_docks':'building_barracks','build',{
      unit_id:best.unit,amount:best.plan.amount,town_id:Number(best.t.id)
    });
    markRecruitLane(best.t,def);
    log(tName(best.t)+': recrutar '+best.plan.amount+' '+best.unit+' · '+best.plan.reason);
    return true;
  }
  async function research(){
    for(const [id,list] of Object.entries(config.research.queue)){
      const t=townBy(id);if(!t || !Array.isArray(list) || queueManagesTown(id))continue;
      const done=t.researches?.()?.attributes||{};
      for(const key of list){
        if(done[key] || !W.GameData?.researches?.[key])continue;
        const def=W.GameData.researches[key];
        if(!availableRes(t,def.resources||{}))continue;
        await bridge(id,'ResearchOrder','research',{id:key});
        log(`${tName(t)}: pesquisar ${key}`);return true;
      }
    }
    return false;
  }

  // Necessidades reais da cidade: custo da próxima obra, pesquisa ou lote de tropas.
  const tradeCostsForGoal=(t,j)=>{
    if(j.kind==='building'){
      if(t.buildingOrders?.()?.models?.some(o=>String(o.attributes?.building_type)===String(j.key)))return null;
      const level=num(t.buildings?.()?.attributes?.[j.key],0);
      if(level>=num(j.target,1))return null;
      return queueCost(W.MM?.getModels?.()?.BuildingBuildData?.[t.id]?.attributes?.building_data?.[j.key]?.resources_for);
    }
    if(j.kind==='research'){
      if(t.getResearchOrdersCollection?.()?.models?.some(o=>String(o.attributes?.research_type??o.attributes?.research_id)===String(j.key)))return null;
      if(t.researches?.()?.attributes?.[j.key])return null;
      const def=W.GameData?.researches?.[j.key];
      return queueCost(def?.resources||def?.costs);
    }
    if(j.kind==='troop'||j.kind==='ship'){
      const def=W.GameData?.units?.[j.key];
      if(!def)return null;
      const own=num(t.units?.()?.[j.key])+num(t.unitsOuter?.()?.[j.key]);
      const orders=t.getUnitOrdersCollection?.()?.models||[];
      const queued=orders.reduce((n,o)=>n+(o.attributes?.unit_type===j.key?num(o.attributes?.units_left??o.attributes?.count??o.attributes?.amount):0),0);
      const remaining=Math.max(0,Math.floor(num(j.target)-own-queued));
      if(!remaining)return null;
      const pol=policyForUnit(j.key,def);
      const qty=Math.min(remaining,Math.max(1,Math.min(pol.minimum,num(config.smartQueue.maxBatch,35))));
      const mul=Number(W.GeneralModifications?.getUnitBuildResourcesModification?.(Number(t.id),def)??1);
      if(!Number.isFinite(mul)||mul<=0)return null;
      const cost=queueCost(def.resources);
      return cost?queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,cost[k]*mul*qty]))):null;
    }
    return null;
  };
  function tradeDemandForTown(t){
    const candidates=[],id=Number(t.id);
    if(config.modules.smartQueue&&queueJobs().some(j=>Number(j.townId)===id)){
      const plan=queueCandidates();
      for(const row of plan.rows.filter(x=>Number(x.job.townId)===id)){
        if(row.state==='done'||row.state==='blocked')continue;
        if(row.state==='wait'&&/fila|andamento|atualiza|pesquisa em andamento|Aguardando quartel|Aguardando porto/i.test(row.why))continue;
        const cost=tradeCostsForGoal(t,row.job);
        if(cost)candidates.push({cost,weight:{normal:1,high:3,urgent:6}[queueUrgency(row.job)]||1,task:queueName(row.job)});
      }
    }else{
      for(const [key,target] of Object.entries(config.build.targets?.[id]||{})){
        const cost=tradeCostsForGoal(t,{townId:id,kind:'building',key,target});
        if(cost)candidates.push({cost,weight:2,task:key});
      }
      for(const key of config.research.queue?.[id]||[]){
        const cost=tradeCostsForGoal(t,{townId:id,kind:'research',key,target:1});
        if(cost)candidates.push({cost,weight:1,task:key});
      }
      for(const [key,target] of Object.entries(config.recruit.targets?.[id]||{})){
        const def=W.GameData?.units?.[key];
        const cost=tradeCostsForGoal(t,{townId:id,kind:def?.is_naval?'ship':'troop',key,target});
        if(cost)candidates.push({cost,weight:1,task:key});
      }
    }
    const current=resource(t),res={wood:0,stone:0,iron:0};
    const ordered=candidates.sort((a,b)=>b.weight-a.weight);
    for(const c of ordered.slice(0,Math.max(1,Math.min(20,num(config.trade.maxGoals,8))))){
      for(const k of ['wood','stone','iron']){
        res[k]=Math.max(res[k],Math.ceil(c.cost[k]-num(current[k])));
      }
    }
    return {needs:Object.fromEntries(Object.entries(res).map(([k,v])=>[k,Math.max(0,v)])),goals:ordered};
  }

  // Impede que o comércio inteligente consuma o orçamento das metas da origem.
  function tradeSourceReserves(t){
    const base=Math.max(0,num(config.trade.minReserve,2500));
    const wanted={wood:base,stone:base,iron:base},id=Number(t.id),tasks=[];
    if(config.modules.smartQueue&&queueJobs().some(j=>Number(j.townId)===id)){
      tasks.push(...queueJobs().filter(j=>Number(j.townId)===id));
    }else{
      for(const [key,target] of Object.entries(config.build.targets?.[id]||{}))tasks.push({kind:'building',key,target});
      for(const key of config.research.queue?.[id]||[])tasks.push({kind:'research',key,target:1});
      for(const [key,target] of Object.entries(config.recruit.targets?.[id]||{})){
        const def=W.GameData?.units?.[key];
        tasks.push({kind:def?.is_naval?'ship':'troop',key,target});
      }
    }
    for(const job of tasks.slice(0,30)){
      const cost=tradeCostsForGoal(t,job);
      if(!cost)continue;
      for(const k of ['wood','stone','iron'])wanted[k]=Math.max(wanted[k],num(cost[k]));
    }
    return wanted;
  }
  const tradePending=(rt,townId,k,now)=>Object.values(rt.tradePending||{}).reduce((n,p)=>n+
    (Number(p.to)===Number(townId)&&now-Number(p.at)<Math.max(120000,Math.min(1800000,num(config.trade.pendingMinutes,15)*60000))?num(p.cargo?.[k]):0),0);
  const tradeCooldown=(rt,from,to,now)=>now-num(rt.tradeAttempts?.[from+':'+to],0)<
    Math.max(60000,Math.min(1800000,num(config.trade.cooldownMinutes,5)*60000));
  const tradeReadyPair=(src,dst)=>{
    if(!src||!dst||Number(src.id)===Number(dst.id))return false;
    return num(src.getAvailableTradeCapacity?.(),0)>=100;
  };
  function tradeAutoCandidates(now=Date.now()){
    const cfg=config.trade||{}, rt=readRuntime(), minReserve=Math.max(0,num(cfg.minReserve,2500)),
      fill=Math.max(0.1,Math.min(1,num(cfg.maxFill,0.90))), minCargo=Math.max(100,Math.floor(num(cfg.minCargo,200)));
    const cities=towns().filter(t=>t&&num(resource(t).storage,0)>0);
    const results=[];
    for(const dest of cities){
      const rd=resource(dest),demand=tradeDemandForTown(dest);
      if(Object.values(demand.needs).reduce((total,v)=>total+v,0)<minCargo)continue;
      for(const src of cities){
        if(!tradeReadyPair(src,dest)||tradeCooldown(rt,src.id,dest.id,now))continue;
        const rs=resource(src),raw={},cap=Math.floor(num(src.getAvailableTradeCapacity?.(),0));
        const ownReserve=tradeSourceReserves(src);
        if(cap<minCargo)continue;
        let remaining=cap;
        for(const k of ['wood','stone','iron']){
          const available=Math.max(0,Math.floor(num(rs[k])-Math.max(minReserve,ownReserve[k])));
          const pending=tradePending(rt,dest.id,k,now);
          const needed=Math.max(0,Math.floor(demand.needs[k]-pending));
          const space=Math.max(0,Math.floor(num(rd.storage)*fill-num(rd[k])-pending));
          raw[k]=Math.max(0,Math.min(needed,available,space));
        }
        // Prioriza a falta mais importante e limita ao transporte disponível.
        const cargo={wood:0,stone:0,iron:0};
        const keys=['wood','stone','iron'].sort((a,b)=>raw[b]-raw[a]);
        for(const k of keys){cargo[k]=Math.min(remaining,raw[k]);remaining-=cargo[k];}
        const total=cap-remaining;
        if(total<minCargo)continue;
        const critical=Math.max(...Object.values(demand.needs));
        const weight=demand.goals[0]?.weight||1;
        results.push({from:Number(src.id),to:Number(dest.id),cargo,total,
          score:weight*100000+critical+total/10,reason:demand.goals[0]?.task||'metas da cidade'});
      }
    }
    return results.sort((a,b)=>b.score-a.score||a.from-b.from||a.to-b.to);
  }
  const tradeMark=(result)=>{
    if(config.dryRun)return;
    const now=Date.now(),rt=readRuntime();
    rt.tradeAttempts??={};rt.tradePending??={};
    const key=result.from+':'+result.to;
    rt.tradeAttempts[key]=now;
    rt.tradePending[key]={to:result.to,at:now,cargo:result.cargo};
    rt.tradeAttempts=Object.fromEntries(Object.entries(rt.tradeAttempts).filter(([,ts])=>now-num(ts)<3600000));
    rt.tradePending=Object.fromEntries(Object.entries(rt.tradePending).filter(([,v])=>now-num(v.at)<1800000));
    writeRuntime(rt);
  };
  async function trade(){
    const rs=Array.isArray(config.trade.routes)?config.trade.routes:[];
    const now=Date.now(),rt=readRuntime();
    for(const route of rs){
      if(route.enabled===false)continue;
      const src=townBy(route.from),dst=townBy(route.to);
      if(!tradeReadyPair(src,dst)||tradeCooldown(rt,src.id,dst.id,now))continue;
      const a=resource(src),b=resource(dst),cargo={wood:0,stone:0,iron:0};
      let available=Math.floor(num(src.getAvailableTradeCapacity?.(),0));
      for(const k of ['wood','stone','iron']){
        const reserve=Math.max(0,num(config.trade.minReserve,2500));
        const supply=Math.max(0,Math.floor(num(a[k])-reserve));
        const room=Math.max(0,Math.floor(num(b.storage)*Math.max(0.1,Math.min(1,num(config.trade.maxFill,0.90)))-num(b[k])-tradePending(rt,dst.id,k,now)));
        cargo[k]=Math.min(available,supply,room,Math.max(0,Math.floor(num(route[k]))));
        available-=cargo[k];
      }
      const total=Object.values(cargo).reduce((sum,v)=>sum+v,0);
      if(total<100)continue;
      await action('town_info','trade',{id:Number(dst.id),town_id:Number(src.id),nl_init:true,...cargo});
      tradeMark({from:src.id,to:dst.id,cargo});
      log(`Rota manual ${tName(src)} → ${tName(dst)}: ${JSON.stringify(cargo)}`);return true;
    }
    if(config.trade.intelligent!==true)return false;
    const best=tradeAutoCandidates(now)[0];
    if(!best)return false;
    await action('town_info','trade',{id:best.to,town_id:best.from,nl_init:true,...best.cargo});
    tradeMark(best);
    log(`Comércio inteligente: ${tName(townBy(best.from))} → ${tName(townBy(best.to))}: ${JSON.stringify(best.cargo)} · meta ${best.reason}`);
    return true;
  }
  async function ruralTrade(){
    const fs=models('FarmTown'),rs=models('FarmTownPlayerRelation');
    const wanted=config.ruralTrade.wanted;
    for(const t of towns().filter(eligibleTown)){
      const r=resource(t);if(num(t.getAvailableTradeCapacity?.())<100)continue;
      for(const f of fs){
        const a=f.attributes||{};
        if(a.island_x!==t.getIslandCoordinateX?.() || a.island_y!==t.getIslandCoordinateY?.() || a.resource_offer!==wanted)continue;
        const rel=rs.find(x=>x.attributes?.farm_town_id===a.id && x.attributes?.relation_status===1);
        if(!rel || num(rel.attributes?.current_trade_ratio)<num(config.ruralTrade.minRatio))continue;
        const amount=Math.floor(Math.min(num(config.ruralTrade.maxAmount,3000),num(t.getAvailableTradeCapacity?.()),num(r[a.resource_demand])-500));
        if(amount<100)continue;
        await bridge(t.id,`FarmTownPlayerRelation/${rel.id}`,'trade',{farm_town_id:a.id,amount});
        log(`${tName(t)}: troca rural ${amount} ${a.resource_demand} por ${wanted}`);return true;
      }
    }
    return false;
  }
  const RURAL_UNLOCK_COSTS=[2,8,10,30,50,100];
  const RURAL_UPGRADE_COSTS={1:1,2:5,3:25,4:50,5:100};
  const villageRows=()=>{
    const rels=models('FarmTownPlayerRelation'),farms=models('FarmTown');
    const farmMap=new Map(farms.map(f=>[String(f.attributes?.id??f.id),f]));
    const own=towns().filter(eligibleTown).sort((a,b)=>num(a.id)-num(b.id));
    const ownerByIsland=new Map();
    own.forEach(t=>{
      const key=String(t.attributes?.island_id??`${t.getIslandCoordinateX?.()}:${t.getIslandCoordinateY?.()}`);
      if(!ownerByIsland.has(key))ownerByIsland.set(key,t);
    });
    const rows=[],seen=new Set();
    for(const rel of rels){
      const a=rel.attributes||{},farmId=a.farm_town_id, farm=farmMap.get(String(farmId));
      const f=farm?.attributes||{};if(!farm||seen.has(String(farmId)))continue;
      const town=own.find(t=>String(t.getIslandCoordinateX?.())===String(f.island_x)&&String(t.getIslandCoordinateY?.())===String(f.island_y));
      if(!town)continue;
      const islandKey=String(town.attributes?.island_id??`${f.island_x}:${f.island_y}`);
      const owner=ownerByIsland.get(islandKey)||town;
      // expansion_stage e expansion_at pertencem à relação, NÃO ao FarmTown.
      const levelRaw=a.expansion_stage??a.level??f.level??1;
      const level=Math.max(1,Math.min(6,Math.floor(num(levelRaw,1))));
      const pending=a.expansion_at!==null&&a.expansion_at!==undefined&&a.expansion_at!==''&&num(a.expansion_at)>0;
      const unlocked=Number(a.relation_status)===1;
      const relId=rel.id??a.id;
      if(!Number.isSafeInteger(Number(relId))||!Number.isSafeInteger(Number(farmId)))continue;
      seen.add(String(farmId));
      rows.push({farmId:Number(farmId),relId:Number(relId),townId:Number(owner.id),islandKey,
        name:String(f.name||farmId),level,pending,unlocked,unlockCost:num(a.unlock_cost,NaN),
        upgradeCost:num(a.upgrade_cost,NaN),status:a.relation_status});
    }
    return rows.sort((a,b)=>a.islandKey.localeCompare(b.islandKey,undefined,{numeric:true})||a.farmId-b.farmId);
  };
  const battlePoints=()=>{
    const kp=W.MM?.getModelByNameAndPlayerId?.('PlayerKillpoints')?.attributes;
    if(!kp)return null;
    const v=num(kp.att,NaN)+num(kp.def,NaN)-num(kp.used,NaN);
    return Number.isFinite(v)?Math.max(0,v):null;
  };
  const villageCost=(row,kind,unlockedCount)=>{
    const supplied=kind==='unlock'?row.unlockCost:row.upgradeCost;
    if(Number.isFinite(supplied)&&supplied>0)return supplied;
    if(kind==='unlock')return RURAL_UNLOCK_COSTS[Math.min(unlockedCount,RURAL_UNLOCK_COSTS.length-1)];
    return RURAL_UPGRADE_COSTS[row.level]??Infinity;
  };
  const ruralStatus=()=>{
    const rows=villageRows(), bp=battlePoints(), unlocked=rows.filter(x=>x.unlocked).length;
    return {rows,bp,unlocked,locked:rows.length-unlocked,upgradable:rows.filter(x=>x.unlocked&&!x.pending&&x.level<6).length};
  };
  async function ruralUnlock(){
    const {rows,bp,unlocked}=ruralStatus();if(bp===null)return false;
    for(const row of rows){
      if(row.unlocked||row.pending)continue;
      const cost=villageCost(row,'unlock',unlocked);
      if(!Number.isFinite(cost)||bp<cost)continue;
      const rt=readRuntime(),key=`unlock:${row.relId}`,now=Date.now();
      if(now-num(rt.villageAttempts?.[key])<180000)continue;
      await bridge(row.townId,`FarmTownPlayerRelation/${row.relId}`,'unlock',{farm_town_id:row.farmId});
      if(!config.dryRun){rt.villageAttempts??={};rt.villageAttempts[key]=now;writeRuntime(rt);}
      log(`Aldeia ${row.name}: desbloqueio solicitado (${cost} pontos de batalha, cidade ${row.townId})`);return true;
    }
    return false;
  }
  async function ruralUpgrade(){
    const {rows,bp}=ruralStatus();if(bp===null)return false;
    const goal=Math.max(1,Math.min(6,Math.floor(num(config.ruralUpgrade.targetLevel,3))));
    const eligible=rows.filter(row=>row.unlocked&&!row.pending&&row.level<goal&&row.level<6)
      .sort((a,b)=>a.level-b.level||a.farmId-b.farmId);
    for(const row of eligible){
      const cost=villageCost(row,'upgrade');
      if(!Number.isFinite(cost)||bp<cost)continue;
      const rt=readRuntime(),key=`upgrade:${row.relId}:${row.level}`,now=Date.now();
      if(now-num(rt.villageAttempts?.[key])<180000)continue;
      await bridge(row.townId,`FarmTownPlayerRelation/${row.relId}`,'upgrade',{farm_town_id:row.farmId});
      if(!config.dryRun){rt.villageAttempts??={};rt.villageAttempts[key]=now;writeRuntime(rt);}
      log(`Aldeia ${row.name}: melhoria ${row.level} → ${row.level+1} solicitada (${cost} pontos de batalha)`);return true;
    }
    return false;
  }
  const townForQuest=a=>{
    const coords=a.configuration||{};
    const x=coords.island_x??a.island_x, y=coords.island_y??a.island_y;
    if(x!==undefined&&y!==undefined){
      const match=towns().find(t=>String(t.getIslandCoordinateX?.())===String(x)&&String(t.getIslandCoordinateY?.())===String(y));
      return match||null;
    }
    if(a.town_id&&townBy(a.town_id))return townBy(a.town_id);
    return towns().sort((a,b)=>Number(a.id)-Number(b.id))[0]||null;
  };

  const islandQuestAll=()=>{
    const all=models('IslandQuest');
    if(all.length)return all;
    try{
      const raw=W.MM?.getModels?.()?.IslandQuest||W.MM?.getModels?.()?.IslandQuests||{};
      return Array.isArray(raw)?raw:Object.values(raw);
    }catch{return [];}
  };
  const questRows=()=>islandQuestAll().filter(q=>q.attributes?.state==='satisfied'&&
    q.attributes?.progressable_id!==undefined&&q.attributes?.progressable_id!==null);
  const islandQuestInfo=(q)=>{
    const a=q?.attributes||q||{},cfg=a.configuration||{};
    const objective=[a.objective,a.task,a.current_task,cfg.objective,cfg.task,cfg.requirements]
      .find(x=>x&&typeof x==='object'&&!Array.isArray(x))||null;
    const type=String(objective?.type??objective?.kind??a.objective_type??a.quest_type??'').toLowerCase();
    const id=a.progressable_id??a.id??q?.id;
    const town=townForQuest(a);
    const state=String(a.state??'unknown').toLowerCase();
    return {id,state,type,objective,town,
      name:String(a.name||a.title||'Missão '+String(id??'?')),
      model:q,raw:a};
  };
  function questActionCandidates(info){
    const a=info.raw,model=info.model;
    let modelActions=null;
    try{if(typeof model?.getAvailableActions==='function')modelActions=model.getAvailableActions();}catch{}
    const sources=[a.available_actions,a.availableActions,a.actions,a.configuration?.available_actions,modelActions];
    const objects=sources.flatMap(x=>Array.isArray(x)?x:x&&typeof x==='object'?Object.values(x):[]);
    return objects.filter(x=>x&&typeof x==='object').map(x=>({
      name:String(x.action_name??x.actionName??x.name??''),
      model_url:String(x.model_url??x.modelUrl??'IslandQuests'),
      arguments:x.arguments??x.args??null,
      option:String(x.option??x.side??x.choice??x.arguments?.option??x.arguments?.choice??'').toLowerCase(),
      cost:x.cost??x.resources??x.arguments?.resources??null,
      troops:x.troops??x.units??x.arguments?.units??null
    })).filter(x=>/^IslandQuests?(?:\/[0-9]+)?$/.test(x.model_url)&&
      ['acceptQuest','chooseQuest','accept','chooseOption','selectOption',
        'fulfill','fulfillTask','completeObjective','submitTask'].includes(x.name)&&
      x.arguments&&typeof x.arguments==='object'&&!Array.isArray(x.arguments));
  }
  const questActionAllowed=(op,kind)=>{
    const isDecision=['acceptQuest','chooseQuest','accept','chooseOption','selectOption'].includes(op.name);
    if(kind==='decision'&&!isDecision||kind==='fulfill'&&isDecision)return false;
    if(isDecision){
      const side={peaceful:'wise',wisdom:'wise',wise:'wise',aggressive:'aggressive',war:'aggressive',military:'aggressive'}[op.option];
      if(!side||side!==config.quests.preferred)return false;
    }
    const cost=op.cost||{},troops=op.troops||{};
    const resources=['wood','stone','iron'].reduce((sum,k)=>sum+Math.max(0,num(cost[k])),0);
    const lost=Object.values(troops).reduce((sum,v)=>sum+Math.max(0,num(v)),0);
    if(resources>0&&(!config.quests.allowResourceCost||resources>num(config.quests.maxResourceCost)))return false;
    if(lost>0&&(!config.quests.allowTroopCost||lost>num(config.quests.maxTroopCost)))return false;
    return true;
  };
  function islandQuestPlan(info){
    if(info.state==='satisfied')return {type:'reward',why:'Recompensa pronta'};
    if(['closed','completed','done','expired','failed'].includes(info.state))return {type:'skip',why:'Missão encerrada'};
    if(!info.town)return {type:'wait',why:'Cidade da missão indisponível'};
    const objective=info.objective||{},key=String(objective.building_type??objective.research_type??
      objective.unit_type??objective.building??objective.research??objective.unit??objective.key??objective.id??'');
    const target=Math.floor(num(objective.target_level??objective.target??objective.level??objective.count??objective.amount,1));
    const id=Number(info.town.id);
    if(config.quests.autoObjectives&&['build','building','upgrade_building'].includes(info.type)&&
       W.GameData?.buildings?.[key]&&target>0)
      return {type:'build',townId:id,key,target,why:'Construir '+key+' até nível '+target};
    if(config.quests.autoObjectives&&['research','technology'].includes(info.type)&&W.GameData?.researches?.[key])
      return {type:'research',townId:id,key,target:1,why:'Pesquisar '+key};
    if(config.quests.autoObjectives&&['recruit','train','units'].includes(info.type)&&
      W.GameData?.units?.[key]&&target>0)
      return {type:'recruit',townId:id,key,target,why:'Recrutar '+target+' '+key};
    if(['waiting','wait','time'].includes(info.type))
      return {type:'wait',why:'Aguardando período definido pelo jogo'};
    const actions=questActionCandidates(info);
    const decision=actions.find(op=>questActionAllowed(op,'decision'));
    if(['available','offered','new','unstarted','pending'].includes(info.state)&&decision)
      return {type:'action',op:decision,why:'Escolher opção disponível no cliente'};
    const fulfillment=actions.find(op=>questActionAllowed(op,'fulfill'));
    if(['active','accepted','started','in_progress','progressing','satisfiable'].includes(info.state)&&fulfillment)
      return {type:'action',op:fulfillment,why:'Cumprir objetivo oferecido pelo cliente'};
    return {type:'unsupported',why:actions.length?'Opções não autorizadas pelo limite de custo ou preferência':
      'Objetivo ainda sem ação compatível identificada no cliente'};
  }
  async function islandQuestProgress(){
    if(config.quests.autoObjectives!==true)return false;
    const rt=readRuntime(),now=Date.now();rt.islandQuestActions??={};
    for(const q of islandQuestAll()){
      const info=islandQuestInfo(q);
      if(info.id===undefined||info.id===null||info.state==='satisfied')continue;
      const plan=islandQuestPlan(info),id=String(info.id);
      if(plan.type==='build'||plan.type==='research'||plan.type==='recruit'){
        if(config.dryRun){log('SIMULAÇÃO missão '+id+': '+plan.why);return true;}
        if(plan.type==='build'){
          config.build.targets[plan.townId]??={};
          if(num(config.build.targets[plan.townId][plan.key])>=plan.target)continue;
          config.build.targets[plan.townId][plan.key]=plan.target;config.modules.build=true;
        }else if(plan.type==='research'){
          config.research.queue[plan.townId]??=[];
          if(config.research.queue[plan.townId].includes(plan.key))continue;
          config.research.queue[plan.townId].push(plan.key);config.modules.research=true;
        }else{
          config.recruit.targets[plan.townId]??={};
          if(num(config.recruit.targets[plan.townId][plan.key])>=plan.target)continue;
          config.recruit.targets[plan.townId][plan.key]=plan.target;config.modules.recruit=true;
        }
        nextRun[plan.type]=0;
        save();log('Missão '+id+': objetivo programado na cidade '+plan.townId+' — '+plan.why);return true;
      }
      if(plan.type!=='action'||!plan.op||!info.town)continue;
      const key=id+':'+plan.op.name;
      if(now-num(rt.islandQuestActions[key])<120000)continue;
      if(!config.dryRun){
        // Marcar antes do envio para não repetir um consumo de tropas/recursos se a resposta falhar.
        rt.islandQuestActions[key]=now;writeRuntime(rt);
      }
      await action('frontend_bridge','execute',{model_url:plan.op.model_url,action_name:plan.op.name,
        arguments:plan.op.arguments,town_id:Number(info.town.id),nl_init:true});
      log('Missão '+id+': '+plan.why+' ('+plan.op.name+')'+(config.dryRun?' — SIMULAÇÃO':''));
      return true;
    }
    return false;
  }

  async function quests(){
    const ready=questRows();
    if(!ready.length)return islandQuestProgress();
    const rt=readRuntime(),now=Date.now();rt.questAttempts??={};
    for(const q of ready){
      const a=q.attributes||{},pid=a.progressable_id,key=String(pid),town=townForQuest(a);
      if(!town)continue;
      if(now-num(rt.questAttempts[key])<60000)continue;
      const args={reward_action:config.quests.rewardAction==='use'?'use':'stash',state:'closed',progressable_id:pid};
      await action('frontend_bridge','execute',{model_url:'IslandQuests',action_name:'claimReward',arguments:args,town_id:Number(town.id),nl_init:true});
      if(!config.dryRun){rt.questAttempts[key]=now;rt.questAttempts=Object.fromEntries(Object.entries(rt.questAttempts).filter(([,v])=>now-num(v)<3600000));writeRuntime(rt);}
      log(`Missão ${key}: recompensa ${args.reward_action==='stash'?'guardada':'recebida'} (${tName(town)})`);return true;
    }
    return islandQuestProgress();
  }
  async function banditRewards(){
    const camp=W.MM?.getModelByNameAndPlayerId?.('PlayerAttackSpot');
    if(!camp?.hasReward?.())return false;
    const runtime=readRuntime(),now=Date.now();if(now-num(runtime.lastBanditRewardAt)<30000)return false;
    const reward=camp.getReward?.()||{};
    const name=config.banditRewards.stashIfPossible&&reward.stashable?'stashReward':'useReward';
    await action('frontend_bridge','execute',{model_url:`PlayerAttackSpot/${W.Game.player_id}`,action_name:name,arguments:{}});
    if(!config.dryRun){runtime.lastBanditRewardAt=now;writeRuntime(runtime);}
    log(`Bandidos: recompensa ${name==='stashReward'?'guardada':'recebida'} automaticamente`);return true;
  }
  async function culture(){
    const types=[['festival','party'],['triumph','triumph'],['theater','theater']].filter(([k])=>config.culture[k]);
    if(!types.length)return false;
    const celebrations=Object.values(W.MM.getModels?.()?.Celebration||{});
    for(const [setting,type] of types)for(const t of towns()){
      const active=celebrations.some(m=>Number(m.attributes?.town_id)===Number(t.id) && ['festival','party','triumph','theater'].includes(String(m.attributes?.celebration_type||m.attributes?.type)) && (m.attributes?.celebration_type===type || m.attributes?.type===type));
      if(active)continue;
      const buildings=t.buildings?.()?.attributes||{};const r=resource(t);
      if(type==='party' && (num(buildings.academy)<30 || !availableRes(t,{wood:15000,stone:18000,iron:15000}))) continue;
      if(type==='theater' && !buildings.theater) continue;
      if(type==='triumph'){
        const kp=W.MM?.getModelByNameAndPlayerId?.('PlayerKillpoints')?.attributes||{};
        if(num(kp.att)+num(kp.def)-num(kp.used)<300)continue;
      }
      await action('building_place','start_celebration',{celebration_type:type,town_id:Number(t.id)});
      log(`${tName(t)}: iniciar ${setting}`);return true;
    }
    return false;
  }

  function banditHeroes(){
    // Somente heróis explicitamente atribuídos a uma cidade. Não desloca heróis.
    let all=[];
    try{
      const raw=W.MM?.getModels?.()?.Hero??W.MM?.getModels?.()?.Heroes;
      all=Array.isArray(raw)?raw:Object.values(raw||{});
    }catch{}
    for(const k of ['Hero','Heroes','PlayerHero']){
      try{all.push(...models(k));}catch{}
    }
    const seen=new Set();
    return all.map(h=>{
      const a=h?.attributes||h||{};
      const id=Number(a.hero_id??a.id??h?.id),townId=Number(a.town_id??a.assigned_town_id??a.home_town_id);
      const state=String(a.state??a.status??'').toLowerCase();
      const recovering=a.is_wounded===true||a.wounded===true||Number(a.wounded_until)>Date.now()/1000||
        Number(a.recovery_end_at)>Date.now()/1000||['wounded','recovering','assigning','moving','attacking','on_mission'].includes(state);
      const busy=a.is_busy===true||a.is_attacking===true||a.is_traveling===true||a.in_assignment===true||
        a.in_combat===true;
      return {id,townId,name:String(a.name??a.hero_name??'Herói '+id),available:!recovering&&!busy};
    }).filter(h=>Number.isSafeInteger(h.id)&&h.id>0&&Number.isSafeInteger(h.townId)&&h.townId>0&&!seen.has(h.id)&&seen.add(h.id));
  }
  function banditHeroFor(t){
    if(!config.bootcamp.useHero)return null;
    return banditHeroes().find(h=>h.townId===Number(t?.id)&&h.available)||null;
  }
  async function bootcamp(){
    const camp=W.MM?.getModelByNameAndPlayerId?.('PlayerAttackSpot');
    if(!camp||typeof camp.getLevel?.()==='undefined')return false;
    const runtime=readRuntime(),now=Date.now(),stage=camp.getLevel?.();
    if(camp.hasReward?.())return false; // Não ataca antes de recolher recompensa; rotina separada.
    if(num(camp.getCooldownDuration?.())>0)return false;
    if(now-num(runtime.lastBanditAttackAt)<60000 && String(runtime.lastBanditStage)===String(stage))return false;
    const movement=Object.values(W.MM?.getModels?.()?.MovementsUnits||{});
    if(movement.some(m=>m?.attributes?.destination_is_attack_spot || m?.attributes?.origin_is_attack_spot))return false;
    const homeId=num(config.bootcamp.homeTownId)||num(W.Game?.townId);
    const home=townBy(homeId);
    if(!home){log('Bandidos: selecione uma cidade da ilha inicial','WARN');return false;}
    const units={};let total=0;
    for(const [k,v] of Object.entries(home.units?.()||{})){
      const def=W.GameData?.units?.[k];if(!def||def.is_naval||k==='militia')continue;
      // Use toda a guarnição terrestre disponível, inclusive unidades defensivas e míticas.
      // Navios e milícia não são aceitos em ataques terrestres ao acampamento.
      const send=Math.max(0,Math.floor(num(v)));
      if(send>0){units[k]=send;total+=send;}
    }
    if(total===0){log(`Bandidos: ${tName(home)} sem tropas terrestres disponíveis`,'WARN');return false;}
    if(!config.dryRun){
      runtime.lastBanditAttackAt=now;
      runtime.lastBanditStage=stage;
      writeRuntime(runtime);
    }
    const hero=banditHeroFor(home);
    // No ataque PvE, hero_id é incluído apenas se um herói elegível for encontrado.
    // A aceitação desse campo precisa ser confirmada em um cliente Grepolis real.
    const attackArgs=hero?{...units,hero_id:hero.id}:units;
    await action('frontend_bridge','execute',{model_url:`PlayerAttackSpot/${W.Game.player_id}`,action_name:'attack',arguments:attackArgs});
    log(`Bandidos fase ${stage}: ${config.dryRun?'SIMULAÇÃO ':''}ataque por ${tName(home)} com ${total} unidades (${Object.entries(units).map(([k,v])=>`${k} ${v}`).join(', ')})${hero?' · herói '+hero.name+' #'+hero.id:' · sem herói disponível'}`);
    return true;
  }
  async function cave(){
    for(const t of towns()){
      if(num(t.buildings?.()?.attributes?.hide)<1)continue;
      const iron=num(resource(t).iron), keep=num(config.cave.keepIron);
      const surplus=Math.floor(iron-keep);
      if(iron<num(config.cave.minIron) || surplus<100)continue;
      await bridge(t.id,'BuildingHide','storeIron',{iron_to_store:surplus});
      log(`${tName(t)}: guardar ${surplus} ferro na gruta`);return true;
    }
    return false;
  }
  const readFired=()=>{try{return JSON.parse(localStorage.getItem(FIRED)||'{}')}catch{return {}}};
  const writeFired=v=>localStorage.setItem(FIRED,JSON.stringify(v));
  async function commands(){
    const jobs=config.commands.jobs;
    if(!Array.isArray(jobs))return false;
    const fired=readFired();const now=Date.now();
    for(const job of jobs){
      if(!job || job.enabled===false || fired[job.id])continue;
      const due=Date.parse(job.sendAt);
      if(!Number.isFinite(due) || due>now)continue;
      if(now-due>45000){fired[job.id]={status:'expirado',at:new Date().toISOString()};writeFired(fired);log(`Ordem ${job.id} expirada`,'WARN');continue;}
      const src=townBy(job.from);const to=num(job.to);
      if(!src || !Number.isSafeInteger(to) || to<=0 || !['attack','support'].includes(job.type)){
        fired[job.id]={status:'invalido'};writeFired(fired);log(`Ordem ${job.id} inválida`,'WARN');continue;
      }
      const u={};let total=0;
      for(const [key,val] of Object.entries(job.units||{})){
        const n=Math.floor(num(val)); if(n<=0)continue;
        if(!W.GameData?.units?.[key] || num(src.units?.()?.[key])<n) throw new Error(`Ordem ${job.id}: unidades ${key} insuficientes`);
        u[key]=n;total+=n;
      }
      if(!total)throw new Error(`Ordem ${job.id}: nenhuma unidade`);
      if(config.dryRun){fired[job.id]={status:'simulado',at:new Date().toISOString()};writeFired(fired);log(`SIMULACAO de ${job.type}: ${src.id} -> ${to} unidades=${JSON.stringify(u)}`);return true;}
      // Registrar como pendente ANTES de enviar: evita duplicar ordens após atualização da aba.
      fired[job.id]={status:'pendente',at:new Date().toISOString()};writeFired(fired);
      const payload={id:to,type:job.type,town_id:Number(src.id),nl_init:true,...u};
      await action('town_info','send_units',payload);
      fired[job.id]={status:'enviado',at:new Date().toISOString()};writeFired(fired);
      log(`Ordem ${job.id}: ${job.type} enviada ${src.id} -> ${to}`);return true;
    }
    return false;
  }
  async function alerts(){
    const moving=Object.values(W.MM?.getModels?.()?.MovementsUnits||{});
    const ids=new Set(towns().map(t=>Number(t.id)));
    for(const m of moving){
      const a=m?.attributes||{};
      const destination=num(a.destination_town_id||a.to_town_id||a.target_town_id,-1);
      const kind=String(a.type||a.command_type||a.movement_type||'').toLowerCase();
      if(!ids.has(destination) || !kind.includes('attack'))continue;
      const id=String(a.id||m.id||`${destination}:${a.arrival_at}`);
      if(seenAttacks.has(id))continue;
      seenAttacks.add(id);
      notify(`Ataque detectado rumo à cidade ${destination}. Chegada: ${a.arrival_at||a.arrival_time||'a confirmar'}`);
    }
    if(seenAttacks.size>200)seenAttacks=new Set([...seenAttacks].slice(-100));
    return false;
  }
function testRead(){try{return JSON.parse(localStorage.getItem(TEST_STORE)||'{}')}catch{return {}}}
  function testWrite(v){localStorage.setItem(TEST_STORE,JSON.stringify(v));}
  function testActive(){const a=testRead().active;return !!(a?.state==='active'&&a.mode==='live'&&a.impactMs>dodgeNow()-1000);}
  function testAttacks(){
  const a=testRead().active;
  if(!a||a.state!=='active'||a.mode!=='live')return [];
  return [a.impactMs,...(a.secondMs?[a.secondMs]:[])].map((arrivalMs,i)=>({
    id:'GPTEST-'+a.id+'-'+i,townId:Number(a.townId),arrivalMs,type:'attack_test',
    simulated:true,testId:a.id
  }));
}
  function testStart(id,mode,delay,wave){
  if(mode==='live'&&securityWatch())throw Error('CAPTCHA ativo: teste prático temporariamente indisponível');
  const town=townBy(id);
  if(!town)throw Error('Cidade inválida');
  if(!['preview','live'].includes(mode))throw Error('Modo inválido');
  delay=Math.floor(Number(delay));wave=Math.floor(Number(wave)||0);
  if(!Number.isSafeInteger(delay)||delay<30||delay>600)throw Error('Prazo deve estar entre 30 e 600 segundos');
  if(!Number.isSafeInteger(wave)||wave<0||wave>30)throw Error('O intervalo da segunda onda deve ser de 0 a 30 segundos');
  if(testRead().active?.state==='active')throw Error('Interrompa o teste atual antes de iniciar outro');
  const now=dodgeNow();
  const targetId=dodgeDestination(Number(id),dodgeIncoming());
  if(mode==='live'){
  if(delay*1000<dodgeLead()+16000)throw Error('Teste prático: configure o impacto após pelo menos '+Math.ceil((dodgeLead()+16000)/1000)+' segundos');
  if(syncRole()==='standby')throw Error('O teste prático exige PC principal');
    if(!dodgeCanOperate())throw Error('Grepolis não está disponível');
    if(!targetId)throw Error('Teste prático precisa de outra cidade própria na mesma ilha');
    if(dodgeTracked(dodgeRead()).some(j=>Number(j.townId)===Number(id)))throw Error('Há esquiva real pendente nesta cidade');
    if(!Object.values(dodgeUnits(town)).some(group=>Object.keys(group).length))throw Error('A cidade não tem tropas disponíveis');
    if(dodgeIncoming().some(a=>!a.simulated&&a.townId===Number(id)&&a.arrivalMs>now&&a.arrivalMs<now+delay*1000+30000))throw Error('Ataque verdadeiro próximo: teste prático bloqueado nesta cidade');
  }
  const a={id:'T-'+now+'-'+Math.random().toString(36).slice(2,7),townId:Number(id),targetId,
    mode,state:'active',stage:'waiting',createdMs:now,impactMs:now+delay*1000,
    secondMs:wave?now+(delay+wave)*1000:0,leadSeconds:dodgeLead()/1000,
    returnDelay:dodgeAfter()/1000,sentMs:0,cancelledMs:0,returnMs:0,reason:''};
  testWrite({active:a});
  log(`Teste ${mode==='live'?'PRÁTICO':'SIMULADO'} iniciado em ${tName(town)}: impacto fictício em ${delay}s`);
  return a;
}
  function testStop(){
  const state=testRead(),a=state.active;
  if(!a||a.state!=='active')return;
  a.state='stopped';a.stage='stopped';a.reason='Teste interrompido';
  testWrite(state);
  if(a.mode==='live'){
    const d=dodgeRead();
    for(const job of Object.values(d.jobs||{}))if(job.testId===a.id&&dodgeActive(job))job.forceCancel=true;
    dodgeWrite(d);
    log('Teste interrompido: cancelamento solicitado para todos os apoios do teste','WARN');
  }else log('Teste simulado interrompido');
}
  function testTick(){
  if(scope!==currentScope())return;
  const st=testRead(),a=st.active;
  if(!a||a.state!=='active')return;
  const now=dodgeNow(),last=Math.max(a.impactMs,a.secondMs||0),after=last+a.returnDelay*1000;
  let changed=false;
  if(a.mode==='preview'){
    const sendAt=a.impactMs-a.leadSeconds*1000;
    if(a.stage==='waiting'&&now>=sendAt){
      a.stage='sent';a.sentMs=sendAt;
      a.cancelDue=after;a.returnDue=after+(after-sendAt);changed=true;
      log('SIMULAÇÃO: apoio virtual enviado; cancelamento programado');
    }
    if(a.stage==='sent'&&now>=a.cancelDue){
      a.stage='cancelled';a.cancelledMs=a.cancelDue;changed=true;
      log('SIMULAÇÃO: apoio virtual cancelado');
    }
    if(a.stage==='cancelled'&&now>=a.returnDue){
      a.stage='completed';a.state='completed';a.returnMs=after;changed=true;
      log('SIMULAÇÃO: retorno previsto após o último impacto');
    }
  }else{
    const jobs=Object.values(dodgeRead().jobs||{}).filter(j=>j.testId===a.id);
    if(jobs.some(j=>j.state==='needs_attention')&&now>last+2000){
      a.stage='attention';a.state='attention';a.reason='Verifique o apoio: falta confirmação de cancelamento';changed=true;
    }else if(jobs.length&&jobs.every(j=>j.state==='cancelled')&&now>after+3000){
      a.stage='completed';a.state='completed';a.sentMs=Math.min(...jobs.map(j=>j.sentAtMs));
      a.cancelledMs=Math.max(...jobs.map(j=>j.cancelledAtMs||0));
      a.returnMs=Math.max(...jobs.map(j=>j.estimatedArrivalMs||0));changed=true;
      log('TESTE PRÁTICO: apoios cancelados; retorno calculado. Confira a chegada no jogo');
    }else if(!jobs.length&&now>last+15000){
      a.stage='failed';a.state='failed';a.reason='A esquiva não enviou apoio antes do impacto fictício';changed=true;
    }else{
      const newStage=jobs.length?'sent':'waiting';
      if(a.stage!==newStage){a.stage=newStage;changed=true;}
      if(jobs.length&&!a.sentMs){a.sentMs=Math.min(...jobs.map(j=>j.sentAtMs));changed=true;}
      if(jobs.some(j=>j.state==='cancelled')){
        const cancel=Math.max(...jobs.map(j=>j.cancelledAtMs||0));
        if(a.cancelledMs!==cancel){a.cancelledMs=cancel;changed=true;}
      }
    }
  }
  if(changed){st.active=a;testWrite(st);if(config.ui.tab==='TESTE')render();}
}
  function testContent(){
  const a=testRead().active,now=dodgeNow(),t=getSelected(),mode=config.attackTest?.mode||'preview';
  const destination=t?dodgeDestination(Number(t.id),dodgeIncoming()):0;
  const group=t?dodgeUnits(t):{land:{},naval:{}};
  const count=Object.values(group).reduce((n,g)=>n+Object.values(g).reduce((sum,v)=>sum+num(v),0),0);
  const difference=a?.returnMs?(a.returnMs-Math.max(a.impactMs,a.secondMs||0))/1000:null;
  const accuracy=null;
  const status=a?`<div class="city"><b>${a.mode==='live'?'🟠 Teste prático':'🔵 Teste virtual'}</b>
    <div>Cidade: ${cleanStr(tName(townBy(a.townId)))} · destino: ${a.targetId?cleanStr(tName(townBy(a.targetId))):'sem cidade de apoio'}</div>
    <div>Estado: ${cleanStr(a.stage)} (${cleanStr(a.state)})</div>
    <div>Impacto fictício: ${new Date(a.impactMs).toLocaleTimeString('pt-BR',{hour12:false})}${a.secondMs?' · 2ª onda '+new Date(a.secondMs).toLocaleTimeString('pt-BR',{hour12:false}):''}</div>
    <div>Contagem regressiva: <b id="testCountdown">${Math.max(0,(a.impactMs-now)/1000).toFixed(1)}s</b></div>
    <div class="smallnote">Saída: ${a.sentMs?new Date(a.sentMs).toLocaleTimeString('pt-BR',{hour12:false}):'aguardando'} · Cancelamento: ${a.cancelledMs?new Date(a.cancelledMs).toLocaleTimeString('pt-BR',{hour12:false}):'aguardando'} · Retorno: ${a.returnMs?new Date(a.returnMs).toLocaleTimeString('pt-BR',{hour12:false}):a.returnDue?new Date(a.returnDue).toLocaleTimeString('pt-BR',{hour12:false}):'calculando'}</div>
    ${difference!==null?`<div class="smallnote"><b>Retorno estimado:</b> ${difference.toFixed(1)}s após o último impacto; cancelamento previsto ${Number(a.returnDelay).toFixed(0)}s após a onda. ${a.mode==='live'?'Chegada não confirmada pelo servidor.':'Cálculo virtual.'}</div>`:''}
    ${a.reason?'<div class="smallnote">'+cleanStr(a.reason)+'</div>':''}</div>`:'<p class="smallnote">Nenhum teste executado.</p>';
  return `${section('Simular ataque à cidade')}
    <div class="helpbox">Cria um <b>ataque fictício</b> só no GrepoPilot. O modo virtual não move tropas; o modo prático usa apoio real para testar a saída e o cancelamento cronometrado, sem realizar ataque inimigo.</div>
    <div class="formrow"><span>Cidade testada</span>${selectTown('testCity',t?.id)}</div>
    <div class="formrow"><span>Chegada do ataque em (seg.)</span><input type="number" min="30" max="600" data-setting="attackTest.delay" value="${config.attackTest.delay}"></div>
    <div class="formrow"><span>Segunda onda</span><select data-setting="attackTest.wave">${optionList([[0,'Desativada'],[3,'3 segundos depois'],[5,'5 segundos depois'],[10,'10 segundos depois']],config.attackTest.wave)}</select></div>
    <div class="formrow"><span>Modo</span><select data-setting="attackTest.mode">${optionList([['preview','Só cálculo — sem mover tropas'],['live','Teste real: enviar e cancelar apoio']],mode)}</select></div>
    <div class="smallnote">Tropas disponíveis: ${count} · apoio para: ${destination?cleanStr(tName(townBy(destination))):'nenhuma cidade da mesma ilha'}</div>
    <div class="checks"><label><input id="testConfirm" type="checkbox"> Confirmo envio e cancelamento de tropas reais no modo prático.</label></div>
    <div class="tools"><button class="primary" data-action="testStart" ${a?.state==='active'?'disabled':''}>▶ Iniciar simulação</button><button data-action="testStop" ${a?.state==='active'?'':'disabled'}>■ Interromper teste</button></div>
    ${section('Relatório do teste')}
    ${status}
    <p class="smallnote">O ataque fictício não aparece como ataque real no Grepolis. O teste prático executa somente o apoio e o cancelamento, mesmo se os demais módulos do bot estiverem pausados. Ao interromper depois do envio, o cancelamento das tropas continua pendente até confirmação.</p>`;
}

  const dodgeRead=()=>{try{return JSON.parse(localStorage.getItem(DODGE_STORE)||'{}')}catch{return {}}};
  const dodgeWrite=data=>localStorage.setItem(DODGE_STORE,JSON.stringify(data));
  const dodgeClock={sampleAt:0,deltaMs:0,source:'local'};
  function dodgeNow(){
    const now=Date.now();
    if(now-dodgeClock.sampleAt>=12000||!dodgeClock.sampleAt){
      dodgeClock.sampleAt=now;
      try{
        const raw=Number(W.Timestamp?.server?.());
        const stamp=raw>1e12?raw:raw>1e9?raw*1000:0;
        if(stamp){
          dodgeClock.deltaMs=stamp-now;
          dodgeClock.source='servidor';
        }else{dodgeClock.deltaMs=0;dodgeClock.source='local';}
      }catch{dodgeClock.deltaMs=0;dodgeClock.source='local';}
    }
    return now+dodgeClock.deltaMs;
  }
  const dodgeEpochMs=value=>{
    if(value===undefined||value===null||value==='')return NaN;
    if(typeof value==='object')
      return dodgeEpochMs(value.timestamp??value.time??value.value??value.date);
    const n=Number(value);
    if(Number.isFinite(n)&&n>1e9)return n>1e12?n:n*1000;
    const parsed=Date.parse(String(value));
    return Number.isFinite(parsed)?parsed:NaN;
  };
  function dodgeMovements(){
    const all=[];
    try{
      const raw=W.MM?.getModels?.()?.MovementsUnits;
      const values=Array.isArray(raw)?raw:Object.values(raw||{});
      all.push(...values);
      if(!values.length)all.push(...models('MovementsUnits'));
    }catch{}
    const seen=new Set();
    return all.filter(Boolean).map(model=>({model,data:model.attributes||model.getAttributes?.()||model}))
      .filter(m=>{
        const id=String(m.data.command_id??m.data.id??m.model.id??'');
        const key=id||JSON.stringify([m.data.origin_town_id,m.data.target_town_id,m.data.arrival_at,m.data.type]);
        if(seen.has(key))return false;
        seen.add(key);return true;
      });
  }
  const dodgeMoveId=m=>Number(m?.data?.command_id??m?.data?.id??m?.model?.id??m?.model?.getId?.());
  const dodgeSrcId=a=>Number(a?.origin_town_id??a?.source_town_id??a?.from_town_id??a?.home_town_id??a?.town_id);
  const dodgeDstId=a=>Number(a?.destination_town_id??a?.target_town_id??a?.to_town_id??a?.target_id);
  const dodgeArrival=a=>dodgeEpochMs(a?.arrival_at??a?.arrival_time??a?.time_of_arrival??a?.arrival);
  const dodgeStarted=a=>dodgeEpochMs(a?.started_at??a?.start_time??a?.sent_at??a?.departed_at);
  function dodgeIncoming(){
    const owned=new Set(towns().map(t=>Number(t.id)));
    const seen=new Set();
    const real=dodgeMovements().flatMap(({model,data:a})=>{
      const type=String(a.type??a.command_type??a.movement_type??'').toLowerCase();
      if(!(type==='attack'||type.startsWith('attack_')||type==='attacking'))return [];
      const townId=dodgeDstId(a),source=dodgeSrcId(a),arrivalMs=dodgeArrival(a);
      if(!owned.has(townId)||(Number.isSafeInteger(source)&&owned.has(source))||!Number.isFinite(arrivalMs))return [];
      const id=String(a.command_id??a.id??model.id??'attack-'+townId+'-'+arrivalMs);
      if(seen.has(id))return [];
      seen.add(id);
      return [{townId,arrivalMs,id,type}];
    });
    return real.concat(testAttacks()).sort((a,b)=>a.arrivalMs-b.arrivalMs);
  }
  function dodgeOutgoing(from,to){
    return dodgeMovements().filter(m=>{
      const a=m.data,type=String(a.type??a.command_type??a.movement_type??'').toLowerCase();
      return (type==='support'||type==='supporting'||type==='unit_support')&&
        dodgeSrcId(a)===Number(from)&&dodgeDstId(a)===Number(to)&&
        Number.isSafeInteger(dodgeMoveId(m))&&dodgeMoveId(m)>0;
    });
  }
  function dodgeSameIsland(a,b){
    if(!a||!b||Number(a.id)===Number(b.id))return false;
    const ax=a.getIslandCoordinateX?.()??a.attributes?.island_x;
    const ay=a.getIslandCoordinateY?.()??a.attributes?.island_y;
    const bx=b.getIslandCoordinateX?.()??b.attributes?.island_x;
    const by=b.getIslandCoordinateY?.()??b.attributes?.island_y;
    if([ax,ay,bx,by].every(x=>x!==undefined&&x!==null))
      return String(ax)===String(bx)&&String(ay)===String(by);
    const island1=a.getIslandId?.()??a.attributes?.island_id;
    const island2=b.getIslandId?.()??b.attributes?.island_id;
    return island1!=null&&island2!=null&&String(island1)===String(island2);
  }
  const dodgeLead=()=>Math.max(20,Math.min(180,Math.floor(num(config.dodge.leadSeconds,60))))*1000;
  const dodgeAfter=()=>Math.max(10,Math.min(90,Math.floor(num(config.dodge.returnAfterSeconds,15))))*1000;
  const dodgeWaveGap=()=>Math.max(1,Math.min(60,Math.floor(num(config.dodge.waveGapSeconds,12))))*1000;
  function dodgeDestinations(id,incoming=[]){
    const origin=townBy(id),now=dodgeNow(),margin=dodgeLead()+dodgeAfter()+dodgeWaveGap();
    return towns().filter(t=>dodgeSameIsland(origin,t))
      .sort((a,b)=>{
        const risk=t=>incoming.some(x=>Number(x.townId)===Number(t.id)&&
          x.arrivalMs>=now-10000&&x.arrivalMs<=now+margin);
        return Number(risk(a))-Number(risk(b))||Number(a.id)-Number(b.id);
      });
  }
  function dodgeDestination(id,incoming=[]){
    const all=dodgeDestinations(id,incoming),now=dodgeNow(),margin=dodgeLead()+dodgeAfter()+dodgeWaveGap();
    const safe=all.filter(t=>!incoming.some(a=>Number(a.townId)===Number(t.id)&&
      a.arrivalMs>=now-10000&&a.arrivalMs<=now+margin));
    const configured=Number(config.dodge.targets?.[id]);
    if(configured&&safe.some(t=>Number(t.id)===configured))return configured;
    return Number(safe[0]?.id)||0;
  }
  function dodgeUnits(t){
    const groups={land:{},naval:{}};
    const cfg=config.dodge;
    for(const [key,raw] of Object.entries(t?.units?.()||{})){
      const count=Math.floor(Number(raw)),def=W.GameData?.units?.[key];
      if(!def||key==='militia'||!Number.isSafeInteger(count)||count<=0)continue;
      const naval=Boolean(def.is_naval),kind=naval?'naval':'land';
      if(kind==='land'&&cfg.land===false||kind==='naval'&&cfg.naval===false)continue;
      groups[kind][key]=count;
    }
    return groups;
  }
  function dodgeLeader(){
    const now=Date.now();
    try{
      const previous=JSON.parse(localStorage.getItem(DODGE_LOCK)||'{}');
      if(previous.owner&&previous.owner!==instanceId&&num(previous.until)>now)return false;
    }catch{}
    localStorage.setItem(DODGE_LOCK,JSON.stringify({owner:instanceId,until:now+2500}));
    return true;
  }
  function dodgeLateAttacks(job,attacks){
    const max=Number(job.firstImpactMs)+dodgeWaveGap();
    const waves=attacks.filter(a=>Number(a.townId)===Number(job.townId)&&
      a.arrivalMs>=Number(job.firstImpactMs)-1000&&a.arrivalMs<=max);
    return Math.max(Number(job.lastImpactMs)||0,...waves.map(a=>a.arrivalMs));
  }
  // Cancelar DEPOIS do último impacto, não no meio do voo para tentar voltar no segundo exato.
  // Até 10 min após a saída; o retorno será posterior e varia conforme a viagem realizada.
  const dodgeTiming=(startMs,lastImpactMs)=>({
    cancelAtMs:lastImpactMs+dodgeAfter(),
    deadlineMs:startMs+590000
  });
  const dodgeActive=j=>['dispatching','identifying','sent','canceling'].includes(j?.state);
  const dodgeTracked=d=>Object.values(d.jobs||{}).filter(dodgeActive);
  function dodgeFindCommand(job){
    const outgoing=dodgeOutgoing(job.townId,job.targetId),excluded=new Set((job.existingIds||[]).map(String));
    if(job.commandId){
      const exact=outgoing.find(m=>dodgeMoveId(m)===Number(job.commandId));
      if(exact)return exact;
    }
    const found=outgoing.filter(m=>{
      if(excluded.has(String(dodgeMoveId(m))))return false;
      const started=dodgeStarted(m.data);
      if(Number.isFinite(started)&&started<Number(job.sentAtMs)-5000)return false;
      const moveUnits=m.data.units||m.data.unit_counts;
      if(moveUnits&&typeof moveUnits==='object'){
        for(const [unit,count] of Object.entries(job.units||{})){
          if(moveUnits[unit]!==undefined&&num(moveUnits[unit])!==num(count))return false;
        }
      }
      return true;
    });
    return found.length===1?found[0]:null;
  }
  let dodgeBusy=false;
  const dodgePreviewed=new Set();
  const dodgeSaveRecord=(store,job)=>{
    store.jobs??={};store.jobs[job.id]=job;dodgeWrite(store);
  };
  const dodgeCanOperate=()=>connected()&&scope===currentScope()&&!securityBlocked();
  function dodgeAttention(store,job,reason){
    if(job.state==='needs_attention'&&job.error===reason)return;
    job.state='needs_attention';job.error=reason;job.ackAtMs=dodgeNow();
    dodgeSaveRecord(store,job);
    notify('Esquiva '+tName(townBy(job.townId))+': '+reason+' (apoio #'+(job.commandId||'?')+')');
  }
  async function dodgeCancel(store,job,now){
    if(!job.commandId||job.state==='canceling'||job.state==='cancelled')return false;
    if(now>=Number(job.sentAtMs)+600000){
      dodgeAttention(store,job,'A janela de cancelamento de 10 minutos passou');
      return false;
    }
    job.state='canceling';job.cancelRequestedAtMs=now;dodgeSaveRecord(store,job);
    try{
      await action('command_info','cancel_command',{id:Number(job.commandId),town_id:Number(job.townId),nl_init:true},true);
      job.state='cancelled';job.cancelledAtMs=dodgeNow();
      job.estimatedArrivalMs=2*job.cancelledAtMs-(Number(job.startedAtMs)||Number(job.sentAtMs));
      job.error='Cancelamento solicitado e aceito pelo cliente; retorno ainda não confirmado';
      dodgeSaveRecord(store,job);
      log('Esquiva '+tName(townBy(job.townId))+': cancelamento do apoio #'+job.commandId+
        ' aceito; retorno estimado '+new Date(job.estimatedArrivalMs).toLocaleTimeString('pt-BR',{hour12:false}));
      return true;
    }catch(e){
      job.cancelAttempts=(Number(job.cancelAttempts)||0)+1;
      job.error=String(e?.message||e);
      if(job.cancelAttempts>=3||/invalid|expired|too late|not found|already cancelled|não pode|expirad/i.test(job.error)){
        dodgeAttention(store,job,'Cancelamento não confirmado: '+job.error);
      }else{
        job.state='sent';job.retryAfterMs=dodgeNow()+Math.min(30000,job.cancelAttempts*5000);
        dodgeSaveRecord(store,job);
        log('Esquiva: nova tentativa de cancelamento #'+job.commandId+' após '+job.retryAfterMs,'WARN');
      }
      return false;
    }
  }
  async function dodgeDispatch(store,townId,targetId,units,wave,testId=null){
    const now=dodgeNow(),existing=dodgeOutgoing(townId,targetId).map(dodgeMoveId);
    const job={
      id:'ED-'+townId+'-'+Date.now().toString(36),townId,targetId,group:'all',
      units,testId,state:'dispatching',sentAtMs:now,
      firstImpactMs:wave.firstImpactMs,lastImpactMs:wave.lastImpactMs,
      existingIds:existing,commandId:0,retryAfterMs:0,cancelAttempts:0
    };
    dodgeSaveRecord(store,job);
    try{
      const result=await action('town_info','send_units',
        {id:Number(targetId),town_id:Number(townId),type:'support',nl_init:true,...units},Boolean(testId));
      const suppliedId=Number(result?.json?.data?.command_id??result?.json?.command_id??
        result?.command_id??result?.json?.data?.id);
      if(Number.isSafeInteger(suppliedId)&&suppliedId>0)job.commandId=suppliedId;
      job.state='identifying';job.ackAtMs=dodgeNow();dodgeSaveRecord(store,job);
      const found=dodgeFindCommand(job);
      if(found){
        job.commandId=dodgeMoveId(found);
        job.startedAtMs=dodgeStarted(found.data)||job.sentAtMs;
        job.outboundArrivalMs=dodgeArrival(found.data);
        job.state='sent';dodgeSaveRecord(store,job);
      }else if(job.commandId){
        job.startedAtMs=job.sentAtMs;job.state='sent';dodgeSaveRecord(store,job);
      }
      log('Esquiva: apoio único '+tName(townBy(townId))+' → '+tName(townBy(targetId))+
        ' com '+Object.values(units).reduce((sum,x)=>sum+num(x),0)+' unidades; '+(job.commandId?'#'+job.commandId:'identificando comando'));
      return true;
    }catch(e){
      // Uma solicitação incerta pode ter sido enviada: não disparar outra automaticamente.
      job.state='identifying';job.error='Envio sem confirmação: '+String(e?.message||e);
      dodgeSaveRecord(store,job);
      log('Esquiva: '+job.error+'. Não será reenviado automaticamente.','WARN');
      return false;
    }
  }
  function dodgeCleanup(store,now){
    let changed=false;
    for(const [id,j] of Object.entries(store.jobs||{})){
      if(['cancelled','needs_attention'].includes(j.state)&&
        now-Number(j.cancelledAtMs||j.ackAtMs||j.sentAtMs)>7200000){delete store.jobs[id];changed=true;}
    }
    const recent=Object.entries(store.handled||{}).filter(([,ts])=>now-Number(ts)<21600000);
    if(recent.length!==Object.keys(store.handled||{}).length){store.handled=Object.fromEntries(recent);changed=true;}
    if(changed)dodgeWrite(store);
  }
  async function dodgePulse(){
    if(scope!==currentScope()||dodgeBusy||securityWatch()||!dodgeCanOperate())return;
    const previous=dodgeRead();
    if((!config.enabled||!config.modules.dodge)&&!dodgeTracked(previous).length&&!testActive())return;
    if(!dodgeLeader())return;
    dodgeBusy=true;
    try{
      const now=dodgeNow(),store=dodgeRead();
      store.jobs??={};store.handled??={};
      dodgeCleanup(store,now);
      const incoming=dodgeIncoming();
      // Primeiro processar retornos pendentes, inclusive se o usuário desligou o módulo.
      for(const job of dodgeTracked(store)){
        if(job.state==='canceling'){
          if(now-num(job.cancelRequestedAtMs,now)>16000){
            job.state='sent';job.retryAfterMs=now+2000;
            dodgeSaveRecord(store,job);
          }
          continue;
        }
        if(job.state==='dispatching'||job.state==='identifying'){
          const found=dodgeFindCommand(job);
          if(found){
            job.commandId=dodgeMoveId(found);
            job.startedAtMs=dodgeStarted(found.data)||job.sentAtMs;
            job.outboundArrivalMs=dodgeArrival(found.data);
            job.state='sent';dodgeSaveRecord(store,job);
          }else if(job.commandId){
            job.startedAtMs=job.startedAtMs||job.sentAtMs;
            job.state='sent';dodgeSaveRecord(store,job);
          }else if(now-num(job.sentAtMs)>45000){
            dodgeAttention(store,job,'Movimento não identificado após 45 segundos. Confira o apoio no Grepolis');
            continue;
          }else continue;
        }
        if(job.state!=='sent'||num(job.retryAfterMs)>now)continue;
        if(job.forceCancel){await dodgeCancel(store,job,now);return;}
        job.lastImpactMs=dodgeLateAttacks(job,incoming);
        const started=num(job.startedAtMs,job.sentAtMs)||num(job.sentAtMs);
        const plan=dodgeTiming(started,job.lastImpactMs);
        const cancelAtMs=Math.min(plan.cancelAtMs,plan.deadlineMs);
        const returnAtMs=cancelAtMs+(cancelAtMs-started);
        if(job.cancelAtMs!==cancelAtMs||job.returnAtMs!==returnAtMs){
          job.cancelAtMs=cancelAtMs;job.returnAtMs=returnAtMs;
          dodgeSaveRecord(store,job);
        }
        const earlyLanding=Number.isFinite(num(job.outboundArrivalMs,NaN))&&
          num(job.outboundArrivalMs)>0&&num(job.outboundArrivalMs)<=job.cancelAtMs+2500;
        if(earlyLanding){
          job.error='Destino próximo: cancelamento antecipado para não deixar o apoio estacionar';
          job.cancelAtMs=Math.min(job.cancelAtMs,now);
          dodgeSaveRecord(store,job);
          await dodgeCancel(store,job,now);return;
        }
        if(plan.cancelAtMs>plan.deadlineMs){
          job.error='Última onda supera a janela de 10 minutos; cancelamento antecipado';
          log('Esquiva: '+job.error,'WARN');
        }
        if(now>=job.cancelAtMs){
          await dodgeCancel(store,job,now);return;
        }
      }
      if(syncRole()==='standby'||((!config.enabled||!config.modules.dodge)&&!testActive()))return;
      const minLead=15000,lead=dodgeLead(),owned=new Map(towns().map(t=>[Number(t.id),t]));
      for(const [townId,town] of owned){
        if(dodgeTracked(store).some(j=>Number(j.townId)===townId))continue;
        const attacks=incoming.filter(a=>Number(a.townId)===townId&&a.arrivalMs>now&&
          (config.enabled&&config.modules.dodge||a.simulated));
        const first=attacks[0];
        if(!first)continue;
        const before=first.arrivalMs-now;
        if(before>lead||before<minLead||store.handled[first.id])continue;
        const targetId=dodgeDestination(townId,incoming);
        if(!targetId){
          const last=Number(store.lastWarning?.[townId])||0;
          if(now-last>60000){
            store.lastWarning??={};store.lastWarning[townId]=now;dodgeWrite(store);
            log('Esquiva '+tName(town)+': sem destino próprio seguro na mesma ilha','WARN');
          }
          continue;
        }
        const units=Object.assign({},...Object.values(dodgeUnits(town)));
        if(!Object.keys(units).length){
          store.handled[first.id]=now;dodgeWrite(store);continue;
        }
        if(config.dryRun&&!first.simulated){
          if(!dodgePreviewed.has(first.id)){
            dodgePreviewed.add(first.id);
            log('SIMULAÇÃO ESQUIVA '+tName(town)+': apoio único com '+Object.keys(units).length+
              ' tipos, impacto em '+Math.round(before/1000)+' s; cancelamento após última onda');
          }
          continue;
        }
        const lastImpact=Math.max(first.arrivalMs,...attacks.filter(a=>a.arrivalMs-first.arrivalMs<=dodgeWaveGap()).map(a=>a.arrivalMs));
        store.handled[first.id]=now;dodgeWrite(store);
        await dodgeDispatch(store,townId,targetId,units,
          {firstImpactMs:first.arrivalMs,lastImpactMs:lastImpact},first.simulated?first.testId:null);
        return;
      }
    }finally{dodgeBusy=false;}
  }
  function dodgeContent(){
    const now=dodgeNow(), incoming=dodgeIncoming(), store=dodgeRead();
    const src=getSelected();
    const destinations=src?dodgeDestinations(src.id,incoming):[];
    const selected=num(config.dodge.targets?.[src?.id]||0);
    const listed=incoming.filter(x=>x.arrivalMs>now).slice(0,12).map(a=>
      `<div class="city compact"><b>⚔️ ${cleanStr(tName(townBy(a.townId)))}</b><span>${Math.max(0,((a.arrivalMs-now)/1000)).toFixed(1)} s para impacto</span></div>`
    ).join('');
    const records=Object.values(store.jobs||{}).filter(j=>dodgeActive(j)||j.state==='needs_attention'||(j.state==='cancelled'&&now-num(j.cancelledAtMs)<900000)).slice(-12).map(j=>
      `<div class="city"><b>${cleanStr(tName(townBy(j.townId)))} → ${cleanStr(tName(townBy(j.targetId)))}</b>
      <div>${cleanStr(j.group)} · apoio #${cleanStr(j.commandId||'identificando')} · ${cleanStr(j.state)}</div>
      <div class="smallnote">${j.cancelAtMs?'Cancelar às '+new Date(j.cancelAtMs).toLocaleTimeString('pt-BR',{hour12:false}):'Aguardando movimento'}
      ${j.returnAtMs?' · retorno planejado '+new Date(j.returnAtMs).toLocaleTimeString('pt-BR',{hour12:false}):''}</div>
      ${j.error?`<div class="smallnote">${cleanStr(j.error)}</div>`:''}${(dodgeActive(j)||j.state==='needs_attention')&&j.commandId?`<button data-action="dodgeForceCancel" data-job="${cleanStr(j.id)}">Cancelar este apoio agora</button>`:''}</div>`
    ).join('');
    return `${moduleNames()}
      ${section('Esquiva sincronizada por cidade')}
      <p class="smallnote">Envia um apoio com terrestres e/ou navios habilitados antes da onda inimiga. Solicita o cancelamento depois do último impacto com margem de segurança. A chegada das tropas de volta não ocorre em um segundo exato.</p>
      <div class="formrow"><span>Enviar faltando (segundos)</span><input type="number" min="20" max="180" step="5" data-setting="dodge.leadSeconds" value="${dodgeLead()/1000}"></div>
      <div class="formrow"><span>Cancelar após a última onda (segundos)</span><input type="number" min="10" max="90" step="5" data-setting="dodge.returnAfterSeconds" value="${dodgeAfter()/1000}"></div>
      <div class="formrow"><span>Agrupar ataques próximos (segundos)</span><input type="number" min="1" max="60" step="1" data-setting="dodge.waveGapSeconds" value="${config.dodge.waveGapSeconds}"></div>
      <div class="checks"><label><input type="checkbox" data-setting="dodge.land" ${config.dodge.land?'checked':''}> Tropas terrestres</label><label><input type="checkbox" data-setting="dodge.naval" ${config.dodge.naval?'checked':''}> Navios</label></div>
      ${section('Destino do apoio')}
      <div class="formrow"><span>Cidade protegida</span>${selectTown('dodgeSource',src?.id)}</div>
      <div class="formrow"><span>Enviar para</span><select id="dodgeTarget"><option value="0">Automático · mesma ilha</option>${optionList(destinations.map(t=>[t.id,tName(t)]),selected)}</select><button data-action="dodgeSaveTarget">Salvar</button></div>
      <p class="smallnote">${destinations.length?`${destinations.length} cidade(s) disponível(is) na mesma ilha.`:'Nenhuma outra cidade própria na mesma ilha: esquiva não pode enviar apoio terrestre automaticamente.'}</p>
      ${section('Ataques identificados')}
      <div class="cityscroll">${listed||'<p class="smallnote">Nenhum ataque inimigo com horário confirmado agora.</p>'}</div>
      ${section('Apoios e cancelamentos pendentes')}
      <div class="cityscroll">${records||'<p class="smallnote">Nenhuma esquiva em trânsito.</p>'}</div>
      <p class="smallnote">Apoios já enviados continuam sendo acompanhados com o módulo pausado. O Grepolis permite cancelar comandos nos primeiros 10 minutos. CAPTCHA, destino muito próximo ou comando não localizado podem exigir intervenção. Relógio: ${dodgeClock.source}.</p><div class="tools"><button data-action="dodgeExport">Exportar diagnóstico da esquiva</button></div>`;
  }

  function diagReason(id){
    if(securityBlocked())return 'CAPTCHA: operações suspensas até a verificação ser resolvida';
    if(syncRole()==='standby')return 'PC secundário: execução bloqueada';
    if(!connected())return 'Cliente do Grepolis não está pronto';
    if(document.querySelector('iframe[src*="captcha"],.captcha_container,.recaptcha-wrapper'))return 'Verificação de segurança do jogo em andamento';
    if(!config.enabled)return 'Execução geral pausada';
    if(!config.modules[id])return 'Módulo desativado';
    try{
      if(id==='farm'){
        const list=towns().filter(eligibleTown);
        if(!list.length)return 'Nenhuma cidade elegível';
        const eligible=list.filter(t=>farmStorageState(t).known&&!farmStorageState(t).full);
        if(!eligible.length)return list.every(t=>farmStorageState(t).full)?'Todas as cidades com 3 recursos cheios':'Capacidade de armazenamento indisponível';
        if(!models('FarmTownPlayerRelation').length)return 'Nenhuma aldeia carregada pelo cliente';
        return eligible.length+' cidade(s) apta(s); aguarda disponibilidade da aldeia';
      }
      if(id==='trade'){
        if(config.trade.intelligent===true){
          const items=tradeAutoCandidates();
          if(items.length)return items.length+' oportunidade(s) de comércio inteligente';
          return 'Sem rota manual disponível ou falta elegível; conferir metas, reserva, comerciantes, capacidade e cooldown';
        }
        return config.trade.routes?.length?'Rotas cadastradas; aguarda recursos, comerciantes ou intervalo':'Sem rotas manuais; ative comércio inteligente ou cadastre rota';
      }
      if(id==='smartQueue'){
        if(!queueJobs().length)return 'Nenhuma meta cadastrada na FILA';
        const plan=queueCandidates();
        if(plan.ready.length)return plan.ready.length+' tarefa(s) pronta(s)';
        const pending=plan.rows.filter(x=>x.state==='wait').length;
        return pending?pending+' tarefa(s) aguardando recursos, nível, população ou espaço':'Metas concluídas ou bloqueadas';
      }
      if(id==='recruit')return Object.keys(config.recruit.targets||{}).length?'Aguardando lote mínimo, recursos e espaço no quartel/porto':'Sem metas de tropas';
      if(id==='build')return Object.keys(config.build.targets||{}).length?'Aguardando recursos, população ou espaço de construção':'Sem metas de construção';
      if(id==='research')return Object.keys(config.research.queue||{}).length?'Aguardando pontos, academia e recursos':'Sem pesquisas planejadas';
      if(id==='commands')return config.commands.jobs?.length?'Comandos cadastrados; aguardando horário':'Nenhum comando agendado';
      if(id==='dodge'){
        const store=dodgeRead(),pending=dodgeTracked(store).length;
        const attention=Object.values(store.jobs||{}).filter(j=>j.state==='needs_attention').length;
        if(attention)return attention+' apoio(s) de esquiva exigem atenção manual';
        if(pending)return pending+' apoio(s) sendo acompanhados para cancelamento';
        return dodgeIncoming().length?'Ataque detectado; aguardando janela de saída':'Nenhum ataque confirmado';
      }
      if(id==='ruralTrade'||id==='ruralUpgrade'||id==='ruralUnlock')return 'Aguardando aldeias, recursos ou disponibilidade';
      if(id==='bootcamp')return 'Aguardando nível do acampamento, tropas ou recarga';
      if(id==='quests'){
        const all=islandQuestAll().map(q=>islandQuestPlan(islandQuestInfo(q)));
        if(!all.length)return 'Nenhuma missão de ilha carregada pelo cliente';
        const actionable=all.filter(x=>['reward','action','build','recruit','research'].includes(x.type)).length;
        return actionable?String(actionable)+' missão(ões) com próxima etapa identificada':
          'Objetivos ainda sem ação compatível; veja MISSÕES';
      }
      return 'Aguardando condição do jogo ou próximo ciclo';
    }catch(e){return 'Dados insuficientes: '+String(e.message||e).slice(0,100);}
  }
  const diagMark=(id,kind,detail='')=>{
    const rt=readRuntime();rt.diagnostics??={};
    const before=rt.diagnostics[id]||{};
    const now=Date.now();
    rt.diagnostics[id]={
      lastAt:now,lastState:kind,lastMessage:String(detail).slice(0,240),
      lastSuccessAt:kind==='done'&&!config.dryRun?now:before.lastSuccessAt||0,
      runs:Math.min(1000000,num(before.runs)+1),
      successes:Math.min(1000000,num(before.successes)+(kind==='done'&&!config.dryRun?1:0)),
      errors:Math.min(1000000,num(before.errors)+(kind==='error'?1:0)),
      consecutiveErrors:kind==='error'?num(before.consecutiveErrors)+1:0
    };
    writeRuntime(rt);
  };
  function diagSnapshot(){
    const rt=readRuntime(),now=Date.now();
    return Object.keys(MODULES).map(id=>{
      const data=rt.diagnostics?.[id]||{};
      const enabled=Boolean(config.modules[id]);
      const status=securityBlocked()?'captcha':syncRole()==='standby'?'secondary':
        !connected()?'offline':
        !config.enabled?'paused':!enabled?'disabled':
        config.dryRun?'simulation':
        data.lastState==='error'&&now-num(data.lastAt)<1800000?'error':'ready';
      return {id,name:MODULES[id][0],enabled,status,...data,
        reason:diagReason(id),
        nextAt:Math.max(0,num(nextRun[id])-now)};
    });
  }
  const diagContent=()=>{
    const rows=diagSnapshot(),err=rows.filter(x=>x.status==='error'),active=rows.filter(x=>x.enabled);
    const badge={captcha:'⚠ CAPTCHA',secondary:'💤 Secundário',offline:'🔌 Sem cliente',paused:'⏸ Pausado',
      disabled:'○ Desativado',simulation:'🧪 Simulação',error:'⚠ Falha recente',ready:'✓ Acompanhando'};
    const format=ms=>ms?new Date(ms).toLocaleString('pt-BR'):'Nenhuma';
    return `${section('Diagnóstico automático')}
      <div class="helpbox">Inspeciona o estado de cada módulo, rastreia tentativas, ações executadas e falhas locais. Não envia comandos ao Grepolis para diagnosticar. ${securityBlocked()?'<b>⚠ CAPTCHA detectado: operações suspensas.</b>':''}</div>
      <div class="stats"><div><b>${active.length}</b>Módulos ligados</div><div><b>${err.length}</b>Falhas recentes</div><div><b>${towns().length}</b>Cidades no cliente</div><div><b>${syncRole()==='standby'?'2º':'1º'}</b>Modo do PC</div></div>
      <div class="tools"><button data-action="diagRefresh">Reavaliar agora</button><button data-action="diagExport">Exportar diagnóstico</button><button data-action="diagReset">Limpar contadores</button></div>
      <div class="cityscroll" style="max-height:420px">
        ${rows.map(x=>`<div class="city"><b>${cleanStr(x.name)}</b> <span>${badge[x.status]||x.status}</span>
          <div class="smallnote">${cleanStr(x.reason)}</div>
          <div class="smallnote">Última tentativa: ${format(x.lastAt)} · Resultado: ${cleanStr(x.lastState||'sem execução')}</div>
          <div class="smallnote">Execuções ${num(x.runs)} · Ações ${num(x.successes)} · Erros ${num(x.errors)}
          ${x.lastMessage?' · '+cleanStr(x.lastMessage):''}</div></div>`).join('')}
      </div>
      <p class="smallnote">Se um módulo não executou uma ação, isso não é necessariamente falha: pode estar aguardando recursos, tempo ou condição. Em modo simulação, ações não são contabilizadas como executadas no jogo. Dados de diagnóstico são armazenados somente neste PC.</p>`;
  };
  const handlers={farm,build,smartQueue,finishFree,recruit,research,trade,ruralTrade,ruralUnlock,ruralUpgrade,culture,bootcamp,quests,banditRewards,cave,commands,alerts};
  const lock = () => {
    const now=Date.now();
    try{
      const current=JSON.parse(localStorage.getItem(LOCK)||'{}');
      if(current.owner && current.owner!==instanceId && current.until>now)return false;
    }catch{}
    localStorage.setItem(LOCK,JSON.stringify({owner:instanceId,until:now+16000}));
    return true;
  };
  const unlock=()=>{try{if(JSON.parse(localStorage.getItem(LOCK)||'{}').owner===instanceId)localStorage.removeItem(LOCK)}catch{}};
  const tick=async()=>{
    health.lastHeartbeat=Date.now();
    if(connected())health.lastClientReadyAt=Date.now();
    rescope();
    if(running){health.lastTickResult='aguardando ciclo anterior';return;}
    if(!canRun()){
      health.lastTickResult=!connected()?'cliente do jogo indisponível':syncRole()==='standby'?'PC secundário':!config.enabled?'bot pausado':securityBlocked()?'CAPTCHA ativo':'ciclo bloqueado';
      return;
    }
    if(!lock()){health.lastTickResult='outra aba executando';return;}
    health.lastTickResult='motor de automação ativo';
    running=true;
    try {
      const now=Date.now();
      const order=['commands','alerts','finishFree','smartQueue','banditRewards','quests','bootcamp','ruralUnlock','ruralUpgrade','farm','build','recruit','research','trade','ruralTrade','culture','cave'];
      for(const id of order){
        if(!config.modules[id] || num(nextRun[id])>now)continue;
        if(id!=='commands'&&id!=='alerts'){
          const pace=pacingInfo();
          if(pace.remainingMs>0){health.lastTickResult='aguardando limite de solicitações';break;}
        }
        nextRun[id]=now+Math.max(2,num(config.intervals[id],MODULES[id][2]))*1000;
        try{
          const did=await handlers[id]();
          diagMark(id,did?'done':'wait',did?(config.dryRun?'Execução simulada':'Ação enviada') : diagReason(id));
          if(did){if(id!=='commands')nextRun[id]=Date.now()+Math.max(5,num(config.intervals[id],MODULES[id][2]))*1000;break;}
        }catch(e){
          if(e?.code==='GP_PACING'){
            diagMark(id,'wait',e.message);
            nextRun[id]=Date.now()+Math.min(60000,Math.max(1000,num(e.waitMs,5000)));
            health.lastTickResult='aguardando limite de solicitações';
            break;
          }
          if(securityBlocked()){
            diagMark(id,'wait','CAPTCHA detectado: aguardando verificação');
            nextRun[id]=Date.now()+5000;break;
          }
          diagMark(id,'error',e.message);
          log(`${MODULES[id][0]}: ${e.message}`,'ERROR');
          nextRun[id]=Date.now()+60000;break;
        }
      }
    }finally{running=false;unlock();}
  };
  let selectedCity='';

  // F5 automático apenas quando a página e os comandos estão em estado seguro.
  // O prazo fica no runtime por conta/mundo e sobrevive ao próprio reload.
  const reloadMinutes=()=>Math.max(10,Math.min(720,Math.floor(num(config.autoReload?.minutes,30))));
  const reloadWindow=()=>Math.max(60,Math.min(600,Math.floor(num(config.autoReload?.safeWindowSeconds,180))))*1000;
  function reloadState(){
    return readRuntime().autoReload||{};
  }
  function reloadSchedule(reset=false){
    const rt=readRuntime(),at=Date.now(),period=reloadMinutes()*60000;
    if(reset||!Number.isFinite(Number(rt.autoReload?.nextAt))||Number(rt.autoReload?.nextAt)<=0||
      Number(rt.autoReload.nextAt)>at+period){
      rt.autoReload={...rt.autoReload,nextAt:at+period};
      writeRuntime(rt);
    }
    return rt.autoReload;
  }
  function reloadBlockReason(now=Date.now()){
    if(config.autoReload?.enabled!==true)return 'F5 automático desligado';
    if(!config.enabled)return 'Bot pausado';
    if(syncRole()!=='primary')return 'PC secundário';
    if(!connected())return 'Grepolis ainda não está disponível';
    if(securityWatch())return 'CAPTCHA visível ou aguardando liberação';
    if(pacingInfo().enabled&&pacingInfo().cooldownUntil>Date.now())return 'Pausa de solicitações após CAPTCHA';
    if(running||dodgeBusy||inFlightActions>0)return 'Ação em andamento';
    if(shadow?.activeElement?.matches?.('input,textarea,select'))return 'Editando uma configuração';
    try{
      if(testRead().active?.state==='active')return 'Teste de esquiva em andamento';
      if(dodgeTracked(dodgeRead()).length)return 'Apoio/esquiva ainda pendente';
      const windowMs=reloadWindow();
      if(dodgeIncoming().some(a=>a.arrivalMs>=now-windowMs/2&&a.arrivalMs<=now+windowMs))
        return 'Ataque chegando em breve';
      const fired=readFired();
      if((config.commands?.jobs||[]).some(job=>{
        if(job.enabled===false)return false;
        if(fired?.[job.id]?.status==='pendente')return true;
        if(fired?.[job.id])return false;
        const at=Date.parse(job.sendAt);
        return Number.isFinite(at)&&at>=now-windowMs/2&&at<=now+windowMs;
      }))return 'Comando agendado próximo do horário';
    }catch(e){return 'Aguardando dados de movimentação: '+e.message;}
    return '';
  }
  function autoReloadPulse(){
    if(scope!==currentScope()||config.autoReload?.enabled!==true||!config.enabled||syncRole()!=='primary')return false;
    const state=reloadSchedule(),now=Date.now();
    if(now<Number(state.nextAt))return false;
    const reason=reloadBlockReason(now);
    if(reason){
      if(state.lastPostpone!==reason){
        const rt=readRuntime();
        rt.autoReload={...rt.autoReload,lastPostpone:reason};
        writeRuntime(rt);
        log('F5 automático adiado: '+reason);
      }
      return false;
    }
    const rt=readRuntime();
    rt.autoReload={...rt.autoReload,lastReloadAt:now,nextAt:now+reloadMinutes()*60000,
      lastPostpone:''};
    writeRuntime(rt);
    log('F5 automático: recarregando o Grepolis após '+reloadMinutes()+' minutos');
    location.reload();
    return true;
  }
  const STATUS=()=>securityBlocked()?'⚠ CAPTCHA — operações suspensas':connected()?`${towns().length} cidades · ${syncRole()==='standby'?'SECUNDÁRIO (pausado)':config.enabled?'executando':'pausado'} · ${config.dryRun?'SIMULAÇÃO':'AO VIVO'}`:'Aguardando cliente do jogo';
  const toggle=(k,title)=>`<label class="mod"><input type="checkbox" data-module="${k}" ${config.modules[k]?'checked':''}><span>${title}</span><small>${num(config.intervals[k])}s</small></label>`;
  const optionList=(list,chosen)=>list.map(([v,label])=>`<option value="${cleanStr(v)}" ${String(chosen)===String(v)?'selected':''}>${cleanStr(label)}</option>`).join('');
  const selectTown=(id,selected='')=>`<select id="${id}">${optionList(towns().map(t=>[t.id,`${tName(t)} (#${t.id})`]),selected)}</select>`;
  const section = title => `<div class="sect">${title}</div>`;
  const moduleNames=()=>Object.entries(MODULES).filter(([k,p])=>p[1]===config.ui.tab).map(([k,p])=>toggle(k,p[0])).join('');
  const paneModule=k=>toggle(k,MODULES[k][0]);


  function healthStorage(){
    if(health.storageCache&&Date.now()-health.storageCache.at<30000)return health.storageCache;
    const key='grepopilot:health-probe:'+location.host;
    let ok=false,error='';
    try{
      const v='test-'+Date.now();localStorage.setItem(key,v);
      ok=localStorage.getItem(key)===v;localStorage.removeItem(key);
      if(!ok)error='Leitura e gravação do armazenamento local não coincidem';
    }catch(e){error=String(e.message||e);}
    health.storageCache={at:Date.now(),ok,error};
    return health.storageCache;
  }
  const healthCheck=(id,title,status,detail,fix='')=>({id,title,status,detail,fix});
  function healthSnapshot(){
    const ready=connected(),now=Date.now(),storage=healthStorage();
    const n=Object.values(config.modules||{}).filter(Boolean).length;
    const player=Number(W.Game?.player_id||0);
    const modelOK=typeof W.MM?.getModels==='function' && typeof W.MM?.getOnlyCollectionByName==='function';
    const townsOK=W.ITowns?.towns&&typeof W.ITowns.towns==='object';
    const ajaxOK=typeof W.gpAjax?.ajaxPost==='function';
    const role=syncRole();
    const checks=[
      healthCheck('script','GrepoPilot carregado','ok','v0.9.4 · inicialização em '+new Date(health.startedAt).toLocaleTimeString('pt-BR')),
      healthCheck('page','Página do Grepolis',location.protocol==='https:'&&/^\/game(?:\/|$)/.test(location.pathname)?'ok':'error',
        String(location.host)+String(location.pathname||''),'Abra a página do jogo em https://SEU-MUNDO.grepolis.com/game/'),
      healthCheck('api','Acesso aos dados do jogo',W!==window?'ok':'warn',
        W!==window?'Ponte com a página disponível':'Usando contexto do próprio script; dados do jogo podem ficar isolados',
        'No Tampermonkey, confira se a extensão pode executar scripts nesta página'),
      healthCheck('scope','Perfil exclusivo da conta',player>0&&scope===currentScope()?'ok':'warn',
        player>0&&scope===currentScope()?'Conta e mundo isolados: '+scope:'Aguardando troca segura de perfil',
        'Aguarde o carregamento ou abra VERIFICAR novamente'),
      healthCheck('player','Conta identificada',player>0?'ok':'error',
        player>0?'Jogador #'+player:'Aguardando Game.player_id do Grepolis',
        'Entre no mundo e aguarde terminar o carregamento; depois clique em Verificar novamente'),
      healthCheck('towns','Cidades carregadas',townsOK&&Object.values(W.ITowns.towns).some(t=>t?.id)?'ok':'error',
        townsOK?Object.values(W.ITowns.towns).filter(t=>t?.id).length+' cidade(s) disponíveis':'ITowns não disponível',
        'Abra a visão de cidade no jogo e aguarde a sincronização do cliente'),
      healthCheck('models','Modelos internos do jogo',modelOK?'ok':'error',
        modelOK?'Coleções MM acessíveis':'Modelos do Grepolis ainda não estão acessíveis',
        'Atualize a página do jogo quando estiver totalmente carregado'),
      healthCheck('ajax','Canal de comandos',ajaxOK?'ok':'error',
        ajaxOK?'gpAjax.ajaxPost disponível (sem enviar comandos no teste)':'Canal gpAjax não disponível',
        'Confira se o cliente do Grepolis terminou de carregar'),
      healthCheck('storage','Armazenamento local',storage.ok?'ok':'error',
        storage.ok?'Leitura/gravação OK':storage.error,'Verifique cookies/dados locais do site e modo privado do navegador'),
      healthCheck('ui','Painel do GrepoPilot',host?.isConnected&&Boolean(shadow?.querySelector('#gp-app'))?'ok':'error',
        host?.isConnected?'Painel anexado à página':'Painel não foi anexado',
        'Clique em Reabrir painel ou recarregue o Grepolis'),
      healthCheck('boot','Recuperação da inicialização',health.mountErrors?'warn':'ok',
        health.mountErrors?health.mountErrors+' tentativa(s) de montar o painel falharam'+(health.lastMountError?' · '+health.lastMountError:''):'Nenhum erro de inicialização',
        'Reabra o painel ou atualize o jogo; o script tenta recuperar a montagem automaticamente'),
      healthCheck('render','Erros recentes do painel',health.lastRenderError?'warn':'ok',
        health.lastRenderError||'Nenhum erro de renderização registrado',
        'Abra a aba VERIFICAR e exporte o relatório; um erro anterior pode afetar somente uma aba'),
      healthCheck('role','Computador principal',role==='primary'?'ok':'warn',
        role==='primary'?'PC principal':'PC secundário: automações bloqueadas',
        'Em AJUSTES → Perfil entre computadores, escolha Principal somente no PC que executará as rotinas'),
      healthCheck('enabled','Execução geral',config.enabled?'ok':'warn',
        config.enabled?'INICIAR ativado':'Bot pausado','Clique em INICIAR no rodapé do GrepoPilot'),
      healthCheck('modules','Módulos ativos',n>0?'ok':'warn',
        n+' módulo(s) habilitado(s)','Ative os módulos desejados em suas abas'),
      healthCheck('simulation','Modo de execução',config.dryRun?'warn':'ok',
        config.dryRun?'Simulação ativa: nenhuma ação real enviada':'Modo ao vivo selecionado',
        'Em AJUSTES desative Modo simulação para executar ações reais'),
      healthCheck('captcha','Verificação do jogo',securityBlocked()?'warn':'ok',
        securityBlocked()?'CAPTCHA detectado: aguardando resolução':'Nenhum CAPTCHA detectado',
        'Resolva a verificação diretamente no jogo'),
      healthCheck('heartbeat','Verificação do motor',health.lastHeartbeat&&now-health.lastHeartbeat<20000?'ok':'warn',
        health.lastHeartbeat?'Último ciclo há '+Math.floor((now-health.lastHeartbeat)/1000)+'s · '+health.lastTickResult:'Ainda não houve ciclo',
        'Mantenha esta aba aberta por alguns segundos; verifique se o navegador suspendeu a aba')
    ];
    const critical=checks.filter(x=>x.status==='error');
    const warnings=checks.filter(x=>x.status==='warn');
    const active=ready&&critical.length===0&&config.enabled&&role==='primary'&&!config.dryRun&&!securityBlocked()&&n>0;
    return {version:'0.9.4',time:new Date(now).toISOString(),world:location.host,
      playerId:player||null,userAgent:typeof navigator!=='undefined'?navigator.userAgent:'',
      active,critical:critical.length,warnings:warnings.length,
      runtime:{uptimeSeconds:Math.floor((now-health.startedAt)/1000),
        lastHeartbeatAt:health.lastHeartbeat?new Date(health.lastHeartbeat).toISOString():null,
        lastClientReadyAt:health.lastClientReadyAt?new Date(health.lastClientReadyAt).toISOString():null,
        lastTickResult:health.lastTickResult,mountErrors:health.mountErrors,
        lastMountError:health.lastMountError,lastRenderError:health.lastRenderError,
        moduleRuns:Object.fromEntries(Object.entries(readRuntime().diagnostics||{}).map(([id,d])=>[id,{runs:num(d.runs),successes:num(d.successes),errors:num(d.errors),lastState:d.lastState,lastMessage:d.lastMessage}]))},
      checks};
  }
  const healthContent=()=>{
    const h=healthSnapshot();
    const badge={ok:'✅ OK',warn:'🟠 ATENÇÃO',error:'🔴 ERRO'};
    const rows=h.checks.map(x=>`<div class="city"><b>${cleanStr(x.title)}</b> <span>${badge[x.status]}</span>
      <div class="smallnote">${cleanStr(x.detail)}</div>
      ${x.status!=='ok'&&x.fix?`<div class="smallnote">Como corrigir: ${cleanStr(x.fix)}</div>`:''}</div>`).join('');
    return `${section('Verificar instalação e funcionamento')}
      <div class="helpbox"><b>${h.critical?'🔴 Cliente ou instalação incompleta':h.active?'✅ Pronto para operar':h.warnings?'🟠 Script carregado; ajustes necessários':'✅ Verificação concluída'}</b>
      <div class="smallnote">Versão ${h.version} · ${cleanStr(h.world)} · ${h.critical} erro(s), ${h.warnings} atenção(ões). A verificação não faz envios ao jogo.</div></div>
      <div class="tools"><button class="primary" data-action="healthRefresh">Verificar novamente</button>
        <button data-action="healthCopy">Copiar relatório</button>
        <button data-action="healthDownload">Salvar relatório .json</button>
        <button data-action="healthReopen">Reabrir painel</button></div>
      ${section('Diagnóstico por componente')}
      <div class="cityscroll" style="max-height:450px">${rows}</div>
      ${section('Se o painel não aparece em outro PC')}
      <p class="smallnote">1. Instale o Tampermonkey e o GrepoPilot neste navegador. 2. Em chrome://extensions (ou edge://extensions), abra Tampermonkey → Detalhes e ative <b>Permitir scripts de usuário</b> e acesso ao site. 3. No Tampermonkey, confirme que o GrepoPilot está habilitado para este endereço. 4. Recarregue o jogo com Ctrl+F5. Se o painel não aparece, o próprio script não consegue executar esta verificação.</p>
      <p class="smallnote">ON/OFF e cada módulo são independentes: status OK do motor não significa que o jogo tenha uma ação disponível. Confira também a aba DIAG e os registros LOG.</p>`;
  };
  const dashboard=()=>{
    const r=ruralStatus();const q=questRows();const camp=W.MM?.getModelByNameAndPlayerId?.('PlayerAttackSpot');
    const enabled=Object.entries(config.modules).filter(([,v])=>v).length;
    return `${!config.onboarding?.completed?'<div class="helpbox">Primeiro acesso? Abra COMEÇAR para configurar esta conta.</div>':''}${section('Visão geral')}<div class="stats"><div><b>${towns().length}</b>Cidades</div><div><b>${r.unlocked}/${r.rows.length}</b>Aldeias</div><div><b>${r.bp??'—'}</b>Pontos de batalha</div><div><b>${q.length}</b>Missões prontas</div></div>
      <div class="helpbox">1. Escolha uma aba abaixo. 2. Ative as funções desejadas. 3. Defina os modelos e as metas. 4. Ative <b>Iniciar</b> na barra inferior.${config.dryRun?' <b>Modo simulação ativo.</b>':''}</div>
      ${section('Acesso rápido')}<div class="quick">${[['CIDADES','🏛️ Modelos de cidades'],['ALDEIAS','🏡 Evoluir e desbloquear'],['TROPAS','⚔️ Modelos de tropas'],['MISSÕES','🎁 Recompensas'],['COMBATE','🏹 Acampamento e ataques'],['ECONOMIA','🌾 Coleta e comércio']].map(([tab,name])=>`<button data-tab="${tab}">${name}</button>`).join('')}</div>
      ${section('Acampamento')}<div class="smallnote">${camp ? `Fase ${cleanStr(String(camp.getLevel?.()??'?'))} · ${camp.hasReward?.()?'recompensa disponível':num(camp.getCooldownDuration?.())>0?'aguardando '+num(camp.getCooldownDuration?.())+'s':'pronto para ataque'}`:'Dados do acampamento indisponíveis'}</div>
      ${section('Módulos ligados')}<div class="smallnote">${enabled} de ${Object.keys(MODULES).length} ativos · ${Object.entries(config.modules).filter(([,v])=>v).map(([k])=>cleanStr(MODULES[k][0])).join(' · ')||'Ative um módulo em sua aba.'}</div>`;
  };
  const cardCity=t=>{
    const r=resource(t);
    return `<div class="city"><b>${cleanStr(tName(t))}</b> <span>#${t.id}</span><div>🌲 ${Math.floor(num(r.wood)).toLocaleString('pt-BR')}　🪨 ${Math.floor(num(r.stone)).toLocaleString('pt-BR')}　🪙 ${Math.floor(num(r.iron)).toLocaleString('pt-BR')}　👥 ${num(r.population)}</div></div>`;
  };
  const getSelected=()=>{
    if(!selectedCity || !townBy(selectedCity))selectedCity=String(towns()[0]?.id||'');
    return townBy(selectedCity);
  };
  const cityContent=()=>{
    const t=getSelected(),building=t?.buildings?.()?.attributes||{};
    const researchList=(config.research.queue[selectedCity]||[]).join(', ');
    return `${moduleNames()}${section('Cidades e recursos')}
      <div class="cityscroll">${towns().map(cardCity).join('')||'<p>Sem dados de cidades.</p>'}</div>
      ${section('Modelos prontos de cidade')}
      <div class="formrow"><span>Cidade</span>${selectTown('citySelect',selectedCity)}</div>
      <div class="formrow"><span>Modelo</span><select id="cityTemplate">${optionList(Object.entries(CITY_TEMPLATES).map(([k,p])=>[k,p.title]))}</select></div>
      <div class="formrow"><span>Criatura mítica</span><select id="profileMythUnit"><option value="">Escolher unidade do deus</option>${optionList(mythUnits(t).map(k=>[k,k]))}</select></div>
      <div class="tools"><button data-action="previewProfile">Prévia</button><button class="primary" data-action="applyProfile">Aplicar modelo</button></div>
      <div class="smallnote">Substitui as metas de edifícios e tropas desta cidade; mantém as configurações das outras. Divindade atual: ${cleanStr(godOf(t)||'não identificada')}. ${config.cityProfiles?.[selectedCity]?`Modelo aplicado: ${cleanStr(CITY_TEMPLATES[config.cityProfiles[selectedCity]]?.title||config.cityProfiles[selectedCity])}`:''}</div>
      ${section('Metas por cidade')}
      <div class="formrow"><span>Edifício</span><select id="buildingType">${optionList(BUILDINGS.map(k=>[k,`${k} (nível ${num(building[k])})`]))}</select><input id="buildingTarget" type="number" min="0" max="50" value="10" class="tiny"><button data-action="setBuild">Salvar</button></div>
      <div class="smallnote">Metas existentes: ${cleanStr(JSON.stringify(config.build.targets[selectedCity]||{}))}</div>
      <div class="formrow"><span>Pesquisar</span><input id="researchQueue" value="${cleanStr(researchList)}" placeholder="booty, architecture"><button data-action="setResearch">Salvar</button></div>
      ${section('Conclusão grátis (obras)')}
      <div class="smallnote">Quando faltar menos de 5 minutos, conclui a primeira ordem da fila. Usa margem de segurança de 15 segundos (285 s) e não conclui tropas. Ative o módulo ⏱️ acima.</div>
      <div class="formrow"><span>Segundos máximos</span><input type="number" min="1" max="285" step="1" data-setting="finishFree.maxRemainingSeconds" value="${config.finishFree.maxRemainingSeconds}"></div>
      ${section('Cultura')}
      <div class="checks">${[['festival','Festival'],['triumph','Triunfo'],['theater','Teatro']].map(([k,n])=>`<label><input type="checkbox" data-culture="${k}" ${config.culture[k]?'checked':''}>${n}</label>`).join('')}</div>`;
  };
  const villagesContent=()=>{
    const info=ruralStatus(),target=Math.max(1,Math.min(6,num(config.ruralUpgrade.targetLevel,3)));
    const islands=[...new Set(info.rows.map(r=>r.islandKey))].length;
    const table=info.rows.map(r=>{
      const cost=r.unlocked?villageCost(r,'upgrade'):villageCost(r,'unlock',info.unlocked);
      const label=!r.unlocked?'🔒 Bloqueada':r.pending?'⏳ Melhorando':r.level>=6?'✅ Nível máximo':r.level>=target?'✅ Meta atingida':'⬆️ Pronta';
      return `<div class="village"><div><b>${cleanStr(r.name)}</b><small>ilha ${cleanStr(r.islandKey)} · cidade ${r.townId}</small></div><span>Nv. ${r.level}/6</span><span>${label}</span><small>${!r.pending&&r.level<6?`Custo: ${cost} PB`:'—'}</small></div>`;
    }).join('');
    return `${moduleNames()}<div class="stats"><div><b>${info.unlocked}</b>Desbloqueadas</div><div><b>${info.locked}</b>Bloqueadas</div><div><b>${islands}</b>Ilhas</div><div><b>${info.bp??'—'}</b>Pontos de batalha</div></div>
      ${section('Desbloqueio automático')}<p class="smallnote">Conquista aldeias ainda bloqueadas nas ilhas das suas cidades quando houver pontos de batalha suficientes. O custo é verificado antes do comando.</p>
      ${section('Evolução automática')}<div class="formrow"><span>Elevar até o nível</span><select data-setting="ruralUpgrade.targetLevel">${optionList([[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']],target)}</select></div>
      <p class="smallnote">Melhora primeiro as aldeias de menor nível. Ignora melhorias em andamento e aldeias já no nível escolhido. Não confunde o nível da aldeia com o progresso da relação.</p>
      ${section('Aldeias detectadas')}<div class="villages">${table||'<p class="smallnote">Ainda não foi possível carregar as aldeias do cliente.</p>'}</div>
      ${section('Trocas com aldeias')}<div class="formrow"><span>Trocar por</span><select data-setting="ruralTrade.wanted">${optionList([['wood','Madeira'],['stone','Pedra'],['iron','Ferro']],config.ruralTrade.wanted)}</select></div>
      <div class="formrow"><span>Relação mínima</span><input type="number" data-setting="ruralTrade.minRatio" step="0.05" min="0" value="${config.ruralTrade.minRatio}"></div>
      ${paneModule('ruralTrade')}`;
  };
  const economyContent=()=>`${moduleNames()}
    ${section('Coleta rural')}
    <div class="formrow"><span>Duração</span><select data-setting="farm.duration">${optionList([[5,'5 min'],[10,'10 min'],[20,'20 min']],config.farm.duration)}</select><label><input type="checkbox" data-setting="farm.captainBulk" ${config.farm.captainBulk?'checked':''}> Cap. em massa</label></div>
    <p class="smallnote">Coleta pausada por cidade somente quando madeira, pedra e ferro estão todos em 100% da capacidade. Assim que qualquer um baixar, a coleta volta no próximo ciclo. Funciona também com Capitão.</p>
    <div class="cityscroll" style="max-height:185px">${towns().filter(eligibleTown).map(t=>{
      const f=farmStorageState(t),v=f.amounts;
      const label=!f.known?'⚠ Capacidade indisponível':f.full?'⏸ Pausada · 3 recursos cheios':'▶ Pronta · há espaço no armazém';
      return `<div class="city"><b>${cleanStr(tName(t))}</b> <span>${label}</span><div class="smallnote">🌲 ${Number.isFinite(v.wood)?Math.floor(v.wood):'?'} · 🪨 ${Number.isFinite(v.stone)?Math.floor(v.stone):'?'} · 🪙 ${Number.isFinite(v.iron)?Math.floor(v.iron):'?'} / ${f.known?Math.floor(f.cap):'?'}</div></div>`;
    }).join('')||'<p class="smallnote">Nenhuma cidade disponível.</p>'}</div>
    ${section('Comércio inteligente entre cidades')}
    <div class="checks"><label><input type="checkbox" data-setting="trade.intelligent" ${config.trade.intelligent?'checked':''}> Distribuir automaticamente para cidades com metas bloqueadas por recursos</label></div>
    <div class="formrow"><span>Reserva mínima por recurso na origem</span><input type="number" min="0" step="100" data-setting="trade.minReserve" value="${config.trade.minReserve}"></div>
    <div class="formrow"><span>Limite do armazém no destino (fração)</span><input type="number" min="0.1" max="1" step="0.05" data-setting="trade.maxFill" value="${config.trade.maxFill}"></div>
    <div class="formrow"><span>Carga mínima no comércio inteligente</span><input type="number" min="100" step="50" data-setting="trade.minCargo" value="${config.trade.minCargo}"></div>
    <div class="formrow"><span>Intervalo entre envios (min)</span><input type="number" min="1" max="30" data-setting="trade.cooldownMinutes" value="${config.trade.cooldownMinutes}"></div>
    <p class="smallnote">Calcula déficits para a próxima construção, pesquisa ou lote de tropas, respeita comerciantes disponíveis, reserva, armazém e entregas recentes. Rotas manuais têm prioridade. Cidades sem metas não recebem comércio inteligente automaticamente.</p>
    ${config.trade.intelligent?`
      ${section('Oportunidades encontradas agora')}
      <div class="cityscroll" style="max-height:180px">
      ${tradeAutoCandidates().slice(0,7).map(x=>`<div class="city"><b>${cleanStr(tName(townBy(x.from)))} → ${cleanStr(tName(townBy(x.to)))}</b>
      <div class="smallnote">🌲 ${x.cargo.wood} · 🪨 ${x.cargo.stone} · 🪙 ${x.cargo.iron} · total ${x.total}</div>
      <div class="smallnote">Meta: ${cleanStr(x.reason)}</div></div>`).join('')||'<p class="smallnote">Nenhuma transferência necessária/possível agora. Confira metas, recursos, comerciantes ou intervalo.</p>'}</div>`:''}
    ${section('Rotas manuais (prioritárias)')}
    <div class="formrow"><span>Origem</span>${selectTown('routeFrom')}</div>
    <div class="formrow"><span>Destino</span>${selectTown('routeTo',towns()[1]?.id)}</div>
    <div class="formrow mini"><span>Madeira</span><input type="number" id="routeWood" value="1000" min="0"><span>Pedra</span><input type="number" id="routeStone" value="1000" min="0"><span>Ferro</span><input type="number" id="routeIron" value="1000" min="0"></div>
    <button class="primary" data-action="addRoute">Adicionar rota</button>
    ${config.trade.routes.map((r,i)=>`<div class="city compact">${cleanStr(tName(townBy(r.from)))} → ${cleanStr(tName(townBy(r.to)))} · ${num(r.wood)}/${num(r.stone)}/${num(r.iron)} <button data-remove-route="${i}">×</button></div>`).join('')}
    ${section('Gruta')}
    <div class="formrow"><span>Ferro mínimo</span><input type="number" data-setting="cave.minIron" value="${config.cave.minIron}"><span>Reserva</span><input type="number" data-setting="cave.keepIron" value="${config.cave.keepIron}"></div>`;
  const troopsContent=()=>{
    const t=getSelected();const unitNames=Object.keys(W.GameData?.units||{}).filter(k=>typeof W.GameData.units[k]==='object');
    return `${moduleNames()}
    ${section('Modelos de tropas por cidade')}
    <div class="formrow"><span>Cidade</span>${selectTown('citySelect',selectedCity)}</div>
    <div class="formrow"><span>Modelo de tropa</span><select id="troopTemplate">${optionList(Object.entries(TROOP_TEMPLATES).map(([k,v])=>[k,v.title]))}</select></div>
    <div class="formrow"><span>Criatura do deus</span><select id="troopMythUnit"><option value="">Escolha a criatura</option>${optionList(mythUnits(t).map(k=>[k,k]))}</select></div>
    <div class="tools"><button data-action="previewTroops">Ver modelo</button><button class="primary" data-action="applyTroops">Aplicar tropas</button></div>
    <p class="smallnote">Define somente as metas de recrutamento, sem alterar edifícios ou pesquisas. Modelo atual: ${cleanStr(TROOP_TEMPLATES[config.troopProfiles?.[selectedCity]]?.title||'personalizado')}.</p>
    ${section('Personalizar metas de recrutamento')}
    <div class="formrow"><span>Cidade</span>${selectTown('citySelect',selectedCity)}</div>
    <div class="formrow"><span>Unidade</span><select id="recruitUnit">${optionList(unitNames.map(k=>[k,k]))}</select><span>Total</span><input type="number" id="recruitQty" min="0" value="100"><button data-action="setRecruit">Salvar</button></div>
    <div class="smallnote">${cleanStr(JSON.stringify(config.recruit.targets[selectedCity]||{}))}</div>

    ${section('Recrutamento inteligente por lotes')}
    <p class="smallnote">O bot junta recursos antes de recrutar: não preenche várias vagas com ordens de 1 unidade. A última sobra pequena só é enviada quando a fila correspondente está vazia.</p>
    <div class="formrow"><span>Lote terrestre</span><input type="number" min="1" max="999" data-setting="recruit.maxBatch" value="${config.recruit.maxBatch}"><span>Mínimo</span><input type="number" min="1" max="999" data-setting="recruit.minBatch" value="${config.recruit.minBatch}"></div>
    <div class="formrow"><span>Lote naval</span><input type="number" min="1" max="999" data-setting="recruit.shipBatch" value="${config.recruit.shipBatch}"><span>Mínimo</span><input type="number" min="1" max="999" data-setting="recruit.minShipBatch" value="${config.recruit.minShipBatch}"></div>
    <div class="formrow"><span>Lote mítico</span><input type="number" min="1" max="999" data-setting="recruit.mythicalBatch" value="${config.recruit.mythicalBatch}"><span>Mínimo</span><input type="number" min="1" max="999" data-setting="recruit.minMythicalBatch" value="${config.recruit.minMythicalBatch}"></div>
    <div class="formrow"><span>Máx. espaços ocupados por tipo de fila</span><input type="number" min="1" max="6" data-setting="recruit.maxQueueSlots" value="${config.recruit.maxQueueSlots}"></div>
    <p class="smallnote">Padrão: terrestres em lotes de até 35 (mín. 10), navios até 8 (mín. 3) e míticos até 2. Se faltar recurso para o lote mínimo, o bot aguarda.</p>
    <p class="smallnote">Unidade inexistente neste mundo é ignorada no modelo. As metas são por cidade e podem ser alteradas abaixo.</p>`;
  };
let queueKindSelected='building';
  const queueContent=()=>{
  const town=getSelected(),kind=queueKindSelected;
  const buildings=BUILDINGS.filter(k=>W.GameData?.buildings?.[k]);
  const units=Object.entries(W.GameData?.units||{}).filter(([k,v])=>v&&typeof v==='object'&&Boolean(v.is_naval)===(kind==='ship')).map(([k])=>k);
  const researches=Object.keys(W.GameData?.researches||{});
  const options=kind==='building'?buildings:kind==='research'?researches:units;
  const plan=queueCandidates();
  const normal=plan.rows.filter(x=>!x.automatic).sort((a,b)=>(a.state==='ready'?0:1)-(b.state==='ready'?0:1)||(a.state==='ready'?a.rank-b.rank:a.index-b.index));
  const generated=plan.rows.filter(x=>x.automatic);
  const names={ready:'✅ Pronta',wait:'⏳ Esperando',blocked:'⚠ Verificar',done:'✔ Concluída'};
  const mode=queueMode();
  const addKinds=[['building','Construção'],['troop','Tropa terrestre'],['ship','Navio'],['research','Pesquisa']];
  const priorities=[['normal','Normal'],['high','Alta'],['urgent','Urgente']];
  const rows=normal.map(x=>{
    const j=x.job;
    const cost=x.cost?`${queueMoney(x.cost)} · total ${x.score}`:'Custo indisponível';
    return `<div class="city compact">
      <div style="flex:1;min-width:170px"><b>${cleanStr(queueName(j))}</b>
      <div class="smallnote">${names[x.state]||''}: ${cleanStr(x.why)}</div>
      <div class="smallnote">${cleanStr(cost)}${mode==='intelligent'&&x.state==='ready'?' · índice '+Number(x.rank).toFixed(1):''}</div></div>
      <select data-queue-urgency="${x.index}" title="Urgência desta meta" style="max-width:106px">${optionList(priorities,queueUrgency(j))}</select>
      <button data-remove-queue="${x.index}">Excluir</button></div>`;
  }).join('');
  const blockers=generated.map(x=>`<div class="city">
    <b>${cleanStr(queueName(x.job))}</b> · ${names[x.state]||''}
    <div class="smallnote">${cleanStr((x.reasons||[]).join('; '))}</div>
    <div class="smallnote">${x.cost?cleanStr(queueMoney(x.cost)):'Custo ainda indisponível'}</div>
  </div>`).join('');
  const best=plan.best;
  return `${moduleNames()}
    ${section('Seleção econômica inteligente')}
    <div class="formrow"><span>Estratégia</span><select data-setting="smartQueue.mode">${optionList([['intelligent','Inteligente · custo e benefício'],['cheapest','Clássico · menor custo']],mode)}</select></div>
    <div class="checks"><label><input type="checkbox" data-setting="smartQueue.autoPrereqs" ${config.smartQueue.autoPrereqs!==false?'checked':''}> Completar pré-requisitos necessários (modo inteligente)</label></div>
    <div class="helpbox">${mode==='cheapest'?'O modo clássico sempre escolhe a tarefa executável mais barata. Ignora urgências e melhorias automáticas.':'O modo inteligente considera o custo, urgência, dependências, população e capacidade de armazenamento. Pode antecipar academia, quartel, porto, fazenda e armazém para destravar tarefas da sua lista.'}</div>
    <div class="stats"><div><b>${queueJobs().length}</b>Metas cadastradas</div><div><b>${plan.ready.length}</b>Prontas para executar</div></div>
    <p class="smallnote">${best?'Próxima: '+cleanStr(queueName(best.job))+(best.automatic?' (pré-requisito)':'')+' · custo '+best.score+(mode==='intelligent'?' · índice '+Number(best.rank).toFixed(1):''):'Nenhuma ordem executável. Aguardando recursos, fila ou requisitos.'}</p>
    ${section('Adicionar meta à cidade')}
    <div class="formrow"><span>Cidade</span>${selectTown('queueCitySelect',town?.id)}</div>
    <div class="formrow"><span>Tipo</span><select id="queueKind">${optionList(addKinds,kind)}</select></div>
    <div class="formrow"><span>Item</span><select id="queueKey">${optionList(options.map(k=>[k,k]))}</select></div>
    ${kind==='research'?'<p class="smallnote">A pesquisa é feita uma vez.</p>':`<div class="formrow"><span>${kind==='building'?'Nível-alvo':'Quantidade-alvo'}</span><input type="number" id="queueTarget" min="1" step="1" value="${kind==='building'?'10':'100'}"></div>`}
    <div class="formrow"><span>Urgência</span><select id="queueAddUrgency">${optionList(priorities,'normal')}</select></div>
    <div class="tools"><button class="primary" data-action="queueAdd">Adicionar à fila</button><button data-action="queueImport">Importar metas da cidade</button></div>
    <p class="smallnote">Importe construções, tropas, navios e pesquisas dos modelos já configurados. A urgência pode ser alterada em cada tarefa abaixo.</p>
    <div class="formrow"><span>Teto adicional por lote de tropas/navios</span><input type="number" min="1" max="999" data-setting="smartQueue.maxBatch" value="${config.smartQueue.maxBatch}"></div>
    <p class="smallnote">Lotes: terrestre até ${config.recruit.maxBatch} (mín. ${config.recruit.minBatch}), naval até ${config.recruit.shipBatch} (mín. ${config.recruit.minShipBatch}). Máximo ${config.recruit.maxQueueSlots} espaços por tipo. Ajuste em TROPAS.</p>
    ${generated.length?`${section('Melhorias para liberar metas')}${blockers}`:''}
    ${section('Metas cadastradas')}
    <div class="tools"><button data-action="queueClearDone">Remover concluídas</button><button data-action="queueClearAll">Esvaziar lista</button></div>
    <div class="cityscroll" style="max-height:330px">${rows||'<p class="smallnote">Adicione uma meta acima.</p>'}</div>
    <p class="smallnote">Índice = custo ponderado por benefício e urgência; menor índice primeiro. O bot reavalia as condições antes de cada nova ordem. Modo simulação não envia comandos.</p>`;

  };
  const combatContent=()=>{
    const t=getSelected(),unitNames=Object.keys(W.GameData?.units||{}).filter(k=>typeof W.GameData.units[k]==='object');
    return `${moduleNames()}
    ${section('Programar ataque / apoio')}
    <div class="formrow"><span>Origem</span>${selectTown('commandFrom',t?.id)}</div>
    <div class="formrow"><span>Cidade-alvo ID</span><input type="number" id="commandTo" min="1" placeholder="ID da cidade"></div>
    <div class="formrow"><span>Tipo</span><select id="commandType"><option value="attack">Ataque</option><option value="support">Apoio</option></select><span>Enviar em</span><input type="datetime-local" id="commandDate"></div>
    <div class="formrow"><span>Unidade</span><select id="commandUnit">${optionList(unitNames.map(k=>[k,k]))}</select><span>Qtd.</span><input id="commandQty" type="number" min="1" value="25"></div>
    <button class="primary" data-action="addCommand">Agendar comando</button>
    ${config.commands.jobs.map((j,i)=>`<div class="city compact">${cleanStr(j.type)} · ${cleanStr(String(j.from))} → ${cleanStr(String(j.to))} · ${cleanStr(j.sendAt)} · ${cleanStr(JSON.stringify(j.units))}<button data-remove-job="${i}">×</button></div>`).join('')}
    ${section('Ataques automáticos aos bandidos (PvE)')}
    <div class="formrow"><span>Cidade da ilha inicial</span>${selectTown('bootcampHome',num(config.bootcamp.homeTownId)||t?.id)}</div>
    <button data-action="setBootcampHome">Definir cidade do acampamento</button>
    <div class="smallnote">Origem: ${cleanStr(config.bootcamp.homeTownId?tName(townBy(config.bootcamp.homeTownId)):'cidade atual (até definir)')} · O bot respeita a espera do acampamento e não repete ataques em trânsito.</div>
    <p class="smallnote"><b>Enviar todas as tropas:</b> o próximo ataque ao acampamento utilizará 100% das unidades terrestres presentes nesta cidade (inclusive espadachins, arqueiros e criaturas míticas disponíveis), sem reservar tropas. Navios e milícia não entram nesta batalha.</p>
    <div class="checks"><label><input type="checkbox" data-setting="bootcamp.useHero" ${config.bootcamp.useHero?'checked':''}> Incluir herói disponível da cidade no ataque PvE</label></div>
    <div class="smallnote">Herói: ${(()=>{const hero=banditHeroFor(townBy(num(config.bootcamp.homeTownId)||num(W.Game?.townId)));return hero?cleanStr(hero.name)+' #'+hero.id:'Nenhum herói elegível detectado';})()}. Somente heróis atribuídos à cidade, saudáveis e sem outra missão.</div>
    ${section('Acampamento e alertas')}
    <div class="checks"><label><input type="checkbox" data-setting="bootcamp.stashRewards" ${config.bootcamp.stashRewards?'checked':''}> Guardar recompensas permitidas</label>
    <label><input type="checkbox" data-setting="alerts.desktop" ${config.alerts.desktop?'checked':''}> Notificações desktop</label></div>
    <button data-action="askNotif">Permitir notificações</button>`;
  };
  const rewardsContent=()=>{
    const ready=questRows();const camp=W.MM?.getModelByNameAndPlayerId?.('PlayerAttackSpot');
    const tasks=islandQuestAll().map(q=>{const info=islandQuestInfo(q);return {info,plan:islandQuestPlan(info)};});
    const rewards=ready.map(q=>`<div class="city"><b>${cleanStr(q.attributes?.name||q.attributes?.progressable_id)}</b><div>✅ Concluída · ilha ${cleanStr(String(q.attributes?.configuration?.island_x??'?'))}:${cleanStr(String(q.attributes?.configuration?.island_y??'?'))}</div></div>`).join('');
    return `${moduleNames()}<div class="stats"><div><b>${ready.length}</b>Missões prontas</div><div><b>${camp?.hasReward?.()?'1':'0'}</b>Recompensa PvE</div></div>
      ${section('Missões de ilha')}
      <div class="checks"><label><input type="checkbox" data-setting="quests.autoObjectives" ${config.quests.autoObjectives?'checked':''}> Executar objetivos identificados automaticamente</label></div>
      <div class="formrow"><span>Lado preferido</span><select data-setting="quests.preferred">${optionList([['wise','Sabedoria'],['aggressive','Guerra']],config.quests.preferred)}</select></div>
      <div class="checks"><label><input type="checkbox" data-setting="quests.allowResourceCost" ${config.quests.allowResourceCost?'checked':''}> Permitir objetivos com gasto de recursos</label>
      <label><input type="checkbox" data-setting="quests.allowTroopCost" ${config.quests.allowTroopCost?'checked':''}> Permitir sacrifício de tropas</label></div>
      <div class="formrow"><span>Máximo de recursos por objetivo (total)</span><input type="number" min="0" data-setting="quests.maxResourceCost" value="${config.quests.maxResourceCost}"></div>
      <div class="formrow"><span>Máximo de tropas por objetivo</span><input type="number" min="0" data-setting="quests.maxTroopCost" value="${config.quests.maxTroopCost}"></div>
      <p class="smallnote">Constrói, pesquisa ou recruta quando a missão fornece uma meta explícita; também escolhe e cumpre etapas quando o próprio modelo expõe um comando com argumentos verificados. Aguarda objetivos de tempo e não inventa comandos para missões desconhecidas. Gastos e sacrifícios vêm bloqueados por padrão.</p>
      ${section('Objetivos detectados')}
      <div class="cityscroll" style="max-height:280px">${tasks.map(x=>`<div class="city"><b>${cleanStr(x.info.name)}</b> · ${cleanStr(x.info.state)}<div class="smallnote">${cleanStr(x.plan.why)}</div></div>`).join('')||'<p class="smallnote">Nenhuma missão carregada pelo cliente.</p>'}</div>
      <div class="tools"><button data-action="questInspect">Exportar dados técnicos das missões</button></div>
      <div class="formrow"><span>Recompensas</span><select data-setting="quests.rewardAction">${optionList([['stash','Guardar quando possível'],['use','Utilizar / receber']],config.quests.rewardAction)}</select></div>
      <div class="villages">${rewards||'<p class="smallnote">Nenhuma missão concluída encontrada agora.</p>'}</div>
      ${section('Recompensas do acampamento')}<p class="smallnote">Recebe recompensas após as batalhas dos bandidos. Se a recompensa puder ser guardada, respeita a opção abaixo. Funciona independentemente do ataque PvE.</p>
      <div class="checks"><label><input type="checkbox" data-setting="banditRewards.stashIfPossible" ${config.banditRewards.stashIfPossible?'checked':''}> Guardar quando permitido</label></div>
      <p class="smallnote">Missões iniciais sem identificação confirmada no cliente não são enviadas por um endpoint presumido; o modo automático cobre missões de ilha concluídas.</p>`;
  };
  const configContent=()=>`${section('Compartilhar modelo com outros jogadores')}
    <p class="smallnote">Exporta somente configurações gerais, sem suas cidades, metas, rotas e comandos pessoais. Quem importa fica pausado e em simulação.</p>
    <div class="tools"><button data-action="templateExport">Exportar modelo .json</button></div>
    <textarea id="templateImportText" style="height:85px" spellcheck="false" placeholder="Cole aqui o modelo público exportado"></textarea>
    <div class="tools"><button data-action="templateImport">Importar modelo público</button></div>
    ${section('Controle global')}
    <div class="checks"><label><input type="checkbox" data-global="enabled" ${config.enabled?'checked':''}> Execução geral</label><label><input type="checkbox" data-global="dryRun" ${config.dryRun?'checked':''}> Modo simulação (sem envio)</label></div>
    <p class="smallnote">Configurações locais por mundo/jogador. Perfil entre PCs disponível sem servidor externo. Desativar todos os módulos é o estado inicial.</p>
    ${section('Verificação de outro computador')}
    <p class="smallnote">Se algo não funcionar, abra a aba <b>VERIFICAR</b> e use <b>Salvar relatório .json</b> para identificar exatamente o componente que falhou.</p>
    <div class="tools"><button data-tab="VERIFICAR">Abrir verificação completa</button></div>
    ${section('Proteção durante CAPTCHA')}
    <div class="helpbox"><b>${securityBlocked()?'⚠ CAPTCHA DETECTADO — operações temporariamente suspensas':'Nenhuma verificação CAPTCHA detectada'}</b>. Ao aparecer um desafio, resolva-o diretamente no Grepolis. O GrepoPilot não preenche nem contorna CAPTCHAs. Assim que desaparecer e passar o intervalo de confirmação, as rotinas anteriormente habilitadas poderão continuar.</div>
    <div class="checks"><label><input type="checkbox" data-setting="security.notify" ${config.security.notify!==false?'checked':''}> Notificar ao detectar e liberar CAPTCHA</label></div>
    <div class="formrow"><span>Retomar após a verificação desaparecer (seg)</span><input type="number" min="1" max="30" data-setting="security.resumeAfterSeconds" value="${config.security.resumeAfterSeconds}"></div>
    ${section('Controle de solicitações')}
    <p class="smallnote">Espaça ações de rotina para evitar repetições e carga desnecessária. Ataques/apoios programados e cancelamentos cronometrados preservam suas janelas; todas as ações ainda respeitam o bloqueio por CAPTCHA.</p>
    <div class="checks"><label><input type="checkbox" data-setting="security.pacingEnabled" ${config.security.pacingEnabled!==false?'checked':''}> Limitar ações de rotina</label></div>
    <div class="formrow"><span>Intervalo mínimo entre envios (seg)</span><input type="number" min="5" max="120" step="5" data-setting="security.minActionIntervalSeconds" value="${pacingConfig().intervalMs/1000}"></div>
    <div class="formrow"><span>Máximo de solicitações por hora</span><input type="number" min="10" max="300" step="10" data-setting="security.maxActionsPerHour" value="${pacingConfig().hourLimit}"></div>
    <div class="formrow"><span>Pausa após resolver CAPTCHA (min)</span><input type="number" min="0" max="120" step="5" data-setting="security.postCaptchaCooldownMinutes" value="${pacingConfig().afterCaptchaMs/60000}"></div>
    <div class="smallnote">Última hora: ${pacingInfo().attempts} solicitação(ões). ${pacingInfo().remainingMs>0?'Próxima ação de rotina em '+Math.ceil(pacingInfo().remainingMs/1000)+' segundos.':'Ações de rotina liberadas.'}</div>
    <div class="tools"><button data-action="askNotif">Ativar alertas do navegador</button></div>
    <p class="smallnote">Com um CAPTCHA visível, inclusive ações de esquiva e testes práticos aguardam. Cancelamentos de apoio podem ficar atrasados durante a verificação.</p>
    ${section('Atualização automática da página (F5)')}
    <div class="checks"><label><input type="checkbox" data-setting="autoReload.enabled" ${config.autoReload.enabled?'checked':''}> Recarregar o Grepolis automaticamente enquanto o bot estiver ativo</label></div>
    <div class="formrow"><span>Intervalo entre F5 (minutos)</span><input type="number" min="10" max="720" step="5" data-setting="autoReload.minutes" value="${reloadMinutes()}"></div>
    <div class="formrow"><span>Margem antes de ataques e comandos (segundos)</span><input type="number" min="60" max="600" step="30" data-setting="autoReload.safeWindowSeconds" value="${Math.floor(reloadWindow()/1000)}"></div>
    <div class="smallnote">Próximo F5: ${config.autoReload.enabled&&reloadState().nextAt?new Date(reloadState().nextAt).toLocaleTimeString('pt-BR',{hour12:false}):'após ativar o bot'}. ${reloadState().lastReloadAt?'Última atualização: '+new Date(reloadState().lastReloadAt).toLocaleTimeString('pt-BR',{hour12:false})+'.':''}</div>
    <p class="smallnote">Adia o F5 durante CAPTCHA, ações em andamento, esquivas, ataques próximos, testes e comandos agendados. O relógio continua contando enquanto estiver adiado; a atualização ocorre assim que for seguro. Em abas em segundo plano, o navegador pode atrasar o temporizador.</p>
    <div class="tools"><button data-action="reloadRearm">Reiniciar contagem do F5</button></div>
    ${section('Intervalos')}
    ${Object.keys(MODULES).map(k=>`<div class="formrow compact"><span>${MODULES[k][0]}</span><input type="number" data-interval="${k}" min="2" max="86400" value="${num(config.intervals[k])}"> <small>s</small></div>`).join('')}
    ${section('JSON da configuração')}
    <textarea id="jsonEdit" spellcheck="false">${cleanStr(JSON.stringify(config,null,2))}</textarea>
    <div class="tools"><button class="primary" data-action="applyJson">Aplicar JSON</button><button data-action="exportJson">Exportar</button><button data-action="clearFired">Rearmar comandos</button><button data-action="reset">Redefinir</button></div>
    <p class="smallnote">Envios operacionais para Grepolis não são executados em modo simulação. Os identificadores dos edifícios, pesquisas e unidades vêm do cliente do jogo.</p>
    ${syncPanel()}`;
  const logContent=()=>`${section('Registro local')}
    <div class="tools"><button data-action="clearLog">Limpar histórico</button><button data-action="downloadLog">Exportar log</button></div>
    <div class="history">${logs.map(x=>`<div class="${x.level==='ERROR'?'error':x.level==='ALERT'?'warn':''}"><span>${x.stamp}</span> <b>${x.level}</b> ${cleanStr(x.message)}</div>`).join('')||'<p>Nenhum evento registrado.</p>'}</div>`;
  let host, shadow, content;
  const render=()=>{
    if(!shadow)return;
    host.style.left=config.ui.x===null?'auto':Math.max(0,num(config.ui.x))+'px';
    host.style.right=config.ui.x===null?'20px':'auto';
    host.style.top=Math.max(0,num(config.ui.y))+'px';
    const pane=({'COMEÇAR':onboardingContent,'INÍCIO':dashboard,CIDADES:cityContent,FILA:queueContent,ESQUIVA:dodgeContent,TESTE:testContent,DIAG:diagContent,VERIFICAR:healthContent,ALDEIAS:villagesContent,TROPAS:troopsContent,COMBATE:combatContent,ECONOMIA:economyContent,'MISSÕES':rewardsContent,AJUSTES:configContent,LOG:logContent}[config.ui.tab]||dashboard);
    let body;
    try{body=pane();}
    catch(e){
      health.lastRenderError=String(e?.message||e);
      console.error('[GrepoPilot] Erro ao montar aba '+config.ui.tab+':',e);
      body='<div class="helpbox">Não foi possível carregar esta aba: '+cleanStr(health.lastRenderError)+
        '. Use a aba VERIFICAR para analisar o problema.</div>'+
        '<div class="tools"><button data-tab="VERIFICAR">Abrir verificação</button></div>';
    }
    shadow.querySelector('#gp-app').innerHTML=`
      <div class="head" id="drag"><span class="logo">♜ GREPOPILOT</span><span class="v">v0.9.7</span><button class="collapse" data-action="collapse">${config.ui.collapsed?'□':'─'}</button></div>
      ${config.ui.collapsed?'':`<div class="status"><i class="dot ${config.enabled?(config.dryRun?'sim':'live'):''}"></i>${cleanStr(STATUS())}</div>
      <div class="tabs">${['COMEÇAR','INÍCIO','CIDADES','FILA','ALDEIAS','TROPAS','COMBATE','ESQUIVA','TESTE','DIAG','VERIFICAR','ECONOMIA','MISSÕES','AJUSTES','LOG'].map(tab=>`<button data-tab="${tab}" class="${config.ui.tab===tab?'active':''}">${tab}</button>`).join('')}</div>
      <div class="body">${body}</div><div class="foot"><button class="${config.enabled?'stop':'go'}" data-action="toggle">${config.enabled?'■ PARAR TUDO':'▶ INICIAR'}</button><span>${Object.values(config.modules).filter(Boolean).length} módulos ativos</span></div>`}`;
  };
  const CSS=`
    *{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer;border:1px solid #32455f;background:#192c43;color:#dce8fa;border-radius:6px;padding:6px 9px}
    button:hover{background:#284665}input,select,textarea{background:#0d192b;border:1px solid #2b3b55;color:#e2eafa;padding:6px;border-radius:5px;min-width:0}input[type=checkbox]{accent-color:#55b4fa;cursor:pointer}input[type=number]{width:74px}select{flex:1}
    #gp-app{width:475px;max-height:calc(100vh - 24px);display:flex;flex-direction:column;color:#e5ecf7;background:#0d192a;border:1px solid #3f5b7c;border-radius:12px;box-shadow:0 16px 40px #000b;overflow:hidden;font:12px/1.35 Inter,Arial,sans-serif}
    .head{height:43px;display:flex;align-items:center;gap:8px;padding:0 12px;background:#162e49;cursor:grab;user-select:none}.head .logo{font-size:15px;font-weight:900;color:#a7dcff;letter-spacing:1.5px}.head .v{color:#7892ae;font-size:11px}.collapse{margin-left:auto}
    .status{display:flex;align-items:center;gap:7px;padding:9px 12px;background:#112135;color:#bed2e5}.dot{height:7px;width:7px;border-radius:100%;background:#71849c}.dot.live{background:#54e6a1}.dot.sim{background:#ffbe55}
    .tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:#111f33;border-bottom:1px solid #2a3b54;gap:3px;padding:6px}.tabs button{padding:8px 3px;border:0;background:transparent;font-weight:800;font-size:10px;color:#93a9c1}.tabs .active{color:#a8e0ff;background:#254966}
    .body{padding:12px 14px;overflow-y:auto;min-height:80px;max-height:62vh}.mod{display:flex;align-items:center;gap:10px;padding:10px 9px;margin-bottom:5px;border-radius:7px;background:#17283d;border:1px solid #263d55;cursor:pointer}.mod span{flex:1;font-weight:700}.mod small{color:#768da8}
    .sect{font-size:12px;font-weight:800;text-transform:uppercase;color:#81c9f9;margin:16px 0 9px;border-bottom:1px solid #2d3b50;padding-bottom:5px}
    .cityscroll{max-height:175px;overflow:auto}.city{background:#12243a;padding:7px 9px;border:1px solid #263a52;border-radius:7px;margin-bottom:5px}.city b{font-size:12px}.city span,.smallnote{color:#9bb0c8}.city div{color:#d9e5f1;margin-top:3px}.city.compact{display:flex;justify-content:space-between;gap:7px;align-items:center;flex-wrap:wrap}.city.compact button{margin-left:auto}
    .formrow{display:flex;align-items:center;gap:7px;margin:8px 0;flex-wrap:wrap}.formrow span{color:#c9daec}.formrow input:not([type=checkbox]){flex:1;max-width:180px}.formrow.mini input{max-width:60px}.formrow.compact{justify-content:space-between;margin:3px 0}.formrow.compact span{flex:1}.formrow.compact input{max-width:70px}
    .checks{display:flex;flex-wrap:wrap;gap:10px}.checks label{display:flex;align-items:center;gap:4px}.smallnote{font-size:11px;margin:7px 0;overflow-wrap:anywhere}.primary,.go{background:#1e6896;border-color:#3b9bce;color:white;font-weight:700}.stop{background:#973b4b;border-color:#c85b71;color:#fff;font-weight:700}
    .tools{display:flex;gap:6px;flex-wrap:wrap}textarea{width:100%;height:190px;resize:vertical;font:11px/1.35 monospace}.foot{border-top:1px solid #2d435d;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;background:#12253b}.foot span{font-size:10px;color:#99abc2}
    .stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:7px 0}.stats>div{border:1px solid #315372;border-radius:9px;background:#172d48;padding:10px;color:#a8bbcf;font-size:11px}.stats b{display:block;color:#bfe4ff;font-size:19px}.helpbox{background:#17283e;border:1px solid #32506c;border-radius:8px;padding:12px;line-height:1.55}.quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.quick button{text-align:left;padding:12px 8px}.villages{max-height:250px;overflow-y:auto}.village{display:grid;grid-template-columns:1.2fr auto auto;gap:5px;align-items:center;border:1px solid #2b435c;background:#14293f;border-radius:7px;margin:5px 0;padding:9px}.village small{display:block;color:#9aaeca;font-size:10px;grid-column:1/-1}.village b{font-size:12px}.village span{font-size:11px}.history{max-height:45vh;overflow-y:auto;font-family:monospace}.history div{border-bottom:1px solid #26374d;padding:7px 0}.history span{color:#7d90a8}.history .error{color:#ff8e97}.history .warn{color:#ffcb7e}
  `;
  const download=(name,text,mime='application/json')=>{
    const a=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type:mime}));
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const scopedError=(s)=>{log(s,'ERROR');if(shadow)render()};
  const setPath=(path,val)=>{
    const tokens=path.split('.'); let base=config;
    for(const tok of tokens.slice(0,-1))base=base[tok];
    base[tokens.at(-1)]=val;save();
  };
  const clicked=async e=>{
    const trg=e.target.closest('button');if(!trg)return;
    const id=trg.dataset.action;
    const el=k=>shadow.getElementById(k);
    if(trg.dataset.tab){config.ui.tab=trg.dataset.tab;save();render();return;}
    if(trg.dataset.removeRoute!==undefined){config.trade.routes.splice(num(trg.dataset.removeRoute),1);save();render();return;}
    if(trg.dataset.removeJob!==undefined){config.commands.jobs.splice(num(trg.dataset.removeJob),1);save();render();return;}
    if(trg.dataset.removeQueue!==undefined){config.smartQueue.items.splice(num(trg.dataset.removeQueue),1);save();render();return;}
    if(!id)return;
    try{
      switch(id){
        case 'collapse':config.ui.collapsed=!config.ui.collapsed;save();break;
        case 'toggle':if(syncRole()==='standby')throw Error('PC secundário: selecione Principal em AJUSTES antes de iniciar');config.enabled=!config.enabled;save();log(config.enabled?'Bot iniciado':'Bot interrompido');break;
        case 'onboardingDemo':{
          if(!connected()||scope!==currentScope())throw Error('Aguarde carregar sua conta para iniciar');
          config.onboarding.completed=true;
          config.modules.farm=true;
          config.enabled=true;
          config.dryRun=true;
          config.ui.tab='ECONOMIA';
          nextRun.farm=0;
          save();log('Primeiro uso: Auto Farm ativado apenas em simulação');break;
        }
        case 'onboardingFinish':{
          if(!connected()||scope!==currentScope())throw Error('Aguarde o cliente do jogo ficar pronto');
          config.onboarding.completed=true;config.ui.tab='INÍCIO';save();
          log('Primeiro uso concluído: configure os módulos da sua conta');break;
        }
        case 'templateExport':{
          download('GrepoPilot-modelo-publico.json',templateExport());
          log('Modelo público exportado sem cidades ou metas pessoais');break;
        }
        case 'templateImport':templateImport(el('templateImportText')?.value||'');break;
        case 'dodgeForceCancel':{
          const id=trg.dataset.job,store=dodgeRead(),job=store.jobs?.[id];
          if(!job||(job.state!=='needs_attention'&&!dodgeActive(job))||!job.commandId)throw Error('Apoio não encontrado ou ainda sem ID');
          if(securityWatch())throw Error('CAPTCHA ativo: cancelamento indisponível');
          if(dodgeBusy)throw Error('Esquiva já está processando um comando');
          if(job.state==='needs_attention'){job.state='sent';job.cancelAttempts=0;job.retryAfterMs=0;}
          job.forceCancel=true;dodgeSaveRecord(store,job);
          await dodgeCancel(store,job,dodgeNow());break;
        }
        case 'dodgeExport':{
          const movements=dodgeMovements().map(m=>({
            keys:Object.keys(m.data||{}),
            type:String(m.data.type??m.data.command_type??''),
            commandId:dodgeMoveId(m),
            from:dodgeSrcId(m.data),to:dodgeDstId(m.data),
            startedAt:dodgeStarted(m.data),arrivalAt:dodgeArrival(m.data)
          }));
          download('GrepoPilot-esquiva-'+location.host+'.json',JSON.stringify({
            version:'0.9.7',world:location.host,at:new Date().toISOString(),
            clock:dodgeClock,settings:config.dodge,attacks:dodgeIncoming(),
            jobs:dodgeRead().jobs||{},movements
          },null,2));break;
        }
        case 'reloadRearm':reloadSchedule(true);log('F5 automático: contagem reiniciada para '+reloadMinutes()+' minutos');break;
        case 'healthRefresh':health.storageCache=null;log('Verificação do PC executada');break;
        case 'healthReopen':{
          config.ui.x=null;config.ui.y=90;config.ui.collapsed=false;config.ui.tab='VERIFICAR';save();break;
        }
        case 'healthCopy':{
          const report=JSON.stringify(healthSnapshot(),null,2);
          try{
            if(typeof GM_setClipboard==='function')GM_setClipboard(report,'text');
            else if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText)await navigator.clipboard.writeText(report);
            else throw Error('Área de transferência indisponível: use Salvar relatório');
          }catch(e){throw Error('Não foi possível copiar: '+e.message);}
          log('Relatório de compatibilidade copiado');break;
        }
        case 'healthDownload':download('GrepoPilot-verificacao-'+location.host+'.json',JSON.stringify(healthSnapshot(),null,2));break;
        case 'questInspect':{
          const report=islandQuestAll().map(q=>{
            const info=islandQuestInfo(q),plan=islandQuestPlan(info);
            return {id:info.id,state:info.state,type:info.type,objective:info.objective,
              plan:{type:plan.type,reason:plan.why},visibleFields:Object.keys(info.raw||{})};
          });
          download('GrepoPilot-missoes-'+location.host+'.json',JSON.stringify(report,null,2));break;
        }
        case 'diagRefresh':log('Diagnóstico: condições reavaliadas');break;
        case 'diagExport':download('GrepoPilot-diagnostico-'+location.host+'.json',JSON.stringify({
          version:'0.9.4',world:location.host,at:new Date().toISOString(),summary:diagSnapshot()},null,2));break;
        case 'diagReset':{
          const rt=readRuntime();delete rt.diagnostics;writeRuntime(rt);log('Diagnóstico: contadores reiniciados');break;
        }
        case 'syncCopy':{
          const payload=syncExport();
          try{
            if(typeof navigator?.clipboard?.writeText==='function')await navigator.clipboard.writeText(payload);
            else if(typeof GM_setClipboard==='function')GM_setClipboard(payload,'text');
            else throw Error('Área de transferência indisponível');
          }catch(e){
            if(typeof GM_setClipboard==='function')GM_setClipboard(payload,'text');
            else throw Error('Não foi possível copiar; use Baixar perfil .json: '+e.message);
          }
          log('Perfil copiado');break;
        }
        case 'tradePreview':
          log('Comércio inteligente: oportunidades calculadas novamente');break;
        case 'syncDownload':
          download('GrepoPilot-perfil-'+location.host+'.json',syncExport());log('Perfil exportado');break;
        case 'syncApply':syncImport(el('syncImportText')?.value||'');break;
        case 'syncApplyFile':{
          const file=el('syncImportFile')?.files?.[0];
          if(!file)throw Error('Selecione o arquivo .json exportado do outro PC');
          if(file.size>1000000)throw Error('O perfil excede o limite de 1 MB');
          syncImport(await file.text());break;
        }
        case 'queueAdd': {
          const t=getSelected(),kind=el('queueKind')?.value,key=el('queueKey')?.value;
          if(!t||!['building','troop','ship','research'].includes(kind)||!key)throw Error('Selecione cidade, tipo e item');
          const goal=kind==='research'?1:Math.floor(num(el('queueTarget')?.value));
          if(goal<1)throw Error('A meta deve ser maior que zero');
          if(queueJobs().length>=120)throw Error('Limite de 120 metas; exclua uma antes de adicionar');
          const existing=queueJobs().find(j=>String(j.townId)===String(t.id)&&j.kind===kind&&j.key===key);
          const urgency=el('queueAddUrgency')?.value||'normal';
          if(existing){existing.target=goal;existing.urgency=urgency;}
          else config.smartQueue.items.push({id:'GQ-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),townId:Number(t.id),kind,key,target:goal,urgency});
          config.modules.smartQueue=true;
          nextRun.smartQueue=0;save();log('Fila: meta adicionada ou atualizada');break;
        }
        case 'queueImport': {
          const t=getSelected();if(!t)throw Error('Selecione uma cidade');
          const items=[];
          for(const [key,target] of Object.entries(config.build.targets[t.id]||{}))if(num(target)>0)items.push({kind:'building',key,target});
          for(const key of config.research.queue[t.id]||[])if(W.GameData?.researches?.[key])items.push({kind:'research',key,target:1});
          for(const [key,target] of Object.entries(config.recruit.targets[t.id]||{}))if(num(target)>0&&W.GameData?.units?.[key])items.push({kind:W.GameData.units[key].is_naval?'ship':'troop',key,target});
          let count=0;
          for(const item of items){
            const old=queueJobs().find(j=>String(j.townId)===String(t.id)&&j.kind===item.kind&&j.key===item.key);
            if(old)old.target=item.target;
            else {if(queueJobs().length>=120)break;config.smartQueue.items.push({id:'GQ-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),townId:Number(t.id),...item})}
            count++;
          }
          if(count)config.modules.smartQueue=true;
          nextRun.smartQueue=0;save();log('Fila: importadas '+count+' metas de '+tName(t));break;
        }
        case 'queueClearDone':
          config.smartQueue.items=queueJobs().filter(j=>queueAnalyze(j).state!=='done');save();break;
        case 'queueClearAll':
          config.smartQueue.items=[];save();break;
        case 'testStart': {
          const id=Number(el('testCity')?.value||getSelected()?.id);
          if(config.attackTest.mode==='live'&&!el('testConfirm')?.checked)throw Error('Confirme a movimentação real de tropas para testar');
          testStart(id,config.attackTest.mode,config.attackTest.delay,config.attackTest.wave);break;
        }
        case 'testStop':testStop();break;
        case 'dodgeSaveTarget': { const src=getSelected(); if(!src)throw Error('Cidade inválida'); const dest=Number(el('dodgeTarget')?.value||0); if(dest&&!dodgeSameIsland(src,townBy(dest)))throw Error('Escolha outra cidade própria da mesma ilha');config.dodge.targets[src.id]=dest;save();log(`Esquiva: destino de ${tName(src)} definido`);break; }
        case 'setBootcampHome': {
          const id=num(el('bootcampHome').value);
          if(!townBy(id))throw new Error('Escolha uma cidade válida da ilha inicial');
          config.bootcamp.homeTownId=id;save();log(`Acampamento: origem ${tName(townBy(id))}`);break;
        }
        case 'previewProfile':case 'applyProfile': {
          const t=getSelected();if(!t)throw new Error('Selecione uma cidade');
          const name=el('cityTemplate').value;
          const myUnit=el('profileMythUnit')?.value||'';
          const data=templateDetails(name,t,myUnit);
          if(id==='previewProfile'){
            log(`Prévia ${CITY_TEMPLATES[name].title} para ${tName(t)}: ${JSON.stringify(data)}`);
            config.ui.tab='LOG';
          }else{
            config.build.targets[t.id]=data.buildings;
            config.build.priority=[...new Set([...Object.keys(data.buildings),...config.build.priority])];
            config.recruit.targets[t.id]=data.units;
            config.research.queue[t.id]=data.researches;
            config.cityProfiles[t.id]=name;
            save(); nextRun.build=0;nextRun.recruit=0;nextRun.research=0;
            log(`Modelo ${CITY_TEMPLATES[name].title} aplicado em ${tName(t)}: ${Object.keys(data.buildings).length} edifícios, ${Object.keys(data.units).length} unidades e ${data.researches.length} pesquisas`);
          }
          break;
        }
        case 'previewTroops':case 'applyTroops':{
          const t=getSelected();if(!t)throw new Error('Selecione uma cidade');
          const key=el('troopTemplate').value,unit=el('troopMythUnit')?.value||'';
          const goal=troopTemplateDetails(key,t,unit);
          if(id==='previewTroops'){
            log(`Prévia ${TROOP_TEMPLATES[key].title} (${tName(t)}): ${JSON.stringify(goal)}`);config.ui.tab='LOG';
          }else{
            config.recruit.targets[t.id]=goal;config.troopProfiles[t.id]=key;save();nextRun.recruit=0;
            log(`${tName(t)}: modelo de tropas ${TROOP_TEMPLATES[key].title} aplicado`);
          }
          break;
        }
        case 'setBuild':{
          const tid=getSelected()?.id;if(!tid)throw Error('Selecione uma cidade');
          const type=el('buildingType').value,qty=Math.max(0,Math.floor(num(el('buildingTarget').value)));
          config.build.targets[tid]??={}; config.build.targets[tid][type]=qty;save();break;
        }
        case 'setResearch':{
          const tid=getSelected()?.id;if(!tid)throw Error('Selecione uma cidade');
          config.research.queue[tid]=el('researchQueue').value.split(',').map(x=>x.trim()).filter(Boolean);save();break;
        }
        case 'setRecruit':{
          const tid=getSelected()?.id;if(!tid)throw Error('Selecione uma cidade');
          config.recruit.targets[tid]??={};config.recruit.targets[tid][el('recruitUnit').value]=Math.max(0,Math.floor(num(el('recruitQty').value)));save();break;
        }
        case 'addRoute':{
          const a=num(el('routeFrom').value),b=num(el('routeTo').value);
          if(!a||!b||a===b)throw Error('Selecione origem e destino diferentes');
          config.trade.routes.push({from:a,to:b,wood:Math.max(0,num(el('routeWood').value)),stone:Math.max(0,num(el('routeStone').value)),iron:Math.max(0,num(el('routeIron').value)),enabled:true});save();break;
        }
        case 'addCommand':{
          const from=num(el('commandFrom').value),to=num(el('commandTo').value),sendAt=el('commandDate').value;
          const unit=el('commandUnit').value,qty=Math.floor(num(el('commandQty').value));
          if(!from||!to||!Date.parse(sendAt)||qty<1)throw Error('Preencha cidade-alvo, horário e tropas');
          config.commands.jobs.push({id:`GP-${Date.now()}-${Math.floor(Math.random()*9999)}`,type:el('commandType').value,from,to,sendAt:new Date(sendAt).toISOString(),units:{[unit]:qty},enabled:true});save();break;
        }
        case 'askNotif':{if('Notification'in window)await Notification.requestPermission();break;}
        case 'applyJson':{
          const v=JSON.parse(el('jsonEdit').value);
          config=migrate(merge(clone(BASE),v),v);
          if(syncRole()==='standby')config.enabled=false;
          save();nextRun={};log('JSON aplicado');break;
        }
        case 'exportJson':download(`grepopilot_${location.host}.json`,JSON.stringify(config,null,2));break;
        case 'clearFired':localStorage.removeItem(FIRED);log('Comandos rearmados');break;
        case 'reset':config=clone(BASE);save();nextRun={};log('Configuração redefinida');break;
        case 'clearLog':logs=[];break;
        case 'downloadLog':download(`grepopilot_log_${location.host}.txt`,logs.map(x=>`${x.stamp} ${x.level} ${x.message}`).join('\n'),'text/plain');break;
      }
      render();
    }catch(err){scopedError(err.message)}
  };
  const changed=e=>{
    const t=e.target;
    if(t.dataset.module){config.modules[t.dataset.module]=t.checked;nextRun[t.dataset.module]=0;save();render();return;}
    if(t.dataset.culture){config.culture[t.dataset.culture]=t.checked;save();render();return;}
    if(t.dataset.global){
      if(t.dataset.global==='enabled'&&t.checked&&syncRole()==='standby'){
        log('PC secundário: escolha Principal em AJUSTES antes de iniciar','WARN');render();return;
      }
      config[t.dataset.global]=t.checked;save();render();return;
    }
    if(t.dataset.queueUrgency!==undefined){
      const index=Number(t.dataset.queueUrgency);
      if(Number.isSafeInteger(index)&&queueJobs()[index]&&['normal','high','urgent'].includes(t.value)){
        config.smartQueue.items[index].urgency=t.value;nextRun.smartQueue=0;save();
      }
      render();return;
    }
    if(t.dataset.setting){
      if(t.dataset.setting==='sync.role'&&t.value==='standby'){
        const test=testRead().active;
        if(test?.state==='active'&&test.mode==='live')testStop();
        config.enabled=false;
      }
      setPath(t.dataset.setting,t.type==='checkbox'?t.checked:t.type==='number'?num(t.value):t.value);
      if(t.dataset.setting==='quests.autoObjectives'&&t.checked){
        config.modules.quests=true;nextRun.quests=0;save();
      }
      if(t.dataset.setting.startsWith('autoReload.'))reloadSchedule(true);
      if(t.dataset.setting.startsWith('smartQueue.'))nextRun.smartQueue=0;
      if(t.dataset.setting.startsWith('trade.')){
        nextRun.trade=0;
        if(t.dataset.setting==='trade.intelligent'&&t.checked)config.modules.trade=true;
        save();
      }
      render();return;
    }
    if(t.dataset.interval){config.intervals[t.dataset.interval]=Math.max(2,num(t.value,60));save();render();return;}
    if(t.id==='citySelect'||t.id==='queueCitySelect'||t.id==='dodgeSource'||t.id==='testCity'){selectedCity=t.value;render();}
    if(t.id==='queueKind'){queueKindSelected=t.value;render();}
  };
  const mount=()=>{
    if(host?.isConnected&&shadow?.querySelector('#gp-app'))return;
    if(host){try{host.remove()}catch{}host=null;shadow=null;}
    host=document.createElement('div');host.id='grepopilot-host';
    host.style.cssText='position:fixed;z-index:2147483000;top:90px;right:20px';
    shadow=host.attachShadow({mode:'open'});
    const style=document.createElement('style');style.textContent=CSS;
    const app=document.createElement('div');app.id='gp-app';shadow.append(style,app);
    (document.body||document.documentElement).append(host);
    shadow.addEventListener('click',clicked);
    shadow.addEventListener('change',changed);
    let moving=null;
    shadow.addEventListener('pointerdown',e=>{
      if(!e.target.closest('#drag')||e.target.closest('button'))return;
      moving={x:e.clientX,y:e.clientY,left:host.getBoundingClientRect().left,top:host.getBoundingClientRect().top};
      e.preventDefault();
    });
    document.addEventListener('pointermove',e=>{
      if(!moving)return;
      config.ui.x=Math.max(0,Math.min(innerWidth-80,moving.left+e.clientX-moving.x));
      config.ui.y=Math.max(0,Math.min(innerHeight-40,moving.top+e.clientY-moving.y));
      host.style.left=`${config.ui.x}px`;host.style.right='auto';host.style.top=`${config.ui.y}px`;
    });
    document.addEventListener('pointerup',()=>{if(moving){moving=null;save()}});
    render();log('Painel carregado');
  };
  const start=()=>{
    try{mount();}
    catch(e){health.mountErrors++;health.lastMountError=String(e?.message||e);console.error('[GrepoPilot] Montagem inicial:',e);}
    if(W.Game?.player_id)save(); // Evita escrever configuração na conta "unknown" antes do cliente carregar.
    setInterval(()=>{
      if(!host?.isConnected||!shadow?.querySelector('#gp-app')){
        try{mount();health.lastMountError='';}
        catch(e){health.mountErrors++;health.lastMountError=String(e?.message||e);console.error('[GrepoPilot] Tentativa de remontagem:',e);}
      }
    },5000);
    setInterval(()=>{
      try{securityWatch();Promise.resolve(tick()).catch(e=>{
        health.lastTickResult='falha no ciclo: '+String(e?.message||e);
        log('Motor: '+health.lastTickResult,'ERROR');
      });}catch(e){health.lastTickResult='erro: '+String(e?.message||e);log('Motor: '+health.lastTickResult,'ERROR');}
    },1500);
    setInterval(()=>{try{autoReloadPulse()}catch(e){log('F5 automático: '+e.message,'ERROR')}},10000);
    setInterval(()=>{dodgePulse().catch(e=>log(`Esquiva: ${e.message}`,'ERROR'))},125);
    setInterval(()=>{try{testTick();if(config.ui.tab==='TESTE'&&shadow){const a=testRead().active;const el=shadow.getElementById('testCountdown');if(a&&el)el.textContent=Math.max(0,(a.impactMs-dodgeNow())/1000).toFixed(1)+'s';}}catch(e){log(`Teste: ${e.message}`,'ERROR')}},250);
    setInterval(()=>{if(dodgeBusy){try{const active=JSON.parse(localStorage.getItem(DODGE_LOCK)||'{}');if(active.owner===instanceId)localStorage.setItem(DODGE_LOCK,JSON.stringify({owner:instanceId,until:Date.now()+2500}));}catch{}}},500);
    window.addEventListener('pagehide',()=>{try{const active=JSON.parse(localStorage.getItem(DODGE_LOCK)||'{}');if(active.owner===instanceId)localStorage.removeItem(DODGE_LOCK);}catch{}});
    setInterval(()=>{if(config.ui.tab==='DIAG'&&shadow&&!document.hidden){try{render();}catch(e){console.error('[GrepoPilot] Diagnóstico: '+e.message);}}},15000);
    setInterval(()=>{
      if(config.ui.tab==='LOG'||config.ui.collapsed)return;
      const el=shadow.querySelector('.status');if(el)el.lastChild.textContent=STATUS();
    },5000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && config.enabled)nextRun.alerts=0;});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();