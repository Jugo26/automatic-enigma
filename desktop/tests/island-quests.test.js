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
const town = (id, x = 40, wood = 4000) => ({
  id, name: 'Cidade ' + id, resources: () => ({wood, stone: 4500, iron: 5000}),
  getIslandCoordinateX: () => x, getIslandCoordinateY: () => 50
});
const quest = (id, progressableId, side, type, state, progress, options = {}) => ({
  id,
  attributes: {
    id, progressable_id: progressableId, state, progress,
    configuration: {island_x: options.x ?? 40, island_y: 50, town_id: 9800, ...options.configuration}
  },
  staticData: {type: 'island_quest', side, challenge_type: type, name: 'Missão ' + id},
  areRewardsStashable: () => options.stashable ?? true
});

function engine(rows, {towns = [town(10)], config = {}, responds} = {}) {
  const calls = [];
  const {quests, ...settings} = config;
  const storage = new Map([['grepopilot:config:' + scope, JSON.stringify({
    enabled: true, dryRun: false, modules: {quests: true}, intervals: {quests: 5},
    ...settings, quests: {autoObjectives: true, ...quests}
  })]]);
  let now = epoch;
  class Clock extends Date { static now() { return now; } }
  const window = {
    Game: {player_id: 1, townId: 10, constants: {island_quest: {reward: {reward_stash: 'stash', reward_use: 'use'}}}},
    ITowns: {towns: Object.fromEntries(towns.map(t => [t.id, t]))},
    MM: {getModels: () => ({}), getOnlyCollectionByName: key => ({models: key === 'IslandQuest' ? rows : []})},
    gpAjax: {ajaxPost(controller, name, args, _flag, callbacks) {
      calls.push(JSON.parse(JSON.stringify({controller, name, args})));
      if (responds) responds(callbacks);
      else callbacks.success(null, {success: 'Aceito'});
    }}
  };
  const boot = "  if(document.readyState==='loading')";
  assert.ok(source.includes(boot));
  const script = patchEngineSource(source).replace(boot, '  window.fixture = {tick, diagReason};\n' + boot);
  runInNewContext(script, {
    window, Date: Clock, location: {host: 'br123.grepolis.com'},
    localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
    document: {readyState: 'loading', addEventListener() {}, querySelector: () => null, querySelectorAll: () => []},
    console: {info() {}, error() {}}, setTimeout, clearTimeout
  });
  return {
    ...window.fixture, calls, api: window.__GREPOPILOT_DESKTOP_API__,
    jump: milliseconds => { now = epoch + milliseconds; },
    runtime: () => JSON.parse(storage.get('grepopilot:runtime:' + scope) || '{}')
  };
}

function payloads(f) {
  return f.calls.map(({controller, name, args}) => {
    assert.equal(controller, 'frontend_bridge');
    assert.equal(name, 'execute');
    assert.equal(args.model_url, 'IslandQuests');
    return [args.action_name, args.town_id, args.arguments];
  });
}

test('uma missão segue a opção preferida, inicia a espera e só resgata com satisfied', async () => {
  const good = quest(101, 'WaitingGood', 'good', 'wait_time', 'viable', {wait_till: null});
  const evil = quest(102, 'WaitingEvil', 'evil', 'bear_effect', 'viable', {wait_till: null});
  const f = engine([good, evil], {config: {quests: {preferred: 'aggressive'}}});
  await f.tick();
  assert.deepEqual(payloads(f), [['decide', 10, {decision: 'evil', progressable_name: 'WaitingEvil'}]]);

  evil.attributes.state = 'running';
  good.attributes.state = 'aborted';
  f.jump(46000);
  await f.tick();
  assert.deepEqual(payloads(f).at(-1), ['challenge', 10, {
    challenge: {current_town_id: true}, progressable_name: 'WaitingEvil'
  }]);

  evil.attributes.progress.wait_till = epoch / 1000 + 180;
  f.jump(94000);
  await f.tick();
  assert.equal(f.calls.length, 2);

  evil.attributes.state = 'satisfied';
  f.jump(180000);
  await f.tick();
  assert.deepEqual(payloads(f).at(-1), ['claimReward', 10, {
    reward_action: 'stash', state: 'closed', progressable_id: 'WaitingEvil'
  }]);
});

