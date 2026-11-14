# GrepoPilot Desktop — Central Compartilhada

## Novidades

- **Central compartilhada** integrada à barra lateral do Desktop (não é userscript separado): jogadores online/offline, aliança e movimentos de ataque, apoio, comércio, colonização, espionagem e retorno.
- Filtros por jogador, tipo, direção e cidade.
- Coletor de movimentações das **cidades próprias presentes no modelo do Grepolis**, sem depender da cidade selecionada no Desktop. Campos que o jogo não expõe não são estimados.
- Envio ao servidor a cada 15 segundos, somente com token válido do **mesmo jogador e mundo**. A lista de outros jogadores e movimentos é atualizada a cada 12 segundos.
- Compartilhamento desligado por padrão: cada jogador escolhe divulgar suas movimentações.
- Token individual criptografado no computador Windows com Electron `safeStorage` (quando indisponível, token fica apenas em memória).
- Cabeçalho lê a versão real do app instalado por `app.getVersion()`. O motor remoto continua com numeração independente.
- Aplicativo instalado por NSIS consulta releases do GitHub e baixa atualizações automaticamente; a instalação ocorre na saída. O projeto inclui workflow de build do instalador.

## Abrir o Desktop

No Windows com Node.js instalado, execute `INICIAR-WINDOWS.bat`. Para compilar o instalador, execute `CRIAR-INSTALADOR-WINDOWS.bat`.

```powershell
npm ci
npm run check
npm start
```

## Configurar central compartilhada

O servidor está no diretório `shared-server`. Pode ser iniciado localmente usando `INICIAR-CENTRAL-WINDOWS.bat` ou instalado em um VPS com HTTPS. As informações detalhadas e testes ficam em `shared-server/README.md`.

O administrador cadastra cada jogador no endpoint `POST /admin/users` com `world`, `playerId` e `name`, autenticado por `X-Admin-Key`. A resposta inclui um token individual mostrado uma única vez. Cada conta escolhe **Central compartilhada → URL do servidor + token → Conectar**. Depois habilita **Compartilhar minhas movimentações** para disponibilizar seu próprio quadro de movimentos.

O servidor mostra **apenas os jogadores cadastrados nele, no mesmo mundo**. O bot não consegue descobrir automaticamente todos que usam versões privadas do GrepoPilot sem que se conectem à mesma central.

O Desktop consulta dados que já estão nos modelos do Grepolis autenticado: `MovementsUnits` e coleções de comércio, quando expostas. Não faz solicitações adicionais para buscar movimentos desconhecidos. Todos os outros módulos (esquiva, recrutamento, economia) permanecem no motor remoto carregado da branch `grepopilot-updates`.

## Atualização automática de executável

Para lançar, execute `npm version patch --no-git-tag-version` em `desktop/` (ou escolha a próxima versão conforme a mudança) e publique o commit em `grepopilot-updates`. O workflow testa, compila e publica o `.exe`, o `.blockmap` e o `latest.yml` com uma tag no commit do build. Versões com tag existente são preservadas.

O Desktop instalado procura atualizações ao abrir e a cada 8 horas. Instalações anteriores à v0.2.4 precisam do [instalador mais recente](https://github.com/Jugo26/automatic-enigma/releases/latest) para ter esse mecanismo. Use `npm start` para executar a cópia de desenvolvimento. Alterações em `GrepoPilot.user.js` seguem o versionamento próprio do motor.

**Não há reinício forçado do jogo**: o update é aplicado ao fechar normalmente o programa.

## Testes

```powershell
npm run check
cd shared-server
npm test
```

Os testes cobrem a integração das páginas, o coletor, a limitação por jogador/mundo e a versão dinâmica. A compilação NSIS e a prova em uma conta Grepolis real requerem Windows ou o workflow de CI.
