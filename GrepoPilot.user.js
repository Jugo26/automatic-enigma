// ==UserScript==
// @name         GrepoPilot - Painel de Automacao
// @namespace    https://grepolis.com/
// @version      0.5.0
// @updateURL    https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.meta.js
// @downloadURL  https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.user.js
// @homepageURL  https://github.com/Jugo26/automatic-enigma/tree/grepopilot-updates
// @description  Painel modular local: farm, obras, tropas, academia, comercio, aldeias, cultura, acampamento PvE, modelos de cidades/tropas, desbloqueio e evolução de aldeias, recompensas de missões/bandidos, conclusão grátis e comandos agendados.
// @match        https://*.grepolis.com/game/*
// @run-at       document-idle
// @grant        unsafeWindow
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
    farm: {duration:10,minStorageFree:0.12,captainBulk:false},
    build: {targets:{},priority:BUILDINGS.slice(),allowDemolition:false},
    finishFree: {maxRemainingSeconds:285},
    cityProfiles: {},
    recruit: {targets:{},maxBatch:35},
    research: {queue:{}},
    smartQueue: {items:[],maxBatch:35},
    trade: {routes:[],minReserve:2500,maxFill:0.90},
    ruralTrade: {wanted:'wood',minRatio:1,maxAmount:3000},
    ruralUpgrade: {unlock:false,upgrade:false,targetLevel:3},
    troopProfiles: {},
    quests: {rewardAction:'stash',onlySatisfied:true},
    banditRewards: {stashIfPossible:true},
    culture: {festival:false,triumph:false,theater:false},
    bootcamp: {homeTownId:0,stashRewards:true},
    cave: {minIron:15000,keepIron:5000},
    commands: {jobs:[]},
    alerts: {desktop:true,checkAll:true},
    dodge: {leadSeconds:5,returnAfterSeconds:1,waveGapSeconds:12,land:true,naval:true,targets:{}},
    ui: {x:null,y:90,tab:'INÍCIO',collapsed:false}
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
  let scope = `${location.host}:${W.Game?.player_id || 'unknown'}`;
  let STORE = `grepopilot:config:${scope}`;
  let LOCK = `grepopilot:lock:${scope}`;
  let FIRED = `grepopilot:fired:${scope}`;
  let RUNTIME = `grepopilot:runtime:${scope}`;
  let DODGE_STORE = `grepopilot:dodge:${scope}`;
  let DODGE_LOCK = `grepopilot:dodge-lock:${scope}`;
  const old = (() => {try {return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}})();
  const migrate = (cfg,raw={}) => {
    if(raw?.modules?.ruralUpgrade && raw?.ruralUpgrade?.unlock && raw?.modules?.ruralUnlock===undefined) cfg.modules.ruralUnlock=true;
    if(raw?.modules?.ruralUpgrade && raw?.ruralUpgrade?.upgrade===false) cfg.modules.ruralUpgrade=false;
    if(cfg?.ui?.tab==='MILITAR')cfg.ui.tab='TROPAS';
    if(cfg?.ui?.tab==='CONFIG')cfg.ui.tab='AJUSTES';
    return cfg;
  };
  let config = migrate(merge(clone(BASE),old),old);
  let logs = [];
  let running = false;
  let nextRun = {};
  let booted = false;
  let seenAttacks = new Set();
  let rendered = false;
  function rescope(){
    const newScope = `${location.host}:${W.Game?.player_id || 'unknown'}`;
    if(newScope===scope)return;
    scope=newScope;STORE=`grepopilot:config:${scope}`;LOCK=`grepopilot:lock:${scope}`;FIRED=`grepopilot:fired:${scope}`;RUNTIME=`grepopilot:runtime:${scope}`;DODGE_STORE=`grepopilot:dodge:${scope}`;DODGE_LOCK=`grepopilot:dodge-lock:${scope}`;
    try{const raw=JSON.parse(localStorage.getItem(STORE)||'{}');config=migrate(merge(clone(BASE),raw),raw);}catch{config=clone(BASE);}
    nextRun={};seenAttacks=new Set();
    log(`Conta/mundo detectado: ${scope}`);render();
  }
  const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cleanStr = text => String(text??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const num = (v,def=0) => Number.isFinite(Number(v)) ? Number(v) : def;
  const tName = t => t?.getName?.() || t?.name || `Cidade ${t?.id}`;
  const save = () => {localStorage.setItem(STORE,JSON.stringify(config));};
  const log = (message,level='INFO') => {
    const stamp = new Date().toLocaleTimeString('pt-BR');
    logs.unshift({stamp,level,message:String(message)});
    logs = logs.slice(0,150);
    if (level === 'ERROR') console.error(`[${SCRIPT}] ${message}`);
    else console.info(`[${SCRIPT}] ${message}`);
    if (config.ui.tab === 'LOG') render();
  };
  const delay = ms => new Promise(r=>setTimeout(r,ms));
  const connected = () => Boolean(W.ITowns?.towns && W.MM && W.gpAjax && W.Game);
  const towns = () => connected()? Object.values(W.ITowns.towns).filter(t=>t && t.id): [];
  const townBy = id => W.ITowns?.towns?.[id] || W.ITowns?.getTown?.(id);
  const models = key => {
    try {return W.MM.getOnlyCollectionByName(key)?.models || []} catch {return []}
  };
  const resource = t => t?.resources?.() || {};
  const action = async (controller,method,data,forceLive=false) => {
    if (config.dryRun && !forceLive) {log(`SIMULACAO ${controller}/${method} ${JSON.stringify(data).slice(0,160)}`);return {dryRun:true};}
    if (!connected()) throw new Error('Cliente Grepolis indisponível.');
    return new Promise((resolve,reject) => {
      let done=false;
      const timeout=setTimeout(()=>{if(!done){done=true;reject(new Error(`Resposta não confirmada: ${controller}/${method}`));}},13000);
      try {
        W.gpAjax.ajaxPost(controller,method,data,false,response=>{
          if(done) return;
          done=true;clearTimeout(timeout);
          if(response?.success===false || response?.json?.success===false || response?.error || response?.json?.error) return reject(new Error(JSON.stringify(response?.json?.error || response?.error || 'Falha reportada pelo jogo')));
          resolve(response);
        });
      } catch(e){if(!done){done=true;clearTimeout(timeout);reject(e)}}
    });
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
  const canRun = () => config.enabled && connected() && !document.querySelector('iframe[src*="captcha"],.captcha_container,.recaptcha-wrapper');
  const notify = text => {
    log(text,'ALERT');
    if(config.alerts.desktop && 'Notification' in window && Notification.permission==='granted') new Notification('GrepoPilot',{body:text});
  };
  async function farm(){
    const active=towns().filter(eligibleTown).filter(t=>{
      const r=resource(t);const cap=num(r.storage,1);
      return ['wood','stone','iron'].some(k=>num(r[k]) <= cap*(1-num(config.farm.minStorageFree,0.12)));
    });
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
      if(planned>=target || same.length)return out('wait','Construção deste edifício em andamento');
      const capacity=W.GameDataPremium?.isAdvisorActivated?.('curator')?7:2;
      if(orders.length>=capacity)return out('wait','Fila de obras do jogo cheia');
      const data=W.MM?.getModels?.()?.BuildingBuildData?.[t.id]?.attributes?.building_data?.[j.key];
      const cost=queueCost(data?.resources_for);
      if(!cost)return out('blocked','Custo da próxima obra não encontrado');
      if(num(t.getAvailablePopulation?.())<num(data.population_for))return out('wait','População insuficiente',cost);
      if(!availableRes(t,cost))return out('wait','Aguardando recursos',cost);
      return out('ready',`Construir nível ${current+1}`,cost,1);
    }
    if(j.kind==='troop'||j.kind==='ship'){
      const def=W.GameData?.units?.[j.key];
      if(!def)return out('blocked','Unidade não disponível neste mundo');
      if(Boolean(def.is_naval)!==(j.kind==='ship'))return out('blocked','Tipo de unidade incompatível');
      const buildings=t.buildings?.()?.attributes||{};
      if(num(buildings[def.is_naval?'docks':'barracks'])<1)return out('wait',def.is_naval?'Porto indisponível':'Quartel indisponível');
      if(isMythical(j.key,def) && godOf(t) && String(def.god_id||def.god||MYTH_GODS[j.key]||'').toLowerCase()!==godOf(t))return out('blocked','Criatura de outro deus');
      const orders=t.getUnitOrdersCollection?.()?.models||[];
      const owned=num(t.units?.()?.[j.key])+num(t.unitsOuter?.()?.[j.key]);
      const pending=orders.reduce((sum,o)=>sum+(o.attributes?.unit_type===j.key?num(o.attributes?.units_left,o.attributes?.count):0),0);
      const missing=Math.max(0,target-owned-pending);
      if(!missing)return out(owned>=target?'done':'wait',owned>=target?`Meta ${target} alcançada`:'Tropas em treinamento');
      if(orders.length>=6)return out('wait','Fila de unidades do jogo cheia');
      const per=queueCost(def.resources);
      if(!per)return out('blocked','Custo da unidade indisponível');
      const discount=num(W.GeneralModifications?.getUnitBuildResourcesModification?.(Number(t.id),def),1);
      if(discount<=0)return out('blocked','Modificador de custo inválido');
      const perUnit=queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,per[k]*discount])));
      const res=resource(t);
      const populationCost=Math.max(1,num(def.population,1));
      const popAvailable=num(t.getAvailablePopulation?.(),num(res.population));
      let count=Math.min(missing,Math.max(1,Math.floor(num(config.smartQueue.maxBatch,35))),Math.floor(popAvailable/populationCost));
      for(const k of ['wood','stone','iron'])if(perUnit[k]>0)count=Math.min(count,Math.floor(num(res[k])/perUnit[k]));
      count=Math.floor(count);
      const estimated=queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,perUnit[k]*Math.max(1,count)])));
      if(count<1)return out('wait','Aguardando recursos ou população',estimated);
      if(isMythical(j.key,def)&&num(def.favor)>0){
        const favor=t.getCurrentFavor?.()??t.getFavor?.();
        if(favor===undefined)return out('wait','Favor divino não confirmado',estimated);
        if(num(favor)<num(def.favor)*count){
          count=Math.min(count,Math.floor(num(favor)/num(def.favor)));
          if(count<1)return out('wait','Favor divino insuficiente',estimated);
        }
      }
      const cost=queueCost(Object.fromEntries(['wood','stone','iron'].map(k=>[k,perUnit[k]*count])));
      return out('ready',`Recrutar ${count} ${j.key}`,cost,count);
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
      const pointsReq=num(def.research_points,0);
      if(pointsReq && typeof t.getAvailableResearchPoints==='function' && num(t.getAvailableResearchPoints())<pointsReq)return out('wait','Pontos de pesquisa insuficientes');
      const cost=queueCost(def.resources||def.costs);
      if(!cost)return out('blocked','Custo da pesquisa não identificado');
      if(!availableRes(t,cost))return out('wait','Aguardando recursos',cost);
      return out('ready','Iniciar pesquisa',cost,1);
    }
    return out('blocked','Tipo inválido');
  }
  async function smartQueue(){
    const jobs=queueJobs();
    if(!jobs.length)return false;
    const rt=readRuntime();
    const now=Date.now();
    const options=jobs.map((j,i)=>({...queueAnalyze(j),index:i})).filter(x=>x.state==='ready' && now-num(rt.smartQueueAttempts?.[x.job.id])>=30000);
    options.sort((a,b)=>a.score-b.score||a.index-b.index);
    const next=options[0];
    if(!next)return false;
    const j=next.job, id=Number(j.townId), key=j.key;
    try{
      if(j.kind==='building')await bridge(id,'BuildingOrder','buildUp',{building_id:key});
      else if(j.kind==='research')await bridge(id,'ResearchOrder','research',{id:key});
      else await action(j.kind==='ship'?'building_docks':'building_barracks','build',{unit_id:key,amount:next.amount,town_id:id});
      if(!config.dryRun){
        rt.smartQueueAttempts=rt.smartQueueAttempts||{};
        rt.smartQueueAttempts[j.id]=Date.now();
        rt.smartQueueAttempts=Object.fromEntries(Object.entries(rt.smartQueueAttempts).filter(([,time])=>Date.now()-num(time)<3600000));
        writeRuntime(rt);
      }
      log(`Fila econômica: ${queueName(j)} · ${next.why} · ${queueMoney(next.cost)} (total ${next.score})`);
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
    for(const [id,target] of Object.entries(config.recruit.targets)){
      const t=townBy(id); if(!t || !target || queueManagesTown(id))continue;
      const current=t.units?.()||{},outside=t.unitsOuter?.()||{};
      const queued=t.getUnitOrdersCollection?.()?.models||[];
      if(queued.length>=6)continue;
      for(const [unit,wanted] of Object.entries(target)){
        const def=W.GameData?.units?.[unit];if(!def)continue;
        const inflight=queued.reduce((s,o)=>s+(o.attributes?.unit_type===unit?num(o.attributes?.units_left,o.attributes?.count):0),0);
        const pending=Math.max(0,num(wanted)-num(current[unit])-num(outside[unit])-inflight);
        if(!pending)continue;
        const disc=num(W.GeneralModifications?.getUnitBuildResourcesModification?.(Number(id),def),1);
        const cost=def.resources||{};const r=resource(t);
        const cap=Math.min(pending,num(config.recruit.maxBatch,35),Math.floor(num(r.population)/Math.max(1,num(def.population))));
        const byRes=['wood','stone','iron'].reduce((m,k)=>Math.min(m,Math.floor(num(r[k]) / Math.max(1,Math.ceil(num(cost[k])*disc)))),cap);
        if(byRes<=0)continue;
        await action(def.is_naval?'building_docks':'building_barracks','build',{unit_id:unit,amount:byRes,town_id:Number(id)});
        log(`${tName(t)}: recrutar ${byRes} ${unit}`);return true;
      }
    }
    return false;
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
  async function trade(){
    const routes=Array.isArray(config.trade.routes)?config.trade.routes:[];
    for(const route of routes){
      if(route.enabled===false)continue;
      const src=townBy(route.from),dst=townBy(route.to);
      if(!src || !dst || Number(route.from)===Number(route.to))continue;
      const rs=resource(src),rd=resource(dst);
      const cargo={};let total=0;
      for(const k of ['wood','stone','iron']){
        const requested=Math.max(0,Math.floor(num(route[k])));
        const supply=Math.max(0,num(rs[k])-num(config.trade.minReserve));
        const free=Math.max(0,Math.floor(num(rd.storage,999999)*num(config.trade.maxFill,0.90)-num(rd[k])));
        cargo[k]=Math.min(requested,supply,free);total+=cargo[k];
      }
      const cap=num(src.getAvailableTradeCapacity?.());
      if(total<100 || cap<100)continue;
      if(total>cap){const f=cap/total; for(const k of Object.keys(cargo))cargo[k]=Math.floor(cargo[k]*f);}
      await action('town_info','trade',{id:Number(route.to),town_id:Number(route.from),nl_init:true,...cargo});
      log(`${tName(src)} → ${tName(dst)}: ${JSON.stringify(cargo)}`);return true;
    }
    return false;
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
  const questRows=()=>models('IslandQuest').filter(q=>q.attributes?.state==='satisfied' && q.attributes?.progressable_id!==undefined && q.attributes?.progressable_id!==null);
  async function quests(){
    const ready=questRows();
    if(!ready.length)return false;
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
    return false;
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
    await action('frontend_bridge','execute',{model_url:`PlayerAttackSpot/${W.Game.player_id}`,action_name:'attack',arguments:units});
    log(`Bandidos fase ${stage}: ${config.dryRun?'SIMULAÇÃO ':''}ataque por ${tName(home)} com ${total} unidades (${Object.entries(units).map(([k,v])=>`${k} ${v}`).join(', ')})`);
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
const dodgeRead=()=>{try{return JSON.parse(localStorage.getItem(DODGE_STORE)||'{}')}catch{return {}}};
  const dodgeWrite=v=>localStorage.setItem(DODGE_STORE,JSON.stringify(v));
  const dodgeClock={sampleAt:0,deltaMs:0,source:'local'};
  function dodgeNow(){
    const now=Date.now();
    if(now-dodgeClock.sampleAt>12000){
      dodgeClock.sampleAt=now;
      try{
        const sec=Number(W.Timestamp?.server?.());
        if(Number.isFinite(sec)&&sec>1000000000){
          dodgeClock.deltaMs=sec*1000+500-now;
          dodgeClock.source='servidor';
        }else{dodgeClock.deltaMs=0;dodgeClock.source='local';}
      }catch{dodgeClock.deltaMs=0;dodgeClock.source='local';}
    }
    return now+dodgeClock.deltaMs;
  }
  const dodgeEpochMs=raw=>{
    if(raw===null||raw===undefined||raw==='')return NaN;
    const n=Number(raw);
    if(Number.isFinite(n))return n>1e12?n:n>1e9?n*1000:NaN;
    const t=Date.parse(String(raw));
    return Number.isFinite(t)?t:NaN;
  };
  function dodgeMovements(){
    try{
      const native=W.MM?.getModels?.()?.MovementsUnits;
      const raw=Array.isArray(native)?native:Object.values(native||{});
      return (raw.length?raw:models('MovementsUnits')).map(m=>({model:m,data:m?.attributes||m||{}}));
    }catch{return []}
  }
  const dodgeMoveId=m=>Number(m?.data?.command_id||0);
  const dodgeSrcId=a=>Number(a?.home_town_id??a?.origin_town_id??a?.from_town_id??a?.town_id);
  const dodgeDstId=a=>Number(a?.target_town_id??a?.destination_town_id??a?.to_town_id);
  const dodgeArrival=a=>dodgeEpochMs(a?.arrival_at??a?.time_of_arrival??a?.arrival_time);
  function dodgeIncoming(){
    const owned=new Set(towns().map(t=>Number(t.id)));
    return dodgeMovements().flatMap(({model,data:a})=>{
      const type=String(a.type??a.command_type??a.movement_type??'').toLowerCase();
      const townId=dodgeDstId(a);
      if(!owned.has(townId)||!(type==='attack'||type==='attack_with_spy'||type.startsWith('attack_')))return [];
      const source=dodgeSrcId(a);
      if(Number.isFinite(source)&&owned.has(source))return [];
      const arrivalMs=dodgeArrival(a);
      if(!Number.isFinite(arrivalMs))return [];
      const id=String(a.command_id||a.id||model?.id||`${townId}:${arrivalMs}`);
      return [{townId,arrivalMs,id,type}];
    }).sort((a,b)=>a.arrivalMs-b.arrivalMs);
  }
  function dodgeOutgoing(from,to){
    return dodgeMovements().filter(m=>{
      const a=m.data;
      return String(a.type||a.command_type||'').toLowerCase()==='support'
        &&dodgeSrcId(a)===Number(from)&&dodgeDstId(a)===Number(to)
        &&Number.isSafeInteger(dodgeMoveId(m))&&dodgeMoveId(m)>0;
    });
  }
  function dodgeSameIsland(a,b){
    if(!a||!b||Number(a.id)===Number(b.id))return false;
    const ax=a.getIslandCoordinateX?.()??a.attributes?.island_x;
    const ay=a.getIslandCoordinateY?.()??a.attributes?.island_y;
    const bx=b.getIslandCoordinateX?.()??b.attributes?.island_x;
    const by=b.getIslandCoordinateY?.()??b.attributes?.island_y;
    if([ax,ay,bx,by].every(v=>v!==undefined&&v!==null))return String(ax)===String(bx)&&String(ay)===String(by);
    const id1=a.getIslandId?.()??a.attributes?.island_id,id2=b.getIslandId?.()??b.attributes?.island_id;
    return id1!=null&&id2!=null&&String(id1)===String(id2);
  }
  function dodgeDestinations(id,incoming=[]){
    const origin=townBy(id),soon=dodgeNow()+30000;
    return towns().filter(t=>dodgeSameIsland(origin,t))
      .sort((a,b)=>{
        const ax=incoming.some(x=>x.townId===Number(a.id)&&x.arrivalMs<=soon);
        const bx=incoming.some(x=>x.townId===Number(b.id)&&x.arrivalMs<=soon);
        return Number(ax)-Number(bx)||Number(a.id)-Number(b.id);
      });
  }
  function dodgeDestination(id,incoming){
    const configured=Number(config.dodge.targets?.[id]);
    const list=dodgeDestinations(id,incoming);
    if(configured&&list.some(t=>Number(t.id)===configured))return configured;
    return Number(list[0]?.id)||0;
  }
  function dodgeUnits(t){
    const unitGroups={land:{},naval:{}};
    const setting=config.dodge;
    for(const [unit,raw] of Object.entries(t.units?.()||{})){
      const count=Math.floor(Number(raw));
      const def=W.GameData?.units?.[unit];
      if(!def||unit==='militia'||!Number.isSafeInteger(count)||count<1)continue;
      const kind=def.is_naval?'naval':'land';
      if(kind==='land'&&setting.land===false)continue;
      if(kind==='naval'&&setting.naval===false)continue;
      unitGroups[kind][unit]=count;
    }
    return unitGroups;
  }
  function dodgeLeader(){
    const now=Date.now();
    try{
      const lock=JSON.parse(localStorage.getItem(DODGE_LOCK)||'{}');
      if(lock.owner&&lock.owner!==instanceId&&Number(lock.until)>now)return false;
    }catch{}
    localStorage.setItem(DODGE_LOCK,JSON.stringify({owner:instanceId,until:now+35000}));
    return true;
  }
  const dodgeWaveGap=()=>Math.min(60,Math.max(0,Number(config.dodge.waveGapSeconds)||12))*1000;
  function dodgeLateAttacks(job,attacks){
    const cutoff=Number(job.firstImpactMs)+dodgeWaveGap();
    const impacts=attacks.filter(a=>a.townId===Number(job.townId)&&a.arrivalMs>=job.firstImpactMs-1000&&a.arrivalMs<=cutoff);
    return Math.max(Number(job.lastImpactMs)||0,...impacts.map(a=>a.arrivalMs));
  }
  const dodgeTiming=(startMs,lastImpactMs)=>({
    cancelAtMs:Math.round((startMs+lastImpactMs+Math.max(1,Number(config.dodge.returnAfterSeconds)||1)*1000)/2),
    returnAtMs:lastImpactMs+Math.max(1,Number(config.dodge.returnAfterSeconds)||1)*1000
  });
  const dodgeActive=j=>['dispatching','identifying','sent','canceling'].includes(j?.state);
  const dodgeTracked=d=>Object.values(d.jobs||{}).filter(j=>dodgeActive(j));
  function dodgeFindCommand(job){
    const excluded=new Set((job.existingIds||[]).map(String));
    const found=dodgeOutgoing(job.townId,job.targetId).filter(m=>{
      const id=dodgeMoveId(m);
      if(excluded.has(String(id)))return false;
      const started=dodgeEpochMs(m.data.started_at??m.data.start_time??m.data.sent_at??m.data.departed_at);
      return !Number.isFinite(started)||started>=Number(job.sentAtMs)-3500;
    });
    return found.length===1?found[0]:null;
  }
  let dodgeBusy=false;
  const dodgePreviewed=new Set();
  function dodgeSaveRecord(store,job){store.jobs??={};store.jobs[job.id]=job;dodgeWrite(store);}
  function dodgeCanOperate(){
    return connected()&&!document.querySelector('iframe[src*="captcha"],.captcha_container,.recaptcha-wrapper');
  }
  async function dodgeCancel(store,job,now){
    if(!job.commandId||job.state==='canceling')return false;
    job.state='canceling';job.cancelRequestedAtMs=now;dodgeSaveRecord(store,job);
    try{
      await action('command_info','cancel_command',{id:Number(job.commandId),town_id:Number(job.townId),nl_init:true},true);
      job.state='cancelled';job.cancelledAtMs=dodgeNow();
      job.estimatedArrivalMs=2*job.cancelledAtMs-(Number(job.startedAtMs)||Number(job.sentAtMs));
      dodgeSaveRecord(store,job);
      log(`Esquiva ${tName(townBy(job.townId))} (${job.group}): apoio #${job.commandId} cancelado. Retorno estimado ${new Date(job.estimatedArrivalMs).toLocaleTimeString('pt-BR',{hour12:false})}`);
      return true;
    }catch(e){
      job.state='sent';job.retryAfterMs=dodgeNow()+1500;
      job.error=String(e.message||e);dodgeSaveRecord(store,job);
      log(`Esquiva: falha ao cancelar apoio #${job.commandId}: ${job.error}`,'WARN');
      return false;
    }
  }
  async function dodgeDispatch(store,townId,targetId,group,units,wave){
    const now=dodgeNow();
    const job={
      id:`ED-${townId}-${group}-${Date.now().toString(36)}`,
      townId,targetId,group,units,
      state:'dispatching',sentAtMs:now,
      firstImpactMs:wave.firstImpactMs,lastImpactMs:wave.lastImpactMs,
      existingIds:dodgeOutgoing(townId,targetId).map(dodgeMoveId),
      commandId:0,retryAfterMs:0
    };
    dodgeSaveRecord(store,job);
    try{
      await action('town_info','send_units',{id:Number(targetId),town_id:Number(townId),type:'support',nl_init:true,...units});
      job.state='identifying';
      job.ackAtMs=dodgeNow();
      dodgeSaveRecord(store,job);
      const match=dodgeFindCommand(job);
      if(match){
        job.commandId=dodgeMoveId(match);
        job.startedAtMs=dodgeEpochMs(match.data.started_at??match.data.start_time??match.data.sent_at)||job.sentAtMs;
        job.outboundArrivalMs=dodgeArrival(match.data);
        job.state='sent';dodgeSaveRecord(store,job);
      }
      log(`Esquiva: ${tName(townBy(townId))} → ${tName(townBy(targetId))} (${group}: ${Object.entries(units).map(([k,v])=>k+' '+v).join(', ')}); aguardando cancelamento cronometrado`);
      return true;
    }catch(e){
      job.state='identifying';job.error=String(e.message||e);
      dodgeSaveRecord(store,job);
      log(`Esquiva: envio sem confirmação (${group}). Aguardando identificação do comando, sem reenviar: ${job.error}`,'WARN');
      return false;
    }
  }
  function dodgeCleanup(store,now){
    let dirty=false;
    for(const [key,j] of Object.entries(store.jobs||{})){
      if(['cancelled','needs_attention'].includes(j.state)&&now-Number(j.cancelledAtMs||j.ackAtMs||j.sentAtMs)>7200000){
        delete store.jobs[key];dirty=true;
      }
    }
    const recent=Object.entries(store.handled||{}).filter(([,ts])=>now-Number(ts)<21600000);
    if(recent.length!==Object.keys(store.handled||{}).length){store.handled=Object.fromEntries(recent);dirty=true;}
    if(dirty)dodgeWrite(store);
  }
  async function dodgePulse(){
    if(dodgeBusy||!dodgeCanOperate()||!dodgeLeader())return;
    dodgeBusy=true;
    try{
      const now=dodgeNow(),store=dodgeRead();
      store.jobs??={};store.handled??={};
      dodgeCleanup(store,now);
      const attacks=dodgeIncoming();
      // Continue cancelamentos já iniciados mesmo que o usuário pause o módulo.
      for(const job of dodgeTracked(store)){
        if(job.state==='canceling'){
          if(now-Number(job.cancelRequestedAtMs||now)>16000){
            job.state='sent';job.retryAfterMs=now+2000;dodgeSaveRecord(store,job);
          }
          continue;
        }
        if(job.state==='dispatching'||job.state==='identifying'){
          const found=dodgeFindCommand(job);
          if(found){
            job.commandId=dodgeMoveId(found);
            job.startedAtMs=dodgeEpochMs(found.data.started_at??found.data.start_time??found.data.sent_at)||job.sentAtMs;
            job.outboundArrivalMs=dodgeArrival(found.data);
            job.state='sent';dodgeSaveRecord(store,job);
          }else if(now-Number(job.sentAtMs)>20000){
            job.state='needs_attention';job.ackAtMs=now;
            job.error='Movimento não identificado; verificar apoio no jogo';
            dodgeSaveRecord(store,job);
            notify(`Esquiva: confira o apoio de ${tName(townBy(job.townId))}; comando não identificado`);
            continue;
          }else continue;
        }
        if(job.state!=='sent'||Number(job.retryAfterMs)>now)continue;
        job.lastImpactMs=dodgeLateAttacks(job,attacks);
        const s=Number(job.startedAtMs)||Number(job.sentAtMs);
        const plan=dodgeTiming(s,job.lastImpactMs);
        if(job.outboundArrivalMs&&Number.isFinite(job.outboundArrivalMs)&&plan.cancelAtMs>=job.outboundArrivalMs-1250){
          job.error='Tempo de viagem insuficiente para retornar após toda a onda';
          job.state='needs_attention';job.ackAtMs=now;dodgeSaveRecord(store,job);
          notify(`Esquiva: destino muito perto para cancelar apoio #${job.commandId}; verifique manualmente`);
          continue;
        }
        if(plan.cancelAtMs-s>595000){
          job.error='Cancelamento calculado depois do limite de 10 minutos';
          job.state='needs_attention';job.ackAtMs=now;dodgeSaveRecord(store,job);
          notify(`Esquiva: janela de 10 minutos inviável no apoio #${job.commandId}`);
          continue;
        }
        if(job.cancelAtMs!==plan.cancelAtMs){
          job.cancelAtMs=plan.cancelAtMs;job.returnAtMs=plan.returnAtMs;
          dodgeSaveRecord(store,job);
        }
        if(now>=job.cancelAtMs){
          await dodgeCancel(store,job,now);
          return;
        }
      }
      if(!config.enabled||!config.modules.dodge)return;
      const minLead=1000,lead=Math.min(5000,Math.max(1000,Number(config.dodge.leadSeconds||5)*1000));
      const own=new Map(towns().map(t=>[Number(t.id),t]));
      for(const [townId,town] of own){
        if(dodgeTracked(store).some(j=>Number(j.townId)===townId))continue;
        const waveEvents=attacks.filter(a=>a.townId===townId&&a.arrivalMs>now);
        const first=waveEvents[0];
        if(!first)continue;
        const before=first.arrivalMs-now;
        if(before>lead||before<minLead)continue;
        if(store.handled[first.id])continue;
        const targetId=dodgeDestination(townId,attacks);
        if(!targetId){
          if(!store.lastWarning?.[townId]||now-Number(store.lastWarning[townId])>10000){
            store.lastWarning??={};store.lastWarning[townId]=now;dodgeWrite(store);
            log(`Esquiva ${tName(town)}: não existe outra cidade própria na mesma ilha para receber apoio`,'WARN');
          }
          continue;
        }
        const lastImpact=Math.max(first.arrivalMs,...waveEvents.filter(x=>x.arrivalMs-first.arrivalMs<=dodgeWaveGap()).map(x=>x.arrivalMs));
        const groups=dodgeUnits(town);
        const active=Object.entries(groups).filter(([,u])=>Object.keys(u).length>0);
        if(!active.length){store.handled[first.id]=now;dodgeWrite(store);continue;}
        const wave={firstImpactMs:first.arrivalMs,lastImpactMs:lastImpact};
        if(config.dryRun){
          if(!dodgePreviewed.has(first.id)){
            dodgePreviewed.add(first.id);
            log(`SIMULAÇÃO ESQUIVA ${tName(town)} → ${tName(townBy(targetId))}: impacto em ${(before/1000).toFixed(2)} s, retorno-alvo ${new Date(lastImpact+1000).toLocaleTimeString('pt-BR',{hour12:false})}`);
          }
          continue;
        }
        store.handled[first.id]=now;dodgeWrite(store);
        for(const [kind,units] of active){
          if(dodgeNow()>=first.arrivalMs-350){
            log(`Esquiva: ${kind} não enviada: impacto muito próximo`,'WARN');break;
          }
          await dodgeDispatch(store,townId,targetId,kind,units,wave);
        }
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
    const records=Object.values(store.jobs||{}).filter(j=>dodgeActive(j)||j.state==='needs_attention').slice(-12).map(j=>
      `<div class="city"><b>${cleanStr(tName(townBy(j.townId)))} → ${cleanStr(tName(townBy(j.targetId)))}</b>
      <div>${cleanStr(j.group)} · apoio #${cleanStr(j.commandId||'identificando')} · ${cleanStr(j.state)}</div>
      <div class="smallnote">${j.cancelAtMs?'Cancelar às '+new Date(j.cancelAtMs).toLocaleTimeString('pt-BR',{hour12:false}):'Aguardando movimento'}
      ${j.returnAtMs?' · retorno planejado '+new Date(j.returnAtMs).toLocaleTimeString('pt-BR',{hour12:false}):''}</div>
      ${j.error?`<div class="smallnote">${cleanStr(j.error)}</div>`:''}</div>`
    ).join('');
    return `${moduleNames()}
      ${section('Esquiva sincronizada por cidade')}
      <p class="smallnote">Entre 5 e 1 segundos antes do ataque, envia tropas disponíveis em apoio para outra cidade sua da mesma ilha. Cancela cada apoio após calcular o tempo já percorrido para voltar depois do impacto.</p>
      <div class="formrow"><span>Enviar faltando (segundos)</span><input type="number" min="1" max="5" step="1" data-setting="dodge.leadSeconds" value="${config.dodge.leadSeconds}"></div>
      <div class="formrow"><span>Voltar depois do ataque (segundos)</span><input type="number" min="1" max="20" step="1" data-setting="dodge.returnAfterSeconds" value="${config.dodge.returnAfterSeconds}"></div>
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
      <p class="smallnote">O retorno continua programado mesmo se o bot for pausado depois do envio. A precisão de 1 segundo depende da resposta do servidor e da latência da conexão. O script só cancela apoios que ele próprio identificou. Relógio usado: ${dodgeClock.source}.</p>`;
  }
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
    rescope();
    if(running||!canRun()||!lock())return;
    running=true;
    try {
      const now=Date.now();
      const order=['commands','alerts','finishFree','smartQueue','banditRewards','quests','bootcamp','ruralUnlock','ruralUpgrade','farm','build','recruit','research','trade','ruralTrade','culture','cave'];
      for(const id of order){
        if(!config.modules[id] || num(nextRun[id])>now)continue;
        nextRun[id]=now+Math.max(2,num(config.intervals[id],MODULES[id][2]))*1000;
        try{const did=await handlers[id](); if(did){if(id!=='commands')nextRun[id]=Date.now()+Math.max(5,num(config.intervals[id],MODULES[id][2]))*1000;break;}}
        catch(e){log(`${MODULES[id][0]}: ${e.message}`,'ERROR');nextRun[id]=Date.now()+60000;break;}
      }
    }finally{running=false;unlock();}
  };
  let selectedCity='';
  const STATUS=()=> connected()?`${towns().length} cidades · ${config.enabled?'executando':'pausado'} · ${config.dryRun?'SIMULAÇÃO':'AO VIVO'}`:'Aguardando cliente do jogo';
  const toggle=(k,title)=>`<label class="mod"><input type="checkbox" data-module="${k}" ${config.modules[k]?'checked':''}><span>${title}</span><small>${num(config.intervals[k])}s</small></label>`;
  const optionList=(list,chosen)=>list.map(([v,label])=>`<option value="${cleanStr(v)}" ${String(chosen)===String(v)?'selected':''}>${cleanStr(label)}</option>`).join('');
  const selectTown=(id,selected='')=>`<select id="${id}">${optionList(towns().map(t=>[t.id,`${tName(t)} (#${t.id})`]),selected)}</select>`;
  const section = title => `<div class="sect">${title}</div>`;
  const moduleNames=()=>Object.entries(MODULES).filter(([k,p])=>p[1]===config.ui.tab).map(([k,p])=>toggle(k,p[0])).join('');
  const paneModule=k=>toggle(k,MODULES[k][0]);
  const dashboard=()=>{
    const r=ruralStatus();const q=questRows();const camp=W.MM?.getModelByNameAndPlayerId?.('PlayerAttackSpot');
    const enabled=Object.entries(config.modules).filter(([,v])=>v).length;
    return `${section('Visão geral')}<div class="stats"><div><b>${towns().length}</b>Cidades</div><div><b>${r.unlocked}/${r.rows.length}</b>Aldeias</div><div><b>${r.bp??'—'}</b>Pontos de batalha</div><div><b>${q.length}</b>Missões prontas</div></div>
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
    <div class="formrow"><span>Espaço mín. em armazém</span><input type="number" step="0.01" min="0" max="0.9" data-setting="farm.minStorageFree" value="${config.farm.minStorageFree}"></div>
    ${section('Comércio entre cidades')}
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
    <p class="smallnote">Unidade inexistente neste mundo é ignorada no modelo. As metas são por cidade e podem ser alteradas abaixo.</p>`;
  };
let queueKindSelected='building';
  const queueContent=()=>{
    const town=getSelected();
    const kind=queueKindSelected;
    const buildingTypes=BUILDINGS.filter(k=>W.GameData?.buildings?.[k]);
    const unitTypes=Object.entries(W.GameData?.units||{}).filter(([k,def])=>def&&typeof def==='object'&&Boolean(def.is_naval)===(kind==='ship')).map(([k])=>k);
    const researchTypes=Object.keys(W.GameData?.researches||{});
    const choices=kind==='building'?buildingTypes:kind==='research'?researchTypes:unitTypes;
    const own=queueJobs().map((j,index)=>({...queueAnalyze(j),index})).sort((a,b)=>(a.state==='ready'?0:1)-(b.state==='ready'?0:1)||(a.state==='ready'?a.score-b.score:a.index-b.index));
    const statusName={ready:'✅ Executável',wait:'⏳ Aguardando',done:'✔ Concluído',blocked:'⚠ Verificar'};
    const ready=own.filter(x=>x.state==='ready');
    const best=ready[0];
    const rows=own.map(x=>{
      const j=x.job;
      return `<div class="city compact">
        <div style="flex:1;min-width:180px"><b>${cleanStr(queueName(j))}</b>
          <div class="smallnote">${statusName[x.state]||''}: ${cleanStr(x.why)}</div>
          <div class="smallnote">${x.cost?`${cleanStr(queueMoney(x.cost))} · total ${x.score}`:'Custo ainda não disponível'}</div>
        </div>
        <button title="Excluir da fila" data-remove-queue="${x.index}">Excluir</button>
      </div>`;
    }).join('');
    return `${moduleNames()}
      ${section('Prioridade: sempre o menor custo')}
      <div class="helpbox">A fila escolhe a ordem <b>mais barata que já pode ser iniciada</b>, comparando madeira + pedra + ferro. Se a obra, pesquisa ou treino estiver bloqueado, ela tenta o próximo item. Cada meta é controlada por cidade.</div>
      <div class="stats"><div><b>${queueJobs().length}</b>Metas cadastradas</div><div><b>${ready.length}</b>Prontas agora</div></div>
      <p class="smallnote">${best?`Próxima ordem: ${cleanStr(queueName(best.job))} · custo total ${best.score}`:'Nenhuma ordem executável agora. O bot aguardará recursos, pré-requisitos ou espaço nas filas do jogo.'}</p>
      ${section('Adicionar uma meta')}
      <div class="formrow"><span>Cidade</span>${selectTown('queueCitySelect',town?.id)}</div>
      <div class="formrow"><span>Categoria</span><select id="queueKind">${optionList([['building','Construção'],['troop','Tropas terrestres'],['ship','Navios'],['research','Pesquisa']],kind)}</select></div>
      <div class="formrow"><span>${kind==='building'?'Edifício':kind==='research'?'Pesquisa':'Unidade'}</span><select id="queueKey">${optionList(choices.map(k=>[k,k]))}</select></div>
      ${kind==='research'?'<p class="smallnote">A pesquisa é feita uma vez e fica marcada como concluída.</p>':`<div class="formrow"><span>${kind==='building'?'Nível desejado':'Total de unidades desejadas'}</span><input type="number" id="queueTarget" min="1" step="1" value="${kind==='building'?'10':'100'}"></div>`}
      <div class="tools"><button class="primary" data-action="queueAdd">Adicionar à fila</button><button data-action="queueImport">Importar metas da cidade</button></div>
      <p class="smallnote">Importar metas traz edifícios, tropas, navios e pesquisas dos modelos já aplicados na aba Cidades/Tropas. Quando a fila inteligente está ativa, ela assume essas tarefas nas cidades cadastradas e evita duplicação pelos módulos antigos.</p>
      <div class="formrow"><span>Máximo por ordem de tropas/navios</span><input type="number" min="1" max="999" data-setting="smartQueue.maxBatch" value="${config.smartQueue.maxBatch}"></div>
      ${section('Fila ordenada por custo')}
      <div class="tools"><button data-action="queueClearDone">Limpar concluídos</button><button data-action="queueClearAll">Limpar toda a fila</button></div>
      <div class="cityscroll" style="max-height:320px">${rows||'<p class="smallnote">A fila está vazia. Adicione uma meta acima.</p>'}</div>
      <p class="smallnote">As ações aparecem no histórico (Log). A prioridade é econômica, não por tempo de conclusão. Em modo simulação, apenas registra o que seria executado.</p>`;
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
    ${section('Acampamento e alertas')}
    <div class="checks"><label><input type="checkbox" data-setting="bootcamp.stashRewards" ${config.bootcamp.stashRewards?'checked':''}> Guardar recompensas permitidas</label>
    <label><input type="checkbox" data-setting="alerts.desktop" ${config.alerts.desktop?'checked':''}> Notificações desktop</label></div>
    <button data-action="askNotif">Permitir notificações</button>`;
  };
  const rewardsContent=()=>{
    const ready=questRows();const camp=W.MM?.getModelByNameAndPlayerId?.('PlayerAttackSpot');
    const rewards=ready.map(q=>`<div class="city"><b>${cleanStr(q.attributes?.name||q.attributes?.progressable_id)}</b><div>✅ Concluída · ilha ${cleanStr(String(q.attributes?.configuration?.island_x??'?'))}:${cleanStr(String(q.attributes?.configuration?.island_y??'?'))}</div></div>`).join('');
    return `${moduleNames()}<div class="stats"><div><b>${ready.length}</b>Missões prontas</div><div><b>${camp?.hasReward?.()?'1':'0'}</b>Recompensa PvE</div></div>
      ${section('Missões de ilha')}<p class="smallnote">Reivindica apenas missões marcadas pelo jogo como <b>concluídas (satisfied)</b>. Não começa missões, não gasta unidades e escolhe a cidade da mesma ilha quando houver coordenadas.</p>
      <div class="formrow"><span>Recompensas</span><select data-setting="quests.rewardAction">${optionList([['stash','Guardar quando possível'],['use','Utilizar / receber']],config.quests.rewardAction)}</select></div>
      <div class="villages">${rewards||'<p class="smallnote">Nenhuma missão concluída encontrada agora.</p>'}</div>
      ${section('Recompensas do acampamento')}<p class="smallnote">Recebe recompensas após as batalhas dos bandidos. Se a recompensa puder ser guardada, respeita a opção abaixo. Funciona independentemente do ataque PvE.</p>
      <div class="checks"><label><input type="checkbox" data-setting="banditRewards.stashIfPossible" ${config.banditRewards.stashIfPossible?'checked':''}> Guardar quando permitido</label></div>
      <p class="smallnote">Missões iniciais sem identificação confirmada no cliente não são enviadas por um endpoint presumido; o modo automático cobre missões de ilha concluídas.</p>`;
  };
  const configContent=()=>`${section('Controle global')}
    <div class="checks"><label><input type="checkbox" data-global="enabled" ${config.enabled?'checked':''}> Execução geral</label><label><input type="checkbox" data-global="dryRun" ${config.dryRun?'checked':''}> Modo simulação (sem envio)</label></div>
    <p class="smallnote">Sem ferramentas externas, tokens ou senhas. Dados ficam no navegador, por mundo e jogador. Desativar todos os módulos é o estado inicial.</p>
    ${section('Intervalos')}
    ${Object.keys(MODULES).map(k=>`<div class="formrow compact"><span>${MODULES[k][0]}</span><input type="number" data-interval="${k}" min="2" max="86400" value="${num(config.intervals[k])}"> <small>s</small></div>`).join('')}
    ${section('JSON da configuração')}
    <textarea id="jsonEdit" spellcheck="false">${cleanStr(JSON.stringify(config,null,2))}</textarea>
    <div class="tools"><button class="primary" data-action="applyJson">Aplicar JSON</button><button data-action="exportJson">Exportar</button><button data-action="clearFired">Rearmar comandos</button><button data-action="reset">Redefinir</button></div>
    <p class="smallnote">Envios operacionais para Grepolis não são executados em modo simulação. Os identificadores dos edifícios, pesquisas e unidades vêm do cliente do jogo.</p>`;
  const logContent=()=>`${section('Registro local')}
    <div class="tools"><button data-action="clearLog">Limpar histórico</button><button data-action="downloadLog">Exportar log</button></div>
    <div class="history">${logs.map(x=>`<div class="${x.level==='ERROR'?'error':x.level==='ALERT'?'warn':''}"><span>${x.stamp}</span> <b>${x.level}</b> ${cleanStr(x.message)}</div>`).join('')||'<p>Nenhum evento registrado.</p>'}</div>`;
  let host, shadow, content;
  const render=()=>{
    if(!shadow)return;
    host.style.left=config.ui.x===null?'auto':Math.max(0,num(config.ui.x))+'px';
    host.style.right=config.ui.x===null?'20px':'auto';
    host.style.top=Math.max(0,num(config.ui.y))+'px';
    const body=({'INÍCIO':dashboard,CIDADES:cityContent,FILA:queueContent,ESQUIVA:dodgeContent,ALDEIAS:villagesContent,TROPAS:troopsContent,COMBATE:combatContent,ECONOMIA:economyContent,'MISSÕES':rewardsContent,AJUSTES:configContent,LOG:logContent}[config.ui.tab]||dashboard)();
    shadow.querySelector('#gp-app').innerHTML=`
      <div class="head" id="drag"><span class="logo">♜ GREPOPILOT</span><span class="v">v0.5.0</span><button class="collapse" data-action="collapse">${config.ui.collapsed?'□':'─'}</button></div>
      ${config.ui.collapsed?'':`<div class="status"><i class="dot ${config.enabled?(config.dryRun?'sim':'live'):''}"></i>${cleanStr(STATUS())}</div>
      <div class="tabs">${['INÍCIO','CIDADES','FILA','ALDEIAS','TROPAS','COMBATE','ESQUIVA','ECONOMIA','MISSÕES','AJUSTES','LOG'].map(tab=>`<button data-tab="${tab}" class="${config.ui.tab===tab?'active':''}">${tab}</button>`).join('')}</div>
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
        case 'toggle':config.enabled=!config.enabled;save();log(config.enabled?'Bot iniciado':'Bot interrompido');break;
        case 'queueAdd': {
          const t=getSelected(),kind=el('queueKind')?.value,key=el('queueKey')?.value;
          if(!t||!['building','troop','ship','research'].includes(kind)||!key)throw Error('Selecione cidade, tipo e item');
          const goal=kind==='research'?1:Math.floor(num(el('queueTarget')?.value));
          if(goal<1)throw Error('A meta deve ser maior que zero');
          if(queueJobs().length>=120)throw Error('Limite de 120 metas; exclua uma antes de adicionar');
          const existing=queueJobs().find(j=>String(j.townId)===String(t.id)&&j.kind===kind&&j.key===key);
          if(existing) existing.target=goal;
          else config.smartQueue.items.push({id:'GQ-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),townId:Number(t.id),kind,key,target:goal});
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
          const v=JSON.parse(el('jsonEdit').value);config=migrate(merge(clone(BASE),v),v);save();nextRun={};log('JSON aplicado');break;
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
    if(t.dataset.global){config[t.dataset.global]=t.checked;save();render();return;}
    if(t.dataset.setting){setPath(t.dataset.setting,t.type==='checkbox'?t.checked:t.type==='number'?num(t.value):t.value);render();return;}
    if(t.dataset.interval){config.intervals[t.dataset.interval]=Math.max(2,num(t.value,60));save();render();return;}
    if(t.id==='citySelect'||t.id==='queueCitySelect'||t.id==='dodgeSource'){selectedCity=t.value;render();}
    if(t.id==='queueKind'){queueKindSelected=t.value;render();}
  };
  const mount=()=>{
    if(host)return;
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
    mount();
    save(); // Persiste migração dos controles de aldeia da v0.2.
    setInterval(()=>{try{tick()}catch(e){log(e.message,'ERROR')}},1500);
    setInterval(()=>{dodgePulse().catch(e=>log(`Esquiva: ${e.message}`,'ERROR'))},125);
    setInterval(()=>{
      if(config.ui.tab==='LOG'||config.ui.collapsed)return;
      const el=shadow.querySelector('.status');if(el)el.lastChild.textContent=STATUS();
    },5000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && config.enabled)nextRun.alerts=0;});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();