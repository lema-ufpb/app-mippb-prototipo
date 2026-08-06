"""Fontes de dados disponíveis para os módulos da v20."""

DADOS = [
    {"id": "multiplicadores_abertos", "nome": "Multiplicadores abertos da MIP", "ativo": True, "origem": "resultados/multiplicadores_modelos_aberto_fechado.xlsx"},
    {"id": "indicadores_setoriais", "nome": "Indicadores setoriais da MIP", "ativo": True, "origem": "resultados/indicadores_setoriais_go.csv"},
    {"id": "matriz_leontief", "nome": "Matriz de Leontief", "ativo": True, "origem": "resultados/matriz_leontief_go.csv"},
    {"id": "municipios", "nome": "Municípios da Paraíba", "ativo": True, "origem": "payload gerado"},
    {"id": "emprego_municipal", "nome": "Emprego formal municipal compatibilizado", "ativo": True, "origem": "arquivos auxiliares/emprego_cnae_municipio_pb_compatibilizado_scn.xlsx"},
    {"id": "tradutor_cnae_tru", "nome": "Tradutor CNAE-TRU/SCN", "ativo": True, "origem": "arquivos auxiliares/Tradutor_CNAE_TRU.xls"},
    {"id": "ncm_tecnologico", "nome": "Conteúdo tecnológico por NCM", "ativo": True, "origem": "arquivos auxiliares/tradutor_ncm_conteudo_tecnologico.xlsx"},
    {"id": "ncm_scn", "nome": "Tradutor NCM-SCN", "ativo": True, "origem": "arquivos auxiliares/Tradutor NCM x SCN (5 dígitos.xls"},
    {"id": "regic", "nome": "REGIC-PB", "ativo": True, "origem": "arquivos auxiliares/Regic_pb.xlsx"},
    {"id": "distancias_rodoviarias", "nome": "Distâncias rodoviárias entre municípios", "ativo": True, "origem": "arquivos auxiliares/distancias_rodoviarias_pb_distbrasil.parquet"},
    {"id": "pib_municipal", "nome": "PIB municipal", "ativo": True, "origem": "arquivos auxiliares/PIB_PB_2021.xlsx"},
    {"id": "matriz_comercio_intermunicipal", "nome": "Matriz de comércio intermunicipal PB-SCN", "ativo": True, "origem": "arquivos auxiliares/matriz_comercio_pb_scn.parquet"},
    {"id": "mapa_svg", "nome": "Mapa SVG da Paraíba", "ativo": True, "origem": "resultados/graficos/mapa_emprego_municipios_pb.svg"},
    {"id": "pesos_pontuacao", "nome": "Pesos de pontuação", "ativo": True, "origem": "config/pesos_pontuacao_v1.js"},
    {"id": "parametros_indices", "nome": "Parâmetros de índices compostos", "ativo": True, "origem": "config/parametros_indices_v20.json"},
    {"id": "fiscal_produtos_declarados", "nome": "Composição fiscal declarada por produto", "ativo": True, "origem": "entrada do formulário"},
    {"id": "ia_local", "nome": "Serviço local de IA", "ativo": True, "origem": "servico_ia_contratos.py"},
    {"id": "base_cnpj_rf", "nome": "Base local de CNPJ da Receita Federal", "ativo": True, "origem": "dados/cnpj_rf_pb.sqlite, quando preparada"},
]
