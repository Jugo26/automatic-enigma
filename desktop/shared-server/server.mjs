import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TYPE = new Set(['attack', 'support', 'trade', 'return', 'colonization', 'spy', 'other']);
const DIRECTION = new Set(['incoming', 'outgoing', 'internal']);
const STATUS = new Set(['traveling', 'arrived', 'returning', 'canceled', 'unknown']);
const MAX_BODY = 350_000;
const MAX_MOVEMENTS = 400;
const MAX_USERS = 300;
const ONLINE_MS = 45_000;
const HISTORY_MS = 48 * 60 * 60 * 1000;

const sha = value => createHash('sha256').update(value).digest('hex');
const safeCompare = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const safeText = (value, limit = 100) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const validId = value => typeof value === 'string' && /^[a-z0-9_-]{1,80}$/i.test(value);
const validTime = value => {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
};
const numbers = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 50)
    .filter(([key, count]) => /^[a-z0-9_-]{1,45}$/i.test(key) && Number.isInteger(count) && count >= 0 && count <= 1_000_000_000));
};
const city = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const id = String(value.id ?? '').slice(0, 50);
  const name = safeText(value.name, 100);
  return id || name ? { id, name } : null;
};
function normalizeMovement(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m) || !validId(String(m.id ?? ''))) return null;
  return {
    id: String(m.id), type: TYPE.has(m.type) ? m.type : 'other',
    direction: DIRECTION.has(m.direction) ? m.direction : 'outgoing',
    status: STATUS.has(m.status) ? m.status : 'unknown',
    origin: city(m.origin), destination: city(m.destination),
    departAt: validTime(m.departAt), arriveAt: validTime(m.arriveAt),
    units: numbers(m.units), resources: numbers(m.resources),
    note: safeText(m.note, 120)
  };
}
function send(res, code, data, extra = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(JSON.stringify(data));
}
async function bodyJson(req) {
  let size = 0; const parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) { const err = new Error('corpo muito grande'); err.status = 413; throw err; }
    parts.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { const err = new Error('JSON inválido'); err.status = 400; throw err; }
}
function load(file) {
  if (!existsSync(file)) return { users: [], movements: {} };
  const s = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(s.users) || typeof s.movements !== 'object') throw new Error('arquivo de dados inválido');
  return s;
}

