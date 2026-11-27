/** Conferência 360 — Google Sheets e e-mail, sem chave no navegador. */
const ABA = 'Resultados';
const COLUNAS = ['Data','ID da tentativa','Nome','Matrícula','Acertos','Erros','Nota (%)','Tempo (s)','Detalhes','E-mail'];
const CONF360_LIMITE_DIARIO = 20;
const CONF360_HTML_URL = 'https://raw.githubusercontent.com/Jugo26/automatic-enigma/main/Index.html';

function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const resposta = ui.prompt('Configuração','Informe o e-mail que receberá os resultados:',ui.ButtonSet.OK_CANCEL);
  if (resposta.getSelectedButton() !== ui.Button.OK) return;
  const email = resposta.getResponseText().trim();
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)) throw new Error('E-mail inválido.');
  let aba = ss.getSheetByName(ABA);
  if (!aba) aba = ss.insertSheet(ABA);
  if (!aba.getLastRow()) {
    aba.getRange(1,1,1,COLUNAS.length).setValues([COLUNAS]).setBackground('#242424').setFontColor('#ffffff').setFontWeight('bold');
    aba.setFrozenRows(1);
    aba.setColumnWidths(1,COLUNAS.length,145);
    aba.setColumnWidth(9,360);
    aba.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    aba.getRange('B:D').setNumberFormat('@');
  } else if (JSON.stringify(aba.getRange(1,1,1,COLUNAS.length).getValues()[0]) !== JSON.stringify(COLUNAS)) {
    throw new Error('A aba Resultados possui outro formato. Nenhum dado foi substituído.');
  }
  const props = PropertiesService.getScriptProperties();
  props.setProperties({PLANILHA_ID:ss.getId(),EMAIL_DESTINO:email});
  if (!props.getProperty('CHAVE_INTEGRACAO')) props.setProperty('CHAVE_INTEGRACAO',Utilities.getUuid()+Utilities.getUuid());
  ui.alert('Configuração concluída. Execute testarEmail.');
}

function testarEmail() {
  // O contexto de interface da planilha não está disponível no aplicativo web.
  if(!SpreadsheetApp.getActiveSpreadsheet()) throw new Error('Execute o teste somente no editor vinculado à planilha.');
  const email=PropertiesService.getScriptProperties().getProperty('EMAIL_DESTINO');
  if (!email) throw new Error('Execute configurar primeiro.');
  enviarEmail_(email,{nome:'Colaborador de teste',matricula:'000001',acertos:8,erros:2,tempoSegundos:510,detalhes:'Exemplo fictício de resultado.'},true);
}

function doGet() {
  let tela;
  try {
    const r=UrlFetchApp.fetch(CONF360_HTML_URL+'?abertura='+Date.now(),{muteHttpExceptions:true,followRedirects:true,headers:{Accept:'text/html'}});
    const html=r.getContentText('UTF-8');
    if(r.getResponseCode()!==200 || html.length<100000 || !/^\s*<!doctype html>/i.test(html) || !html.includes('id="game"') || !/<\/html>\s*$/i.test(html)) throw new Error('HTML indisponível.');
    tela=HtmlService.createHtmlOutput(html);
  } catch(e) {
    try { tela=HtmlService.createHtmlOutputFromFile('Index'); }
    catch(_) { tela=HtmlService.createHtmlOutput('<h2>Treinamento temporariamente indisponível</h2><p>Não foi possível carregar o GitHub. Reabra este endereço mais tarde.</p>'); }
  }
  return tela.setTitle('Conferência 360 | Treinamento atualizado').addMetaTag('viewport','width=device-width, initial-scale=1');
}

/** RPC do jogo hospedado pelo Apps Script. Restrinja o acesso da implantação. */
function sendTrainingReport(r) {
  const p=converterRelatorio_(r);
  const result=registrar_(p,r.csv);
  if(result.email!=='ENVIADO') throw new Error('Resultado registrado na planilha, mas e-mail não confirmado ('+result.email+'). Tente novamente ou exporte o CSV.');
  return {ok:true,id:p.id,duplicate:result.duplicado};
}

