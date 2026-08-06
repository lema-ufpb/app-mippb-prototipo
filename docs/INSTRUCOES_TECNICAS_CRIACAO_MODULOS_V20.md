# Instruções técnicas para criação de módulos - v20

Este documento define um padrão de desenvolvimento modular para o painel de avaliação ex ante de benefícios tributários da Paraíba. O objetivo é permitir que diferentes pesquisadores desenvolvam indicadores, visualizações e rotinas de auditoria de forma independente, com baixo risco de interferência na estrutura central da plataforma.

## 1. Princípio geral

A plataforma deve ser organizada por módulos independentes. Cada módulo deve ter uma responsabilidade clara, entradas conhecidas, saída padronizada, documentação mínima e testes próprios.

Um novo módulo não deve exigir reescrita da estrutura central do painel. Ele deve ser acoplado por registro, isto é, por declaração em arquivos de configuração e por uma interface técnica comum.

Na v20, o ponto central de configuração é:

`config/painel_v20.py`

Nele, cada módulo é declarado com `id`, `ativo`, `secao`, `tipo_visual` e `posicao`.

## 2. Tipos de módulos

A plataforma deve reconhecer, no mínimo, cinco tipos de módulos.

## 2.0. Arquitetura de duas camadas de visualização

A v20 adota uma lógica de duas camadas para controlar o que aparece no painel.

### Primeira camada - macroelementos do painel

A primeira camada controla as abas ou grandes blocos de navegação.

Exemplos:

- Impactos econômicos;
- Impactos tributários;
- Checklist FAIN;
- Memória técnica;
- Documento da análise;
- Parâmetros.

Esses macroelementos devem ser tratados como módulos do tipo `aba`.

Exemplo:

```python
{
    "id": "indicadores_tributarios",
    "ativo": True,
    "secao": "impactos_tributarios",
    "tipo_visual": "aba",
    "posicao": 1,
}
```

Se `ativo` for `False`, a aba inteira é retirada da interface.

### Segunda camada - indicadores dentro das abas

A segunda camada controla os indicadores, cards, tabelas, mapas e tiles que aparecem dentro de cada aba.

Exemplos:

- dentro de Impactos econômicos: impacto no emprego, impacto na produção, valor adicionado, mapa territorial;
- dentro de Impactos tributários: renúncia fiscal, tributos indiretos, receita tributária, DIFAL/ST;
- dentro de Checklist FAIN: itens de elegibilidade, pendências, itens críticos e documentação.

Exemplo:

```python
{
    "id": "difal_st",
    "ativo": False,
    "secao": "impactos_tributarios",
    "tipo_visual": "tabela",
    "posicao": 50,
}
```

Nesse caso, a aba de Impactos tributários pode continuar ativa, mas o bloco DIFAL/ST não será exibido.

### Regra de leitura

A regra prática é:

- se a aba estiver inativa, seus indicadores internos não aparecem para o usuário;
- se a aba estiver ativa, cada indicador interno pode ser ligado ou desligado individualmente;
- um indicador inativo continua documentado e auditável, mas não aparece na interface;
- essa lógica permite criar versões diferentes do painel sem apagar código.

### Exemplo de configuração combinada

Neste exemplo, a aba tributária aparece, mas o módulo DIFAL/ST é ocultado:

```python
{
    "id": "indicadores_tributarios",
    "ativo": True,
    "secao": "impactos_tributarios",
    "tipo_visual": "aba",
    "posicao": 1,
},
{
    "id": "difal_st",
    "ativo": False,
    "secao": "impactos_tributarios",
    "tipo_visual": "tabela",
    "posicao": 50,
}
```

Neste outro exemplo, toda a aba tributária é ocultada:

```python
{
    "id": "indicadores_tributarios",
    "ativo": False,
    "secao": "impactos_tributarios",
    "tipo_visual": "aba",
    "posicao": 1,
}
```

Nesse segundo caso, não é necessário desligar um por um os indicadores tributários internos para fins de exibição, pois o macroelemento já foi removido da interface.

### 2.1. Módulo de indicador

Calcula ou descreve um indicador substantivo.

Exemplos:

- impacto no emprego;
- impacto no valor adicionado;
- renúncia fiscal estimada;
- neutralidade fiscal;
- risco de rent seeking;
- aderência ao FAIN;
- absorção territorial dos impactos.

Cada indicador deve possuir um arquivo próprio em:

`mip_pb_v20/indicadores/modulos/`

