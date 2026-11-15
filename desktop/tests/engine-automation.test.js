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

function engine({towns = [], townModels = {}, spies = {}, movement = {}, buildData = {}, config = {}, gameData = {}, order, collections = {}, movementRuntime} = {}) {
  const calls = [];
  const storage = new Map([['grepopilot:config:' + scope, JSON.stringify(config)]]);
  let now = epoch;
  class Clock extends Date { static now() { return now; } }
  const window = {
    require: name => name === 'helpers/runtime' ? movementRuntime : undefined,
    Game: {player_id: 1, townId: 10, game_speed: 1},
    GameData: {units: {colonize_ship: {speed: 3, is_naval: true}, siren: {speed: 22, is_naval: true}, sword: {speed: 16}}, ...gameData},
    ITowns: {towns: Object.fromEntries(towns.map(t => [t.id, t]))},
    MM: {
      getModels: () => ({Town: townModels, MovementsSpy: spies, MovementsUnits: movement, BuildingBuildData: buildData}),
      getOnlyCollectionByName: name => ({models: collections[name] || []})
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
    changePlayer: id => {window.Game.player_id = id;},
    jump: milliseconds => {now = epoch + milliseconds;}};
}

const town = (id, iron = 8000, cave = 10) => ({
  id, name: 'Cidade ' + id, buildings: () => ({attributes: {hide: cave}}),
  resources: () => ({iron, storage: 12000}),
  getIslandCoordinateX: () => 40, getIslandCoordinateY: () => 50,
  units: () => ({sword: 30})
});

const construction = (levels, orders = [], population = 200) => ({
  ...town(10), buildings: () => ({attributes: levels}), buildingOrders: () => ({models: orders}),
  resources: () => ({wood: 20000, stone: 20000, iron: 20000, storage: 20000}),
  getAvailablePopulation: () => population,
});
const workOrder = (building_time, wood, extra = {}) => ({
  building_time, resources_for: {wood, stone: 50, iron: 50}, population_for: 1, ...extra
});
const projectData = building_data => ({10: {attributes: {building_data}}});

test('a construção escolhe o menor prazo e depois o menor custo entre obras que cabem na fila', async () => {
  const orders = [{attributes: {building_type: 'main'}}];
  const f = engine({
    towns: [construction({main: 12, storage: 6, farm: 10, lumber: 8, stoner: 8}, orders)],
    buildData: projectData({
      main: workOrder(10, 25), storage: workOrder(600, 100),
      farm: workOrder(60, 30, {can_upgrade: false}),
      lumber: workOrder(80, 180), stoner: workOrder(80, 100),
    }),
    config: {enabled: true, dryRun: false, modules: {build: true},
      build: {targets: {10: {main: 15, storage: 9, farm: 12, lumber: 10, stoner: 10}}}}
  });
  await f.tick();
  assert.equal(f.calls[0].args.arguments.building_id, 'stoner');
});

test('o modelo Colonização prioriza pré-requisitos, pesquisa e navio antes das outras metas', async () => {
  const levels = {main: 13, storage: 15, farm: 18, lumber: 25, academy: 12, docks: 9, barracks: 8, wall: 3};
  const techs = {}, dockOrders = [];
  const t = {...construction(levels), researches: () => ({attributes: techs}),
    getAvailableResearchPoints: () => 10, getUnitOrdersCollection: () => ({models: dockOrders})};
  const f = engine({
    towns: [t],
    buildData: projectData({main: workOrder(55, 300), lumber: workOrder(30, 75),
      academy: workOrder(120, 600), docks: workOrder(20, 45), wall: workOrder(10, 30)}),
    gameData: {buildings: {docks: {dependencies: {main: 14}}},
      researches: {colonize_ship: {building_dependencies: {academy: 13}, resources: {wood: 1000}, research_points: 1},
        attack_ship: {resources: {wood: 100}}},
      units: {colonize_ship: {is_naval: true, building_dependencies: {docks: 10},
        research_dependencies: ['colonize_ship'], resources: {wood: 10000, iron: 10000, stone: 10000}, population: 170},
        attack_ship: {is_naval: true, resources: {wood: 500, iron: 500}, population: 8}}},
    config: {enabled: true, dryRun: false, modules: {build: true, recruit: true, research: true}}
  });
  f.api.applyTemplate('city', 'colony', 10);
  await f.tick();
  assert.equal(f.calls.at(-1).args.arguments.building_id, 'main');
  levels.main = 14;
  f.jump(60000);
  await f.tick();
  assert.equal(f.calls.at(-1).args.arguments.building_id, 'docks');
  levels.docks = 10;
  f.jump(120000);
  await f.tick();
  assert.equal(f.calls.at(-1).args.arguments.building_id, 'academy');
  levels.academy = 13;
  f.jump(180000);
  await f.tick();
  assert.equal(f.calls.at(-1).args.arguments.id, 'colonize_ship');
  techs.colonize_ship = true;
  f.jump(240000);
  await f.tick();
  assert.equal(f.calls.at(-1).args.unit_id, 'colonize_ship');
  dockOrders.push({attributes: {unit_type: 'colonize_ship', units_left: 1}});
  f.jump(300000);
  await f.tick();
  assert.equal(f.calls.at(-1).args.arguments.id, 'attack_ship');
  techs.attack_ship = true;
  f.jump(360000);
  await f.tick();
  assert.equal(f.calls.at(-1).args.arguments.building_id, 'wall');
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

function attackSequence(gap, count) {
  return Object.fromEntries(Array.from({length: count}, (_, index) => {
    const id = 1000 + index;
    return [id, {id, attributes: {type: 'attack', home_town_id: 99, target_town_id: 10,
      arrival_at: (epoch + 60000 + index * gap) / 1000}}];
  }));
}

function dodgeSequenceFixture(movement, waveGapSeconds, extra = {}) {
  const {supportMs = 400000, ...dodge} = extra;
  return engine({
    towns: [town(10), town(11)], movement,
    config: {enabled: true, dryRun: false, modules: {dodge: true}, dodge: {waveGapSeconds, ...dodge}},
    order({controller, args, ok}) {
      if (controller === 'town_info') {
        movement[200] = {id: 200, attributes: {type: 'support', home_town_id: 10,
          target_town_id: args.id, started_at: (epoch + 1000) / 1000,
          arrival_at: (epoch + supportMs) / 1000}};
        ok({command_id: 200});
      } else ok();
    }
  });
}

test('cem ataques separados por até cinco segundos prolongam um único apoio, inclusive após o primeiro sair da leitura', async () => {
  for (const gap of [1000, 5000]) {
    const all = attackSequence(gap, 100);
    const movement = Object.fromEntries(Object.entries(all).slice(0, 80));
    const f = dodgeSequenceFixture(movement, gap / 1000);
    await f.dodgePulse();
    assert.equal(f.calls.length, 1);
    const returnAt = 60000 + 99 * gap + 1000;
    const cancelAt = (1000 + returnAt) / 2;
    Object.assign(movement, all);
    movement[1100] = {id: 1100, attributes: {...all[1099].attributes, arrival_at: (epoch + returnAt + gap) / 1000}};
    if (gap === 5000) {
      f.jump(125000);
      await f.dodgePulse();
      assert.equal(Object.values(f.dodgeRead().jobs)[0].returnAtMs, epoch + returnAt);
    }
    f.jump(cancelAt - 1);
    await f.dodgePulse();
    assert.equal(f.calls.length, 1);
    assert.equal(Object.values(f.dodgeRead().jobs)[0].returnAtMs, epoch + returnAt);
    f.jump(cancelAt);
    await f.dodgePulse();
    assert.equal(f.calls.length, 2);
    assert.equal(f.calls[1].name, 'cancel_command');
    assert.equal(Object.values(f.dodgeRead().jobs)[0].estimatedArrivalMs, epoch + returnAt);
  }
});

test('defender colono permite sair antes da sequência e retornar entre o ataque anterior e o colono', async () => {
  for (const confirmedBeforeDispatch of [true, false]) {
    const movement = attackSequence(5000, 4);
    if (confirmedBeforeDispatch) movement[1003].attributes.type = 'attack_takeover';
    const f = dodgeSequenceFixture(movement, 5);
    await f.dodgePulse();
    assert.equal(f.calls.length, 1);
    movement[1003].attributes.type = 'attack_takeover';
    f.jump(37499);
    await f.dodgePulse();
    assert.equal(f.calls.length, 1);
    assert.equal(Object.values(f.dodgeRead().jobs)[0].returnAtMs, epoch + 74000);
    f.jump(37500);
    await f.dodgePulse();
    assert.equal(f.calls[1].name, 'cancel_command');
  }
});

test('defender colono mantém as tropas na cidade se o impacto anterior estiver a um segundo', async () => {
  const movement = attackSequence(1000, 4);
  movement[1003].attributes.type = 'attack_takeover';
  const f = dodgeSequenceFixture(movement, 5);
  await f.dodgePulse();
  assert.deepEqual(f.calls, []);
});

test('uma sequência longa escolhe a rota com duração suficiente que o cliente consegue calcular', async () => {
  const point = (id, x) => ({...town(id), getAbsX: () => x, getAbsY: () => 300});
  const f = engine({
    towns: [point(10, 300), point(11, 302), point(12, 320)],
    movement: attackSequence(5000, 100),
    config: {enabled: true, dryRun: false, modules: {dodge: true}, dodge: {waveGapSeconds: 5, targets: {10: 11}}},
    movementRuntime: {
      getSetupTimeByType: () => 200,
      getRelevantUnitsForSlowestRuntime: units => units,
      getUnitSpeedsWithBonus: () => ({sword: 10}),
      getUnitRuntimes: (_units, distance) => ({sword: distance * 5}),
      getSlowestRuntimeFromSet: (_units, time, setup) => setup + time.sword
    }
  });
  await f.dodgePulse();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].args.id, 12);
});

test('uma confirmação de apoio que chega após troca de conta fica isolada no perfil de origem', async () => {
  let respond;
  const f = engine({
    towns: [town(10), town(11)], movement: attackSequence(5000, 2),
    config: {enabled: true, dryRun: false, modules: {dodge: true}},
    order({ok}) { respond = ok; }
  });
  const inFlight = f.dodgePulse();
  assert.equal(f.calls.length, 1);
  f.changePlayer(2);
  await f.tick();
  respond({command_id: 200});
  await inFlight;
  assert.deepEqual(Object.keys(f.dodgeRead()), []);
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

const tutorialQuest = ({id, pid, state = 'running', progress = false, townId, rewards = []}) => ({
  getGroupId: () => 'quest',
  getState: () => state,
  getId: () => id,
  getProgressableId: () => pid,
  getSummary: () => pid,
  getConfiguration: key => key === 'town_id' ? townId : undefined,
  get() {},
  getTasks: () => [{}],
  getProgressForTaskId: () => progress,
  getRewardsWithResourcesOrFavor: () => rewards
});

const tutorialTown = (id = 10, level = 2, stock = 1000) => ({
  ...town(id),
  resources: () => ({wood: stock, stone: stock, iron: stock, storage: 12000, population: 100}),
  buildings: () => ({attributes: {main: level, barracks: 3, academy: 1}}),
  units: () => ({}),
  getAvailablePopulation: () => 100
});

test('tutorial resgata as recompensas satisfeitas em ciclos separados, sem repetir nem tocar nas missões de ilha', async () => {
  const rows = [
    tutorialQuest({id: 5, pid: 'BuildMainLevel3', progress: true}),
    tutorialQuest({id: 6, pid: 'DoneClosed', state: 'closed'}),
    tutorialQuest({id: 7, pid: 'CompletedA', state: 'satisfied'}),
    tutorialQuest({id: 8, pid: 'CompletedB', state: 'satisfied'})
  ];
  const f = engine({
    towns: [tutorialTown()],
    collections: {Progressable: rows, IslandQuest: [{attributes: {state: 'satisfied', progressable_id: 9}}]},
    config: {enabled: true, dryRun: false, modules: {tutorial: true}}
  });
  assert.equal(f.api.snapshot().modules.quests, false);
  await f.tick();
  f.jump(45000);
  await f.tick();
  assert.deepEqual(f.calls, [
    {controller: 'frontend_bridge', name: 'execute', args: {
      town_id: 10, model_url: 'Progressable/7', action_name: 'progressTo',
      arguments: {progressable_id: 'CompletedA', state: 'closed'}, captcha: null
    }},
    {controller: 'frontend_bridge', name: 'execute', args: {
      town_id: 10, model_url: 'Progressable/8', action_name: 'progressTo',
      arguments: {progressable_id: 'CompletedB', state: 'closed'}, captcha: null
    }}
  ]);
});

test('tutorial preserva recompensas que excedem a capacidade e ignora uma cidade que não é do jogador', async () => {
  const rows = [
    tutorialQuest({id: 1, pid: 'RewardOverflow', state: 'satisfied', rewards: [{type: 'resources', data: {wood: 2}}]}),
    tutorialQuest({id: 2, pid: 'WrongTown', state: 'satisfied', townId: 99})
  ];
  const f = engine({
    towns: [tutorialTown(10, 1, 11999)],
    collections: {Progressable: rows},
    config: {enabled: true, dryRun: false, modules: {tutorial: true}}
  });
  await f.tick();
  assert.equal(f.calls.length, 0);
  assert.match(f.api.tutorialInfo().rows[0].reason, /espaço no armazém/);
  assert.match(f.api.tutorialInfo().rows[1].reason, /cidade.*indisponível/i);
});

test('tutorial usa o nível indicado pelo jogo, com a opção desligada por padrão e sem alterar metas de construção', async () => {
  const f = engine({
    towns: [tutorialTown()],
    collections: {Progressable: [tutorialQuest({
      id: 12, pid: 'BuildMainLevel3', progress: {curr: 2, max: 3}
    })]},
    buildData: {10: {attributes: {building_data: {main: {
      can_upgrade: true, resources_for: {wood: 200, stone: 100, iron: 50}, population_for: 1
    }}}}},
    gameData: {buildings: {main: {max_level: 25}}},
    config: {enabled: true, dryRun: false}
  });
  assert.equal(f.api.snapshot().modules.tutorial, false);
  await f.tick();
  assert.equal(f.calls.length, 0);
  f.api.patch('modules.tutorial', true);
  await f.tick();
  assert.deepEqual(f.calls, [{controller: 'frontend_bridge', name: 'execute', args: {
    town_id: 10, model_url: 'BuildingOrder', action_name: 'buildUp',
    arguments: {building_id: 'main', build_for_gold: false}, captcha: null
  }}]);
  assert.equal(f.api.snapshot().modules.build, false);
  assert.deepEqual(JSON.parse(JSON.stringify(f.api.snapshot().build.targets)), {});
});

test('tutorial respeita pausa, modo secundário e simulação e só arma cooldown quando envia', async () => {
  const f = engine({
    towns: [tutorialTown()],
    collections: {Progressable: [tutorialQuest({id: 3, pid: 'UnknownReward', state: 'satisfied'})]},
    config: {enabled: false, dryRun: true, modules: {tutorial: true}, sync: {role: 'standby'}}
  });
  await f.tick();
  f.api.patch('enabled', true);
  await f.tick();
  f.api.patch('sync.role', 'primary');
  await f.tick();
  assert.equal(f.calls.length, 0);
  f.jump(20000);
  f.api.patch('dryRun', false);
  await f.tick();
  assert.equal(f.calls.length, 1);
});

test('tutorial limita a automação de objetivos ao progresso reconhecido pelo cliente', async () => {
  const rows = [
    tutorialQuest({id: 21, pid: 'PremiumCommanderQuest'}),
    tutorialQuest({id: 22, pid: 'RecruitSwordsmanQuest', progress: {curr: 0, max: 3}})
  ];
  const f = engine({
    towns: [tutorialTown()],
    collections: {Progressable: rows},
    gameData: {units: {sword: {resources: {wood: 20, stone: 20, iron: 20}, population: 1}}},
    config: {enabled: true, dryRun: false, modules: {tutorial: true}}
  });
  await f.tick();
  assert.deepEqual(f.calls, [{controller: 'building_barracks', name: 'build', args: {
    town_id: 10, unit_id: 'sword', amount: 3
  }}]);
  assert.match(f.api.tutorialInfo().rows[0].reason, /ação no jogo/);
  assert.equal(f.api.snapshot().modules.recruit, false);
});

test('tutorial pesquisa a tecnologia identificada com a opção independente e aguarda uma ordem existente', async () => {
  const orders = [], city = tutorialTown();
  city.getResearchOrdersCollection = () => ({models: orders});
  const f = engine({
    towns: [city],
    collections: {Progressable: [tutorialQuest({id: 31, pid: 'ResearchSlingerQuest'})]},
    gameData: {researches: {slinger: {building_dependencies: {academy: 1}, resources: {wood: 100}}}},
    config: {enabled: true, dryRun: false, modules: {tutorial: true}}
  });
  await f.tick();
  orders.push({attributes: {research_type: 'slinger'}});
  f.jump(90000);
  await f.tick();
  assert.deepEqual(f.calls, [{controller: 'frontend_bridge', name: 'execute', args: {
    town_id: 10, model_url: 'ResearchOrder', action_name: 'research',
    arguments: {id: 'slinger'}, captcha: null
  }}]);
  assert.match(f.api.tutorialInfo().rows[0].reason, /pesquisa em andamento/i);
  assert.equal(f.api.snapshot().modules.research, false);
});
