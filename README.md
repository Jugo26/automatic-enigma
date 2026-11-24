# Conferência 360

Treinamento didático de conferência de documentos de transporte de veículos (NF-e/DANFE, DCE/DACE e CT-e/DACTE).

**Versão publicada:** 61 — galeria dinâmica no menu com dez fotografias automotivas reais, duas por marca (Toyota, Honda, Ford, Volkswagen e Chevrolet). Mantém o tema carbono e laranja e preserva o Radar Fiscal, as regras e os resultados do treinamento.

## Radar Fiscal Brasil — notícias empresariais
- Painel compacto no menu, com carrossel automático (pausa ao interagir), filtros por Emissão, Impostos, Transporte, **DC-e/DACE** e **Montadoras**, e links para fontes oficiais.
- Notícia: data de publicação, fonte, resumo objetivo e ponto de atenção para empresas; imagens originais da publicação quando obtidas, ou fotografias reais de referência por categoria, identificadas como ilustrativas.
- Base inicial conferida com documentos da Receita Federal e do Portal NFS-e; arquivo: `data/noticias_fiscais.json`.
- A rotina `scripts/atualizar_noticias_fiscais.py` consulta múltiplos feeds oficiais da Receita Federal, NFS-e e Fazenda e a editoria Economia da Agência Brasil (EBC), notícias do MDIC/Transportes, comunicados do Portal DC-e (SVRS) e releases da Anfavea; filtra por assunto, valida origem e data, deduplica, preserva resumos já revisados e busca imagens somente em domínios governamentais.
- Ação agendada: `.github/workflows/radar-fiscal-diario.yml` às 07h15 no horário de Brasília, diariamente, ou por execução manual.
- **Publicação condicional:** o coletor compara notícias por URL canônica, data/título de avisos e referências específicas; preserva matérias existentes e apenas adiciona inéditas. Se não houver novidade, retorna sem regravar `data/noticias_fiscais.json` e sem criar commit, mesmo quando a data da checagem mudou.
- **Tarefa do ChatGPT:** monitoramento diário adicional das fontes e do repositório, com atualização só quando houver novidade confirmada e aviso ao usuário apenas após publicação; evita republicar notícias já adicionadas pelo GitHub Actions.
- Quando uma fonte estiver indisponível, as notícias anteriores são preservadas. A execução efetiva depende do GitHub Actions e do acesso às fontes.
- As novas entradas automáticas mostram trechos da fonte e orientações operacionais genéricas, não pareceres jurídicos. A aba mostra a data da última **publicação de notícias**, não a data de cada consulta sem novidades.
- O jogo carrega a edição atualizada online e mantém uma cópia inicial verificada quando o acesso à rede falha.

- Na editoria **DC-e/DACE**, acompanham-se comunicados oficiais do documento, sua emissão, validações, notas técnicas e mudanças operacionais. A DC-e não substitui NF-e nas operações em que a NF-e é obrigatória.
- Na editoria **Montadoras**, acompanham-se Ford, Toyota, Honda, Polaris, Volkswagen, GM e a indústria automotiva brasileira, com foco em produção, distribuição, logística, faturamento e importação/exportação.
- Notícias do setor automotivo não são apresentadas como novas obrigações fiscais. As atualizações automáticas não inventam impactos ou datas quando a fonte não oferece evidência.

## Coerência de cadastros no CT-e
- Quando duas partes representam o mesmo CPF/CNPJ completo, não são geradas divergências isoladas de nome, município ou endereço entre elas. Uma parte incorreta vinculada é simulada por outro cadastro completo, sem reutilizar CPF/CNPJ de outra parte da rodada. Mantidos os PGs, a referência do destinatário Polaris, as divergências de partes independentes e o limite de três erros.

## Conferência sem quadro auxiliar
- Removido o quadro externo de ordem de transporte dos modelos DANFE, inclusive faturamento direto. Permanecem os campos dos documentos, códigos de destinatário e regras de PG; a geração e correção das rodadas não foram alteradas.

