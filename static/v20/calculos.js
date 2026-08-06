// static/v20/calculos.js — fonte canônica (extraída e desminificada da v10).
// análises
function fiscalReturnAnalysis(valueBRL, tdc, tic, rp) {
  const h = Math.max(1, Math.min(30, Math.round(numInput('retorno_horizonte', 10)))),
    g = numInput('retorno_crescimento', 0) / 100,
    d = numInput('retorno_desconto', 6) / 100;
  const rows = [];
  let cn = 0,
    pvN = 0,
    pvT = 0,
    pvR = 0,
    payback = null;
  const flows = [0];
  for (let y = 1; y <= h; y++) {
    const sc = Math.pow(1 + g, y - 1),
      av = valueBRL * sc,
      dg = av * tdc,
      ind = av * tic,
      ren = dg * rp,
      dn = dg - ren,
      lt = ind + dn,
      net = lt - ren,
      pv = 1 / Math.pow(1 + d, y);
    cn += net;
    pvN += net * pv;
    pvT += lt * pv;
    pvR += ren * pv;
    flows.push(net);
    if (payback === null && cn >= 0 && pvR > 0) payback = y;
    rows.push({
      year: y,
      annualValue: av,
      renuncia: ren,
      liquidTax: lt,
      net: net,
      cumulativeNet: cn
    });
  }
  return {
    horizon: h,
    rows,
    pvNet: pvN,
    pvTax: pvT,
    pvRenuncia: pvR,
    taxRenunciaPV: pvR > 0 ? pvT / pvR : null,
    payback,
    irrValue: irr(flows)
  };
}

function neutralidadeFiscalAnalysis({
  valorCom,
  valorSem,
  incremento,
  renunciaPctAtual,
  tauMax,
  tdc,
  tic,
  metaRecuperacao
}) {
  const tauLimite = Math.max(0, Math.min(1, tauMax));
  const tauPleiteado = Math.max(0, Math.min(1, renunciaPctAtual));
  const tauAplicado = Math.min(tauPleiteado, tauLimite);
  const meta = Math.max(0, Math.min(1, metaRecuperacao ?? 1));
  const arrecadacaoAntesDireta = valorSem * tdc;
  const diretoPotencialCom = valorCom * tdc;
  const renunciaEstimada = diretoPotencialCom * tauAplicado;
  const arrecadacaoReferencia = renunciaEstimada * meta;
  const diretoLiquidoCom = diretoPotencialCom - renunciaEstimada;
  const tributosIndiretosIncremento = incremento * tic;
  const arrecadacaoComBeneficio = diretoLiquidoCom + tributosIndiretosIncremento;
  const diferencaFiscal = tributosIndiretosIncremento - arrecadacaoReferencia;
  const denomIncremento = tic - (tdc * tauAplicado * meta);
  const numeradorIncremento = valorSem * tdc * tauAplicado * meta;
  const incrementoNeutro = denomIncremento > 0 ? Math.max(0, numeradorIncremento / denomIncremento) : (Math.abs(numeradorIncremento) < 1e-12 && Math.abs(denomIncremento) < 1e-12 ? 0 : null);
  const valorComNeutro = incrementoNeutro === null ? null : valorSem + incrementoNeutro;
  const gapIncremento = incrementoNeutro === null ? null : incremento - incrementoNeutro;
  const renunciaMaximaNeutra = (meta <= 0) ? tauLimite : ((valorCom > 0 && tdc > 0) ? Math.max(0, Math.min(tauLimite, tributosIndiretosIncremento / (meta * valorCom * tdc))) : null);
  const coberturaIndiretaRenuncia = renunciaEstimada > 0 ? tributosIndiretosIncremento / renunciaEstimada : null;
  const coberturaIndiretaMeta = arrecadacaoReferencia > 0 ? tributosIndiretosIncremento / arrecadacaoReferencia : null;
  const gapIndiretosRenuncia = tributosIndiretosIncremento - renunciaEstimada;
  const denomIndireto = tic - (tdc * tauAplicado);
  let incrementoIndiretoCompensaRenuncia = null;
  let indiretosPodemCompensar = true;
  if (tauAplicado <= 0 || renunciaEstimada <= 0) {
    incrementoIndiretoCompensaRenuncia = 0;
  } else if (denomIndireto > 0) {
    incrementoIndiretoCompensaRenuncia = (valorSem * tdc * tauAplicado) / denomIndireto;
  } else if (valorSem === 0 && Math.abs(denomIndireto) < 1e-12) {
    incrementoIndiretoCompensaRenuncia = 0;
  } else {
    indiretosPodemCompensar = false;
  }
  return {
    valorCom,
    valorSem,
    incremento,
    tauPleiteado,
    tauAplicado,
    tauLimite,
    metaRecuperacao: meta,
    arrecadacaoAntesDireta,
    arrecadacaoReferencia,
    diretoPotencialCom,
    renunciaEstimada,
    diretoLiquidoCom,
    tributosIndiretosIncremento,
    arrecadacaoComBeneficio,
    diferencaFiscal,
    incrementoNeutro,
    valorComNeutro,
    gapIncremento,
    renunciaMaximaNeutra,
    coberturaIndiretaRenuncia,
    coberturaIndiretaMeta,
    gapIndiretosRenuncia,
    incrementoIndiretoCompensaRenuncia,
    indiretosPodemCompensar,
    atingida: diferencaFiscal >= -1e-6,
    indiretosCompensamRenuncia: gapIndiretosRenuncia >= -1e-6,
    pleiteadoAcimaDoTeto: tauPleiteado > tauLimite
  };
}

function neutralidadeFiscalProdutosAnalysis({
  fiscalValueWith,
  fiscalValueWithout,
  mipIncrement,
  renunciaPctAtual,
  tauMax,
  directCoefficient,
  tic,
  metaRecuperacao
}) {
  const valorCom = Math.max(0, Number(fiscalValueWith || 0));
  const valorSem = Math.max(0, Number(fiscalValueWithout || 0));
  const incrementoFiscal = Math.max(0, valorCom - valorSem);
  const incrementoMip = Math.max(0, Number(mipIncrement || 0));
  const tdc = Math.max(0, Number(directCoefficient || 0));
  const tauLimite = Math.max(0, Math.min(1, tauMax));
  const tauPleiteado = Math.max(0, Math.min(1, renunciaPctAtual));
  const tauAplicado = Math.min(tauPleiteado, tauLimite);
  const meta = Math.max(0, Math.min(1, metaRecuperacao ?? 1));
  const arrecadacaoAntesDireta = valorSem * tdc;
  const diretoPotencialCom = valorCom * tdc;
  const renunciaEstimada = diretoPotencialCom * tauAplicado;
  const arrecadacaoReferencia = renunciaEstimada * meta;
  const diretoLiquidoCom = diretoPotencialCom - renunciaEstimada;
  const tributosIndiretosIncremento = incrementoMip * tic;
  const arrecadacaoComBeneficio = diretoLiquidoCom + tributosIndiretosIncremento;
  const diferencaFiscal = tributosIndiretosIncremento - arrecadacaoReferencia;
  const indiretoPorUnidadeFiscal = incrementoFiscal > 0 ? tributosIndiretosIncremento / incrementoFiscal : 0;
  const denomIncremento = indiretoPorUnidadeFiscal - (tdc * tauAplicado * meta);
  const numeradorIncremento = valorSem * tdc * tauAplicado * meta;
  const incrementoNeutro = denomIncremento > 0 ? Math.max(0, numeradorIncremento / denomIncremento) :
    (Math.abs(numeradorIncremento) < 1e-12 && Math.abs(denomIncremento) < 1e-12 ? 0 : null);
  const valorComNeutro = incrementoNeutro === null ? null : valorSem + incrementoNeutro;
  const gapIncremento = incrementoNeutro === null ? null : incrementoFiscal - incrementoNeutro;
  const renunciaMaximaNeutra = meta <= 0 ? tauLimite :
    ((valorCom > 0 && tdc > 0) ? Math.max(0, Math.min(tauLimite, tributosIndiretosIncremento / (meta * valorCom * tdc))) : null);
  const coberturaIndiretaRenuncia = renunciaEstimada > 0 ? tributosIndiretosIncremento / renunciaEstimada : null;
  const coberturaIndiretaMeta = arrecadacaoReferencia > 0 ? tributosIndiretosIncremento / arrecadacaoReferencia : null;
  const gapIndiretosRenuncia = tributosIndiretosIncremento - renunciaEstimada;
  const denomIndireto = indiretoPorUnidadeFiscal - (tdc * tauAplicado);
  let incrementoIndiretoCompensaRenuncia = null;
  let indiretosPodemCompensar = true;
  if (tauAplicado <= 0 || renunciaEstimada <= 0) {
    incrementoIndiretoCompensaRenuncia = 0;
  } else if (denomIndireto > 0) {
    incrementoIndiretoCompensaRenuncia = (valorSem * tdc * tauAplicado) / denomIndireto;
  } else if (valorSem === 0 && Math.abs(denomIndireto) < 1e-12) {
    incrementoIndiretoCompensaRenuncia = 0;
  } else {
    indiretosPodemCompensar = false;
  }
  return {
    valorCom,
    valorSem,
    incremento: incrementoFiscal,
    incrementoFiscal,
    incrementoMip,
    tauPleiteado,
    tauAplicado,
    tauLimite,
    metaRecuperacao: meta,
    coeficienteDiretoEfetivo: tdc,
    coeficienteIndiretoMip: tic,
    indiretoPorUnidadeFiscal,
    arrecadacaoAntesDireta,
    arrecadacaoReferencia,
    diretoPotencialCom,
    renunciaEstimada,
    diretoLiquidoCom,
    tributosIndiretosIncremento,
    arrecadacaoComBeneficio,
    diferencaFiscal,
    incrementoNeutro,
    valorComNeutro,
    gapIncremento,
    renunciaMaximaNeutra,
    coberturaIndiretaRenuncia,
    coberturaIndiretaMeta,
    gapIndiretosRenuncia,
    incrementoIndiretoCompensaRenuncia,
    indiretosPodemCompensar,
    atingida: diferencaFiscal >= -1e-6,
    indiretosCompensamRenuncia: gapIndiretosRenuncia >= -1e-6,
    pleiteadoAcimaDoTeto: tauPleiteado > tauLimite
  };
}