### 2.2. Módulo de visualização

Define como um resultado será apresentado ao usuário.

Exemplos:

- card;
- tile;
- tabela;
- mapa;
- alerta;
- bloco recolhível;
- aba.

Os tipos visuais disponíveis devem ser registrados em:

`mip_pb_v20/componentes/`

### 2.3. Módulo de dados

Prepara, valida ou transforma bases usadas pelos indicadores.

Exemplos:

- tradutor CNAE-SCN;
- matriz de comércio intermunicipal;
- REGIC;
- PIB municipal;
- emprego formal municipal;
- multiplicadores da MIP.

O módulo de dados deve explicitar a fonte, a data, as colunas usadas, as transformações e eventuais limitações.

### 2.4. Módulo normativo ou de conformidade

Traduz regras administrativas ou legais em checklist operacional.

Exemplos:

- conformidade com FAIN;
- documentação mínima exigida;
- limite máximo de benefício;
- enquadramento por instrumento de concessão.

Esse tipo de módulo deve deixar claro que o painel apoia a análise, mas não substitui parecer jurídico nem decisão administrativa.

### 2.5. Módulo de auditoria

Produz rastreabilidade, logs, memória de cálculo, metadados e testes de consistência.

Exemplos:

- lista de módulos ativos;
- fontes utilizadas;
- parâmetros e pesos;
- data de geração;
- hash dos insumos;
- versão do motor de cálculo.

## 3. Contrato mínimo de um indicador

Todo indicador deve possuir um arquivo próprio com a constante `INDICADOR`.

Exemplo:

```python
INDICADOR = {
    "id": "impacto_emprego",
    "nome": "Impacto no emprego",
    "familia": "multiplicadores",
    "fonte_calculo": "empregos diretos informados e multiplicador aberto de emprego",
    "descricao": "Empregos diretos e indiretos associados ao projeto.",
    "depende_de_campos": ["macrossegmento", "tipo_analise"],
    "depende_de_um_dos": [
        ["tru", "tru_com"],
        ["valor", "valor_com", "ret_producao_pleito_atendido"],
        ["empregos", "empregos_com", "ret_empregos_pleito"],
    ],
    "depende_de_dados": ["multiplicadores_abertos"],
}
```

Campos obrigatórios:

| Campo | Função |
|---|---|
| `id` | Identificador único do módulo. Deve coincidir com o nome do arquivo e com o `id` em `painel_v20.py`. |
| `nome` | Nome legível exibido em documentação e memória técnica. |
| `familia` | Grupo conceitual do indicador: multiplicadores, território, fiscal, conformidade etc. |
| `fonte_calculo` | Fonte ou lógica de cálculo usada pelo indicador. |
| `descricao` | Interpretação curta do indicador. |

Campos recomendados de dependência:

| Campo | Função |
|---|---|
| `depende_de_campos` | Lista de campos obrigatórios. Todos precisam existir e estar ativos em `config/campos_v20.py`. |
| `depende_de_um_dos` | Grupos alternativos. Em cada grupo, pelo menos um campo precisa estar ativo. |
| `depende_de_dados` | Fontes exigidas, declaradas em `config/fontes_dados_v20.py`. |
| `depende_de_modulos` | Outros módulos conceitualmente necessários, quando houver. |

Recomendação: o nome do arquivo deve ser igual ao `id`.

Exemplo:

`impacto_emprego.py`

deve conter:

```python
"id": "impacto_emprego"
```

## 4. Contrato mínimo de cálculo

Quando o indicador tiver cálculo próprio, ele deve ser implementado como função pura sempre que possível.

Padrão recomendado:

```python
def calcular(contexto: dict) -> dict:
    ...
    return {
        "id": "impacto_emprego",
        "valor": 1250,
        "unidade": "empregos",
        "status": "ok",
        "metadados": {
            "fonte": "MIP-PB",
            "versao": "v20",
        },
    }
```

Regras:

- a função deve receber entradas explícitas;
- a função não deve alterar variáveis globais;
- a função não deve escrever arquivos;
- a função não deve modificar outros módulos;
- a saída deve ser serializável em JSON;
- erros devem ser retornados de forma controlada, não escondidos.

## 5. Contrato mínimo de exibição

Um módulo só aparece no painel se houver:

1. indicador registrado em `mip_pb_v20/indicadores/modulos/`;
2. entrada correspondente em `config/painel_v20.py`;
3. bloco visual no HTML/JS com o mesmo `data-module-id`.

