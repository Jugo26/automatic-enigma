# Conferência 360

Treinamento didático de conferência de documentos de transporte de veículos (NF-e/DANFE, DCE/DACE e CT-e/DACTE).

**Versão publicada:** 49 — fundo selecionado com ondas e partículas azuis, movimento de profundidade e partículas que se afastam do mouse. Preserva sons configuráveis, laço do Novembro Azul a 30 FPS, M1 correto/M2 incorreto e 10 rodadas.

## Fundo animado do menu
- Arte escolhida pelo usuário (ondas e partículas ciano) incorporada ao HTML como imagem WebP otimizada, sem dependência de servidor de mídia.
- Movimento de profundidade e partículas/ondas que respondem à posição do mouse sem interceptar cliques.
- Elementos atrás dos cartões para manter legibilidade; efeitos pausam fora do menu/aba oculta e respeitam movimento reduzido.

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