function externalSupplyScenarioAnalysis({
  declaredValue,
  valorComBeneficioMip,
  valueBRL,
  prod,
  va,
  totalJobs,
  wageMass,
  taxLocal,
  renuncia,
  tdc,
  tic,
  ufAlternativa,
  renunciaPctAtual,
  receitaEntradaOverride,
  metodologiaEntrada
}) {
  const pctMercadoPB = Math.max(0, Math.min(1, numInput('ext_pct_vendas_pb', 100) / 100));
  const pctCapturaEntrada = Math.max(0, Math.min(1, numInput('ext_pct_captura_entrada', 50) / 100));
  const margemLocal = 0;
  const prob = Math.max(0, Math.min(1, numInput('ext_prob_abastecimento_externo', 100) / 100));
  const mercadoPB = Math.max(0, declaredValue * pctMercadoPB);
  const baseMipLocal = Math.max(0, valorComBeneficioMip * pctMercadoPB);
  const margemLocalMip = 0;
  const distRow = {};
  const receitaEntradaProxySetorial = mercadoPB * tdc * pctCapturaEntrada;
  const override = Number(receitaEntradaOverride);
  const usaReceitaOverride = Number.isFinite(override) && override >= 0;
  const receitaEntrada = usaReceitaOverride ? override : receitaEntradaProxySetorial;
  const metodoEntradaLabel = metodologiaEntrada || (usaReceitaOverride ? 'Composição fiscal informada' : 'Proxy setorial da MIP');
  const distVa = 0;
  const distEmpregos = 0;
  const distSalarios = 0;
  const distTributos = 0;
  const receitaExterna = receitaEntrada;
  const diretoPotencialLocal = valueBRL * tdc;
  const indiretoLocal = valueBRL * tic;
  const receitaLocalSemRenuncia = diretoPotencialLocal + indiretoLocal;
  let renunciaMaxFiscal = null,
    renunciaMaxFiscalRaw = null,
    renunciaMaxValor = null,
    receitaLocalNoLimite = null;
  let equilibrioStatus = 'Sem base direta suficiente para calcular o percentual máximo.';
  let equilibrioClass = 'risk-mid';
  if (diretoPotencialLocal > 0) {
    renunciaMaxFiscalRaw = (receitaLocalSemRenuncia - receitaExterna) / diretoPotencialLocal;
    if (renunciaMaxFiscalRaw < 0) {
      renunciaMaxFiscal = 0;
      renunciaMaxValor = 0;
      receitaLocalNoLimite = receitaLocalSemRenuncia;
      equilibrioStatus = 'Nem com renúncia zero a receita local estimada alcança o cenário externo.';
      equilibrioClass = 'risk-high';
    } else {
      renunciaMaxFiscal = Math.max(0, Math.min(1, renunciaMaxFiscalRaw));
      renunciaMaxValor = diretoPotencialLocal * renunciaMaxFiscal;
      receitaLocalNoLimite = indiretoLocal + diretoPotencialLocal * (1 - renunciaMaxFiscal);
      if (renunciaMaxFiscalRaw >= 1) {
        equilibrioStatus = 'A receita indireta/local estimada permite renúncia de até 100% sem ficar abaixo do cenário externo.';
        equilibrioClass = 'risk-low';
      } else if (Number(renunciaPctAtual || 0) <= renunciaMaxFiscal + 1e-9) {
        equilibrioStatus = 'O percentual de renúncia considerado está dentro do limite fiscalmente equivalente ao cenário externo.';
        equilibrioClass = 'risk-low';
      } else {
        equilibrioStatus = 'O percentual de renúncia considerado supera o limite fiscalmente equivalente ao cenário externo.';
        equilibrioClass = 'risk-high';
      }
    }
  }
  const perdaProducao = Math.max(0, prod - (margemLocalMip * Number(distRow.producao || 1)));
  const perdaVa = Math.max(0, va - distVa);
  const perdaEmpregos = Math.max(0, totalJobs - distEmpregos);
  const perdaSalarios = Math.max(0, wageMass - distSalarios);
  const diferencaFiscal = taxLocal - receitaExterna;
  const diferencaFiscalEsperada = diferencaFiscal * prob;
  const perdaVaEsperada = perdaVa * prob;
  const perdaEmpregosEsperada = perdaEmpregos * prob;
  const perdaSalariosEsperada = perdaSalarios * prob;
  const vazamento = va > 0 ? Math.max(0, Math.min(1, perdaVa / va)) : null;
  let risco = 'Baixo',
    cls = 'risk-low';
  if (prob >= 0.66 && (perdaVa > renuncia || perdaEmpregos >= 50)) {
    risco = 'Alto';
    cls = 'risk-high';
  } else if (prob >= 0.33 && (perdaVa > 0 || perdaEmpregos > 0)) {
    risco = 'Médio';
    cls = 'risk-mid';
  }
  const ufLabel = {
    PE: 'Pernambuco',
    RN: 'Rio Grande do Norte',
    CE: 'Ceará',
    BA: 'Bahia',
    AL: 'Alagoas',
    SE: 'Sergipe',
    SP: 'São Paulo',
    MG: 'Minas Gerais',
    outro: 'Outro estado'
  } [ufAlternativa] || 'UF não informada';
  const message = diferencaFiscal >= 0 ?
    'No cenário com produção local, a arrecadação líquida estimada supera a proxy de receita capturada na entrada da mercadoria produzida fora.' :
    'A proxy de receita na entrada pode superar a arrecadação líquida local, mas isso não incorpora os ganhos de VA, emprego e massa salarial gerados pela produção dentro da Paraíba.';
  return {
    pctMercadoPB,
    pctCapturaEntrada,
    margemLocal,
    prob,
    mercadoPB,
    baseMipLocal,
    margemLocalMip,
    ufAlternativa,
    ufLabel,
    distRowCodigo: normCode(distRow.codigo || ''),
    distRowSetor: distRow.setor || 'Comércio/distribuição',
    receitaEntrada,
    receitaEntradaProxySetorial,
    metodologiaEntrada: metodoEntradaLabel,
    usaReceitaProdutos: usaReceitaOverride && /produto/i.test(metodoEntradaLabel),
    distVa,
    distEmpregos,
    distSalarios,
    distTributos,
    receitaExterna,
    diretoPotencialLocal,
    indiretoLocal,
    receitaLocalSemRenuncia,
    renunciaMaxFiscal,
    renunciaMaxFiscalRaw,
    renunciaMaxValor,
    receitaLocalNoLimite,
    equilibrioStatus,
    equilibrioClass,
    renunciaPctAtual: Number(renunciaPctAtual || 0),
    perdaProducao,
    perdaVa,
    perdaEmpregos,
    perdaSalarios,
    diferencaFiscal,
    diferencaFiscalEsperada,
    perdaVaEsperada,
    perdaEmpregosEsperada,
    perdaSalariosEsperada,
    vazamento,
    risco,
    cls,
    message
  };
}

function annualSectorWage(row) {
  const j = Number(row?.direto_por_R$_milhao || row?.emprego_por_R$_milhao || 0),
    w = Number(row?.renda_direto || 0);
  return j > 0 && w > 0 ? (1000000 * w) / j : 0;
}

function wageReturnAnalysis(valueBRL, r, dj, sal, tdc, rp, indirectSectors) {
  const h = Math.max(1, Math.min(30, Math.round(numInput('retorno_horizonte', 10)))),
    g = numInput('retorno_crescimento', 0) / 100,
    d = numInput('retorno_desconto', 6) / 100,
    months = Math.max(1, Math.min(14, Math.round(numInput('retorno_meses_salario', 12))));
  const drBase = sal > 0 && dj > 0 ? sal * dj * months : 0,
    dmBase = valueBRL * Number(r.renda_direto || 0);
  const indComps = (indirectSectors || []).map(s => {
    const row = mult.find(item => normCode(item.codigo) === normCode(s.codigo)) || {},
      jobs = (Number(s.impacto || 0) / 1000000) * Number(row.direto_por_R$_milhao || 0),
      aw = annualSectorWage(row);
    return {
      codigo: s.codigo,
      setor: s.setor,
      jobs,
      annualWage: aw,
      wageMass: jobs * aw
    };
  });
  const imBase = indComps.reduce((a, s) => a + Number(s.wageMass || 0), 0) || valueBRL * Number(r.renda_indireto || 0);
  const combBase = drBase + imBase;
  const rows = [];
  let pvC = 0,
    pvR = 0,
    cumNet = 0,
    payback = null;
  for (let y = 1; y <= h; y++) {
    const sc = Math.pow(1 + g, y - 1),
      av = valueBRL * sc,
      ren = av * tdc * rp,
      comb = combBase * sc,
      pv = 1 / Math.pow(1 + d, y);
    pvC += comb * pv;
    pvR += ren * pv;
    cumNet += comb - ren;
    if (payback === null && cumNet >= 0 && ren > 0) payback = y;
    rows.push({
      year: y,
      combined: comb,
      renuncia: ren,
      net: comb - ren,
      cumulativeNet: cumNet
    });
  }
  return {
    horizon: h,
    rows,
    directReportedBase: drBase,
    directMipBase: dmBase,
    indirectMipBase: imBase,
    combinedBase: combBase,
    indirectComponents: indComps,
    pvCombined: pvC,
    pvRenuncia: pvR,
    combinedRenunciaPV: pvR > 0 ? pvC / pvR : null,
    payback
  };
}

