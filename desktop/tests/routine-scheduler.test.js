'use strict';

const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const test = require('node:test');
const {runInNewContext} = require('node:vm');
const {patchEngineSource} = require('../src/engine-hooks');

const source = readFileSync(join(__dirname, '../../GrepoPilot.user.js'), 'utf8');
const epoch = 1_800_000_000_000;
const scope = 'br123.grepolis.com:1';
const configKey = 'grepopilot:config:' + scope;
const runtimeKey = 'grepopilot:runtime:' + scope;

function engine({config, storage = new Map(), camp, reply} = {}) {
  const calls = [];
  if (config) storage.set(configKey, JSON.stringify(config));
  let now = epoch;
  class Clock extends Date { static now() { return now; } }
  const window = {
    Game: {player_id: 1, townId: 10},
    ITowns: {towns: {}},
    MM: {
      getModels: () => ({}), getOnlyCollectionByName: () => ({models: []}),
      getModelByNameAndPlayerId: name => name === 'PlayerAttackSpot' ? camp : undefined
    },
    gpAjax: {ajaxPost(controller, name, args, _flag, callbacks) {
      calls.push({controller, name, args, now});
      if (reply) reply({controller, name, args, callbacks});
      else callbacks.success(null, {success: 'Aceito'});
    }}
  };
  const boot = "  if(document.readyState==='loading')";
  assert.ok(source.includes(boot));
  const script = patchEngineSource(source).replace(boot,
    '  window.fixture = {tick, action, handlers, setQueuePlan: callback => {queueCandidates = callback;}};\n' + boot);
  runInNewContext(script, {
    window, Date: Clock, location: {host: 'br123.grepolis.com'},
    localStorage: {
      getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)
    },
    document: {readyState: 'loading', addEventListener() {}, querySelector: () => null, querySelectorAll: () => []},
    console: {info() {}, error() {}}, setTimeout, clearTimeout
  });
  const fixture = window.fixture;
  return {
    ...fixture, window, calls, storage, api: window.__GREPOPILOT_DESKTOP_API__,
    runAt: async ms => { now = epoch + ms; await fixture.tick(); },
    runtime: () => JSON.parse(storage.get(runtimeKey) || '{}'),
    async send(id) {
      await fixture.action('frontend_bridge', 'execute', {action_name: id});
      return true;
    }
  };
}

test('os perfis existentes recebem intervalos padrão mais curtos e preservam ajustes personalizados', () => {
  const f = engine({config: {intervals: {build: 55, recruit: 47, quests: 20, dodge: 0.125}}});
  assert.equal(f.api.snapshot().intervals.build, 5);
  assert.equal(f.api.snapshot().intervals.recruit, 47);
  assert.equal(f.api.snapshot().intervals.quests, 5);
  assert.equal(f.api.snapshot().intervals.dodge, 0.125);
  f.api.patch('intervals.build', 55);
  assert.equal(engine({storage: f.storage}).api.snapshot().intervals.build, 55);
});

test('uma construção pronta após a primeira checagem não espera os 55 segundos antigos', async () => {
  let ready = false, checks = 0;
  const f = engine({config: {enabled: true, dryRun: false, modules: {build: true}, intervals: {build: 55}}});
  f.handlers.build = () => { checks++; return ready ? f.send('build') : false; };
  await f.runAt(0);
  ready = true;
  await f.runAt(4999);
  assert.equal(checks, 1);
  await f.runAt(5000);
  assert.equal(checks, 2);
  assert.deepEqual(f.calls.map(({args}) => args.action_name), ['build']);
});

test('o rodízio atende rotinas continuamente prontas sem alterar o intervalo mínimo de envio', async () => {
  const f = engine({config: {enabled: true, dryRun: false, modules: {build: true, recruit: true, quests: true}}});
  for (const id of ['quests', 'build', 'recruit']) f.handlers[id] = () => f.send(id);
  for (const ms of [0, 1000, 44999, 45000, 89999, 90000, 135000]) await f.runAt(ms);
  assert.deepEqual(f.calls.map(({args, now}) => [args.action_name, now - epoch]), [
    ['quests', 0], ['build', 45000], ['recruit', 90000], ['quests', 135000]
  ]);
});

test('comandos e alertas continuam prioritários quando o ritmo bloqueia as rotinas', async () => {
  const f = engine({config: {enabled: true, dryRun: false, modules: {commands: true, alerts: true, build: true}}});
  const checks = [];
  f.handlers.commands = () => { checks.push('commands'); return false; };
  f.handlers.alerts = () => { checks.push('alerts'); return false; };
  f.handlers.build = () => { checks.push('build'); return f.send('build'); };
  await f.runAt(0);
  assert.deepEqual(checks, ['commands', 'alerts', 'build']);
  await f.runAt(8000);
  assert.deepEqual(checks.slice(3), ['commands', 'alerts']);
  assert.equal(f.calls.length, 1);
});

test('o resgate de bandidos conserva tanto a tentativa quanto o ritmo global', async () => {
  const camp = {hasReward: () => true, getReward: () => ({stashable: true})};
  const f = engine({camp, config: {enabled: true, dryRun: false, modules: {banditRewards: true, build: true}}});
  f.handlers.build = () => f.send('build');
  await f.runAt(0);
  assert.equal(f.runtime().lastBanditRewardAt, epoch);
  assert.deepEqual(f.runtime().requestPacing?.attempts, [epoch]);
  await f.runAt(5000);
  assert.equal(f.calls.length, 1);
  await f.runAt(45000);
  assert.deepEqual(f.calls.map(({args}) => args.action_name), ['stashReward', 'build']);
});

test('a fila inteligente conserva a pausa adaptativa após uma rejeição do servidor', async () => {
  const job = {id: 'house', kind: 'building', townId: 10, key: 'main'};
  const f = engine({
    config: {enabled: true, dryRun: false, modules: {smartQueue: true, build: true}, smartQueue: {items: [job]}},
    reply: ({callbacks}) => callbacks.error(null, {error: 'Too many requests'})
  });
  f.setQueuePlan(() => ({ready: [{job}]}));
  f.handlers.build = () => f.send('build');
  await f.runAt(0);
  assert.equal(f.runtime().smartQueueAttempts.house, epoch);
  assert.equal(f.runtime().requestPacing?.cooldownUntil, epoch + 45 * 60000);
  await f.runAt(75000);
  assert.equal(f.calls.length, 1);
});

test('os ciclos continuam pausados por conta secundária e em simulação não enviam requisições', async () => {
  for (const config of [{enabled: false}, {sync: {role: 'standby'}}, {dryRun: true}]) {
    const f = engine({config: {enabled: true, dryRun: false, modules: {build: true}, ...config}});
    f.handlers.build = () => f.send('build');
    await f.runAt(0);
    assert.equal(f.calls.length, 0);
    assert.equal(f.runtime().requestPacing, undefined);
  }
});
