'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {ANCHOR,patchEngineSource}=require('../src/engine-hooks');
const {EXPRESSION}=require('../src/game-state');
const src=fs.readFileSync(require('node:path').join(__dirname,'..','src','renderer.js'),'utf8');
test('preserva motor e injeta API sem carregar a interface antiga',()=>{
 const original=`// GrepoPilot\n(() => {\n let config={};\n ${ANCHOR}\n host.style.cssText='position:fixed;z-index:2147483000;top:90px;right:20px';\n try{mount();contextualStart();}catch(e){}\n})();`;
 const result=patchEngineSource(original);
 assert.match(result,/__GREPOPILOT_DESKTOP_API__/);
 assert.match(result,/applyTemplate/);
 assert.match(result,/host.style.cssText='display:none!important'/);
 assert.match(result,/try\{mount\(\);\}/);
 assert.doesNotMatch(result,/try\{mount\(\);contextualStart\(\);\}/);
 assert.doesNotThrow(()=>new Function(result));
});
test('não altera motor incompatível',()=>{
 assert.throws(()=>patchEngineSource('GrepoPilot sem âncora'),/ponto de integração/);
});
test('captura sprites reais por classe e mantém posição de spritesheet',()=>{
 assert.match(EXPRESSION,/unit_icon40x40/);
 assert.match(EXPRESSION,/research40x40/);
 assert.match(EXPRESSION,/backgroundPosition/);
 assert.doesNotThrow(()=>new Function('return '+EXPRESSION));
});
test('telas incluem imagens de edifícios, unidades, pesquisas e ações',()=>{
 for(const name of ['Quartel','Porto','Academia','Senado','Modelos','Aldeias','Esquiva','Diagnóstico'])assert.ok(src.includes(name),name);
 assert.match(src,/gpnl\.innogamescdn\.com\/images\/game\/main/);
 assert.match(src,/function portrait/);
 assert.match(src,/data-research/);
 assert.match(src,/data-building/);
 assert.match(src,/data-unit/);
});

test('abre portal brasileiro e exibe fallback de navegacao',()=>{
 const main=fs.readFileSync(require('node:path').join(__dirname,'..','src','main.js'),'utf8');
 assert.match(main,/const START_URL='https:\/\/br-play\.grepolis\.com\/';/);
 assert.match(main,/did-fail-load/);
 assert.doesNotMatch(main,/const START_URL='https:\/\/www\.grepolis\.com\/';/);
});
test('scripts do Windows usam call e preservam diagnostico',()=>{
 const root=require('node:path').join(__dirname,'..');
 const build=fs.readFileSync(require('node:path').join(root,'CRIAR-INSTALADOR-WINDOWS.bat'),'utf8');
 const start=fs.readFileSync(require('node:path').join(root,'INICIAR-WINDOWS.bat'),'utf8');
 assert.match(build,/call npm\.cmd install/);
 assert.match(build,/call npm\.cmd run check/);
 assert.match(build,/call npm\.cmd run dist/);
 assert.match(build,/instalador\.log/);
 assert.match(build,/pause/);
 assert.match(start,/call npm\.cmd start/);
});


test('a esquiva na HUD configura aliados, destino e mostra bloqueios',()=>{
  assert.match(src,/function dodgePage\(\)/);
  assert.match(src,/dodge\.destinationMode/);
  assert.match(src,/data-dodge-target/);
  assert.match(src,/start-dodge/);
  assert.match(src,/configurações pausadas|Esquiva não está operacional/);
  assert.match(EXPRESSION,/recruitPlan:api\.recruitPlan\(\)/);
});
