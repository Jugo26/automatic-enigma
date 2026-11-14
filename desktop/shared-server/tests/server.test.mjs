import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';

const admin = 'a'.repeat(40);
let app, base, temp;
async function request(path, { token, body, adminKey, method = 'GET', origin } = {}) {
  const res = await fetch(`${base}${path}`, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(adminKey ? { 'X-Admin-Key': adminKey } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(origin ? { Origin: origin } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, data: await res.json() };
}
const createUser = (world, playerId, name) => request('/admin/users', {
  method: 'POST', adminKey: admin, body: { world, playerId, name }
});

test('cadastro, isolamento por mundo, consentimento, snapshot e autenticação', async () => {
  temp = mkdtempSync(join(tmpdir(), 'grepolis-share-'));
  app = createApp({ port: 0, adminKey: admin, dataFile: join(temp, 'data.json') });
  const addr = await app.listen(); base = `http://127.0.0.1:${addr.port}`;
  try {
    assert.equal((await request('/health')).status, 200);
    const peer = await createUser('br10', '42', 'Athena');
    assert.equal(peer.status, 201);
    const userA = (await createUser('br10', '43', 'Zeus')).data;
    const userB = (await createUser('br11', '42', 'Poseidon')).data;
    assert.equal((await createUser('br10', '43', 'Repetido')).status, 409);
    assert.equal((await request('/api/state')).status, 401);
    assert.equal((await request('/admin/users', { method: 'POST', body: { world: 'br10', playerId: '90', name: 'Intruso' }, adminKey: 'x' })).status, 401);
    assert.equal((await request('/api/state', { token: userA.token, origin: 'https://adversario.example' })).status, 403);
    const move = { id: 'cmd_001', type: 'attack', direction: 'outgoing', status: 'traveling',
      origin: { id: 1, name: 'Atenas' }, destination: { id: 2, name: 'Esparta' },
      arriveAt: '2027-01-01T12:00:00Z', units: { sword: 100 }, resources: {} };
    const movements = [move, { ...move, id: 'support', type: 'support' },
      { ...move, id: 'trade', type: 'trade', units: {}, resources: { wood: 500 } },
      { ...move, id: 'colony', type: 'colonization', units: { colonize_ship: 1 } }];
    const sync = (token, world, playerId, collection = movements) => request('/api/sync', {
      method: 'POST', token, body: { world, playerId, movements: collection }
    });
    assert.equal((await sync(userA.token, 'br11', '43')).status, 403);
    assert.equal((await sync(userA.token, 'br10', '42')).status, 403);
    const synced = await sync(userA.token, 'br10', '43');
    assert.equal(synced.status, 200); assert.equal(synced.data.accepted, 4);
    let a = (await request('/api/state', { token: userA.token })).data;
    let b = (await request('/api/state', { token: userB.token })).data;
    assert.equal(a.users.length, 2); assert.equal(a.movements.length, 0); // Privado por padrão
    assert.equal(b.users.length, 1); assert.equal(b.movements.length, 0); // Mundos não se misturam
    await request('/api/profile', { method: 'POST', token: userA.token, body: { sharing: true } });
    a = (await request('/api/state', { token: peer.data.token })).data;
    b = (await request('/api/state', { token: userB.token })).data;
    assert.deepEqual(a.movements.map(m => m.type), ['attack', 'support', 'trade', 'colonization']);
    assert.ok(a.movements.every(m => m.playerId === '43'));
    assert.equal(a.movements[0].units.sword, 100);
    assert.equal(a.movements[2].resources.wood, 500);
    assert.equal(b.movements.length, 0);
    assert.equal(a.users.find(u => u.playerId === '43').online, true);
    await sync(peer.data.token, 'br10', '42', []);
    await request('/api/profile', { method: 'POST', token: userA.token, body: { sharing: false } });
    a = (await request('/api/state', { token: peer.data.token })).data;
    assert.equal(a.movements.length, 0);
    assert.equal(a.users.find(u => u.playerId === '42').online, true);
    await request('/api/profile', { method: 'POST', token: userA.token, body: { sharing: true } });
    await request('/api/sync', { method: 'POST', token: userA.token, body: { movements: [] } });
    a = (await request('/api/state', { token: peer.data.token })).data;
    assert.equal(a.movements.length, 0);
  } finally { await app.close(); rmSync(temp, { recursive: true, force: true }); }
});

test('cabeçalhos de origem própria permitem uso do painel', async () => {
  temp = mkdtempSync(join(tmpdir(), 'grepolis-share-'));
  app = createApp({ port: 0, adminKey: admin, dataFile: join(temp, 'data.json') });
  const addr = await app.listen(); base = `http://127.0.0.1:${addr.port}`;
  try {
    const result = await request('/admin/users', {
      method: 'POST', adminKey: admin, origin: base,
      body: { world: 'br21', playerId: '55', name: 'Hades' }
    });
    assert.equal(result.status, 201);
  } finally { await app.close(); rmSync(temp, { recursive: true, force: true }); }
});
