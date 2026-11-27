# Conferência 360

Treinamento didático de conferência de documentos de transporte de veículos (NF-e/DANFE, DCE/DACE e CT-e/DACTE).

**Versão publicada:** 64 — estação de conferência redesenhada em carbono e laranja, com mais espaço para os documentos e progresso dos campos na barra da rodada. Preserva as 16 fotos do menu, Radar Fiscal e regras do treinamento.

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

## Estação de conferência (V64)
- Cabeçalho, informações da operação, etapas e ferramentas mais compactos; acesso à tela cheia junto às etapas.
- Dois painéis com área de leitura ampliada, controles de zoom/foco/ajuste e documentos fiscais sem alterações.
- Barra inferior com contagem de campos classificados e progresso em tempo real, usando a contagem já existente na avaliação.
- Identidade carbono e laranja também na comparação ampliada e na avaliação; mantém verde/vermelho para marcações e respostas.
- Layout responsivo, preservando rolagem independente, modo iniciante e preferências de movimento reduzido. Nenhuma mudança nas regras de classificação ou pontuação.

## Galeria automotiva do menu (V63)
- Alterna 16 fotografias de veículos contemporâneos a cada 8 segundos, com transição suave. As legendas identificam o ano-modelo quando documentado ou indicam explicitamente o ano da fotografia ou do salão. As versões retratadas podem ser de mercados internacionais, inclusive os modelos da Changan comercializados pela CAOA no Brasil.
- Intercala as marcas, apresenta modelo e autoria/licença da fotografia, permite pausar e retomar, e interrompe a rotação fora do menu, na aba oculta ou com preferência por movimento reduzido.
- Carrega a próxima fotografia antes de alternar; se houver falha, mantém a última imagem válida e tenta a próxima. A fotografia do Toyota Corolla HEV 2025 é a imagem inicial.
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
- O executador consulta o HTML do GitHub a cada abertura; o Apps Script funciona somente como receptor dos resultados.
- `INICIAR_CONFERENCIA_AUTO.html` permite ao usuário carregar a versão online mais recente a partir de um arquivo local (precisa de internet).
- Ao concluir as 10 rodadas, o próprio treinamento envia o relatório ao Apps Script em segundo plano, sem redirecionamento. Requer implantação acessível e conexão de rede.
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

## Créditos fotográficos da galeria (V63)
- Toyota Corolla HEV 2025: [Just a Man / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Toyota_Corolla_HEV_SE-G_2025.jpg) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Honda Civic Hybrid 2025: [Kevauto / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_Honda_Civic_Hybrid_Sport_Touring_(facelift)%2C_front_4.18.25.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Ford Mustang Dark Horse 2025: [Calreyn88 / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_Ford_Mustang_Dark_Horse_1.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Volkswagen Golf GTI 2025: [Elise240SX / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_Volkswagen_Golf_GTI_Autobahn_in_Oryx_White_Pearl%2C_front_right%2C_2025-05-18.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Chevrolet Onix Plus 2025: [Just a Man / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_Chevrolet_Onix_Plus_1.0T_LT_(2).jpg) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Toyota Hilux BEV 2026: [TTTNIS / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2026_Toyota_Hilux_BEV.jpg) — [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Honda HR-V Hybrid 2025: [Alexander Migl / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_Honda_HR-V_Hybrid_DSC_7908.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Ford Ranger Limited 2025: [RL GNZLZ / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ford_Ranger_Limited_2025.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Volkswagen Tiguan 2026: [Raszbeary / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2026_Volkswagen_Tiguan_(Front)_at_the_2025_NYC_Auto_Show.png) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Chevrolet Tracker 2026: [Just a Man / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Chevrolet_Tracker_1.2T_2026_de_PAMI.jpg) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- BYD Seal 2025: [Cutlass / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_BYD_Seal_in_Shark_Grey%2C_front_left%2C_06-08-2025.jpg) — [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Omoda E5 2025: [LuvsMG481 / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2025_Chery_Omoda_E5_front.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Changan UNI-T (foto 2026): [Retired electrician / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Moscow%2C_Changan_Uni-T_Citydrive%2C_Aug_2026_01.jpg) — [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- BYD Dolphin (foto 2025): [Captainmorlypogi1959 / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:BYD_Dolphin_EV_2025.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Omoda C7 2026: [RL GNZLZ / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Omoda_C7_1.6_TGDi_Prestige_AWD_2026.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Changan CS75 Plus (salão 2026): [Peżot / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Changan_CS75_Plus_front_Pozna%C5%84_Motor_Show_2026.jpg) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Apresentação com ajuste de contraste e saturação via CSS; arquivos originais não são alterados.
