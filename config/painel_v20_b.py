"""Configuração modular do painel V20_B.

Variante enxuta da V20 para suspender temporariamente a exibição de resultados
tributários, Checklist FAIN e custo fiscal por emprego enquanto a metodologia
de renúncia fiscal após o benefício é revisada.
"""

PAINEL = [
    {
        "id": "setor_chave",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "card",
        "posicao": 1,
    },
    {
        "id": "absorcao_territorial",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "card",
        "posicao": 2,
    },
    {
        "id": "risco_rent_seeking",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "card",
        "posicao": 3,
    },
    {
        "id": "custo_por_emprego",
        "ativo": False,
        "secao": "impactos_economicos",
        "tipo_visual": "card",
        "posicao": 4,
    },
    {
        "id": "retencao_impactos_pb",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "card",
        "posicao": 4,
    },
    {
        "id": "impacto_producao",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "tile",
        "posicao": 5,
    },
    {
        "id": "impacto_valor_adicionado",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "tile",
        "posicao": 6,
    },
    {
        "id": "impacto_emprego",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "tile",
        "posicao": 7,
    },
    {
        "id": "impacto_massa_salarial",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "tile",
        "posicao": 8,
    },
    {
        "id": "empregos_implantacao",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "tile",
        "posicao": 9,
    },
    {
        "id": "mapa_territorial",
        "ativo": True,
        "secao": "impactos_economicos",
        "tipo_visual": "mapa",
        "posicao": 10,
    },
    {
        "id": "indicadores_tributarios",
        "ativo": False,
        "secao": "impactos_tributarios",
        "tipo_visual": "aba",
        "posicao": 1,
    },
    {
        "id": "renuncia_fiscal",
        "ativo": False,
        "secao": "impactos_tributarios",
        "tipo_visual": "card",
        "posicao": 2,
    },
    {
        "id": "tributos_indiretos",
        "ativo": False,
        "secao": "impactos_tributarios",
        "tipo_visual": "card",
        "posicao": 3,
    },
    {
        "id": "receita_tributaria",
        "ativo": False,
        "secao": "impactos_tributarios",
        "tipo_visual": "card",
        "posicao": 4,
    },
    {
        "id": "difal_st",
        "ativo": False,
        "secao": "impactos_tributarios",
        "tipo_visual": "tabela",
        "posicao": 5,
    },
    {
        "id": "checklist_fain",
        "ativo": False,
        "secao": "conformidade",
        "tipo_visual": "aba",
        "posicao": 1,
    },
    {
        "id": "memoria_tecnica",
        "ativo": True,
        "secao": "auditoria",
        "tipo_visual": "aba",
        "posicao": 1,
    },
    {
        "id": "documento_analise",
        "ativo": True,
        "secao": "documentos",
        "tipo_visual": "aba",
        "posicao": 1,
    },
    {
        "id": "parametros",
        "ativo": True,
        "secao": "parametros",
        "tipo_visual": "aba",
        "posicao": 1,
    },
]
