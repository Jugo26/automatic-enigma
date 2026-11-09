# GrepoPilot — instalação para outros jogadores (v0.9.4)

## Instalação

Link direto do script (Tampermonkey):  
https://raw.githubusercontent.com/Jugo26/automatic-enigma/grepopilot-updates/GrepoPilot.user.js

Código-fonte público:  
https://github.com/Jugo26/automatic-enigma/tree/grepopilot-updates

1. Instale **Tampermonkey** no seu navegador (Chrome, Edge ou Firefox).
2. No Chrome ou Edge, abra `chrome://extensions` ou `edge://extensions`, selecione **Tampermonkey → Detalhes**, ative **Permitir scripts de usuário** (quando disponível) e permita acesso aos sites `*.grepolis.com`.
3. Abra o link direto acima e confirme **Instalar** no Tampermonkey.
4. Entre no seu mundo do Grepolis, em um endereço como `https://br123.grepolis.com/game/index`.
5. Abra o painel **GREPOPILOT → COMEÇAR**. O painel detecta sua conta e mostra suas cidades. Clique em **Verificar minha conta** se não aparecerem.
6. Use **Testar Auto Farm em simulação** para experimentar sem enviar comandos ao jogo, ou **Configurar manualmente** para escolher módulos e metas.
7. O bot inicia pausado e em simulação. Os dados de outro jogador não são carregados automaticamente.

## Cada jogador tem o próprio perfil

As configurações são armazenadas por **mundo e ID do jogador**, localmente no navegador. Mesmo que duas pessoas usem o mesmo computador, cada conta terá suas próprias metas, pesquisas, cidades, rotas e preferências.

Para compartilhar configurações gerais, use **AJUSTES → Compartilhar modelo com outros jogadores → Exportar modelo .json**. O amigo pode abrir **AJUSTES** ou **COMEÇAR** e colar esse modelo em **Importar modelo público**.

O modelo público **não contém** IDs de cidades, construção específica, pesquisas de uma cidade, metas de recrutamento, rotas, ataques agendados, perfil pessoal ou dados de login. Sua importação não apaga metas já configuradas; fica pausada e em simulação.

**Perfil entre computadores** é diferente: copia configurações completas **somente para a mesma conta e mundo**, ativando o modo Secundário e pausando a execução. Não use o arquivo completo de perfil para compartilhar com outro jogador.

## Verificar problemas em outros PCs

Se o painel aparecer, clique em **VERIFICAR → Verificar novamente** para checar instalação, mundo, conta, cidades, APIs e armazenamento local. Use **Salvar relatório .json** quando precisar de suporte.

Se o painel **não aparecer**, o userscript não está executando. Verifique:
- se Tampermonkey e GrepoPilot estão habilitados;
- se **Permitir scripts de usuário** e **Acesso ao site** estão liberados;
- se você está dentro do mundo do jogo (`/game` ou `/game/...`), não na página de login;
- se a página foi recarregada com Ctrl+F5 depois de instalar.

O cliente Grepolis muda entre mundos e versões; nem todas as APIs são necessariamente iguais. Indicador de instalação **OK** não garante que cada ação de automação tenha sido aceita pelo servidor.

## Situação de aprovação pelo Grepolis

A publicação no GitHub e a instalação no Tampermonkey **não equivalem a aprovação pelo Grepolis**. O suporte oficial informa que apenas scripts explicitamente aprovados são permitidos. Para disponibilizar o GrepoPilot como script permitido, é preciso submetê-lo à análise da equipe do jogo:
https://support.innogames.com/kb/Grepolis/pt_BR/5977

A versão 0.9.4 foi validada em testes simulados de perfis e clientes. Ainda não foi testada em sessões reais de todos os mundos e navegadores.
