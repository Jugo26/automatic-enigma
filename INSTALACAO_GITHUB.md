# Conferência 360 — executador e resultados

Repositório oficial: https://github.com/Jugo26/automatic-enigma

## Abrir o treinamento

- Use `INICIAR_CONFERENCIA_AUTO.html` no Chrome/Edge. Ele consulta `version.json` e carrega `Index.html` do GitHub.
- Na versão 66 o executador não redireciona para o Apps Script; a configuração legada de redirecionamento é removida. Substitua uma única vez a cópia do executador já baixada por esta versão.
- O Apps Script é exclusivamente um receptor de resultados. Não distribua o URL do script como link do treinamento.
- Sem internet, a cópia de segurança v32 continua disponível, mas não envia relatórios automaticamente.

## Configurar o receptor

1. Abra a planilha Resultados já configurada e acesse Extensões > Apps Script.
2. Substitua Code.gs pelo arquivo `AppsScript/Code.gs` deste repositório. Preserve as propriedades existentes PLANILHA_ID, EMAIL_DESTINO e CHAVE_INTEGRACAO. Se ainda não configurou, execute configurar.
3. Em Implantar > Gerenciar implantações, edite a implantação existente, selecione Nova versão, executar como você e, para acesso direto sem login, Quem pode acessar: Qualquer pessoa. O acesso anônimo deve ser permitido pela conta. Se a organização não permitir, será necessário um backend autenticado alternativo.
4. Abra o executador atualizado e complete 10 rodadas. Confira a linha na planilha e o e-mail. O endpoint responde JSON; o aplicativo só confirma o envio se o servidor retornar ENVIADO com o ID da tentativa.
5. Se a confirmação falhar, tente novamente na tela de resultados. O ID permanece o mesmo. O envio depende de rede, CORS e permissões reais da implantação.

## Segurança e limites

O repositório é público. Não publique chaves, tokens nem senhas. O endereço do receptor é público, não é uma credencial. A integração direta anônima não autentica identidade: dados podem ser enviados por terceiros. Use somente para treinamento, não para avaliação oficial, e restrinja ou desative a implantação se houver abuso. O servidor valida estrutura e 10 rodadas, fixa o destinatário na configuração privada, controla duplicatas e mantém o limite de 20 e-mails por dia. Acima da cota os registros permanecem PENDENTE. ENVIANDO/INCERTO exige conferência manual antes de reenviar.

O Apps Script só precisa ser republicado quando Code.gs mudar. Atualizações do HTML são carregadas pelo executador automaticamente. O GitHub Pages também usa o mesmo POST direto, sujeito às mesmas permissões e confirmação.
