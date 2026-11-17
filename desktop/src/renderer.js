'use strict';
// Edifícios e unidades usam imagens do jogo. A navegação usa símbolos do Windows.
const BUILDING_CDN='https://gpnl.innogamescdn.com/images/game/main/';
const NAV=[
  ['INÍCIO','Início','home','GERAL'],
  ['QUARTEL','Quartel','barracks','EDIFÍCIOS'],
  ['PORTO','Porto','docks','EDIFÍCIOS'],
  ['ACADEMIA','Academia','academy','EDIFÍCIOS'],
  ['SENADO','Senado','main','EDIFÍCIOS'],
  ['MODELOS','Modelos','document','PLANEJAMENTO'],
  ['CIDADES','Cidades','cities','PLANEJAMENTO'],
  ['FILA','Fila inteligente','queue','PLANEJAMENTO'],
  ['ALDEIAS','Aldeias','pin','AUTOMAÇÕES'],
  ['ECONOMIA','Economia','market','AUTOMAÇÕES'],
  ['COMBATE','Combate','barracks','AUTOMAÇÕES'],
  ['ESQUIVA','Esquiva','wall','AUTOMAÇÕES'],
  ['MISSÕES','Missões','document','AUTOMAÇÕES'],
  ['AUTOMAÇÕES','Todos os módulos','modules','SISTEMA'],
  ['AJUSTES','Configurações','settings','SISTEMA'],
  ['AVANÇADO','Opções completas','settings','SISTEMA'],
  ['TESTE','Testes de esquiva','clock','SISTEMA'],
  ['VERIFICAR','Verificar motor','check','SISTEMA'],
  ['COMPARTILHADA','Central compartilhada','people','SISTEMA'],
  ['DIAG','Diagnóstico','diagnostic','SISTEMA'],
  ['LOG','Registro de atividades','history','SISTEMA']
];
const MODULES=[
 ['farm','Coleta de aldeias','pin','ALDEIAS','Coleta recursos nas aldeias desbloqueadas quando a coleta está disponível e há espaço no armazém.'],
 ['build','Construção automática','main','SENADO','Escolhe a obra disponível mais rápida. Se os prazos empatarem ou faltarem, escolhe a de menor custo.'],
 ['smartQueue','Fila inteligente','queue','FILA','Prioriza construções, pesquisas e tropas cadastradas na fila.'],
 ['finishFree','Conclusão grátis','clock','SENADO','Conclui obras quando o Grepolis libera a opção gratuita.'],
 ['recruit','Recrutamento automático','barracks','QUARTEL','Treina tropas e constrói navios até as metas cadastradas, ou em lotes contínuos.'],
 ['research','Pesquisas automáticas','academy','ACADEMIA','Inicia as pesquisas programadas quando há recursos, pontos e nível de Academia.'],
 ['trade','Comércio entre cidades','market','ECONOMIA','Envia recursos pelas rotas cadastradas e, se ativado, para cidades com metas bloqueadas.'],
 ['ruralTrade','Trocas com aldeias','market','ALDEIAS','Troca recursos com aldeias que atendem à relação mínima configurada.'],
 ['ruralUnlock','Desbloquear aldeias','pin','ALDEIAS','Usa pontos de batalha para desbloquear aldeias disponíveis.'],
 ['ruralUpgrade','Evoluir aldeias','pin','ALDEIAS','Usa pontos de batalha para evoluir aldeias já desbloqueadas.'],
 ['tutorial','Missões do tutorial','document','MISSÕES','Cumpre os objetivos reconhecidos no tutorial do Grepolis e resgata as recompensas liberadas.'],
 ['quests','Missões da ilha','pin','MISSÕES','Resgata as recompensas da ilha e acompanha os objetivos disponíveis.'],
 ['banditRewards','Recompensas dos bandidos','document','MISSÕES','Guarda ou usa as recompensas disponíveis do acampamento de bandidos.'],
 ['culture','Festivais e cultura','document','CIDADES','Inicia as celebrações marcadas quando a cidade atende aos requisitos.'],
 ['bootcamp','Ataques ao acampamento de bandidos','barracks','COMBATE','Envia tropas terrestres da cidade configurada contra o acampamento.'],
 ['cave','Depósito na Gruta','hide','ECONOMIA','Guarda prata respeitando a reserva no armazém e o espaço da Gruta.'],
 ['commands','Comandos agendados','clock','COMBATE','Envia os ataques e apoios cadastrados no horário escolhido.'],
 ['alerts','Alertas de ataques','diagnostic','COMBATE','Avisa quando o jogo mostra um ataque às suas cidades.'],
 ['dodge','Esquiva com retorno','wall','ESQUIVA','Retira tropas antes do impacto e calcula o cancelamento para trazê-las de volta.']
];
const UI_ICONS={
 home:'E80F',document:'E8A5',cities:'EC06',queue:'E8FD',pin:'E7B7',modules:'E8A9',
 settings:'E713',clock:'E823',check:'E8FB',people:'E716',diagnostic:'E9D9',history:'E81C'
};
const BLD=[['main','Senado'],['storage','Armazém'],['farm','Fazenda'],['lumber','Serraria'],
 ['stoner','Pedreira'],['ironer','Mina de prata'],['academy','Academia'],['barracks','Quartel'],
 ['docks','Porto'],['market','Mercado'],['temple','Templo'],['hide','Gruta'],['wall','Muralha']];
