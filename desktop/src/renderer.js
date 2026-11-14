'use strict';
// Apenas imagens do Grepolis: imagens reais de edifícios no CDN e sprites
// obtidos dos estilos do jogo autenticado. Nada de emojis como substituto.
const BUILDING_CDN='https://gpnl.innogamescdn.com/images/game/main/';
const NAV=[
  ['INÍCIO','Início','main','GERAL'],
  ['QUARTEL','Quartel','barracks','EDIFÍCIOS'],
  ['PORTO','Porto','docks','EDIFÍCIOS'],
  ['ACADEMIA','Academia','academy','EDIFÍCIOS'],
  ['SENADO','Senado','main','EDIFÍCIOS'],
  ['MODELOS','Modelos','barracks','PLANEJAMENTO'],
  ['CIDADES','Cidades','farm','PLANEJAMENTO'],
  ['FILA','Fila inteligente','storage','PLANEJAMENTO'],
  ['ALDEIAS','Aldeias','market','AUTOMAÇÕES'],
  ['ECONOMIA','Economia','market','AUTOMAÇÕES'],
  ['COMBATE','Combate','barracks','AUTOMAÇÕES'],
  ['ESQUIVA','Esquiva','wall','AUTOMAÇÕES'],
  ['MISSÕES','Missões','temple','AUTOMAÇÕES'],
  ['AUTOMAÇÕES','Todos os módulos','main','SISTEMA'],
  ['AJUSTES','Configurações','hide','SISTEMA'],
  ['AVANÇADO','Opções completas','academy','SISTEMA'],
  ['TESTE','Testes de esquiva','wall','SISTEMA'],
  ['VERIFICAR','Verificar motor','academy','SISTEMA'],
  ['COMPARTILHADA','Central compartilhada','market','SISTEMA'],
  ['DIAG','Diagnóstico','wall','SISTEMA'],
  ['LOG','Logs','storage','SISTEMA']
];
const MODULES=[
 ['farm','Coleta de aldeias','farm','ALDEIAS'],['build','Construção automática','main','SENADO'],
 ['smartQueue','Fila inteligente','storage','FILA'],['finishFree','Conclusão grátis','main','SENADO'],
 ['recruit','Recrutamento automático','barracks','QUARTEL'],['research','Pesquisas automáticas','academy','ACADEMIA'],
 ['trade','Comércio entre cidades','market','ECONOMIA'],['ruralTrade','Trocas com aldeias','market','ALDEIAS'],
 ['ruralUnlock','Desbloquear aldeias','market','ALDEIAS'],['ruralUpgrade','Evoluir aldeias','market','ALDEIAS'],
 ['quests','Recompensas de missões','temple','MISSÕES'],['banditRewards','Recompensas dos bandidos','barracks','MISSÕES'],
 ['culture','Festivais e cultura','theater','CIDADES'],['bootcamp','Ataques PvE','barracks','COMBATE'],
 ['cave','Gruta','hide','ECONOMIA'],['commands','Comandos agendados','docks','COMBATE'],
 ['alerts','Alertas de ataques','wall','COMBATE'],['dodge','Esquiva com retorno','wall','ESQUIVA']
];
const BLD=[['main','Senado'],['storage','Armazém'],['farm','Fazenda'],['lumber','Serraria'],
 ['stoner','Pedreira'],['ironer','Mina de prata'],['academy','Academia'],['barracks','Quartel'],
 ['docks','Porto'],['market','Mercado'],['temple','Templo'],['hide','Gruta'],['wall','Muralha']];
