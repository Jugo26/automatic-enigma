# Conferência 360 — GitHub e atualização automática

## Repositório oficial
https://github.com/Jugo26/automatic-enigma

**Arquivo oficial:** `Index.html` na branch `main`. Versão inicial publicada: **v32**.

### Funcionamento ao abrir o jogo (recomendado com Gmail)

1. No [Google Apps Script](https://script.google.com/), abra o projeto Conferência 360.
2. Substitua todo o conteúdo do arquivo `Code.gs` pelo conteúdo de `AppsScript/Code.gs` deste pacote.
3. Mantenha o arquivo `Index.html` existente no Apps Script como cópia de segurança (use `AppsScript/Index.html` se necessário).
4. Salve. Em **Implantar > Gerenciar implantações**, edite a implantação web, selecione **Nova versão** e implante.
5. Ao executar pela primeira vez, autorize os acessos solicitados pelo Google (inclusive conexão externa e envio de e-mail).
6. Abra o endereço `/exec` do Google Apps Script. Toda nova visita faz uma consulta a `https://raw.githubusercontent.com/Jugo26/automatic-enigma/main/Index.html`, usando uma query única para evitar cache. O conteúdo mais recente é apresentado automaticamente.
7. Quando não conseguir buscar no GitHub, o servidor usa `Index.html` guardado dentro do Google Apps Script. O envio de e-mails continua gerenciado por `sendTrainingReport`.

**Não será preciso republicar o Apps Script a cada nova versão do jogo.** Será necessário republicar somente quando o **código do servidor `Code.gs`** mudar.

### Uso sem Apps Script ou sem Node.js

- Abra `INICIAR_CONFERENCIA_AUTO.html` no Chrome/Edge. Ele busca `version.json` e `Index.html` diretamente no GitHub e carrega a versão atual no navegador.
- Se o computador estiver sem internet ou o GitHub bloqueado, use o botão **Abrir cópia local**.
- O arquivo local/launcher não fornece envio Gmail por conta própria: para envio automático de CSVs após 10 rodadas, use o link do Apps Script publicado.
- Opcional: no próprio iniciador, abra o painel **Uso com relatórios por Gmail**, cole o URL `/exec` do seu Apps Script e clique em **Salvar link e abrir**. Nas próximas aberturas, o iniciador levará automaticamente ao aplicativo web, que busca a versão GitHub e permite enviar os relatórios.
- O iniciador **carrega** a versão mais atual; não sobrescreve automaticamente arquivos do disco (navegadores não têm esse acesso).

### Publicar uma atualização futura

1. Edite o arquivo `Index.html` na branch `main` do repositório.
2. Incremente `version` no `version.json` no mesmo commit ou na sequência.
3. Teste os modos de treinamento e o envio do CSV antes de enviar para produção.
4. Na próxima abertura do Apps Script, o conteúdo GitHub atualizado será exibido. O iniciador local também buscará a nova versão.

### Segurança

- **Nunca** coloque senhas, tokens ou credenciais do Gmail dentro dos arquivos do GitHub; este repositório é público.
- O backend do Apps Script mantém destinatário fixo e um limite de 20 relatórios por dia.
- Mantenha o acesso à implantação Apps Script restrito ao público necessário. Um endpoint aberto pode ser abusado mesmo com a quota preventiva.
- O jogo é didático, utiliza notas fictícias e resultados declarados pelo próprio navegador, não sendo um sistema de emissão fiscal oficial.
- Se futuramente precisar de sigilo, mover o repositório para privado exige alterar o método de atualização (GitHub Raw público não permite ler repositórios privados sem autenticação).

### GitHub Pages (opcional)

O repositório também inclui `.github/workflows/pages.yml`. Para ativar um site público, acesse **Settings > Pages > Build and deployment > Source: GitHub Actions**. Depois de publicado, o site ficará em `https://jugo26.github.io/automatic-enigma/`. **A versão GitHub Pages não envia e-mails**, pois o envio depende do Apps Script.
### Testes de integração

Testados: carregamento pelo GitHub, fallback local, preservação do envio de e-mail e dez rodadas com CSV simulado. O pacote para Windows inclui os scripts dos testes. A implantação real do Apps Script e a ativação opcional do GitHub Pages ainda dependem da configuração das contas.

### Integração com a planilha Resultados (2026-11-27)

- Use o projeto Apps Script vinculado à planilha previamente configurada. Substitua `Code.gs` pela versão atual do repositório, salve e execute `testarEmail` (não é necessário repetir `configurar` se as propriedades já estiverem salvas).
- Em **Implantar > Gerenciar implantações**, edite a implantação existente, selecione Nova versão e implante. Autorize a consulta externa ao GitHub se solicitada. Use o endereço `/exec` existente para abrir o jogo. Restrinja o acesso à organização quando disponível; não abra o endpoint para qualquer pessoa sem avaliar o risco de abuso.
- O jogo registra cada sessão completa de dez rodadas, nome obrigatório, matrícula opcional, acertos, erros, tempo, detalhes e status do e-mail na aba Resultados; o destinatário é lido das propriedades. O relatório CSV continua anexado.
- A cota preventiva de 20 envios diários continua ativa; acima disso, o resultado permanece na planilha como PENDENTE e pode ser reenviado pela mesma sessão em outro dia. ENVIANDO/INCERTO exige conferência manual antes de novo envio. O envio não é garantido fora do Apps Script publicado. Dados e gabarito permanecem declarados pelo navegador, não são prova de identidade ou certificação.
