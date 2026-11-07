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

## GrepoPilot 0.5.0 — Esquiva com cálculo de ida e volta

A nova aba **ESQUIVA** permite habilitar a saída automática de tropas quando um ataque estiver entre **5 e 1 segundos** do impacto (5 segundos por padrão). A leitura dos horários usa `MovementsUnits` e o relógio do servidor (`Timestamp.server()`) quando disponível.

**Cálculo (tempos em milissegundos):**
- `S`: instante real do envio do apoio (lido de `started_at` quando disponível);
- `A`: horário da última chegada dentro da janela de ataques próximos;
- `R`: atraso desejado para o retorno (padrão 1000 ms);
- **cancelar em `C = (S + A + R) / 2`**, pois `retorno_estimado = C + (C - S) = 2C - S`.

Exemplo: apoio enviado 5 s antes do ataque, retorno desejado 1 s depois: cancelar 3 s após o envio. Cada grupo de unidades usa seu próprio `started_at`; tropas terrestres e navios são enviados e cancelados separadamente, se disponíveis.

A automação seleciona por padrão **outra cidade própria da mesma ilha**, evitando a necessidade de transportes para unidades terrestres. A aba permite escolher um destino específico da mesma ilha. Sem outra cidade própria na mesma ilha, o bot registra a impossibilidade e não envia o apoio. Os apoios já em andamento são registrados numa chave local por mundo e sobrevivem a recarregamentos e à pausa do módulo; o cancelamento só atua sobre os comandos identificados como enviados pelo próprio bot, evitando cancelar apoios manuais.

Se um novo ataque da mesma onda for identificado a tempo, o horário de cancelamento é recalculado considerando a última chegada, até o limite de 10 minutos de cancelamento permitido pelo jogo. Quando a identificação do comando ou o cálculo não forem confirmados, o bot exibe um aviso em vez de cancelar comandos não reconhecidos.

**Limitações:** a precisão de 1 segundo é uma meta matemática e pode falhar por latência, temporizadores de abas em segundo plano, diferença de relógio e atualização tardia do servidor. É necessário testar com o cliente real antes de confiar na automação, especialmente contra múltiplas ondas e cidades com apenas uma cidade própria na ilha.

Fontes:
- https://support.innogames.com/kb/Grepolis/pt_BR/3347
- https://support.innogames.com/kb/Grepolis/en_DK/3344
- https://github.com/NotXina/MultBot/blob/main/Modules/auto_dodge.js

O arquivo de atualização automática (GrepoPilot.meta.js) é publicado **depois** do script completo.