function converterRelatorio_(r) {
  if(!r || r.played!==10 || r.completedTarget!==10 || !Number.isInteger(r.correct) || r.correct<0 || r.correct>10 ||
    !Number.isInteger(r.score) || r.score<0 || r.score>3000 || typeof r.csv!=='string' || r.csv.length<150 || r.csv.length>60000 ||
    typeof r.participant!=='string' || r.participant.trim()==='Não informado') throw new Error('Relatório incompleto ou inválido.');
  const rows=Utilities.parseCsv(r.csv.replace(/^\uFEFF/,''),';');
  const header=rows.findIndex(row=>row[0]==='Rodada' && row[2]==='Resultado');
  if(header<0) throw new Error('Cabeçalho do CSV inválido.');
  const rounds=rows.slice(header+1,header+11);
  if(rounds.length!==10 || rounds.some((row,i)=>row[0]!==String(i+1) || !['Acerto','Erro'].includes(row[2])) ||
    rounds.filter(row=>row[2]==='Acerto').length!==r.correct || rows[header+11]?.[0]!=='TOTAL') throw new Error('As dez rodadas não conferem.');
  const elapsed=r.tempoSegundos == null ? Math.floor((Date.now()-Date.parse(r.startedAt))/1000) : r.tempoSegundos;
  const detalhes=rounds.filter(row=>row[2]==='Erro').map(row=>'Rodada '+row[0]+' — '+row[1]+': '+(row[4]||'Sem divergência')+'; M2: '+(row[5]||'Nenhum')+'; M1: '+(row[6]||'Nenhum')).join('\n') || 'Nenhum erro.';
  const p={id:r.reportId,nome:r.participant.trim(),matricula:r.matricula||'',acertos:r.correct,erros:10-r.correct,tempoSegundos:elapsed,detalhes:detalhes.slice(0,4000)};
  if(!validar_(p)) throw new Error('Dados inválidos.');
  return p;
}

/** Integração servidor-servidor opcional; chave permanece nas propriedades. */
function doPost(e) {
  try {
    const raw=e&&e.postData&&e.postData.contents;
    if(!raw||raw.length>16000) return json_({ok:false,erro:'Requisição inválida'});
    const p=JSON.parse(raw), chave=PropertiesService.getScriptProperties().getProperty('CHAVE_INTEGRACAO');
    if(!chave||p.chave!==chave) return json_({ok:false,erro:'Não autorizado'});
    if(!validar_(p)) return json_({ok:false,erro:'Dados inválidos'});
    return json_(registrar_(p));
  } catch(e) {return json_({ok:false,erro:'Não foi possível processar o resultado'});}
}

