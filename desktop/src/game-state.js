'use strict';
// Executado no contexto da página do jogo; retorna somente dados serializáveis.
const EXPRESSION = `(() => {
  const api=window.__GREPOPILOT_DESKTOP_API__;
  const game=window.Game;
  if(!game||!game.player_id)return {ready:false,url:location.href,reason:'Abra um mundo e entre na sua conta do Grepolis'};
  if(!api)return {ready:false,url:location.href,reason:'Carregando integração com o motor...'};
  const catalog=api.catalog();
  const snapshot=api.snapshot();
  const status=api.status();
  const templates=api.templates();
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
  const icons={units:{},researches:{}};
  for(const item of catalog.units)icons.units[item.id]=iconFor(item.id,'unit');
  for(const item of catalog.researches)icons.researches[item.id]=iconFor(item.id,'research');
  return {ready:true,url:location.href,status,config:snapshot,catalog,templates,icons,recruitPlan:api.recruitPlan()};
})()`;
module.exports={EXPRESSION};