function economicImpactAnalysis({
  valueBRL,
  r,
  directJobs = 0,
  salario = 0,
  renunciaBaseDecisao = 0,
  wageReturn = null
}) {
  const cfg = (calculosModulares && calculosModulares.impactos_economicos) || {};
  const choque = Math.max(0, Number(valueBRL || 0));
  const row = r || {};
  const producaoTotal = choque * Number(row.producao || 0);
  const valorAdicionado = choque * Number(row.va || 0);
  const empregosIndiretos = (choque / 1000000) * Number(row.indireto_por_R$_milhao || 0);
  const empregosDiretos = Math.max(0, Number(directJobs || 0));
  const empregosTotais = empregosDiretos + empregosIndiretos;
  const empregosDiretosReferencia = (choque / 1000000) * Number(row.direto_por_R$_milhao || 0);
  const meses = Math.max(1, Math.min(14, Math.round(numInput('retorno_meses_salario', 12))));
  const massaDiretaDeclarada = Math.max(0, Number(salario || 0)) * empregosDiretos * meses;
  const massaDiretaMip = wageReturn ? Number(wageReturn.directMipBase || 0) : choque * Number(row.renda_direto || 0);
  const massaIndiretaMip = wageReturn ? Number(wageReturn.indirectMipBase || 0) : choque * Number(row.renda_indireto || 0);
  const massaSalarialMip = massaDiretaMip + massaIndiretaMip;
  const massaSalarialDeclarada = (wageReturn ? Number(wageReturn.directReportedBase || 0) : massaDiretaDeclarada) + massaIndiretaMip;
  const divisorRenuncia = renunciaBaseDecisao > 0 ? renunciaBaseDecisao / 1000000 : 0;
  const porRenuncia = divisorRenuncia > 0 ? {
    producaoTotal: producaoTotal / divisorRenuncia,
    producaoIndireta: Math.max(0, producaoTotal - choque) / divisorRenuncia,
    empregos: empregosTotais / divisorRenuncia,
    massaSalarial: massaSalarialDeclarada / divisorRenuncia
  } : null;
  return {
    choqueProducao: choque,
    producaoTotal,
    producaoIndireta: Math.max(0, producaoTotal - choque),
    valorAdicionado,
    empregosDiretos,
    empregosIndiretos,
    empregosTotais,
    empregosDiretosReferencia,
    massaDiretaDeclarada,
    massaDiretaMip,
    massaIndiretaMip,
    massaSalarialMip,
    massaSalarialDeclarada,
    porRenuncia,
    impactosEsperados: {
      producao: producaoTotal,
      valorAdicionado,
      empregos: empregosTotais,
      massaSalarialMip
    },
    fonteCalculo: cfg.modulo_calculo || 'fallback_js'
  };
}

function constructionEmploymentImpact(valorObras) {
  const obras = Math.max(0, Number(valorObras || 0));
  const cfg = (calculosModulares && calculosModulares.empregos_implantacao) || {};
  const row = cfg.coeficientes && Object.keys(cfg.coeficientes).length ?
    cfg.coeficientes :
    mult.find(item => normCode(item.codigo) === '4180' || String(item.setor || '').toLowerCase().includes('constru'));
  if (!obras || !row) return {
    codigo: '4180',
    setor: 'Construção',
    valorObras: obras,
    diretos: 0,
    indiretos: 0,
    total: 0,
    multiplicadorDireto: 0,
    multiplicadorIndireto: 0,
    fonteCalculo: cfg.modulo_calculo || 'fallback_js'
  };
  const diretoMult = Number(row.direto_por_R$_milhao || 0);
  const indiretoMult = Number(row.indireto_por_R$_milhao || 0);
  const diretos = (obras / 1000000) * diretoMult;
  const indiretos = (obras / 1000000) * indiretoMult;
  return {
    codigo: normCode(row.codigo || '4180'),
    setor: row.setor || 'Construção',
    valorObras: obras,
    diretos,
    indiretos,
    total: diretos + indiretos,
    multiplicadorDireto: diretoMult,
    multiplicadorIndireto: indiretoMult,
    fonteCalculo: cfg.modulo_calculo || 'fallback_js'
  };
}

function socialViabilityAnalysis(valueBRL, vaCoef, tdc, rp) {
  const h = Math.max(1, Math.min(30, Math.round(numInput('retorno_horizonte', 10)))),
    g = numInput('retorno_crescimento', 0) / 100,
    d = numInput('retorno_desconto', 6) / 100;
  const pubInv = parseMoney('investimento_publico');
  const rows = [];
  let pvVA = 0,
    pvR = 0,
    pvNet = -pubInv,
    cumNet = -pubInv,
    payback = pubInv === 0 ? 0 : null;
  for (let y = 1; y <= h; y++) {
    const sc = Math.pow(1 + g, y - 1),
      av = valueBRL * sc,
      annVA = av * vaCoef,
      ren = av * tdc * rp,
      net = annVA - ren,
      pv = 1 / Math.pow(1 + d, y);
    pvVA += annVA * pv;
    pvR += ren * pv;
    pvNet += net * pv;
    cumNet += net;
    if (payback === null && cumNet >= 0) payback = y;
    rows.push({
      year: y,
      va: annVA,
      renuncia: ren,
      net,
      cumulativeNet: cumNet
    });
  }
  return {
    horizon: h,
    rows,
    pvVA,
    pvRenuncia: pvR,
    pvNet,
    vaRenunciaPV: pvR > 0 ? pvVA / pvR : null,
    payback
  };
}

function wageCostBenefitAnalysis(wr) {
  const rows = [];
  let pvW = 0,
    pvR = 0,
    pvNet = 0,
    cumNet = 0,
    payback = null;
  for (const row of wr.rows) {
    const d = wr.discount || 0.06,
      pv = 1 / Math.pow(1 + d, row.year),
      net = row.combined - row.renuncia;
    pvW += row.combined * pv;
    pvR += row.renuncia * pv;
    pvNet += net * pv;
    cumNet += net;
    if (payback === null && cumNet >= 0 && row.renuncia > 0) payback = row.year;
    rows.push({
      ...row,
      net,
      cumulativeNet: cumNet
    });
  }
  return {
    rows,
    pvWage: pvW,
    pvRenuncia: pvR,
    pvNet,
    payback,
    wageRenunciaPV: pvR > 0 ? pvW / pvR : null
  };
}

function rentSeekingAssessment({
  renunciaPct,
  taxRenuncia,
  directJobs,
  expectedDirectJobs,
  localRaw,
  localShare,
  r,
  adicionalidade,
  permanencia,
  ativosRecuperaveisPct,
  investimentoPrivado,
  novoProduto,
  estrategico,
  seg,
  comOrigemLocal,
  comDestinoLocal,
  estrutura,
  incentivoLocacional
}) {
  const alerts = [];
  let score = 0;
  if (adicionalidade === 'sim') {
    score += 3;
    alerts.push('Projeto declarado como realizável mesmo sem o benefício.');
  }
  if (adicionalidade === 'nao_informado') {
    score += 1;
    alerts.push('Ganho adicional para o Estado não informado.');
  }
  if (renunciaPct >= 0.8 && (taxRenuncia === null || taxRenuncia < 1)) {
    score += 2;
    alerts.push('Renúncia alta com baixa recuperação fiscal estimada.');
  }
  if (!(directJobs > 0) || directJobs < expectedDirectJobs) {
    score += 1;
    alerts.push('Empregos diretos informados abaixo da referência setorial.');
  }
  if (!localRaw || localShare < Number(r.participacao_insumos_domesticos || 0)) {
    score += 1;
    alerts.push('Compras locais ausentes ou abaixo da média setorial.');
  }
  if (!permanencia || permanencia < 5) {
    score += 1;
    alerts.push('Tempo de permanência baixo ou não informado.');
  }
  if (ativosRecuperaveisPct === null) {
    score += 1;
    alerts.push('Composição dos ativos fixos não informada.');
  }
  if (ativosRecuperaveisPct !== null && ativosRecuperaveisPct > 70) {
    score += 1;
    alerts.push('Alta parcela de ativos recuperáveis — menor custo de saída do estado.');
  }
  if (!investimentoPrivado || investimentoPrivado <= 0) {
    score += 1;
    alerts.push('Investimento privado inicial não informado.');
  }
  if (incentivoLocacional === 'sim') {
    score += 1;
    alerts.push('Há incentivo locacional ou crédito adicional informado; recomenda-se avaliar cumulatividade de benefícios e contrapartidas.');
  }
  if (!novoProduto && !estrategico && !r.setor_chave) {
    score += 1;
    alerts.push('Sem sinal de novidade, prioridade estratégica ou setor-chave.');
  }
  const mitig = Number(estrutura?.indice_mitigacao_rent_seeking || 0);
  if (mitig >= 0.70) {
    score -= 2;
    alerts.push('Estrutura produtiva setorial com alta justificativa econômica reduz o risco estimado.');
  } else if (mitig >= 0.50) {
    score -= 1;
    alerts.push('Estrutura produtiva setorial com justificativa moderada reduz parcialmente o risco estimado.');
  } else if (mitig < 0.30) {
    score += 1;
    alerts.push('Baixa justificativa produtiva setorial aumenta a cautela sobre rent-seeking.');
  }
  score = Math.max(0, score);
  if (seg === 'comercio') {
    if (!comOrigemLocal) alerts.push('Comércio: origem dos produtos não informada ou não local.');
    if (!comDestinoLocal) alerts.push('Comércio: destino das vendas não informado ou não estadual.');
  }
  const level = score >= 6 ? 'Alto' : score >= 3 ? 'Moderado' : 'Baixo';
  const cls = score >= 6 ? 'risk-high' : score >= 3 ? 'risk-mid' : 'risk-low';
  return {
    score,
    level,
    cls,
    alerts
  };
}

