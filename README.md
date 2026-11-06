# Conferência 360

Treinamento didático de conferência de documentos de transporte de veículos (NF-e/DANFE, DCE/DACE e CT-e/DACTE).

**Versão publicada:** 51 — adicionados modelos de DANFE Ford (SBC PG 70001, Camaçari/BA PG 70004) e Polaris (Indaiatuba, PG 4682; tomador do CT-e = destinatário). As 10 rodadas, o fundo procedural e os sons permanecem.

## Modelos NF-e Ford e Polaris (didáticos)
- Ford (página 1 do PDF recebido): DANFE horizontal, remessa de veículo, duas origens sorteáveis: São Bernardo do Campo/SP (PG **70001**) e Camaçari/BA (PG **70004**).
- Endereço de referência Ford SBC: **Av. Maria Servidei Demarchi, 1420 - Sala 1 - Demarchi, São Bernardo do Campo/SP, CEP 09820-000**. Cadastro: https://portaldatransparencia.gov.br/busca/pessoa-juridica/03470727000120
- Endereço de referência Ford Camaçari: **Av. Henry Ford, 2000 - COPEC, Camaçari/BA, CEP 42810-000**. Cadastro histórico industrial: https://sei.ba.gov.br/cadex/empresa-detalhes.php?id=22679. O uso no treino não implica fábrica atualmente em operação.
- Polaris (página 2 do PDF recebido): DANFE vertical de Indaiatuba/SP, modelo UTV off-road. O **destinatário da nota é também o tomador do serviço e pagador do frete**. PG didático criado: **4682**, exibido à direita no DACTE.
- Ambos disponíveis na configuração específica e no sorteio misto. Dados de documentos, notas, pessoas e chaves gerados como **simulação**, sem reproduzir os identificadores fiscais reais do PDF.

## Fundo animado do menu
- Ondas digitais em movimento constante, formadas por linhas, malhas e pontos de luz desenhados em tempo real no canvas, sem wallpaper estático.
- Partículas geradas dinamicamente; reagem e se afastam do mouse, retornando suavemente ao fluxo original.
- Área central preservada para legibilidade; canvas atrás dos cartões e incapaz de bloquear cliques.
- Animação interrompida fora do menu e na aba oculta, estática com preferência por movimento reduzido e adaptada a diferentes tamanhos de tela.

## Efeitos sonoros de interface
- Os sons de hover e clique são sintetizados com Web Audio, sem arquivos de áudio externos.
- O botão **Som ligado / Som desligado** no menu ativa ou desativa todos os efeitos, e a preferência fica salva no navegador.
- Navegadores podem impedir o som ao passar o mouse até que a pessoa clique ou interaja com o aplicativo pela primeira vez.

## Atualização automática
- `Index.html` é a **fonte oficial** do jogo; novas versões substituem este arquivo.
- O Google Apps Script faz a verificação do HTML no GitHub **a cada abertura** do aplicativo web, e utiliza uma cópia local caso não consiga consultar o GitHub.
- `INICIAR_CONFERENCIA_AUTO.html` permite ao usuário carregar a versão online mais recente a partir de um arquivo local (precisa de internet).
- O envio de e-mail das 10 rodadas funciona **somente pelo Google Apps Script publicado** e previamente autorizado; não funciona com o HTML local aberto diretamente.
- Nenhuma senha nem chave de API deve ser commitada.

**Importante:** este repositório é público. Os casos e documentos do jogo são fictícios para treinamento; não utilizar dados fiscais reais de clientes.

Veja `INSTALACAO_GITHUB.md` para instruções de publicação e atualização.