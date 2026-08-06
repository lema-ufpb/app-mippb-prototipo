// static/v20/avaliar.js — fonte canônica (extraída e desminificada da v10).
function renderRelatorioParcial(pendencias = []) {
  const seg = getMacrossegmento();
  const ids = getFieldIds();
  const cnpj = (document.getElementById('cnpj')?.value || '').trim();
  const razaoSocial = (document.getElementById('razao_social')?.value || '').trim();
  const protocolo = (document.getElementById('protocolo')?.value || '').trim();
  const cnae = (document.getElementById(ids.cnae)?.value || '').trim();
  const tru = (document.getElementById(ids.tru)?.value || '').trim();
  const municipioSelecionado = resolveMunicipalitySelection(ids);
  const municipioCodigo = municipioSelecionado.codigo;
  const municipio = municipioSelecionado.row?.nome || '';
  const valorCom = parseMoney(ids.valor);
  const valorSem = parseMoney(ids.valorSem);
  const cadastroRf = getCnpjRfProfile(cnpj);
  const cadastroHtml = cadastroRf ? renderCnpjRfProfileHtml(cadastroRf, 'Caracterização cadastral da empresa') : '';
  const pendingHtml = pendencias.length ?
    pendencias.map(item => `<li>${escapeHtml(item)}</li>`).join('') :
    '<li>Não foi possível identificar dados suficientes para executar o motor econômico.</li>';
  window.lastEvaluationContext = {
    relatorioParcial: true,
    pendencias,
    empresa: {
      cnpj,
      razao_social: razaoSocial,
      cadastro_rf: cadastroRf
    },
    protocolo,
    tipoAnalise: getTipoAnalise(),
    macrossegmento: seg,
    cnae,
    municipio,
    declaredValue: valorCom,
    valorSemBeneficioDeclarado: valorSem,
    observacao: 'Relatório parcial gerado sem execução completa do motor econômico.'
  };
  document.getElementById('relatorio').innerHTML = `
    <div class="report-actions no-print">
      <button type="button" class="secondary" onclick="prepararImpressaoRelatorio()">Exportar relatório em PDF</button>
    </div>
    <h2>Relatório preliminar — dados incompletos</h2>
    <div class="warning"><b>O relatório foi gerado, mas os cálculos econômicos não foram executados.</b><br>Nenhum valor, setor ou impacto foi presumido para substituir informações ausentes.</div>
    <div class="decision-layer">
      <div class="layer-title"><div><div class="layer-kicker">Dados disponíveis</div><h3>Identificação e informações recebidas</h3></div><span class="pill">Relatório parcial</span></div>
      <table>
        <tr><th>Campo</th><th>Informação</th></tr>
        <tr><td>Empresa</td><td>${escapeHtml(razaoSocial || 'Não informada')}</td></tr>
        <tr><td>CNPJ</td><td>${escapeHtml(cnpj || 'Não informado')}</td></tr>
        <tr><td>Protocolo</td><td>${escapeHtml(protocolo || 'Não informado')}</td></tr>
        <tr><td>Tipo de análise</td><td>${escapeHtml(getTipoAnalise() || 'Não informado')}</td></tr>
        <tr><td>Macrossegmento</td><td>${escapeHtml(seg || 'Não informado')}</td></tr>
        <tr><td>CNAE / TRU</td><td>${escapeHtml([cnae, tru].filter(Boolean).join(' / ') || 'Não informado')}</td></tr>
        <tr><td>Município</td><td>${escapeHtml(municipio || 'Não informado')}</td></tr>
        <tr><td>Valor sem benefício</td><td>${valorSem ? money(valorSem) : 'Não informado'}</td></tr>
        <tr><td>Valor com benefício</td><td>${valorCom ? money(valorCom) : 'Não informado'}</td></tr>
      </table>
    </div>
    ${cadastroHtml}
    <div class="decision-layer">
      <div class="layer-title"><div><div class="layer-kicker">Limitações</div><h3>Dados necessários para executar os cálculos</h3></div></div>
      <ul>${pendingHtml}</ul>
      <p class="hint">O preenchimento desses campos é recomendado, mas não é obrigatório para gerar este relatório preliminar.</p>
    </div>`;
  const tech = document.getElementById('memoria_tecnica');
  if (tech) tech.innerHTML = '<h2>Memória técnica</h2><div class="tab-placeholder">A memória de cálculo não foi produzida porque faltam dados essenciais ao motor econômico.</div>';
  resetTributarioTab();
  resetFainTab();
  resetDocumentoTab();
  window.PainelModular?.applyToDocument(document);
  switchMainTab('economico');
  return true;
}