function techInfo(code) {
  const sec = techSector[code] || {
    nome_predominante: 'Não classificado por NCM',
    score_normalizado: 0,
    score_medio: 0,
    ncm_total: 0
  };
  const ncm = ncmInfo(),
    ncmNorm = ncm.avgScore === null ? null : ncm.avgScore / 4;
  return {
    sec,
    ncm,
    scoreNorm: Math.max(Number(sec.score_normalizado || 0), Number(ncmNorm || 0))
  };
}

function techLabel(name) {
  return (name || 'Não classificado por NCM').replaceAll('DE BAIXA TECNOLOGIA', 'DE BAIXO CONTEÚDO TECNOLÓGICO').replaceAll('DE MÉDIA-BAIXA TECNOLOGIA', 'DE MÉDIO-BAIXO CONTEÚDO TECNOLÓGICO').replaceAll('DE MEDIA-BAIXA TECNOLOGIA', 'DE MÉDIO-BAIXO CONTEÚDO TECNOLÓGICO').replaceAll('DE MÉDIA-ALTA TECNOLOGIA', 'DE MÉDIO-ALTO CONTEÚDO TECNOLÓGICO').replaceAll('DE MEDIA-ALTA TECNOLOGIA', 'DE MÉDIO-ALTO CONTEÚDO TECNOLÓGICO').replaceAll('DE ALTA TECNOLOGIA', 'DE ALTO CONTEÚDO TECNOLÓGICO');
}

function indexLevel(v) {
  v = Number(v || 0);
  return v >= 0.67 ? 'Alto' : v >= 0.34 ? 'Moderado' : 'Baixo';
}

function indexClass(v) {
  v = Number(v || 0);
  return v >= 0.67 ? 'ok' : v >= 0.34 ? 'risk-mid' : 'bad';
}

function sectorStructureInfo(code, r) {
  const base = sectorIndices[normCode(code)] || {};
  return {
    dependencia_insumos_externos: Number(base.dependencia_insumos_externos ?? r.participacao_insumos_importados ?? 0),
    intensidade_insumos_locais: Number(base.intensidade_insumos_locais ?? r.participacao_insumos_domesticos ?? 0),
    score_ligacao_tras: Number(base.score_ligacao_tras || 0),
    score_ligacao_frente: Number(base.score_ligacao_frente || 0),
    score_multiplicador_producao: Number(base.score_multiplicador_producao || 0),
    score_multiplicador_tributario: Number(base.score_multiplicador_tributario || 0),
    score_setor_chave: Number(base.score_setor_chave || 0),
    score_tecnologia: Number(base.score_tecnologia || 0),
    indice_justificativa_produtiva: Number(base.indice_justificativa_produtiva || 0),
    indice_encadeamento_local: Number(base.indice_encadeamento_local || 0),
    indice_mitigacao_rent_seeking: Number(base.indice_mitigacao_rent_seeking || 0)
  };
}

function signal(score, tipo = 'nova') {
  const lim = policyConfig.limiares || {
    verde: 7,
    laranja: 5
  };
  if (tipo === 'retencao') {
    if (score < Number(lim.laranja ?? 5)) return {
      cls: 'red',
      decision: 'Retenção requer mais informações'
    };
    if (score < Number(lim.verde ?? 7)) return {
      cls: 'orange',
      decision: 'Retenção sob análise'
    };
    return {
      cls: 'green',
      decision: 'Retenção recomendada preliminarmente'
    };
  }
  if (score < Number(lim.laranja ?? 5)) return {
    cls: 'red',
    decision: 'Benefício requer mais informações'
  };
  if (score < Number(lim.verde ?? 7)) return {
    cls: 'orange',
    decision: 'Benefício sob análise'
  };
  return {
    cls: 'green',
    decision: 'Benefício aprovado preliminarmente'
  };
}

function levelLabelFrom01(v, positive = true) {
  const x = Math.max(0, Math.min(1, Number(v || 0)));
  if (positive) {
    if (x >= 0.75) return {
      label: 'Alta',
      cls: 'risk-low'
    };
    if (x >= 0.50) return {
      label: 'Média',
      cls: 'risk-mid'
    };
    return {
      label: 'Baixa',
      cls: 'risk-high'
    };
  }
  if (x >= 0.75) return {
    label: 'Alto',
    cls: 'risk-high'
  };
  if (x >= 0.50) return {
    label: 'Moderado',
    cls: 'risk-mid'
  };
  return {
    label: 'Baixo',
    cls: 'risk-low'
  };
}

function qualityAssessment({
  seg,
  tipoAnalise,
  mun,
  valorCom,
  valorSemInformado,
  directJobs,
  salario,
  localRaw,
  adicionalidade,
  permanencia,
  investPrivado,
  ativosRecPct,
  ncmCount,
  retentionEvidence,
  comOrigemProd,
  comDestVendas
}) {
  const checks = [];
  const add = (ok, label, critical = true) => checks.push({
    ok: !!ok,
    label,
    critical
  });
  add(!!mun, 'Município informado');
  add(valorCom > 0, 'Valor econômico com benefício informado');
  add(valorSemInformado, 'Valor sem benefício informado');
  add(directJobs > 0, 'Empregos diretos informados');
  add(salario > 0, 'Salário médio informado', false);
  add(!!localRaw, 'Compras/insumos locais informados', false);
  add(tipoAnalise === 'retencao' ? String(retentionEvidence || '').trim().length > 0 : adicionalidade !== 'nao_informado', 'Ganho adicional para o Estado ou evidência de retenção informada');
  add(permanencia > 0, 'Tempo de permanência informado', false);
  add(investPrivado > 0, 'Investimento privado informado', false);
  add(ativosRecPct !== null, 'Composição dos ativos informada', false);
  if (seg === 'industria') add(ncmCount > 0, 'NCM dos produtos informado', false);
  if (seg === 'comercio') {
    add(!!comOrigemProd, 'Origem dos produtos comercializados informada', false);
    add(!!comDestVendas, 'Destino das vendas informado', false);
  }
  const pesoTotal = checks.reduce((a, c) => a + (c.critical ? 1.25 : 1), 0) || 1;
  const pesoOk = checks.reduce((a, c) => a + (c.ok ? (c.critical ? 1.25 : 1) : 0), 0);
  const score = pesoOk / pesoTotal;
  const missing = checks.filter(c => !c.ok).map(c => c.label);
  const level = levelLabelFrom01(score, true);
  return {
    score,
    level: level.label,
    cls: level.cls,
    missing,
    checks
  };
}

