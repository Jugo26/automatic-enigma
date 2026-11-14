// ==UserScript==
// @name         Grepolis — Aba Central Compartilhada
// @namespace    grepolis-shared-center
// @version      1.0.0
// @description  Abre o painel compartilhado dentro do Grepolis.
// @match        https://*.grepolis.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(() => {
  'use strict';
  if (document.getElementById('gsc-launcher')) return;
  const cfgKey = 'grepolis_shared_dashboard_url';
  const launcher = document.createElement('button');
  launcher.id = 'gsc-launcher';
  launcher.textContent = '♜ Compartilhado';
  launcher.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:2147483645;background:#ddbd81;color:#172033;border:1px solid #a88a56;border-radius:10px;padding:10px 16px;font-weight:800;cursor:pointer;box-shadow:0 6px 22px #0008;';
  const overlay = document.createElement('div');
  overlay.id = 'gsc-overlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:5vh 5vw;z-index:2147483646;background:#0b1321;border:1px solid #a88a56;border-radius:12px;box-shadow:0 20px 65px #000d;overflow:hidden;';
  const header = document.createElement('div');
  header.style.cssText = 'height:36px;background:#172436;display:flex;justify-content:space-between;align-items:center;color:#e7c788;padding:0 10px 0 18px;font:700 13px Arial;';
  const title = document.createElement('span'); title.textContent = 'Central Compartilhada';
  const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:8px;';
  const configure = document.createElement('button'); configure.textContent = 'Configurar URL';
  const close = document.createElement('button'); close.textContent = '✕';
  for (const btn of [configure, close]) btn.style.cssText = 'background:#334158;border:0;color:#fff;border-radius:5px;padding:5px 10px;cursor:pointer;';
  actions.append(configure, close); header.append(title, actions);
  const frame = document.createElement('iframe');
  frame.title = 'Painel compartilhado'; frame.referrerPolicy = 'no-referrer';
  frame.style.cssText = 'width:100%;height:calc(100% - 36px);border:0;background:#0b1321;';
  overlay.append(header, frame); document.body.append(launcher, overlay);
  function configureUrl() {
    const proposed = window.prompt('URL HTTPS da Central Compartilhada:', localStorage.getItem(cfgKey) || '');
    if (proposed === null) return false;
    let parsed;
    try { parsed = new URL(proposed); }
    catch { window.alert('URL inválida.'); return false; }
    if (parsed.protocol !== 'https:' && !(['localhost', '127.0.0.1'].includes(parsed.hostname) && parsed.protocol === 'http:')) {
      window.alert('Use HTTPS, exceto para testes locais no localhost.');
      return false;
    }
    localStorage.setItem(cfgKey, parsed.origin);
    frame.src = parsed.origin;
    return true;
  }
  configure.addEventListener('click', configureUrl);
  close.addEventListener('click', () => { overlay.style.display = 'none'; });
  launcher.addEventListener('click', () => {
    if (!localStorage.getItem(cfgKey) && !configureUrl()) return;
    if (!frame.src) frame.src = localStorage.getItem(cfgKey);
    overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
  });
})();
