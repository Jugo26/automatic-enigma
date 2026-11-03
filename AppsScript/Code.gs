/**
 * Conferência 360 — envio pelo Google Apps Script (sem Node.js).
 * Implantar como Aplicativo da Web, executar COMO VOCÊ.
 * Nunca publique como editor o projeto com seus próprios dados.
 */
const CONF360_DESTINATARIO = 'bryan.vieira@tegma.com.br';
const CONF360_LIMITE_DIARIO = 20; // Conservador: reduz risco de abuso e uso inesperado da conta.

/**
 * Atualização automática pelo repositório GitHub público oficial.
 * A cada abertura do Apps Script, verifica o HTML da branch main.
 * Se GitHub estiver indisponível, usa a cópia estável Index.html deste projeto.
 * Não armazene tokens GitHub ou credenciais Gmail no repositório público.
 */
const CONF360_REPOSITORIO = 'Jugo26/automatic-enigma';
const CONF360_HTML_URL = 'https://raw.githubusercontent.com/' + CONF360_REPOSITORIO + '/main/Index.html';

function obterHtmlAtualizado_() {
  const url = CONF360_HTML_URL + '?abertura=' + Date.now();
  const resposta = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {Accept:'text/html'}
  });
  if (resposta.getResponseCode() !== 200) throw new Error('GitHub não retornou HTTP 200.');
  const html = resposta.getContentText('UTF-8');
  if (html.length < 100000 || !/^\s*<!doctype html>/i.test(html) ||
      !html.includes('id="game"') || !/<\/html>\s*$/i.test(html)) {
    throw new Error('Arquivo GitHub vazio ou com estrutura inesperada.');
  }
  return html;
}

function doGet() {
  let tela;
  try {
    tela = HtmlService.createHtmlOutput(obterHtmlAtualizado_());
  } catch (erro) {
    console.warn('Conferência 360: GitHub indisponível; usando versão local de segurança: ' + erro);
    tela = HtmlService.createHtmlOutputFromFile('Index');
  }
  return tela.setTitle('Conferência 360 | Treinamento atualizado')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Única função de envio acessível ao navegador do jogo. */
function sendTrainingReport(relatorio) {
  validarRelatorio_(relatorio);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('Servidor ocupado. Tente novamente em instantes.');
  try {
    const props = PropertiesService.getScriptProperties();
    const dia = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
    const chaveDia = 'dia_' + dia;
    const enviados = JSON.parse(props.getProperty(chaveDia) || '[]');
    const duplicado = props.getKeys().some(function(k){
      return /^dia_\d{8}$/.test(k) &&
        JSON.parse(props.getProperty(k) || '[]').includes(relatorio.reportId);
    });
    if (duplicado) {
      return {ok:true,id:relatorio.reportId,duplicate:true};
    }
    if (enviados.length >= CONF360_LIMITE_DIARIO) {
      throw new Error('Limite diário de relatórios alcançado. Baixe o CSV e tente amanhã.');
    }
    if (MailApp.getRemainingDailyQuota() < 1) {
      throw new Error('Cota de envio do Google esgotada. Baixe o CSV e tente mais tarde.');
    }
    const participante = (String(relatorio.participant).replace(/[\r\n\t]+/g,' ').trim()) || 'Não informado';
    const nomeArquivo = 'Conferencia360_' + dia + '_' + relatorio.reportId.slice(0,24) + '.csv';
    const anexo = Utilities.newBlob(relatorio.csv,'text/csv',nomeArquivo);
    MailApp.sendEmail({
      to: CONF360_DESTINATARIO,  // O cliente não pode escolher destinatários.
      subject: 'Conferência 360 — 10 rodadas — ' + participante.slice(0,70),
      body: 'Treinamento concluído.\n\nParticipante: ' + participante +
        '\nRodadas: 10\nAcertos: ' + relatorio.correct + '/10' +
        '\nPontuação: ' + relatorio.score +
        '\n\nRelatório completo no arquivo CSV em anexo.\n' +
        'Atenção: dados declarados pelo navegador, para fins de treinamento; não constituem certificação fiscal.',
      attachments:[anexo],
      name:'Conferência 360'
    });
    enviados.push(relatorio.reportId);
    props.setProperty(chaveDia, JSON.stringify(enviados));
    limparHistoricoEnvios_(props, dia);
    return {ok:true,id:relatorio.reportId,duplicate:false};
  } finally {
    lock.releaseLock();
  }
}

function validarRelatorio_(r) {
  if (!r || typeof r !== 'object') throw new Error('Relatório ausente.');
  if (typeof r.reportId !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(r.reportId)) {
    throw new Error('Identificador inválido.');
  }
  if (r.played !== 10 || r.completedTarget !== 10) throw new Error('Somente sessões de 10 rodadas podem ser enviadas.');
  if (!Number.isInteger(r.correct) || r.correct < 0 || r.correct > 10 ||
      !Number.isInteger(r.score) || r.score < 0 || r.score > 3000) {
    throw new Error('Pontuação ou quantidade de acertos inválida.');
  }
  if (typeof r.participant !== 'string' || r.participant.length > 90) throw new Error('Nome do participante inválido.');
  if (typeof r.csv !== 'string' || r.csv.length < 150 || r.csv.length > 60000 ||
      !r.csv.includes('"Rodada";') || !r.csv.includes('"TOTAL";')) {
    throw new Error('Relatório CSV incompleto ou inválido.');
  }
  // Dez rodadas são obrigatórias. O servidor valida o formato, mas o
  // gabarito e o resultado são dados produzidos pelo navegador.
  const linhaRodada = r.csv.match(/^"(?:[1-9]|10)";/gm) || [];
  if (linhaRodada.length !== 10) throw new Error('O relatório CSV deve conter exatamente 10 rodadas.');
}

function limparHistoricoEnvios_(props, dia) {
  // Evita crescimento ilimitado; conserva controle de duplicação dos últimos 30 dias.
  const limite = new Date(); limite.setDate(limite.getDate()-30);
  const minDia = Utilities.formatDate(limite, Session.getScriptTimeZone(), 'yyyyMMdd');
  props.getKeys().forEach(function(k){if(/^dia_\d{8}$/.test(k) && k.slice(4) < minDia)props.deleteProperty(k)});
}