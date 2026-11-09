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

## GrepoPilot 0.5.1 — recrutamento por lotes padronizados

Os módulos **Recrutamento** (aba TROPAS) e **Fila Inteligente** (aba FILA) usam a mesma política de lotes.

| Tipo | Lote ideal (padrão) | Lote mínimo (padrão) |
| --- | ---: | ---: |
| Tropas terrestres | 35 | 10 |
| Navios | 8 | 3 |
| Criaturas míticas | 2 | 2 |

Máximo padrão: **2 espaços simultâneos por tipo de fila e cidade**. O bot considera tropas já na cidade, fora dela, e unidades já enfileiradas; só recruta o que falta para as metas.

A quantidade efetiva é calculada pelos recursos, pela população disponível, pelo custo modificado da unidade e, para criaturas míticas, pelo favor divino conhecido. Exemplo: recursos para 22 soldados permitem lote de 20, sem encher o slot com uma ordem de 1.

**Quando não há recursos para o lote mínimo, o bot aguarda.** Quando faltam menos unidades do que o mínimo para terminar a meta, só conclui a sobra após a fila correspondente ficar livre. Se o armazém não comportar fisicamente o lote padrão, o limite é adaptado ao armazenamento. Cada envio bem-sucedido aplica um intervalo de 25 segundos na mesma cidade/tipo para aguardar a atualização do jogo e evitar pedidos duplicados.

Na aba **TROPAS** é possível ajustar lote ideal e mínimo terrestre, naval e mítico, além do número máximo de espaços. Na aba **FILA** o campo `smartQueue.maxBatch` funciona como teto adicional por ordem; as demais regras permanecem as mesmas.

Os testes locais confirmaram que o módulo não recruta unidades isoladas repetidamente quando faltam recursos e não ultrapassa o limite de espaços configurado. Ainda é necessária a confirmação em mundo real do Grepolis para o tratamento dos pedidos do servidor.

Para liberar a atualização no Tampermonkey, atualizar `GrepoPilot.meta.js` **depois** do arquivo `GrepoPilot.user.js`.

## GrepoPilot 0.6.0 — Aba TESTE: ataque simulado

Use a aba **TESTE** para verificar o funcionamento da esquiva sem esperar um ataque de outro jogador.

1. Selecione a **cidade atacada**.
2. Defina a chegada fictícia entre **8 e 180 segundos** no futuro (padrão: 20 segundos).
3. Opcionalmente simule uma segunda onda 3, 5 ou 10 segundos depois da primeira.
4. Selecione o modo e clique **Iniciar simulação**:
   - **Só cálculo**: nenhum ataque nem apoio é enviado para o jogo; o painel mostra a saída, cancelamento, retorno simulado e o desvio em relação à meta.
   - **Teste real**: cria apenas a chegada virtual, mas **envia apoio real** para uma segunda cidade própria da mesma ilha e usa o cancelamento real do Grepolis. Exige uma confirmação específica no painel. Este modo é independente dos outros módulos e do modo global de simulação.
5. Acompanhe o resultado no próprio painel e no log. O relatório indica quando as tropas teriam sido enviadas/canceladas e a diferença entre o retorno **estimado** e a meta de 1 segundo após o último impacto (ou outro valor escolhido na aba ESQUIVA).

O botão **Interromper teste** interrompe a chegada fictícia. Se houver apoio real enviado pelo teste, o cancelamento continua sendo tratado pelo sistema mesmo depois de pausar outros módulos ou recarregar a página. Para testes reais, é necessário ter duas cidades próprias na mesma ilha e tropas disponíveis; testes são bloqueados quando há um ataque verdadeiro próximo ou esquiva pendente na cidade selecionada.

A simulação não cria ataques reais no Grepolis nem altera as coleções `MovementsUnits` do jogo; os eventos artificiais são adicionados apenas à leitura interna do GrepoPilot. No teste real, os movimentos de apoio e cancelamento aparecem normalmente no jogo. Um retorno exato de 1 segundo não é garantido por conta da latência de rede, precisão do relógio e temporizadores de segundo plano.

Testes locais executados: preview sem chamadas de rede; envio/cancelamento terrestre e naval com bot global em pausa; segunda onda; interrupção com recolhimento de apoio; validação da cidade de destino. O servidor real ainda não foi testado.

O arquivo `GrepoPilot.meta.js` deve avançar de versão apenas depois da publicação do script completo.

