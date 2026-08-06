// static/v20/fiscal_produtos.js — composição fiscal por produto (ICMS/DIFAL).
let fiscalProductCount = 0;

function clampFiscal(value, min = 0, max = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

function fiscalNumber(raw, fallback = 0) {
  const normalized = (raw ?? '').toString().trim().replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : fallback;
}

function fiscalTreatmentLabel(value) {
  return {
    normal: 'Tributação normal',
    st_difal: 'ICMS-ST / DIFAL / antecipação',
    isento_diferido: 'Isento, não incidência ou diferimento',
    nao_informado: 'Não informado'
  }[value] || 'Não informado';
}

function adicionarProdutoFiscal(values = {}) {
  fiscalProductCount += 1;
  const id = `fiscal_product_${fiscalProductCount}`;
  const row = document.createElement('div');
  row.id = id;
  row.className = 'fiscal-product-row';
  row.innerHTML = `
    <div class="fiscal-product-head">
      <div>
        <span class="fiscal-product-kicker">Produto ${fiscalProductCount}</span>
        <strong>Parâmetros efetivos de ICMS</strong>
      </div>
      <button type="button" class="light fiscal-product-remove" onclick="removerProdutoFiscal('${id}')" aria-label="Remover produto">Remover</button>
    </div>
    <div class="fiscal-product-grid">
      <label>NCM
        <input class="fiscal-product-input" data-fiscal-field="ncm" inputmode="numeric" maxlength="10" placeholder="Ex.: 22021000">
      </label>
      <label class="fiscal-product-description">Descrição do produto
        <input class="fiscal-product-input" data-fiscal-field="descricao" placeholder="Ex.: bebidas não alcoólicas">
      </label>
      <label>Participação no faturamento (%)
        <input class="fiscal-product-input" data-fiscal-field="participacao" type="number" min="0" max="100" step="0.01" placeholder="Ex.: 60">
      </label>
      <label>Base tributável (%)
        <input class="fiscal-product-input" data-fiscal-field="base" type="number" min="0" max="100" step="0.01" value="100">
      </label>
      <label>Alíquota efetiva própria (%)
        <input class="fiscal-product-input" data-fiscal-field="aliquota_efetiva" type="number" min="0" max="100" step="0.01" placeholder="Já líquida de créditos ordinários">
      </label>
      <label>Vendas destinadas à PB (%)
        <input class="fiscal-product-input" data-fiscal-field="vendas_pb" type="number" min="0" max="100" step="0.01" value="100">
      </label>
      <label>Alíquota interna PB (%)
        <input class="fiscal-product-input" data-fiscal-field="aliquota_interna" type="number" min="0" max="100" step="0.01" placeholder="Conforme NCM/operação">
      </label>
      <label>Alíquota interestadual (%)
        <input class="fiscal-product-input" data-fiscal-field="aliquota_interestadual" type="number" min="0" max="100" step="0.01" placeholder="Conforme origem/operação">
      </label>
      <label>Tratamento fiscal
        <select class="fiscal-product-input" data-fiscal-field="tratamento">
          <option value="nao_informado">Não informado</option>
          <option value="normal">Tributação normal</option>
          <option value="st_difal">ICMS-ST / DIFAL / antecipação</option>
          <option value="isento_diferido">Isento, não incidência ou diferimento</option>
        </select>
      </label>
    </div>`;
  const setValue = (field, value) => {
    const input = row.querySelector(`[data-fiscal-field="${field}"]`);
    if (input && value !== undefined && value !== null) input.value = value;
  };
  Object.entries(values).forEach(([field, value]) => setValue(field, value));
  row.querySelectorAll('.fiscal-product-input').forEach(input => {
    input.addEventListener('input', atualizarResumoFiscalProdutos);
    input.addEventListener('change', atualizarResumoFiscalProdutos);
  });
  document.getElementById('fiscal_product_list')?.appendChild(row);
  atualizarResumoFiscalProdutos();
}

function removerProdutoFiscal(id) {
  document.getElementById(id)?.remove();
  atualizarResumoFiscalProdutos();
}

function getFiscalProductRows() {
  return Array.from(document.querySelectorAll('.fiscal-product-row')).map((row, index) => {
    const raw = field => (row.querySelector(`[data-fiscal-field="${field}"]`)?.value || '').trim();
    const ncm = normNcm(raw('ncm'));
    const descricao = raw('descricao');
    const participacaoRaw = raw('participacao');
    const baseRaw = raw('base');
    const aliquotaEfetivaRaw = raw('aliquota_efetiva');
    const vendasPbRaw = raw('vendas_pb');
    const aliquotaInternaRaw = raw('aliquota_interna');
    const aliquotaInterestadualRaw = raw('aliquota_interestadual');
    const tratamento = raw('tratamento') || 'nao_informado';
    const participacaoPct = clampFiscal(fiscalNumber(participacaoRaw), 0, 100);
    const basePct = clampFiscal(fiscalNumber(baseRaw, 100), 0, 100);
    const aliquotaEfetivaPct = clampFiscal(fiscalNumber(aliquotaEfetivaRaw), 0, 100);
    const vendasPbPct = clampFiscal(fiscalNumber(vendasPbRaw, 100), 0, 100);
    const aliquotaInternaPct = clampFiscal(fiscalNumber(aliquotaInternaRaw), 0, 100);
    const aliquotaInterestadualPct = clampFiscal(fiscalNumber(aliquotaInterestadualRaw), 0, 100);
    const isento = tratamento === 'isento_diferido';
    const identificado = Boolean(ncm || descricao || participacaoRaw || aliquotaEfetivaRaw || aliquotaInternaRaw || aliquotaInterestadualRaw);
    const validoDireto = participacaoPct > 0 && (isento || aliquotaEfetivaRaw !== '');
    const validoDifal = participacaoPct > 0 && !isento && aliquotaInternaRaw !== '' && aliquotaInterestadualRaw !== '';
    return {
      ordem: index + 1,
      ncm,
      descricao,
      participacaoPct,
      basePct,
      aliquotaEfetivaPct: isento ? 0 : aliquotaEfetivaPct,
      vendasPbPct,
      aliquotaInternaPct,
      aliquotaInterestadualPct,
      tratamento,
      tratamentoLabel: fiscalTreatmentLabel(tratamento),
      identificado,
      validoDireto,
      validoDifal
    };
  });
}

function atualizarResumoFiscalProdutos() {
  const summary = document.getElementById('fiscal_product_summary');
  if (!summary) return;
  const rows = getFiscalProductRows();
  const informed = rows.filter(row => row.identificado);
  const validDirect = rows.filter(row => row.validoDireto);
  const share = validDirect.reduce((sum, row) => sum + row.participacaoPct, 0);
  if (!informed.length) {
    summary.className = 'fiscal-product-summary';
    summary.textContent = 'Sem composição informada: será usada a média tributária setorial da MIP.';
    return;
  }
  summary.className = `fiscal-product-summary ${share >= 99.99 && share <= 100.01 ? 'complete' : 'partial'}`;
  summary.textContent = `${validDirect.length} produto(s) com alíquota utilizável; cobertura fiscal de ${br(Math.min(share, 100), 2)}%. ${share < 99.99 ? 'A parcela restante usará a média setorial da MIP.' : share > 100.01 ? 'As participações serão normalizadas para 100%.' : 'Composição completa.'}`;
}

function calcularFiscalProdutos({
  fiscalValueWith,
  fiscalValueWithout,
  mipIncrement,
  sectorDirectCoefficient
}) {
  const rows = getFiscalProductRows();
  const informedRows = rows.filter(row => row.identificado);
  const directRows = rows.filter(row => row.validoDireto);
  const difalRows = rows.filter(row => row.validoDifal);
  const fiscalWith = Math.max(0, Number(fiscalValueWith || 0));
  const fiscalWithout = Math.max(0, Number(fiscalValueWithout || 0));
  const fiscalIncrement = Math.max(0, fiscalWith - fiscalWithout);
  const mipBase = Math.max(0, Number(mipIncrement || 0));
  const sectorCoefficient = Math.max(0, Number(sectorDirectCoefficient || 0));
  const sectorDirectIncrement = mipBase * sectorCoefficient;

  const directShareRaw = directRows.reduce((sum, row) => sum + row.participacaoPct, 0);
  const directCoverage = Math.min(1, directShareRaw / 100);
  const productDirectCoefficient = directShareRaw > 0 ?
    directRows.reduce((sum, row) => {
      const normalizedShare = row.participacaoPct / directShareRaw;
      return sum + normalizedShare * (row.basePct / 100) * (row.aliquotaEfetivaPct / 100);
    }, 0) : 0;
  const productDirectIncrement = fiscalIncrement * directCoverage * productDirectCoefficient;
  const fallbackDirectIncrement = sectorDirectIncrement * (1 - directCoverage);
  const directIncrement = productDirectIncrement + fallbackDirectIncrement;
  const effectiveDirectCoefficient = fiscalIncrement > 0 ?
    directIncrement / fiscalIncrement :
    (mipBase > 0 ? sectorDirectIncrement / mipBase : sectorCoefficient);
  const equivalentMipCoefficient = mipBase > 0 ? directIncrement / mipBase : sectorCoefficient;

  const pctCapture = clampFiscal(numInput('ext_pct_captura_entrada', 50) / 100);
  const pctMarketPbFallback = clampFiscal(numInput('ext_pct_vendas_pb', 100) / 100);
  const difalShareRaw = difalRows.reduce((sum, row) => sum + row.participacaoPct, 0);
  const difalCoverage = Math.min(1, difalShareRaw / 100);
  const productDifalRate = difalShareRaw > 0 ?
    difalRows.reduce((sum, row) => {
      const normalizedShare = row.participacaoPct / difalShareRaw;
      const rateDifference = Math.max(0, row.aliquotaInternaPct - row.aliquotaInterestadualPct) / 100;
      return sum + normalizedShare * (row.vendasPbPct / 100) * (row.basePct / 100) * rateDifference;
    }, 0) : 0;
  const productDifalRevenue = fiscalIncrement * difalCoverage * productDifalRate * pctCapture;
  const fallbackDifalRevenue = fiscalIncrement * pctMarketPbFallback * sectorCoefficient * pctCapture * (1 - difalCoverage);
  const difalRevenue = productDifalRevenue + fallbackDifalRevenue;

  const method = directCoverage <= 0 ? 'setorial_mip' : (directCoverage < 0.9999 ? 'hibrido_produtos_mip' : 'produtos');
  const methodLabel = {
    setorial_mip: 'Média setorial da MIP',
    hibrido_produtos_mip: 'Composição por produtos + fallback MIP',
    produtos: 'Composição fiscal por produtos'
  }[method];
  const difalMethod = difalCoverage <= 0 ? 'proxy_setorial_mip' : (difalCoverage < 0.9999 ? 'hibrido_produtos_mip' : 'produtos');
  const warnings = [];
  if (informedRows.some(row => row.participacaoPct > 0 && !row.validoDireto)) {
    warnings.push('Há produto com participação informada, mas sem alíquota efetiva própria; essa parcela não entrou na cobertura por produtos.');
  }
  if (directShareRaw > 100.01) warnings.push('As participações dos produtos superam 100% e foram normalizadas.');
  if (directCoverage > 0 && directCoverage < 0.9999) warnings.push('A parcela não coberta por produtos foi estimada pelo coeficiente tributário médio setorial da MIP.');
  if (directCoverage <= 0) warnings.push('O ICMS direto foi estimado integralmente pela média setorial da MIP.');
  if (difalCoverage > 0 && difalCoverage < 0.9999) warnings.push('A parcela não coberta do DIFAL/ST foi completada pela proxy setorial.');

  const detailRows = rows.filter(row => row.identificado).map(row => {
    const normalizedDirectShare = directShareRaw > 0 && row.validoDireto ? row.participacaoPct / directShareRaw : 0;
    const normalizedDifalShare = difalShareRaw > 0 && row.validoDifal ? row.participacaoPct / difalShareRaw : 0;
    const directContribution = fiscalIncrement * directCoverage * normalizedDirectShare * (row.basePct / 100) * (row.aliquotaEfetivaPct / 100);
    const difalContribution = fiscalIncrement * difalCoverage * normalizedDifalShare * (row.vendasPbPct / 100) * (row.basePct / 100) *
      Math.max(0, row.aliquotaInternaPct - row.aliquotaInterestadualPct) / 100 * pctCapture;
    return {
      ...row,
      directContribution,
      difalContribution
    };
  });

  return {
    method,
    methodLabel,
    difalMethod,
    rows: detailRows,
    warnings,
    fiscalValueWith: fiscalWith,
    fiscalValueWithout: fiscalWithout,
    fiscalIncrement,
    sectorDirectCoefficient: sectorCoefficient,
    sectorDirectIncrement,
    directShareRaw,
    directCoverage,
    productDirectCoefficient,
    productDirectIncrement,
    fallbackDirectIncrement,
    directIncrement,
    effectiveDirectCoefficient,
    equivalentMipCoefficient,
    directPotentialWith: fiscalWith * effectiveDirectCoefficient,
    directPotentialWithout: fiscalWithout * effectiveDirectCoefficient,
    difalShareRaw,
    difalCoverage,
    productDifalRate,
    productDifalRevenue,
    fallbackDifalRevenue,
    difalRevenue,
    pctCapture,
    pctMarketPbFallback
  };
}
