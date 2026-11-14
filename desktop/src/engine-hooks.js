'use strict';
// Integração por API direta no fechamento lexical do motor já existente.
// A HUD antiga não é reutilizada: apenas os comandos e as configurações.
const ANCHOR = "  const syncRole=()=>config.sync?.role==='standby'?'standby':'primary';";
const HOOK = String.raw`
  // Native Desktop bridge. A UI anterior pode continuar renderizando internamente,
  // mas o Desktop não a apresenta: a interface externa é inteiramente redesenhada.
  W.__GREPOPILOT_DESKTOP_API__ = Object.freeze({
    snapshot: () => JSON.parse(JSON.stringify(config)),
    patch: (path,value) => {
      if(typeof path!=='string'||path.length>180||!/^([a-zA-Z][\w]*)(\.[a-zA-Z0-9_-]+)*$/.test(path)) throw Error('Chave inválida');
      if(path.split('.').some(p=>['__proto__','prototype','constructor'].includes(p))) throw Error('Chave bloqueada');
      if(JSON.stringify(value)?.length>25000) throw Error('Valor excessivo');
      const names=path.split('.');
      const rootNames=new Set(['enabled','dryRun','modules','intervals','farm','build','finishFree','cityProfiles','recruit','research','smartQueue','trade','ruralTrade','ruralUpgrade','troopProfiles','quests','banditRewards','culture','bootcamp','cave','commands','alerts','dodge','attackTest','sync','security','autoReload','onboarding']);
      if(!rootNames.has(names[0])) throw Error('Opção não editável');
      let dst=config;
      for(const name of names.slice(0,-1)){
        if(dst[name]==null||typeof dst[name]!=='object'||Array.isArray(dst[name]))dst[name]={};
        dst=dst[name];
      }
      dst[names[names.length-1]]=value;
      config.autoReload.enabled=false;
      if(path==='enabled'&&value===true) config.onboarding.completed=true;
      if(names[0]==='recruit'){
        nextRun.recruit=0;
        if(names[1]==='targets'&&names.length===4&&Number(value)>0)config.modules.recruit=true;
      }
      if(names[0]==='build')nextRun.build=0;
      if(names[0]==='research')nextRun.research=0;
      if(names[0]==='modules')nextRun[names[1]]=0;
      save();render();
      return true;
    },
    templates: () => ({cities:JSON.parse(JSON.stringify(CITY_TEMPLATES)),troops:JSON.parse(JSON.stringify(TROOP_TEMPLATES))}),
    applyTemplate: (kind,key,townId,mythUnit='') => {
      const town=townBy(String(townId));
      if(!town)throw Error('Cidade não encontrada');
      if(kind==='city'){
        const plan=templateDetails(key,town,mythUnit);
        config.build.targets[town.id]=plan.buildings;
        config.build.priority=[...new Set([...Object.keys(plan.buildings),...config.build.priority])];
        config.recruit.targets[town.id]=plan.units;
        config.research.queue[town.id]=plan.researches;
        config.cityProfiles[town.id]=key;
        nextRun.build=nextRun.recruit=nextRun.research=0;
      }else if(kind==='troops'){
        const goal=troopTemplateDetails(key,town,mythUnit);
        config.recruit.targets[town.id]=goal;
        config.troopProfiles[town.id]=key;
        nextRun.recruit=0;
      }else throw Error('Modelo inválido');
      save();render();return true;
    },
    startRecruit: () => {
      if(!connected())throw Error('Grepolis ainda não carregado');
      if(syncRole()!=='primary')throw Error('Somente PC principal pode executar');
      config.modules.recruit=true;config.enabled=true;config.dryRun=false;
      config.onboarding.completed=true;nextRun.recruit=0;save();render();
      log('Recrutamento real iniciado pelo Desktop');return true;
    },
    recruitPlan: () => {
      const result={};
      for(const [id,goals] of Object.entries(config.recruit.targets||{})){
        const town=townBy(id);result[id]={};
        for(const [unit,goal] of Object.entries(goals||{})){
          if(Number(goal)<=0)continue;
          try{const plan=town?planRecruitBatch(town,unit,goal):
            {state:'blocked',reason:'Cidade não encontrada',amount:0};
            result[id][unit]={state:plan.state,reason:plan.reason,amount:plan.amount};
          }catch(e){result[id][unit]={state:'blocked',reason:String(e.message||e),amount:0};}
        }
      }
      return result;
    },
    startDodge: () => {
      if(!connected())throw Error('Grepolis ainda não carregado');
      if(syncRole()!=='primary')throw Error('O PC secundário não pode executar esquiva');
      if(securityBlocked())throw Error('CAPTCHA ativo; aguarde a verificação');
      config.modules.dodge=true;config.enabled=true;config.dryRun=false;
      config.onboarding.completed=true;nextRun.dodge=0;save();render();
      log('Esquiva real ativada pelo Desktop');return true;
    },
    dodgeInfo: (townId) => {
      const id=Number(townId),all=dodgeIncoming(),jobs=Object.values(dodgeRead().jobs||{});
      return {
        enabled:config.enabled,dryRun:config.dryRun,module:config.modules.dodge,
        role:syncRole(),captcha:securityBlocked(),clock:dodgeClock.source,
        directoryError:dodgeWorld.error,
        destinations:dodgeDestinations(id,all).map(row=>({id:row.id,name:row.name,
          relation:dodgeTownRelation(row)})),
        incoming:all.filter(a=>Number(a.townId)===id&&a.arrivalMs>dodgeNow()).slice(0,12).map(a=>({
          id:a.id,arrivalMs:a.arrivalMs,type:a.type,
          classification:a.intel?.classification||'unknown',
          allow:dodgeAttackDecision(a).allow,reason:dodgeAttackDecision(a).reason
        })),
        jobs:jobs.filter(j=>Number(j.townId)===id&&
          ['dispatching','identifying','sent','canceling','needs_attention'].includes(j.state))
          .map(j=>({id:j.id,state:j.state,commandId:j.commandId,
            targetId:j.targetId,error:j.error||'',cancelAtMs:j.cancelAtMs||0})),
        configuredTarget:Number(config.dodge.targets?.[id])||0
      };
    },
    setDodgeTarget: (townId,destination) => {
      const id=Number(townId),dest=Number(destination);
      if(!townBy(id))throw Error('Cidade protegida não encontrada');
      if(!Number.isSafeInteger(dest)||dest<0)throw Error('ID inválido');
      const list=dodgeDestinations(id,dodgeIncoming());
      if(dest>0&&!list.some(x=>x.id===dest))
        throw Error('Destino não localizado na mesma ilha; aguarde a lista de cidades atualizar');
      config.dodge.targets[id]=dest;save();return true;
    },
    runTest: (townId,allowLive=false) => {
      if(config.attackTest.mode==='live'&&!allowLive)throw Error('Confirme o teste com movimentação real');
      testStart(Number(townId),config.attackTest.mode,config.attackTest.delay,config.attackTest.wave);return true;
    },
    stopTest: () => {testStop();return true;},
    verify: () => healthSnapshot(),
    status: () => ({connected:connected(),enabled:config.enabled,dryRun:config.dryRun,scope,
      logs:logs.slice(-25).map(x=>({level:x.level,message:x.message,stamp:x.stamp}))}),
    catalog: () => ({
      cities:towns().map(t=>({id:String(t.id),name:tName(t),god:godOf(t)||'',
        buildings:t.buildings?.()?.attributes||{},resources:t.resources?.()||{}})),
      units:Object.entries(W.GameData?.units||{}).filter(([,x])=>x&&typeof x==='object').map(([id,x])=>({id,name:String(x.name||x.name_plural||id),isNaval:!!x.is_naval,requires:String(x.research||'')})),
      researches:Object.entries(W.GameData?.researches||{}).filter(([,x])=>x&&typeof x==='object').map(([id,x])=>({id,name:String(x.name||id),points:Number(x.research_points)||0}))
    })
  });
`;
function patchEngineSource(source){
  if(typeof source!=='string'||!source.includes('GrepoPilot'))throw Error('Motor inválido');
  if(!source.includes(ANCHOR))throw Error('Não foi encontrado o ponto de integração da versão atual do motor');
  return source.replace(ANCHOR, HOOK+'\n'+ANCHOR)
    .replace("host.style.cssText='position:fixed;z-index:2147483000;top:90px;right:20px';","host.style.cssText='display:none!important';")
    .replace('try{mount();contextualStart();}', 'try{mount();}');
}
module.exports={patchEngineSource,ANCHOR};
