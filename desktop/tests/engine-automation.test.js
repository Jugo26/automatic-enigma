'use strict';

const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const {patchEngineSource} = require('../src/engine-hooks');

const source = readFileSync(join(__dirname, '../../GrepoPilot.user.js'), 'utf8');
const epoch = 1_800_000_000_000;
const scope = 'br123.grepolis.com:1';

function engine({towns = [], townModels = {}, spies = {}, movement = {}, config = {}, gameData = {}, order} = {}) {
  const calls = [];
  const storage = new Map([['grepopilot:config:' + scope, JSON.stringify(config)]]);
  let now = epoch;
  class Clock extends Date { static now() { return now; } }
  const window = {
    Game: {player_id: 1, townId: 10, game_speed: 1},
    GameData: {units: {colonize_ship: {speed: 3, is_naval: true}, siren: {speed: 22, is_naval: true}, sword: {speed: 16}}, ...gameData},
    ITowns: {towns: Object.fromEntries(towns.map(t => [t.id, t]))},
    MM: {
      getModels: () => ({Town: townModels, MovementsSpy: spies, MovementsUnits: movement}),
      getOnlyCollectionByName: () => ({models: []})
    },
    gpAjax: {ajaxPost(controller, name, args, flag, callbacks) {
      calls.push(JSON.parse(JSON.stringify({controller, name, args})));
      const ok = (result = {success: 'Aceito'}) => {
        if (typeof callbacks === 'function') callbacks(result);
        else callbacks.success(null, result);
      };
      if (order) order({controller, name, args, ok, callbacks, now});
      else ok();
    }}
  };
  const boot = "  if(document.readyState==='loading')";
  assert.ok(source.includes(boot));
  const script = patchEngineSource(source).replace(boot, '\n' +
    '  window.fixture = {tick, cave, dodgeTiming, dodgeAttackDecision, dodgeAttackIntel, dodgePulse, dodgeRead, ' +
    'testStart, testTick, testRead, diagReason, dodgeLead, dodgeAfter, dodgeWaveGap, changed};\n' + boot);
  runInNewContext(script, {
    window, Date: Clock, location: {host: 'br123.grepolis.com'},
    localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
    document: {readyState: 'loading', addEventListener() {}, querySelector: () => null, querySelectorAll: () => []},
    fetch: async () => ({ok: false}), console: {info() {}, error() {}}, setTimeout, clearTimeout
  });
  return {api: window.__GREPOPILOT_DESKTOP_API__, ...window.fixture, calls,
    jump: milliseconds => {now = epoch + milliseconds;}};
}

const town = (id, iron = 8000, cave = 10) => ({
  id, name: 'Cidade ' + id, buildings: () => ({attributes: {hide: cave}}),
  resources: () => ({iron, storage: 12000}),
  getIslandCoordinateX: () => 40, getIslandCoordinateY: () => 50,
  units: () => ({sword: 30})
});

test('a Gruta deposita o que cabe, desconta prata do espião e preserva a reserva antiga', async () => {
  const f = engine({
    towns: [town(10, 12000, 3)],
    townModels: {10: {getHideStorageCapacity: () => 3000, getEspionageStorage: () => 1500}},
    spies: {1: {attributes: {home_town_id: 10, payed_iron: 500}}},
    config: {enabled: true, dryRun: false, modules: {cave: true}, cave: {minIron: 15000, keepIron: 5000}}
  });
  await f.tick();
  assert.deepEqual(f.calls, [{
    controller: 'frontend_bridge', name: 'execute',
    args: {town_id: 10, model_url: 'BuildingHide', action_name: 'storeIron', arguments: {iron_to_store: 1000}}
  }]);
});

test('a Gruta cheia ou sem saldo conhecido não recebe comandos e explica a espera', async () => {
  const f = engine({
    towns: [town(10, 12000, 3), town(11, 12000, 3)],
    townModels: {10: {getHideStorageCapacity: () => 3000, getEspionageStorage: () => 3000}},
    config: {enabled: true, dryRun: false, modules: {cave: true}, cave: {minIron: 0, keepIron: 5000}}
  });
  await f.tick();
  assert.equal(f.calls.length, 0);
  assert.match(f.diagReason('cave'), /Gruta cheia/i);
});