function plausibilityAssessment({
  valorCom,
  valorChoque,
  directJobs,
  expectedDirectJobs,
  salario,
  investPrivado,
  renunciaPct,
  neutralidadeFiscal,
  taxRenuncia
}) {
  let score = 1;
  const alerts = [];
  const prodPerJob = directJobs > 0 ? valorChoque / directJobs : null;
  const investPerJob = directJobs > 0 && investPrivado > 0 ? investPrivado / directJobs : null;
  if (directJobs <= 0) {
    score -= 0.25;
    alerts.push('Empregos diretos não informados ou iguais a zero.');
  }
  if (expectedDirectJobs > 0 && directJobs > 0 && directJobs < expectedDirectJobs * 0.35) {
    score -= 0.20;
    alerts.push('Empregos diretos declarados muito abaixo da referência média da MIP para o choque informado.');
  }
  if (expectedDirectJobs > 0 && directJobs > expectedDirectJobs * 8) {
    score -= 0.10;
    alerts.push('Empregos diretos declarados muito acima da referência média da MIP; convém verificar documentação.');
  }
  if (salario > 0 && salario < 1000) {
    score -= 0.15;
    alerts.push('Salário médio informado muito baixo para leitura anualizada.');
  }
  if (salario > 50000) {
    score -= 0.10;
    alerts.push('Salário médio informado muito elevado; pode haver erro de unidade.');
  }
  if (prodPerJob !== null && prodPerJob > 10000000) {
    score -= 0.15;
    alerts.push('Produção por emprego direto muito alta; verificar se o valor informado representa produção, faturamento ou margem.');
  }
  if (prodPerJob !== null && prodPerJob < 30000) {
    score -= 0.10;
    alerts.push('Produção por emprego direto muito baixa; verificar se os empregos informados pertencem ao projeto analisado.');
  }
  if (investPerJob !== null && investPerJob < 10000) {
    score -= 0.10;
    alerts.push('Investimento por emprego direto muito baixo; pode indicar dado incompleto.');
  }
  if (renunciaPct >= 0.7 && neutralidadeFiscal && !neutralidadeFiscal.atingida) {
    score -= 0.20;
    alerts.push('Renúncia elevada sem neutralidade fiscal no cenário base.');
  }
  if (taxRenuncia !== null && taxRenuncia < 0.5) {
    score -= 0.10;
    alerts.push('Receita tributária estimada após renúncia baixa em relação à renúncia.');
  }
  score = Math.max(0, Math.min(1, score));
  const level = levelLabelFrom01(score, true);
  return {
    score,
    level: level.label,
    cls: level.cls,
    alerts,
    prodPerJob,
    investPerJob
  };
}

function additionalityAssessment({
  tipoAnalise,
  adicionalidade,
  valorCom,
  valorSem,
  incremento,
  retention,
  permanencia,
  investPrivado,
  ativosRecPct
}) {
  let score = 0.35;
  const notes = [];
  if (tipoAnalise === 'retencao') {
    const evid = String(retention?.evidencia || '').trim();
    score = 0.25;
    if (evid.length >= 80) {
      score += 0.30;
      notes.push('Há evidência textual/documental relevante para discutir risco de saída ou redução.');
    } else if (evid.length > 0) {
      score += 0.15;
      notes.push('Há evidência informada, mas ainda curta para sustentar a hipótese de retenção.');
    } else notes.push('Risco de saída/redução não foi documentado no formulário.');
    score += Math.min(0.25, Number(retention?.probSaida || 0) * 0.25);
    if (incremento > 0 && valorCom > 0) score += Math.min(0.15, incremento / valorCom * 0.15);
  } else {
    if (adicionalidade === 'nao') {
      score = 0.90;
      notes.push('Empresa declara que o projeto não ocorreria sem o benefício.');
    } else if (adicionalidade === 'outro_estado') {
      score = 0.80;
      notes.push('Empresa declara que o projeto tenderia a ocorrer fora da Paraíba.');
    } else if (adicionalidade === 'menor_escala') {
      score = 0.65;
      notes.push('Empresa declara que o projeto ocorreria em menor escala.');
    } else if (adicionalidade === 'sim') {
      score = 0.20;
      notes.push('Empresa declara que o projeto ocorreria de qualquer forma.');
    } else notes.push('Ganho adicional para o Estado não informado.');
    if (valorCom > 0 && incremento / valorCom >= 0.75) score += 0.05;
    if (valorCom > 0 && incremento / valorCom < 0.25) score -= 0.10;
  }
  if (permanencia >= 10) score += 0.05;
  if (investPrivado > 0) score += 0.05;
  if (ativosRecPct !== null && ativosRecPct <= 40) score += 0.05;
  score = Math.max(0, Math.min(1, score));
  const level = levelLabelFrom01(score, true);
  return {
    score,
    level: level.label,
    cls: level.cls,
    notes
  };
}

function signalFromScore(score, labels = {}) {
  const lim = policyConfig.limiares || {
    verde: 7,
    laranja: 5
  };
  const x = Math.max(0, Math.min(10, Number(score || 0)));
  if (x < Number(lim.laranja ?? 5)) return {
    score: x,
    cls: 'red',
    level: labels.red || 'Fraco'
  };
  if (x < Number(lim.verde ?? 7)) return {
    score: x,
    cls: 'orange',
    level: labels.orange || 'Intermediário'
  };
  return {
    score: x,
    cls: 'green',
    level: labels.green || 'Forte'
  };
}

function weightedCriteriaScore(criteria, weights, keys) {
  const selected = (keys || []).filter(key => Math.max(0, Number(weights?.[key] || 0)) > 0);
  const total = selected.reduce((acc, key) => acc + Math.max(0, Number(weights[key] || 0)), 0);
  if (!total) return 0;
  const weighted = selected.reduce((acc, key) => acc + Math.max(0, Number(weights[key] || 0)) * Math.max(0, Math.min(1, Number(criteria?.[key] || 0))), 0);
  return Math.max(0, Math.min(10, (weighted / total) * 10));
}

function fiscalDimensionAssessment({
  criteria,
  weights,
  neutralidadeFiscal,
  taxRenuncia,
  externalScenario,
  sensitivity
}) {
  const baseScore = weightedCriteriaScore(criteria, weights, ['tributosMult', 'beneficioCusto']);
  const neutralidadeScore = !neutralidadeFiscal ? 0 : (neutralidadeFiscal.atingida ? 10 : Math.max(0, Math.min(10, Number(neutralidadeFiscal.coberturaIndiretaMeta || 0) * 10)));
  const retornoScore = taxRenuncia === null ? 0 : Math.max(0, Math.min(10, Number(taxRenuncia || 0) * 5));
  let interestadualScore = 5;
  if (externalScenario && externalScenario.renunciaMaxFiscal !== null) {
    interestadualScore = Number(externalScenario.renunciaPctAtual || 0) <= Number(externalScenario.renunciaMaxFiscal || 0) + 1e-9 ? 10 : 2.5;
  }
  const sensitivityScore = sensitivity?.scenarios?.length ?
    (sensitivity.scenarios.filter(s => s.neutralidade).length / sensitivity.scenarios.length) * 10 :
    5;
  const score = (baseScore * 0.25) + (neutralidadeScore * 0.30) + (retornoScore * 0.20) + (interestadualScore * 0.15) + (sensitivityScore * 0.10);
  const signal = signalFromScore(score, {
    green: 'Fiscalmente defensável',
    orange: 'Fiscalmente sob análise',
    red: 'Fiscalmente frágil'
  });
  const notes = [];
  if (!neutralidadeFiscal) notes.push('Valor sem benefício não informado: neutralidade fiscal fica incompleta.');
  else if (!neutralidadeFiscal.atingida) notes.push('Tributos indiretos não atingem a meta de recuperação definida.');
  if (taxRenuncia !== null && taxRenuncia < 1) notes.push('Receita tributária estimada após renúncia fica abaixo da renúncia fiscal.');
  if (externalScenario?.renunciaMaxFiscal !== null && Number(externalScenario.renunciaPctAtual || 0) > Number(externalScenario.renunciaMaxFiscal || 0) + 1e-9) notes.push('Renúncia pleiteada supera o limite fiscalmente equivalente ao cenário de abastecimento externo.');
  if (!notes.length) notes.push('Sem alerta fiscal automático relevante no cenário informado.');
  return {
    ...signal,
    baseScore,
    neutralidadeScore,
    retornoScore,
    interestadualScore,
    sensitivityScore,
    notes
  };
}