## GrepoPilot 0.7.0 — Fila econômica inteligente

A aba **FILA** agora oferece dois modos:

- **Inteligente · custo e benefício (padrão)**: compara o custo em madeira/pedra/ferro com a **urgência por tarefa** (normal, alta ou urgente), benefício para a cidade e quantidade de metas desbloqueadas. O sistema calcula um índice heurístico; **menor índice executa primeiro**.
- **Clássico · menor custo**: mantém o comportamento anterior de escolher exclusivamente a ordem mais barata entre as executáveis. Ignora pesos de urgência e pré-requisitos automáticos.

Quando o modo inteligente está ativo e a opção **Completar pré-requisitos necessários** está marcada, o bot pode criar ordens *temporárias e não persistidas na lista* de **armazém, fazenda, academia, quartel ou porto** para desbloquear metas existentes. Exemplos: aumentar a capacidade de armazenamento quando uma meta não cabe no armazém; elevar a academia para permitir uma pesquisa; elevar a fazenda por falta de população; construir quartel/porto necessário. Também lê dependências de nível explicitamente expostas pelo cliente em `requirements` ou `required_buildings`, sem presumir tecnologias ocultas. Uma melhoria já em andamento não é duplicada. Limites conhecidos de nível máximo são respeitados.

O recrutamento compartilhado com a aba TROPAS não reduz o lote mínimo apenas porque o armazém não suporta o lote: ele aguarda recursos/capacidade e deixa a fila escolher outra atividade. Uma sobra final abaixo do mínimo pode ser concluída quando a fila estiver vazia.

**Configuração por meta:** ao adicionar uma construção, tropa, navio ou pesquisa, escolha urgência Normal, Alta ou Urgente. Depois, altere a urgência diretamente na lista. Alterações são salvas por mundo/jogador, junto com as metas antigas. Uma meta importada preserva a urgência existente.

**Critérios do índice (heurísticos, não números do Grepolis):** custo total dividido por um fator de prioridade baseado em urgência, quantidade de metas liberadas e valor contextual de armazém/fazenda/produção. Se uma tarefa não tiver custo confiável ou estiver bloqueada, fica em espera. Se uma ação falhar, mantém o controle anterior de tentativas e registro de erro.

**Limitações:** o cliente pode não expor todos os pré-requisitos, pontos de pesquisa e modificadores de custo; o bot não adivinha dados ausentes. A prioridade inteligente não garante a rota matematicamente ótima de crescimento. Confirmação com dados de um mundo real do Grepolis ainda pendente.

Testes locais aprovados: urgência estratégica, modo clássico, pesquisa e construção com academia insuficiente, disparo de melhoria, proteção contra edifícios no limite máximo, armazenamento insuficiente para lote mínimo, controles da interface e inibição de pré-requisitos automáticos quando desativados.

O arquivo `GrepoPilot.meta.js` será atualizado somente após a publicação do script completo.

## GrepoPilot 0.7.1 — Pausa do auto farm por armazém cheio

**Por cidade**, o auto farm pausa a coleta quando **madeira, pedra e ferro atingem todos 100% da capacidade de armazenamento**. Se **qualquer um** dos três cair abaixo da capacidade, a cidade fica novamente elegível para coleta no **próximo ciclo configurado** do módulo, sujeito à disponibilidade da aldeia. Outras cidades com espaço livre continuam sendo coletadas normalmente.

O comportamento vale tanto para as coletas individuais das aldeias quanto para a **coleta em massa do Capitão**. Se todas as cidades elegíveis estiverem com os três recursos cheios, nenhuma solicitação de coleta é enviada ao jogo.

A aba **ECONOMIA** apresenta, por cidade, o estado **Pausada / Pronta / Capacidade indisponível** e os valores de madeira, pedra e ferro em relação ao armazenamento. As transições de pausa e retomada são registradas uma vez no log, evitando mensagens repetidas. Quando o jogo não fornece capacidade válida, o script aguarda os dados em vez de tentar coleta indevida.

A antiga configuração `farm.minStorageFree` deixa de influenciar o auto farm; configurações antigas podem manter o campo no JSON sem alterar essa regra.

Testes simulados concluídos: pausa com 3/3 cheios, coleta seletiva com cidade parcial, retorno ao liberar um único recurso, coleta em massa somente nas cidades com espaço, ausência de solicitações quando todas estão cheias e compatibilidade com configurações antigas. Sem validação em servidor de jogo real.

