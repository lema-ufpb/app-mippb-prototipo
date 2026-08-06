window.PESOS_PONTUACAO = {
  versao: "1",
  data_vigencia: "2026-06-10",
  aprovado_por: "Configuração inicial do protótipo",
  pesos: {
    producao: 0.5,
    va: 0.5,
    empregoMult: 0.5,
    tributosMult: 0.5,
    beneficioCusto: 1.5,
    empregoDireto: 1.5,
    comprasLocais: 1.5,
    tecnologia: 1.0,
    territorioQl: 1.0,
    abrangenciaMunicipal: 1.0,
    territorioBase: 0.5,
    desconcentracaoEconomica: 0.75,
    tempoProjeto: 0.75,
    ativosIrrecuperaveis: 0.75,
    destino: 0.5,
    substituicao: 0.5,
    produtoNovo: 0.75,
    estrategia: 0.75
  },
  limiares: {
    verde: 7.0,
    laranja: 5.0,
    vermelho: 0.0
  },
  parametros_choque: {
    margem_comercio_servicos_transporte_distribuicao: 0.20,
    percentual_indireto_acumulado: 0.50
  },
  referencias: {
    mip: "mip_pb_v1",
    rais: "rais_pb_municipio_scn_v1",
    tradutores: "tradutores_v1"
  }
};