## Modelos NF-e Ford e Polaris (didáticos)
- Ford (página 1 do PDF recebido): DANFE horizontal, remessa de veículo, duas origens sorteáveis: São Bernardo do Campo/SP (PG **70001**) e Camaçari/BA (PG **70004**).
- Endereço de referência Ford SBC: **Av. Maria Servidei Demarchi, 1420 - Sala 1 - Demarchi, São Bernardo do Campo/SP, CEP 09820-000**. Cadastro: https://portaldatransparencia.gov.br/busca/pessoa-juridica/03470727000120
- Endereço de referência Ford Camaçari: **Av. Henry Ford, 2000 - COPEC, Camaçari/BA, CEP 42810-000**. Cadastro histórico industrial: https://sei.ba.gov.br/cadex/empresa-detalhes.php?id=22679. O uso no treino não implica fábrica atualmente em operação.
- Polaris (página 2 do PDF recebido): DANFE vertical de Indaiatuba/SP, modelo UTV off-road. O **destinatário da nota é também o tomador do serviço e pagador do frete**. Cada destinatário Polaris possui **código didático de 4 dígitos**, mostrado no DANFE e na parte superior direita do quadro Destinatário do DACTE; o **PG correto é o mesmo código**. O jogo pode gerar PG incorreto como divergência intencional para treinamento.
- Ambos disponíveis na configuração específica e no sorteio misto. Dados de documentos, notas, pessoas e chaves gerados como **simulação**, sem reproduzir os identificadores fiscais reais do PDF.

## Galeria automotiva do menu (V61)
- Alterna fotografias de Toyota Corolla/Hilux, Honda Civic/HR-V, Ford Mustang/Ranger, Volkswagen Golf/Tiguan e Chevrolet Onix/Tracker a cada 8 segundos, com transição suave.
- Intercala as marcas, apresenta modelo e autoria/licença da fotografia, permite pausar e retomar, e interrompe a rotação fora do menu, na aba oculta ou com preferência por movimento reduzido.
- Carrega a próxima fotografia antes de alternar; se houver falha, mantém a última imagem válida e tenta a próxima. A fotografia original do V60 é a reserva inicial.
- As fotos são servidas por Wikimedia Commons, com visualização de 960 px. As atribuições e os links para a página original e a licença individual estão no próprio carrossel e na lista abaixo. A disponibilidade de rede pode afetar a galeria, sem afetar o treinamento.

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
## Créditos fotográficos (V60)
- hero: [Jae Park / Pexels](https://www.pexels.com/photo/a-black-car-in-an-indoor-garage-6969040/).
- Emissão: [Mikhail Nilov / Pexels](https://www.pexels.com/photo/office-tools-and-equipment-on-a-desk-8296953/).
- Impostos: [Mikhail Nilov / Pexels](https://www.pexels.com/photo/a-person-working-on-the-documents-using-a-calculator-8297220/).
- Transporte: [Juan R. Real / Pexels](https://www.pexels.com/photo/warehouse-with-delivery-truck-exiting-the-loading-dock-29786116/).
- DCEs: [Wojciech Kotlicki / Pexels](https://www.pexels.com/photo/boxes-in-delivery-truck-in-warehouse-21838827/).
- Montadoras: [Marek Ślusarczyk / Wikimedia Commons (CC BY 3.0)](https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg).
Fotografias Pexels: https://www.pexels.com/license/. Linha de montagem de Marek Ślusarczyk: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/), com recorte de apresentação. As fotos são carregadas por HTTPS de seus provedores; caso falhem, a interface não exige a imagem para funcionar.

## Créditos fotográficos da galeria (V61)
- Toyota Corolla: [SsmIntrigue / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2021_Toyota_Corolla_LE%2C_Front_Right%2C_10-19-2020.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Honda Civic: [Kevauto / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2022_Honda_Civic_EX%2C_front_10.29.21.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Ford Mustang: [XoMEoX / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ford_Mustang_Front.jpg) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Volkswagen Golf: [Vauxford / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2020_Volkswagen_Golf_Style_ETSi_S-A_1.5_Front.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Chevrolet Onix: [Heduardo55 / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_II_front_Brazil.jpg) — [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Toyota Hilux: [EurovisionNim / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Toyota_Hilux_Rogue_2nd_facelift_2020_front.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Honda HR-V: [MercurySable99 / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2023_Honda_HR-V_LX_AWD%2C_front_right.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Ford Ranger: [Andrej Danković / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ford_Ranger_2.jpg) — [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Volkswagen Tiguan: [Vauxford / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2020_Volkswagen_Tiguan_Life_facelift_Front.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Chevrolet Tracker: [Maxi-Napo-99 / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2022_Chevrolet_Tracker_1.2_Turbo_LTZ%2C_front_(Argentina).jpg) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Apresentação com ajuste de contraste e saturação via CSS; arquivos originais não são alterados.