## GrepoPilot 0.8.1 — Remoção do monitor de presença

Removida por solicitação do usuário a aba **PRESENÇA**, incluindo leitura de jogadores ON/OFF, classificação de cidades, cadastro de monitoramento, filtros e atualização periódica.

Os módulos anteriores permanecem: **Auto Farm** com pausa quando todos os três recursos estão cheios, **Fila Econômica Inteligente**, recrutamento em lotes, esquiva e teste de esquiva, entre outras funcionalidades já publicadas.

As preferências antigas do monitor são descartadas quando a nova versão carrega a configuração. Se a aba PRESENÇA estava aberta, o painel volta à aba INÍCIO. Versão incrementada para **0.8.1** para receber atualização automática no Tampermonkey.

## GrepoPilot v0.9.0 — Comércio inteligente, perfis entre PCs e diagnóstico automático

### 1. Comércio inteligente (ECONOMIA)

Na aba **ECONOMIA**, marque **Distribuir automaticamente para cidades com metas bloqueadas por recursos** e ative o módulo **Comércio entre cidades** (o painel também o ativa ao marcar a opção).

- Detecta necessidade de madeira, pedra e ferro para a **próxima construção**, **pesquisa** ou **lote mínimo de recrutamento** de cada cidade com metas definidas na FILA ou nas abas de construção/tropas.
- Procura cidade fornecedora com recursos disponíveis, sem ultrapassar o limite de capacidade dos comerciantes, a capacidade do armazém de destino ou a fração de enchimento configurada.
- Respeita **reserva mínima na origem** (padrão: 2.500 de cada recurso) e protege os custos das metas próprias da cidade fornecedora.
- Só envia se a carga total atingir o mínimo configurado (padrão: 200), com intervalo mínimo entre cidades (padrão: 5 minutos).
- Contabiliza **entregas pendentes** em uma janela de tempo (padrão: 15 minutos) para não repetir o envio enquanto o recurso ainda viaja. O cálculo é local e conservador; sem confirmação de chegada no cliente não é uma garantia de estado final.
- **Rotas manuais existentes têm prioridade** e continuam disponíveis. Se não houver transferência inteligente necessária e viável, não envia comando.
- O comércio inteligente está **desativado por padrão** em instalações antigas; ative-o quando quiser. O modo simulação continua sem executar o envio.

### 2. Perfil entre PCs (AJUSTES)

**AJUSTES → Perfil entre computadores** permite **Copiar perfil**, **Baixar perfil .json**, **Importar código neste PC** ou **Importar arquivo .json**.

- No PC antigo, copie o perfil ou salve o arquivo.
- No PC novo, abra a **mesma conta e mundo** e importe o código ou arquivo.
- Importa metas, módulos, rotas e preferências. **A importação pausa a execução e força o papel Secundário**, mesmo que o perfil original estivesse ativo.
- Para mudar qual PC executa as ações, **pause o PC anterior** e selecione **Principal** no novo, iniciando a automação conscientemente.
- **Sem serviço em nuvem configurado, esta transferência é manual, não sincronização contínua**. A classificação Principal/Secundário é local: duas máquinas ambas escolhidas como Principal **não têm bloqueio de concorrência pela rede**. Os locks já existentes do script continuam sendo locais ao navegador.
- Não transfere movimentações em trânsito, horários de esquiva pendentes, logs nem bloqueios de sessão.
- A importação de perfil de outra conta ou mundo é recusada. Limite de tamanho do perfil: 1 MB.

### 3. Diagnóstico automático (DIAG)

Nova aba **DIAG**.

- Mostra todos os módulos: ligado/desligado, cliente indisponível, simulação, PC secundário ou falha recente.
- Explica motivos de espera específicos (três recursos cheios no Auto Farm, nenhuma meta na FILA, falta de recursos, comerciantes indisponíveis, módulos parados).
- Registra **tentativas, ações confirmadas pelo executor local e erros** por módulo, incluindo horário e último motivo. Reavalia o painel periodicamente (15 segundos).
- Permite **Reavaliar agora**, **Exportar diagnóstico JSON** e **Limpar contadores**.
- O diagnóstico usa modelos e logs locais, sem requisições adicionais ao jogo.
- A marcação de execução concluída indica sucesso do retorno da chamada do cliente; não comprova que uma operação assíncrona tenha chegado ao estado final no servidor.