const RESOURCES={wood:'Madeira',stone:'Pedra',iron:'Prata'};
const OPTION_INFO={
 enabled:['Ativar automação','Permite que o motor execute os módulos selecionados.'],
 dryRun:['Modo simulação','Mostra as decisões do motor sem enviar comandos ao jogo.'],
 modules:['Módulos de automação','Escolha quais tarefas o GrepoPilot acompanha no mundo.','modules'],
 intervals:['Intervalos de execução','Defina em segundos quanto tempo cada rotina aguarda entre verificações.','clock'],
 'farm.duration':['Duração da coleta (min)','Seleciona a duração da próxima coleta na aldeia.'],
 'farm.captainBulk':['Coleta em lote com Capitão','Solicita coletas de várias cidades de uma vez quando o conselheiro Capitão está ativo.'],
 'build.targets':['Metas de nível por cidade','Define até que nível construir cada edifício. Edite também no Senado.'],
 'build.priority':['Ordem de desempate das obras','Define quais edifícios entram na fila comum e qual vem primeiro quando prazo e custo empatam.'],
 'build.allowDemolition':['Permitir demolição','Autoriza baixar o nível de um edifício para alcançar a meta cadastrada.'],
 'finishFree.maxRemainingSeconds':['Tempo restante máximo (s)','Limita a conclusão automática à fase gratuita da obra.'],
 'recruit.targets':['Metas de tropas por cidade','Define o total desejado, contando as unidades que já existem ou estão na fila.'],
 'recruit.continuous':['Recrutamento contínuo por cidade','Define lotes que se repetem enquanto houver população, recursos e vagas.'],
 'recruit.maxBatch':['Lote máximo terrestre','Limita quantas tropas terrestres podem ser treinadas em um pedido.'],
 'recruit.minBatch':['Lote mínimo terrestre','Define o mínimo para iniciar um pedido de tropas terrestres.'],
 'recruit.shipBatch':['Lote máximo naval','Limita quantos navios podem ser construídos em um pedido.'],
 'recruit.minShipBatch':['Lote mínimo naval','Define o mínimo para iniciar um pedido de navios.'],
 'recruit.mythicalBatch':['Lote máximo mítico','Limita quantas criaturas míticas podem ser recrutadas em um pedido.'],
 'recruit.minMythicalBatch':['Lote mínimo mítico','Define o mínimo para iniciar um pedido de criaturas míticas.'],
 'recruit.maxQueueSlots':['Vagas por tipo de fila','Limita quantas ordens o bot mantém em cada fila, terrestre ou naval.'],
 'research.queue':['Pesquisas programadas por cidade','Define a fila de pesquisas da Academia para cada cidade.'],
 'smartQueue.items':['Tarefas da fila','Lista os edifícios, pesquisas e unidades que a fila executa.'],
 'smartQueue.maxBatch':['Lote máximo na fila','Limita a quantidade de unidades incluídas em um pedido pela fila inteligente.'],
 'smartQueue.mode':['Critério de prioridade','Escolhe como ordenar as tarefas da fila.',{
   intelligent:'Custo e benefício',cheapest:'Menor custo'
 }],
 'smartQueue.autoPrereqs':['Resolver pré-requisitos','Tenta cumprir os requisitos de uma tarefa antes de iniciá-la.'],
 'trade.routes':['Rotas cadastradas','Define cidades de origem e destino e as quantidades máximas de cada recurso por envio.'],
 'trade.minReserve':['Reserva por recurso na origem','Mantém esta quantidade de madeira, pedra e prata na cidade que envia.'],
 'trade.maxFill':['Limite de ocupação no destino','Limita o preenchimento do armazém do destino. Por exemplo, 0,9 equivale a 90%.'],
 'trade.intelligent':['Comércio inteligente','Procura cidades com recursos disponíveis para abastecer metas pendentes.'],
 'trade.minCargo':['Carga mínima no comércio inteligente','Evita envios automáticos abaixo desta quantidade total de recursos.'],
 'trade.cooldownMinutes':['Espera entre envios (min)','Limita a frequência de envios da mesma origem para o mesmo destino.'],
 'trade.pendingMinutes':['Prazo para contar carga em trânsito (min)','Durante esse prazo, desconta as cargas enviadas do espaço e da demanda no destino.'],
 'trade.maxGoals':['Metas analisadas por cidade','Limita quantas metas entram no cálculo da demanda do comércio inteligente.'],
 'ruralTrade.wanted':['Recurso a receber','Escolhe qual recurso pedir nas trocas com aldeias.',RESOURCES],
 'ruralTrade.minRatio':['Proporção mínima da troca','Só troca quando a quantidade recebida por unidade enviada atinge este valor.'],
 'ruralTrade.maxAmount':['Limite de recursos por troca','Limita a quantidade usada em uma troca com aldeia.'],
 'ruralUpgrade.unlock':['Desbloqueio de aldeias (perfil antigo)','Use o módulo Desbloquear aldeias para controlar a rotina atual.'],
 'ruralUpgrade.upgrade':['Evolução de aldeias (perfil antigo)','Use o módulo Evoluir aldeias para controlar a rotina atual.'],
 'ruralUpgrade.targetLevel':['Nível desejado das aldeias','A rotina usa pontos de batalha para evoluir aldeias desbloqueadas até este nível.'],
 'quests.rewardAction':['Destino das recompensas','Escolhe se o bot tenta guardar ou usar a recompensa da missão.',{
   stash:'Guardar',use:'Usar ou receber'
 }],
 'quests.onlySatisfied':['Somente missões concluídas (perfil antigo)','O motor atual verifica se cada recompensa está pronta para resgate.'],
 'quests.autoObjectives':['Cumprir objetivos das missões da ilha','Escolhe e executa as tarefas compatíveis conforme o lado e os limites de gastos configurados.'],
 'quests.preferred':['Escolha em missões com decisão','Indica qual caminho preferir quando a missão oferece uma escolha.',{
   wise:'Sábio',aggressive:'Agressivo'
 }],
 'quests.allowResourceCost':['Permitir gastar recursos em objetivos','Autoriza cumprir objetivos que consomem recursos até o limite definido.'],
 'quests.maxResourceCost':['Limite de recursos por objetivo','Limita o total de recursos que o bot pode gastar em um objetivo de missão.'],
 'quests.allowTroopCost':['Permitir entregar tropas em objetivos','Autoriza cumprir objetivos que consomem unidades até o limite definido.'],
 'quests.maxTroopCost':['Limite de tropas por objetivo','Limita quantas unidades podem ser entregues por objetivo de missão.'],
 'banditRewards.stashIfPossible':['Guardar recompensas dos bandidos','Tenta enviar para o inventário as recompensas que o jogo permite guardar.'],
 'culture.festival':['Festa da cidade','Inicia a festa quando a cidade tem os recursos e atende aos requisitos.'],
 'culture.triumph':['Marcha triunfal','Inicia a marcha quando há pontos de batalha suficientes.'],
 'culture.theater':['Peça de teatro','Inicia uma peça quando a cidade tem Teatro e atende aos requisitos.'],
 'bootcamp.homeTownId':['Cidade de origem dos ataques','Use o identificador da cidade da ilha inicial. Zero usa a cidade ativa.'],
 'bootcamp.stashRewards':['Guardar recompensas do acampamento (perfil antigo)','Use o módulo Recompensas dos bandidos para controlar o resgate atual.'],
 'bootcamp.useHero':['Enviar herói disponível','Inclui um herói elegível da cidade de origem no ataque ao acampamento.'],
 'cave.minIron':['Prata mínima no armazém','O depósito só é avaliado a partir deste saldo de prata.'],
 'cave.keepIron':['Reserva de prata no armazém','Mantém esta quantidade de prata na cidade após o depósito.'],
 'commands.jobs':['Ataques e apoios agendados','Lista a origem, o destino, as tropas e o horário de cada comando.'],
 'alerts.desktop':['Notificar ataques no computador','Mostra um aviso quando o jogo detecta um ataque e as notificações estão autorizadas.'],
 'alerts.checkAll':['Monitorar todas as cidades (perfil antigo)','O motor atual consulta as cidades disponíveis no jogo.'],
 'dodge.version':['Versão do formato da esquiva','Identifica o formato salvo ao migrar perfis antigos.'],
 'dodge.leadSeconds':['Enviar antes do impacto (s)','Define com quantos segundos de antecedência o bot tenta retirar as tropas.'],
 'dodge.waveGapSeconds':['Agrupar impactos em sequência (s)','Compara cada ataque com o anterior. Enquanto o intervalo couber neste limite, a sequência continua.'],
 'dodge.land':['Retirar tropas terrestres','Inclui as unidades terrestres no apoio para esquiva.'],
 'dodge.naval':['Retirar unidades navais','Inclui os navios no apoio para esquiva.'],
 'dodge.targets':['Destinos fixos por cidade','Define para onde enviar o apoio de esquiva. Edite também na aba Esquiva.'],
 'dodge.destinationMode':['Prioridade de destino','Ordena as cidades da mesma ilha para escolher o destino automático.',{
   allies_first:'Aliados primeiro',all_island:'Qualquer cidade da ilha',own_first:'Minhas cidades primeiro'
 }],
 'dodge.colonizationPolicy':['Ataque de colonização','Escolhe se as tropas defendem a cidade ou se esquivam do colono confirmado.',{
   confirmed:'Defender o colono',all:'Esquivar do colono'
 }],
 'dodge.attackMarks':['Marcações de ataques','Guarda as confirmações manuais de colono ou ataque comum feitas na aba Esquiva.'],
 'dodge.colonyBaselineMinutes':['Duração sem bônus por trajeto (min)','Usa o tempo-base do colono para comparar cenários de viagem de um ataque.'],
 'dodge.colonyTimeTolerancePercent':['Margem do cálculo de colono (%)','Aceita essa diferença entre a duração observada e a estimada para um cenário de colono.'],
 attackTest:['Teste de esquiva','Simula um impacto na cidade selecionada. O modo prático movimenta tropas.','clock'],
 'attackTest.delay':['Tempo até o impacto do teste (s)','Define quanto falta para o impacto simulado no início do teste.'],
 'attackTest.wave':['Intervalo até a segunda onda (s)','Adiciona um segundo impacto fictício. Zero faz o teste com uma única onda.'],
 'attackTest.mode':['Modo de teste','Escolhe se o apoio será simulado ou enviado pelo jogo.',{
   preview:'Prévia',live:'Prático'
 }],
 sync:['Função deste computador','Escolha se este computador executa a automação ou acompanha a sessão.','people'],
 'sync.role':['Papel na automação','O computador principal pode executar módulos. O secundário acompanha sem enviar ações.',{
   primary:'Principal',standby:'Secundário'
 }],
 security:['Segurança e solicitações','Controle os avisos de verificação e a frequência das ações do motor.','wall'],
 'security.notify':['Notificar verificações de segurança','Avisa quando o jogo exibe ou libera uma verificação CAPTCHA.'],
 'security.resumeAfterSeconds':['Espera para confirmar liberação (s)','Aguarda a confirmação de que a verificação desapareceu antes de liberar a sessão.'],
 'security.pacingEnabled':['Limitar ações de rotina','Espaça as solicitações de rotina. Ao carregar o perfil, o motor reativa o limite.'],
 'security.minActionIntervalSeconds':['Intervalo mínimo entre ações (s)','Define a espera entre solicitações de rotina ao jogo.'],
 'security.maxActionsPerHour':['Máximo de ações por hora','Limita quantas solicitações podem ocorrer antes de pausar as ações de rotina.'],
 'security.postCaptchaCooldownMinutes':['Pausa após resolver CAPTCHA (min)','Adia as ações de rotina depois que o jogo libera a sessão.'],
 autoReload:['Recarregamento temporizado (perfil antigo)','Use o botão Atualizar na barra do navegador para recarregar a página.','history'],
 'autoReload.enabled':['Recarregar automaticamente','O Desktop mantém essa opção desligada.'],
 'autoReload.minutes':['Frequência antiga de recarga (min)','Valor guardado para compatibilidade com perfis antigos.'],
 'autoReload.safeWindowSeconds':['Margem antiga de recarga (s)','Valor guardado para compatibilidade com perfis antigos.']
};
const PT_UNITS={sword:'Espadachim',slinger:'Fundibulário',archer:'Arqueiro',hoplite:'Hoplita',rider:'Cavaleiro',chariot:'Biga',catapult:'Catapulta',militia:'Milícia',bireme:'Birreme',attack_ship:'Navio incendiário',colonize_ship:'Navio colonizador',big_transporter:'Barco de transporte',small_transporter:'Transporte rápido',trireme:'Trirreme',demolition_ship:'Navio demolidor',pegasus:'Pégaso',manticore:'Manticora',harpy:'Harpia',medusa:'Medusa',cyclops:'Ciclope',minotaur:'Minotauro',cerberus:'Cérbero'};
const UNIT_WIKI={sword:'https://wiki.en.grepolis.com/images/9/9c/Sword_40x40.png',slinger:'https://wiki.en.grepolis.com/images/d/dc/Slinger_40x40.png',archer:'https://wiki.en.grepolis.com/images/1/1a/Archer_40x40.png',hoplite:'https://wiki.en.grepolis.com/images/b/bd/Hoplite_40x40.png',rider:'https://wiki.en.grepolis.com/images/e/e9/Rider_40x40.png',chariot:'https://wiki.en.grepolis.com/images/e/e9/Rider_40x40.png',catapult:'https://wiki.en.grepolis.com/images/f/f0/Catapult_40x40.png',militia:'https://wiki.en.grepolis.com/images/9/9b/Militia_40x40.png',bireme:'https://wiki.en.grepolis.com/images/4/44/Bireme_40x40.png',attack_ship:'https://wiki.en.grepolis.com/images/e/e6/Attack_ship_40x40.png'};
// Só usar imagens de arquivo verificadas; sem imagem específica não se finge uma.
delete UNIT_WIKI.chariot;
const el=(id)=>document.getElementById(id);
const lastMarkup=new Map();
function setMarkup(id,html,force=false){
 if(!force&&lastMarkup.get(id)===html)return;
 el(id).innerHTML=html;
 lastMarkup.set(id,html);
}
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(p,otherwise)=>{let v=S?.config;for(const k of p.split('.'))v=v?.[k];return v??otherwise};
let S=null, active='INÍCIO', town='', selectedUnit='', busy=false, toastTimer=null, search='', researchSelected='';
let readingState=false,stateReadId=0;
let sharedConfig={configured:false,serverUrl:''},sharedState=null,sharedError='',sharedLoad=0;
let sharedFilter={type:'all',direction:'all',player:'all',query:''};
const bImage=(id,cls='asset')=>`<img class="${cls}" src="${BUILDING_CDN+encodeURIComponent(id)}.png" alt="${safe(BLD.find(x=>x[0]===id)?.[1]||id)}" loading="lazy">`;
const uiIcon=(id,cls='asset')=>Object.hasOwn(UI_ICONS,id)?
  `<span aria-hidden="true" class="${cls} ui-icon">&#x${UI_ICONS[id]};</span>`:bImage(id,cls);