const PT_UNITS={sword:'Espadachim',slinger:'Fundibulário',archer:'Arqueiro',hoplite:'Hoplita',rider:'Cavaleiro',chariot:'Biga',catapult:'Catapulta',militia:'Milícia',bireme:'Birreme',attack_ship:'Navio incendiário',colonize_ship:'Navio colonizador',big_transporter:'Barco de transporte',small_transporter:'Transporte rápido',trireme:'Trirreme',demolition_ship:'Navio demolidor',pegasus:'Pégaso',manticore:'Manticora',harpy:'Harpia',medusa:'Medusa',cyclops:'Ciclope',minotaur:'Minotauro',cerberus:'Cérbero'};
const UNIT_WIKI={sword:'https://wiki.en.grepolis.com/images/9/9c/Sword_40x40.png',slinger:'https://wiki.en.grepolis.com/images/d/dc/Slinger_40x40.png',archer:'https://wiki.en.grepolis.com/images/1/1a/Archer_40x40.png',hoplite:'https://wiki.en.grepolis.com/images/b/bd/Hoplite_40x40.png',rider:'https://wiki.en.grepolis.com/images/e/e9/Rider_40x40.png',chariot:'https://wiki.en.grepolis.com/images/e/e9/Rider_40x40.png',catapult:'https://wiki.en.grepolis.com/images/f/f0/Catapult_40x40.png',militia:'https://wiki.en.grepolis.com/images/9/9b/Militia_40x40.png',bireme:'https://wiki.en.grepolis.com/images/4/44/Bireme_40x40.png',attack_ship:'https://wiki.en.grepolis.com/images/e/e6/Attack_ship_40x40.png'};
// Só usar imagens de arquivo verificadas; sem imagem específica não se finge uma.
delete UNIT_WIKI.chariot;
const el=(id)=>document.getElementById(id);
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(p,otherwise)=>{let v=S?.config;for(const k of p.split('.'))v=v?.[k];return v??otherwise};
let S=null, active='INÍCIO', town='', selectedUnit='', busy=false, toastTimer=null, search='', researchSelected='';
let sharedConfig={configured:false,serverUrl:''},sharedState=null,sharedError='',sharedLoad=0;
let sharedFilter={type:'all',direction:'all',player:'all',query:''};
const bImage=(id,cls='asset')=>`<img class="${cls}" src="${BUILDING_CDN+encodeURIComponent(id)}.png" alt="${safe(BLD.find(x=>x[0]===id)?.[1]||id)}" loading="lazy">`;
function portrait(id,type='unit',cls='sprite'){
  const info=type==='unit'?S?.icons?.units?.[id]:S?.icons?.researches?.[id];
  const fallback=type==='unit'?UNIT_WIKI[id]:undefined;
  if(info?.backgroundImage){
    const attr=(x)=>safe(String(x||''));
    return `<span class="${cls}" role="img" aria-label="${safe(id)}" style="display:inline-block;background-image:${attr(info.backgroundImage)};background-position:${attr(info.backgroundPosition)};background-size:${attr(info.backgroundSize)};background-repeat:${attr(info.backgroundRepeat)}"></span>`;
  }
  if(fallback)return `<img class="${cls}" src="${safe(fallback)}" alt="${safe(id)}">`;
  return `<span class="${cls} icon-missing" title="O jogo não forneceu imagem para ${safe(id)}">imagem não<br>carregada</span>`;
}
function notify(message,error=false){
  const t=el('toast');t.textContent=message;t.style.background=error?'#4d2d30':'#263b38';t.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3500);
}
function menu(){
 let current='';
 el('nav').innerHTML=NAV.map(([key,label,icon,group])=>{
   const separator=group!==current?`<div class="group">${safe(group)}</div>`:'';current=group;
   return separator+`<button class="navbtn ${active===key?'selected':''}" data-page="${key}">${bImage(icon,'nav-img')}<span>${safe(label)}</span></button>`;
 }).join('');
}
function moduleCard([key,title,icon]){
 const on=!!val('modules.'+key,false);
 return `<div class="card"><div class="card-head">${bImage(icon)}<div class="grow"><b>${safe(title)}</b><small>Módulo ${safe(key)}</small></div><label class="switch"><input type="checkbox" aria-label="${safe(title)}" data-path="modules.${key}" ${on?'checked':''}></label></div></div>`;
}
function section(title){return `<h3 class="section-title">${safe(title)}</h3>`}
function infoCard(title,description,icon){return `<div class="card"><div class="card-head">${bImage(icon)}<div class="grow"><b>${safe(title)}</b><small>${safe(description)}</small></div></div></div>`}
function statusText(){const x=S?.status;return x?.connected?(x.enabled?(x.dryRun?'Ativo · simulação':'Ativo · execução'):'Pausado · conectado'):'Aguardando sessão'}
function cityOptions(){
 const cities=S?.catalog?.cities||[];
 if(!town||!cities.some(c=>c.id===town))town=String(cities[0]?.id||'');
 el('city').innerHTML=cities.map(c=>`<option value="${safe(c.id)}" ${c.id===town?'selected':''}>${safe(c.name)}</option>`).join('')||'<option value="">Nenhuma cidade encontrada</option>';
}
function renderHeader(){
 const item=NAV.find(x=>x[0]===active)||NAV[0];
 el('panel-heading').innerHTML=`<h2>${bImage(item[2],'header-img')} ${safe(item[1])}</h2><p>Interface nativa do GrepoPilot · imagens originais do jogo</p>`;
 el('state-text').textContent=statusText();
}
function noSession(){return `<div class="empty">Entre em um mundo do Grepolis no navegador central. As tropas, pesquisas, cidades e suas imagens aparecem aqui após o carregamento.</div><p class="note">Os ícones de edifícios são recursos oficiais do jogo. Os de tropas e pesquisas são lidos do CSS do mundo aberto.</p>`}
function overview(){
 const enabled=!!val('enabled',false),dryRun=!!val('dryRun',true),cities=S?.catalog?.cities||[];
 return `${infoCard('Painel redesenhado','O jogo fica no centro; as configurações ficam nas telas nativas.','main')}
 ${section('Motor do bot')}<div class="card">
 <div class="field"><span><b>Ativar automação</b><small>Ativa os módulos selecionados</small></span><input type="checkbox" data-path="enabled" ${enabled?'checked':''}></div>
 <div class="field"><span><b>Modo simulação</b><small>Visualiza decisões sem executar no jogo</small></span><input type="checkbox" data-path="dryRun" ${dryRun?'checked':''}></div>
 <div class="field"><span><b>Cidades conectadas</b></span><strong>${cities.length}</strong></div>
 <div class="field"><span><b>Módulos habilitados</b></span><strong>${Object.values(val('modules',{})).filter(Boolean).length}</strong></div></div>
 ${section('Acesso rápido')}${[['QUARTEL','Tropas','barracks'],['ACADEMIA','Pesquisas','academy'],['MODELOS','Modelos','barracks'],['ESQUIVA','Esquiva','wall']].map(([k,t,icon])=>`<div class="card"><div class="card-head">${bImage(icon)}<div class="grow"><b>${t}</b></div><button class="tiny" data-page="${k}">Abrir</button></div></div>`).join('')}`;
}
function recruitControl(){
 const on=!!S?.status?.connected&&!!val('enabled',false)&&!val('dryRun',true)&&
   !!val('modules.recruit',false)&&val('sync.role','primary')==='primary';
 const reasons=[];
 if(!val('enabled',false))reasons.push('execução pausada');
 if(val('dryRun',true))reasons.push('modo simulação');
 if(!val('modules.recruit',false))reasons.push('módulo desligado');
 return `<div class="card"><div class="card-head">${bImage('barracks')}<div class="grow"><b>${on?'Recrutamento real ligado':'Recrutamento aguardando ativação'}</b>
 <small>${safe(on?'Motor disponível':reasons.join(' · '))}</small></div></div>
 ${!on?'<button class="cta" data-action="start-recruit">Iniciar recrutamento real</button>':''}
 <p class="note">Meta total = tropas existentes + tropas na fila + tropas que faltam treinar.</p></div>`;
}
function unitPlan(townId,unit,quantity){
 if(!(Number(quantity)>0))return '';
 const p=S?.recruitPlan?.[townId]?.[unit];
 return `<span class="unit-plan ${safe(p?.state||'wait')}">${safe(p?.reason||'Aguardando análise de recursos e fila')}</span>`;
}
function catalogUnits(ship){
 const units=(S?.catalog?.units||[]).filter(u=>ship===undefined||!!u.isNaval===ship);
 const data=val('recruit.targets.'+town,{});
 const continuous=val('recruit.continuous.'+town,{});
 const filtered=units.filter(u=>(PT_UNITS[u.id]||u.name||u.id).toLowerCase().includes(search.toLowerCase()));
 return `${recruitControl()}${section(ship?'Navios do Porto':'Tropas do Quartel')}
 <div class="row"><input id="search-units" type="text" placeholder="Buscar unidade" value="${safe(search)}"><button class="ghost" data-action="clear-search">Limpar</button></div>
 <p class="note">Selecione quantidades diretamente nas imagens das unidades. A meta salva é usada pelo motor de recrutamento.</p>
 <div class="catalog">${filtered.map(u=>`<div class="tile"><div class="row">${portrait(u.id)}</div><div class="name">${safe(PT_UNITS[u.id]||u.name)}</div><input title="Meta para ${safe(u.id)}" type="number" min="0" max="999999" step="1" data-unit="${safe(u.id)}" value="${Number(data[u.id]||0)}">${unitPlan(town,u.id,data[u.id])}<label class="count" title="Lote infinito; zero desliga"><input type="number" min="0" max="999" data-continuous="${safe(u.id)}" value="${Number(continuous[u.id]||0)}"> ∞ lote</label></div>`).join('')}</div>
 ${section('Recrutamento')}${moduleCard(MODULES.find(x=>x[0]==='recruit'))}
 ${numberField('recruit.maxBatch','Máximo por lote','barracks',1,300)}${numberField('recruit.maxQueueSlots','Limite de filas','barracks',1,8)}
 ${infoCard('Modelos de tropas','Edite ou aplique um modelo pronto na aba Modelos.','barracks')}`;
}
function researchPage(){
 const all=S?.catalog?.researches||[];
 const selected=val('research.queue.'+town,[]);
 return `${section('Academia · pesquisas originais')}<p class="note">Clique nas imagens das pesquisas para programar ou remover. Cada ícone é o sprite da tecnologia específica no Grepolis.</p>
 <div class="catalog">${all.map(r=>`<button class="tile ${selected.includes(r.id)?'active':''}" data-research="${safe(r.id)}">${portrait(r.id,'research')}<span class="name">${safe(r.name)}</span><span class="count">${r.points} pontos</span></button>`).join('')}</div>
 ${section('Fila de pesquisa')}<p class="note">${selected.map(x=>safe(x)).join(' → ')||'Nenhuma pesquisa programada'}</p>${moduleCard(MODULES.find(x=>x[0]==='research'))}`;
}
function buildPage(){
 const goals=val('build.targets.'+town,{}),current=S?.catalog?.cities?.find(c=>c.id===town)?.buildings||{};
 return `${section('Senado · construções originais')}<p class="note">Cada construção utiliza sua imagem oficial e possui uma meta independente nesta cidade.</p>
 ${BLD.map(([key,label])=>`<div class="card"><div class="card-head">${bImage(key)}<div class="grow"><b>${safe(label)}</b><small>Nível atual: ${Number(current[key]||0)}</small></div><input data-building="${key}" aria-label="Meta de ${safe(label)}" type="number" min="0" max="60" style="width:70px" value="${Number(goals[key]||0)}"></div></div>`).join('')}
 ${moduleCard(MODULES.find(x=>x[0]==='build'))}${moduleCard(MODULES.find(x=>x[0]==='finishFree'))}`;
}
function templatesPage(){
 const cities=S?.templates?.cities||{},troops=S?.templates?.troops||{};
 const renderTemplate=(kind,key,v)=>{
   const units=Object.entries(v.units||{}).filter(([,count])=>count>0);
   const building=Object.entries(v.buildings||{});
   return `<div class="card"><div class="card-head">${units.length?portrait(units[0][0]):bImage(kind==='city'?'main':'barracks')}<div class="grow"><b>${safe(v.title)}</b><small>${safe(v.description||v.help||'Modelo de planejamento')}</small></div></div><div class="template-summary">${units.slice(0,5).map(([id,n])=>`<span>${safe(PT_UNITS[id]||id)}: ${n}</span>`).join('')}${building.length?`<span>${building.length} edifícios</span>`:''}</div><button class="cta" data-template-kind="${kind}" data-template="${safe(key)}">Aplicar na cidade</button></div>`;
 };
 return `${section('Modelos de cidades')}${Object.entries(cities).map(([key,v])=>renderTemplate('city',key,v)).join('')}
 ${section('Modelos de tropas')}${Object.entries(troops).map(([key,v])=>renderTemplate('troops',key,v)).join('')}`;
}
function numberField(key,title,icon,min=0,max=1000000){return `<div class="card"><div class="card-head">${bImage(icon)}<div class="grow"><b>${safe(title)}</b><small>${safe(key)}</small></div><input data-number="${safe(key)}" type="number" min="${min}" max="${max}" value="${Number(val(key,0))}" style="width:88px"></div></div>`}
function settingsPage(){
 return `${section('Preferências')}<div class="card"><div class="field"><span><b>Modo simulação</b></span><input type="checkbox" data-path="dryRun" ${val('dryRun',true)?'checked':''}></div><div class="field"><span><b>Notificações</b></span><input type="checkbox" data-path="security.notify" ${val('security.notify',true)?'checked':''}></div></div>
 ${section('Segurança e sessão')}${numberField('security.minActionIntervalSeconds','Intervalo mínimo (s)','wall',45,3600)}${numberField('security.maxActionsPerHour','Máximo de ações por hora','wall',1,60)}${numberField('security.postCaptchaCooldownMinutes','Pausa após verificação (min)','wall',45,240)}
 ${infoCard('Sem recarga temporizada','O aplicativo só recarrega se você apertar o botão ↻.','main')}
 ${section('Perfis')}<div class="row wrap"><button class="ghost" data-action="export">Exportar JSON</button><button class="ghost" data-action="import">Importar JSON</button></div>`;
}
function advancedPage(){
 const conf=S?.config||{};
 const ignored=new Set(['ui','cityProfiles','troopProfiles','onboarding']);
 const fields=(object,prefix,depth=0)=>Object.entries(object||{}).map(([key,v])=>{
  const path=prefix?prefix+'.'+key:key;
  if(/(__proto__|constructor|prototype)/.test(key))return '';
  if(v===null||typeof v==='undefined')return '';
  if(typeof v==='boolean')return `<div class="field"><div><b>${safe(key)}</b><small>${safe(path)}</small></div><input type="checkbox" data-path="${safe(path)}" ${v?'checked':''}></div>`;
  if(typeof v==='number')return `<div class="field"><div><b>${safe(key)}</b><small>${safe(path)}</small></div><input type="number" data-number="${safe(path)}" value="${v}"></div>`;
  if(typeof v==='string')return `<div class="field"><div><b>${safe(key)}</b><small>${safe(path)}</small></div><input type="text" data-string="${safe(path)}" value="${safe(v)}"></div>`;
  if(depth<2&&!Array.isArray(v)&&v&&typeof v==='object'&&Object.keys(v).length<=8)return `<h3 class="section-title">${safe(key)}</h3>`+fields(v,path,depth+1);
  return `<div class="field vertical"><label><b>${safe(key)}</b><small>${safe(path)}</small></label><textarea data-json-text="${safe(path)}">${safe(JSON.stringify(v,null,2))}</textarea><button class="tiny" data-save-json="${safe(path)}">Salvar configuração</button></div>`;
 }).join('');
 return `<p class="note">Todas as opções do motor anterior ficam editáveis nesta interface própria do Desktop. Objetos complexos usam um editor JSON, sem abrir a HUD antiga.</p>`+
 Object.entries(conf).filter(([k])=>!ignored.has(k)).map(([key,v])=>`<div class="card"><div class="card-head">${bImage(key==='recruit'?'barracks':key==='research'?'academy':key==='dodge'?'wall':key==='trade'?'market':key==='build'?'main':'storage')}<div class="grow"><b>${safe(key)}</b></div></div>${(v&&typeof v==='object')?fields(v,key):fields({[key]:v},'')}</div>`).join('');
}
function logPage(){
 const logs=S?.status?.logs||[];
 return `${section('Eventos recentes')}${logs.length?logs.slice().reverse().map(x=>`<div class="card"><div class="row space"><b>${safe(x.level)}</b><small>${safe(x.stamp)}</small></div><p>${safe(x.message)}</p></div>`).join(''):'<div class="empty">Ainda não há eventos nesta sessão.</div>'}`;
}
function dodgePage(){
 const d=S?.dodgeInfo||{};
 const running=d.enabled&&!d.dryRun&&d.module&&d.role==='primary'&&!d.captcha;
 const blockers=[];
 if(!d.enabled)blockers.push('execução geral desligada');
 if(d.dryRun)blockers.push('modo de simulação ligado');
 if(!d.module)blockers.push('módulo esquiva desligado');
 if(d.role==='standby')blockers.push('computador secundário');
 if(d.captcha)blockers.push('verificação CAPTCHA ativa');
 const dst=d.destinations||[],group={own:'Sua cidade',ally:'Aliado',other:'Outra cidade'};
 const destination=d.configuredTarget||0,mode=val('dodge.destinationMode','allies_first');
 return `${section('Situação da esquiva')}
 <div class="card"><div class="card-head">${bImage('wall')}<div class="grow"><b>${running?'Esquiva real em funcionamento':'Esquiva não está operacional'}</b>
 <small>${safe(running?'Monitorando ataques e horários de envio':blockers.join(' · ')||'Aguardando estado do motor')}</small></div></div>
 <button class="cta" data-action="start-dodge">Ativar esquiva real</button>
 <p class="note">O envio ocorre na janela anterior ao impacto. Ataques classificados como possível colonizador podem ser retidos conforme a política de defesa.</p></div>
 ${moduleCard(MODULES.find(x=>x[0]==='dodge'))}
 ${section('Para onde retirar as tropas')}
 <div class="card"><div class="field"><label>Prioridade</label>
 <select data-choice="dodge.destinationMode">
 <option value="allies_first" ${mode==='allies_first'?'selected':''}>Aliados próximos → suas cidades → demais da ilha</option>
 <option value="all_island" ${mode==='all_island'?'selected':''}>Qualquer cidade da ilha, por proximidade</option>
 <option value="own_first" ${mode==='own_first'?'selected':''}>Suas cidades → aliados → demais da ilha</option>
 </select></div>
 <div class="field"><label>Cidade de destino</label><select data-dodge-target>
 <option value="0">Automática (pela prioridade)</option>
 ${dst.map(t=>`<option value="${t.id}" ${destination===t.id?'selected':''}>${safe(t.name+' #'+t.id+' · '+(group[t.relation]||''))}</option>`).join('')}</select></div>
 <div class="row wrap"><input type="number" id="dodge-manual" min="1" placeholder="ID de destino" title="ID de outra cidade da mesma ilha">
 <button class="ghost" data-action="dodge-manual">Definir ID</button></div>
 <p class="note">${dst.length} cidades identificadas na mesma ilha. ${safe(d.directoryError||'')}
 Os destinos de outras pessoas são identificados pelos dados públicos do mundo.</p></div>
 ${section('Controle de tempo')}
 ${numberField('dodge.leadSeconds','Enviar antes do impacto (segundos)','wall',20,180)}
 ${numberField('dodge.returnAfterSeconds','Cancelar após a última onda (segundos)','wall',10,90)}
 ${numberField('dodge.waveGapSeconds','Agrupar ondas (segundos)','wall',1,60)}
 ${section('Ataques recebidos')}
 ${(d.incoming||[]).map(a=>`<div class="card"><b>${safe(a.classification)}</b><small>${new Date(a.arrivalMs).toLocaleString('pt-BR')}</small>
 <p class="note">${safe(a.reason)} · ${a.allow?'Esquiva autorizada':'Esquiva bloqueada pela política'}</p></div>`).join('')||'<div class="empty">Nenhum ataque recebido identificado nesta cidade.</div>'}
 ${section('Apoios e cancelamentos')}
 ${(d.jobs||[]).map(j=>`<div class="card"><b>${safe(j.state)}</b><small>Destino #${j.targetId} · comando #${j.commandId||'identificando'}</small>
 <p class="note">${safe(j.error||'Acompanhando comando')}</p></div>`).join('')||'<div class="empty">Nenhum apoio em acompanhamento.</div>'}
 `;
}
function testPage(){
 return `${section('Teste de esquiva')}${infoCard('Simulação / teste prático','O modo prático movimenta tropas da cidade selecionada.','wall')}
 ${numberField('attackTest.delay','Impacto simulado (segundos)','wall',30,600)}
 ${numberField('attackTest.wave','Segunda onda (segundos)','wall',0,30)}
 <div class="card"><div class="field"><label><b>Modo</b></label><select data-choice="attackTest.mode"><option value="preview" ${val('attackTest.mode','preview')==='preview'?'selected':''}>Prévia</option><option value="live" ${val('attackTest.mode','preview')==='live'?'selected':''}>Prático</option></select></div><div class="field"><label><b>Confirmo o movimento de tropas</b></label><input type="checkbox" id="allow-live-test"></div><div class="row wrap"><button class="cta" data-action="start-test">Iniciar teste</button><button class="ghost" data-action="stop-test">Interromper</button></div></div>`;
}
const SHARED_TYPES={attack:'Ataque',support:'Apoio',trade:'Comércio',return:'Retorno',colonization:'Colonização',spy:'Espionagem',other:'Outro'};
function timeText(value){if(!value)return 'Não informado';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR'):'Não informado'}
function sharedPage(){
 if(!sharedConfig?.configured)return `${section('Conectar à Central Compartilhada')}
  <p class="note">Conecte seu jogador ao servidor da central. O token individual é gerado pelo administrador; as movimentações ficam ocultas até você ativar o compartilhamento.</p>
  <div class="card"><label for="shared-url">Endereço do servidor HTTPS</label><input id="shared-url" type="url" style="width:100%;margin:6px 0 12px" placeholder="https://central.exemplo.com" value="${safe(sharedConfig?.serverUrl||'')}">
  <label for="shared-token">Token do seu jogador</label><input id="shared-token" type="password" autocomplete="off" style="width:100%;margin:6px 0 12px" placeholder="Token individual"><button class="cta" data-action="shared-connect">Conectar</button></div>
  <p class="note">Servidor de testes local: http://127.0.0.1:8787. Em outros computadores, use HTTPS.</p>`;
 const users=sharedState?.users||[],moves=sharedState?.movements||[];
 const me=users.find(u=>u.id===sharedState?.selfId);
 const matches=m=>
  (sharedFilter.type==='all'||m.type===sharedFilter.type)&&
  (sharedFilter.direction==='all'||m.direction===sharedFilter.direction)&&
  (sharedFilter.player==='all'||m.ownerId===sharedFilter.player)&&
  (!sharedFilter.query||[m.playerName,m.origin?.name,m.destination?.name,m.origin?.id,m.destination?.id].join(' ').toLowerCase().includes(sharedFilter.query.toLowerCase()));
 const filtered=moves.filter(matches);
 return `${section(sharedState?'Conectado · '+safe(sharedState.world):'Central Compartilhada')}
  <div class="shared-stats"><div><small>Jogadores</small><b>${users.length}</b></div><div><small>Online</small><b>${users.filter(u=>u.online).length}</b></div><div><small>Movimentos</small><b>${moves.length}</b></div></div>
  <div class="card"><label class="field" for="shared-sharing"><span><b>Compartilhar minhas movimentações</b><small>${safe(me?.name||'Minha conta')}</small></span><input type="checkbox" id="shared-sharing" ${me?.sharing?'checked':''} ${me?'':'disabled'}></label>
  <div class="row wrap"><button class="ghost" data-action="shared-refresh">Atualizar agora</button><button class="ghost" data-action="shared-disconnect">Desconectar</button></div><p class="note">Sincronização a cada 15 segundos enquanto o mundo estiver aberto. ${sharedConfig.lastSynced?'Último envio: '+safe(timeText(sharedConfig.lastSynced)):''}</p></div>
  ${section('Jogadores do bot')}
  <div class="shared-list">${users.map(u=>`<div class="shared-user"><span class="${u.online?'shared-on':'shared-off'}">●</span><b>${safe(u.name)}</b><small>${safe(u.alliance||'Sem aliança')} · ${u.sharing?'Compartilhando':'Privado'} · ${u.online?'Online':'Offline'}</small></div>`).join('')||'<p class="note">Nenhum jogador encontrado no mundo.</p>'}</div>
  ${section('Movimentações')}
  <div class="shared-filters"><select id="shared-type" aria-label="Filtrar por tipo"><option value="all">Todos os tipos</option>${Object.entries(SHARED_TYPES).map(([id,label])=>`<option value="${id}" ${sharedFilter.type===id?'selected':''}>${safe(label)}</option>`).join('')}</select>
  <select id="shared-direction" aria-label="Filtrar por direção"><option value="all">Todas as direções</option>${[['incoming','Recebido'],['outgoing','Enviado'],['internal','Interno']].map(([k,v])=>`<option value="${k}" ${sharedFilter.direction===k?'selected':''}>${v}</option>`).join('')}</select>
  <select id="shared-player" aria-label="Filtrar por jogador"><option value="all">Todos os jogadores</option>${users.map(u=>`<option value="${safe(u.id)}" ${sharedFilter.player===u.id?'selected':''}>${safe(u.name)}</option>`).join('')}</select>
  <input id="shared-query" aria-label="Filtrar por cidade ou jogador" placeholder="Cidade ou jogador" value="${safe(sharedFilter.query)}"></div>
  <div class="shared-list">${filtered.slice(0,150).map(m=>`<div class="card shared-movement"><div class="row space"><strong>${safe(SHARED_TYPES[m.type]||'Outro')}</strong><small>${safe(m.direction==='incoming'?'Recebido':m.direction==='internal'?'Interno':'Enviado')}</small></div>
  <small>${safe(m.playerName||'Jogador desconhecido')}</small><div class="shared-route">${safe(m.origin?.name||m.origin?.id||'?')} → ${safe(m.destination?.name||m.destination?.id||'?')}</div>
  <small>Chegada: ${safe(timeText(m.arriveAt))}</small>
  ${Object.keys(m.units||{}).length?`<small>Tropas: ${safe(Object.entries(m.units).map(([k,v])=>k+' ×'+v).join(', '))}</small>`:''}
  ${Object.keys(m.resources||{}).length?`<small>Recursos: ${safe(Object.entries(m.resources).map(([k,v])=>k+' '+v).join(', '))}</small>`:''}</div>`).join('')||'<div class="empty">Nenhuma movimentação compartilhada com esses filtros.</div>'}</div>`;
}
async function loadShared(){
 const load=++sharedLoad;
 try{
  const config=await window.gpDesktop.sharedConfig();
  if(load!==sharedLoad)return;
  sharedConfig=config;
  const state=config.configured?await window.gpDesktop.sharedState():null;
  if(load!==sharedLoad)return;
  sharedState=state;
  sharedError='';
 }catch(e){if(load!==sharedLoad)return;sharedError=String(e.message||e)}
 if(active==='COMPARTILHADA'&&!document.activeElement?.matches('input,textarea,select'))rendered();
}
function rendered(){
 menu();renderHeader();cityOptions();
 let body='';
 if(active==='COMPARTILHADA')body=sharedPage();
 else if(!S?.ready)body=noSession();
 else if(active==='INÍCIO')body=overview();
 else if(active==='QUARTEL')body=catalogUnits(false);
 else if(active==='PORTO')body=catalogUnits(true);
 else if(active==='ACADEMIA')body=researchPage();
 else if(active==='SENADO')body=buildPage();
 else if(active==='MODELOS')body=templatesPage();
 else if(active==='AJUSTES')body=settingsPage();
 else if(active==='AVANÇADO')body=advancedPage();
 else if(active==='LOG')body=logPage();
 else if(active==='TESTE')body=testPage();
 else if(active==='ESQUIVA')body=dodgePage();
 else if(active==='VERIFICAR')body=infoCard('Verificação do motor','Use Verificar agora para analisar o estado de cada componente.','academy')+`<button class="cta" data-action="verify">Verificar agora</button><div id="health-results"></div>`;
 else if(active==='DIAG')body=infoCard('Diagnóstico de conexão',statusText(),'wall')+`<pre>${safe(JSON.stringify(S.status,null,2))}</pre>`;
 else {
  const relevant=MODULES.filter(x=>x[3]===active);
  body=section('Automações · '+active)+(relevant.length?relevant:MODULES).map(moduleCard).join('');
  if(active==='CIDADES')body=infoCard('Cidades encontradas',String(S.catalog.cities.length)+' cidades','farm')+body;
  if(active==='ESQUIVA')body+=numberField('dodge.leadSeconds','Antecedência da esquiva (s)','wall',10,1800);
  if(active==='ALDEIAS')body+=numberField('ruralUpgrade.targetLevel','Nível desejado','market',1,6);
  if(active==='ECONOMIA')body+=numberField('trade.minReserve','Reserva mínima','storage',0,500000);
  if(active==='FILA')body+=infoCard('Fila inteligente','Metas avançadas disponíveis em Opções completas','storage');
 }
 const error=sharedError||sharedConfig.lastError;
 el('panel-content').innerHTML=body+(active==='COMPARTILHADA'&&error?`<div class="card"><small>${safe(error)}</small></div>`:'');
}
async function load(){
 if(busy)return;
 try{
  const s=await window.gpDesktop.getState();
  S=s;
  if(active==='ESQUIVA'&&s?.ready&&town)S.dodgeInfo=await window.gpDesktop.dodgeInfo(town);
  if(s?.url)el('address').value=s.url;
  el('engine-status').textContent=s?.ready?'Motor conectado':(s?.reason||'Aguardando o Grepolis');
  if(!document.activeElement?.matches('input,textarea,select'))rendered();
  else{el('state-text').textContent=statusText()}
 }catch(e){el('engine-status').textContent=e.message}
}
async function save(path,v){
 try{busy=true;await window.gpDesktop.patch(path,v);notify('Configuração salva: '+path);await loadForced()}
 catch(e){notify('Falha: '+e.message,true)}finally{busy=false}
}
async function loadForced(){S=await window.gpDesktop.getState();if(active==='ESQUIVA'&&S?.ready&&town)S.dodgeInfo=await window.gpDesktop.dodgeInfo(town);rendered()}
async function doTemplate(kind,key){
 try{busy=true;await window.gpDesktop.applyTemplate(kind,key,town);notify('Modelo aplicado à cidade selecionada');await loadForced()}
 catch(e){notify('Erro no modelo: '+e.message,true)}finally{busy=false}
}
function changePage(page){active=page;search='';selectedUnit='';rendered();el('panel-content').scrollTop=0;if(page==='COMPARTILHADA')loadShared().catch(e=>notify(e.message,true));else loadForced().catch(e=>notify(e.message,true))}
// Eventos delegados continuam válidos quando trocamos o conteúdo do painel.
document.addEventListener('click',async(e)=>{
 const p=e.target.closest('[data-page]');if(p){changePage(p.dataset.page);return}
 const nav=e.target.closest('[data-nav]');if(nav){window.gpDesktop.nav(nav.dataset.nav);return}
 const model=e.target.closest('[data-template]');if(model){await doTemplate(model.dataset.templateKind,model.dataset.template);return}
 const r=e.target.closest('[data-research]');if(r){
   const ids=[...(val('research.queue.'+town,[]))];const id=r.dataset.research;
   const i=ids.indexOf(id);if(i<0)ids.push(id);else ids.splice(i,1);
   await save('research.queue.'+town,ids);return;
 }
 const json=e.target.closest('[data-save-json]');if(json){
   const path=json.dataset.saveJson;const text=[...document.querySelectorAll('textarea[data-json-text]')].find(x=>x.dataset.jsonText===path)?.value;
   try{await save(path,JSON.parse(text))}catch(e){notify('JSON inválido: '+e.message,true)}return;
 }
 const action=e.target.closest('[data-action]');if(!action)return;
 if(action.dataset.action==='shared-connect'){
   try{
     busy=true;
     const data={serverUrl:el('shared-url').value,token:el('shared-token').value};
     const result=await window.gpDesktop.sharedConnect(data);
     sharedLoad++;sharedConfig=result.config;sharedState=result.state;sharedError='';rendered();
     await window.gpDesktop.sharedSync();
     await loadShared();notify('Central conectada');
   }catch(ex){notify(ex.message,true)}finally{busy=false}return;
 }
 if(action.dataset.action==='shared-refresh'){
   try{await window.gpDesktop.sharedSync();await loadShared()}catch(ex){notify(ex.message,true)}return;
 }
 if(action.dataset.action==='shared-disconnect'){
   try{
     sharedConfig=await window.gpDesktop.sharedDisconnect();
     sharedLoad++;sharedState=null;sharedError='';sharedFilter={type:'all',direction:'all',player:'all',query:''};
     rendered();notify('Desconectado');
   }catch(ex){notify(ex.message,true)}return;
 }
 if(action.dataset.action==='start-recruit'){
   try{busy=true;await window.gpDesktop.startRecruit();notify('Recrutamento real ativado');await loadForced()}
   catch(ex){notify('Falha: '+ex.message,true)}finally{busy=false}return;
 }
 if(action.dataset.action==='start-dodge'){
   try{busy=true;await window.gpDesktop.startDodge();notify('Esquiva real ativada');await loadForced()}
   catch(ex){notify('Falha na esquiva: '+ex.message,true)}finally{busy=false}return;
 }
 if(action.dataset.action==='dodge-manual'){
   const id=Number(el('dodge-manual')?.value);
   try{await window.gpDesktop.setDodgeTarget(town,id);notify('Destino manual definido');await loadForced()}
   catch(ex){notify('Destino rejeitado: '+ex.message,true)}return;
 }
 if(action.dataset.action==='clear-search'){search='';rendered()}
 if(action.dataset.action==='start-test'){
   try{await window.gpDesktop.runTest(town,!!el('allow-live-test')?.checked);notify('Teste iniciado')}catch(ex){notify(ex.message,true)}
 }
 if(action.dataset.action==='stop-test'){
   try{await window.gpDesktop.stopTest();notify('Teste interrompido')}catch(ex){notify(ex.message,true)}
 }
 if(action.dataset.action==='verify'){
   try{const h=await window.gpDesktop.verify();el('health-results').innerHTML=
     `<div class="card"><b>${h.critical||0} erro(s) / ${h.warnings||0} aviso(s)</b></div>`+
     (h.checks||[]).map(c=>`<div class="card"><div class="row space"><b>${safe(c.title)}</b><span class="pill ${c.status==='ok'?'':'off'}">${safe(c.status)}</span></div><small>${safe(c.detail)}</small></div>`).join('')}catch(ex){notify(ex.message,true)}
 }
 if(action.dataset.action==='export'&&S?.config){
   const copy=JSON.parse(JSON.stringify(S.config));copy.enabled=false;copy.autoReload.enabled=false;
   await window.gpDesktop.saveFile(JSON.stringify({format:'grepopilot-profile',schema:1,world:new URL(S.url).host,
   playerId:S.status.scope.split(':').at(-1),config:copy,exportedAt:new Date().toISOString()},null,2));
 }
 if(action.dataset.action==='import'){
  const text=await window.gpDesktop.selectFile();if(!text)return;
  try{
   const obj=JSON.parse(text);if(obj.format!=='grepopilot-profile'||obj.schema!==1||!obj.config)throw Error('Formato incompatível');
   if(obj.world!==new URL(S.url).host||String(obj.playerId)!==String(S.status.scope.split(':').at(-1)))throw Error('Perfil de outro mundo ou conta');
   const cfg=obj.config;cfg.enabled=false;cfg.autoReload={...cfg.autoReload,enabled:false};
   for(const [key,value] of Object.entries(cfg))if(!['ui','onboarding'].includes(key))await window.gpDesktop.patch(key,value);
   notify('Perfil importado com automações pausadas');await loadForced();
  }catch(ex){notify(ex.message,true)}
 }
});
document.addEventListener('change',async(e)=>{
 const t=e.target;
 if(t.id==='city'){town=t.value;await loadForced();return}
 if(t.id==='shared-sharing'){
   const enabled=t.checked;t.disabled=true;
   try{await window.gpDesktop.sharedSharing(enabled);await loadShared();if(active==='COMPARTILHADA')rendered();notify(enabled?'Compartilhamento ativado':'Compartilhamento pausado')}
   catch(ex){t.checked=!enabled;notify(ex.message,true)}
   finally{t.disabled=false}return;
 }
 if(t.id==='shared-type'||t.id==='shared-direction'||t.id==='shared-player'){
   sharedFilter[{ 'shared-type':'type','shared-direction':'direction','shared-player':'player'}[t.id]]=t.value;
   rendered();return;
 }
 if(t.id==='shared-query'){sharedFilter.query=t.value;rendered();return;}
 if(t.matches('[data-dodge-target]')){try{await window.gpDesktop.setDodgeTarget(town,Number(t.value));notify('Destino atualizado');await loadForced()}catch(e){notify(e.message,true)}return}
 if(t.dataset.path)await save(t.dataset.path,t.checked);
 if(t.dataset.choice)await save(t.dataset.choice,t.value);
 if(t.dataset.number)await save(t.dataset.number,Number(t.value));
 if(t.dataset.string)await save(t.dataset.string,t.value);
 if(t.dataset.unit)await save('recruit.targets.'+town+'.'+t.dataset.unit,Math.max(0,Math.trunc(Number(t.value)||0)));
 if(t.dataset.continuous)await save('recruit.continuous.'+town+'.'+t.dataset.continuous,Math.max(0,Math.min(999,Math.trunc(Number(t.value)||0))));
 if(t.dataset.building)await save('build.targets.'+town+'.'+t.dataset.building,Math.max(0,Math.trunc(Number(t.value)||0)));
});
document.addEventListener('input',e=>{if(e.target.id==='search-units')search=e.target.value});
el('address-form').addEventListener('submit',async(e)=>{
 e.preventDefault();try{const url=await window.gpDesktop.navigate(el('address').value);el('address').value=url}catch(ex){notify(ex.message,true)}
});
window.gpDesktop.onLocation(u=>{if(!document.activeElement||document.activeElement.id!=='address')el('address').value=u});
window.gpDesktop.onEngine(s=>el('engine-status').textContent=s);
window.gpDesktop.onShared(s=>{sharedConfig=s;if(active==='COMPARTILHADA'&&!document.activeElement?.matches('input,textarea,select'))rendered()});
window.gpDesktop.onUpdate(s=>{const footer=el('update-status');if(footer)footer.textContent=s});
window.gpDesktop.appInfo().then(x=>{el('app-version').textContent='v'+x.version;
  const footer=el('update-status');if(footer)footer.textContent=x.updateStatus||''}).catch(()=>{});
loadShared().catch(()=>{});setInterval(()=>loadShared().catch(()=>{}),12000);
menu();renderHeader();el('panel-content').innerHTML=noSession();load();setInterval(load,6500);