### Compatibilidade e testes

Mantidos Auto Farm v0.7.1, fila inteligente v0.7.0, recrutamento por lotes, esquiva, laboratório de ataques virtuais, rotas manuais, histórico de ações e demais módulos. O monitor de presença ON/OFF removido em v0.8.1 continua removido.

Testes com APIs simuladas: geração de carga por déficit real; combinação de dois recursos; limites de comércio e armazém; reserva para o fornecedor; supressão de repetição por entrega pendente; preservação de rotas manuais; exportação/importação entre PCs com conta/mundo iguais; rejeição de conta/mundo divergentes; modo Secundário impedindo execução; e diagnóstico de falha/recuperação. A versão ainda precisa de teste operacional em um servidor real de Grepolis.

## GrepoPilot 0.9.1 — Proteção durante CAPTCHA

Adicionada detecção de verificações CAPTCHA **visíveis na página** do Grepolis, com pausa temporária de rotinas e aviso opcional. **Não soluciona, preenche, contorna nem terceiriza a resolução de CAPTCHA.**

- O monitor verifica elementos conhecidos de CAPTCHA (iframes e containers visíveis) a cada ciclo de aproximadamente 1,5 segundos; elementos ocultos não acionam a pausa.
- Ao detectar um desafio visível, o GrepoPilot interrompe temporariamente a execução dos módulos e impede novos comandos enviados ao cliente, inclusive durante a esquiva e no teste prático.
- Se um **teste prático de esquiva** estiver ativo no momento do desafio, ele é interrompido e seus apoios previamente identificados recebem marcação para cancelamento posterior, assim que a verificação deixar o jogo operável. **Cancelamentos podem atrasar enquanto o desafio estiver presente.**
- O estado de execução configurado pelo usuário é mantido. Quando o desafio não estiver mais visível por um período contínuo (padrão: **5 segundos**), a execução é liberada. Módulos que estavam pausados manualmente continuam pausados.
- **AJUSTES → Proteção durante CAPTCHA:** status, notificações de navegador e intervalo de confirmação de desaparecimento (de 1 a 30 segundos).
- **DIAG:** módulos mostram **CAPTCHA** como motivo de suspensão.
- A detecção é baseada nos elementos visíveis do cliente: desafios proprietários que não utilizem os seletores monitorados podem não ser identificados. O recurso foi testado em ambiente simulado, sem validação ao vivo.

Testes simulados concluídos: operação normal sem desafio; pausa com CAPTCHA visível; nenhum envio de comando durante o desafio; interrupção de teste prático preservando a solicitação de cancelamento; status de diagnóstico; liberação após intervalo de confirmação; manutenção de configuração; não detecção de widget oculto; preservação das funções anteriores.

## GrepoPilot 0.9.2 — F5 automático com intervalo configurável

O GrepoPilot agora pode executar o equivalente a **F5 (recarregar a página atual do Grepolis)** periodicamente.

- Em **AJUSTES → Atualização automática da página (F5)**, habilite/desabilite o recurso e defina o intervalo. **Padrão: ativado, 30 minutos**; permitido de 10 a 720 minutos.
- O F5 só funciona enquanto a **execução geral do bot estiver ligada** e o computador estiver em modo **Principal**. Não força reinício em PC Secundário ou quando o bot está pausado.
- **Proteção contra interrupções:** se houver CAPTCHA ou atraso de liberação, requisição ao jogo em andamento, escritas de automação em curso, teste ativo, apoio/esquiva a cancelar, ataque chegando em breve ou comando agendado próximo do horário (inclusive pendente de confirmação), o F5 é **adiado até a condição passar**.
- Margem de segurança para ataques e comandos configurável (padrão 180 segundos). O sistema também espera quando o usuário estiver editando um campo dentro do GrepoPilot.
- O próximo horário e o último F5 são armazenados **localmente por conta e mundo**. O prazo sobrevive ao reload para não entrar em ciclo de atualização ao reiniciar.
- Botão **Reiniciar contagem do F5** na aba AJUSTES; alterações no intervalo também reiniciam a contagem. O log registra quando uma atualização foi adiada e por quê.
- A rotina verifica o relógio a cada 10 segundos. O navegador pode atrasar execução em abas ocultas/suspensas, então o intervalo não garante precisão de segundos.
- O F5 **não resolve nem contorna CAPTCHA** e não retoma rotinas desativadas pelo usuário.
- Configurações anteriores, Auto Farm, esquivas, comércio inteligente, diagnóstico e perfis entre PCs foram preservados.

