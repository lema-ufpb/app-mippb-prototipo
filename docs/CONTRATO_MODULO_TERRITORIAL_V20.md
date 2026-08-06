# Contrato do módulo territorial v20

Este arquivo documenta a separação feita no cálculo e na apresentação do mapa territorial.
O objetivo é permitir que o módulo de absorção territorial entre ou saia do painel sem
alterar a lógica principal de avaliação econômica e tributária.

## Arquivos

- `static/v20/territorio_calculo.js`: calcula os indicadores territoriais.
- `static/v20/mapa_territorial.js`: renderiza o SVG e monta os tooltips.
- `static/v20/mapa_ia.js`: fica restrito à leitura documental e à redação assistida por IA.
- `static/v20/avaliar.js`: apenas orquestra o módulo, sem conter a fórmula territorial.

## Entrada principal

O módulo `TerritorioCalculo.calcularModuloTerritorial()` recebe:

- `origin`: código IBGE de 6 dígitos do município onde ocorre o investimento.
- `sectorCode`: código SCN/TRU do setor do projeto.
- `valueBRL`: choque de produção em reais.
- `targetShare`: percentual acumulado dos impactos indiretos que será considerado.
- `hasValidMunicipio`: indica se o município informado existe no payload.

## Dados de suporte

O cálculo usa os dados embarcados no payload:

- multiplicadores e matriz de Leontief aberta;
- QL municipal por setor;
- emprego formal municipal;
- REGIC-PB;
- distâncias rodoviárias PB-PB;
- PIB/VA municipal privado;
- matriz de comércio intermunicipal PB-SCN;
- cadastro de municípios e mapa SVG.

## Saída

A função retorna um objeto com:

- `indirectSectorsAll`: setores indiretamente impactados pela MIP.
- `tradableIndirectSectorsAll`: subconjunto de setores tradables.
- `impactSectorsTerritoriais`: setores usados no mapa, conforme `targetShare`.
- `spatialImpactVector`: vetor de pesos setoriais usado no score municipal.
- `spatialScores`: score territorial por município.
- `highAbsorptionRows`: municípios com alta capacidade territorial.
- `territorialAbsorption`: síntese usada nos cards de absorção territorial.
- `qlTopCount`: número de setores indiretamente impactados em que o município de origem tem especialização robusta.

## Renderização do mapa

O módulo `MapaTerritorial.paintSpatialMap(origin, spatialScores)` recebe o município de origem
e o vetor `spatialScores`. Ele devolve um SVG com:

- município de origem em cinza escuro;
- municípios com alta capacidade em escala sequencial;
- demais municípios em cinza;
- atributos `data-spatial-*` embutidos em cada município para alimentar o tooltip.

O tooltip usa primeiro os atributos embutidos no próprio SVG. Assim, mesmo que o DOM seja
reestruturado por outro módulo visual, os dados municipais continuam associados ao caminho
SVG correto.

## Regra de dependência

O mapa só deve ser calculado quando houver município válido. Se o município não for informado
ou não existir no payload, o painel deve exibir o aviso de mapa não calculado, sem pintar
municípios nem gerar score territorial.

## Testes esperados

Os testes devem verificar que:

- `mapa_ia.js` não contém funções de cálculo territorial;
- `territorio_calculo.js` contém a fórmula e a matriz de comércio;
- `mapa_territorial.js` contém a renderização SVG e os tooltips;
- `avaliar.js` chama os módulos por API, sem variáveis globais antigas;
- o standalone contém os dois módulos novos;
- um cenário com município válido pinta a origem e grava atributos `data-spatial-*` no SVG.
