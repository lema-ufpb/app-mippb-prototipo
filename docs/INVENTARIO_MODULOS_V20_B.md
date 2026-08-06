# Inventário de módulos V20_B

Este inventário descreve a variante **V20_B** do painel de avaliação ex ante de benefícios tributários da SEFAZ-PB. A versão V20 completa foi preservada em `INVENTARIO_MODULOS_V20.md` e nos arquivos originais da V20.

A V20_B é uma versão deliberadamente mais enxuta. Ela suspende a exibição dos módulos tributários e do Checklist FAIN para permitir uma revisão metodológica mais cuidadosa do cálculo da renúncia fiscal após o benefício tributário.

## Arquivos principais da V20_B

| Arquivo | Função |
|---|---|
| `formulario_avaliacao_ex_ante_v20_b_standalone.html` | Formulário V20_B autocontido, pronto para abrir no navegador. |
| `formulario_avaliacao_ex_ante_v20_b.html` | Cópia HTML da V20_B com os mesmos recursos embutidos do standalone. |
| `gerar_formulario_avaliacao_ex_ante_v20_b.py` | Gerador específico da variante V20_B. |
| `config/painel_v20_b.py` | Define quais módulos aparecem ou ficam inativos na V20_B. |
| `config/etapas_v20_b.py` | Registra a etapa tributária como inativa para rastreabilidade. |
| `dados/painel_mip_pb_v20_b.js` | Registro modular exportado para o frontend da V20_B. |
| `dados/payload_mip_pb_v20_b.json` | Payload completo usado pela V20_B. |
| `dados/payload_mip_pb_v20_b.js` | Payload em formato JavaScript para uso pelo painel. |
| `resultados/dados_formulario_avaliacao_ex_ante_v20_b.json` | Cópia auditável do payload gerado. |
| `logs/geracao_v20_b.log` | Log da geração da variante V20_B. |

## Mudanças em relação à V20 completa

| Elemento | Situação na V20 | Situação na V20_B | Motivo |
|---|---:|---:|---|
| Aba Impactos tributários | Ativa | Removida da navegação e inativa no registro modular | Suspender a leitura tributária até revisão da metodologia de renúncia. |
| Aba Checklist FAIN | Ativa | Removida da navegação e inativa no registro modular | Separar temporariamente conformidade normativa da avaliação econômica. |
| Etapa 4 de entrada de dados | Ativa | Removida do fluxo visual; wizard reduzido para 3 etapas | Retirar campos de DIFAL/ST e parâmetros tributários da entrada principal. |
| Card Custo por emprego | Ativo em impactos econômicos e tributários | Inativo | Evitar indicador dependente da renúncia enquanto a metodologia fiscal é revisada. |
| Motor de cálculo tributário | Presente | Preservado no código, mas sem exibição decisória | Garantir recuperação futura sem perda de funcionalidade. |

## Etapas visíveis de entrada de dados

| Etapa | Nome | Situação na V20_B |
|---:|---|---|
| 1 | Empresa e leitura documental | Ativa |
| 2 | Setor e choque econômico | Ativa |
| 3 | Qualificação, investimento e permanência | Ativa |
| 4 | Parâmetros tributários e DIFAL/ST | Removida da interface |

Observação: a etapa tributária continua registrada como `ativo = False` em `config/etapas_v20_b.py`. Isso preserva a memória técnica dos campos existentes, mas impede que a etapa apareça no fluxo V20_B.

## Módulos ativos

| ID do módulo | Seção | Tipo visual | Função |
|---|---|---|---|
| `setor_chave` | impactos_economicos | card | Indica se o setor é chave na estrutura produtiva. |
| `absorcao_territorial` | impactos_economicos | card | Resume a capacidade territorial de absorção dos impactos indiretos. |
| `risco_rent_seeking` | impactos_economicos | card | Sinaliza risco de benefício pouco produtivo. |
| `retencao_impactos_pb` | impactos_economicos | card | Indica a retenção estimada dos impactos na Paraíba. |
| `impacto_producao` | impactos_economicos | tile | Mostra impacto esperado na produção. |
| `impacto_valor_adicionado` | impactos_economicos | tile | Mostra impacto esperado no valor adicionado. |
| `impacto_emprego` | impactos_economicos | tile | Mostra empregos diretos e indiretos estimados. |
| `impacto_massa_salarial` | impactos_economicos | tile | Mostra massa salarial anual estimada. |
| `empregos_implantacao` | impactos_economicos | tile | Estima empregos associados à fase de implantação. |
| `mapa_territorial` | impactos_economicos | mapa | Exibe municípios com maior capacidade potencial de absorção. |
| `memoria_tecnica` | auditoria | aba | Mantém memória de cálculo, parâmetros e logs. |
| `documento_analise` | documentos | aba | Mantém geração de análise textual e documento editável. |
| `parametros` | parametros | aba | Mantém parâmetros técnicos e serviço local de IA. |