**Testes automatizados locais:** período inicial de 30 minutos, bot pausado, PC secundário, teste em andamento, esquiva pendente, CAPTCHA visível, requisição ainda em voo, comando próximo e envio pendente, ataque inimigo com chegada próxima, liberação da atualização ao ficar seguro, somente um reload por prazo, persistência do horário após nova inicialização e interface de configuração. Sem teste de navegação com uma sessão real do Grepolis.

## GrepoPilot 0.9.3 — Autodiagnóstico para outros computadores

Nova aba **VERIFICAR** para descobrir o motivo de o GrepoPilot não iniciar ou não executar no segundo PC.

### Verificações de compatibilidade

- **Carregamento do userscript e versão:** identifica se este código conseguiu executar; se a aba não aparece, a verificação não pode ser executada pelo próprio script.
- **Endereço do jogo e acesso aos dados da página:** identifica se o script está no endereço esperado do Grepolis e se a ponte do script para os dados da página está disponível.
- **Conta e cidade carregadas:** detecta `Game.player_id` e coleção de cidades, distinguindo o carregamento incompleto do jogo de um bot pausado.
- **APIs internas necessárias:** verifica a presença de `MM.getModels`, `MM.getOnlyCollectionByName` e `gpAjax.ajaxPost`, sem enviar comandos.
- **Armazenamento no navegador:** efetua teste local isolado de gravação/leitura e remove a chave de teste imediatamente.
- **Montagem do painel:** identifica erros de renderização, histórico de erros de boot e se a janela está anexada ao documento.
- **Execução real:** verifica se o PC está como **Principal**, a execução geral está ativa, há módulos habilitados, o modo simulação está desligado e se há CAPTCHA.
- **Sinal do motor:** registra o horário do último ciclo e informa se o script está pausado, aguardando cliente, bloqueado ou executando. A aba DIAG continua registrando ações enviadas, tentativas e falhas.

Os indicadores **OK / ATENÇÃO / ERRO** mostram a condição e, quando necessário, o próximo passo para corrigi-la. O botão **Verificar novamente** renova a leitura. **Copiar relatório** e **Salvar relatório .json** ajudam a comparar PCs, com versão, servidor, navegador, estado do motor e dados de diagnóstico. O relatório contém o ID numérico do jogador e o identificador do mundo para que problemas de conta/servidor possam ser diferenciados.

### Melhorias na inicialização

- O GrepoPilot não grava mais uma configuração nova com escopo `unknown` enquanto o cliente do jogo ainda não forneceu o ID do jogador.
- Verifica se as APIs mínimas do Grepolis realmente estão prontas antes de executar os módulos.
- Protege o painel contra falha de uma aba: mostra uma mensagem e oferece o caminho para **VERIFICAR** sem derrubar a janela inteira.
- Caso a montagem inicial do painel falhe devido ao DOM temporariamente indisponível, tenta remontá-lo a cada 5 segundos.
- Captura rejeições assíncronas do motor e registra os motivos em vez de deixar uma falha silenciosa.

### Se a janela nem aparece no outro PC

1. Abra o Tampermonkey e confirme que **GrepoPilot v0.9.3** está instalado e ligado.
2. Em Chrome/Edge, abra `chrome://extensions` ou `edge://extensions` → **Tampermonkey → Detalhes**; verifique **Permitir scripts de usuário** e o acesso da extensão ao domínio do Grepolis.
3. Entre no mundo do Grepolis no navegador, aguarde o jogo carregar e atualize a página.
4. Se o painel aparecer, entre em **VERIFICAR**. Se estiver no modo Secundário, escolha Principal em AJUSTES no PC que deve executar. Verifique também Execução geral, módulos e Modo simulação.

**Limitação:** uma verificação interna não consegue constatar nem reparar uma extensão bloqueada que impediu o script de executar. Por isso os passos manuais acima continuam necessários.

Testes locais simulados: abertura do painel antes das APIs do jogo; reconhecimento posterior da conta e restauração da configuração correta; PC secundário; bot pausado; modo simulação; erros de renderização sem queda da janela; armazenamento local bloqueado; falha e recuperação da montagem inicial. Mantidas todas as rotinas anteriores. Sem validação em uma sessão real de Grepolis instalada em outro PC.