function registrar_(p,csv) {
  const props=PropertiesService.getScriptProperties();
  const id=props.getProperty('PLANILHA_ID'), email=props.getProperty('EMAIL_DESTINO');
  if(!id||!email) throw new Error('Execute configurar na planilha primeiro.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Servidor ocupado. Tente novamente.');
  try {
    const aba=SpreadsheetApp.openById(id).getSheetByName(ABA);
    if(!aba) throw new Error('Aba Resultados não encontrada.');
    let linha=0, duplicado=false;
    if(aba.getLastRow()>1){
      const found=aba.getRange(2,2,aba.getLastRow()-1,1).createTextFinder(p.id).matchEntireCell(true).matchCase(true).findNext();
      if(found){
        linha=found.getRow();duplicado=true;
        const stored=aba.getRange(linha,1,1,10).getValues()[0];
        const status=String(stored[9]);
        if(status==='ENVIADO'||status==='ENVIANDO'||status==='INCERTO') return {ok:true,duplicado:true,email:status};
        if(String(stored[2])!==seguro_(p.nome).replace(/^'/,'') || String(stored[3])!==seguro_(p.matricula||'').replace(/^'/,'') || stored[4]!==p.acertos || stored[5]!==p.erros) throw new Error('Tentativa já registrada com outros dados.');
        p.tempoSegundos=stored[7];p.detalhes=String(stored[8]);
      }
    }
    if(!linha){
      aba.appendRow([new Date(),p.id,seguro_(p.nome),seguro_(p.matricula||''),p.acertos,p.erros,p.acertos*10,p.tempoSegundos,seguro_(p.detalhes||''),'PENDENTE']);
      linha=aba.getLastRow();
      SpreadsheetApp.flush();
    }
    const dia=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd'), chaveDia='dia_'+dia;
    let enviados=JSON.parse(props.getProperty(chaveDia)||'[]');
    if(enviados.length>=CONF360_LIMITE_DIARIO || MailApp.getRemainingDailyQuota()<1){
      aba.getRange(linha,10).setValue('PENDENTE');
      return {ok:true,duplicado,email:'PENDENTE'};
    }
    aba.getRange(linha,10).setValue('ENVIANDO');
    SpreadsheetApp.flush();
    try {enviarEmail_(email,p,false,csv);}
    catch(e){
      // A entrega pode ser incerta: não reenviar automaticamente para evitar duplicatas.
      aba.getRange(linha,10).setValue('INCERTO');
      return {ok:true,duplicado,email:'INCERTO'};
    }
    aba.getRange(linha,10).setValue('ENVIADO');
    SpreadsheetApp.flush();
    enviados.push(p.id);props.setProperty(chaveDia,JSON.stringify(enviados));
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);
    const min=Utilities.formatDate(cutoff,Session.getScriptTimeZone(),'yyyyMMdd');
    props.getKeys().forEach(k=>{if(/^dia_\d{8}$/.test(k)&&k.slice(4)<min)props.deleteProperty(k);});
    return {ok:true,duplicado,email:'ENVIADO'};
  } finally {lock.releaseLock();}
}

function validar_(p) {
  return !!p && typeof p.id==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,99}$/.test(p.id) &&
    typeof p.nome==='string' && p.nome.trim().length>0 && p.nome.length<=150 && !/[\r\n]/.test(p.nome) &&
    (p.matricula==null||(typeof p.matricula==='string'&&p.matricula.length<=80)) &&
    Number.isInteger(p.acertos)&&p.acertos>=0&&p.acertos<=10&&Number.isInteger(p.erros)&&p.erros>=0&&p.acertos+p.erros===10 &&
    Number.isInteger(p.tempoSegundos)&&p.tempoSegundos>=0&&p.tempoSegundos<=86400 &&
    (p.detalhes==null||(typeof p.detalhes==='string'&&p.detalhes.length<=4000));
}
function seguro_(v) {const s=String(v);return /^[\s\uFEFF]*[=+\-@]/.test(s)?"'"+s:s;}
function enviarEmail_(email,p,teste,csv) {
  const assunto=(teste?'[TESTE] ':'')+'Resultado do treinamento — '+p.nome;
  const corpo=['CONFERÊNCIA DOCUMENTAL','','Colaborador: '+p.nome,'Matrícula: '+(p.matricula||'Não informada'),'Acertos: '+p.acertos+'/10','Erros: '+p.erros,'Nota: '+p.acertos*10+'%','Tempo: '+Math.floor(p.tempoSegundos/60)+' min '+p.tempoSegundos%60+' s','','Detalhes: '+(p.detalhes||'Não informados'),'','Resultados declarados pelo navegador; não constituem certificação fiscal.'].join('\n');
  const msg={to:email,subject:assunto,body:corpo,name:'Treinamento de Conferência'};
  if(csv) {
    // Reencode all cells to prevent spreadsheet formula injection in attachments.
    const rows=Utilities.parseCsv(csv.replace(/^\uFEFF/,''),';');
    const clean='\uFEFF'+rows.map(row=>row.map(v=>'"'+seguro_(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    msg.attachments=[Utilities.newBlob(clean,'text/csv','Conferencia360_'+p.id+'.csv')];
  }
  MailApp.sendEmail(msg);
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