Exemplo no frontend:

```html
<div data-module-id="impacto_emprego" class="impact-tile">
  ...
</div>
```

O runtime:

`static/v20/module_registry.js`

usa esse `data-module-id` para ativar, ocultar e auditar o bloco.

## 6. Configuração no painel

Cada módulo deve ser declarado em:

`config/painel_v20.py`

Exemplo:

```python
{
    "id": "impacto_emprego",
    "ativo": True,
    "secao": "impactos_economicos",
    "tipo_visual": "tile",
    "posicao": 30,
}
```

### 6.1. Campo `ativo`

Controla se o módulo aparece na interface.

```python
"ativo": True
```

O módulo aparece.

```python
"ativo": False
```

O módulo é ocultado, mas permanece registrado para auditoria.

No caso de módulos do tipo `aba`, `ativo=False` remove o macroelemento inteiro da navegação.

No caso de módulos internos, como `card`, `tile`, `tabela` ou `mapa`, `ativo=False` remove apenas aquele indicador específico dentro da aba.

### 6.2. Campo `secao`

Define a área conceitual do painel.

Seções recomendadas:

- `impactos_economicos`;
- `impactos_tributarios`;
- `conformidade`;
- `territorio`;
- `auditoria`;
- `documentos`;
- `parametros`.

### 6.3. Campo `tipo_visual`

Define a intenção de apresentação.

Tipos recomendados:

- `card`: síntese interpretativa;
- `tile`: número compacto;
- `tabela`: decomposição ou memória;
- `mapa`: resultado territorial;
- `aba`: camada principal de navegação;
- `alerta`: mensagem crítica;
- `detalhe`: conteúdo recolhível.

### 6.4. Campo `posicao`

Define a ordem de apresentação dentro da seção.

Recomendação: usar intervalos de 10.

Exemplo:

```python
"posicao": 10
"posicao": 20
"posicao": 30
```

Isso permite inserir módulos intermediários sem renumerar tudo.

## 7. Testes obrigatórios para inclusão de módulo

Nenhum módulo novo deve ser incorporado sem testes mínimos.

### 7.1. Teste de registro

Verifica se o módulo declarado em `painel_v20.py` possui arquivo próprio em:

`mip_pb_v20/indicadores/modulos/`

### 7.2. Teste de contrato

Verifica se o módulo possui os campos obrigatórios:

- `id`;
- `nome`;
- `familia`;
- `fonte_calculo`;
- `descricao`.

### 7.3. Teste de consistência de cálculo

Quando houver cálculo:

- testar cenário com dados válidos;
- testar cenário com dados ausentes;
- testar cenário com valor zero;
- testar cenário extremo;
- testar se a saída é JSON serializável.

### 7.4. Teste de não regressão

Verifica se a inclusão do módulo não alterou indevidamente:

- payload principal;
- navegação das abas;
- geração do HTML standalone;
- funcionamento dos módulos já existentes;
- memória técnica;
- exportação do relatório.

### 7.5. Teste visual mínimo

Quando o módulo tiver exibição:

- verificar se o `data-module-id` existe;
- verificar se `ativo=False` oculta o bloco;
- verificar se `ativo=True` exibe o bloco;
- verificar se o bloco aparece na seção correta;
- verificar se a posição relativa é respeitada.

## 8. Critérios de aceite de um novo módulo

Um módulo só deve ser aceito quando cumprir os seguintes critérios:

1. possui arquivo próprio;
2. possui metadados completos;
3. está declarado em `painel_v20.py`;
4. possui bloco visual ou saída documentada;
5. passa nos testes automatizados;
6. não altera resultados de outros módulos sem justificativa explícita;
7. registra fontes e limitações;
8. pode ser desligado sem quebrar o painel;
9. aparece na memória técnica ou no registro modular;
10. possui interpretação compreensível para o usuário final.
11. quando for indicador interno, está associado a uma aba ou seção já existente;
12. quando for macroelemento, deixa claro quais indicadores internos pertencem a ele.

## 9. Fluxo recomendado de trabalho para pesquisadores

Cada pesquisador deve trabalhar em uma tarefa bem delimitada.

### Passo 1 - Definir o módulo

Descrever:

- objetivo;
- pergunta que o indicador responde;
- fonte de dados;
- fórmula ou lógica;
- interpretação;
- limitações.

### Passo 2 - Criar o arquivo do indicador

Criar arquivo em:

`mip_pb_v20/indicadores/modulos/`

### Passo 3 - Implementar cálculo, se houver

Preferir função pura, sem efeitos colaterais.

### Passo 4 - Declarar no painel

Editar:

`config/painel_v20.py`

### Passo 5 - Criar ou marcar visualização

Adicionar ou reaproveitar bloco com:

```html
data-module-id="id_do_modulo"
```

### Passo 6 - Testar

Rodar:

```bash
./rodar_testes_v20.command
```

### Passo 7 - Documentar

Atualizar:

- descrição do indicador;
- fonte;
- limitação;
- memória técnica, se necessário.

## 10. O que um módulo não deve fazer

Um módulo não deve:

- alterar diretamente pesos globais sem registro;
- modificar variáveis globais fora do contrato;
- depender de ordem implícita de execução sem declarar dependência;
- buscar dados externos sem controle de versão;
- escrever arquivos durante o cálculo;
- alterar o layout central do painel sem necessidade;
- duplicar cálculo já existente;
- esconder hipóteses metodológicas;
- misturar cálculo econômico com julgamento normativo sem separar as etapas.

## 11. Dependências entre módulos

Quando um módulo depende de campos, bases ou outro módulo, essa dependência deve ser declarada no próprio `INDICADOR`.

Exemplo:

```python
INDICADOR = {
    "id": "custo_por_emprego",
    "nome": "Custo por emprego",
    "familia": "eficiencia",
    "fonte_calculo": "renúncia fiscal estimada e empregos diretos/indiretos",
    "descricao": "Mostra quanto de renúncia corresponde a cada posto de trabalho.",
    "depende_de_um_dos": [
        ["renuncia_pct", "renuncia_pct_com", "ret_beneficio_pleiteado_pct"],
        ["valor", "valor_com", "ret_producao_pleito_atendido"],
        ["empregos", "empregos_com", "ret_empregos_pleito"],
    ],
    "depende_de_dados": ["multiplicadores_abertos"],
}
```

Isso facilita auditoria e evita que um módulo seja ligado sem suas bases mínimas.

O arquivo `validar_modulos_v20.py` deve ser executado sempre que um campo, base, etapa ou indicador for alterado.

## 12. Modularidade e governança

A modularização melhora a governança do projeto porque:

- permite divisão clara de tarefas entre pesquisadores;
- reduz conflito entre arquivos;
- permite auditoria independente de cada indicador;
- facilita testes unitários;
- reduz risco de regressão;
- permite versões diferentes do painel para públicos diferentes;
- preserva a rastreabilidade das decisões metodológicas.

## 13. Exemplo de checklist para pull request

Antes de incorporar um novo módulo, verificar:

- [ ] O indicador tem arquivo próprio.
- [ ] O `id` do arquivo coincide com o `id` em `painel_v20.py`.
- [ ] O módulo possui descrição e fonte de cálculo.
- [ ] O módulo pode ser desligado com `ativo=False`.
- [ ] Se for uma aba, sua desativação remove o macroelemento da navegação.
- [ ] Se for indicador interno, sua desativação remove apenas aquele bloco dentro da aba.
- [ ] O painel é regenerado sem erro.
- [ ] O HTML standalone abre normalmente.
- [ ] Os testes automatizados passam.
- [ ] A memória técnica registra o módulo.
- [ ] O módulo não altera resultados existentes sem justificativa.
- [ ] A interpretação é clara para auditor fiscal não especialista em economia.

## 14. Diretriz de linguagem para documentação do indicador

Cada indicador deve ter duas descrições:

1. descrição técnica, voltada à equipe de pesquisa;
2. descrição interpretativa, voltada ao auditor.

Exemplo técnico:

> O indicador é calculado pela razão entre a renúncia fiscal estimada e o total de empregos diretos e indiretos associados ao choque de produção.

Exemplo interpretativo:

> Mostra quanto o Estado estaria abrindo mão de arrecadação para cada emprego associado ao projeto. Quanto menor o valor, maior a eficiência fiscal do benefício em termos de emprego.

## 15. Direção para próximas versões

A v20 já introduz o registro modular. Uma próxima versão pode aprofundar a arquitetura com:

- funções de cálculo totalmente separadas por indicador;
- schemas formais para entrada e saída;
- testes unitários por módulo;
- renderizadores independentes por tipo visual;
- sistema de dependências entre indicadores;
- painel gerado integralmente a partir da configuração;
- documentação automática dos indicadores ativos.