test('a prévia e o motor calculam retorno um segundo depois da última onda', () => {
  const f = engine({towns: [town(10)], config: {dodge: {leadSeconds: 60, returnAfterSeconds: 15}}});
  const plan = f.dodgeTiming(epoch, epoch + 61000);
  assert.equal(plan.returnAtMs, epoch + 62000);
  assert.equal(plan.cancelAtMs, epoch + 31000);
  f.testStart(10, 'preview', 120, 8);
  f.jump(129000);
  f.testTick();
  const a = f.testRead().active;
  assert.equal(a.cancelledMs, epoch + 94500);
  assert.equal(a.returnMs, epoch + 129000);
  assert.equal(f.calls.length, 0);
});

test('só evidência de colono aciona defesa e a opção de esquivar é respeitada', () => {
  const f = engine({config: {dodge: {colonizationPolicy: 'review'}}});
  for (const classification of ['unknown', 'revolt', 'suspected', 'manual_normal'])
    assert.equal(f.dodgeAttackDecision({intel: {classification}}).allow, true, classification);
  for (const classification of ['confirmed', 'manual_colony'])
    assert.equal(f.dodgeAttackDecision({intel: {classification}}).allow, false, classification);
  f.api.patch('dodge.colonizationPolicy', 'all');
  assert.equal(f.dodgeAttackDecision({intel: {classification: 'confirmed'}}).allow, true);
});

test('sereias, Navegar, Cartografia, Farol, Atalanta e poderes usam a fórmula do cliente', () => {
  const f = engine();
  const duration = 900 + Math.floor(9000 / (1.35 * ((1 + 0.30) * 1.36 + 0.15) * 1.4));
  const intel = f.dodgeAttackIntel({
    type: 'attack', started_at: epoch / 1000, colony_ship_base_duration_seconds: 9900,
    researches: ['cartography', 'set_sail'], buildings: {lighthouse: 1},
    hero: {type: 'atalanta', level: 20}, units: {siren: 20},
    effects: [
      {id: 'unit_movement_boost', configuration: {percent: 30}},
      {id: 'unit_movement_boost_alliance', configuration: {type: 'all', percent: 15}},
      {id: 'cap_of_invisibility'}, {id: 'fair_wind'}
    ]
  }, {}, 10, 99, epoch + duration * 1000, 'colonization-model');
  const expected = intel.travel.matches.find(m => m.seconds === duration &&
    m.effects.some(x => /Sereias.*40%/.test(x)) && m.effects.some(x => /Atalanta.*20/.test(x)));
  assert.ok(expected, JSON.stringify(intel.travel.matches));
  assert.equal(intel.travel.hiddenFraction, 0.1);
  assert.equal(intel.classification, 'suspected');
});

test('tempo restante e aparição tardia não viram prova de partida ou de colono', () => {
  const f = engine();
  const intel = f.dodgeAttackIntel({
    type: 'attack', colony_ship_base_duration_seconds: 3600,
    powers: ['cap_of_invisibility']
  }, {}, 10, 99, epoch + 900000, 'seen-late');
  assert.equal(intel.travel.observedSeconds, null);
  assert.equal(intel.travel.visibleLowerBoundSeconds, 1000);
  assert.equal(intel.classification, 'unknown');
});

test('o Desktop persiste valores editáveis e restaura o valor anterior se o campo ficar vazio', async () => {
  const renderer = readFileSync(join(__dirname, '../src/renderer.js'), 'utf8');
  const values = {};
  const handlers = {};
  const nodes = new Map();
  const document = {
    addEventListener: (name, fn) => {handlers[name] = fn;},
    getElementById: id => {
      if (!nodes.has(id)) nodes.set(id, {style: {}, addEventListener() {}, classList: {add() {}, remove() {}}});
      return nodes.get(id);
    }
  };
  const api = {
    onLocation() {}, onEngine() {}, onShared() {}, onUpdate() {},
    appInfo: async () => ({version: '0.2.6'}), sharedConfig: async () => ({configured: false}),
    getState: async () => ({ready: false}), patch: async (key, value) => {values[key] = value;}
  };
  runInNewContext(renderer, {window: {gpDesktop: api}, document, setInterval() {}, setTimeout() {}, clearTimeout() {}});
  const change = (key, value, validity = {}) => {
    const target = {
      dataset: {number: key}, value, valueAsNumber: value === '' ? NaN : Number(value),
      defaultValue: '60', validity, matches: () => false, reportValidity() {}
    };
    return handlers.change({target}).then(() => target);
  };
  const blank = await change('dodge.leadSeconds', '');
  assert.equal(blank.value, '60');
  await change('dodge.leadSeconds', '10', {rangeUnderflow: true});
  assert.deepEqual(values, {});
  await change('dodge.leadSeconds', '67');
  await change('dodge.waveGapSeconds', '18');
  assert.deepEqual(values, {'dodge.leadSeconds': 67, 'dodge.waveGapSeconds': 18});
});

