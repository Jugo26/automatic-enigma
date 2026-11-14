/**
 * Cliente de sincronização para o bot Grepolis.
 * collectMovements() deve retornar o snapshot de todas as cidades do jogador.
 * Não se deve publicar somente a cidade selecionada.
 */
export function startSharedBridge({ serverUrl, token, collectMovements, getAlliance = () => undefined, intervalMs = 15000, onError = console.error }) {
  if (!/^https?:\/\//.test(serverUrl)) throw new Error('serverUrl deve iniciar com http:// ou https://');
  if (!token || typeof collectMovements !== 'function') throw new Error('token e collectMovements são obrigatórios');
  let alive = true, running = false;
  async function sync() {
    if (!alive || running) return;
    running = true;
    try {
      const movements = await collectMovements();
      if (!Array.isArray(movements)) throw new TypeError('collectMovements deve retornar um array');
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ movements, alliance: await getAlliance() })
      });
      if (!response.ok) throw new Error(`sincronização recusada (HTTP ${response.status}): ${await response.text()}`);
      return await response.json();
    } catch (error) { onError(error); }
    finally { running = false; }
  }
  const timer = setInterval(sync, intervalMs);
  sync();
  return { sync, stop: () => { alive = false; clearInterval(timer); } };
}

/** Monta a aba do painel dentro do contêiner fornecido pelo bot. */
export function mountSharedTab(container, dashboardUrl) {
  if (!container || !/^https?:\/\//.test(dashboardUrl)) throw new Error('contêiner e dashboardUrl válidos são obrigatórios');
  const frame = document.createElement('iframe');
  frame.src = dashboardUrl;
  frame.title = 'Central Compartilhada do Grepolis';
  frame.style.cssText = 'width:100%;height:75vh;min-height:500px;border:0;border-radius:12px;background:#0b1321;';
  frame.referrerPolicy = 'no-referrer';
  container.replaceChildren(frame);
  return frame;
}