## Módulos inativos na V20_B

| ID do módulo | Seção | Motivo da inativação |
|---|---|---|
| `indicadores_tributarios` | impactos_tributarios | Aba tributária suspensa. |
| `renuncia_fiscal` | impactos_tributarios | Metodologia de renúncia será revisada. |
| `tributos_indiretos` | impactos_tributarios | Leitura tributária suspensa. |
| `receita_tributaria` | impactos_tributarios | Leitura tributária suspensa. |
| `difal_st` | impactos_tributarios | Cenário DIFAL/ST suspenso. |
| `checklist_fain` | conformidade | Checklist normativo suspenso da apresentação. |
| `custo_por_emprego` | impactos_economicos | Indicador dependente da renúncia fiscal. |

## Campos tributários retirados da entrada visual

Os campos abaixo não aparecem na etapa de entrada da V20_B:

| Campo | Uso original |
|---|---|
| `renuncia_maxima_permitida` | Teto de renúncia considerado no cálculo fiscal. |
| `ext_uf_alternativa` | UF alternativa de produção no cenário externo. |
| `ext_pct_vendas_pb` | Parcela do mercado da Paraíba abastecida de fora. |
| `ext_pct_captura_entrada` | Receita capturada via DIFAL/ST/entrada. |
| `ext_prob_abastecimento_externo` | Probabilidade de abastecimento externo se o benefício for negado. |
| Composição fiscal por produto | Estimativa de ICMS direto, DIFAL/ST e composição por NCM. |

## O que continua sendo calculado

A V20_B continua calculando os impactos econômicos derivados do choque de produção/faturamento:

- impacto total sobre a produção;
- impacto sobre valor adicionado;
- impacto sobre empregos diretos e indiretos;
- impacto sobre massa salarial;
- empregos na implantação decorrentes do valor previsto em obras;
- classificação de setor-chave;
- risco de benefício pouco produtivo;
- absorção territorial dos impactos indiretos;
- retenção estimada dos impactos na Paraíba;
- mapa territorial de capacidade potencial de absorção.

## O que não deve ser interpretado na V20_B

Na V20_B, não se deve interpretar como resultado decisório:

- renúncia fiscal estimada;
- retorno tributário;
- neutralidade fiscal;
- recuperação indireta de tributos;
- DIFAL/ST versus produção local;
- custo fiscal por emprego;
- aderência ao Checklist FAIN.

Esses componentes permanecem como código recuperável, mas foram retirados da interface para evitar leitura prematura enquanto a metodologia fiscal está em revisão.

## Como gerar novamente a V20_B

Na pasta do projeto:

```bash
python3 gerar_formulario_avaliacao_ex_ante_v20_b.py
```

Para apenas validar o payload e o registro modular:

```bash
python3 gerar_formulario_avaliacao_ex_ante_v20_b.py --validate-only
```

## Como recuperar a V20 completa

Abra ou gere novamente os arquivos da V20 original:

```bash
python3 gerar_formulario_avaliacao_ex_ante_v20.py --single-file
```

O inventário completo permanece em:

```text
INVENTARIO_MODULOS_V20.md
```

## Observação de governança

A V20_B deve ser lida como uma variante econômica do painel. Ela é útil para apresentação e discussão da lógica produtiva e territorial do benefício, mas não substitui uma avaliação fiscal completa. A decisão sobre renúncia deve aguardar a revisão dos módulos tributários, especialmente cálculo da renúncia efetiva, neutralidade fiscal, DIFAL/ST e adequação aos instrumentos legais de concessão.