test('uma entrega cobra só o saldo restante quando o custo total está autorizado e cabe numa cidade da ilha', async () => {
  const q = quest(103, 'DonateGood', 'good', 'spend_resources', 'running', {resources: {wood: 100, stone: 200, iron: 50}}, {
    configuration: {resources: {wood: 1000, stone: 400, iron: 100}}
  });
  const f = engine([q], {towns: [town(10, 40, 99), town(11, 41), town(12)], config: {quests: {maxResourceCost: 1400}}});
  await f.tick();
  assert.equal(f.calls.length, 0);
  f.api.patch('quests.allowResourceCost', true);
  f.jump(6000);
  await f.tick();
  assert.equal(f.calls.length, 0);

  f.api.patch('quests.maxResourceCost', 1500);
  f.jump(12000);
  await f.tick();
  assert.deepEqual(payloads(f), [['challengeResources', 12, {
    challenge: {wood: 100, stone: 200, iron: 50}, progressable_name: 'DonateGood'
  }]]);
});

test('duas ocorrências homônimas resgatam separadamente após o intervalo e preservam o registro de ritmo', async () => {
  const rows = [
    quest(110, 'RepeatedGood', 'good', 'wait_time', 'satisfied', {wait_till: 0}, {stashable: false}),
    quest(111, 'RepeatedGood', 'good', 'wait_time', 'satisfied', {wait_till: 0}, {x: 41})
  ];
  const f = engine(rows, {towns: [town(10), town(11, 41)], config: {quests: {autoObjectives: false}}});
  await f.tick();
  assert.deepEqual(payloads(f), [['claimReward', 10, {reward_action: 'use', state: 'closed', progressable_id: 'RepeatedGood'}]]);
  assert.deepEqual(f.runtime().requestPacing?.attempts, [epoch]);

  f.jump(6000);
  await f.tick();
  assert.equal(f.calls.length, 1);
  f.jump(46000);
  await f.tick();
  assert.deepEqual(payloads(f).at(-1), ['claimReward', 11, {reward_action: 'stash', state: 'closed', progressable_id: 'RepeatedGood'}]);
  assert.deepEqual(f.runtime().requestPacing.attempts, [epoch, epoch + 46000]);
});

test('um resgate rejeitado preserva a recompensa e não repete a solicitação imediatamente', async () => {
  const q = quest(112, 'PendingGood', 'good', 'wait_time', 'satisfied', {wait_till: 0});
  const f = engine([q], {responds: callbacks => callbacks.error(null, {error: 'Resgate rejeitado'})});
  await f.tick();
  assert.equal(f.runtime().diagnostics.quests.lastState, 'error');
  assert.equal(f.runtime().questAttempts['112'], epoch);
  assert.equal(q.attributes.state, 'satisfied');

  f.jump(46000);
  await f.tick();
  assert.equal(f.calls.length, 1);
});

test('cidade fora da ilha, período já iniciado e custo de tropas exigindo escolha manual não disparam comandos', async () => {
  const rows = [
    quest(121, 'RemoteGood', 'good', 'wait_time', 'viable', {wait_till: null}, {x: 41}),
    quest(122, 'AlreadyWaitingGood', 'good', 'wait_time', 'running', {wait_till: epoch / 1000 + 120}),
    quest(123, 'ChargeGood', 'good', 'attack_npc', 'running', {units: {sword: 3}}),
    quest(124, 'RecruitGood', 'good', 'collect_units', 'viable', {count_units: 0})
  ];
  const f = engine(rows, {config: {quests: {allowTroopCost: true}}});
  await f.tick();
  assert.equal(f.calls.length, 0);
});

test('a simulação e o PC secundário preservam as missões e o registro de tentativas', async () => {
  for (const config of [{dryRun: true}, {sync: {role: 'standby'}}, {enabled: false}]) {
    const q = quest(131, 'DryGood', 'good', 'wait_time', 'satisfied', {wait_till: 0});
    const f = engine([q], {config});
    await f.tick();
    assert.equal(f.calls.length, 0);
    assert.equal(f.runtime().questAttempts, undefined);
  }
});