function fainChecklistAssessment({
  seg,
  situacaoCadastral,
  renunciaPctSolicitada,
  renunciaMaximaPermitida,
  fain,
  ncmCount,
  produtoNovoEstado,
  investPrivado,
  directJobs,
  valorComBeneficioMip
}) {
  const checks = [];
  const statusMeta = {
    atendido: { label: 'Atendido', cls: 'ok' },
    pendente: { label: 'Pendente', cls: 'risk-mid' },
    nao_atendido: { label: 'Não atendido', cls: 'bad' },
    informativo: { label: 'Informativo', cls: 'hint' }
  };
  const triStatus = value => {
    if (value === 'sim') return 'atendido';
    if (value === 'nao') return 'nao_atendido';
    return 'pendente';
  };
  const add = (grupo, item, status, evidencia, criticidade = 'documental') => {
    checks.push({
      grupo,
      item,
      status,
      statusLabel: statusMeta[status]?.label || status,
      statusClass: statusMeta[status]?.cls || 'hint',
      evidencia,
      criticidade,
      critico: criticidade === 'crítico'
    });
  };
  const enquadramento = fain?.enquadramento || 'nao_informado';
  const incremento = Number(fain?.incrementoCapacidadePct || 0);
  const tetoLegalFain = 0.7425;
  const tetoAplicavel = Math.min(tetoLegalFain, Math.max(0, Number(renunciaMaximaPermitida || tetoLegalFain)));
  const renunciaOk = Number(renunciaPctSolicitada || 0) <= tetoAplicavel + 1e-9;
  const atividadeStatus = fain?.atividadeElegivel === 'sim' || seg === 'industria' ?
    'atendido' : (fain?.atividadeElegivel === 'nao' ? 'nao_atendido' : 'pendente');

  add(
    'Elegibilidade',
    'Atividade industrial ou turística elegível ao FAIN',
    atividadeStatus,
    seg === 'industria' ? 'Macrossegmento informado como indústria no painel.' : 'Confirmar se a atividade é industrial ou turística.',
    'crítico'
  );
  add(
    'Elegibilidade',
    'Enquadramento do empreendimento',
    enquadramento === 'nao_informado' ? 'pendente' : 'atendido',
    enquadramento === 'nao_informado' ? 'Informar se o caso é implantação, ampliação, modernização, revitalização, relocalização, bem sem similar ou isonomia.' : enquadramento,
    'crítico'
  );
  add(
    'Elegibilidade',
    'Projeto econômico-financeiro protocolado na CINEP',
    triStatus(fain?.projetoCinep),
    'O FAIN é instruído por projeto econômico-financeiro protocolado junto à CINEP.',
    'crítico'
  );
  add(
    'Regularidade',
    'Foro ou domicílio fiscal na Paraíba',
    triStatus(fain?.domicilioPb),
    'Verificar cadastro, contrato social e inscrição estadual.',
    'crítico'
  );
  add(
    'Regularidade',
    'Inscrição ativa no Cadastro de Contribuintes do ICMS',
    triStatus(fain?.inscricaoIcms),
    'Condição cadastral vinculada à fruição do benefício.',
    'crítico'
  );
  add(
    'Regularidade',
    'Adimplência com obrigações tributárias estaduais',
    triStatus(fain?.adimplencia),
    'A existência de débitos, obrigações acessórias descumpridas ou pendências cadastrais exige análise fiscal.',
    'crítico'
  );
  add(
    'Regularidade',
    'Empresa não optante pelo Simples Nacional',
    triStatus(fain?.naoSimples),
    'Verificação necessária para concessão/prorrogação/extensão de incentivo fiscal de ICMS.',
    'crítico'
  );
  add(
    'Limite fiscal',
    'Percentual pleiteado dentro do teto de 74,25%',
    renunciaOk ? 'atendido' : 'nao_atendido',
    `Pleito: ${br(Number(renunciaPctSolicitada || 0) * 100, 2)}%; teto aplicado: ${br(tetoAplicavel * 100, 2)}%.`,
    'crítico'
  );

  if (enquadramento === 'ampliacao') {
    add(
      'Enquadramento objetivo',
      'Ampliação com aumento mínimo de 35% da capacidade nominal instalada',
      incremento >= 35 ? 'atendido' : (incremento > 0 ? 'nao_atendido' : 'pendente'),
      incremento > 0 ? `Incremento informado: ${br(incremento, 1)}%.` : 'Informar incremento de capacidade nominal.',
      'crítico'
    );
  } else if (enquadramento === 'modernizacao') {
    add(
      'Enquadramento objetivo',
      'Modernização com aumento mínimo de 20% da capacidade nominal utilizada ou menor impacto ambiental',
      incremento >= 20 ? 'atendido' : (incremento > 0 ? 'nao_atendido' : 'pendente'),
      incremento > 0 ? `Incremento informado: ${br(incremento, 1)}%.` : 'Informar incremento de capacidade ou comprovar menor impacto ambiental.',
      'crítico'
    );
  } else {
    add(
      'Enquadramento objetivo',
      'Critério quantitativo de capacidade',
      'informativo',
      'Aplicável principalmente a ampliação e modernização. Nos demais enquadramentos, conferir requisitos próprios do processo.',
      'informativo'
    );
  }

  const produtoSemSimilarAplicavel = enquadramento === 'produto_sem_similar' || produtoNovoEstado === 'sim';
  add(
    'Produto e produção',
    'NCM/produtos e produção anual informados no projeto',
    fain?.ncmProducao === 'sim' || ncmCount > 0 ? 'atendido' : triStatus(fain?.ncmProducao),
    ncmCount > 0 ? `${ncmCount} NCM(s) informado(s) no painel; conferir produção anual no projeto.` : 'O processo deve identificar produtos, NCM e produção incentivada.',
    'documental'
  );
  add(
    'Produto e produção',
    'Certidão SEFAZ de bem sem similar no Estado, quando aplicável',
    produtoSemSimilarAplicavel ? triStatus(fain?.certidaoSemSimilar) : 'informativo',
    produtoSemSimilarAplicavel ? 'Necessária quando a justificativa do benefício envolver bem sem similar no Estado.' : 'Não aplicável salvo se o pleito usar a justificativa de bem sem similar.',
    produtoSemSimilarAplicavel ? 'crítico' : 'informativo'
  );
  const contrapartidasInferidas = Number(directJobs || 0) > 0 && Number(investPrivado || 0) > 0 && Number(valorComBeneficioMip || 0) > 0;
  add(
    'Contrapartidas',
    'Projeto informa empregos diretos, investimento e produção incentivada',
    fain?.contrapartidas === 'sim' || contrapartidasInferidas ? 'atendido' : triStatus(fain?.contrapartidas),
    contrapartidasInferidas ? 'O painel possui produção, empregos e investimento; conferir se todos constam do projeto aprovado.' : 'Campos necessários para pactuar e fiscalizar metas.',
    'documental'
  );
  add(
    'Contrapartidas',
    'Não acumulação de outro benefício fiscal incompatível',
    triStatus(fain?.semOutroBeneficio),
    'O empreendimento incentivado pelo FAIN não deve acumular benefício fiscal incompatível.',
    'documental'
  );
  add(
    'Operacional',
    'Situação cadastral/operacional declarada',
    situacaoCadastral ? 'atendido' : 'pendente',
    situacaoCadastral ? `Situação informada: ${situacaoCadastral}.` : 'Informar implantação, expansão, reativação ou relocalização.',
    'documental'
  );

  const avaliaveis = checks.filter(c => c.status !== 'informativo');
  const atendidos = avaliaveis.filter(c => c.status === 'atendido').length;
  const pendentes = avaliaveis.filter(c => c.status === 'pendente').length;
  const naoAtendidos = avaliaveis.filter(c => c.status === 'nao_atendido').length;
  const criticosNao = avaliaveis.filter(c => c.critico && c.status === 'nao_atendido').length;
  const criticosPendentes = avaliaveis.filter(c => c.critico && c.status === 'pendente').length;
  const score = avaliaveis.length ? atendidos / avaliaveis.length : 0;
  let level = 'Aderente ao checklist';
  let cls = 'green';
  if (criticosNao > 0) {
    level = 'Não aderente ao checklist';
    cls = 'red';
  } else if (naoAtendidos > 0 || pendentes > 0 || criticosPendentes > 0) {
    level = 'Aderência com pendências';
    cls = 'orange';
  }
  const notes = [];
  if (criticosNao > 0) notes.push('Há requisito crítico não atendido; o processo exige saneamento antes de qualquer leitura favorável.');
  if (criticosPendentes > 0) notes.push('Há requisito crítico pendente de comprovação documental.');
  if (seg === 'comercio') notes.push('O FAIN é voltado a empreendimentos industriais e turísticos; comércio deve ser tratado com cautela ou por outro instrumento normativo.');
  if (renunciaOk && !notes.length) notes.push('Sem bloqueio automático no checklist, sujeito à conferência jurídica e documental.');
  const message = cls === 'green' ?
    'O processo não apresenta bloqueio automático nos itens preliminares do checklist FAIN, mas ainda depende de conferência documental e decisão competente.' :
    (cls === 'orange' ?
      'O processo tem aderência parcial ao checklist FAIN, com pendências que devem ser saneadas antes da decisão.' :
      'O processo tem pelo menos um requisito crítico não atendido no checklist FAIN e exige saneamento antes de encaminhamento favorável.');
  return {
    level,
    cls,
    score,
    message,
    checks,
    counts: {
      total: avaliaveis.length,
      atendidos,
      pendentes,
      naoAtendidos,
      criticosNao,
      criticosPendentes
    },
    notes
  };
}

function economicDimensionAssessment({
  criteria,
  weights,
  rentRisk,
  additionality,
  dataQuality,
  territorialAbsorption
}) {
  const economicKeys = [
    'producao',
    'va',
    'empregoMult',
    'empregoDireto',
    'comprasLocais',
    'tecnologia',
    'territorioQl',
    'abrangenciaMunicipal',
    'territorioBase',
    'desconcentracaoEconomica',
    'tempoProjeto',
    'ativosIrrecuperaveis',
    'destino',
    'substituicao',
    'produtoNovo',
    'estrategia',
    'comOrigemLocal',
    'comDestinoLocal'
  ];
  const baseScore = weightedCriteriaScore(criteria, weights, economicKeys);
  const rentPenalty = rentRisk?.level === 'Alto' ? 1.25 : rentRisk?.level === 'Moderado' ? 0.55 : 0;
  const infoPenalty = dataQuality?.score < 0.45 ? 0.60 : 0;
  const score = Math.max(0, Math.min(10, baseScore - rentPenalty - infoPenalty));
  const signal = signalFromScore(score, {
    green: 'Mérito econômico forte',
    orange: 'Mérito econômico intermediário',
    red: 'Mérito econômico frágil'
  });
  const notes = [];
  if (territorialAbsorption?.level === 'Alta') notes.push('Há boa capacidade territorial para absorver efeitos indiretos em setores tradables.');
  if (rentRisk?.level === 'Alto') notes.push('Risco de benefício pouco produtivo exige diligência antes de encaminhamento favorável.');
  if (additionality?.level === 'Baixa') notes.push('Ganho adicional para o Estado aparece frágil nas informações declaradas.');
  if (!notes.length) notes.push('Sem alerta econômico automático relevante no cenário informado.');
  return {
    ...signal,
    baseScore,
    rentPenalty,
    infoPenalty,
    notes
  };
}

