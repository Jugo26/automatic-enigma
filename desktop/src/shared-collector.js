'use strict';
// Executado SOMENTE na página de um mundo autenticado do Grepolis.
// Não solicita novas informações ao servidor do jogo: usa os modelos já carregados.
const COLLECT_EXPRESSION = String.raw`(() => {
  const G=window.Game, MM=window.MM, IT=window.ITowns;
  if (!G?.player_id || !MM) return {ready:false,reason:'Entre em um mundo do Grepolis'};
  const world=location.hostname.split('.')[0].toLowerCase();
  const playerId=String(G.player_id);
  const playerName=String(G.player_name||G.playerName||'');
  const alliance=String(G.alliance_name||G.player_alliance_name||'');
  const towns=IT?.towns||{};
  const owns=new Set(Object.keys(towns));
  if(!owns.size)return {ready:false,reason:'Aguardando as cidades da conta'};
  const cityId=(a,kind)=>{
    const v=kind==='origin'?[a.origin_town_id,a.from_town_id,a.source_town_id,a.origin_id,a.start_town_id,a.home_town_id,a.town_id]:
      [a.destination_town_id,a.to_town_id,a.target_town_id,a.destination_id,a.end_town_id,a.target_id];
    return String(v.find(x=>x!==undefined&&x!==null&&String(x)!=='')??'');
  };
  const city=(a,kind)=>{
    const id=cityId(a,kind),town=towns[id];
    const fields=kind==='origin'?[a.origin_town_name,a.from_town_name,a.origin_name]:
      [a.destination_town_name,a.to_town_name,a.destination_name];
    const name=String(fields.find(x=>typeof x==='string'&&x.trim())||town?.getName?.()||town?.name||'').slice(0,100);
    return id||name?{id,name}:null;
  };
  const time=(value)=>{
    if(value==null||value==='')return null;
    const raw=typeof value==='object'?(value.timestamp??value.time??value.date):value;
    const n=Number(raw);
    const ms=Number.isFinite(n)&&n>1e9?(n>1e12?n:n*1000):Date.parse(String(raw));
    const date=new Date(ms);
    return Number.isFinite(date.getTime())?date.toISOString():null;
  };
  const nums=(raw)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
    return Object.fromEntries(Object.entries(raw).filter(([key,v])=>
      /^[a-z0-9_-]{1,45}$/i.test(key)&&(typeof v==='number'||typeof v==='string'&&v.trim())&&
      Number.isSafeInteger(Number(v))&&Number(v)>=0&&Number(v)<=1e9)
      .slice(0,50).map(([k,v])=>[k,Number(v)]));
  };
  const hash=(s)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(36)};
  const collections=[
    ['MovementsUnits','unit'],['MovementsTrade','trade'],['MovementsTrades','trade'],
    ['MovementsResources','trade'],['MovementsMarket','trade']
  ];
  const all=[];const seen=new Set();const colony=/coloniz|colonis|colony.ship|colono|conquest|takeover|conquer/;
  const modelMap=MM.getModels?.();
  for(const [name,group] of collections){
    const raw=modelMap?.[name];
    let models=raw&&typeof raw==='object'?Object.values(raw):null;
    try{
      if(!models?.length)models=MM.getOnlyCollectionByName?.(name)?.models??models;
    }catch{}
    if(group==='unit'&&!Array.isArray(models))return {ready:false,reason:'Aguardando os modelos de movimentação'};
    for(const model of Array.isArray(models)?models:[]){
      const a=model?.attributes||model?.getAttributes?.()||model;
      if(!a||typeof a!=='object')continue;
      const rawType=String(a.type??a.command_type??a.movement_type??a.command_name??'').toLowerCase();
      const returning=a.is_returning===true||a.returning===true||/return/.test(rawType);
      const units=nums(a.units??a.unit_counts??a.units_sent??a.troops);
      const type=returning?'return':
        group==='trade'||/trade|market|transport_res/.test(rawType)?'trade':
        colony.test(rawType)||a.is_colonization===true||a.has_colony_ship===true||
          Object.entries(units).some(([unit,count])=>count>0&&colony.test(unit))?'colonization':
        /support|reinforc/.test(rawType)?'support':
        /spy|espion/.test(rawType)?'spy':
        /attack|attacking|revolt/.test(rawType)?'attack':'other';
      const origin=city(a,'origin'),destination=city(a,'destination');
      if(!origin&&!destination)continue;
      const fromOwn=owns.has(origin?.id),toOwn=owns.has(destination?.id);
      if(!fromOwn&&!toOwn)continue;
      const direction=fromOwn&&toOwn?'internal':fromOwn?'outgoing':'incoming';
      const arriveAt=time(a.arrival_at??a.arrival_time??a.time_of_arrival??a.arrival??a.time_arrival??a.finished_at);
      const departAt=time(a.departure_at??a.departure_time??a.started_at??a.start_time??a.sent_at??a.departed_at);
      const rawId=String(a.command_id??a.id??model.id??model.getId?.()??'');
      const id=/^[a-z0-9_-]{1,70}$/i.test(rawId)?(group+'_'+rawId):
        group+'_'+hash([origin?.id,destination?.id,type,departAt,arriveAt,rawId].join('|'));
      if(seen.has(id))continue;
      seen.add(id);
      const resources=nums(a.resources??a.trade_resources??a.resource_amounts??
        (group==='trade'?{wood:a.wood,stone:a.stone,iron:a.iron}:null));
      const status=returning?'returning':a.is_cancelled?'canceled':
        arriveAt&&Date.parse(arriveAt)<Date.now()?'arrived':'traveling';
      all.push({id,type,direction,status,origin,destination,departAt,arriveAt,units,resources,note:''});
      if(all.length>=400)break;
    }
    if(all.length>=400)break;
  }
  return {ready:true,world,playerId,playerName,alliance,movements:all};
})()`;
module.exports={COLLECT_EXPRESSION};