export function createApp({ host = '127.0.0.1', port = 8787, adminKey, dataFile = join(ROOT, 'data', 'state.json'), origins = [] } = {}) {
  if (!adminKey || adminKey.length < 20) throw new Error('defina ADMIN_KEY com pelo menos 20 caracteres');
  const file = resolve(dataFile);
  const db = load(file);
  const clients = new Set();
  let closing = false;
  function save() {
    mkdirSync(dirname(file), { recursive: true });
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify(db));
    renameSync(temp, file);
  }
  function getUser(req) {
    const match = /^Bearer ([A-Za-z0-9_-]{20,200})$/.exec(req.headers.authorization ?? '');
    const hash = match ? sha(match[1]) : '';
    return db.users.find(u => safeCompare(u.tokenHash, hash)) ?? null;
  }
  function stateFor(user) {
    const peers = db.users.filter(u => u.world === user.world);
    const users = peers.map(u => ({ id: u.id, playerId: u.playerId, name: u.name,
      alliance: u.alliance, online: !!u.lastSeen && Date.now() - u.lastSeen <= ONLINE_MS,
      lastSeen: u.lastSeen ?? null, sharing: !!u.sharing }));
    const movements = peers.flatMap(u => u.sharing ? (db.movements[u.id] ?? []).map(m => ({
      ...m, playerId: u.playerId, playerName: u.name, ownerId: u.id
    })) : []);
    movements.sort((a, b) => (a.arriveAt ?? '').localeCompare(b.arriveAt ?? ''));
    return { world: user.world, selfId: user.id, users, movements, serverTime: new Date().toISOString() };
  }
  function notifyWorld(world) {
    for (const client of clients) if (client.user.world === world) {
      try { client.res.write('event: changed\ndata: {}\n\n'); }
      catch { clients.delete(client); }
    }
  }
  const pingInterval = setInterval(() => {
    for (const client of clients) {
      try { client.res.write(': ping\n\n'); }
      catch { clients.delete(client); }
    }
  }, 25_000);
  pingInterval.unref();

  const server = createServer(async (req, res) => {
    try {
      const origin = req.headers.origin;
      const headers = {};
      if (origin) {
        if (!origins.includes(origin) && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) return send(res, 403, { error: 'origem não autorizada' });
        headers['Access-Control-Allow-Origin'] = origin;
        headers.Vary = 'Origin';
        headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Admin-Key';
        headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      }
      for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/health' && req.method === 'GET') return send(res, 200, { ok: true });
      if (pathname === '/admin/users' && req.method === 'POST') {
        if (!safeCompare(req.headers['x-admin-key'] ?? '', adminKey)) return send(res, 401, { error: 'chave administrativa inválida' });
        const b = await bodyJson(req);
        if (!validId(b?.world) || !validId(b.playerId) || !safeText(b.name)) return send(res, 400, { error: 'world, playerId e name obrigatórios' });
        if (db.users.length >= MAX_USERS) return send(res, 409, { error: 'limite de jogadores atingido' });
        if (db.users.some(u => u.world === b.world && u.playerId === b.playerId)) return send(res, 409, { error: 'jogador já cadastrado no mundo' });
        const token = randomBytes(32).toString('base64url');
        const u = { id: randomBytes(12).toString('hex'), world: b.world, playerId: b.playerId,
          name: safeText(b.name, 80), alliance: safeText(b.alliance, 80), tokenHash: sha(token),
          sharing: false, lastSeen: null, createdAt: Date.now() };
        db.users.push(u); save(); notifyWorld(u.world);
        return send(res, 201, { token, id: u.id, world: u.world, name: u.name });
      }
      if (pathname.startsWith('/api/')) {
        const u = getUser(req);
        if (!u) return send(res, 401, { error: 'token inválido' });
        if (pathname === '/api/state' && req.method === 'GET') return send(res, 200, stateFor(u));
        if (pathname === '/api/stream' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
          res.write('retry: 3000\nevent: changed\ndata: {}\n\n');
          const c = { user: u, res }; clients.add(c);
          res.once('close', () => clients.delete(c));
          return;
        }
        if (pathname === '/api/profile' && req.method === 'POST') {
          const b = await bodyJson(req);
          if (typeof b?.sharing !== 'boolean') return send(res, 400, { error: 'sharing deve ser booleano' });
          u.sharing = b.sharing; save(); notifyWorld(u.world);
          return send(res, 200, { sharing: u.sharing });
        }
        if (pathname === '/api/sync' && req.method === 'POST') {
          const b = await bodyJson(req);
          if (!b || !Array.isArray(b.movements) || b.movements.length > MAX_MOVEMENTS)
            return send(res, 400, { error: 'movements deve ser lista de até 400 itens' });
          if (('world' in b || 'playerId' in b) && (b.world !== u.world || b.playerId !== u.playerId))
            return send(res, 403, { error: 'Token pertence a outro mundo ou jogador' });
          const unique = new Map();
          for (const item of b.movements) {
            const m = normalizeMovement(item);
            if (m) unique.set(m.id, { ...m, observedAt: new Date().toISOString() });
          }
          // A coleta do cliente envia sempre um retrato de TODAS as cidades do jogador.
          // Comandos ausentes são removidos do conjunto ativo, sem supor cancelamento.
          db.movements[u.id] = [...unique.values()];
          u.lastSeen = Date.now();
          if (typeof b.alliance === 'string') u.alliance = safeText(b.alliance, 80);
          save(); notifyWorld(u.world);
          return send(res, 200, { ok: true, accepted: unique.size, sharing: u.sharing });
        }
        return send(res, 404, { error: 'rota desconhecida' });
      }
      if (req.method !== 'GET') return send(res, 405, { error: 'método não permitido' });
      const files = { '/': 'index.html', '/app.js': 'app.js', '/app.css': 'app.css' };
      const name = files[pathname];
      if (!name) return send(res, 404, { error: 'não encontrado' });
      const path = join(ROOT, 'public', name);
      const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[extname(path)];
      res.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8`, 'Cache-Control': 'no-cache' });
      res.end(readFileSync(path));
    } catch (err) {
      if (!res.headersSent) send(res, err.status ?? 500, { error: err.status ? err.message : 'erro interno' });
      else res.end();
      if (!err.status) console.error(err);
    }
  });
  return {
    server,
    listen: () => new Promise(resolveListening => server.listen(port, host, () => resolveListening(server.address()))),
    close: async () => {
      if (closing) return;
      closing = true;
      clearInterval(pingInterval);
      for (const c of clients) c.res.end();
      clients.clear();
      await new Promise((resolveClose, reject) => server.close(err => err ? reject(err) : resolveClose()));
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp({
    host: process.env.HOST || '127.0.0.1',
    port: Number(process.env.PORT || 8787),
    adminKey: process.env.ADMIN_KEY,
    dataFile: process.env.DATA_FILE || join(ROOT, 'data', 'state.json'),
    origins: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  });
  app.listen().then(address => console.log(`Central Grepolis: http://${address.address}:${address.port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.close().then(() => process.exit(0)));
}
