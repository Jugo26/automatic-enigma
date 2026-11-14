const $ = id => document.getElementById(id);
const key = 'grepolis_shared_session_token';
let token = sessionStorage.getItem(key) || '';
let state = null;
let abortController = null;
let connectionId = 0;
let activeTab = 'players';
const labels = {
  attack: ['⚔', 'Ataque'], support: ['♜', 'Apoio'], trade: ['▣', 'Comércio'],
  return: ['↩', 'Retorno'], colonization: ['⚑', 'Colonização'],
  spy: ['◉', 'Espionagem'], other: ['•', 'Outro']
};
const dirLabels = { incoming: 'Entrada', outgoing: 'Saída', internal: 'Interno' };
const statusLabels = { traveling: 'Em trânsito', returning: 'Retornando', arrived: 'Chegou', canceled: 'Cancelado', unknown: 'Indefinido' };
const dateText = timestamp => timestamp ? new Date(timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }) : '—';
const ago = timestamp => {
  if (!timestamp) return 'Nunca';
  const secs = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  return secs < 60 ? `${secs}s atrás` : secs < 3600 ? `${Math.floor(secs / 60)}min atrás` : `${Math.floor(secs / 3600)}h atrás`;
};
const remaining = timestamp => {
  if (!timestamp) return 'Sem previsão';
  const secs = Math.round((new Date(timestamp).getTime() - Date.now()) / 1000);
  if (secs <= 0) return 'Horário alcançado';
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
};
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
function elt(tag, text, cls = '') {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (cls) element.className = cls;
  return element;
}
function cell(row, text, cls = '') { const td = elt('td', text, cls); row.append(td); return td; }
function putEmpty(tbody, n, msg) { tbody.replaceChildren(); const tr = elt('tr'); const td = cell(tr, msg, 'empty'); td.colSpan = n; tbody.append(tr); }
function pill(text, kind = '') { return elt('span', text, `pill ${kind}`); }
function connectStatus(connected) {
  $('connectionLabel').textContent = connected ? 'Conectado' : 'Desconectado';
  document.querySelector('.status-dot').classList.toggle('online', connected);
}
function updateFilters() {
  const f = $('playerFilter'); const chosen = f.value;
  f.replaceChildren(elt('option', 'Todos'));
  f.firstChild.value = '';
  for (const u of state.users) { const opt = elt('option', u.name); opt.value = u.id; f.append(opt); }
  f.value = chosen;
}
function renderPlayers() {
  const body = $('playerRows'); body.replaceChildren();
  if (!state.users.length) return putEmpty(body, 5, 'Nenhum jogador cadastrado.');
  for (const u of [...state.users].sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name))) {
    const tr = elt('tr'); cell(tr, u.name, 'player'); cell(tr, u.alliance || '—');
    const online = u.online && Date.now() - u.lastSeen <= 45000;
    const status = cell(tr, ''); status.append(pill(online ? '● Online' : '○ Offline', online ? 'good' : ''));
    const share = cell(tr, ''); share.append(pill(u.sharing ? 'Compartilhando' : 'Privado', u.sharing ? 'gold' : ''));
    cell(tr, ago(u.lastSeen), 'elapsed'); body.append(tr);
  }
}
function details(m) {
  const units = Object.entries(m.units || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
  const resources = Object.entries(m.resources || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
  return [statusLabels[m.status] || '', units, resources, m.note || ''].filter(Boolean).join(' | ') || '—';
}
function renderMovements() {
  if (!state) return;
  const tbody = $('movementRows'); tbody.replaceChildren();
  const owner = $('playerFilter').value, type = $('typeFilter').value, dir = $('directionFilter').value, search = $('cityFilter').value.toLowerCase().trim();
  const found = state.movements.filter(m => (!owner || m.ownerId === owner) && (!type || m.type === type) &&
    (!dir || m.direction === dir) && (!search || `${m.origin?.name || ''} ${m.destination?.name || ''}`.toLowerCase().includes(search)));
  if (!found.length) return putEmpty(tbody, 7, 'Nenhum movimento encontrado para os filtros selecionados.');
  for (const m of found) {
    const tr = elt('tr'); const typeCell = cell(tr, ''); typeCell.append(pill(`${labels[m.type]?.[0] || '•'} ${labels[m.type]?.[1] || 'Outro'}`, m.type === 'attack' ? 'bad' : m.type === 'support' ? 'good' : ''));
    cell(tr, m.playerName, 'player'); cell(tr, m.origin?.name || m.origin?.id || '—');
    cell(tr, m.destination?.name || m.destination?.id || '—');
    const directionCell = cell(tr, ''); directionCell.append(pill(dirLabels[m.direction] || '—'));
    const arrival = cell(tr, ''); arrival.append(elt('span', remaining(m.arriveAt), 'elapsed'));
    arrival.append(elt('span', dateText(m.arriveAt), 'cell-sub'));
    cell(tr, details(m)); tbody.append(tr);
  }
}
function render() {
  if (!state) return;
  $('usersTotal').textContent = String(state.users.length);
  $('usersOnline').textContent = String(state.users.filter(u => u.online && Date.now() - u.lastSeen <= 45000).length);
  $('moveTotal').textContent = String(state.movements.length);
  $('worldName').textContent = state.world;
  $('lastUpdate').textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR')}`;
  $('shareToggle').checked = !!state.users.find(u => u.id === state.selfId)?.sharing;
  updateFilters(); renderPlayers(); renderMovements();
}
async function refresh(id = connectionId) {
  if (!token || id !== connectionId) return;
  try {
    const next = await api('/api/state');
    if (id !== connectionId) return;
    state = next; render(); connectStatus(true);
  } catch (error) {
    if (id !== connectionId) return;
    connectStatus(false); $('settingsFeedback').textContent = error.message;
  }
}
async function stream(id) {
  while (id === connectionId && token) {
    try {
      abortController = new AbortController();
      const response = await fetch('/api/stream', { headers: { Authorization: `Bearer ${token}` }, signal: abortController.signal });
      if (!response.ok || !response.body) throw new Error('stream indisponível');
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let buffer = '';
      while (id === connectionId) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let i;
        while ((i = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, i); buffer = buffer.slice(i + 2);
          if (event.includes('event: changed')) refresh(id);
        }
      }
    } catch (e) { if (id !== connectionId) break; connectStatus(false); }
    if (id !== connectionId) break;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}
async function login() {
  $('loginError').textContent = '';
  try {
    state = await api('/api/state');
    sessionStorage.setItem(key, token);
    $('login').classList.add('hidden'); $('main').classList.remove('hidden'); $('logout').classList.remove('hidden');
    connectStatus(true); render();
    abortController?.abort(); connectionId++;
    stream(connectionId);
  } catch (error) { $('loginError').textContent = error.message; token = ''; sessionStorage.removeItem(key); }
}
$('loginForm').addEventListener('submit', async event => { event.preventDefault(); token = $('token').value.trim(); await login(); });
$('logout').addEventListener('click', () => {
  connectionId++; abortController?.abort(); token = ''; state = null; sessionStorage.removeItem(key);
  $('main').classList.add('hidden'); $('login').classList.remove('hidden'); $('logout').classList.add('hidden'); $('token').value = ''; connectStatus(false);
});
for (const btn of document.querySelectorAll('[data-tab]')) btn.addEventListener('click', () => {
  activeTab = btn.dataset.tab;
  for (const tab of document.querySelectorAll('[data-tab]')) tab.classList.toggle('active', tab.dataset.tab === activeTab);
  for (const id of ['players', 'movements', 'settings']) $(id).classList.toggle('hidden', id !== activeTab);
});
for (const id of ['playerFilter', 'typeFilter', 'directionFilter', 'cityFilter']) $(id).addEventListener('input', renderMovements);
$('shareToggle').addEventListener('change', async event => {
  const sharing = event.target.checked;
  try { await api('/api/profile', { method: 'POST', body: JSON.stringify({ sharing }) }); $('settingsFeedback').textContent = sharing ? 'Compartilhamento ativado.' : 'Compartilhamento desativado.'; await refresh(); }
  catch (e) { event.target.checked = !sharing; $('settingsFeedback').textContent = e.message; }
});
setInterval(() => {
  if (!state) return;
  $('usersOnline').textContent = String(state.users.filter(u => u.online && Date.now() - u.lastSeen <= 45000).length);
  renderPlayers();
  if (activeTab === 'movements') renderMovements();
}, 1000);
if (token) login();