function avaliar() {
  clearWizardValidation();
  const seg = getMacrossegmento();
  if (!seg) {
    return renderRelatorioParcial(['Macrossegmento da empresa.', 'CNAE ou código TRU/SCN.', 'Valor econômico do cenário analisado.']);
  }
  const tipoAnalise = getTipoAnalise();
  const ids = getFieldIds(),
    found = findSector();
  if (!found.row) {
    return renderRelatorioParcial(['CNAE localizado no tradutor ou código TRU/SCN válido.', 'Valor econômico do cenário analisado.']);
  }
  const r = found.row,
    code = normCode(r.codigo);
  const adherence = ncmAdherence(code);
  const margemComercial = numInput('com_margem', 20) / 100;
  let retention = null;
  let declaredValue = parseMoney(ids.valor);
  let valorComBeneficioMip = seg === 'industria' ? declaredValue : declaredValue * margemComercial;
  let valorSemBeneficioRaw = (document.getElementById(ids.valorSem)?.value || '').trim();
  let valorSemBeneficioInformado = valorSemBeneficioRaw !== '';
  let valorSemBeneficioDeclarado = parseMoney(ids.valorSem);
  let valorSemBeneficioMip = seg === 'industria' ? valorSemBeneficioDeclarado : valorSemBeneficioDeclarado * margemComercial;
  let valueBRL = valorSemBeneficioInformado ? Math.max(0, valorComBeneficioMip - valorSemBeneficioMip) : valorComBeneficioMip;
  if (tipoAnalise === 'retencao') {
    const retAtualDeclarado = parseMoney('ret_producao_atual');
    const retBenefAtualDeclarado = parseMoney('ret_producao_beneficio_atual') || retAtualDeclarado;
    const retPleitoDeclarado = parseMoney('ret_producao_pleito_atendido') || retAtualDeclarado || declaredValue;
    const retSemAcordoDeclarado = parseMoney('ret_producao_sem_acordo');
    const conv = v => seg === 'industria' ? v : v * margemComercial;
    const retAtualMip = conv(retAtualDeclarado);
    const retBenefAtualMip = conv(retBenefAtualDeclarado);
    const retPleitoMip = conv(retPleitoDeclarado);
    const retSemAcordoMip = conv(retSemAcordoDeclarado);
    const retBenefAtualPct = Math.min(1, Math.max(0, numInput('ret_beneficio_atual_pct', 0) / 100));
    const retBenefPleiteadoPct = Math.min(1, Math.max(0, numInput('ret_beneficio_pleiteado_pct', 74.25) / 100));
    const retProbSaida = Math.min(1, Math.max(0, numInput('ret_prob_saida_pct', 100) / 100));
    const retEmpAtual = Number(document.getElementById('ret_empregos_atuais')?.value || 0);
    const retEmpPleitoRaw = (document.getElementById('ret_empregos_pleito')?.value || '').trim();
    const retEmpSemRaw = (document.getElementById('ret_empregos_sem_acordo')?.value || '').trim();
    const retEmpPleito = retEmpPleitoRaw === '' ? (retEmpAtual || Number(document.getElementById(ids.empregos)?.value || 0)) : Number(retEmpPleitoRaw || 0);
    const retEmpSem = retEmpSemRaw === '' ? 0 : Number(retEmpSemRaw || 0);
    declaredValue = retPleitoDeclarado;
    valorComBeneficioMip = retPleitoMip;
    valorSemBeneficioDeclarado = retSemAcordoDeclarado;
    valorSemBeneficioMip = retSemAcordoMip;
    valorSemBeneficioInformado = true;
    valueBRL = Math.max(0, retPleitoMip - retSemAcordoMip);
    retention = {
      retAtualDeclarado,
      retBenefAtualDeclarado,
      retPleitoDeclarado,
      retSemAcordoDeclarado,
      retAtualMip,
      retBenefAtualMip,
      retPleitoMip,
      retSemAcordoMip,
      beneficioAtualPct: retBenefAtualPct,
      beneficioPleiteadoPct: retBenefPleiteadoPct,
      probSaida: retProbSaida,
      empAtual: retEmpAtual,
      empPleito: retEmpPleito,
      empSemAcordo: retEmpSem,
      empregosDiretosPreservados: Math.max(0, retEmpPleito - retEmpSem),
      evidencia: (document.getElementById('ret_evidencia_saida')?.value || '').trim(),
      difal: (document.getElementById('ret_ideia_difal')?.value || '').trim()
    };
  }
  if (declaredValue <= 0 || valorComBeneficioMip <= 0) {
    return renderRelatorioParcial(['Valor econômico com benefício maior que zero.']);
  }
  if (valueBRL <= 0) {
    return renderRelatorioParcial([tipoAnalise === 'retencao' ?
      'Produção ou faturamento preservado maior que o cenário sem acordo.' :
      'Valor com benefício maior que o valor sem benefício.']);
  }
  const renunciaMaximaPermitida = Math.min(1, Math.max(0, numInput('renuncia_maxima_permitida', 74.25) / 100));
  const metaRecuperacaoTributos = Math.min(1, Math.max(0, numInput(retention ? 'ret_meta_recuperacao_tributos' : ids.meta, 100) / 100));
  const renunciaPctSolicitada = retention ? retention.beneficioPleiteadoPct : Math.min(1, Math.max(0, numInput(ids.renuncia, 0) / 100));
  const renunciaPct = Math.min(renunciaPctSolicitada, renunciaMaximaPermitida);
  const directJobs = retention ? retention.empregosDiretosPreservados : Number(document.getElementById(ids.empregos)?.value || 0);
  const salario = parseMoney(ids.salario);
  const localRaw = (document.getElementById('local')?.value || '').trim(),
    localShare = localRaw ? Number(localRaw) / 100 : 0;
  const destino = document.getElementById('destino')?.value || '';
  const substituiEstado = document.getElementById('substitui')?.value || 'nao_informado',
    novoProdutoEstado = document.getElementById('novo_produto')?.value || 'nao_informado',
    estrategicoEstado = document.getElementById('estrategico')?.value || 'nao_informado';
  const substitui = substituiEstado === 'sim',
    novoProduto = novoProdutoEstado === 'sim',
    estrategico = estrategicoEstado === 'sim';
  const adicionalidade = document.getElementById('adicionalidade')?.value || 'nao_informado';
  const permanencia = Number(document.getElementById('permanencia_anos')?.value || 0);
  const ativosRecRaw = (document.getElementById('ativos_recuperaveis_pct')?.value || '').trim();
  const ativosRecPct = ativosRecRaw ? Number(ativosRecRaw) : null,
    ativosIrrPct = ativosRecPct === null ? null : Math.max(0, 100 - ativosRecPct);
  const investimentoPrivadoInformado = parseMoney('investimento_privado');
  const investimentoTerrenoImovel = parseMoney('investimento_terreno_imovel');
  const investimentoObras = parseMoney('investimento_obras');
  const investimentoOutros = parseMoney('investimento_outros');
  const investimentoDetalhado = investimentoTerrenoImovel + investimentoObras + investimentoOutros;
  const investPrivado = investimentoPrivadoInformado || investimentoDetalhado;
  const constructionImpact = constructionEmploymentImpact(investimentoObras);
  const imovelTipo = document.getElementById('imovel_tipo')?.value || '';
  const equipamentosAdquiridosRaw = (document.getElementById('equipamentos_adquiridos_pct')?.value || '').trim();
  const equipamentosAdquiridosPct = equipamentosAdquiridosRaw ? Number(equipamentosAdquiridosRaw) : null;
  const incentivoLocacional = document.getElementById('incentivo_locacional')?.value || '';
  const municipioSelecionado = resolveMunicipalitySelection(ids);
  const mun = municipioSelecionado.codigo,
    munObj = municipioSelecionado.row;
  const hasValidMunicipio = !!mun && !!munObj;
  const munName = munObj?.nome || 'Município não informado',
    munTotal = Number(munObj?.total_emprego || 0);
  const medianMun = municipalities.map(m => Number(m.total_emprego || 0)).sort((a, b) => a - b)[Math.floor(municipalities.length / 2)] || 0;
  const targetShare = Math.min(1, Math.max(0.1, numInput('impact_share', 50) / 100));
  const territorialModule = window.TerritorioCalculo?.calcularModuloTerritorial({
    origin: mun,
    sectorCode: code,
    valueBRL,
    targetShare,
    hasValidMunicipio
  }) || {};
  const indirectSectorsAll = territorialModule.indirectSectorsAll || allIndirectSectors(code, valueBRL);
  const impactSectors = concentrationSectors(code, valueBRL, targetShare);
  const tradableIndirectSectorsAll = territorialModule.tradableIndirectSectorsAll ||
    indirectSectorsAll.filter(s => isTradableSupplierSector(s.codigo));
  const impactSectorsTerritoriais = territorialModule.impactSectorsTerritoriais ||
    selectImpactSectorsByShare(tradableIndirectSectorsAll, targetShare);
  const spatialImpactVector = territorialModule.spatialImpactVector || [];
  const economicBase = economicImpactAnalysis({
    valueBRL,
    r,
    directJobs
  });
  const prod = economicBase.producaoTotal,
    va = economicBase.valorAdicionado;
  const indirectJobs = economicBase.empregosIndiretos,
    totalJobs = economicBase.empregosTotais;
  const expectedDirectJobs = economicBase.empregosDiretosReferencia;
  const fiscalValueWith = retention ? retention.retPleitoDeclarado : declaredValue;
  const fiscalValueWithout = retention ? retention.retSemAcordoDeclarado :
    (valorSemBeneficioInformado ? valorSemBeneficioDeclarado : 0);
  const fiscalProdutos = calcularFiscalProdutos({
    fiscalValueWith,
    fiscalValueWithout,
    mipIncrement: valueBRL,
    sectorDirectCoefficient: Number(r.direto || 0)
  });
  const directCoefficient = fiscalProdutos.effectiveDirectCoefficient;
  const directCoefficientEquivalentMip = fiscalProdutos.equivalentMipCoefficient;
  const taxDirectGross = fiscalProdutos.directIncrement,
    taxIndirect = valueBRL * Number(r.indireto || 0);
  const renuncia = taxDirectGross * renunciaPct,
    taxDirectNet = taxDirectGross - renuncia,
    tax = taxIndirect + taxDirectNet;
  const taxRenuncia = renuncia > 0 ? tax / renuncia : null;
  let retentionFiscal = null,
    renunciaBaseDecisao = renuncia;
  if (retention) {
    const tdc = directCoefficient,
      tic = Number(r.indireto || 0);
    const renunciaAtual = retention.retBenefAtualDeclarado * tdc * retention.beneficioAtualPct;
    const renunciaPleito = retention.retPleitoDeclarado * tdc * renunciaPct;
    const renunciaIncremental = Math.max(0, renunciaPleito - renunciaAtual);
    const receitaDiretaLiquidaAtual = retention.retBenefAtualDeclarado * tdc * (1 - retention.beneficioAtualPct);
    const receitaDiretaLiquidaPleito = retention.retPleitoDeclarado * tdc * (1 - renunciaPct);
    const receitaDiretaLiquidaSemAcordo = retention.retSemAcordoDeclarado * tdc;
    const tributosIndiretosAtuais = retention.retBenefAtualMip * tic;
    const tributosIndiretosPreservados = valueBRL * tic;
    const perdaDiretaLiquidaEvitada = Math.max(0, receitaDiretaLiquidaPleito - receitaDiretaLiquidaSemAcordo);
    const perdaFiscalEvitada = perdaDiretaLiquidaEvitada + tributosIndiretosPreservados;
    const perdaFiscalEsperada = perdaFiscalEvitada * retention.probSaida;
    const beneficioCustoIncremental = renunciaIncremental > 0 ? perdaFiscalEsperada / renunciaIncremental : (perdaFiscalEsperada > 0 ? Infinity : null);
    retentionFiscal = {
      renunciaAtual,
      renunciaPleito,
      renunciaIncremental,
      receitaDiretaLiquidaAtual,
      receitaDiretaLiquidaPleito,
      receitaDiretaLiquidaSemAcordo,
      tributosIndiretosAtuais,
      tributosIndiretosPreservados,
      perdaDiretaLiquidaEvitada,
      perdaFiscalEvitada,
      perdaFiscalEsperada,
      beneficioCustoIncremental
    };
    renunciaBaseDecisao = renunciaIncremental > 0 ? renunciaIncremental : renunciaPleito;
  }
  const neutralidadeFiscal = valorSemBeneficioInformado ? neutralidadeFiscalProdutosAnalysis({
    fiscalValueWith,
    fiscalValueWithout,
    mipIncrement: valueBRL,
    renunciaPctAtual: renunciaPctSolicitada,
    tauMax: renunciaMaximaPermitida,
    directCoefficient,
    tic: Number(r.indireto || 0),
    metaRecuperacao: metaRecuperacaoTributos
  }) : null;
  const costPerJob = renunciaBaseDecisao > 0 && totalJobs > 0 ? renunciaBaseDecisao / totalJobs : null;
  const costPerDirectJob = renunciaBaseDecisao > 0 && directJobs > 0 ? renunciaBaseDecisao / directJobs : null;
  const costPerVA = renunciaBaseDecisao > 0 && va > 0 ? renunciaBaseDecisao / va : null;
  const qlTopCount = Number(territorialModule.qlTopCount || 0);
  const spatialScores = territorialModule.spatialScores || [];
  const highAbsorptionRows = territorialModule.highAbsorptionRows || [];
  const territorialAbsorption = territorialModule.territorialAbsorption || {
    count: 0,
    share: 0,
    score: 0,
    level: 'Baixa'
  };
  window.MapaTerritorial?.setState({
    impactSectors: impactSectorsTerritoriais,
    spatialScores
  });
  const locational = locationalAssessment(mun, territorialAbsorption);
  const territorialShare = munTotal > 0 ? totalJobs / munTotal : null;
  const adensamento = (localShare * 0.45) + (Math.min(Number(r.producao || 0) / Math.max(Number(medias.producao || 1), 0.0001), 2) / 2 * 0.35) + (Math.min(qlTopCount, 3) / 3 * 0.20);
  const comOrigemProd = seg === 'comercio' ? (document.getElementById('com_origem_produtos')?.value || '') : '';
  const comDestVendas = seg === 'comercio' ? (document.getElementById('com_destino_vendas')?.value || '') : '';
  const comOrigemLocal = comOrigemProd === 'local_pb',
    comDestinoLocal = comDestVendas === 'pb';
  const fiscal = fiscalReturnAnalysis(valueBRL, directCoefficientEquivalentMip, Number(r.indireto || 0), renunciaPct);
  const wageReturn = wageReturnAnalysis(valueBRL, r, directJobs, salario, directCoefficientEquivalentMip, renunciaPct, indirectSectorsAll);
  const social = socialViabilityAnalysis(valueBRL, Number(r.va || 0), directCoefficientEquivalentMip, renunciaPct);
  const wageCB = wageCostBenefitAnalysis(wageReturn);
  const tech = techInfo(code),
    mainSpec = robustSpecialization(code, mun);
  const estrutura = sectorStructureInfo(code, r);
  const adicionalidadeParaRisco = retention ? (retention.evidencia ? 'menor_escala' : 'nao_informado') : adicionalidade;
  const rentRisk = rentSeekingAssessment({
    renunciaPct,
    taxRenuncia,
    directJobs,
    expectedDirectJobs,
    localRaw,
    localShare,
    r,
    adicionalidade: adicionalidadeParaRisco,
    permanencia,
    ativosRecuperaveisPct: ativosRecPct,
    investimentoPrivado: investPrivado,
    novoProduto,
    estrategico,
    seg,
    comOrigemLocal,
    comDestinoLocal,
    estrutura,
    incentivoLocacional
  });
  const w = weights();
  const criteria = {
    producao: Number(r.producao || 0) > Number(medias.producao || 0) ? 1 : 0,
    va: Number(r.va || 0) > Number(medias.va || 0) ? 1 : 0,
    empregoMult: Number(r.emprego_por_R$_milhao || 0) > Number(medias.emprego_por_R$_milhao || 0) ? 1 : 0,
    tributosMult: Number(r.tributos || 0) > Number(medias.tributos || 0) ? 1 : 0,
    beneficioCusto: taxRenuncia === null ? 0 : Math.min(1, taxRenuncia / 2),
    empregoDireto: directJobs > 0 && directJobs > expectedDirectJobs ? 1 : 0,
    comprasLocais: localRaw && localShare > Number(r.participacao_insumos_domesticos || 0) ? 1 : 0,
    tecnologia: seg === 'industria' ? Math.min(1, tech.scoreNorm) : 0,
    territorioQl: mun && impactSectorsTerritoriais.length ? Math.min(1, qlTopCount / impactSectorsTerritoriais.length) : 0,
    abrangenciaMunicipal: territorialAbsorption.score,
    territorioBase: (mun && munTotal > 0 && munTotal < medianMun && totalJobs > 0) ? 1 : 0,
    desconcentracaoEconomica: locational.score,
    tempoProjeto: permanencia > 0 ? Math.min(1, permanencia / 10) : 0,
    ativosIrrecuperaveis: ativosIrrPct === null ? 0 : Math.min(1, ativosIrrPct / 100),
    destino: (destino === 'Exportação' || destino === 'Outras UFs' || destino === 'Misto') ? 1 : 0,
    substituicao: substitui ? 1 : 0,
    produtoNovo: novoProduto ? 1 : 0,
    estrategia: (estrategico || r.setor_chave) ? 1 : 0,
    comOrigemLocal: comOrigemLocal ? 1 : 0,
    comDestinoLocal: comDestinoLocal ? 1 : 0
  };
  if (retention) {
    const retRazaoFiscal = retentionFiscal?.beneficioCustoIncremental;
    const evidenciaOk = retention.evidencia.length >= 40 ? 1 : retention.evidencia.length > 0 ? 0.5 : 0;
    const riscoSaidaPontuado = Math.min(1, retention.probSaida) * evidenciaOk;
    Object.assign(criteria, {
      producao: valueBRL > 0 ? Math.min(1, valueBRL / Math.max(retention.retAtualMip || valueBRL, 1)) : 0,
      va: Number(r.va || 0) > Number(medias.va || 0) ? 1 : 0,
      empregoMult: Number(r.emprego_por_R$_milhao || 0) > Number(medias.emprego_por_R$_milhao || 0) ? 1 : 0,
      tributosMult: Number(r.tributos || 0) > Number(medias.tributos || 0) ? 1 : 0,
      beneficioCusto: retRazaoFiscal === Infinity ? 1 : (retRazaoFiscal === null || retRazaoFiscal === undefined ? 0 : Math.min(1, retRazaoFiscal / 2)),
      empregoDireto: directJobs > 0 ? Math.min(1, directJobs / Math.max(retention.empAtual || directJobs, 1)) : 0,
      comprasLocais: localRaw && localShare > Number(r.participacao_insumos_domesticos || 0) ? 1 : 0,
      territorioQl: mun && impactSectorsTerritoriais.length ? Math.min(1, qlTopCount / impactSectorsTerritoriais.length) : 0,
      abrangenciaMunicipal: territorialAbsorption.score,
      territorioBase: riscoSaidaPontuado,
      desconcentracaoEconomica: locational.score,
      tempoProjeto: permanencia > 0 ? Math.min(1, permanencia / 10) : 0,
      ativosIrrecuperaveis: ativosIrrPct === null ? 0 : Math.min(1, ativosIrrPct / 100),
      estrategia: (estrategico || r.setor_chave) ? 1 : 0
    });
  }
  const weightTotal = Object.values(w).reduce((acc, v) => acc + Math.max(0, Number(v || 0)), 0) || 1;
  const weightedScore = Object.entries(criteria).reduce((acc, [k, v]) => acc + Math.max(0, Number(w[k] || 0)) * v, 0);
  const score = Math.min(10, (weightedScore / weightTotal) * 10),
    sig = signal(score, tipoAnalise);
  const razaoSocial = (document.getElementById('razao_social')?.value || '').trim();
  const cnpjVal = (document.getElementById('cnpj')?.value || '').trim();
  const cnpjRfProfile = getCnpjRfProfile(cnpjVal);
  const cnpjRfReportHtml = !cnpjVal ? '' : (cnpjRfProfile ?
    renderCnpjRfProfileHtml(cnpjRfProfile, 'Caracterização cadastral da empresa') :
    '<div class="warning"><b>Caracterização cadastral não incorporada:</b> o CNPJ informado não foi localizado no índice local da Receita Federal. Os dados declarados permanecem no relatório, mas devem ser conferidos em diligência.</div>');
  const protocolo = (document.getElementById('protocolo')?.value || '').trim();
  const macroLabel = seg === 'industria' ? 'Indústria' : 'Comércio';
  const modoLabel = tipoAnalise === 'retencao' ? 'Empresa existente / retenção' : 'Nova empresa ou expansão';
  const macroAviso = seg === 'comercio' ? `<div class="warning"><b>Aviso metodológico — Comércio:</b> O choque foi calculado sobre o acréscimo de margem comercial estimada (${br(numInput('com_margem',20),1)}% da diferença de faturamento com e sem benefício). Multiplicadores MIP são médias setoriais e podem superestimar efeitos indiretos para empresas com fornecedores majoritariamente fora do estado. Os critérios de origem dos produtos e destino das vendas têm pesos diferenciados nesta avaliação.</div>` : '';
  const modoAviso = retention ? `<div class="warning"><b>Modo retenção:</b> o choque aplicado à MIP corresponde à produção ou margem preservada caso o pleito seja atendido, comparada ao cenário sem acordo. A nota tem interpretação de subsídio para manter atividade econômica existente, não de atração de novo empreendimento.</div>` : '';
  const adicionalidadeAviso = !valorSemBeneficioInformado ? `<div class="warning"><b>Ganho adicional para o Estado não informado:</b> como o valor sem benefício não foi preenchido, o painel assumiu que todo o valor com benefício é acréscimo atribuível ao incentivo.</div>` : '';
  const tetoAviso = renunciaPctSolicitada > renunciaMaximaPermitida ? `<div class="warning"><b>Renúncia pleiteada acima do teto:</b> os cálculos fiscais usaram ${br(renunciaMaximaPermitida*100,2)}%, embora o formulário informe ${br(renunciaPctSolicitada*100,2)}%.</div>` : '';
  const pesoWarning = pesoState.modified && pesoState.user ? `<div class="warning"><b>⚠ Pesos modificados nesta sessão por ${escapeHtml(pesoState.user)}</b></div>` : '';
  const topRows = impactSectorsTerritoriais.map(s => `<tr><td>${s.codigo}</td><td>${s.setor}</td><td>${br(s.coef,4)}</td><td>${money(s.impacto)}</td><td>${br(s.participacao*100,1)}%</td><td>${br(s.participacao_acumulada*100,1)}%</td></tr>`).join('') || '<tr><td colspan="6">Os efeitos indiretos estimados não se concentram em setores tradables relevantes para fornecimento intermunicipal.</td></tr>';
  const spatialRowsHtml = highAbsorptionRows.slice(0, 12).map(s => `<tr><td>${s.nome}</td><td><span class="ok">${escapeHtml(s.capacidade_classe)}</span></td><td>${br(s.score,1)}</td><td>${s.dist_km==null?'-':br(s.dist_km,1)}</td><td>${br(s.peso_hierarquico,1)}</td><td>${escapeHtml(s.principal_setor||'-')}</td><td>${money(s.principal_vendas_observadas||0)}</td><td>${money(s.principal_fluxo_alvo||0)}</td><td>${br((s.principal_retencao_pb||0)*100,1)}%</td></tr>`).join('') || '<tr><td colspan="9">Nenhum município foi classificado com alta capacidade territorial de absorção nos setores tradables indiretamente impactados.</td></tr>';
  const qlRows = impactSectorsTerritoriais.map(s => {
    const spec = robustSpecialization(s.codigo, mun);
    return `<tr><td>${s.codigo}</td><td>${s.setor}</td><td>${mun?br(spec.ql,2):'-'}</td><td>${mun?br(spec.emp,0):'-'}</td><td>${spec.ok?'<span class="ok">especialização robusta</span>':'<span class="bad">sem especialização robusta</span>'}</td></tr>`;
  }).join('') || '<tr><td colspan="5">Sem setores tradables relevantes no vetor territorial.</td></tr>';
  const specializedRows = specializedSectors(mun, impactSectorsTerritoriais).slice(0, 15);
  const specializedImpact = specializedRows.filter(r => r.impacted);
  const specializedMsg = specializedImpact.length ? `O município é especializado em ${specializedImpact.length} setor(es) tradable(s) indiretamente impactado(s).` : 'O município não apresenta especialização robusta nos setores tradables indiretamente impactados.';
  const specializedHtml = specializedRows.length ? specializedRows.map(r => `<tr><td class="${r.impacted?'ok':''}">${r.codigo}</td><td class="${r.impacted?'ok':''}">${r.setor}</td><td>${br(r.ql,2)}</td><td>${br(r.emprego,0)}</td><td>${r.impacted?'Impactado':''}</td></tr>`).join('') : '<tr><td colspan="5">Município sem especialização robusta na base de emprego formal.</td></tr>';
  const ncmRows = seg === 'industria' ? (tech.ncm.rows.length ? tech.ncm.rows.map(n => `<tr><td>${n.ncm}</td><td>${techLabel(n.nome_conteudo)}</td><td>${n.codigo_setor}</td></tr>`).join('') : '<tr><td colspan="3">Nenhum NCM informado/localizado.</td></tr>') : '<tr><td colspan="3">NCM não aplicável ao macrossegmento Comércio.</td></tr>';
  const socialRows = social.rows.map(row => `<tr><td>${row.year}</td><td>${money(row.renuncia)}</td><td>${money(row.va)}</td><td>${money(row.net)}</td><td>${money(row.cumulativeNet)}</td></tr>`).join('');
  const wageComponentRows = wageReturn.indirectComponents?.length ? wageReturn.indirectComponents.map(s => `<tr><td>${s.codigo}</td><td>${s.setor}</td><td>${br(s.jobs,2)}</td><td>${s.annualWage?money(s.annualWage):'-'}</td><td>${money(s.wageMass)}</td></tr>`).join('') : '<tr><td colspan="5">Sem decomposição setorial disponível.</td></tr>';
  const wageCBRows = wageCB.rows.map(row => `<tr><td>${row.year}</td><td>${money(row.renuncia)}</td><td>${money(row.combined)}</td><td>${money(row.net)}</td><td>${money(row.cumulativeNet)}</td></tr>`).join('');
  const rentAlerts = rentRisk.alerts.length ? rentRisk.alerts.map(a => `<li>${a}</li>`).join('') : '<li>Sem alerta relevante com as informações fornecidas.</li>';
  const economicImpact = economicImpactAnalysis({
    valueBRL,
    r,
    directJobs,
    salario,
    renunciaBaseDecisao,
    wageReturn
  });
  const perMR = economicImpact.porRenuncia;
  const impactosEsperados = {
    ...economicImpact.impactosEsperados,
    empregosImplantacaoDiretos: constructionImpact.diretos,
    empregosImplantacaoIndiretos: constructionImpact.indiretos,
    empregosImplantacaoTotal: constructionImpact.total
  };
  const externalScenario = externalSupplyScenarioAnalysis({
    declaredValue: fiscalProdutos.fiscalIncrement,
    valorComBeneficioMip,
    valueBRL,
    prod,
    va,
    totalJobs,
    wageMass: impactosEsperados.massaSalarialMip,
    taxLocal: tax,
    renuncia: renunciaBaseDecisao,
    tdc: directCoefficientEquivalentMip,
    tic: Number(r.indireto || 0),
    ufAlternativa: document.getElementById('ext_uf_alternativa')?.value || '',
    renunciaPctAtual: renunciaPct,
    receitaEntradaOverride: fiscalProdutos.difalRevenue,
    metodologiaEntrada: fiscalProdutos.difalMethod === 'produtos' ?
      'Composição por produtos' :
      (fiscalProdutos.difalMethod === 'hibrido_produtos_mip' ? 'Composição por produtos + fallback setorial' : 'Proxy setorial da MIP')
  });
  const empresaGrupoMunicipal = broadSectorFromSCN(code);
  const empresaVaSetorialMunicipio = municipalEconomicMass(mun, empresaGrupoMunicipal);
  const empresaVaSemPublicoMunicipio = Number((pibMunicipal[mun] || {}).va_sem_publico || 0);
  const empresaPibMunicipio = Number((pibMunicipal[mun] || {}).pib || 0);
  const empresaProducaoSobrePibMunicipal = empresaPibMunicipio > 0 ? valorComBeneficioMip / empresaPibMunicipio : null;
  const empresaProducaoSobreVaSetor = empresaVaSetorialMunicipio > 0 ? valorComBeneficioMip / empresaVaSetorialMunicipio : null;
  const investimentoSobreVaSetor = empresaVaSetorialMunicipio > 0 && investPrivado > 0 ? investPrivado / empresaVaSetorialMunicipio : null;
  const empregosDiretosSobreMunicipio = munTotal > 0 ? directJobs / munTotal : null;
  const municipalIndicators = {
    municipio: munName,
    codigoMunicipio: mun,
    grupo: broadSectorLabel(empresaGrupoMunicipal),
    valorEmpresaComBeneficio: valorComBeneficioMip,
    choqueConsiderado: valueBRL,
    pibMunicipal: empresaPibMunicipio,
    vaSetorialMunicipio: empresaVaSetorialMunicipio,
    vaSemPublicoMunicipio: empresaVaSemPublicoMunicipio,
    producaoSobrePibMunicipal: empresaProducaoSobrePibMunicipal,
    producaoSobreVaSetor: empresaProducaoSobreVaSetor,
    investimentoPrivadoConsiderado: investPrivado,
    investimentoSobreVaSetor,
    empregosDiretos: directJobs,
    totalEmpregoFormalMunicipio: munTotal,
    empregosDiretosSobreMunicipio,
    desconcentracaoEconomica: locational
  };
  const missingQualifiers = missingQualifiersForAI(w);
  const dataQuality = qualityAssessment({
    seg,
    tipoAnalise,
    mun,
    valorCom: valorComBeneficioMip,
    valorSemInformado: valorSemBeneficioInformado,
    directJobs,
    salario,
    localRaw,
    adicionalidade,
    permanencia,
    investPrivado,
    ativosRecPct,
    ncmCount: getNcmValues().length,
    retentionEvidence: retention?.evidencia || '',
    comOrigemProd,
    comDestVendas
  });
  const plausibility = plausibilityAssessment({
    valorCom: valorComBeneficioMip,
    valorChoque: valueBRL,
    directJobs,
    expectedDirectJobs,
    salario,
    investPrivado: investPrivado,
    renunciaPct,
    neutralidadeFiscal,
    taxRenuncia
  });
  const additionality = additionalityAssessment({
    tipoAnalise,
    adicionalidade,
    valorCom: valorComBeneficioMip,
    valorSem: valorSemBeneficioMip,
    incremento: valueBRL,
    retention,
    permanencia,
    investPrivado,
    ativosRecPct
  });
  const sensitivity = sensitivityAnalysisV17({
    fiscalValueWithout,
    fiscalIncrement: fiscalProdutos.fiscalIncrement,
    mipIncrement: valueBRL,
    renunciaPctSolicitada,
    renunciaMaximaPermitida,
    directCoefficient,
    tic: Number(r.indireto || 0),
    metaRecuperacao: metaRecuperacaoTributos,
    r,
    directJobs
  });
  const documentaryEvidence = null;
  const economicAssessment = economicDimensionAssessment({
    criteria,
    weights: w,
    rentRisk,
    additionality,
    dataQuality,
    territorialAbsorption
  });
  const fiscalAssessment = fiscalDimensionAssessment({
    criteria,
    weights: w,
    neutralidadeFiscal,
    taxRenuncia,
    externalScenario,
    sensitivity
  });
  const fainInput = {
    enquadramento: document.getElementById('fain_enquadramento')?.value || 'nao_informado',
    incrementoCapacidadePct: numInput('fain_incremento_capacidade_pct', 0),
    projetoCinep: document.getElementById('fain_projeto_cinep')?.value || 'nao_informado',
    atividadeElegivel: document.getElementById('fain_atividade_elegivel')?.value || 'nao_informado',
    domicilioPb: document.getElementById('fain_domicilio_pb')?.value || 'nao_informado',
    inscricaoIcms: document.getElementById('fain_inscricao_icms')?.value || 'nao_informado',
    adimplencia: document.getElementById('fain_adimplencia')?.value || 'nao_informado',
    naoSimples: document.getElementById('fain_nao_simples')?.value || 'nao_informado',
    contrapartidas: document.getElementById('fain_contrapartidas')?.value || 'nao_informado',
    semOutroBeneficio: document.getElementById('fain_sem_outro_beneficio')?.value || 'nao_informado',
    ncmProducao: document.getElementById('fain_ncm_producao')?.value || 'nao_informado',
    certidaoSemSimilar: document.getElementById('fain_certidao_sem_similar')?.value || 'nao_informado'
  };
  const fainChecklist = fainChecklistAssessment({
    seg,
    situacaoCadastral: document.getElementById('situacao_cadastral')?.value || '',
    renunciaPctSolicitada,
    renunciaMaximaPermitida,
    fain: fainInput,
    ncmCount: getNcmValues().length,
    produtoNovoEstado: novoProdutoEstado,
    investPrivado,
    directJobs,
    valorComBeneficioMip
  });
  const fainStatusClass = status => status === 'atendido' ? 'ok' : (status === 'nao_atendido' ? 'bad' : 'risk-mid');
  const fainStatusLabel = status => ({
    atendido: 'Atendido',
    pendente: 'Pendente',
    nao_atendido: 'Não atendido',
    informativo: 'Informativo'
  } [status] || 'Pendente');
  const fainRowsHtml = fainChecklist.checks.map(item => `
    <tr>
      <td>${escapeHtml(item.grupo)}</td>
      <td>${escapeHtml(item.item)}</td>
      <td class="${fainStatusClass(item.status)}"><b>${escapeHtml(fainStatusLabel(item.status))}</b></td>
      <td>${item.critico ? 'Crítico' : 'Documental/informativo'}</td>
      <td>${escapeHtml(item.evidencia)}</td>
    </tr>`).join('');
  const fainNotesHtml = fainChecklist.notes.length ?
    `<ul>${fainChecklist.notes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` :
    '<p>Sem observações automáticas adicionais.</p>';
  const synthesis = decisionSynthesis({
    economic: economicAssessment,
    fiscal: fiscalAssessment,
    documentary: documentaryEvidence
  });
  const executiveSummary = buildExecutiveSummary({
    sig,
    score,
    tipoAnalise,
    economic: economicAssessment,
    fiscal: fiscalAssessment,
    documentary: documentaryEvidence,
    synthesis,
    neutralidadeFiscal,
    rentRisk,
    quality: dataQuality,
    plausibility,
    additionality,
    territorialAbsorption,
    locational,
    costPerJob,
    impactosEsperados,
    missingQualifiers
  });
  const summaryPositiveHtml = executiveSummary.positives.length ? executiveSummary.positives.map(x => `<li>${escapeHtml(x)}</li>`).join('') : '<li>Sem ponto favorável automático destacado.</li>';
  const summaryCautionHtml = executiveSummary.cautions.length ? executiveSummary.cautions.map(x => `<li>${escapeHtml(x)}</li>`).join('') : '<li>Sem alerta automático adicional.</li>';
  const qualityMissingHtml = dataQuality.missing.length ? dataQuality.missing.slice(0, 7).map(x => `<li>${escapeHtml(x)}</li>`).join('') : '<li>Campos principais suficientes para leitura preliminar.</li>';
  const plausibilityAlertsHtml = plausibility.alerts.length ? plausibility.alerts.map(x => `<li>${escapeHtml(x)}</li>`).join('') : '<li>Sem alerta automático de plausibilidade nos dados declarados.</li>';
  const additionalityNotesHtml = additionality.notes.length ? additionality.notes.map(x => `<li>${escapeHtml(x)}</li>`).join('') : '<li>Sem nota automática sobre ganho adicional para o Estado.</li>';
  const sensitivityRows = sensitivity.scenarios.map(s => `<tr><td>${s.nome}</td><td>${money(s.incremento)}</td><td>${s.neutralidade?'<span class="ok">Atendida</span>':'<span class="bad">Não atendida</span>'}</td><td>${money(s.diferenca)}</td><td>${money(s.producao)}</td><td>${br(s.empregos,1)}</td></tr>`).join('');
  const noteSensitivity = scoreSensitivityAnalysis({
    criteria,
    weights: w,
    currentScore: score,
    target: 7,
    seg,
    locationalContext: locational,
    tipoAnalise
  });
  const noteSensitivityLeverRows = noteSensitivity.levers.slice(0, 14).map(item => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.status)}</td><td>${br(item.weight,2)}</td><td>${br(item.current*100,0)}%</td><td>${br(item.gain,2)}</td><td>${item.actionable?'Sim':'Não'}</td><td>${escapeHtml(item.note)}</td></tr>`).join('');
  const noteSensitivityComboSource = noteSensitivity.viable.length ? noteSensitivity.viable : noteSensitivity.near;
  const noteSensitivityComboRows = noteSensitivityComboSource.length ? noteSensitivityComboSource.map((combo, idx) => `<tr><td>${idx+1}</td><td>${combo.items.map(i=>escapeHtml(i.label)).join('<br>')}</td><td>${combo.items.map(i=>escapeHtml(i.type)).join('<br>')}</td><td>${br(combo.gain,2)}</td><td><b class="${combo.score>=7?'ok':'risk-mid'}">${br(combo.score,1)}</b></td><td>${combo.score>=7?'Atinge 7, se comprovado/pactuado.':'Não atinge 7 sozinho; indica melhor combinação próxima.'}</td></tr>`).join('') : '<tr><td colspan="6">Não há combinação negociável suficiente com os critérios atuais.</td></tr>';
  const pctOrDash = x => x === null || x === undefined || !Number.isFinite(Number(x)) ? '-' : br(Number(x) * 100, 1) + '%';
  const investimentoSobreVaSetorTexto = investPrivado <= 0 ? 'Não informado' : (municipalIndicators.investimentoSobreVaSetor === null ? 'VA setorial não disponível' : pctOrDash(municipalIndicators.investimentoSobreVaSetor));
  const impactosTitulo = retention ? 'Impactos preservados na economia Paraibana' : 'Impactos esperados na economia Paraibana';
  const impactosHint = retention ? 'Os valores são calculados sobre a produção ou margem preservada no cenário em que o pleito é atendido, em comparação com o cenário sem acordo.' : 'Os valores são calculados sobre o acréscimo de produção ou de margem atribuído ao benefício. A massa salarial estimada pela MIP considera os empregos diretos e indiretos associados aos coeficientes médios setoriais, mantendo a leitura coerente com o valor adicionado estimado.';
  const empregosDiretosLabel = retention ? 'Empregos diretos preservados' : 'Empregos diretos informados';
  const setorChaveLabel = r.setor_chave ? 'Sim' : 'Não';
  const setorChaveClass = r.setor_chave ? 'ok' : 'bad';
  const custoEmpregoValor = costPerJob === null ? '-' : money(costPerJob);
  const imovelTipoLabel = {
    proprio: 'Próprio',
    alugado: 'Alugado',
    comodato: 'Cedido/comodato',
    outro: 'Outro'
  } [imovelTipo] || 'Não informado';
  const incentivoLocacionalLabel = {
    sim: 'Sim',
    nao: 'Não'
  } [incentivoLocacional] || 'Não informado';
  const neutralidadeGap = neutralidadeFiscal ? neutralidadeFiscal.diferencaFiscal : null;
  const neutralidadeHint = !neutralidadeFiscal ? 'Informe valor sem benefício' : (neutralidadeFiscal.atingida ? `Meta ${br(neutralidadeFiscal.metaRecuperacao*100,0)}% atendida; diferença: ${money(neutralidadeGap)}` : `Meta ${br(neutralidadeFiscal.metaRecuperacao*100,0)}% não atendida; benefício para atender: até ${neutralidadeFiscal.renunciaMaximaNeutra===null?'-':br(neutralidadeFiscal.renunciaMaximaNeutra*100,2)+'%'}; acréscimo mínimo: ${neutralidadeFiscal.incrementoNeutro===null?'-':money(neutralidadeFiscal.incrementoNeutro)}`);
  const fiscalProductRowsHtml = fiscalProdutos.rows.length ? fiscalProdutos.rows.map(row => `
    <tr>
      <td>${escapeHtml(row.ncm || '-')}</td>
      <td>${escapeHtml(row.descricao || '-')}</td>
      <td>${br(row.participacaoPct,2)}%</td>
      <td>${br(row.basePct,2)}%</td>
      <td>${row.validoDireto ? br(row.aliquotaEfetivaPct,2)+'%' : '-'}</td>
      <td>${escapeHtml(row.tratamentoLabel)}</td>
      <td>${money(row.directContribution)}</td>
      <td>${row.validoDifal ? money(row.difalContribution) : '-'}</td>
    </tr>`).join('') : '<tr><td colspan="8">Nenhuma composição fiscal por produto informada.</td></tr>';
  const fiscalWarningsHtml = fiscalProdutos.warnings.length ?
    `<ul>${fiscalProdutos.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` :
    '<p>Composição integral por produtos, sem complemento setorial.</p>';
  const fiscalMethodHtml = `
    <div class="fiscal-method-box">
      <b>Método do tributo direto: ${escapeHtml(fiscalProdutos.methodLabel)}.</b>
      Cobertura por produtos: ${br(fiscalProdutos.directCoverage*100,2)}%.
      Coeficiente efetivo de ICMS: ${br(directCoefficient*100,4)}%;
      média setorial da MIP: ${br(Number(r.direto||0)*100,4)}%.
    </div>`;
  const empregoRenunciaValor = perMR ? `${br(perMR.empregos,1)} por R$ 1 mi` : '-';
  const empregoRenunciaHint = costPerJob === null ? 'Sem renúncia ou empregos estimados' : 'Custo por emprego total: ' + money(costPerJob);
  const helpSetorChave = `Indica se o setor combina, ao mesmo tempo, ligações relevantes para trás e para frente na economia. Em linguagem simples, um setor-chave tanto demanda insumos de outros setores quanto fornece produtos ou serviços importantes para outras atividades. Quando aparece como setor-chave, o benefício tende a ter maior capacidade de espalhar efeitos pela estrutura produtiva local.`;
  const helpRentSeeking = `Indica se há sinais de que o benefício pode estar sendo usado mais como vantagem privada do que como instrumento de desenvolvimento econômico. O alerta combina informações declaradas pela empresa, como ganho adicional para o Estado, permanência, empregos, compras locais e investimento, com características estruturais do setor. Risco alto não significa fraude; significa que o processo precisa de mais comprovação, contrapartidas ou análise documental antes da decisão.`;
  const helpJustificativa = `Mostra se a atividade parece coerente com o perfil produtivo da economia paraibana. Um resultado alto sugere que o setor conversa bem com a estrutura local: compra de fornecedores internos, tem encadeamentos produtivos, gera efeitos relevantes e ocupa uma posição compatível com as capacidades já existentes no estado. Um resultado baixo não impede o projeto, mas indica que ele depende mais de argumentos complementares, como inovação, substituição de importações ou estratégia industrial específica.`;
  const helpNeutralidade = `Mostra se os tributos indiretos gerados pelo acréscimo de produção compensam a meta definida para a renúncia fiscal. A ideia é simples: se o governo abre mão de parte do imposto direto da empresa, o projeto só passa no teste de neutralidade quando a arrecadação indireta gerada em outros setores cobre a parcela da renúncia que o gestor definiu como necessária recuperar. Quando a condição não é atendida, o painel mostra qual percentual de benefício seria compatível com a meta ou qual acréscimo de produção seria necessário.`;
  const helpExternalScenario = `Compara a hipótese de atrair a produção para a Paraíba com a hipótese de a empresa produzir em outro estado e abastecer o mercado paraibano. Quando a composição dos produtos é informada, a estimativa usa as diferenças entre alíquotas interna e interestadual, base tributável, destino das vendas e fator de captura. A parcela não coberta continua sendo uma proxy setorial experimental.`;
  const helpEmpregos = `Soma os empregos diretos declarados pela empresa com os empregos indiretos estimados pela matriz de insumo-produto. Os indiretos aparecem porque a produção da empresa compra insumos, serviços e transporte de outros setores, que também precisam de trabalhadores para atender essa demanda adicional.`;
  const helpEmpregosRenuncia = `Mostra o custo fiscal estimado por posto de trabalho associado ao projeto, considerando empregos diretos informados e empregos indiretos estimados pela matriz de insumo-produto. Quanto menor o custo por emprego, maior a intensidade de trabalho associada ao benefício; mas esse número deve ser lido junto com salário, qualidade dos empregos e permanência do projeto.`;
  const helpMassaSalarial = `Compara a massa salarial anualizada gerada pelo projeto com o benefício tributário concedido. Inclui a massa salarial direta informada pela empresa e uma estimativa da massa salarial indireta nos setores impactados. Ajuda a avaliar se a renúncia retorna para a economia local na forma de renda do trabalho.`;
  const helpComprasLocais = `Mostra a parcela dos insumos que a empresa declara comprar dentro da economia local e compara essa informação com a média do setor. Quanto maior a compra local, maior a chance de o benefício estimular fornecedores paraibanos em vez de vazar para outros estados ou países.`;
  const helpDesconcentracao = `Mostra se a localização do empreendimento contribui para reduzir a concentração econômica nos principais polos metropolitanos da Paraíba. Projetos fora das regiões metropolitanas de João Pessoa e Campina Grande recebem melhor leitura locacional, mas a pontuação também considera se há capacidade territorial para absorver parte dos efeitos indiretos. Assim, o critério não premia interiorização de forma cega: ele valoriza desconcentração com viabilidade produtiva regional.`;
  const helpEncadeamento = `Mostra se o setor tem capacidade de espalhar efeitos pela economia local. Um resultado alto indica que a expansão do setor tende a movimentar fornecedores e atividades relacionadas dentro do estado. É um indicador útil para diferenciar projetos que apenas aumentam a produção de uma empresa daqueles que também ajudam a adensar a cadeia produtiva.`;
  const helpMitigacao = `Indica quanto as características produtivas do setor ajudam a reduzir a suspeita de rent-seeking. Setores com boa justificativa produtiva, bons encadeamentos, conteúdo tecnológico e geração tributária indireta tendem a ter menor risco estrutural. Esse índice não substitui a análise documental da empresa, mas ajuda a calibrar o alerta institucional.`;
  const helpInsumosLocais = `Mostra a importância dos fornecedores locais na estrutura de custos do setor. Quanto maior esse percentual, maior a probabilidade de uma empresa desse setor movimentar a economia estadual quando amplia sua produção.`;
  const helpInsumosExternos = `Mostra a dependência do setor em relação a insumos comprados fora da economia local. Um valor alto sugere vazamento: parte relevante do impulso produtivo pode beneficiar fornecedores de outros estados ou países. Não significa que o setor seja ruim, mas indica que o benefício precisa ser acompanhado de estratégia de adensamento local.`;
  const neutralidadeHtml = neutralidadeFiscal ? `
      <details class="card wide"><summary>Teste de neutralidade fiscal da renúncia (experimental)</summary><div class="card-body">
        ${fiscalMethodHtml}
        <table><tr><th>Mensagem para decisão</th><th>Resultado</th></tr>
          <tr><td>Acréscimo declarado atribuído ao benefício</td><td><b>${money(neutralidadeFiscal.incremento)}</b></td></tr>
          <tr><td>Arrecadação direta estimada antes do aumento</td><td><b>${money(neutralidadeFiscal.arrecadacaoAntesDireta)}</b></td></tr>
          <tr><td>Renúncia fiscal estimada</td><td><b>${money(neutralidadeFiscal.renunciaEstimada)}</b></td></tr>
          <tr><td>Meta de recuperação da renúncia</td><td><b>${br(neutralidadeFiscal.metaRecuperacao*100,0)}%</b></td></tr>
          <tr><td>Tributos indiretos mínimos para atingir a meta</td><td><b>${money(neutralidadeFiscal.arrecadacaoReferencia)}</b></td></tr>
          <tr><td>Tributos indiretos gerados pelo acréscimo</td><td>${money(neutralidadeFiscal.tributosIndiretosIncremento)}</td></tr>
          <tr><td>Diferença em relação à meta</td><td><b class="${neutralidadeFiscal.atingida?'ok':'bad'}">${money(neutralidadeFiscal.diferencaFiscal)}</b></td></tr>
          <tr><td>Acréscimo mínimo para atingir a meta</td><td><b>${neutralidadeFiscal.incrementoNeutro===null?'-':money(neutralidadeFiscal.incrementoNeutro)}</b></td></tr>
          <tr><td>Renúncia máxima compatível com a meta</td><td><b>${neutralidadeFiscal.renunciaMaximaNeutra===null?'-':br(neutralidadeFiscal.renunciaMaximaNeutra*100,2)+'%'}</b></td></tr>
        </table>
        <div class="${neutralidadeFiscal.atingida?'ok-box':'warning'}">${neutralidadeFiscal.atingida?'Os tributos indiretos gerados pelo acréscimo de produção são suficientes para cobrir a meta de recuperação da renúncia fiscal definida.':'Os tributos indiretos gerados pelo acréscimo de produção ainda não cobrem a meta de recuperação da renúncia fiscal definida. O painel mostra o acréscimo mínimo ou, alternativamente, a renúncia máxima compatível com essa meta.'}</div>
        <details class="concept-details" style="margin-top:12px">
          <summary style="cursor:pointer;font-weight:800;color:var(--primary)">Detalhes técnicos da neutralidade fiscal</summary>
          <table><tr><th>Indicador técnico</th><th>Valor</th></tr>
            <tr><td>Produção/faturamento com benefício</td><td>${money(neutralidadeFiscal.valorCom)}</td></tr>
            <tr><td>Produção/faturamento sem benefício</td><td>${money(neutralidadeFiscal.valorSem)}</td></tr>
            <tr><td>Acréscimo fiscal declarado</td><td>${money(neutralidadeFiscal.incrementoFiscal)}</td></tr>
            <tr><td>Acréscimo aplicado à MIP</td><td>${money(neutralidadeFiscal.incrementoMip)}</td></tr>
            <tr><td>Coeficiente efetivo de ICMS</td><td>${br(neutralidadeFiscal.coeficienteDiretoEfetivo*100,4)}%</td></tr>
            <tr><td>Coeficiente tributário direto médio da MIP</td><td>${br(Number(r.direto||0)*100,4)}%</td></tr>
            <tr><td>Meta de recuperação considerada</td><td>${br(neutralidadeFiscal.metaRecuperacao*100,0)}%</td></tr>
            <tr><td>Percentual pleiteado</td><td>${br(neutralidadeFiscal.tauPleiteado*100,2)}%</td></tr>
            <tr><td>Teto de renúncia considerado</td><td>${br(neutralidadeFiscal.tauLimite*100,2)}%</td></tr>
            <tr><td>Percentual aplicado no teste</td><td>${br(neutralidadeFiscal.tauAplicado*100,2)}% ${neutralidadeFiscal.pleiteadoAcimaDoTeto?'<span class="bad">(pleito acima do teto)</span>':''}</td></tr>
            <tr><td>Renúncia fiscal estimada sobre a produção com benefício</td><td>${money(neutralidadeFiscal.renunciaEstimada)}</td></tr>
            <tr><td>Tributos diretos mantidos após renúncia (informativo)</td><td>${money(neutralidadeFiscal.diretoLiquidoCom)}</td></tr>
            <tr><td>Tributos indiretos gerados pelo acréscimo</td><td>${money(neutralidadeFiscal.tributosIndiretosIncremento)}</td></tr>
            <tr><td>Cobertura da renúncia pelos tributos indiretos</td><td>${neutralidadeFiscal.coberturaIndiretaRenuncia===null?'-':br(neutralidadeFiscal.coberturaIndiretaRenuncia,2)}</td></tr>
            <tr><td>Cobertura da meta pelos tributos indiretos</td><td>${neutralidadeFiscal.coberturaIndiretaMeta===null?'-':br(neutralidadeFiscal.coberturaIndiretaMeta,2)}</td></tr>
            <tr><td>Indiretos compensam a renúncia?</td><td class="${neutralidadeFiscal.indiretosCompensamRenuncia?'ok':'bad'}">${neutralidadeFiscal.indiretosCompensamRenuncia?'Sim':'Não'}</td></tr>
            <tr><td>Acréscimo para indiretos compensarem toda a renúncia</td><td>${neutralidadeFiscal.incrementoIndiretoCompensaRenuncia===null?'Não há neutralidade apenas por indiretos neste coeficiente e percentual de renúncia':money(neutralidadeFiscal.incrementoIndiretoCompensaRenuncia)}</td></tr>
          </table>
        </details>
        <p class="hint">O teste compara os tributos indiretos gerados pelo acréscimo de produção com a meta de recuperação da renúncia fiscal estimada. O tributo direto remanescente aparece apenas como informação técnica e não decide a neutralidade. Não entra na nota preliminar.</p>
      </div></details>` :
    `<div class="warning" style="grid-column:1/-1"><b>Teste de neutralidade fiscal da renúncia (experimental):</b> informe a produção/faturamento esperado sem benefício para comparar a arrecadação antes e depois do benefício. Use 0 quando o projeto não ocorreria sem o benefício.</div>`;
  const retentionHtml = retention ? `
      <details class="card wide" open><summary>Análise de retenção de empresa existente</summary><div class="card-body">
        <div class="grid">
          <div class="kpi"><b>Risco declarado de saída/redução</b><span>${br(retention.probSaida*100,0)}%</span></div>
          <div class="kpi"><b>Produção preservada</b><span>${money(valueBRL)}</span></div>
          <div class="kpi"><b>Empregos preservados</b><span>${br(totalJobs,1)}</span></div>
          <div class="kpi"><b>Custo fiscal incremental</b><span>${money(retentionFiscal?.renunciaIncremental||0)}</span></div>
        </div>
        <table>
          <tr><th>Indicador</th><th>Resultado</th></tr>
          <tr><td>Produção/faturamento atual</td><td>${money(retention.retAtualDeclarado)}</td></tr>
          <tr><td>Produção/faturamento com benefício atual</td><td>${money(retention.retBenefAtualDeclarado)}</td></tr>
          <tr><td>Produção/faturamento com pleito atendido</td><td>${money(retention.retPleitoDeclarado)}</td></tr>
          <tr><td>Produção/faturamento sem acordo</td><td>${money(retention.retSemAcordoDeclarado)}</td></tr>
          <tr><td>Benefício atual</td><td>${br(retention.beneficioAtualPct*100,2)}%</td></tr>
          <tr><td>Benefício pleiteado considerado</td><td>${br(renunciaPct*100,2)}%</td></tr>
          <tr><td>Renúncia atual estimada</td><td>${money(retentionFiscal?.renunciaAtual||0)}</td></tr>
          <tr><td>Renúncia com pleito atendido</td><td>${money(retentionFiscal?.renunciaPleito||0)}</td></tr>
          <tr><td>Renúncia incremental do pleito</td><td><b>${money(retentionFiscal?.renunciaIncremental||0)}</b></td></tr>
          <tr><td>Tributos indiretos preservados</td><td>${money(retentionFiscal?.tributosIndiretosPreservados||0)}</td></tr>
          <tr><td>Perda fiscal evitada ponderada pelo risco</td><td><b>${money(retentionFiscal?.perdaFiscalEsperada||0)}</b></td></tr>
          <tr><td>Relação perda evitada / custo incremental</td><td>${retentionFiscal?.beneficioCustoIncremental===Infinity?'Sem custo incremental relevante':retentionFiscal?.beneficioCustoIncremental==null?'-':br(retentionFiscal.beneficioCustoIncremental,2)}</td></tr>
        </table>
        <div class="retention-note"><b>Evidência de risco de saída/redução:</b><br>${retention.evidencia?escapeHtml(retention.evidencia):'Não informada. Quando esse campo fica vazio, a nota reduz a confiança no argumento de retenção.'}</div>
        <div class="retention-note"><b>Ideia para discussão com auditores — DIFAL:</b><br>${retention.difal?escapeHtml(retention.difal):'Não informada. A hipótese deve ser tratada separadamente, pois depende de origem/destino das mercadorias, regras de incidência e comportamento de compra após eventual saída da empresa.'}</div>
        <p class="hint">Este bloco não prova que a empresa sairia do estado; ele organiza a hipótese declarada e mostra o tamanho econômico da atividade que estaria em risco. A evidência documental continua indispensável.</p>
      </div></details>` : '';
  const externalScenarioHtml = `
    <div class="external-tradeoff">
      <h3>Balanço Interestadual: DIFAL/ST vs. Produção Local ${concept(helpExternalScenario,'Balanço interestadual')}</h3>
      <p class="tradeoff-lead">Este módulo experimental compara a hipótese de produzir na Paraíba com benefício à hipótese de produzir em ${escapeHtml(externalScenario.ufLabel)} e abastecer o mercado paraibano por operação interestadual. A receita de entrada foi estimada pelo método: <b>${escapeHtml(externalScenario.metodologiaEntrada)}</b>. A substituição da produção local não recebe efeitos adicionais de margem de comércio ou transporte dentro da Paraíba.</p>
      <div class="tradeoff-grid">
        <div class="tradeoff-card"><b>Renúncia máxima para não ficar pior fiscalmente</b><strong class="${externalScenario.equilibrioClass}">${externalScenario.renunciaMaxFiscal===null?'-':br(externalScenario.renunciaMaxFiscal*100,2)+'%'}</strong><span>${externalScenario.equilibrioStatus}</span></div>
        <div class="tradeoff-card"><b>Receita via DIFAL/ST/entrada</b><strong>${money(externalScenario.receitaEntrada)}</strong><span>${escapeHtml(externalScenario.metodologiaEntrada)} · fator de captura de ${br(externalScenario.pctCapturaEntrada*100,0)}%.</span></div>
        <div class="tradeoff-card"><b>Perda de VA local</b><strong>${money(externalScenario.perdaVaEsperada)}</strong><span>Valor esperado pela probabilidade de abastecimento externo.</span></div>
        <div class="tradeoff-card"><b>Empregos locais não gerados</b><strong>${br(externalScenario.perdaEmpregosEsperada,1)}</strong><span>Hipótese conservadora: sem empregos adicionais de comércio/transporte no cenário externo.</span></div>
        <div class="tradeoff-card"><b>Risco de vazamento</b><strong class="${externalScenario.cls}">${externalScenario.risco}</strong><span>${externalScenario.vazamento===null?'-':br(externalScenario.vazamento*100,0)+'%'} do VA local potencial fica em risco.</span></div>
      </div>
      <table>
        <tr><th>Dimensão</th><th>Produção na Paraíba com benefício</th><th>Produção fora e venda para PB</th><th>Diferença esperada</th></tr>
        <tr><td>Receita fiscal estimada</td><td>${money(tax)}</td><td>${money(externalScenario.receitaExterna)}</td><td class="${externalScenario.diferencaFiscalEsperada>=0?'ok':'bad'}">${money(externalScenario.diferencaFiscalEsperada)}</td></tr>
        <tr><td>Limite de renúncia fiscalmente equivalente</td><td><b>${externalScenario.renunciaMaxFiscal===null?'-':br(externalScenario.renunciaMaxFiscal*100,2)+'%'}</b> ${externalScenario.renunciaMaxValor===null?'':'('+money(externalScenario.renunciaMaxValor)+')'}</td><td>Receita externa de referência: ${money(externalScenario.receitaExterna)}</td><td class="${externalScenario.equilibrioClass}">Renúncia considerada: ${br(externalScenario.renunciaPctAtual*100,2)}%</td></tr>
        <tr><td>Valor adicionado local</td><td>${money(va)}</td><td>${money(externalScenario.distVa)}</td><td>${money(externalScenario.perdaVaEsperada)}</td></tr>
        <tr><td>Empregos locais</td><td>${br(totalJobs,1)}</td><td>${br(externalScenario.distEmpregos,1)}</td><td>${br(externalScenario.perdaEmpregosEsperada,1)}</td></tr>
        <tr><td>Massa salarial local</td><td>${money(impactosEsperados.massaSalarialMip)}</td><td>${money(externalScenario.distSalarios)}</td><td>${money(externalScenario.perdaSalariosEsperada)}</td></tr>
      </table>
      <div class="${externalScenario.risco==='Alto'?'warning':'ok-box'}"><b>Leitura para auditoria:</b> ${externalScenario.message} Esta comparação é uma aproximação estratégica e conservadora; a incidência jurídica efetiva depende de NCM, tipo de comprador, regime de ICMS-ST, DIFAL, benefícios na origem e legislação vigente.</div>
    </div>`;
  window.lastEvaluationContext = {
    empresa: {
      cnpj: cnpjVal,
      razao_social: razaoSocial,
      nome_fantasia: document.getElementById('nome_fantasia')?.value || '',
      porte: document.getElementById('porte_empresa')?.value || '',
      uf_origem: document.getElementById('uf_origem')?.value || '',
      situacao: document.getElementById('situacao_cadastral')?.value || '',
      cadastro_rf: cnpjRfProfile
    },
    protocolo,
    tipoAnalise,
    macrossegmento: seg,
    codigo: code,
    setor: r.setor,
    cnae: normCode(document.getElementById(ids.cnae)?.value || ''),
    municipio: munName,
    score,
    signal: sig.decision,
    sinteseDecisoria: synthesis,
    sinaisDimensionais: {
      economicoTerritorial: economicAssessment,
      fiscalArrecadatorio: fiscalAssessment,
      aderenciaFain: fainChecklist,
      comprovacaoDocumental: documentaryEvidence
    },
    documentacaoNecessidade: null,
    aderenciaFain: fainChecklist,
    declaredValue,
    valorComBeneficioMip,
    valorSemBeneficioDeclarado,
    valorSemBeneficioMip,
    valueBRL,
    calculoImpactosEconomicos: {
      fonteCalculo: economicImpact.fonteCalculo,
      choqueProducao: economicImpact.choqueProducao,
      producaoIndireta: economicImpact.producaoIndireta,
      empregosIndiretos: economicImpact.empregosIndiretos,
      massaSalarialDiretaMip: economicImpact.massaDiretaMip,
      massaSalarialIndiretaMip: economicImpact.massaIndiretaMip,
      massaSalarialDeclarada: economicImpact.massaSalarialDeclarada,
      porRenuncia: economicImpact.porRenuncia
    },
    impactosEsperados,
    indicadoresMunicipais: municipalIndicators,
    cenarioAbastecimentoExterno: externalScenario,
    fiscalProdutos,
    metodologiaTributoDireto: fiscalProdutos.method,
    coeficienteDiretoSetorialMip: Number(r.direto || 0),
    coeficienteIcmsEfetivo: directCoefficient,
    coeficienteDiretoEquivalenteMip: directCoefficientEquivalentMip,
    renunciaPctSolicitada: renunciaPctSolicitada * 100,
    renunciaPct: renunciaPct * 100,
    renunciaMaximaPermitida: renunciaMaximaPermitida * 100,
    metaRecuperacaoTributos: metaRecuperacaoTributos * 100,
    taxRenuncia,
    neutralidadeFiscalExperimental: neutralidadeFiscal,
    socialVaRenuncia: social.vaRenunciaPV,
    wageRenuncia: wageCB.wageRenunciaPV,
    retencao: retention ? {
      ...retention,
      fiscal: retentionFiscal
    } : null,
    producaoMultiplicador: Number(r.producao || 0),
    vaMultiplicador: Number(r.va || 0),
    empregoMultiplicador: Number(r.emprego_por_R$_milhao || 0),
    tributosMultiplicador: Number(r.tributos || 0),
    directJobs,
    indirectJobs,
    totalJobs,
    localShare: localRaw ? localShare : null,
    expectedDirectJobs,
    techLabel: techLabel(tech.sec.nome_predominante),
    techScore: tech.sec.score_medio,
    estruturaProdutiva: estrutura,
    qlTopCount,
    impactSectorsCount: impactSectorsTerritoriais.length,
    territorialCoverage: `${territorialAbsorption.count}/${municipalities.length} (${br(territorialAbsorption.share*100,1)}%)`,
    territorialAbsorption,
    locationalAssessment: locational,
    topIndirectSectors: impactSectorsTerritoriais.map(s => ({
      codigo: s.codigo,
      setor: s.setor,
      participacao: s.participacao,
      impacto: s.impacto,
      tradable: true
    })),
    mapaRegic: {
      municipioOrigem: mun,
      municipioOrigemNome: munName,
      vetorEmpregoChoque: spatialImpactVector.map(s => ({
        codigo: s.codigo,
        setor: s.setor,
        empregos: s.empregos,
        impactoProducao: s.impacto,
        pesoUsado: s.peso
      })),
      scores: spatialScores.map(s => ({
        codigo: s.codigo,
        nome: s.nome,
        score: s.score,
        capacidade_classe: s.capacidade_classe,
        capacidade_alta: s.capacidade_alta,
        dist_km: s.dist_km,
        dur_min: s.dur_min,
        fonte_distancia: s.fonte_distancia,
        peso_hierarquico: s.peso_hierarquico,
        principal_setor: s.principal_setor,
        principal_codigo: s.principal_codigo,
        principal_grupo: s.principal_grupo,
        principal_massa: s.principal_massa,
        principal_fator_massa: s.principal_fator_massa
      }))
    },
    criterios: criteria,
    pesos: w,
    pesosAuditoria: window.auditoriaPesos || {},
    pesosAlteradosSessao: pesoState.modified,
    pesosResponsavel: pesoState.user,
    pesosDesbloqueadosEm: pesoState.unlockedAt,
    rentRisk: {
      level: rentRisk.level,
      score: rentRisk.score,
      alerts: rentRisk.alerts
    },
    investimento: {
      privadoTotalConsiderado: investPrivado,
      privadoTotalInformado: investimentoPrivadoInformado,
      terrenoOuImovel: investimentoTerrenoImovel,
      obras: investimentoObras,
      outros: investimentoOutros,
      imovelTipo,
      equipamentosAdquiridosPct,
      incentivoLocacional,
      impactoEmpregoObras: constructionImpact
    },
    com_origem_produtos: comOrigemProd,
    com_destino_vendas: comDestVendas,
    com_origem_local: comOrigemLocal,
    com_destino_local: comDestinoLocal,
    qualificadoresDeclarados: {
      substituiImportacoes: substituiEstado,
      produtoNovo: novoProdutoEstado,
      setorEstrategico: estrategicoEstado,
      adicionalidade
    },
    missingQualifiers,
    modulosV7: {
      qualidadeInformacao: dataQuality,
      plausibilidadeEconomica: plausibility,
      adicionalidade: additionality,
      comprovacaoDocumental: documentaryEvidence,
      meritoEconomicoTerritorial: economicAssessment,
      meritoFiscalArrecadatorio: fiscalAssessment,
      aderenciaFain: fainChecklist,
      sinteseSeparada: synthesis,
      sensibilidade: sensitivity,
      sensibilidadeNota: noteSensitivity,
      resumoDecisorio: executiveSummary
    },
    memoriaCalculo: {
      choque: {
        valorComBeneficioDeclarado: declaredValue,
        valorComBeneficioMip,
        valorSemBeneficioDeclarado,
        valorSemBeneficioMip,
        valorIncrementalConsideradoNaMip: valueBRL,
        tipoValorDeclarado: seg === 'comercio' ? 'faturamento_esperado' : 'valor_da_producao',
        margemComercial: seg === 'comercio' ? numInput('com_margem', 20) : null
      },
      producao: {
        multiplicador: Number(r.producao || 0),
        impactoTotal: prod,
        impactoIndireto: Math.max(0, prod - valueBRL)
      },
      valorAdicionado: {
        multiplicador: Number(r.va || 0),
        impacto: va,
        valorPresenteSobreRenuncia: social.vaRenunciaPV
      },
      emprego: {
        diretosInformados: directJobs,
        diretosMediosMip: expectedDirectJobs,
        indiretosEstimados: indirectJobs,
        total: totalJobs,
        multiplicadorAbertoPorMilhao: Number(r.emprego_por_R$_milhao || 0),
        implantacaoObras: constructionImpact
      },
      tributos: {
        metodologiaDireto: fiscalProdutos.method,
        metodologiaDiretoLabel: fiscalProdutos.methodLabel,
        coberturaProdutos: fiscalProdutos.directCoverage,
        coeficienteDiretoSetorialMip: Number(r.direto || 0),
        coeficienteIcmsEfetivo: directCoefficient,
        coeficienteDiretoEquivalenteMip: directCoefficientEquivalentMip,
        coeficienteIndireto: Number(r.indireto || 0),
        diretoBruto: taxDirectGross,
        renuncia,
        renunciaBaseDecisao,
        indiretos: taxIndirect,
        liquidos: tax,
        tributosLiquidosSobreRenuncia: taxRenuncia,
        composicaoProdutos: fiscalProdutos
      },
      neutralidadeFiscal: neutralidadeFiscal,
      cenarioAbastecimentoExterno: externalScenario,
      indicesSetoriaisEstruturaProdutiva: estrutura,
      territorio: {
        municipio: munName,
        setoresTradablesIndiretosComEspecializacaoNoMunicipio: qlTopCount,
        setoresTradablesConsiderados: impactSectorsTerritoriais.length,
        municipiosComAltaCapacidadeTerritorial: territorialAbsorption.count,
        totalMunicipios: municipalities.length
      },
      desconcentracaoEconomica: locational,
      mapaRegic: {
        formula: 'SPF_i = (soma_j QL_ij * emprego_indireto_j * fator_massa_economica_privada_ij * fator_comercial_observado_ij * peso_hierarquico_REGIC_i) / ln(distancia_rodoviaria_distbrasil_km_i + 1), aplicado apenas a setores tradables e normalizado para 0-100. O fator comercial vem da matriz de comércio PB-SCN 2021: vendas observadas do município no setor, fluxo PB->PB para o município do projeto e retenção estadual do setor. Apenas municípios com alta capacidade e venda observada no setor são pintados no mapa.',
        municipioOrigem: munName,
        topMunicipios: highAbsorptionRows.slice(0, 10)
      },
      impactosEsperados,
      indicadoresMunicipais: municipalIndicators,
      indicadoresPorMilhaoRenuncia: perMR
    },
    checklistFain: {
      entrada: fainInput,
      resultado: fainChecklist,
      observacao: 'Checklist preliminar de aderência ao FAIN. Não substitui parecer jurídico, instrução processual nem deliberação competente.'
    },
    descricao_empresario: (document.getElementById('descricao_empresario')?.value || '').trim(),
    observacao: 'A nota e os impactos foram calculados pelo painel. A IA deve apenas interpretar os resultados.'
  };
  const auditRecord = registrarAuditoria(window.lastEvaluationContext);
  const mapDiagnostic = `Macrossegmento: ${seg || '-'}; campo esperado: ${ids.municipio || '-'}; valor indústria: ${document.getElementById('municipio')?.value || '-'}; valor comércio: ${document.getElementById('municipio_com')?.value || '-'}.`;
  const mapUnavailableHtml = `<div class="warning"><b>Mapa territorial não calculado.</b> Informe e confirme o município de instalação do empreendimento para que o painel pinte o epicentro e calcule a capacidade territorial de absorção dos impactos indiretos.<details style="margin-top:8px"><summary>Diagnóstico do município lido pelo painel</summary><p class="hint">${escapeHtml(mapDiagnostic)}</p></details></div>`;
  const map = hasValidMunicipio && window.MapaTerritorial?.paintSpatialMap ?
    window.MapaTerritorial.paintSpatialMap(mun, spatialScores) :
    mapUnavailableHtml;
  const fiscalAnswer = neutralidadeFiscal ? (neutralidadeFiscal.atingida ? 'Sim' : 'Não') : '-';
  const fiscalCardClass = neutralidadeFiscal ? (neutralidadeFiscal.atingida ? 'good' : 'bad-card') : 'alert';
  const localProductionAnswer = valueBRL > 0 ? 'Sim' : 'Não';
  const rentQuestionClass = rentRisk.level === 'Baixo' ? 'good' : rentRisk.level === 'Moderado' ? 'alert' : 'bad-card';
  const dataQuestionClass = dataQuality.level === 'Alta' ? 'good' : dataQuality.level === 'Média' ? 'alert' : 'bad-card';
  const nextStep = synthesis.cls === 'green' ? 'Conferir documentos e preparar minuta de decisão.' : synthesis.cls === 'orange' ? 'Solicitar complementação, ajustar contrapartidas ou negociar desenho fiscal.' : 'Exigir comprovação adicional antes de qualquer encaminhamento favorável.';
  const economicNotesHtml = economicAssessment.notes.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const fiscalNotesHtml = fiscalAssessment.notes.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const dimCardClass = obj => obj?.cls === 'green' ? 'good' : obj?.cls === 'orange' ? 'alert' : 'bad-card';
  const presentationMap = map
    .replace('viewBox="0 0 1180 760"', 'viewBox="20 120 900 530" preserveAspectRatio="xMidYMid meet"')
    .replace(/\s*<rect[^>]*fill="#fbfcfd"\/>/, '')
    .replace(/\s*<text[^>]*class="title"[^>]*>.*?<\/text>/, '')
    .replace(/\s*<text[^>]*class="subtitle"[^>]*>.*?<\/text>/, '');
  const spatialRowsRetention = spatialScores.filter(row => row.codigo !== mun && Number(row.raw || 0) > 0);
  const totalRetentionPotential = spatialRowsRetention.reduce((acc, row) => acc + Number(row.raw || 0), 0);
  const retainedRetentionPotential = spatialRowsRetention.reduce((acc, row) => {
    if (!row.capacidade_alta) return acc;
    const sectorRetention = Math.max(0, Math.min(1, Number(row.principal_retencao_pb || 0)));
    const retentionFactor = sectorRetention > 0 ? sectorRetention : 0.70;
    return acc + Number(row.raw || 0) * retentionFactor;
  }, 0);
  const impactRetentionShare = totalRetentionPotential > 0 ?
    Math.max(0, Math.min(1, retainedRetentionPotential / totalRetentionPotential)) :
    Math.max(0, Math.min(1, Number(r.participacao_insumos_domesticos || 0)));
  const impactLeakageShare = 1 - impactRetentionShare;
  const impactRetentionLevel = impactRetentionShare >= 0.65 ? 'Alta' : (impactRetentionShare >= 0.35 ? 'Média' : 'Baixa');
  const impactRetentionClass = impactRetentionLevel === 'Alta' ? 'good' : (impactRetentionLevel === 'Média' ? 'alert' : 'bad-card');
  const economicScoreLabels = [
    { key: 'producao', label: 'Multiplicador de produção acima da média' },
    { key: 'va', label: 'Multiplicador de valor adicionado acima da média' },
    { key: 'empregoMult', label: 'Multiplicador de emprego acima da média' },
    { key: 'empregoDireto', label: 'Empregos diretos informados' },
    { key: 'comprasLocais', label: 'Compras locais' },
    { key: 'tecnologia', label: 'Conteúdo tecnológico' },
    { key: 'territorioQl', label: 'Especialização do município nos setores impactados' },
    { key: 'abrangenciaMunicipal', label: 'Municípios com alta capacidade de absorção' },
    { key: 'territorioBase', label: 'Relevância territorial local' },
    { key: 'desconcentracaoEconomica', label: 'Desconcentração econômica' },
    { key: 'tempoProjeto', label: 'Tempo de permanência do projeto' },
    { key: 'ativosIrrecuperaveis', label: 'Ativos de difícil reversão' },
    { key: 'destino', label: 'Destino da produção para fora da PB' },
    { key: 'substituicao', label: 'Substituição de importações' },
    { key: 'produtoNovo', label: 'Produto novo ou pouco produzido' },
    { key: 'estrategia', label: 'Setor estratégico ou setor-chave' },
    { key: 'comOrigemLocal', label: 'Origem local dos produtos comercializados' },
    { key: 'comDestinoLocal', label: 'Destino local das vendas do comércio' }
  ];
  const activeEconomicScoreRows = economicScoreLabels
    .filter(row => Math.max(0, Number(w[row.key] || 0)) > 0)
    .map(row => ({
      ...row,
      peso: Math.max(0, Number(w[row.key] || 0)),
      valor: Math.max(0, Math.min(1, Number(criteria[row.key] || 0)))
    }));
  const economicWeightBase = activeEconomicScoreRows.reduce((acc, row) => acc + row.peso, 0) || 1;
  const economicScoreRowsHtml = activeEconomicScoreRows.map(row => {
    const contribution = row.peso * row.valor / economicWeightBase * 10;
    return `<tr><td>${escapeHtml(row.label)}</td><td>${br(row.valor * 100,0)}%</td><td>${br(row.peso,2)}</td><td>${br(contribution,2)} ponto(s)</td></tr>`;
  }).join('');
  const economicPenaltyRowsHtml = `
    <tr><td>Subtotal antes dos redutores</td><td>-</td><td>-</td><td>${br(economicAssessment.baseScore,2)} ponto(s)</td></tr>
    <tr><td>Redutor por risco de rent seeking</td><td>${escapeHtml(rentRisk.level)}</td><td>redutor</td><td>-${br(economicAssessment.rentPenalty,2)} ponto(s)</td></tr>
    <tr><td>Redutor por qualidade da informação</td><td>${escapeHtml(dataQuality.level)}</td><td>redutor</td><td>-${br(economicAssessment.infoPenalty,2)} ponto(s)</td></tr>
    <tr><td><b>Nota de mérito econômico</b></td><td colspan="2">${escapeHtml(economicAssessment.level)}</td><td><b>${br(economicAssessment.score,2)} ponto(s)</b></td></tr>`;
  const presentationHtml = `
    <section class="presentation-dashboard">
      <div class="presentation-hero compact ${economicAssessment.cls}">
        <div>
          <span class="presentation-kicker">Impactos econômicos</span>
          <h2>${economicAssessment.level}</h2>
        </div>
        <div class="presentation-score compact">
          <b>${br(economicAssessment.score,1)}</b>
          <span>mérito econômico / 10</span>
        </div>
      </div>
      <div class="presentation-context compact">
        <b>${escapeHtml(razaoSocial || r.setor || 'Processo em análise')}</b>
        <span>${escapeHtml(macroLabel)} · ${escapeHtml(modoLabel)} · ${escapeHtml(munName)}</span>
      </div>
      <div class="presentation-pillars five" data-module-container="impactos_economicos_cards">
        <div data-module-id="setor_chave" class="presentation-card compact ${r.setor_chave?'good':'bad-card'}">
          <span>Setor-chave para a economia</span>
          <strong class="${setorChaveClass}">${setorChaveLabel}</strong>
          <small>Ligações: trás ${br(Number(r.ligacao_tras||0),2)}; frente ${br(Number(r.ligacao_frente||0),2)}.</small>
        </div>
        <div data-module-id="absorcao_territorial" class="presentation-card compact ${territorialAbsorption.level==='Alta'?'good':territorialAbsorption.level==='Média'?'alert':'bad-card'}">
          <span>Absorção territorial</span>
          <strong>${territorialAbsorption.level}</strong>
          <small>${territorialAbsorption.count} município(s) com alta capacidade.</small>
        </div>
        <div data-module-id="risco_rent_seeking" class="presentation-card compact ${rentRisk.level==='Baixo'?'good':rentRisk.level==='Moderado'?'alert':'bad-card'}">
          <span>Risco de rent seeking</span>
          <strong>${rentRisk.level}</strong>
          <small>Risco de o benefício não ser decisivo para o investimento.</small>
        </div>
        <div data-module-id="custo_por_emprego" class="presentation-card compact">
          <span>Custo por emprego</span>
          <strong>${custoEmpregoValor}</strong>
          <small>Relação entre renúncia e empregos esperados.</small>
        </div>
        <div data-module-id="retencao_impactos_pb" class="presentation-card compact ${impactRetentionClass}">
          <span>Retenção dos impactos na PB</span>
          <strong>${br(impactRetentionShare * 100,0)}%</strong>
          <small>Risco de vazamento: ${br(impactLeakageShare * 100,0)}% dos efeitos indiretos.</small>
        </div>
      </div>
      <div class="presentation-impact five" data-module-container="impactos_economicos_tiles">
        <div data-module-id="impacto_producao" class="impact-tile compact"><b>Produção</b><strong>${money(impactosEsperados.producao)}</strong></div>
        <div data-module-id="impacto_valor_adicionado" class="impact-tile compact"><b>Valor adicionado</b><strong>${money(impactosEsperados.valorAdicionado)}</strong></div>
        <div data-module-id="impacto_emprego" class="impact-tile compact"><b>Empregos</b><strong>${br(impactosEsperados.empregos,0)}</strong></div>
        <div data-module-id="impacto_massa_salarial" class="impact-tile compact"><b>Massa salarial</b><strong>${money(impactosEsperados.massaSalarialMip)}</strong></div>
        <div data-module-id="empregos_implantacao" class="impact-tile compact"><b>Empregos na implantação</b><strong>${constructionImpact.total>0?br(constructionImpact.total,0):'-'}</strong></div>
      </div>
      <div data-module-id="mapa_territorial" class="presentation-map-card presentation-map-wide">
        <h3>Território beneficiado indiretamente</h3>
        <div class="legend"><span><i class="sw" style="background:#343a40"></i>origem</span><span><i class="sw" style="background:#d1d5db"></i>não destacado</span><span><i class="sw" style="background:#feb24c"></i>alta capacidade</span><span><i class="sw" style="background:#800026"></i>maior SPF</span></div>
        <div class="map-wrap">${hasValidMunicipio ? presentationMap : mapUnavailableHtml}</div>
      </div>
      <details class="presentation-score-details">
        <summary>Indicadores que compõem a nota de mérito econômico</summary>
        <div class="presentation-score-body">
          <table>
            <tr><th>Indicador</th><th>Resultado considerado</th><th>Peso</th><th>Contribuição</th></tr>
            ${economicScoreRowsHtml}
            ${economicPenaltyRowsHtml}
          </table>
        </div>
      </details>
    </section>
  `;
  const renunciaMaxEquivalenteLabel = externalScenario && externalScenario.renunciaMaxFiscal !== null ? br(externalScenario.renunciaMaxFiscal * 100,1) + '%' : '-';
  const taxTradeoffRowsPresentation = externalScenario ? `
    <tr><td>Receita fiscal estimada</td><td>${money(tax)}</td><td>${money(externalScenario.receitaExterna)}</td><td class="${tax - externalScenario.receitaExterna >= 0 ? 'ok' : 'bad'}">${money(tax - externalScenario.receitaExterna)}</td></tr>
    <tr><td>Renúncia fiscal estimada</td><td>${renuncia > 0 ? money(renuncia) : '-'}</td><td>-</td><td>${renuncia > 0 ? money(-renuncia) : '-'}</td></tr>
    <tr><td>Tributos indiretos</td><td>${money(taxIndirect)}</td><td>-</td><td>${money(taxIndirect)}</td></tr>
    <tr><td>Percentual máximo equivalente</td><td>${renunciaMaxEquivalenteLabel}</td><td>DIFAL/ST de referência</td><td>-</td></tr>
  ` : '<tr><td colspan="4">Cenário fiscal externo não disponível para esta análise.</td></tr>';
  const fiscalSensitivityShare = sensitivity?.scenarios?.length ?
    sensitivity.scenarios.filter(s => s.neutralidade).length / sensitivity.scenarios.length :
    null;
  const fiscalScoreComponents = [
    {
      label: 'Indicadores fiscais do setor',
      score: fiscalAssessment.baseScore,
      weight: 0.25,
      criterio: `Combina multiplicador tributário acima da média (${criteria.tributosMult ? 'sim' : 'não'}) e relação receita estimada/renúncia (${taxRenuncia===null?'-':br(taxRenuncia,2)}).`
    },
    {
      label: 'Neutralidade fiscal da renúncia',
      score: fiscalAssessment.neutralidadeScore,
      weight: 0.30,
      criterio: neutralidadeFiscal ?
        `Pontua pela cobertura da meta de recuperação fiscal: ${neutralidadeFiscal.atingida ? 'atendida' : 'não atendida'}; cobertura ${neutralidadeFiscal.coberturaIndiretaMeta===null?'-':br(neutralidadeFiscal.coberturaIndiretaMeta,2)}.` :
        'Não calculada porque o valor sem benefício não foi informado.'
    },
    {
      label: 'Retorno fiscal em relação à renúncia',
      score: fiscalAssessment.retornoScore,
      weight: 0.20,
      criterio: taxRenuncia === null ?
        'Sem renúncia fiscal estimada; componente recebe zero.' :
        `Usa a razão entre receita tributária estimada após renúncia e renúncia fiscal: ${br(taxRenuncia,2)}.`
    },
    {
      label: 'Balanço interestadual DIFAL/ST',
      score: fiscalAssessment.interestadualScore,
      weight: 0.15,
      criterio: externalScenario?.renunciaMaxFiscal !== null ?
        `Compara o percentual pleiteado (${br(renunciaPct*100,1)}%) com o máximo fiscalmente equivalente ao cenário externo (${renunciaMaxEquivalenteLabel}).` :
        'Sem parâmetro suficiente; componente recebe pontuação neutra.'
    },
    {
      label: 'Sensibilidade fiscal',
      score: fiscalAssessment.sensitivityScore,
      weight: 0.10,
      criterio: fiscalSensitivityShare === null ?
        'Sem cenários de sensibilidade; componente recebe pontuação neutra.' :
        `Percentual de cenários simulados que atendem a neutralidade fiscal: ${br(fiscalSensitivityShare*100,0)}%.`
    }
  ];
  const fiscalScoreRowsHtml = fiscalScoreComponents.map(row => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td>${br(row.score,1)} / 10</td>
      <td>${br(row.weight*100,0)}%</td>
      <td>${br(row.score * row.weight,2)} ponto(s)</td>
      <td>${escapeHtml(row.criterio)}</td>
    </tr>`).join('') + `
    <tr><td><b>Nota de mérito fiscal</b></td><td colspan="2">${escapeHtml(fiscalAssessment.level)}</td><td><b>${br(fiscalAssessment.score,2)} ponto(s)</b></td><td>Nota composta de apoio à análise fiscal.</td></tr>`;
  const taxPresentationHtml = `
    <section class="presentation-dashboard presentation-tax-dashboard">
      <div class="presentation-hero ${fiscalAssessment.cls}">
        <div>
          <span class="presentation-kicker">Resposta tributária do benefício</span>
          <h2>${fiscalAssessment.level}</h2>
          <p>${neutralidadeHint}</p>
        </div>
        <div class="presentation-score">
          <b>${br(fiscalAssessment.score,1)}</b>
          <span>mérito fiscal / 10</span>
        </div>
      </div>
      <div class="presentation-impact tax" data-module-container="impactos_tributarios_tiles">
        <div data-module-id="renuncia_fiscal" class="impact-tile"><b>Renúncia fiscal</b><strong>${renuncia > 0 ? money(renuncia) : '-'}</strong></div>
        <div data-module-id="tributos_indiretos" class="impact-tile"><b>Tributos indiretos</b><strong>${money(taxIndirect)}</strong></div>
        <div data-module-id="receita_tributaria" class="impact-tile"><b>Receita tributária estimada</b><strong>${money(tax)}</strong></div>
        <div class="impact-tile"><b>Renúncia máxima equivalente</b><strong>${renunciaMaxEquivalenteLabel}</strong></div>
      </div>
      <div data-module-id="difal_st" class="presentation-table-card">
        <h3>DIFAL/ST versus produção local</h3>
        <table>
          <tr><th>Dimensão</th><th>Produção na PB com benefício</th><th>Produção fora e venda para PB</th><th>Diferença esperada</th></tr>
          ${taxTradeoffRowsPresentation}
        </table>
      </div>
      <details class="presentation-score-details">
        <summary>Indicadores que compõem a nota de mérito fiscal</summary>
        <div class="presentation-score-body">
          <table>
            <tr><th>Componente</th><th>Resultado considerado</th><th>Peso</th><th>Contribuição</th><th>Critério usado</th></tr>
            ${fiscalScoreRowsHtml}
          </table>
        </div>
      </details>
    </section>
  `;
  document.getElementById('relatorio').innerHTML = presentationHtml + `
    <div class="report-actions no-print">
      <button type="button" class="secondary" onclick="prepararImpressaoRelatorio()">Exportar relatório em PDF</button>
    </div>
    <div class="map-tooltip"></div>
    <div class="decision-hero">
      <div class="verdict-card ${synthesis.cls}">
        <span>Síntese decisória do processo</span>
        <strong>${synthesis.label}</strong>
        <small>Nota composta de apoio ${br(score,1)} de 10 · ${macroLabel} · ${modoLabel}<br>${escapeHtml(nextStep)}</small>
      </div>
      <details class="guided-flow">
        <summary>Como ler este painel</summary>
        <div class="guided-steps">
          <div class="guide-step"><b><i>1</i> Decisão</b><p>Leia o sinal preliminar e a mensagem executiva.</p></div>
          <div class="guide-step"><b><i>2</i> Mérito</b><p>Veja se o setor tem aderência produtiva e baixo risco estrutural.</p></div>
          <div class="guide-step"><b><i>3</i> Impactos</b><p>Confira produção, VA, empregos, massa salarial e território.</p></div>
          <div class="guide-step"><b><i>4</i> Tributário</b><p>Use a aba própria para renúncia, neutralidade fiscal e DIFAL/ST.</p></div>
          <div class="guide-step"><b><i>5</i> Documento</b><p>Gere o documento editável após revisar os números.</p></div>
        </div>
      </details>
    </div>
    <h2>Impactos econômicos — dados experimentais</h2>
    ${pesoWarning}${macroAviso}${modoAviso}${adicionalidadeAviso}${tetoAviso}
    ${(razaoSocial||cnpjVal||protocolo)?`<div style="border:1px solid var(--line);border-radius:8px;padding:10px 14px;margin-bottom:12px;background:var(--soft);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><b style="font-size:15px">${escapeHtml(razaoSocial||'Dados cadastrais não informados')}</b>${cnpjVal?`<span class="pill" style="margin-left:8px">${escapeHtml(cnpjVal)}</span>`:''}</div>${protocolo?`<span class="pill">Protocolo ${escapeHtml(protocolo)}</span>`:''}</div>`:''}
    ${cnpjRfReportHtml}
    <p>${found.msg||''}</p>
    <div class="decision-layer">
      <div class="layer-title">
        <div><div class="layer-kicker">Camada executiva</div><h3>Mensagem executiva do caso</h3></div>
        <span class="pill">${macroLabel} · ${modoLabel}</span>
      </div>
      <div class="executive-summary">
        <div class="summary-box">
          <h3>Leitura para decisão</h3>
          <p>${escapeHtml(executiveSummary.texto)}</p>
          <p><b>${escapeHtml(synthesis.message)}</b></p>
        </div>
        <div class="summary-box">
          <h3>Pontos para despacho</h3>
          <div class="field-row-2" style="align-items:start">
            <div><b class="ok">Favoráveis</b><ul class="summary-list">${summaryPositiveHtml}</ul></div>
            <div><b class="risk-mid">Atenção</b><ul class="summary-list">${summaryCautionHtml}</ul></div>
          </div>
        </div>
      </div>
      <div class="layer-title"><div><div class="layer-kicker">Impactos econômicos</div><h3>Mérito econômico-territorial do caso</h3></div></div>
      <div class="decision-grid three">
        <div class="decision-card ${dimCardClass(economicAssessment)}"><b>Mérito econômico-territorial</b><strong>${economicAssessment.level}</strong><span class="metric-note">Nota ${br(economicAssessment.score,1)} de 10. Avalia produção, VA, emprego, compras locais, encadeamentos, tecnologia e território.</span></div>
        <div class="decision-card ${territorialAbsorption.level==='Alta'?'good':territorialAbsorption.level==='Média'?'alert':'bad-card'}"><b>Absorção territorial</b><strong>${territorialAbsorption.level}</strong><span class="metric-note">${territorialAbsorption.count} município(s) com alta capacidade nos setores tradables.</span></div>
      </div>
      <div class="summary-box"><h3>Leitura econômica</h3><ul class="summary-list">${economicNotesHtml}</ul></div>
      <div class="layer-title"><div><div class="layer-kicker">Mérito econômico-territorial</div><h3>Atividade econômica, aderência e risco estrutural</h3></div></div>
      <div class="decision-grid" data-module-container="impactos_economicos_detalhes">
        <div data-module-id="setor_chave" class="decision-card ${r.setor_chave?'good':'bad-card'}"><b>Setor-chave da economia ${concept(helpSetorChave,'Setor-chave da economia')}</b><strong class="${setorChaveClass}">${setorChaveLabel}</strong><span class="metric-note">Ligações: trás ${br(Number(r.ligacao_tras||0),2)}; frente ${br(Number(r.ligacao_frente||0),2)}</span></div>
        <div class="decision-card"><b>Aderência ao perfil produtivo da Paraíba ${concept(helpJustificativa,'Aderência ao perfil produtivo da Paraíba')}</b><strong class="${indexClass(estrutura.indice_justificativa_produtiva)}">${indexLevel(estrutura.indice_justificativa_produtiva)}</strong><span class="metric-note">${br(estrutura.indice_justificativa_produtiva,2)} de 1; mitigação rent-seeking ${br(estrutura.indice_mitigacao_rent_seeking,2)}</span></div>
        <div data-module-id="risco_rent_seeking" class="decision-card ${rentRisk.level==='Baixo'?'good':rentRisk.level==='Moderado'?'alert':'bad-card'}"><b>Risco de benefício pouco produtivo ${concept(helpRentSeeking,'Risco de rent-seeking')}</b><strong class="${rentRisk.cls}">${rentRisk.level}</strong><span class="metric-note">Score de alerta: ${rentRisk.score}</span></div>
      </div>
      <div class="layer-title"><div><div class="layer-kicker">Impactos econômicos</div><h3>Encadeamento local e escala do impacto produtivo</h3></div></div>
      <div class="decision-grid four" data-module-container="impactos_economicos_encadeamento">
        <div class="decision-card"><b>Compras locais ${concept(helpComprasLocais,'Compras locais')}</b><strong>${localRaw?br(localShare*100,0)+'%':'-'}</strong><span class="metric-note">Média setorial: ${br(Number(r.participacao_insumos_domesticos||0)*100,0)}%</span></div>
        <div data-module-id="impacto_emprego" class="decision-card"><b>Empregos na operação</b><strong>${br(impactosEsperados.empregos,1)}</strong><span class="metric-note">Diretos informados + indiretos estimados pela MIP.</span></div>
        <div data-module-id="impacto_massa_salarial" class="decision-card"><b>Massa salarial estimada</b><strong>${money(impactosEsperados.massaSalarialMip)}</strong><span class="metric-note">Empregos diretos e indiretos valorizados por salários médios.</span></div>
        <div class="decision-card"><b>Desconcentração econômica ${concept(helpDesconcentracao,'Desconcentração econômica')}</b><strong class="${locational.className}">${locational.level}</strong><span class="metric-note">${escapeHtml(locational.zona)}</span></div>
      </div>
      <div style="border:2px solid var(--primary-light);border-radius:8px;padding:14px;margin:14px 0;background:var(--primary-muted)">
        <h3 style="margin:0 0 10px;color:var(--primary-dark)">${impactosTitulo}</h3>
        <div class="grid">
          <div data-module-id="impacto_producao" class="kpi"><b>Produção</b><span>${money(impactosEsperados.producao)}</span></div>
          <div data-module-id="impacto_valor_adicionado" class="kpi"><b>Valor adicionado</b><span>${money(impactosEsperados.valorAdicionado)}</span></div>
          <div data-module-id="impacto_emprego" class="kpi"><b>Empregos na operação</b><span>${br(impactosEsperados.empregos,1)}</span></div>
          <div data-module-id="empregos_implantacao" class="kpi"><b>Empregos na implantação</b><span>${constructionImpact.total>0?br(constructionImpact.total,1):'-'}</span></div>
          <div data-module-id="impacto_massa_salarial" class="kpi"><b>Massa salarial estimada pela MIP</b><span>${money(impactosEsperados.massaSalarialMip)}</span></div>
        </div>
        <p class="hint" style="margin-top:8px">${impactosHint}</p>
      </div>
      <div style="border:1px solid var(--line);border-left:4px solid var(--primary);border-radius:8px;padding:14px;margin:14px 0;background:#fff">
        <div class="layer-kicker">Contexto municipal</div>
        <h3 style="margin:0 0 10px;color:var(--primary-dark)">Dados da empresa no contexto municipal</h3>
        <div class="grid">
          <div class="kpi"><b>Produção com benefício sobre PIB municipal</b><span>${pctOrDash(municipalIndicators.producaoSobrePibMunicipal)}</span></div>
          <div class="kpi"><b>Produção com benefício sobre VA setorial municipal</b><span>${pctOrDash(municipalIndicators.producaoSobreVaSetor)}</span></div>
          <div class="kpi"><b>Investimento privado sobre VA setorial municipal</b><span>${investimentoSobreVaSetorTexto}</span></div>
          <div class="kpi"><b>Empregos diretos sobre empregos formais do município</b><span>${pctOrDash(municipalIndicators.empregosDiretosSobreMunicipio)}</span></div>
          <div class="kpi"><b>Desconcentração econômica ${concept(helpDesconcentracao,'Desconcentração econômica')}</b><span class="${locational.className}">${locational.level}</span></div>
        </div>
        <p class="hint" style="margin-top:8px">Base municipal: ${escapeHtml(munName)}. Zona locacional: ${escapeHtml(locational.zona)}. ${escapeHtml(locational.message)} Esses indicadores mostram a escala relativa do empreendimento no município, ajudando o auditor a perceber se o projeto é marginal, relevante ou muito grande para a economia local.</p>
      </div>
      <div class="layer-title"><div><div class="layer-kicker">Confiabilidade da análise</div><h3>Qualidade da informação e robustez do cenário</h3></div></div>
      <div class="module-grid">
        <div class="module-card"><b>Qualidade da informação</b><strong class="${dataQuality.cls}">${dataQuality.level}</strong><p>${br(dataQuality.score*100,0)}% dos campos relevantes foram preenchidos ou documentados.</p></div>
        <div class="module-card"><b>Plausibilidade econômica</b><strong class="${plausibility.cls}">${plausibility.level}</strong><p>Checa se produção, empregos, salário, investimento e renúncia parecem coerentes.</p></div>
        <div class="module-card"><b>Ganho adicional para o Estado</b><strong class="${additionality.cls}">${additionality.level}</strong><p>Indica se o benefício parece associado a produção nova, expansão ou retenção comprovável.</p></div>
        <div class="module-card"><b>Sensibilidade econômica</b><strong class="${sensitivity.cls}">${sensitivity.leitura}</strong><p>Testa se a leitura produtiva muda em cenário conservador ou otimista do choque.</p></div>
      </div>
      <div data-module-id="mapa_territorial" class="map-panel">
        <h3>Mapa territorial simplificado</h3>
        <div class="${territorialAbsorption.level==='Alta'?'ok-box':territorialAbsorption.level==='Média'?'warning':'warning'}"><b>${territorialAbsorption.level} capacidade territorial.</b> ${territorialAbsorption.count} município(s) apresentam alta capacidade para absorver efeitos indiretos nos setores tradables demandados pelo projeto.</div>
        <p class="hint">O mapa destaca apenas municípios com alta capacidade territorial de fornecimento potencial. Os demais ficam em cinza para reduzir ruído visual na decisão.</p>
        <div class="legend"><span><i class="sw" style="background:#343a40"></i>origem</span><span><i class="sw" style="background:#f1f5f9"></i>não destacado</span><span><i class="sw" style="background:#feb24c"></i>alta capacidade</span><span><i class="sw" style="background:#800026"></i>maior SPF</span></div>
        <div class="map-wrap">${map}</div>
      </div>
      <div class="risk-alerts">
        <h3>Alertas que podem exigir diligência</h3>
        <div class="field-row-2" style="align-items:start">
          <div><b>Rent seeking e risco institucional</b><ul class="summary-list">${rentAlerts}</ul></div>
          <div><b>Dados ausentes ou frágeis</b><ul class="summary-list">${qualityMissingHtml}</ul></div>
        </div>
      </div>
      <details class="card wide">
        <summary>Análise de sensibilidade da nota</summary>
        <div class="card-body">
          <div class="grid">
            <div class="kpi"><b>Nota atual</b><span>${br(noteSensitivity.currentScore,1)}</span></div>
            <div class="kpi"><b>Meta de referência</b><span>${br(noteSensitivity.target,1)}</span></div>
            <div class="kpi"><b>Distância até a meta</b><span>${br(noteSensitivity.gap,1)}</span></div>
            <div class="kpi"><b>Combinações negociáveis</b><span>${noteSensitivity.viable.length}</span></div>
          </div>
          <div class="warning"><b>Ressalva institucional:</b> esta análise não indica aprovação automática nem orienta alteração artificial dos dados. As combinações consideram apenas dimensões negociáveis ou pactuáveis, como emprego, compras locais, permanência, desenho fiscal e compromissos verificáveis. Características intrínsecas, como setor-chave, conteúdo tecnológico típico do produto e multiplicadores setoriais, aparecem apenas como diagnóstico.</div>
          <h3>Alavancas e ganho potencial na nota</h3>
          <table>
            <tr><th>Atributo</th><th>Tipo</th><th>Situação</th><th>Peso</th><th>Atendimento atual</th><th>Ganho potencial</th><th>Entra nas combinações?</th><th>Leitura institucional</th></tr>
            ${noteSensitivityLeverRows}
          </table>
          <h3>${noteSensitivity.viable.length?'Combinações negociáveis que podem atingir nota acima de 7':'Combinações negociáveis mais próximas da meta'}</h3>
          <table>
            <tr><th>#</th><th>Condições</th><th>Tipo</th><th>Ganho</th><th>Nota simulada</th><th>Leitura</th></tr>
            ${noteSensitivityComboRows}
          </table>
          <p class="hint">Atributos estruturais, como multiplicadores setoriais, conteúdo tecnológico típico, setor-chave ou especialização territorial, explicam a nota, mas não entram nas combinações. As combinações mostram apenas compromissos passíveis de pactuação, comprovação e monitoramento.</p>
        </div>
      </details>
    </div>
    <details class="technical-layer">
      <summary>Camada técnica e memória de cálculo</summary>
      <div class="technical-body">
    ${externalScenarioHtml}
    <h3>${code} — ${r.setor}</h3>
    <div class="decision-grid">
      <div class="decision-card"><b>Setor-chave da economia ${concept(helpSetorChave,'Setor-chave da economia')}</b><strong class="${setorChaveClass}">${setorChaveLabel}</strong><br><span class="hint">Ligações para trás ${br(Number(r.ligacao_tras||0),2)}; para frente ${br(Number(r.ligacao_frente||0),2)}</span></div>
      <div class="decision-card"><b>Aderência ao perfil produtivo da Paraíba ${concept(helpJustificativa,'Aderência ao perfil produtivo da Paraíba')}</b><strong class="${indexClass(estrutura.indice_justificativa_produtiva)}">${indexLevel(estrutura.indice_justificativa_produtiva)}</strong><br><span class="hint">${br(estrutura.indice_justificativa_produtiva,2)} de 1; mitigação rent-seeking ${br(estrutura.indice_mitigacao_rent_seeking,2)}</span></div>
      <div class="decision-card"><b>Risco de rent-seeking ${concept(helpRentSeeking,'Risco de rent-seeking')}</b><strong class="${rentRisk.cls}">${rentRisk.level}</strong><br><span class="hint">Score de alerta: ${rentRisk.score}</span></div>
      <div class="decision-card"><b>Neutralidade fiscal ${concept(helpNeutralidade,'Neutralidade fiscal')}</b><strong class="${neutralidadeFiscal?(neutralidadeFiscal.atingida?'ok':'bad'):''}">${neutralidadeFiscal?(neutralidadeFiscal.atingida?'Atendida':'Não atendida'):'-'}</strong><br><span class="hint">${neutralidadeHint}</span></div>
      <div class="decision-card"><b>Custo por emprego ${concept(helpEmpregosRenuncia,'Custo por emprego')}</b><strong>${custoEmpregoValor}</strong><br><span class="hint">Diretos + indiretos: ${br(totalJobs,1)} empregos</span></div>
      <div class="decision-card"><b>Compras locais ${concept(helpComprasLocais,'Compras locais')}</b><strong>${localRaw?br(localShare*100,0)+'%':'-'}</strong><br><span class="hint">Média setorial: ${br(Number(r.participacao_insumos_domesticos||0)*100,0)}%</span></div>
    </div>
    ${retentionHtml}
    <div style="border:2px solid var(--primary-light);border-radius:8px;padding:14px;margin:14px 0;background:var(--primary-muted)"><h3 style="margin:0 0 10px;color:var(--primary-dark)">${impactosTitulo}</h3><div class="grid"><div class="kpi"><b>Produção</b><span>${money(impactosEsperados.producao)}</span></div><div class="kpi"><b>Valor adicionado</b><span>${money(impactosEsperados.valorAdicionado)}</span></div><div class="kpi"><b>Empregos na operação</b><span>${br(impactosEsperados.empregos,1)}</span></div><div class="kpi"><b>Empregos na implantação</b><span>${constructionImpact.total>0?br(constructionImpact.total,1):'-'}</span></div><div class="kpi"><b>Massa salarial estimada pela MIP</b><span>${money(impactosEsperados.massaSalarialMip)}</span></div></div><p class="hint" style="margin-top:8px">${impactosHint}</p></div>
    <div style="border:1px solid var(--line);border-left:4px solid var(--primary);border-radius:8px;padding:14px;margin:14px 0;background:#fff">
      <h3 style="margin:0 0 10px;color:var(--primary-dark)">Indicadores municipais do empreendimento</h3>
      <div class="grid">
        <div class="kpi"><b>Produção com benefício sobre PIB municipal</b><span>${pctOrDash(municipalIndicators.producaoSobrePibMunicipal)}</span></div>
        <div class="kpi"><b>Produção com benefício sobre VA setorial municipal</b><span>${pctOrDash(municipalIndicators.producaoSobreVaSetor)}</span></div>
        <div class="kpi"><b>Investimento privado sobre VA setorial municipal</b><span>${investimentoSobreVaSetorTexto}</span></div>
        <div class="kpi"><b>Empregos diretos sobre empregos formais do município</b><span>${pctOrDash(municipalIndicators.empregosDiretosSobreMunicipio)}</span></div>
        <div class="kpi"><b>Desconcentração econômica ${concept(helpDesconcentracao,'Desconcentração econômica')}</b><span class="${locational.className}">${locational.level}</span></div>
      </div>
      <p class="hint" style="margin-top:8px">Base municipal: ${escapeHtml(munName)}. Zona locacional: ${escapeHtml(locational.zona)}. ${escapeHtml(locational.message)} A produção é comparada ao PIB municipal e ao VA municipal de ${escapeHtml(municipalIndicators.grupo)}. A relação investimento/VA usa a mesma base setorial; nos serviços, esse VA exclui administração pública. Os indicadores são medidas de escala relativa, não identidades contábeis.</p>
    </div>
    ${seg==='comercio'?`<div style="border:1px solid var(--comercio-border);border-radius:8px;padding:12px;margin:14px 0;background:var(--comercio-light)"><b style="color:#4c1d95">🛒 Critérios específicos do comércio</b><table style="margin-top:8px"><tr><th>Critério</th><th>Informado</th><th>Pontuação</th></tr><tr><td>Origem dos produtos</td><td>${escapeHtml(comOrigemProd||'Não informado')}</td><td>${comOrigemLocal?'<span class="ok">✓ Origem local — peso 1,50</span>':'<span class="bad">✗ Sem origem local</span>'}</td></tr><tr><td>Destino das vendas</td><td>${escapeHtml(comDestVendas||'Não informado')}</td><td>${comDestinoLocal?'<span class="ok">✓ Mercado estadual — peso 1,50</span>':'<span class="bad">✗ Sem destino estadual</span>'}</td></tr></table></div>`:''}
    <div class="decision-card"><b>Alertas de risco</b><ul>${rentAlerts}</ul></div>
    <div class="decision-card"><b>Log de auditoria</b><br><span class="hint">Registro ${escapeHtml(auditRecord.id)} gerado em ${escapeHtml(auditRecord.timestamp)}.</span><br><button type="button" class="light" onclick="baixarLogAuditoria()">Baixar log JSON</button></div>
    <div class="map-panel">
      <h3>Vetor setorial tradable usado no mapa</h3>
      <p class="hint">${impactSectorsTerritoriais.length} setor(es) tradable(s) concentram ${br(targetShare*100,0)}% dos efeitos indiretos tradables sobre a produção. Serviços locais e atividades dificilmente providas por empresas de outros municípios ficam fora do mapa territorial para reduzir ruído na decisão.</p>
      <table><tr><th>SCN</th><th>Setor</th><th>Coef. indireto</th><th>Impacto estimado</th><th>Participação</th><th>Acumulado</th></tr>${topRows}</table>
    </div>
    <div class="map-panel">
      <h3>Capacidade territorial de absorção dos impactos indiretos</h3>
      <div class="${territorialAbsorption.level==='Alta'?'ok-box':territorialAbsorption.level==='Média'?'warning':'warning'}"><b>${territorialAbsorption.level} capacidade territorial.</b> ${territorialAbsorption.count} município(s) apresentam alta capacidade para absorver efeitos indiretos nos setores tradables demandados pelo projeto. Quanto maior esse número, maior a chance de o benefício gerar encadeamentos produtivos dentro da Paraíba.</div>
      <p class="hint">O Score REGIC-gravitacional-comercial considera apenas setores tradables: agropecuária, extrativa e indústria de transformação. Um município só é pintado quando tem alta capacidade: score territorial relevante, QL acima de 1 no principal setor fornecedor, massa econômica municipal compatível e venda observada na matriz de comércio PB-SCN. Municípios sem alta capacidade ficam em cinza claro.</p>
      <div class="legend"><span><i class="sw" style="background:#343a40"></i>origem</span><span><i class="sw" style="background:#f1f5f9"></i>não destacado</span><span><i class="sw" style="background:#feb24c"></i>alta capacidade</span><span><i class="sw" style="background:#800026"></i>maior SPF</span></div>
      <div class="map-wrap">${map}</div>
      <h4 style="margin:14px 0 4px">Municípios destacados no mapa</h4>
      <table><tr><th>Município</th><th>Capacidade</th><th>SPF / 100</th><th>Distância km</th><th>Peso REGIC</th><th>Principal setor fornecedor</th><th>Venda observada</th><th>Fluxo ao município</th><th>Retenção PB</th></tr>${spatialRowsHtml}</table>
    </div>
    <div class="cards">
      <details class="card wide"><summary>Diagnósticos: qualidade, plausibilidade, ganho adicional e sensibilidade</summary><div class="card-body">
        <div class="module-grid">
          <div class="module-card"><b>Qualidade da informação</b><strong class="${dataQuality.cls}">${dataQuality.level}</strong><p>${br(dataQuality.score*100,0)}% de preenchimento ponderado.</p></div>
          <div class="module-card"><b>Plausibilidade econômica</b><strong class="${plausibility.cls}">${plausibility.level}</strong><p>${plausibility.prodPerJob===null?'Produção por emprego não calculada.':'Produção por emprego: '+money(plausibility.prodPerJob)}</p></div>
          <div class="module-card"><b>Ganho adicional para o Estado</b><strong class="${additionality.cls}">${additionality.level}</strong><p>Score ${br(additionality.score*100,0)}%.</p></div>
          <div class="module-card"><b>Sensibilidade fiscal</b><strong class="${sensitivity.cls}">${sensitivity.leitura}</strong><p>Cenários com 80%, 100% e 120% do choque informado.</p></div>
        </div>
        <div class="field-row-2" style="align-items:start">
          <div><h3>Campos ausentes ou frágeis</h3><ul class="summary-list">${qualityMissingHtml}</ul></div>
          <div><h3>Alertas de plausibilidade</h3><ul class="summary-list">${plausibilityAlertsHtml}</ul></div>
        </div>
        <h3>Notas sobre ganho adicional para o Estado</h3>
        <ul class="summary-list">${additionalityNotesHtml}</ul>
        <h3>Análise de sensibilidade fiscal</h3>
        <table class="sensitivity-table"><tr><th>Cenário</th><th>Choque considerado</th><th>Neutralidade fiscal</th><th>Diferença fiscal</th><th>Produção total</th><th>Empregos</th></tr>${sensitivityRows}</table>
        <p class="hint">Esses diagnósticos não substituem a análise documental. Eles apenas indicam onde o processo está mais forte, mais frágil ou mais dependente de premissas.</p>
      </div></details>
      <details class="card"><summary>Índices setoriais da estrutura produtiva</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Valor</th><th>Leitura</th></tr>
          <tr><td>Índice de justificativa produtiva ${concept(helpJustificativa,'Índice de justificativa produtiva')}</td><td>${br(estrutura.indice_justificativa_produtiva,2)}</td><td class="${indexClass(estrutura.indice_justificativa_produtiva)}">${indexLevel(estrutura.indice_justificativa_produtiva)}</td></tr>
          <tr><td>Índice de encadeamento local ${concept(helpEncadeamento,'Índice de encadeamento local')}</td><td>${br(estrutura.indice_encadeamento_local,2)}</td><td class="${indexClass(estrutura.indice_encadeamento_local)}">${indexLevel(estrutura.indice_encadeamento_local)}</td></tr>
          <tr><td>Índice de mitigação de rent-seeking ${concept(helpMitigacao,'Índice de mitigação de rent-seeking')}</td><td>${br(estrutura.indice_mitigacao_rent_seeking,2)}</td><td class="${indexClass(estrutura.indice_mitigacao_rent_seeking)}">${indexLevel(estrutura.indice_mitigacao_rent_seeking)}</td></tr>
          <tr><td>Intensidade de insumos locais ${concept(helpInsumosLocais,'Intensidade de insumos locais')}</td><td>${br(estrutura.intensidade_insumos_locais*100,1)}%</td><td>Compras internas potenciais</td></tr>
          <tr><td>Dependência de insumos externos ${concept(helpInsumosExternos,'Dependência de insumos externos')}</td><td>${br(estrutura.dependencia_insumos_externos*100,1)}%</td><td>Proxy de vazamento produtivo</td></tr>
          <tr><td>Score de ligação para trás</td><td>${br(estrutura.score_ligacao_tras,2)}</td><td>Demanda de fornecedores</td></tr>
          <tr><td>Score de ligação para frente</td><td>${br(estrutura.score_ligacao_frente,2)}</td><td>Oferta para outros setores</td></tr>
          <tr><td>Score tecnológico setorial</td><td>${br(estrutura.score_tecnologia,2)}</td><td>Conteúdo tecnológico agregado</td></tr>
        </table>
        <p class="hint">O índice de mitigação de rent-seeking ajusta o alerta institucional: setores com melhor justificativa produtiva reduzem o score de risco; setores com baixa justificativa aumentam a cautela.</p>
      </div></details>
      <details class="card"><summary>Impacto econômico</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Multiplicador</th><th>Impacto</th></tr>
          <tr><td>Produção</td><td>${br(r.producao)}</td><td>${money(prod)}</td></tr>
          <tr><td>Valor adicionado</td><td>${br(r.va)}</td><td>${money(va)}</td></tr>
          <tr><td>Receita tributária estimada após renúncia</td><td>${br(Number(r.indireto||0)+directCoefficientEquivalentMip*(1-renunciaPct),4)}</td><td>${money(tax)}</td></tr>
          <tr><td>Valor com benefício informado</td><td colspan="2">${money(declaredValue)} (${seg==='industria'?'produção esperada':'faturamento esperado × '+br(numInput('com_margem',20),1)+'%'})</td></tr>
          <tr><td>Valor sem benefício informado</td><td colspan="2">${valorSemBeneficioInformado?money(valorSemBeneficioDeclarado):'Não informado'}</td></tr>
          <tr><td>Acréscimo aplicado à MIP</td><td colspan="2">${money(valueBRL)}</td></tr>
        </table>
      </div></details>
      <details class="card"><summary>Emprego</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>${empregosDiretosLabel}</td><td>${br(directJobs,0)}</td></tr>
          <tr><td>Empregos indiretos estimados</td><td>${br(indirectJobs,0)}</td></tr>
          <tr><td>Total de empregos</td><td>${br(totalJobs,0)}</td></tr>
          <tr><td>Empregos de implantação - diretos nas obras</td><td>${constructionImpact.total>0?br(constructionImpact.diretos,1):'-'}</td></tr>
          <tr><td>Empregos de implantação - indiretos nas obras</td><td>${constructionImpact.total>0?br(constructionImpact.indiretos,1):'-'}</td></tr>
          <tr><td>Total de empregos na implantação</td><td>${constructionImpact.total>0?br(constructionImpact.total,1):'-'}</td></tr>
          <tr><td>Referência setorial (MIP)</td><td>${br(expectedDirectJobs,0)} empregos</td></tr>
          <tr><td>Salário médio mensal esperado</td><td>${salario>0?money(salario):'-'}</td></tr>
          <tr><td>Custo fiscal por emprego total</td><td>${costPerJob===null?'-':money(costPerJob)}</td></tr>
          <tr><td>Custo fiscal por emprego direto</td><td>${costPerDirectJob===null?'-':money(costPerDirectJob)}</td></tr>
        </table>
      </div></details>
      <details class="card"><summary>Território</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Leitura</th></tr>
          <tr><td>Município</td><td>${munName}</td></tr>
          <tr><td>Emprego formal municipal</td><td>${munTotal?br(munTotal,0):'-'}</td></tr>
          <tr><td>QL do setor principal</td><td>${br(mainSpec.ql,2)} ${mainSpec.ok?'<span class="ok">especialização robusta</span>':'<span class="bad">sem especialização robusta</span>'}</td></tr>
          <tr><td>Setores tradables indiretos com espec. robusta no município</td><td>${qlTopCount} de ${impactSectorsTerritoriais.length}</td></tr>
          <tr><td>Municípios com alta capacidade territorial</td><td>${territorialAbsorption.count} de ${municipalities.length} (${br(territorialAbsorption.share*100,1)}%)</td></tr>
          <tr><td>Impacto relativo no emprego formal local</td><td>${territorialShare===null?'-':br(territorialShare*100,2)+'%'}</td></tr>
        </table>
        <div class="${specializedImpact.length?'hint ok':'warning'}">${specializedMsg}</div>
        <table><tr><th>SCN</th><th>Setor indiretamente impactado</th><th>QL</th><th>Empregos</th><th>Situação</th></tr>${qlRows}</table>
        <table><tr><th>SCN</th><th>Setores especializados no município</th><th>QL</th><th>Empregos</th><th>Relação</th></tr>${specializedHtml}</table>
      </div></details>
      <details class="card"><summary>Tecnologia e produto</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Leitura</th></tr>
          <tr><td>Conteúdo tecnológico setorial</td><td>${techLabel(tech.sec.nome_predominante)} <span class="pill">score ${br(tech.sec.score_medio,2)}/4</span></td></tr>
          <tr><td>Substitui importações</td><td>${triStateLabel(substituiEstado)}</td></tr>
          <tr><td>Produto novo ou pouco produzido no estado</td><td>${triStateLabel(novoProdutoEstado)}</td></tr>
          ${seg==='industria'?`<tr><td>Aderência NCM-produto</td><td>${adherence.message}</td></tr>`:'<tr><td>NCM</td><td>Não aplicável ao macrossegmento Comércio</td></tr>'}
        </table>
        ${seg==='industria'?`<table><tr><th>NCM</th><th>Conteúdo tecnológico</th><th>Setor aproximado</th></tr>${ncmRows}</table>`:''}
      </div></details>
      <details class="card"><summary>Compras locais e tributos</summary><div class="card-body">
        ${fiscalMethodHtml}
        <table><tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>Parcela de insumos locais informada</td><td>${br(localShare*100,1)}%</td></tr>
          <tr><td>Média setorial de insumos domésticos</td><td>${br(Number(r.participacao_insumos_domesticos||0)*100,1)}%</td></tr>
          <tr><td>Índice de adensamento local</td><td>${br(adensamento*10,1)} de 10</td></tr>
          <tr><td>Renúncia fiscal estimada</td><td>${renuncia>0?money(renuncia):'-'}</td></tr>
          <tr><td>Receita tributária estimada após renúncia</td><td>${money(tax)}</td></tr>
          <tr><td>Custo fiscal por VA gerado</td><td>${costPerVA===null?'-':br(costPerVA*100,2)+'%'}</td></tr>
        </table>
      </div></details>
      <details class="card wide"><summary>Composição fiscal por produto — ICMS e DIFAL</summary><div class="card-body">
        ${fiscalMethodHtml}
        <table><tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>Base fiscal incremental declarada</td><td>${money(fiscalProdutos.fiscalIncrement)}</td></tr>
          <tr><td>Cobertura do ICMS por produtos</td><td>${br(fiscalProdutos.directCoverage*100,2)}%</td></tr>
          <tr><td>Coeficiente de ICMS da composição informada</td><td>${br(fiscalProdutos.productDirectCoefficient*100,4)}%</td></tr>
          <tr><td>Coeficiente tributário direto médio da MIP</td><td>${br(fiscalProdutos.sectorDirectCoefficient*100,4)}%</td></tr>
          <tr><td>Coeficiente efetivo combinado</td><td><b>${br(fiscalProdutos.effectiveDirectCoefficient*100,4)}%</b></td></tr>
          <tr><td>ICMS direto incremental antes do benefício</td><td><b>${money(fiscalProdutos.directIncrement)}</b></td></tr>
          <tr><td>Estimativa de DIFAL/ST/entrada</td><td>${money(fiscalProdutos.difalRevenue)} (${escapeHtml(externalScenario.metodologiaEntrada)})</td></tr>
        </table>
        <h3>Produtos informados</h3>
        <table><tr><th>NCM</th><th>Produto</th><th>Participação</th><th>Base</th><th>Alíquota efetiva</th><th>Tratamento</th><th>ICMS direto</th><th>DIFAL/ST</th></tr>${fiscalProductRowsHtml}</table>
        <div class="${fiscalProdutos.warnings.length?'warning':'ok-box'}"><b>Leitura metodológica</b>${fiscalWarningsHtml}</div>
        <p class="hint">A composição não consulta automaticamente a legislação tributária. As alíquotas e tratamentos devem ser conferidos por produto, operação, origem, destino, destinatário e período de vigência.</p>
      </div></details>
      <details class="card"><summary>Investimento e enraizamento</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Informação</th></tr>
          <tr><td>Investimento privado total considerado</td><td>${investPrivado?money(investPrivado):'-'}</td></tr>
          <tr><td>Imóvel de instalação</td><td>${escapeHtml(imovelTipoLabel)}</td></tr>
          <tr><td>Parcela dos equipamentos adquiridos para a empresa</td><td>${equipamentosAdquiridosPct===null?'-':br(equipamentosAdquiridosPct,0)+'%'}</td></tr>
          <tr><td>Aquisição de terreno ou imóvel</td><td>${money(investimentoTerrenoImovel)}</td></tr>
          <tr><td>Obras</td><td>${money(investimentoObras)}</td></tr>
          <tr><td>Outros investimentos previstos</td><td>${money(investimentoOutros)}</td></tr>
          <tr><td>Incentivo locacional/crédito informado</td><td>${escapeHtml(incentivoLocacionalLabel)}</td></tr>
        </table>
        <p class="hint">Essas informações ajudam a avaliar o enraizamento do projeto na Paraíba e a cumulatividade de apoios públicos. Imóvel próprio, obras relevantes e equipamentos dedicados tendem a indicar maior custo de saída; aluguel, baixa aquisição de equipamentos ou incentivo locacional adicional pedem leitura mais cautelosa.</p>
      </div></details>
      ${neutralidadeHtml}
      <details class="card wide"><summary>Viabilidade social experimental: VA gerado vs. benefício tributário</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>VA em valor presente</td><td>${money(social.pvVA)}</td></tr>
          <tr><td>Benefício tributário em VP</td><td>${money(social.pvRenuncia)}</td></tr>
          <tr><td>VA / benefício tributário em VP</td><td>${social.vaRenunciaPV===null?'-':br(social.vaRenunciaPV,2)}</td></tr>
          <tr><td>Saldo social em VP</td><td>${money(social.pvNet)}</td></tr>
          <tr><td>Payback social</td><td>${social.payback===null?'Não alcançado no horizonte':social.payback+' ano(s)'}</td></tr>
        </table>
        <table><tr><th>Ano</th><th>Benefício tributário</th><th>VA gerado</th><th>VA - benefício</th><th>Saldo acumulado</th></tr>${socialRows}</table>
        <p class="hint">Análise experimental. Não entra na nota preliminar.</p>
      </div></details>
      <details class="card wide"><summary>Custo-benefício da massa salarial experimental</summary><div class="card-body">
        <table><tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>Massa salarial direta informada</td><td>${wageReturn.directReportedBase>0?money(wageReturn.directReportedBase):'-'}</td></tr>
          <tr><td>Massa salarial indireta estimada</td><td>${money(wageReturn.indirectMipBase)}</td></tr>
          <tr><td>Massa salarial combinada anual</td><td>${money(wageReturn.combinedBase)}</td></tr>
          <tr><td>Massa salarial VP / renúncia VP</td><td>${wageCB.wageRenunciaPV===null?'-':br(wageCB.wageRenunciaPV,2)}</td></tr>
          <tr><td>Payback pela massa salarial</td><td>${wageCB.payback===null?'Não alcançado':wageCB.payback+' ano(s)'}</td></tr>
        </table>
        <h3>Composição da massa salarial indireta por setor</h3>
        <table><tr><th>SCN</th><th>Setor</th><th>Empregos indiretos</th><th>Salário médio anual</th><th>Massa salarial</th></tr>${wageComponentRows}</table>
        <table><tr><th>Ano</th><th>Renúncia</th><th>Massa salarial</th><th>Saldo</th><th>Acumulado</th></tr>${wageCBRows}</table>
        <p class="hint">Análise experimental. Não entra na nota preliminar.</p>
      </div></details>
      <details class="card wide" id="strategy_pesos_card"><summary>Estratégia setorial e pesos usados na nota</summary><div class="card-body">
        <table><tr><th>Critério</th><th>Leitura</th></tr>
          <tr><td>Setor-chave pela MIP</td><td>${r.setor_chave?'<span class="ok">Sim</span>':'<span class="bad">Não</span>'}</td></tr>
          <tr><td>Setor estratégico informado</td><td>${estrategicoEstado==='sim'?'<span class="ok">Sim</span>':triStateLabel(estrategicoEstado)}</td></tr>
          <tr><td>Tempo previsto do projeto na Paraíba</td><td>${permanencia?permanencia+' ano(s)':'Não informado'}</td></tr>
          <tr><td>Ativos fixos irrecuperáveis</td><td>${ativosIrrPct===null?'Não informado':br(ativosIrrPct,1)+'%'}</td></tr>
          <tr><td>Zona locacional</td><td>${escapeHtml(locational.zona)} — ${escapeHtml(locational.level)} contribuição para desconcentração</td></tr>
          <tr><td>Ligação para trás</td><td>${br(r.ligacao_tras,2)}</td></tr>
          <tr><td>Ligação para frente</td><td>${br(r.ligacao_frente,2)}</td></tr>
        </table>
        <h3>Pesos usados na nota — ${macroLabel}</h3>
        <p class="hint">Pesos marcados com <span class="peso-comercio-badge">Comércio</span> só entram na nota quando o macrossegmento é Comércio (valor 0 para Indústria).</p>
        <table><tr><th>Indicador</th><th>Peso</th><th>Critério atendido</th></tr>
          <tr><td>Produção acima da média</td><td>${br(w.producao,2)}</td><td>${criteria.producao?'Sim':'Não'}</td></tr>
          <tr><td>VA acima da média</td><td>${br(w.va,2)}</td><td>${criteria.va?'Sim':'Não'}</td></tr>
          <tr><td>Emprego acima da média</td><td>${br(w.empregoMult,2)}</td><td>${criteria.empregoMult?'Sim':'Não'}</td></tr>
          <tr><td>Tributos acima da média</td><td>${br(w.tributosMult,2)}</td><td>${criteria.tributosMult?'Sim':'Não'}</td></tr>
          <tr><td>Tributos / renúncia</td><td>${br(w.beneficioCusto,2)}</td><td>${br(criteria.beneficioCusto*100,1)}%</td></tr>
          <tr><td>Empregos diretos</td><td>${br(w.empregoDireto,2)}</td><td>${criteria.empregoDireto?'Sim':'Não'}</td></tr>
          <tr><td>Compras locais</td><td>${br(w.comprasLocais,2)}</td><td>${criteria.comprasLocais?'Sim':'Não'}</td></tr>
          <tr><td>Conteúdo tecnológico</td><td>${br(w.tecnologia,2)}</td><td>${br(criteria.tecnologia*100,1)}%</td></tr>
          <tr><td>Especialização territorial</td><td>${br(w.territorioQl,2)}</td><td>${br(criteria.territorioQl*100,1)}%</td></tr>
          <tr><td>Abrangência municipal</td><td>${br(w.abrangenciaMunicipal,2)}</td><td>${br(criteria.abrangenciaMunicipal*100,1)}%</td></tr>
          <tr><td>Baixa base formal municipal</td><td>${br(w.territorioBase,2)}</td><td>${criteria.territorioBase?'Sim':'Não'}</td></tr>
          <tr><td>Desconcentração econômica</td><td>${br(w.desconcentracaoEconomica,2)}</td><td>${br(criteria.desconcentracaoEconomica*100,1)}%</td></tr>
          <tr><td>Tempo do projeto na Paraíba</td><td>${br(w.tempoProjeto,2)}</td><td>${br(criteria.tempoProjeto*100,1)}%</td></tr>
          <tr><td>Ativos fixos irrecuperáveis</td><td>${br(w.ativosIrrecuperaveis,2)}</td><td>${br(criteria.ativosIrrecuperaveis*100,1)}%</td></tr>
          <tr><td>Destino para fora do estado</td><td>${br(w.destino,2)}</td><td>${criteria.destino?'Sim':'Não'}</td></tr>
          <tr><td>Substituição de importações</td><td>${br(w.substituicao,2)}</td><td>${criteria.substituicao?'Sim':'Não'}</td></tr>
          <tr><td>Produto novo/pouco produzido</td><td>${br(w.produtoNovo,2)}</td><td>${criteria.produtoNovo?'Sim':'Não'}</td></tr>
          <tr><td>Setor estratégico ou setor-chave</td><td>${br(w.estrategia,2)}</td><td>${criteria.estrategia?'Sim':'Não'}</td></tr>
          <tr><td>Vende produtos de origem local (PB) <span class="peso-comercio-badge">Comércio</span></td><td>${br(w.comOrigemLocal,2)}</td><td>${criteria.comOrigemLocal?'Sim':'Não/N.A.'}</td></tr>
          <tr><td>Destina vendas ao mercado estadual <span class="peso-comercio-badge">Comércio</span></td><td>${br(w.comDestinoLocal,2)}</td><td>${criteria.comDestinoLocal?'Sim':'Não/N.A.'}</td></tr>
        </table>
      </div></details>
    </div>
      </div>
    </details>
  `;
  document.getElementById('relatorio')?.classList.add('presentation-mode');
  const relatorioTributario = document.getElementById('relatorio_tributario');
  if (relatorioTributario) {
    relatorioTributario.classList.add('presentation-mode');
    relatorioTributario.innerHTML = taxPresentationHtml + `
      <div class="report-actions no-print">
        <button type="button" class="secondary" onclick="prepararImpressaoRelatorio()">Exportar relatório em PDF</button>
      </div>
      <h2>Impactos tributários — dados experimentais</h2>
      ${pesoWarning}${macroAviso}${modoAviso}${tetoAviso}
      <div class="decision-layer tax-layer">
        <div class="layer-title">
          <div><div class="layer-kicker">Mérito fiscal-arrecadatório</div><h3>Resposta fiscal, renúncia e arrecadação indireta</h3></div>
          <span class="pill">${macroLabel} · ${modoLabel}</span>
        </div>
        <div class="executive-summary">
          <div class="summary-box">
            <h3>Leitura fiscal</h3>
            <ul class="summary-list">${fiscalNotesHtml}</ul>
          </div>
          <div class="summary-box">
            <h3>Mensagem para decisão fiscal</h3>
            <p>${escapeHtml(fiscalAssessment.level)}. A leitura desta aba concentra apenas variáveis tributárias: renúncia, receita tributária estimada após renúncia, neutralidade fiscal, composição fiscal por produto e eventual comparação com abastecimento interestadual.</p>
          </div>
        </div>
        <div class="decision-grid four" data-module-container="impactos_tributarios_cards">
          <div class="decision-card ${dimCardClass(fiscalAssessment)}"><b>Mérito fiscal-arrecadatório</b><strong>${fiscalAssessment.level}</strong><span class="metric-note">Nota fiscal ${br(fiscalAssessment.score,1)} de 10.</span></div>
          <div class="decision-card highlight"><b>A renúncia se paga indiretamente? ${concept(helpNeutralidade,'Neutralidade fiscal')}</b><strong class="${neutralidadeFiscal?(neutralidadeFiscal.atingida?'ok':'bad'):''}">${neutralidadeFiscal?(neutralidadeFiscal.atingida?'Sim':'Não'):'-'}</strong><span class="metric-note">${neutralidadeHint}</span></div>
          <div data-module-id="renuncia_fiscal" class="decision-card"><b>Renúncia fiscal estimada</b><strong>${renuncia>0?money(renuncia):'-'}</strong><span class="metric-note">Percentual pleiteado: ${br(renunciaPct*100,1)}%.</span></div>
          <div data-module-id="receita_tributaria" class="decision-card"><b>Receita tributária estimada</b><strong>${money(tax)}</strong><span class="metric-note">ICMS direto remanescente após renúncia + tributos indiretos estimados.</span></div>
        </div>
        <div class="decision-grid three">
          <div data-module-id="custo_por_emprego" class="decision-card"><b>Custo fiscal por emprego ${concept(helpEmpregosRenuncia,'Custo por emprego')}</b><strong>${custoEmpregoValor}</strong><span class="metric-note">Diretos + indiretos: ${br(totalJobs,1)} empregos.</span></div>
          <div data-module-id="tributos_indiretos" class="decision-card"><b>Tributos indiretos</b><strong>${money(taxIndirect)}</strong><span class="metric-note">Arrecadação indireta estimada nos demais setores.</span></div>
          <div class="decision-card"><b>ICMS direto antes do benefício</b><strong>${money(taxDirectGross)}</strong><span class="metric-note">${escapeHtml(fiscalProdutos.methodLabel || 'Método fiscal da MIP')}</span></div>
        </div>
        ${externalScenarioHtml}
        ${retentionHtml}
        ${neutralidadeHtml}
        <details class="card wide" open><summary>Memória fiscal sintética</summary><div class="card-body">
          ${fiscalMethodHtml}
          <table><tr><th>Indicador</th><th>Valor</th></tr>
            <tr><td>Valor incremental considerado na MIP</td><td>${money(valueBRL)}</td></tr>
            <tr><td>Coeficiente tributário direto efetivo</td><td>${br(directCoefficient*100,4)}%</td></tr>
            <tr><td>Coeficiente tributário indireto da MIP</td><td>${br(Number(r.indireto||0)*100,4)}%</td></tr>
            <tr><td>Tributos diretos brutos</td><td>${money(taxDirectGross)}</td></tr>
            <tr><td>Renúncia fiscal estimada</td><td>${renuncia>0?money(renuncia):'-'}</td></tr>
            <tr><td>Tributos diretos mantidos após renúncia</td><td>${money(Math.max(0, taxDirectGross-renuncia))}</td></tr>
            <tr><td>Tributos indiretos estimados</td><td>${money(taxIndirect)}</td></tr>
            <tr><td>Receita tributária estimada após renúncia</td><td><b>${money(tax)}</b></td></tr>
            <tr><td>Receita estimada / renúncia</td><td>${taxRenuncia===null?'-':br(taxRenuncia,2)}</td></tr>
          </table>
        </div></details>
        <details data-module-id="difal_st" class="card wide"><summary>Composição fiscal por produto — ICMS e DIFAL</summary><div class="card-body">
          ${fiscalMethodHtml}
          <table><tr><th>Indicador</th><th>Valor</th></tr>
            <tr><td>Base fiscal incremental declarada</td><td>${money(fiscalProdutos.fiscalIncrement)}</td></tr>
            <tr><td>Cobertura do ICMS por produtos</td><td>${br(fiscalProdutos.directCoverage*100,2)}%</td></tr>
            <tr><td>Coeficiente de ICMS da composição informada</td><td>${br(fiscalProdutos.productDirectCoefficient*100,4)}%</td></tr>
            <tr><td>Coeficiente tributário direto médio da MIP</td><td>${br(fiscalProdutos.sectorDirectCoefficient*100,4)}%</td></tr>
            <tr><td>Coeficiente efetivo combinado</td><td><b>${br(fiscalProdutos.effectiveDirectCoefficient*100,4)}%</b></td></tr>
            <tr><td>ICMS direto incremental antes do benefício</td><td><b>${money(fiscalProdutos.directIncrement)}</b></td></tr>
            <tr><td>Estimativa de DIFAL/ST/entrada</td><td>${money(fiscalProdutos.difalRevenue)} (${escapeHtml(externalScenario.metodologiaEntrada)})</td></tr>
          </table>
          <h3>Produtos informados</h3>
          <table><tr><th>NCM</th><th>Produto</th><th>Participação</th><th>Base</th><th>Alíquota efetiva</th><th>Tratamento</th><th>ICMS direto</th><th>DIFAL/ST</th></tr>${fiscalProductRowsHtml}</table>
          <div class="${fiscalProdutos.warnings.length?'warning':'ok-box'}"><b>Leitura metodológica</b>${fiscalWarningsHtml}</div>
          <p class="hint">A composição não consulta automaticamente a legislação tributária. As alíquotas e tratamentos devem ser conferidos por produto, operação, origem, destino, destinatário e período de vigência.</p>
        </div></details>
        <details class="card wide"><summary>Sensibilidade fiscal</summary><div class="card-body">
          <table class="sensitivity-table"><tr><th>Cenário</th><th>Choque considerado</th><th>Neutralidade fiscal</th><th>Diferença fiscal</th><th>Produção total</th><th>Empregos</th></tr>${sensitivityRows}</table>
          <p class="hint">Essa sensibilidade altera apenas o cenário de choque para leitura fiscal. Os resultados econômicos da aba Impactos econômicos continuam derivados do choque declarado originalmente.</p>
        </div></details>
      </div>`;
  }
  const relatorioFain = document.getElementById('relatorio_fain');
  if (relatorioFain) {
    relatorioFain.classList.add('presentation-mode');
    relatorioFain.innerHTML = `
      <div class="report-actions no-print">
        <button type="button" class="secondary" onclick="prepararImpressaoRelatorio()">Exportar relatório em PDF</button>
      </div>
      <h2>Checklist FAIN — aderência normativa e documental</h2>
      ${tetoAviso}
      <div class="decision-layer">
        <div class="layer-title">
          <div><div class="layer-kicker">Conferência normativa preliminar</div><h3>Elegibilidade, limites e instrução processual</h3></div>
          <span class="pill">Não entra na nota MIP</span>
        </div>
        <div class="executive-summary">
          <div class="summary-box">
            <h3>Leitura do checklist</h3>
            <p>${escapeHtml(fainChecklist.message)}</p>
            <p><b>Uso recomendado:</b> conferir se o processo reúne condições mínimas de enquadramento, documentação e regularidade antes de avançar para decisão sobre mérito econômico e retorno tributário.</p>
          </div>
          <div class="summary-box">
            <h3>Ressalva institucional</h3>
            <p>Este bloco traduz critérios gerais do FAIN em perguntas de auditoria. Ele não substitui parecer jurídico, instrução processual, análise da CINEP, manifestação da SEFAZ nem deliberação do Conselho competente.</p>
          </div>
        </div>
        <div class="decision-grid four">
          <div class="decision-card ${dimCardClass(fainChecklist)}"><b>Resultado do checklist</b><strong>${escapeHtml(fainChecklist.level)}</strong><span class="metric-note">Aderência: ${br(fainChecklist.score*100,0)}% dos itens avaliáveis.</span></div>
          <div class="decision-card good"><b>Itens atendidos</b><strong>${fainChecklist.counts.atendidos}</strong><span class="metric-note">Critérios com evidência afirmativa ou inferência objetiva pelo painel.</span></div>
          <div class="decision-card alert"><b>Pendências</b><strong>${fainChecklist.counts.pendentes}</strong><span class="metric-note">Itens sem informação suficiente para validação.</span></div>
          <div class="decision-card ${fainChecklist.counts.naoAtendidos>0?'bad-card':'good'}"><b>Não atendidos</b><strong>${fainChecklist.counts.naoAtendidos}</strong><span class="metric-note">Inclui falhas críticas quando houver.</span></div>
        </div>
        <details class="card wide" open><summary>Itens de verificação FAIN</summary><div class="card-body">
          <table>
            <tr><th>Grupo</th><th>Item de verificação</th><th>Situação</th><th>Criticidade</th><th>Evidência usada pelo painel</th></tr>
            ${fainRowsHtml}
          </table>
          <div class="${fainChecklist.notes.some(item => item.includes('crítico')) ? 'warning' : 'ok-box'}"><b>Observações automáticas</b>${fainNotesHtml}</div>
        </div></details>
        <details class="card wide"><summary>Base normativa resumida usada no checklist</summary><div class="card-body">
          <table>
            <tr><th>Dimensão</th><th>Como o painel operacionaliza</th></tr>
            <tr><td>Finalidade do FAIN</td><td>Verifica se o pleito se enquadra em implantação, ampliação, modernização, revitalização, relocalização, produto sem similar ou hipótese de isonomia/competitividade.</td></tr>
            <tr><td>Atividade elegível</td><td>Trata indústria como aderente por padrão e exige confirmação quando o caso envolver turismo ou outra atividade dependente de análise específica.</td></tr>
            <tr><td>Limite do incentivo</td><td>Compara o percentual pleiteado ao teto operacional de 74,25% e ao teto configurado no painel.</td></tr>
            <tr><td>Critérios econômicos</td><td>Confere se há dados de empregos diretos, investimento e produção para sustentar a análise de contrapartidas.</td></tr>
            <tr><td>Regularidade fiscal e cadastral</td><td>Solicita confirmação de domicílio/foro na Paraíba, inscrição no ICMS, adimplência estadual e não enquadramento no Simples, quando aplicável.</td></tr>
            <tr><td>Documentação de produtos</td><td>Confere NCM/produtos/produção anual e, quando o argumento for produto novo ou sem similar, destaca a necessidade de certidão/documento equivalente.</td></tr>
          </table>
          <p class="hint">A parametrização foi criada para triagem preliminar. Regras específicas, alterações legislativas, regimes especiais, prazos, pareceres e condicionantes devem ser conferidos no processo administrativo.</p>
        </div></details>
      </div>`;
  }
  window.MapaTerritorial?.setupMapTooltips();
  routeReportTabs();
  window.PainelModular?.applyToDocument(document);
  window.MapaTerritorial?.setupMapTooltips();
  switchMainTab('economico');
  return true;
}
