"""Etapas disponíveis no formulário V20_B.

A etapa tributária/DIFAL é mantida no contrato como etapa inativa para preservar
a rastreabilidade dos campos existentes, mas é removida da interface da V20_B.
"""

ETAPAS = [
    {
        "id": "empresa",
        "nome": "Empresa e processo",
        "ativo": True,
        "posicao": 10,
        "campos": ["cnpj", "protocolo", "razao_social", "nome_fantasia", "porte_empresa", "uf_origem", "situacao_cadastral", "tipo_analise", "contrato_file"],
    },
    {
        "id": "macrosegmento",
        "nome": "Macrosegmento e choque econômico",
        "ativo": True,
        "posicao": 20,
        "campos": ["macrossegmento"],
        "subetapas": [
            {
                "id": "macrosegmento_industria",
                "nome": "Indústria",
                "condicao": {"campo": "macrossegmento", "valor": "industria"},
                "campos": ["cnae", "tru", "municipio", "valor_sem_beneficio", "valor", "renuncia_pct", "meta_recuperacao_tributos", "empregos", "salario"],
            },
            {
                "id": "macrosegmento_comercio",
                "nome": "Comércio",
                "condicao": {"campo": "macrossegmento", "valor": "comercio"},
                "campos": ["cnae_com", "tru_com", "municipio_com", "valor_sem_beneficio_com", "valor_com", "com_margem", "renuncia_pct_com", "meta_recuperacao_tributos_com", "empregos_com", "salario_com", "com_origem_produtos", "com_destino_vendas"],
            },
            {
                "id": "retencao",
                "nome": "Empresa existente / retenção",
                "condicao": {"campo": "tipo_analise", "valor": "retencao"},
                "campos": ["ret_producao_atual", "ret_producao_beneficio_atual", "ret_beneficio_atual_pct", "ret_producao_pleito_atendido", "ret_producao_sem_acordo", "ret_beneficio_pleiteado_pct", "ret_prob_saida_pct", "ret_empregos_atuais", "ret_empregos_pleito", "ret_empregos_sem_acordo", "ret_meta_recuperacao_tributos", "ret_evidencia_saida", "ret_ideia_difal"],
            },
        ],
    },
    {
        "id": "qualificacao",
        "nome": "Qualificação, investimento e permanência",
        "ativo": True,
        "posicao": 30,
        "campos": ["investimento_privado", "investimento_publico", "investimento_terreno_imovel", "investimento_obras", "investimento_outros", "imovel_tipo", "equipamentos_adquiridos_pct", "ativos_recuperaveis_pct", "incentivo_locacional", "permanencia_anos", "local", "destino", "substitui", "novo_produto", "estrategico", "produtos", "descricao_empresario", "adicionalidade"],
    },
    {
        "id": "tributario_difal",
        "nome": "Parâmetros tributários e DIFAL/ST",
        "ativo": False,
        "posicao": 40,
        "campos": ["renuncia_maxima_permitida", "ext_uf_alternativa", "ext_pct_vendas_pb", "ext_pct_captura_entrada", "ext_prob_abastecimento_externo"],
    },
    {
        "id": "fain",
        "nome": "Checklist FAIN",
        "ativo": True,
        "posicao": 50,
        "campos": ["fain_enquadramento", "fain_incremento_capacidade_pct", "fain_projeto_cinep", "fain_atividade_elegivel", "fain_domicilio_pb", "fain_inscricao_icms", "fain_adimplencia", "fain_nao_simples", "fain_contrapartidas", "fain_sem_outro_beneficio", "fain_ncm_producao", "fain_certidao_sem_similar"],
    },
    {
        "id": "parametros",
        "nome": "Parâmetros técnicos",
        "ativo": True,
        "posicao": 60,
        "campos": ["impact_share", "retorno_horizonte", "retorno_crescimento", "retorno_desconto", "retorno_meses_salario", "ia_service_url"],
    },
]
