# Guia de tipo visual e posição - v20

Este arquivo explica como preencher os campos `tipo_visual`, `secao` e `posicao` no arquivo:

`config/painel_v20.py`

O objetivo é permitir que o painel seja reorganizado sem alterar diretamente o HTML, o JavaScript principal ou os cálculos.

## Estrutura de cada módulo

Cada item do `PAINEL` segue este padrão:

```python
{
    "id": "impacto_emprego",
    "ativo": True,
    "secao": "impactos_economicos",
    "tipo_visual": "tile",
    "posicao": 8,
}
```

## Campo `id`

É o identificador único do indicador ou módulo.

O `id` precisa corresponder a um arquivo em:

`mip_pb_v20/indicadores/modulos/`

Exemplo:

`id = "impacto_emprego"` exige o arquivo:

`mip_pb_v20/indicadores/modulos/impacto_emprego.py`

## Campo `ativo`

Controla se o módulo aparece ou não no painel.

```python
"ativo": True
```

O módulo aparece.

```python
"ativo": False
```

O módulo não aparece na interface, mas continua registrado na memória técnica e auditável na configuração.

## Campo `secao`

Indica a grande área do painel em que o módulo pertence.

Seções usadas na v20:

| `secao` | Uso |
|---|---|
| `impactos_economicos` | Indicadores de retorno econômico, produtivo, territorial e de emprego |
| `impactos_tributarios` | Indicadores fiscais, renúncia, tributos indiretos, receita e DIFAL/ST |
| `conformidade` | Checklist normativo e aderência a instrumentos como o FAIN |
| `auditoria` | Memória técnica, logs, multiplicadores, pesos e parâmetros usados |
| `documentos` | Documento da análise e textos gerados pelo assistente |
| `parametros` | Configurações e pesos da plataforma |

## Campo `tipo_visual`

Define o formato visual esperado para o módulo.

Tipos visuais disponíveis na v20:

| `tipo_visual` | Quando usar | Exemplo |
|---|---|---|
| `card` | Para uma mensagem sintética de decisão, normalmente com conceito, nível, cor e breve interpretação | Setor-chave, risco de rent seeking, custo por emprego |
| `tile` | Para números diretos e compactos, geralmente em grades de impactos | Produção, VA, empregos, massa salarial |
| `tabela` | Para memória de cálculo, comparação, decomposição ou lista de critérios | DIFAL/ST, composição fiscal por produto, critérios da nota |
| `mapa` | Para visualização territorial | Mapa de absorção territorial |
| `aba` | Para ligar ou desligar uma camada inteira da plataforma | Impactos tributários, Checklist FAIN, Memória técnica |

## Diferença entre `card` e `tile`

Use `card` quando o auditor precisa ler uma interpretação:

```python
{
    "id": "risco_rent_seeking",
    "tipo_visual": "card",
}
```

Use `tile` quando o auditor precisa ver rapidamente um número:

```python
{
    "id": "impacto_emprego",
    "tipo_visual": "tile",
}
```

## Campo `posicao`

Controla a ordem de exibição dentro da mesma seção ou bloco visual.

Valores menores aparecem antes.

Exemplo:

```python
{
    "id": "setor_chave",
    "secao": "impactos_economicos",
    "tipo_visual": "card",
    "posicao": 1,
}
```

aparece antes de:

```python
{
    "id": "risco_rent_seeking",
    "secao": "impactos_economicos",
    "tipo_visual": "card",
    "posicao": 3,
}
```

## Recomendações práticas para `posicao`

Use intervalos para facilitar inserções futuras.

Exemplo:

```python
"posicao": 10
"posicao": 20
"posicao": 30
```

Assim, se depois for necessário inserir um novo indicador entre o primeiro e o segundo, basta usar:

```python
"posicao": 15
```

Na v20 atual, algumas posições ainda usam números sequenciais. Isso funciona normalmente, mas intervalos de 10 deixam a manutenção mais confortável.

## Como retirar uma aba inteira

Para retirar a aba de impactos tributários:

```python
{
    "id": "indicadores_tributarios",
    "ativo": False,
    "secao": "impactos_tributarios",
    "tipo_visual": "aba",
    "posicao": 1,
}
```

Depois regenere o painel.

## Como retirar apenas um indicador

Para retirar apenas o card de renúncia fiscal:

```python
{
    "id": "renuncia_fiscal",
    "ativo": False,
    "secao": "impactos_tributarios",
    "tipo_visual": "card",
    "posicao": 2,
}
```

A aba de impactos tributários continua existindo, mas esse módulo específico não aparece.

## Como adicionar um novo indicador

1. Criar um arquivo em:

`mip_pb_v20/indicadores/modulos/`

Exemplo:

`mip_pb_v20/indicadores/modulos/indice_inovacao.py`

2. Dentro dele, declarar:

```python
INDICADOR = {
    "id": "indice_inovacao",
    "nome": "Índice de inovação",
    "familia": "desenvolvimento",
    "fonte_calculo": "dados declarados pela empresa e parâmetros setoriais",
    "descricao": "Mede se o projeto incorpora P&D, capacitação, novos processos ou produtos.",
}
```

3. Incluir no `PAINEL`:

```python
{
    "id": "indice_inovacao",
    "ativo": True,
    "secao": "impactos_economicos",
    "tipo_visual": "card",
    "posicao": 35,
}
```

4. Criar a exibição correspondente no frontend com:

```html
data-module-id="indice_inovacao"
```

5. Regenerar o painel.

## Como regenerar depois de editar

No terminal:

```bash
cd "/Users/ignaciotavaresdearaujojunior/ProjetosLocais/MIP-PB/MODULO CONCESSOES/github_formulario_mip_pb_v20"
python3 gerar_formulario_avaliacao_ex_ante_v20.py --single-file
cp formulario_avaliacao_ex_ante_v20_standalone.html formulario_avaliacao_ex_ante.html
```

Depois abra:

`formulario_avaliacao_ex_ante.html`

## Observação importante

O campo `tipo_visual` informa a intenção visual e ajuda na validação e auditoria da arquitetura. Para que o módulo apareça corretamente, o bloco correspondente também precisa existir no HTML/JS com o mesmo `data-module-id`.

Na prática:

- `painel_v20.py` decide se o módulo entra.
- `mip_pb_v20/indicadores/modulos/` documenta o que o indicador significa.
- `static/v20/module_registry.js` aplica a configuração no navegador.
- O HTML/JS do painel precisa conter o bloco visual marcado com `data-module-id`.