function optionInfo(path){
 if(Object.hasOwn(OPTION_INFO,path))return OPTION_INFO[path];
 const [root,key,id,item]=path.split('.');
 const mod=MODULES.find(x=>x[0]===(root==='modules'||root==='intervals'?key:root));
 if(mod&&(!key||root==='modules'))return [mod[1],mod[4],mod[2]];
 if(mod&&root==='intervals')return [mod[1],key==='dodge'?
   'A esquiva acompanha os ataques em um ciclo próprio. Este valor é mantido para perfis antigos.':
   'Tempo em segundos entre verificações deste módulo.'];
 if(id&&root==='dodge'&&key==='attackMarks'){
   return ['Ataque '+id,'Classificação feita na aba Esquiva.',{colony:'Colono',normal:'Ataque comum'}];
 }
 if(id&&root==='dodge'&&key==='colonyBaselineMinutes')return ['Trajeto '+id,'Tempo em minutos sem bônus neste trajeto.'];
 const parent=[root,key].join('.');
 if(id&&['build.targets','recruit.targets','recruit.continuous','research.queue','dodge.targets'].includes(parent)){
   const city=S?.catalog?.cities?.find(c=>String(c.id)===id)?.name||'Cidade #'+id;
   const [,description]=OPTION_INFO[parent];
   if(!item)return [city,description];
   const name=root==='build'?BLD.find(x=>x[0]===item)?.[1]:
     PT_UNITS[item]||S?.catalog?.units?.find(u=>u.id===item)?.name;
   return [name||'Item da cidade',description];
 }
 return ['Opção adicional','Valor guardado neste perfil.'];
}
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
 setMarkup('nav',NAV.map(([key,label,icon,group])=>{
   const separator=group!==current?`<div class="group">${safe(group)}</div>`:'';current=group;
   return separator+`<button class="navbtn ${active===key?'selected':''}" data-page="${key}">${uiIcon(icon,'nav-img')}<span>${safe(label)}</span></button>`;
 }).join(''));
}
function moduleCard([key,title,icon,,description]){
 const on=!!val('modules.'+key,false);
 return `<div class="card"><div class="card-head">${uiIcon(icon)}<div class="grow"><b>${safe(title)}</b><small>${safe(description)}</small></div><label class="switch"><input type="checkbox" aria-label="${safe(title)}" data-path="modules.${key}" ${on?'checked':''}></label></div></div>`;
}
function section(title){return `<h3 class="section-title">${safe(title)}</h3>`}
function infoCard(title,description,icon){return `<div class="card"><div class="card-head">${uiIcon(icon)}<div class="grow"><b>${safe(title)}</b><small>${safe(description)}</small></div></div></div>`}
function statusText(){const x=S?.status;return x?.connected?(x.enabled?(x.dryRun?'Ativo · simulação':'Ativo · execução'):'Pausado · conectado'):'Aguardando sessão'}
function cityOptions(){
 const cities=S?.catalog?.cities||[];
 if(!town||!cities.some(c=>c.id===town))town=String(cities[0]?.id||'');
 setMarkup('city',cities.map(c=>`<option value="${safe(c.id)}" ${c.id===town?'selected':''}>${safe(c.name)}</option>`).join('')||'<option value="">Nenhuma cidade encontrada</option>');
}
function renderHeader(){
 const item=NAV.find(x=>x[0]===active)||NAV[0];
 setMarkup('panel-heading',`<h2>${uiIcon(item[2],'header-img')} ${safe(item[1])}</h2>`);
 el('state-text').textContent=statusText();
}
function noSession(){return `<div class="empty">Entre em um mundo do Grepolis no navegador central. As tropas, pesquisas, cidades e suas imagens aparecem aqui após o carregamento.</div><p class="note">Os ícones de edifícios são recursos oficiais do jogo. Os de tropas e pesquisas são lidos do CSS do mundo aberto.</p>`}
function overview(){
 const enabled=!!val('enabled',false),dryRun=!!val('dryRun',true),cities=S?.catalog?.cities||[];
 return `${section('Motor do bot')}<div class="card">
 ${advancedField('enabled',enabled)}${advancedField('dryRun',dryRun)}
 <div class="field"><span><b>Cidades conectadas</b></span><strong>${cities.length}</strong></div>
 <div class="field"><span><b>Módulos habilitados</b></span><strong>${Object.values(val('modules',{})).filter(Boolean).length}</strong></div></div>
 ${section('Acesso rápido')}${[['QUARTEL','Tropas','barracks'],['ACADEMIA','Pesquisas','academy'],['MODELOS','Modelos','document'],['ESQUIVA','Esquiva','wall']].map(([k,t,icon])=>`<div class="card"><div class="card-head">${uiIcon(icon)}<div class="grow"><b>${t}</b></div><button class="tiny" data-page="${k}">Abrir</button></div></div>`).join('')}`;
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
 ${section('Fila de pesquisa')}<p class="note">${selected.map(x=>safe(all.find(r=>r.id===x)?.name||x)).join(' → ')||'Nenhuma pesquisa programada'}</p>${moduleCard(MODULES.find(x=>x[0]==='research'))}`;
}
function buildPage(){
 const goals=val('build.targets.'+town,{}),current=S?.catalog?.cities?.find(c=>c.id===town)?.buildings||{};
 return `${section('Metas de construção')}<p class="note">Defina as metas desta cidade. O modelo Colonização prioriza as obras necessárias para pesquisar e construir o navio colonizador.</p>
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
function numberField(key,title,icon,min=0,max=1000000,show=val(key,0)){
 return `<label class="card"><span class="card-head">${uiIcon(icon)}<span class="grow"><b>${safe(title)}</b><small>${safe(optionInfo(key)[1])}</small><small>${min}–${max}</small></span><input data-number="${safe(key)}" type="number" min="${min}" max="${max}" value="${Number(show)}" style="width:88px"></span></label>`;
}
function cavePage(){
 const cave=S?.cave;
 return `${section('Depósito na Gruta')}
 ${numberField('cave.minIron','Prata mínima no armazém','hide',0,1000000)}
 ${numberField('cave.keepIron','Reserva de prata no armazém','storage',0,1000000)}
 ${cave?`<p class="note">${safe(cave.lastError||cave.reason)}</p>`:'<p class="note">Aguardando dados da Gruta no motor atualizado.</p>'}
 ${(cave?.towns||[]).map(t=>infoCard(t.name,t.reason,'hide')).join('')}`;
}
function settingsPage(){
 return `${section('Preferências')}<div class="card">${advancedField('dryRun',val('dryRun',true))}${advancedField('security.notify',val('security.notify',true))}</div>
 ${section('Segurança e sessão')}${numberField('security.minActionIntervalSeconds','Intervalo mínimo (s)','wall',45,3600)}${numberField('security.maxActionsPerHour','Máximo de ações por hora','wall',1,60)}${numberField('security.postCaptchaCooldownMinutes','Pausa após verificação (min)','wall',45,240)}
 ${infoCard('Atualizar o jogo','Use o botão ↻ na barra do navegador para recarregar a página.','history')}
 ${section('Perfis')}<div class="row wrap"><button class="ghost" data-action="export">Exportar JSON</button><button class="ghost" data-action="import">Importar JSON</button></div>`;
}
function missionsPage(){
 const tutorial=S?.tutorial;
 const states={viable:'Disponível',running:'Em andamento',satisfied:'Recompensa pronta',closed:'Concluída'};
 const rows=list=>(list||[]).map(row=>`<div class="card"><div class="row space"><b>${safe(row.name)}</b><small>${safe(states[row.state]||'Aguardando')}</small></div><p class="note">${safe(row.reason)}</p></div>`).join('');
 return `${section('Tutorial do Grepolis')}${moduleCard(MODULES.find(x=>x[0]==='tutorial'))}
 ${tutorial?.total>0?`<p class="note">${safe(tutorial.completed)} de ${safe(tutorial.total)} missões resgatadas</p>`:''}
 ${rows(tutorial?.rows)||'<p class="note">Nenhuma missão do tutorial disponível na sessão atual.</p>'}
 ${moduleCard(MODULES.find(x=>x[0]==='quests'))}
 <div class="card">${advancedField('quests.autoObjectives',val('quests.autoObjectives',false))}
 ${advancedField('quests.rewardAction',val('quests.rewardAction','stash'))}</div>
 ${rows(S?.islandQuests)||'<p class="note">Nenhuma missão da ilha disponível na sessão atual.</p>'}
 ${section('Acampamento')}${moduleCard(MODULES.find(x=>x[0]==='banditRewards'))}`;
}
function advancedField(path,v,depth=0){
 if(v==null||/(__proto__|constructor|prototype)/.test(path.split('.').at(-1)))return '';
 const [name,description,choices]=optionInfo(path);
 const key=safe(path);
 const caption=`<span${name==='Opção adicional'?` title="${key}"`:''}><b>${safe(name)}</b><small>${safe(description)}</small></span>`;
 let control;
 if(typeof v==='boolean')control=`<input type="checkbox" data-path="${key}" ${v?'checked':''}>`;
 else if(typeof v==='number')control=`<input type="number" step="any" data-number="${key}" value="${v}">`;
 else if(typeof v==='string'){
   if(choices){
     const options=Object.entries(choices);
     if(!Object.hasOwn(choices,v))options.unshift([v,'Valor do perfil']);
     control=`<select data-choice="${key}">${options.map(([value,label])=>`<option value="${safe(value)}" ${v===value?'selected':''}>${safe(label)}</option>`).join('')}</select>`;
   }else control=`<input type="text" data-string="${key}" value="${safe(v)}">`;
 }else{
   const entries=Object.entries(v);
   if(!Array.isArray(v)&&depth<2&&entries.length>0&&entries.length<=8&&entries.every(([k])=>/^[\w-]+$/.test(k))){
     return `<div class="advanced-group">${section(name)}<p class="note">${safe(description)}</p>${entries.map(([k,value])=>advancedField(path+'.'+k,value,depth+1)).join('')}</div>`;
   }
   return `<div class="field vertical"><label for="option-${key}">${caption}</label><textarea id="option-${key}" data-json-text="${key}">${safe(JSON.stringify(v,null,2))}</textarea><button class="tiny" data-save-json="${key}">Salvar configuração</button></div>`;
 }
 return `<label class="field advanced-field">${caption}${control}</label>`;
}
function advancedPage(){
 const conf=S?.config||{};
 const ignored=new Set(['ui','cityProfiles','troopProfiles','onboarding']);
 return `<p class="note">Edite as preferências do motor. Os campos JSON aceitam as chaves usadas nos perfis exportados.</p>`+
 Object.entries(conf).filter(([key,v])=>!ignored.has(key)&&v!=null).map(([key,v])=>{
  if(typeof v!=='object')return `<div class="card">${advancedField(key,v)}</div>`;
  const [name,description,icon='settings']=optionInfo(key);
  const fields=Object.entries(v).filter(([k])=>key!=='intervals'||k!=='_defaults');
  return `<div class="card"><div class="card-head">${uiIcon(icon)}<div class="grow"><b>${safe(name)}</b><small>${safe(description)}</small></div></div>${fields.map(([k,value])=>advancedField(key+'.'+k,value)).join('')}</div>`;
 }).join('');
}
function logPage(){
 const logs=S?.status?.logs||[];
 const levels={INFO:'Informação',WARN:'Aviso',ERROR:'Erro',ALERT:'Alerta'};
 return `${section('Eventos recentes')}${logs.length?logs.slice().reverse().map(x=>`<div class="card"><div class="row space"><b>${safe(levels[x.level]||'Evento')}</b><small>${safe(x.stamp)}</small></div>${logMessage(x.message)}</div>`).join(''):'<div class="empty">Ainda não há eventos nesta sessão.</div>'}`;
}
function logMessage(message){
 const text=String(message??'');
 const command=text.match(/^SIMULACAO (\w+\/\w+) /)?.[1];
 if(command){
   const names={
     'frontend_bridge/execute':'ação pelo cliente do Grepolis',
     'town_info/trade':'envio de recursos entre cidades',
     'town_info/send_units':'envio de tropas',
     'farm_town_overviews/claim_loads_multiple':'coleta de recursos em lote',
     'building_place/start_celebration':'início de uma celebração',
     storeIron:'depósito de prata na Gruta',claim:'coleta de recursos na aldeia',
     buildUp:'construção de edifício',tearDown:'demolição de edifício',
     buyInstant:'conclusão grátis de obra',research:'início de uma pesquisa',
     trade:'troca de recursos com aldeia',claimReward:'resgate de recompensa de missão'
   };
   const action=command==='frontend_bridge/execute'?text.match(/"action_name":"(\w+)"/)?.[1]:command;
   const description=Object.hasOwn(names,action)?names[action]:names[command]||'solicitação ao Grepolis';
   return `<p>Simulação · ${description}</p><details class="technical"><summary>Detalhes do comando</summary><pre>${safe(text)}</pre></details>`;
 }
 return `<p>${safe(text.replace(/^Auto farm:/,'Coleta automática:').replace(/^SIMULACAO\b/,'SIMULAÇÃO').replaceAll('frontend_bridge/execute','ação pelo cliente do Grepolis'))}</p>`;
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
 const colony=d.colonizationPolicy||'confirmed';
 const clock=ms=>ms?new Date(ms).toLocaleTimeString('pt-BR',{hour12:false}):'aguardando cálculo';
 const labels={confirmed:'Colono confirmado',manual_colony:'Colono marcado',manual_normal:'Ataque comum marcado',
  suspected:'Possível colono',revolt:'Revolta',unknown:'Composição oculta'};
 const jobStates={dispatching:'Enviando apoio',identifying:'Identificando apoio',sent:'Apoio em viagem',
  canceling:'Cancelando apoio',cancelled:'Apoio cancelado',needs_attention:'Apoio requer atenção'};
 return `${section('Situação da esquiva')}
 <div class="card"><div class="card-head">${bImage('wall')}<div class="grow"><b>${running?'Esquiva real em funcionamento':'Esquiva não está operacional'}</b>
 <small>${safe(running?'Monitorando ataques e horários de envio':blockers.join(' · ')||'Aguardando estado do motor')}</small></div></div>
 <button class="cta" data-action="start-dodge">Ativar esquiva real</button>
 <p class="note">Apoio antes do primeiro impacto. A volta é planejada para 1 segundo após o fim da sequência. Para colono confirmado, vale a opção abaixo.</p></div>
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
 ${numberField('dodge.leadSeconds','Enviar antes do impacto (segundos)','wall',20,180,d.leadSeconds??60)}
 ${numberField('dodge.waveGapSeconds','Intervalo entre ataques do grupo (segundos)','wall',1,60,d.waveGapSeconds??12)}
 ${section('Ataque de colonização')}
 <div class="card"><label class="field"><b>Quando houver colono confirmado</b>
 <select data-choice="dodge.colonizationPolicy">
 <option value="confirmed" ${colony==='confirmed'?'selected':''}>Defender o colono</option>
 <option value="all" ${colony==='all'?'selected':''}>Esquivar do colono</option>
 </select></label>
 <p class="note">${colony==='all'?'Mira a volta 1 segundo após o impacto do colono. O jogo resolve se há batalha no cerco.':'Planeja voltar 1 segundo antes do colono quando há espaço após o ataque anterior. Se os impactos estiverem juntos, mantém a defesa na cidade.'}</p></div>
 ${section('Ataques recebidos')}
 ${d.incomingTotal>(d.incoming||[]).length?`<p class="note">${Number(d.incomingTotal)} ataques em acompanhamento. Confira abaixo os próximos ${d.incoming.length}.</p>`:''}
 ${(d.incoming||[]).map(a=>{
  const travel=a.travel;
  const scenarios=(travel?.matches||[]).slice(0,3);
  return `<div class="card"><div class="row space"><b>${safe(a.simulated?'Teste prático':labels[a.classification]||a.classification)}</b><small>${clock(a.arrivalMs)}</small></div>
  <p class="note">${safe(a.reason)}</p>
  ${travel?`<p class="note">${safe(travel.reason)} ${travel.observedSeconds===null?'':('Duração informada: '+travel.observedSeconds+' s.')}</p>`:''}
  ${travel?.hiddenFraction?`<p class="note">Elmo de Hades · primeiros 10% da viagem ocultos · duração total de pelo menos ${travel.visibleLowerBoundSeconds} s.</p>`:''}
  ${scenarios.length?`<details><summary>Cenários de colono compatíveis</summary><ul>${scenarios.map(m=>`<li>${m.seconds} s · ${safe(m.effects.join(' + ')||'Sem bônus')}</li>`).join('')}</ul>
  ${travel.alternatives?.length?`<p class="note">Outras unidades compatíveis: ${safe(travel.alternatives.slice(0,5).map(x=>PT_UNITS[x.unit]||x.unit).join(', '))}</p>`:''}</details>`:''}
  ${travel?.route&&(!travel.available||a.baselineMinutes)?`<div class="row wrap">
  <label>Viagem sem bônus (min) <input type="number" min="1" max="2880" step="0.01" data-colony-baseline value="${safe(a.baselineMinutes??'')}"></label>
  <button class="ghost" data-action="colony-baseline" data-attack="${safe(a.id)}">Calcular cenários</button></div>`:''}
  ${!a.simulated&&a.classification!=='confirmed'?`<div class="row wrap">
  <button class="ghost" data-action="mark-colony" data-attack="${safe(a.id)}">É colono</button>
  <button class="ghost" data-action="mark-normal" data-attack="${safe(a.id)}">Ataque comum</button>
  ${a.classification.startsWith('manual_')?`<button class="ghost" data-action="mark-clear" data-attack="${safe(a.id)}">Limpar marcação</button>`:''}</div>`:''}</div>`;
 }).join('')||'<div class="empty">Nenhum ataque recebido identificado nesta cidade.</div>'}
 ${section('Apoios e cancelamentos')}
 ${(d.jobs||[]).map(j=>`<div class="card"><b>${safe(jobStates[j.state]||'Acompanhando apoio')}</b><small>Destino #${j.targetId} · comando #${j.commandId||'identificando'}</small>
 ${j.cancelAtMs?`<p class="note">Cancelamento planejado às ${clock(j.cancelAtMs)} · alvo de retorno às ${clock(j.returnAtMs)}</p>`:''}
 ${j.confirmedReturnAtMs?`<p class="note">Chegada informada pelo jogo às ${clock(j.confirmedReturnAtMs)}</p>`:j.estimatedReturnAtMs?`<p class="note">Chegada estimada às ${clock(j.estimatedReturnAtMs)}</p>`:''}
 <p class="note">${safe(j.error||j.timingNote||'Acompanhando comando')}</p></div>`).join('')||'<div class="empty">Nenhum apoio em acompanhamento.</div>'}
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
  ${Object.keys(m.units||{}).length?`<small>Tropas: ${safe(Object.entries(m.units).map(([k,v])=>(PT_UNITS[k]||S?.catalog?.units?.find(u=>u.id===k)?.name||k)+' ×'+v).join(', '))}</small>`:''}
  ${Object.keys(m.resources||{}).length?`<small>Recursos: ${safe(Object.entries(m.resources).map(([k,v])=>(RESOURCES[k]||k)+' '+v).join(', '))}</small>`:''}</div>`).join('')||'<div class="empty">Nenhuma movimentação compartilhada com esses filtros.</div>'}</div>`;
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
 if(active==='COMPARTILHADA'&&!document.activeElement?.matches('input,textarea,select'))rendered(false);
}
function rendered(force=true){
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
 else if(active==='MISSÕES')body=missionsPage();
 else if(active==='TESTE')body=testPage();
 else if(active==='ESQUIVA')body=dodgePage();
 else if(active==='VERIFICAR')body=infoCard('Verificação do motor','Use Verificar agora para analisar o estado de cada componente.','check')+`<button class="cta" data-action="verify">Verificar agora</button><div id="health-results"></div>`;
 else if(active==='DIAG')body=infoCard('Diagnóstico de conexão',statusText(),'diagnostic')+`<details class="card technical"><summary>Dados técnicos da sessão</summary><pre>${safe(JSON.stringify(S.status,null,2))}</pre></details>`;
 else {
  const relevant=MODULES.filter(x=>x[3]===active);
  body=(relevant.length?relevant:MODULES).map(moduleCard).join('');
  if(active==='CIDADES'){
     body=infoCard('Cidades encontradas',String(S.catalog.cities.length)+' cidades','cities')+body+
       section('Cultura automática')+
       '<p class="note">Ative Festivais e cultura acima e escolha as celebrações. Festa e triunfo são marcados na primeira ativação; teatro é opcional. Para executar, ligue a automação geral e desligue o modo simulação.</p>'+
       '<div class="card">'+
         advancedField('culture.festival',val('culture.festival',false))+
         advancedField('culture.triumph',val('culture.triumph',false))+
         advancedField('culture.theater',val('culture.theater',false))+
       '</div>';
   }
  if(active==='ALDEIAS')body+=numberField('ruralUpgrade.targetLevel','Nível desejado','pin',1,6);
  if(active==='ECONOMIA')body+=numberField('trade.minReserve','Reserva mínima do comércio','storage',0,500000)+cavePage();
  if(active==='FILA')body+=`<p class="note">Ajuste as metas e a prioridade da fila em Opções completas.</p>`;
 }
 const error=sharedError||sharedConfig.lastError;
 setMarkup('panel-content',body+(active==='COMPARTILHADA'&&error?`<div class="card"><small>${safe(error)}</small></div>`:''),force);
}
async function readState(){
 const id=++stateReadId;
 const state=await window.gpDesktop.getState(active,town);
 if(id!==stateReadId)return null;
 S=state;
 return state;
}
async function load(){
 if(busy||readingState)return;
 readingState=true;
 try{
  const s=await readState();
  if(!s||busy)return;
  const address=el('address');
  if(s?.url&&document.activeElement!==address&&address.value!==s.url)address.value=s.url;
  el('engine-status').textContent=s?.ready?'Motor conectado':(s?.reason||'Aguardando o Grepolis');
  const hasVerification=active==='VERIFICAR'&&s.ready&&el('health-results');
  if(!hasVerification&&!document.activeElement?.matches('input,textarea,select,summary'))rendered(false);
  else{el('state-text').textContent=statusText()}
 }catch(e){el('engine-status').textContent=e.message}finally{readingState=false}
}
async function save(path,v){
 try{busy=true;await window.gpDesktop.patch(path,v);notify('Configuração salva');await loadForced()}
 catch(e){notify('Falha: '+e.message,true)}finally{busy=false}
}
async function loadForced(){if(await readState())rendered()}
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
 if(action.dataset.action==='colony-baseline'){
   const input=action.parentElement.querySelector('[data-colony-baseline]');
   try{await window.gpDesktop.setColonyBaseline(action.dataset.attack,input.valueAsNumber);await loadForced()}
   catch(ex){notify(ex.message,true)}return;
 }
 if(['mark-colony','mark-normal','mark-clear'].includes(action.dataset.action)){
   try{await window.gpDesktop.markDodgeAttack(action.dataset.attack,action.dataset.action.slice(5));await loadForced()}
   catch(ex){notify(ex.message,true)}return;
 }
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
   const labels={ok:'Compatível',warn:'Aviso',error:'Erro'};
   try{const h=await window.gpDesktop.verify();el('health-results').innerHTML=
     `<div class="card"><b>${h.critical||0} erro(s) / ${h.warnings||0} aviso(s)</b></div>`+
     (h.checks||[]).map(c=>`<div class="card"><div class="row space"><b>${safe(c.title)}</b><span class="pill ${c.status==='ok'?'':'off'}">${safe(labels[c.status]||'Indisponível')}</span></div><small>${safe(c.detail)}</small></div>`).join('')}catch(ex){notify(ex.message,true)}
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
 if(t.dataset.number){
   if(!t.value.trim()||!Number.isFinite(t.valueAsNumber)||t.validity.rangeUnderflow||t.validity.rangeOverflow){
     t.reportValidity();
     t.value=t.defaultValue;
     return;
   }
   await save(t.dataset.number,t.valueAsNumber);
 }
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
window.gpDesktop.onShared(s=>{sharedConfig=s;if(active==='COMPARTILHADA'&&!document.activeElement?.matches('input,textarea,select'))rendered(false)});
window.gpDesktop.onUpdate(s=>{const footer=el('update-status');if(footer)footer.textContent=s});
window.gpDesktop.appInfo().then(x=>{el('app-version').textContent='v'+x.version;
  const footer=el('update-status');if(footer)footer.textContent=x.updateStatus||''}).catch(()=>{});
loadShared().catch(()=>{});setInterval(()=>loadShared().catch(()=>{}),12000);
rendered();load();setInterval(load,2000);
