# Dicionário de campos e dependências - v20

Este documento explica como ler o dicionário técnico de campos, fontes de dados e etapas da v20.

Os arquivos canônicos são:

- `config/campos_v20.py`
- `config/fontes_dados_v20.py`
- `config/etapas_v20.py`

## 1. Para que serve

O dicionário de campos informa quais dados podem ser coletados pelo formulário e quais indicadores dependem deles. Isso permite montar versões diferentes do painel sem deixar indicadores órfãos.

Exemplo: se o campo `investimento_obras` for retirado, o indicador `empregos_implantacao` deixa de ter insumo suficiente. O validador acusa essa dependência antes de gerar a versão final.

## 2. Estrutura de um campo

Cada campo possui este formato:

```python
{
    "id": "valor",
    "rotulo": "Produção esperada com benefício",
    "tipo": "moeda",
    "etapa": "macrosegmento_industria",
    "ativo": True,
    "macrosegmentos": ["industria"],
    "alimenta": ["impacto_producao", "impacto_valor_adicionado", "impacto_emprego", "renuncia_fiscal"],
}
```

| Item | Significado |
|---|---|
| `id` | Nome técnico usado no HTML, JavaScript, payload e testes. |
| `rotulo` | Nome exibido ou documentado para o usuário. |
| `tipo` | Tipo de entrada: texto, número, moeda, percentual, select, arquivo etc. |
| `etapa` | Etapa ou subetapa em que o campo aparece. |
| `ativo` | Se `False`, o campo é tratado como indisponível para indicadores. |
| `macrosegmentos` | Segmentos em que o campo faz sentido, como indústria ou comércio. |
| `alimenta` | Indicadores que usam ou podem usar o campo. |

## 3. Grupos principais de campos

### Empresa e processo

Campos para identificar o pleiteante e o processo administrativo:

- `cnpj`
- `protocolo`
- `razao_social`
- `nome_fantasia`
- `porte_empresa`
- `uf_origem`
- `situacao_cadastral`
- `tipo_analise`
- `contrato_file`

### Choque econômico - indústria

Campos que permitem calcular a variação de produção no setor industrial:

- `cnae`
- `tru`
- `municipio`
- `valor_sem_beneficio`
- `valor`
- `renuncia_pct`
- `meta_recuperacao_tributos`
- `empregos`
- `salario`

### Choque econômico - comércio

Campos equivalentes para comércio, com faturamento e margem:

- `cnae_com`
- `tru_com`
- `municipio_com`
- `valor_sem_beneficio_com`
- `valor_com`
- `com_margem`
- `renuncia_pct_com`
- `meta_recuperacao_tributos_com`
- `empregos_com`
- `salario_com`
- `com_origem_produtos`
- `com_destino_vendas`

### Empresa existente ou retenção

Campos usados quando o problema é avaliar manutenção de empresa já instalada:

- `ret_producao_atual`
- `ret_producao_beneficio_atual`
- `ret_beneficio_atual_pct`
- `ret_producao_pleito_atendido`
- `ret_producao_sem_acordo`
- `ret_beneficio_pleiteado_pct`
- `ret_prob_saida_pct`
- `ret_empregos_atuais`
- `ret_empregos_pleito`
- `ret_empregos_sem_acordo`
- `ret_meta_recuperacao_tributos`
- `ret_evidencia_saida`
- `ret_ideia_difal`

### Qualificação, investimento e permanência

Campos usados para caracterizar a qualidade econômica do projeto:

- `investimento_privado`
- `investimento_publico`
- `investimento_terreno_imovel`
- `investimento_obras`
- `investimento_outros`
- `imovel_tipo`
- `equipamentos_adquiridos_pct`
- `ativos_recuperaveis_pct`
- `incentivo_locacional`
- `permanencia_anos`
- `local`
- `destino`
- `substitui`
- `novo_produto`
- `estrategico`
- `produtos`
- `descricao_empresario`
- `adicionalidade`

### Tributário, DIFAL/ST e FAIN

Campos que alimentam a análise tributária e de conformidade:

- `renuncia_maxima_permitida`
- `ext_uf_alternativa`
- `ext_pct_vendas_pb`
- `ext_pct_captura_entrada`
- `ext_prob_abastecimento_externo`
- campos `fain_*`

### Parâmetros

Campos editáveis que alteram hipóteses de simulação:

- `impact_share`
- `retorno_horizonte`
- `retorno_crescimento`
- `retorno_desconto`
- `retorno_meses_salario`
- `ia_service_url`

## 4. Fontes de dados declaradas

As fontes ficam em `config/fontes_dados_v20.py`.

Exemplos:

- `multiplicadores_abertos`: multiplicadores da MIP;
- `indicadores_setoriais`: setor-chave, ligações e índices estruturais;
- `emprego_municipal`: emprego formal por município e setor;
- `regic`: vínculos territoriais da REGIC;
- `matriz_comercio_intermunicipal`: fluxos comerciais PB-SCN;
- `fiscal_produtos_declarados`: composição fiscal informada no próprio formulário;
- `ia_local`: serviço local de IA.

## 5. Etapas declaradas

As etapas ficam em `config/etapas_v20.py`.

Esse arquivo informa a ordem conceitual das entradas e quais campos pertencem a cada etapa. Ele não deve conter fórmulas econômicas. Sua função é organizar coleta e dependências.

## 6. Regra prática para novos campos

Quando criar um campo novo:

1. inclua o campo em `config/campos_v20.py`;
2. indique em qual etapa ele aparece;
3. informe quais indicadores ele alimenta;
4. inclua o campo na lista da etapa em `config/etapas_v20.py`;
5. se algum indicador depende dele, declare isso no arquivo do indicador;
6. rode `python3 validar_modulos_v20.py`.

## 7. Regra prática para retirar campos

Para testar uma versão sem determinado campo, prefira:

```python
"ativo": False
```

em vez de apagar a linha. Isso mantém a trilha de auditoria. Se algum indicador depender do campo, o validador informará qual módulo ficou bloqueado.
