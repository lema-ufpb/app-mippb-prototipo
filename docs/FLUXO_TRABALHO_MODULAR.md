# Fluxo de trabalho modular da pasta V20_B

Este documento descreve como a pasta foi organizada para manter o HTML sem dados embutidos e separar, tanto quanto possivel, as etapas do fluxo de trabalho.

## 1. Principio de organizacao

O painel deve ser lido como uma composicao de partes independentes:

- o HTML define a estrutura visual;
- a pasta `dados/` fornece o payload, o mapa e o registro modular;
- a pasta `static/v20/` contem a logica de calculo, exibicao e interacao;
- a pasta `config/` guarda pesos, parametros e declaracoes auditaveis;
- a pasta `docs/` explica como operar e manter a versao.

Assim, uma alteracao no payload nao exige editar o HTML, e uma alteracao visual em um script ou CSS nao exige regravar os dados.

## 2. Etapas do fluxo

### Etapa 1 - Identificacao e entrada documental

Coleta dados da empresa, municipio, protocolo, situacao do projeto e, quando usado, informacoes extraidas de documentos pelo assistente local de IA. Os dados extraidos pela IA somente entram no formulario depois de confirmados pelo auditor.

### Etapa 2 - Setor e choque economico

Define o setor SCN/TRU, CNAE, municipio de instalacao e o valor considerado para a simulacao. O choque economico e calculado a partir da diferenca entre o valor esperado com beneficio e o valor esperado sem beneficio.

### Etapa 3 - Qualificacao economica

Coleta informacoes usadas para interpretar o merito economico do projeto, como empregos diretos, compras locais, permanencia, investimentos e caracteristicas de fixacao territorial.

## 3. Resultados ativos nesta variante

Nesta pasta, ficam ativos os resultados ligados a impactos economicos e mapa territorial. Os blocos de impactos tributarios e Checklist FAIN foram desativados nesta variante para permitir revisao metodologica posterior.

Os principais resultados ativos sao:

- impacto esperado na producao;
- impacto esperado no valor adicionado;
- impacto esperado no emprego;
- impacto esperado na massa salarial;
- absorcao territorial dos impactos indiretos;
- retencao dos impactos na Paraiba;
- risco de rent seeking;
- identificacao de setor-chave;
- memoria tecnica e logs do processo.

## 4. Dependencias entre campos e resultados

Um resultado so deve ser exibido quando seus dados de entrada estiverem disponiveis. Exemplos:

- o mapa territorial depende do municipio de instalacao;
- os impactos da MIP dependem do setor e do choque economico;
- a avaliacao de empregos depende dos empregos diretos informados e dos multiplicadores setoriais;
- a leitura documental depende do servico local de IA estar ativo.

O arquivo `config/workflow_v20_b.json` registra essas dependencias de forma resumida.

## 5. Como evoluir a pasta

Ao criar um novo indicador, a recomendacao e seguir este roteiro:

1. Declarar os campos de entrada que o indicador exige.
2. Declarar em qual camada o indicador deve aparecer.
3. Criar o calculo em arquivo especifico, preferencialmente sem alterar `formulario_avaliacao_ex_ante.html`.
4. Registrar o componente em `dados/painel_mip_pb_v20_b.js` ou no arquivo de configuracao de painel usado para gerar esse registro.
5. Testar se o painel continua abrindo com o novo indicador ativo e com o novo indicador inativo.

Esse procedimento reduz o risco de uma melhoria pontual quebrar partes ja estabilizadas da plataforma.

