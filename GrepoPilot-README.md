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

## GrepoPilot 0.3.2

Ataques automáticos ao acampamento de bandidos usam **todas as tropas terrestres presentes na cidade de origem**, inclusive defesa e unidades míticas disponíveis. Navios e milícia ficam fora. As antigas opções de reserva e limite mínimo não afetam mais essa ação. Mantenha a aba COMBATE configurada com a cidade de origem.

## GrepoPilot 0.4.0 — Fila inteligente econômica

Na aba **FILA**, ative **Fila inteligente: menor custo** (ao adicionar uma meta ela é ativada automaticamente) e cadastre tarefas por cidade:

- **Construção**: informe o edifício e o nível desejado. Cada nível é programado separadamente conforme os custos reais disponíveis no cliente.
- **Tropas terrestres**: informe a unidade e a quantidade total desejada na cidade.
- **Navios**: informe o tipo de navio e a quantidade total desejada.
- **Pesquisa**: escolha a pesquisa; ela é marcada como concluída quando o jogo confirmar que foi pesquisada.

O planejador inspeciona todas as tarefas cadastradas (em todas as cidades) e prioriza o **menor custo total de madeira + pedra + ferro da próxima ordem executável**. Empates seguem a ordem de cadastro. Ele respeita população disponível, recursos, capacidade de filas, pesquisas já concluídas e unidades/obras já em andamento. Tarefas bloqueadas são ignoradas temporariamente, mas permanecem visíveis com o motivo.

Use **Importar metas da cidade** para aproveitar as metas atuais de construções, tropas, navios e pesquisas da aba **Cidades/Tropas**. Na cidade que tem itens na fila inteligente ativa, os módulos antigos de construção/recrutamento/pesquisa não executam tarefas paralelas; nas demais cidades continuam funcionando.

O modo simulação registra as ações sem enviá-las. Os custos são calculados a partir dos dados que o Grepolis expõe no navegador e podem mudar durante a execução. Toda ação é reavaliada antes do envio. Se o jogo não informar o custo, o item fica em "Verificar", sem receber prioridade artificial de custo zero. Pesquisas e requisitos específicos do mundo ainda exigem validação em servidor real.

Atualização automática: `GrepoPilot.meta.js` será atualizado apenas após a publicação do `GrepoPilot.user.js` completo.