test('o apoio real simulado usa a partida do servidor, cancela antes da onda e registra a volta informada', async () => {
  const at = n => (epoch + n) / 1000;
  const attack = (id, arrival, type = 'attack') => ({id, attributes: {
    id, type, home_town_id: 99, target_town_id: 10, arrival_at: at(arrival)
  }});
  const movement = {100: attack(100, 60000), 101: attack(101, 68000, 'attack_takeover'), 102: attack(102, 70000)};
  let cancelled = 0;
  const f = engine({
    towns: [town(10), town(11)], movement,
    config: {enabled: true, dryRun: false, modules: {dodge: true}, dodge: {colonizationPolicy: 'all'}},
    order({controller, args, ok, now}) {
      if (controller === 'town_info') {
        movement[200] = {id: 200, attributes: {type: 'support', home_town_id: 10,
          target_town_id: args.id, started_at: at(1000), arrival_at: at(400000), cancelable_until: at(600000)}};
        ok({data: {command_id: 200}});
      } else {
        cancelled = now;
        movement[200] = {id: 200, attributes: {type: 'support', home_town_id: 10,
          target_town_id: 10, arrival_at: at(69000)}};
        ok();
      }
    }
  });
  await f.dodgePulse();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].controller, 'town_info');
  f.jump(34999); await f.dodgePulse();
  assert.equal(f.calls.length, 1);
  f.jump(35000); await f.dodgePulse();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].controller, 'command_info');
  assert.equal(cancelled, epoch + 35000);
  const job = Object.values(f.dodgeRead().jobs)[0];
  assert.equal(job.returnAtMs, epoch + 69000);
  assert.equal(job.confirmedReturnAtMs, epoch + 69000);
});

test('a política de defesa preserva a guarnição e chama um apoio em viagem quando surge colono', async () => {
  const at = n => (epoch + n) / 1000;
  const attack = {id: 100, attributes: {type: 'attack_takeover', home_town_id: 99, target_town_id: 10, arrival_at: at(60000)}};
  const movement = {100: attack};
  const f = engine({
    towns: [town(10), town(11)], movement,
    config: {enabled: true, dryRun: false, modules: {dodge: true}},
    order({controller, args, ok}) {
      if (controller === 'town_info'){
        movement[200] = {id: 200, attributes: {type: 'support', home_town_id: 10,
          target_town_id: args.id, started_at: at(1000), arrival_at: at(400000)}};
        ok({command_id: 200});
      } else ok();
    }
  });
  await f.dodgePulse();
  assert.equal(f.calls.length, 0);
  attack.attributes.type = 'attack';
  await f.dodgePulse();
  assert.equal(f.calls.length, 1);
  attack.attributes.type = 'attack_takeover';
  f.jump(2000); await f.dodgePulse();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].name, 'cancel_command');
});

test('o Desktop salva a duração-base por trajeto e permite marcar o colono na conta', () => {
  const movement = {100: {id: 100, attributes: {type: 'attack', home_town_id: 99,
    target_town_id: 10, started_at: epoch / 1000, arrival_at: epoch / 1000 + 3600}}};
  const f = engine({towns: [town(10)], movement});
  assert.equal(f.api.dodgeInfo(10).incoming[0].travel.available, false);
  assert.throws(() => f.api.setColonyBaseline('100', NaN), /duração-base/);
  f.api.setColonyBaseline('100', 60);
  const row = f.api.dodgeInfo(10).incoming[0];
  assert.equal(row.baselineMinutes, 60);
  assert.equal(row.travel.baseSeconds, 3600);
  assert.equal(row.classification, 'suspected');
  f.api.markDodgeAttack('100', 'colony');
  assert.equal(f.api.dodgeInfo(10).incoming[0].allow, false);
  f.api.markDodgeAttack('100', 'clear');
  assert.equal(f.api.dodgeInfo(10).incoming[0].allow, true);
});

test('a Gruta registra a rejeição enviada pelo jogo sem contar o depósito como executado', async () => {
  const f = engine({
    towns: [town(10)],
    config: {enabled: true, dryRun: false, modules: {cave: true}},
    order({callbacks}) {callbacks.error(null, {error: 'Espionagem em andamento'});}
  });
  await f.tick();
  assert.equal(f.calls.length, 1);
  assert.equal(f.api.caveInfo().lastError, 'Espionagem em andamento');
});
