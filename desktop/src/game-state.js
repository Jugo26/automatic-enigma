'use strict';
// Executado no contexto da página do jogo; retorna somente dados serializáveis.
function stateExpression(page, town){
  const args=JSON.stringify([typeof page==='string'?page:'',typeof town==='string'?town:'']);
  return `(([page,town]) => {
  const api=window.__GREPOPILOT_DESKTOP_API__;
  const game=window.Game;
  if(!game||!game.player_id)return {ready:false,url:location.href,reason:'Abra um mundo e entre na sua conta do Grepolis'};
  if(!api)return {ready:false,url:location.href,needsEngine:!!window.GameData?.units,reason:'Carregando integração com o motor...'};
  const catalog=api.catalog();
  const state={ready:true,url:location.href,status:api.status(),config:api.snapshot(),catalog};
  const city=catalog.cities.find(item=>item.id===town)?.id??catalog.cities[0]?.id;
  const recruiting=page==='QUARTEL'||page==='PORTO';
  if(recruiting&&city)state.recruitPlan=api.recruitPlan(city);
  if(page==='MODELOS')state.templates=api.templates();
  if(page==='ECONOMIA')state.cave=api.caveInfo?.();
  if(page==='MISSÕES'){
    state.tutorial=api.tutorialInfo?.();
    state.islandQuests=api.islandQuestStatus?.();
  }
  if(page==='ESQUIVA'&&city)state.dodgeInfo=api.dodgeInfo(city);
  if(!recruiting&&page!=='MODELOS'&&page!=='ACADEMIA')return state;

  const group=page==='ACADEMIA'?'researches':'units';
  const iconFor=(id,type)=>{
    const variants=type==='research'
      ? ['research_icon research40x40 '+id,'research_icon research40x40 '+id+'_old','research_icon '+id]
      : ['unit_icon40x40 '+id,'unit_icon unit40x40 '+id,'unit_icon '+id];
    for(const classes of variants){
      let el;
      try{
        el=document.createElement('div');el.className=classes;
        el.style.cssText='position:absolute;top:-10000px;left:-10000px;pointer-events:none';
        document.body.appendChild(el);
        const s=getComputedStyle(el);
        const bg=s.backgroundImage;
        const before=getComputedStyle(el,'::before');
        const style=bg&&bg!=='none'?s:(before.backgroundImage&&before.backgroundImage!=='none'?before:null);
        if(style){
          const url=style.backgroundImage.match(/url\\(["']?(.*?)["']?\\)/)?.[1]||'';
          if(/^https?:\\/\\//.test(url)||url.startsWith('/')){
            return {backgroundImage:style.backgroundImage,backgroundPosition:style.backgroundPosition,
              backgroundSize:style.backgroundSize,backgroundRepeat:style.backgroundRepeat};
          }
        }
      }catch(e){}finally{el?.remove()}
    }
    return null;
  };
  const items=catalog[group];
  const key=JSON.stringify(items.map(item=>item.id));
  const now=Date.now();
  const cache=window.__GREPOPILOT_DESKTOP_SPRITES__??={};
  let sprites=cache[group];
  if(!sprites||sprites.key!==key||now-sprites.at>=15000){
    const icons={};
    for(const item of items)icons[item.id]=iconFor(item.id,group==='researches'?'research':'unit');
    sprites=cache[group]={key,at:now,icons};
  }
  state.icons={[group]:sprites.icons};
  return state;
})(${args})`;
}
module.exports={stateExpression};
