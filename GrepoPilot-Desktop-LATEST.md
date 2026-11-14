# GrepoPilot Desktop 0.2.4 — Central Compartilhada

Pacote de atualização do aplicativo Desktop com a aba **Central compartilhada**, coleta de ataques, apoios e comércio, controles de compartilhamento por jogador/mundo e versão dinâmica no cabeçalho.

[Baixar o código-fonte Desktop v0.2.4](releases/GrepoPilot-Desktop-v0.2.4-central-compartilhada.zip)

A branch `grepopilot-updates` mantém o motor GrepoPilot.user.js 1.0.4 independentemente. A versão Desktop fica no package.json do pacote, e o aplicativo instalado lê app.getVersion().

O workflow `.github/workflows/grepopilot-desktop.yml` compila um instalador Windows NSIS e publica os arquivos de atualização `latest.yml`, `.exe` e `.blockmap` na release GitHub v0.2.4.

Execute `npm run check` dentro do Desktop extraído. O servidor de jogadores está em `shared-server` dentro do ZIP, com README próprio.