function documentEvidenceAssessment({
  tipoAnalise,
  adicionalidade,
  retentionEvidence,
  records,
  notesText
}) {
  const rows = (records || []).map(row => {
    const value = Math.max(0, Math.min(5, Number(row.value || 0)));
    return {
      ...row,
      value,
      normalized: value / 5
    };
  });
  const activeRows = rows.filter(row => row.applies !== false);
  const totalWeight = activeRows.reduce((acc, row) => acc + Number(row.weight || 1), 0) || 1;
  let score = activeRows.reduce((acc, row) => acc + row.normalized * Number(row.weight || 1), 0) / totalWeight;
  const criticalMissing = activeRows.filter(row => row.critical && row.value <= 1).map(row => row.label);
  if (tipoAnalise === 'retencao' && String(retentionEvidence || '').trim().length >= 80) score += 0.05;
  if (tipoAnalise !== 'retencao' && (adicionalidade === 'nao' || adicionalidade === 'outro_estado') && criticalMissing.length) score -= 0.10;
  score = Math.max(0, Math.min(1, score));
  const level = score >= 0.72 ? 'Forte' : score >= 0.45 ? 'Parcial' : 'Frágil';
  const cls = score >= 0.72 ? 'risk-low' : score >= 0.45 ? 'risk-mid' : 'risk-high';
  const warnings = [];
  if (criticalMissing.length) warnings.push('Documentos críticos ausentes ou baseados apenas em declaração: ' + criticalMissing.join('; ') + '.');
  if (!String(notesText || '').trim()) warnings.push('Sem observação do auditor sobre a qualidade da documentação.');
  if (!warnings.length) warnings.push('Documentação suficiente para sustentar leitura preliminar, sujeita à conferência do auditor.');
  return {
    score,
    level,
    cls,
    rows,
    criticalMissing,
    warnings,
    notesText: String(notesText || '').trim()
  };
}

function decisionSynthesis({
  economic,
  fiscal,
  documentary
}) {
  const econCls = economic?.cls || 'red';
  const fiscCls = fiscal?.cls || 'red';
  const docWeak = documentary?.level === 'Frágil';
  let label = 'Requer mais informações';
  let cls = 'red';
  let message = 'O processo não deve avançar sem complementação documental e revisão dos pontos críticos.';
  if (econCls === 'green' && fiscCls === 'green' && !docWeak) {
    label = 'Candidato forte';
    cls = 'green';
    message = 'O projeto combina mérito econômico, resposta fiscal e documentação suficiente para subsidiar encaminhamento favorável preliminar.';
  } else if (econCls === 'green' && fiscCls !== 'green') {
    label = 'Negociar desenho fiscal';
    cls = 'orange';
    message = 'O projeto tem mérito econômico, mas o benefício deve ser ajustado ou condicionado para melhorar a resposta fiscal.';
  } else if (econCls !== 'green' && fiscCls === 'green') {
    label = 'Mérito produtivo limitado';
    cls = 'orange';
    message = 'A renúncia pode ser fiscalmente defensável, mas o projeto precisa demonstrar melhor contribuição econômica e territorial.';
  } else if (econCls === 'orange' || fiscCls === 'orange') {
    label = 'Análise complementar';
    cls = 'orange';
    message = 'Há sinais intermediários; a decisão depende de documentação, contrapartidas e eventual renegociação do pleito.';
  }
  if (docWeak && cls === 'green') {
    label = 'Condicionar à documentação';
    cls = 'orange';
    message = 'Os indicadores são favoráveis, mas a necessidade do incentivo ainda precisa ser documentada antes de decisão favorável.';
  }
  if (docWeak && (econCls !== 'green' || fiscCls !== 'green')) {
    label = 'Requer comprovação';
    cls = 'red';
    message = 'Além dos sinais técnicos incompletos, a necessidade do incentivo não está suficientemente comprovada.';
  }
  return {
    label,
    cls,
    message
  };
}

function sensitivityAnalysis({
  valorSemMip,
  valueBRL,
  renunciaPctSolicitada,
  renunciaMaximaPermitida,
  tdc,
  tic,
  metaRecuperacao,
  r,
  directJobs
}) {
  const scenarios = [{
    nome: 'Conservador',
    fator: 0.80
  }, {
    nome: 'Base',
    fator: 1.00
  }, {
    nome: 'Otimista',
    fator: 1.20
  }].map(s => {
    const inc = valueBRL * s.fator;
    const nf = neutralidadeFiscalAnalysis({
      valorCom: valorSemMip + inc,
      valorSem: valorSemMip,
      incremento: inc,
      renunciaPctAtual: renunciaPctSolicitada,
      tauMax: renunciaMaximaPermitida,
      tdc,
      tic,
      metaRecuperacao
    });
    const prod = inc * Number(r.producao || 0);
    const va = inc * Number(r.va || 0);
    const jobs = (directJobs * s.fator) + (inc / 1000000) * Number(r.indireto_por_R$_milhao || 0);
    return {
      nome: s.nome,
      fator: s.fator,
      incremento: inc,
      neutralidade: nf.atingida,
      tributosIndiretos: nf.tributosIndiretosIncremento,
      renuncia: nf.renunciaEstimada,
      diferenca: nf.diferencaFiscal,
      producao: prod,
      va,
      empregos: jobs
    };
  });
  const base = scenarios.find(s => s.nome === 'Base');
  let leitura = 'Resultado sensível';
  let cls = 'risk-mid';
  if (scenarios.every(s => s.neutralidade)) {
    leitura = 'Robusto';
    cls = 'risk-low';
  } else if (!base?.neutralidade && scenarios.some(s => s.neutralidade)) {
    leitura = 'Depende de cenário otimista';
    cls = 'risk-mid';
  } else if (!scenarios.some(s => s.neutralidade)) {
    leitura = 'Frágil';
    cls = 'risk-high';
  }
  return {
    scenarios,
    leitura,
    cls
  };
}

function sensitivityAnalysisV17({
  fiscalValueWithout,
  fiscalIncrement,
  mipIncrement,
  renunciaPctSolicitada,
  renunciaMaximaPermitida,
  directCoefficient,
  tic,
  metaRecuperacao,
  r,
  directJobs
}) {
  const scenarios = [{
    nome: 'Conservador',
    fator: 0.80
  }, {
    nome: 'Base',
    fator: 1.00
  }, {
    nome: 'Otimista',
    fator: 1.20
  }].map(s => {
    const incFiscal = Math.max(0, fiscalIncrement * s.fator);
    const incMip = Math.max(0, mipIncrement * s.fator);
    const nf = neutralidadeFiscalProdutosAnalysis({
      fiscalValueWith: fiscalValueWithout + incFiscal,
      fiscalValueWithout,
      mipIncrement: incMip,
      renunciaPctAtual: renunciaPctSolicitada,
      tauMax: renunciaMaximaPermitida,
      directCoefficient,
      tic,
      metaRecuperacao
    });
    const prod = incMip * Number(r.producao || 0);
    const va = incMip * Number(r.va || 0);
    const jobs = (directJobs * s.fator) + (incMip / 1000000) * Number(r.indireto_por_R$_milhao || 0);
    return {
      nome: s.nome,
      fator: s.fator,
      incremento: incMip,
      incrementoFiscal: incFiscal,
      neutralidade: nf.atingida,
      tributosIndiretos: nf.tributosIndiretosIncremento,
      renuncia: nf.renunciaEstimada,
      diferenca: nf.diferencaFiscal,
      producao: prod,
      va,
      empregos: jobs
    };
  });
  const base = scenarios.find(s => s.nome === 'Base');
  let leitura = 'Resultado sensível';
  let cls = 'risk-mid';
  if (scenarios.every(s => s.neutralidade)) {
    leitura = 'Robusto';
    cls = 'risk-low';
  } else if (!base?.neutralidade && scenarios.some(s => s.neutralidade)) {
    leitura = 'Depende de cenário otimista';
    cls = 'risk-mid';
  } else if (!scenarios.some(s => s.neutralidade)) {
    leitura = 'Frágil';
    cls = 'risk-high';
  }
  return {
    scenarios,
    leitura,
    cls
  };
}

