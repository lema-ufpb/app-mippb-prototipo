# Plano de testes modulares - v20

Este plano organiza os testes para evitar regressões quando novos indicadores, campos ou abas forem adicionados.

## 1. Níveis de teste

### Nível 1 - Teste específico do indicador

Objetivo: verificar se o indicador isolado funciona.

Aplicar quando um pesquisador cria ou altera um indicador.

O teste deve cobrir:

- entrada válida;
- entrada ausente;
- valor zero;
- valor extremo;
- saída em formato JSON serializável;
- interpretação textual esperada, quando existir.

### Nível 2 - Teste de contrato

Objetivo: verificar se o indicador declarou corretamente suas dependências.

O teste deve cobrir:

- campos obrigatórios existentes em `config/campos_v20.py`;
- fontes existentes em `config/fontes_dados_v20.py`;
- etapa existente em `config/etapas_v20.py`;
- módulo declarado em `config/painel_v20.py`;
- tipo visual existente em `mip_pb_v20/componentes/base.py`.

Comando:

```bash
python3 validar_modulos_v20.py
```

### Nível 3 - Teste intermediário de composição

Objetivo: verificar se um conjunto de módulos funciona quando uma aba está ativa.

Exemplos:

- todos os módulos de `impactos_economicos`;
- todos os módulos de `impactos_tributarios`;
- checklist FAIN;
- documentos e IA;
- memória técnica e parâmetros.

Esse teste é importante porque um indicador pode funcionar sozinho, mas depender de um campo comum removido por outro ajuste.

### Nível 4 - Teste global

Objetivo: verificar a plataforma com todos os módulos esperados ativos.

Comando:

```bash
./rodar_testes_v20.command
```

Esse teste regenera o painel, valida payload, HTML, JavaScript, configuração modular e arquivos principais.

### Nível 5 - Teste de regressão

Objetivo: garantir que uma mudança nova não alterou o que já estava correto.

Exemplos de perguntas:

- o HTML standalone ainda abre?
- o payload continua válido?
- o mapa ainda aparece?
- o cálculo de emprego não mudou sem motivo?
- a aba tributária ainda pode ser desligada?
- a IA continua sendo opcional?

## 2. Teste para evitar “máquina de dependências”

Uma máquina de dependências surge quando um módulo depende implicitamente de muitos outros, mas isso não está documentado.

Para evitar isso:

1. todo módulo deve declarar `depende_de_campos`, `depende_de_um_dos` e `depende_de_dados`;
2. todo campo deve declarar `alimenta`;
3. todo dado deve estar em `fontes_dados_v20.py`;
4. o validador deve ser executado antes de gerar a versão final;
5. módulos que só alteram visualização não devem alterar cálculos.

## 3. Fluxo recomendado antes de incorporar mudança

1. Criar ou alterar o indicador em arquivo próprio.
2. Declarar dependências no próprio indicador.
3. Declarar ou revisar campos em `config/campos_v20.py`.
4. Declarar ou revisar fontes em `config/fontes_dados_v20.py`.
5. Declarar exibição em `config/painel_v20.py`.
6. Rodar:

```bash
python3 validar_modulos_v20.py
```

7. Se passar, rodar:

```bash
./rodar_testes_v20.command
```

8. Abrir `formulario_avaliacao_ex_ante.html` no navegador.
9. Testar um caso simples, por exemplo setor 1100 ou CNAE 1112.

## 4. Critérios para reprovar um módulo

Um módulo deve voltar para revisão se:

- só funciona quando outro módulo está ligado, mas não declara isso;
- lê campo que não está no dicionário;
- usa base não declarada;
- altera variável global sem necessidade;
- muda pesos ou parâmetros sem registro;
- quebra HTML standalone;
- não pode ser ocultado por configuração;
- altera resultado de outro indicador sem justificativa.

## 5. O que já está automatizado na v20

Os testes atuais já verificam:

- existência dos arquivos principais;
- validação do payload;
- sintaxe JavaScript;
- HTML standalone autocontido;
- registro modular do painel;
- existência de arquivo individual para cada indicador;
- consistência de campos, dados e etapas;
- bloqueio de módulo quando dependência essencial é removida;
- execução do validador modular.
- funções puras de impactos MIP, neutralidade fiscal, retorno fiscal e balanço interestadual.

## 6. O que ainda deve evoluir

Próximos degraus recomendados:

- testes unitários específicos para cada fórmula econômica;
- testes visuais com Playwright;
- schema formal para entradas e saídas dos indicadores;
- comparação automática entre cenários salvos;
- documentação automática gerada a partir dos contratos.
