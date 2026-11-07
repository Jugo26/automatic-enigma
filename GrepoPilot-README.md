# GrepoPilot — atualização automática
Script: [GrepoPilot.user.js](./GrepoPilot.user.js)

## Instalação
Abra o link bruto do script no Chrome/Edge com o Tampermonkey instalado:
https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.user.js

## Atualizações
O Tampermonkey verifica [GrepoPilot.meta.js](./GrepoPilot.meta.js) e instala uma versão mais nova de [GrepoPilot.user.js](./GrepoPilot.user.js) quando o campo `@version` aumenta. Mantenha ambos na mesma versão. Publique **primeiro** o arquivo completo e **por último** o meta para evitar baixar uma versão ainda não publicada.

- Não altere `@name` e `@namespace`.
- Publique versões futuras sempre nesta ramificação `grepopilot-updates`.
- Configurações por mundo/jogador ficam em `localStorage` e são preservadas.
- Quem instalou até a v0.3.0 sem `@updateURL` precisa atualizar manualmente uma última vez.
- Script automatizado não está na lista oficial de scripts aprovados do Grepolis.

Documentação: https://www.tampermonkey.net/documentation.php?locale=pt_BR