function buildExecutiveSummary({
  sig,
  score,
  tipoAnalise,
  economic,
  fiscal,
  documentary,
  synthesis,
  neutralidadeFiscal,
  rentRisk,
  quality,
  plausibility,
  additionality,
  territorialAbsorption,
  locational,
  costPerJob,
  impactosEsperados,
  missingQualifiers
}) {
  const parts = [];
  const modo = tipoAnalise === 'retencao' ? 'retenção da empresa existente' : 'concessão para nova empresa ou expansão';
  parts.push(`A síntese decisória indica "${synthesis?.label || sig.decision}" para a análise de ${modo}. A nota composta de apoio é ${br(score,1)} de 10.`);
  if (economic) parts.push(`O mérito econômico-territorial foi classificado como ${economic.level.toLowerCase()}, com nota ${br(economic.score,1)} de 10.`);
  if (fiscal) parts.push(`O mérito fiscal-arrecadatório foi classificado como ${fiscal.level.toLowerCase()}, com nota ${br(fiscal.score,1)} de 10.`);
  if (documentary) parts.push(`A comprovação documental da necessidade do incentivo foi classificada como ${documentary.level.toLowerCase()}.`);
  if (neutralidadeFiscal) parts.push(neutralidadeFiscal.atingida ? 'O teste fiscal informa que os tributos indiretos cobrem a meta de recuperação definida.' : 'O teste fiscal informa que os tributos indiretos ainda não cobrem a meta de recuperação definida.');
  parts.push(`A capacidade territorial de absorção é ${territorialAbsorption.level.toLowerCase()}, com ${territorialAbsorption.count} município(s) destacados para receber efeitos indiretos tradables.`);
  parts.push(`O risco de benefício pouco produtivo foi classificado como ${rentRisk.level.toLowerCase()}.`);
  if (quality.level !== 'Alta') parts.push(`A qualidade da informação é ${quality.level.toLowerCase()}, portanto a decisão deve considerar os campos ausentes ou frágeis.`);
  if (plausibility.level === 'Baixa') parts.push('Há sinais de baixa plausibilidade econômica nos dados declarados e recomenda-se conferência documental antes da decisão.');
  const positives = [];
  const cautions = [];
  if (neutralidadeFiscal?.atingida) positives.push('neutralidade fiscal atendida');
  else cautions.push('neutralidade fiscal não atendida');
  if (territorialAbsorption.level === 'Alta') positives.push('boa absorção territorial');
  else cautions.push('absorção territorial limitada ou moderada');
  if (locational?.score >= 0.8) positives.push('boa contribuição para desconcentração econômica');
  else if (locational?.inMetro) cautions.push('localização em polo metropolitano reduz a contribuição para desconcentração econômica');
  if (additionality.level === 'Alta') positives.push('ganho adicional para o Estado bem demonstrado');
  else cautions.push('ganho adicional para o Estado precisa ser melhor demonstrado');
  if (documentary?.level === 'Forte') positives.push('necessidade do incentivo com documentação forte');
  else cautions.push('necessidade do incentivo ainda depende de documentação melhor');
  if (economic?.cls === 'green') positives.push('mérito econômico-territorial forte');
  else cautions.push('mérito econômico-territorial exige atenção');
  if (fiscal?.cls === 'green') positives.push('mérito fiscal-arrecadatório defensável');
  else cautions.push('mérito fiscal-arrecadatório exige ajuste ou análise complementar');
  if (costPerJob !== null) positives.push(`custo por emprego de ${money(costPerJob)}`);
  if (missingQualifiers?.length) cautions.push(`${missingQualifiers.length} campo(s) qualificador(es) ausente(s)`);
  return {
    texto: parts.join(' '),
    positives,
    cautions
  };
}

function scoreSensitivityAnalysis({
  criteria,
  weights,
  currentScore,
  target = 7,
  seg = 'industria',
  locationalContext = null,
  tipoAnalise = 'nova'
}) {
  const locActionable = !!(locationalContext?.inMetro && currentScore < target && tipoAnalise !== 'retencao');
  const labels = {
    producao: ['Multiplicador de produção acima da média', 'Estrutural', false, 'Característica média do setor na MIP. Explica a nota, mas não deve ser tratado como contrapartida negociável.'],
    va: ['Multiplicador de VA acima da média', 'Estrutural', false, 'Característica média do setor na MIP. Ajuda a entender o mérito econômico, mas não é uma alavanca direta do projeto.'],
    empregoMult: ['Multiplicador de emprego acima da média', 'Estrutural', false, 'Característica média do setor na MIP. Não depende apenas do empreendimento.'],
    tributosMult: ['Multiplicador tributário acima da média', 'Estrutural', false, 'Característica média do setor na MIP. Não deve ser usada como promessa da empresa.'],
    beneficioCusto: ['Ajuste fiscal da renúncia', 'Fiscal', true, 'Reduzir o percentual de renúncia, escalonar o benefício ou condicionar o incentivo a metas melhora a relação tributos/renúncia.'],
    empregoDireto: ['Empregos diretos mínimos', 'Contratual', true, 'Pode virar contrapartida objetiva no termo: número mínimo de empregos diretos a manter ou criar.'],
    comprasLocais: ['Compras locais mínimas', 'Contratual', true, 'Pode virar meta verificável de compras de insumos e serviços na Paraíba, com comprovação por documentos fiscais.'],
    tecnologia: ['Conteúdo tecnológico / NCM', 'Estrutural do produto', false, 'Característica típica do produto declarado. Pode ser comprovada documentalmente, mas não deve ser tratada como atributo negociável para elevar a nota.'],
    territorioQl: ['Especialização territorial do município', 'Estrutural', false, 'Depende da estrutura produtiva municipal e dos setores impactados. Serve para leitura territorial, não para promessa isolada.'],
    abrangenciaMunicipal: ['Abrangência municipal dos impactos', 'Estrutural', false, 'Resultado do mapa territorial. Pode orientar política regional, mas não é uma contrapartida simples da empresa.'],
    territorioBase: ['Base formal municipal / risco de retenção', 'Contexto territorial', false, 'No modo retenção, ajuda a medir o impacto local preservado. Em nova empresa, reflete contexto municipal. Não deve ser tratado como contrapartida da empresa.'],
    desconcentracaoEconomica: ['Localização fora dos principais polos metropolitanos', 'Política locacional', locActionable, locActionable ? 'Simula o ganho de nota caso o projeto, ainda em fase de decisão locacional, seja deslocado para município fora das regiões metropolitanas de João Pessoa e Campina Grande com capacidade territorial compatível.' : 'Critério de política regional. Explica a nota locacional, mas só entra como cenário de sensibilidade quando o projeto novo está em região metropolitana e a nota fica abaixo da meta.'],
    tempoProjeto: ['Permanência mínima na Paraíba', 'Contratual', true, 'Pode virar cláusula de permanência mínima ou gatilho de revisão do benefício.'],
    ativosIrrecuperaveis: ['Ativos fixos irrecuperáveis', 'Contratual', true, 'Pode ser reforçado por investimento em obras, instalações e ativos específicos que aumentem o enraizamento no estado.'],
    destino: ['Destino para fora do estado', 'Estratégica', true, 'Pode ser comprovado por mercado-alvo, contratos, pedidos ou estratégia comercial.'],
    substituicao: ['Substituição de importações', 'Estrutural do produto', false, 'Depende do produto e do mercado que ele atende. Pode ser comprovada, mas não deve aparecer como condição ajustável na combinação de melhoria.'],
    produtoNovo: ['Produto novo ou pouco produzido', 'Estrutural do produto', false, 'Característica do produto ou da pauta produtiva estadual. Pode justificar mérito, mas não deve ser tratada como promessa negociável da empresa.'],
    estrategia: ['Setor estratégico ou setor-chave', 'Política pública', false, 'Depende da classificação setorial e do enquadramento da política pública. Explica o mérito do projeto, mas não é um atributo que a empresa possa alterar.'],
    comOrigemLocal: ['Origem local dos produtos vendidos', 'Contratual', seg === 'comercio', 'Critério exclusivo do comércio: pode virar meta de aquisição de produtos fabricados na Paraíba.'],
    comDestinoLocal: ['Destino estadual das vendas', 'Contratual', seg === 'comercio', 'Critério exclusivo do comércio: indica retenção da renda no mercado paraibano.']
  };
  const total = Object.values(weights || {}).reduce((acc, v) => acc + Math.max(0, Number(v || 0)), 0) || 1;
  const levers = Object.entries(weights || {}).map(([key, weight]) => {
    const w = Math.max(0, Number(weight || 0));
    const current = Math.max(0, Math.min(1, Number(criteria?.[key] || 0)));
    const meta = labels[key] || [key, 'Outros', true, 'Critério da nota.'];
    const gain = w > 0 ? (w * (1 - current) / total * 10) : 0;
    const status = current >= 0.999 ? 'Atendido' : (current > 0 ? 'Parcial' : 'Não atendido');
    return {
      key,
      label: meta[0],
      type: meta[1],
      actionable: !!meta[2],
      note: meta[3],
      weight: w,
      current,
      gain,
      status,
      simulatedScore: Math.min(10, currentScore + gain)
    };
  }).filter(x => x.weight > 0).sort((a, b) => b.gain - a.gain);
  const actionable = levers.filter(x => x.actionable && x.gain > 0.001).slice(0, 10);
  const combos = [];
  const addCombo = (items) => {
    const gain = items.reduce((a, x) => a + x.gain, 0);
    combos.push({
      items,
      gain,
      score: Math.min(10, currentScore + gain)
    });
  };
  for (let i = 0; i < actionable.length; i++) addCombo([actionable[i]]);
  for (let i = 0; i < actionable.length; i++)
    for (let j = i + 1; j < actionable.length; j++) addCombo([actionable[i], actionable[j]]);
  for (let i = 0; i < actionable.length; i++)
    for (let j = i + 1; j < actionable.length; j++)
      for (let k = j + 1; k < actionable.length; k++) addCombo([actionable[i], actionable[j], actionable[k]]);
  const viable = combos.filter(c => c.score >= target).sort((a, b) => a.items.length - b.items.length || b.score - a.score).slice(0, 6);
  const near = combos.filter(c => c.score < target).sort((a, b) => b.score - a.score).slice(0, 6);
  return {
    target,
    currentScore,
    gap: Math.max(0, target - currentScore),
    levers,
    actionable,
    viable,
    near
  };
}
