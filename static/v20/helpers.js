// static/v20/helpers.js — fonte canônica (extraída e desminificada da v10).
const payload = window.MIP_PB_PAYLOAD;
if (!payload) {
  throw new Error("Payload MIP-PB não carregado.");
}
const mult = payload.multiplicadores_abertos;
const medias = payload.medias;
const trad = payload.tradutor_cnae_tru || [];
const municipalities = payload.municipios || [];
const ql = payload.ql || {};
const empSectorMun = payload.emprego_setor_municipio || {};
const leontief = payload.leontief_aberta || {};
const techSector = payload.conteudo_tecnologico_setor || {};
const techNcm = payload.conteudo_tecnologico_ncm || {};
const sectorIndices = payload.indices_setoriais || {};
const regicData = payload.regic || {
  ligacoes: [],
  polo_principal: {}
};
const roadDistanceData = payload.distancias_rodoviarias_pb || {
  matriz: {}
};
const roadDistanceMatrix = roadDistanceData.matriz || {};
const pibMunicipalData = payload.pib_municipal || {
  municipios: {},
  maximos: {}
};
const pibMunicipal = pibMunicipalData.municipios || {};
const pibMunicipalMax = pibMunicipalData.maximos || {};
const comercioIntermunicipalData = payload.comercio_intermunicipal || {
  setores: {},
  totais: {}
};
const comercioSetorial = comercioIntermunicipalData.setores || {};
const calculosModulares = payload.calculos_modulares || {};
const rmJoaoPessoaCodes = new Set(['250060', '250180', '250300', '250320', '250460', '250490', '250750', '250860', '251120', '251190', '251370']);
const rmCampinaGrandeCodes = new Set(['250040', '250120', '250215', '250400', '250600', '250610', '250625', '250830', '250920', '250933', '250950', '251240', '251250', '251580']);

// populate selects de município
const munOpts = '<option value="">Selecione</option>' + municipalities.map(m => `<option value="${m.codigo}">${m.nome}</option>`).join('');
document.getElementById('municipio').innerHTML = munOpts;
document.getElementById('municipio_com').innerHTML = munOpts;

// helpers
function normCode(s) {
  s = (s || '').toString().replace(/\D/g, '');
  return s.length && s.length < 4 ? s.padStart(4, '0') : s;
}

function normNcm(s) {
  s = (s || '').toString().replace(/\D/g, '');
  return s ? s.padStart(8, '0') : '';
}

function br(x, d = 2) {
  return Number(x || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });
}

function money(x) {
  return Number(x || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

function parseMoney(id) {
  const raw = (document.getElementById(id)?.value || '').toString();
  return raw.replace(/\D/g, '') ? Number(raw.replace(/\D/g, '')) : 0;
}

function formatMoneyInput(el) {
  const d = (el.value || '').toString().replace(/\D/g, '');
  el.value = d ? Number(d).toLocaleString('pt-BR') : (el.dataset.allowBlank === 'true' ? '' : '0');
}

function numInput(id, fallback = 0) {
  const v = Number(document.getElementById(id)?.value ?? fallback);
  return Number.isFinite(v) ? v : fallback;
}

function escapeHtml(s) {
  return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function triStateLabel(value) {
  if (value === 'sim') return 'Sim';
  if (value === 'nao') return 'Não';
  return 'Não informado';
}

function switchMainTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.tab === tab));
  document.body.classList.toggle('entry-focus', tab === 'entrada');
  fecharMaisAcoes();
  fecharTopMenu();
  if (tab === 'parametros') moveParametrosToTab();
}

function fecharMaisAcoes() {
  const menu = document.getElementById('form_more_actions');
  if (menu) menu.open = false;
}

function fecharTopMenu() {
  const menu = document.getElementById('top_nav_menu');
  if (menu) menu.open = false;
}

let printReportState = null;

function finalizarImpressaoRelatorio() {
  if (!printReportState) return;
  document.body.classList.remove('print-report');
  printReportState.details.forEach(item => {
    item.element.open = item.open;
  });
  if (printReportState.previousTab) switchMainTab(printReportState.previousTab);
  printReportState = null;
}

function prepararImpressaoRelatorio() {
  finalizarImpressaoRelatorio();
  const previousTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'entrada';
  if (!avaliar()) return;
  const printableDetails = Array.from(document.querySelectorAll('#relatorio details, #relatorio_tributario details, #relatorio_fain details, #memoria_tecnica details'));
  printReportState = {
    previousTab,
    details: printableDetails.map(element => ({
      element,
      open: element.open
    }))
  };
  printableDetails.forEach(element => {
    element.open = true;
  });
  document.body.classList.add('print-report');
  switchMainTab('economico');
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

window.addEventListener('afterprint', finalizarImpressaoRelatorio);

function moveParametrosToTab() {
  const box = document.getElementById('parametros_container');
  const op = document.getElementById('secao-opcoes');
  if (box && op && op.parentElement !== box) {
    box.appendChild(op);
    op.style.display = '';
  }
}

function resetTecnicaTab() {
  const tech = document.getElementById('memoria_tecnica');
  if (tech) tech.innerHTML = '<h2>Memória técnica</h2><div class="tab-placeholder">Depois de gerar a análise, esta aba reunirá multiplicadores, pesos, setores impactados, memória fiscal, parâmetros e logs.</div>';
}

function resetTributarioTab() {
  const tax = document.getElementById('relatorio_tributario');
  if (tax) tax.innerHTML = '<h2>Impactos tributários</h2><div class="tab-placeholder">Gere o relatório para visualizar os indicadores fiscais, arrecadatórios e de renúncia.</div>';
}

function resetFainTab() {
  const fain = document.getElementById('relatorio_fain');
  if (fain) fain.innerHTML = '<h2>Checklist FAIN</h2><div class="tab-placeholder">Gere o relatório para visualizar a aderência normativa e documental ao FAIN. Este checklist não substitui parecer jurídico nem decisão do Conselho Deliberativo.</div>';
}

function resetDocumentoTab() {
  const st = document.getElementById('documento_status');
  if (st) st.textContent = 'Gere primeiro a decisão preliminar. Depois, use esta aba para produzir o texto e o documento editável.';
  const box = document.getElementById('documento_texto');
  if (box) {
    box.className = 'tab-placeholder';
    box.textContent = 'O texto explicativo aparecerá aqui. O documento deve conter títulos, tabelas, números e ressalvas padronizadas pelo painel. A IA entra apenas para redigir e interpretar os resultados.';
  }
}

function routeReportTabs() {
  const report = document.getElementById('relatorio');
  const tech = document.getElementById('memoria_tecnica');
  if (!report || !tech) return;
  const layer = report.querySelector('.technical-layer');
  tech.innerHTML = '<h2>Memória técnica</h2><p class="hint">Camada de auditoria e conferência: metodologia, parâmetros, multiplicadores, memória fiscal, pesos, logs e tabelas detalhadas.</p>';
  if (window.PainelModular) {
    tech.insertAdjacentHTML('beforeend', `
      <details class="card wide" open>
        <summary>Configuração modular do painel</summary>
        <div class="card-body">
          <p class="hint">Esta tabela registra os módulos declarados em <code>config/painel_v20.py</code>. Módulos inativos continuam auditáveis, mas não aparecem na camada decisória.</p>
          <table>
            <tr><th>ID</th><th>Indicador</th><th>Seção</th><th>Visual</th><th>Situação</th><th>Fonte de cálculo</th></tr>
            ${window.PainelModular.getAuditTableRows()}
          </table>
        </div>
      </details>`);
  }
  if (layer) tech.appendChild(layer);
  else tech.insertAdjacentHTML('beforeend', '<div class="tab-placeholder">A memória técnica ainda não foi gerada para esta análise.</div>');
  const st = document.getElementById('documento_status');
  if (st) st.textContent = 'Análise gerada. Revise impactos econômicos, impactos tributários, checklist FAIN e memória técnica; em seguida, gere o texto ou o documento editável.';
}

function setupTabsV17() {
  moveParametrosToTab();
  switchMainTab('entrada');
}

function setEntryMode(mode) {
  const manual = mode === 'manual';
  document.getElementById('entry_manual_card')?.classList.toggle('active', manual);
  document.getElementById('entry_documental_card')?.classList.toggle('active', !manual);
  const status = document.getElementById('entry_mode_status');
  if (status) {
    status.innerHTML = manual ?
      '<b>Modo manual selecionado.</b>' :
      '<b>Modo leitura documental selecionado.</b>';
  }
}

function selecionarEntradaManual() {
  setEntryMode('manual');
  const box = document.getElementById('coleta_documental');
  if (box) {
    box.open = false;
    box.hidden = true;
  }
  setWizardStep(1);
}

function selecionarEntradaDocumental() {
  setEntryMode('documental');
  switchMainTab('entrada');
  setWizardStep(1);
  abrirColetaDocumental();
  document.getElementById('wizard_nav')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function abrirColetaDocumental() {
  const box = document.getElementById('coleta_documental');
  if (box) {
    box.hidden = false;
    box.open = true;
    box.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function onDocumentoComprobatorioChange() {
  abrirColetaDocumental();
}

function fecharColetaDocumental() {
  const box = document.getElementById('coleta_documental');
  if (box) {
    box.open = false;
    box.hidden = true;
  }
}

function broadSectorFromSCN(code) {
  const c = normCode(code),
    n = Number(c);
  if (['0191', '0192', '0280'].includes(c)) return 'agro';
  if (['0581', '0791', '0792'].includes(c) || (n >= 1091 && n <= 3300) || ['3500', '3680', '4180'].includes(c)) return 'industria';
  if (['8401', '8400'].includes(c)) return 'publico';
  return 'servicos_privados';
}

function isTradableSupplierSector(code) {
  const c = normCode(code),
    n = Number(c);
  return ['0191', '0192', '0280', '0581', '0791', '0792'].includes(c) || (n >= 1091 && n <= 3300);
}

function broadSectorLabel(group) {
  return {
    agro: 'Agropecuária',
    industria: 'Indústria e construção',
    servicos_privados: 'Serviços privados, comércio e transporte',
    publico: 'Setor público'
  } [group] || 'VA municipal sem setor público';
}

function municipalEconomicMass(mun, group) {
  const rec = pibMunicipal[mun] || {};
  if (group === 'agro') return Number(rec.va_agro || 0);
  if (group === 'industria') return Number(rec.va_industria || 0);
  if (group === 'servicos_privados') return Number(rec.va_servicos_privados || 0);
  if (group === 'publico') return 0;
  return Number(rec.va_sem_publico || 0);
}

function municipalMassFactor(mun, group) {
  const key = group === 'agro' ? 'va_agro' : group === 'industria' ? 'va_industria' : group === 'servicos_privados' ? 'va_servicos_privados' : 'va_sem_publico';
  const raw = municipalEconomicMass(mun, group),
    max = Number(pibMunicipalMax[key] || 0);
  return raw > 0 && max > 0 ? Math.log1p(raw) / Math.log1p(max) : 0;
}

function locationalAssessment(mun, territorialAbsorption) {
  if (!mun) return {
    score: 0,
    level: 'Não informado',
    className: 'bad',
    zona: 'Município não informado',
    inMetro: false,
    message: 'Informe o município de instalação para avaliar a contribuição locacional do projeto.'
  };
  const inJP = rmJoaoPessoaCodes.has(mun),
    inCG = rmCampinaGrandeCodes.has(mun),
    inMetro = inJP || inCG;
  const capScore = Math.max(0, Math.min(1, Number(territorialAbsorption?.score || 0)));
  const capLevel = territorialAbsorption?.level || 'Baixa';
  const score = inMetro ? Math.min(0.35, 0.15 + capScore * 0.20) : Math.min(1, 0.55 + capScore * 0.45);
  const level = score >= 0.80 ? 'Alta' : score >= 0.50 ? 'Média' : 'Baixa';
  const className = score >= 0.80 ? 'ok' : score >= 0.50 ? 'risk-mid' : 'bad';
  const zona = inJP ? 'Região Metropolitana de João Pessoa' : inCG ? 'Região Metropolitana de Campina Grande' : 'Interior / fora dos principais polos metropolitanos';
  const message = inMetro ?
    `O município está na ${zona}. O critério locacional reconhece a capacidade do polo, mas não atribui bônus forte de desconcentração econômica.` :
    `O município está fora dos principais polos metropolitanos. A pontuação aumenta quando essa localização interiorizada vem acompanhada de capacidade territorial ${capLevel.toLowerCase()} para absorver impactos.`;
  return {
    score,
    level,
    className,
    zona,
    inMetro,
    inJP,
    inCG,
    capScore,
    capLevel,
    message
  };
}
const _indicatorHelps = {};
let _helpSeq = 0;

function concept(text, title = 'Ajuda do indicador') {
  const id = 'help_' + (++_helpSeq);
  _indicatorHelps[id] = {
    title,
    text
  };
  return `<button type="button" class="help-btn" onclick="openIndicatorHelp(event,'${id}')" aria-label="Ajuda do indicador">?</button>`;
}

function helpPopover() {
  let pop = document.getElementById('indicator_help_popover');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'indicator_help_popover';
    pop.className = 'help-popover';
    pop.hidden = true;
    pop.innerHTML = '<button type="button" onclick="closeIndicatorHelp()" aria-label="Fechar">×</button><h4></h4><p></p>';
    document.body.appendChild(pop);
  }
  return pop;
}

function openIndicatorHelp(event, id) {
  event?.stopPropagation();
  const item = _indicatorHelps[id] || {
    title: 'Ajuda do indicador',
    text: 'Sem explicação cadastrada para este indicador.'
  };
  openTextHelp(event, item.title, item.text);
}

function openTextHelp(event, title, text) {
  event?.stopPropagation();
  const pop = helpPopover();
  pop.querySelector('h4').textContent = title || 'Ajuda do indicador';
  pop.querySelector('p').textContent = text || 'Sem explicação cadastrada para este indicador.';
  pop.hidden = false;
  const rect = event?.currentTarget?.getBoundingClientRect?.() || {
    left: 20,
    bottom: 20
  };
  const width = Math.min(420, window.innerWidth - 32);
  pop.style.width = width + 'px';
  let left = Math.min(window.innerWidth - width - 16, Math.max(16, rect.left));
  let top = Math.min(window.innerHeight - 160, Math.max(16, rect.bottom + 8));
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function closeIndicatorHelp() {
  const pop = document.getElementById('indicator_help_popover');
  if (pop) pop.hidden = true;
}
document.addEventListener('click', e => {
  const pop = document.getElementById('indicator_help_popover');
  if (pop && !pop.hidden && !pop.contains(e.target) && !e.target.classList?.contains('help-btn')) closeIndicatorHelp();
});

// macrossegmento
function getTipoAnalise() {
  return document.getElementById('tipo_analise')?.value || 'nova';
}

function onTipoAnaliseChange() {
  const tipo = getTipoAnalise();
  document.getElementById('formulario')?.classList.toggle('retencao-mode', tipo === 'retencao');
  const panel = document.getElementById('panel_retencao');
  if (panel) panel.classList.toggle('active', tipo === 'retencao');
  const hint = document.getElementById('tipo_analise_hint');
  if (hint) hint.textContent = tipo === 'retencao' ?
    'Avalia a preservação de produção, empregos e tributos indiretos quando uma empresa já existente condiciona sua permanência ao benefício.' :
    'Avalia o acréscimo de produção esperado com o benefício em relação ao cenário sem benefício.';
  updateChoqueUI();
  updateWizardVisibility();
}

function getMacrossegmento() {
  return document.getElementById('macrossegmento')?.value || '';
}

function onMacrossegmentoChange() {
  const seg = getMacrossegmento();
  ['industria', 'comercio'].forEach(s => {
    document.getElementById(`panel_${s}`)?.classList.toggle('active', s === seg);
    const b = document.getElementById(`macro_badge_${s}`);
    if (b) b.style.display = s === seg ? 'block' : 'none';
  });
  const pc = document.getElementById('peso_comercio_section');
  if (pc) pc.style.display = seg === 'comercio' ? 'block' : 'none';
  updateSectorUI();
  updateChoqueUI();
  atualizarBarraEquilibrio();
  onTipoAnaliseChange();
}

function getFieldIds() {
  const seg = getMacrossegmento();
  if (seg === 'comercio') return {
    cnae: 'cnae_com',
    tru: 'tru_com',
    municipio: 'municipio_com',
    valor: 'valor_com',
    valorSem: 'valor_sem_beneficio_com',
    choque: 'choque_valor_com',
    empregos: 'empregos_com',
    salario: 'salario_com',
    renuncia: 'renuncia_pct_com',
    meta: 'meta_recuperacao_tributos_com',
    atvInfo: 'atividade_info_com'
  };
  return {
    cnae: 'cnae',
    tru: 'tru',
    municipio: 'municipio',
    valor: 'valor',
    valorSem: 'valor_sem_beneficio',
    choque: 'choque_valor',
    empregos: 'empregos',
    salario: 'salario',
    renuncia: 'renuncia_pct',
    meta: 'meta_recuperacao_tributos',
    atvInfo: 'atividade_info'
  };
}

function municipalityFromValue(value) {
  const raw = (value || '').toString().trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 6) {
    const byCode = municipalities.find(item => String(item.codigo) === digits.slice(0, 6));
    if (byCode) return byCode;
  }
  const normalized = normalizeCnpjLookupText(raw.replace(/\bpb\b/ig, '').replace(/[-/]/g, ' '));
  return municipalities.find(item => {
    const name = normalizeCnpjLookupText(item.nome);
    return name === normalized || normalized.includes(name) || name.includes(normalized);
  }) || null;
}

function resolveMunicipalitySelection(ids = getFieldIds()) {
  const candidateIds = [...new Set([ids.municipio, 'municipio', 'municipio_com'].filter(Boolean))];
  for (const id of candidateIds) {
    const el = document.getElementById(id);
    const selected = municipalityFromValue(el?.value);
    if (selected) return { codigo: selected.codigo, row: selected, fieldId: id, source: 'formulario' };
    const selectedText = el?.selectedOptions?.[0]?.textContent || '';
    const byText = municipalityFromValue(selectedText);
    if (byText) return { codigo: byText.codigo, row: byText, fieldId: id, source: 'formulario_texto' };
  }
  const profileMunicipio = getCnpjRfProfile(document.getElementById('cnpj')?.value)?.endereco?.municipio || '';
  const fromProfile = municipalityFromValue(profileMunicipio);
  if (fromProfile) return { codigo: fromProfile.codigo, row: fromProfile, fieldId: '', source: 'cadastro_rf' };
  const extractedFields = Array.isArray(window.lastExtractedFields) ? window.lastExtractedFields : [];
  for (const item of extractedFields) {
    const field = normalizeCnpjLookupText(item?.field || item?.label || '');
    if (!field.includes('municipio') && !field.includes('cidade') && !field.includes('localizacao')) continue;
    const fromExtraction = municipalityFromValue(item?.value);
    if (fromExtraction) return { codigo: fromExtraction.codigo, row: fromExtraction, fieldId: '', source: 'ia_extraida' };
  }
  return { codigo: '', row: null, fieldId: ids.municipio || '', source: 'ausente' };
}

function choqueDeclaradoAtual() {
  const seg = getMacrossegmento(),
    ids = getFieldIds();
  const valorCom = parseMoney(ids.valor),
    valorSem = parseMoney(ids.valorSem);
  const diferenca = Math.max(0, valorCom - valorSem);
  const margem = seg === 'comercio' ? numInput('com_margem', 20) / 100 : 1;
  return {
    valorCom,
    valorSem,
    diferenca,
    valorMip: diferenca * margem
  };
}

function choqueRetencaoAtual() {
  const seg = getMacrossegmento();
  const margem = seg === 'comercio' ? numInput('com_margem', 20) / 100 : 1;
  const atual = parseMoney('ret_producao_atual');
  const pleito = parseMoney('ret_producao_pleito_atendido') || atual;
  const sem = parseMoney('ret_producao_sem_acordo');
  const diferenca = Math.max(0, pleito - sem);
  return {
    atual,
    pleito,
    sem,
    diferenca,
    valorMip: diferenca * margem
  };
}

function updateChoqueUI() {
  const seg = getMacrossegmento();
  if (!seg) return;
  const ids = getFieldIds(),
    c = choqueDeclaradoAtual(),
    el = document.getElementById(ids.choque);
  if (el) el.textContent = money(c.diferenca);
  const retEl = document.getElementById('choque_retencao_valor');
  if (retEl) retEl.textContent = money(choqueRetencaoAtual().diferenca);
}

// preenchimento guiado e validação contextual
let currentWizardStep = 1;
const wizardMaxStep = 4;
const wizardStepTitles = {
  1: 'Empresa e leitura documental',
  2: 'Setor e choque',
  3: 'Qualificação',
  4: 'DIFAL/ST'
};

function setWizardStep(step) {
  currentWizardStep = Math.max(1, Math.min(wizardMaxStep, Number(step) || 1));
  updateWizardVisibility();
}

function clearWizardValidation() {
  document.querySelectorAll('.field-invalid').forEach(el => {
    el.classList.remove('field-invalid');
    el.removeAttribute('aria-invalid');
    const describedBy = (el.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(id => id && !id.startsWith('validation_error_'));
    if (describedBy.length) el.setAttribute('aria-describedby', describedBy.join(' '));
    else el.removeAttribute('aria-describedby');
  });
  document.querySelectorAll('.field-error[data-validation-error]').forEach(el => el.remove());
  const summary = document.getElementById('wizard_validation_summary');
  if (summary) {
    summary.hidden = true;
    summary.innerHTML = '';
  }
}

function clearFieldValidation(el) {
  if (!el?.id) return;
  el.classList.remove('field-invalid');
  el.removeAttribute('aria-invalid');
  document.getElementById(`validation_error_${el.id}`)?.remove();
  const describedBy = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(id => id && id !== `validation_error_${el.id}`);
  if (describedBy.length) el.setAttribute('aria-describedby', describedBy.join(' '));
  else el.removeAttribute('aria-describedby');
}

function addWizardError(errors, id, message) {
  errors.push({
    id,
    message
  });
}

function markWizardError(error) {
  const el = document.getElementById(error.id);
  if (!el) return;
  const errorId = `validation_error_${error.id}`;
  el.classList.add('field-invalid');
  el.setAttribute('aria-invalid', 'true');
  const describedBy = new Set((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(errorId);
  el.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
  if (!document.getElementById(errorId)) {
    const note = document.createElement('div');
    note.id = errorId;
    note.className = 'field-error';
    note.dataset.validationError = 'true';
    note.textContent = error.message;
    el.insertAdjacentElement('afterend', note);
  }
}

function showWizardErrors(step, errors) {
  errors.forEach(markWizardError);
  const summary = document.getElementById('wizard_validation_summary');
  if (summary) {
    summary.hidden = false;
    summary.innerHTML = `<b>Revise a etapa ${step} antes de continuar.</b><ul>${errors.map(error => `<li>${escapeHtml(error.message)}</li>`).join('')}</ul>`;
  }
  const first = document.getElementById(errors[0]?.id);
  const details = first?.closest('details');
  if (details) details.open = true;
  first?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  if (typeof first?.focus === 'function') first.focus({
    preventScroll: true
  });
}

function rawValue(id) {
  return (document.getElementById(id)?.value || '').toString().trim();
}

function validateWizardStep(step, options = {}) {
  const show = options.show !== false;
  const clear = options.clear !== false;
  if (clear) clearWizardValidation();
  const errors = [];
  const tipo = getTipoAnalise();

  if (step === 1) {
    const cnpj = rawValue('cnpj');
    if (!cnpj) addWizardError(errors, 'cnpj', 'Informe o CNPJ da empresa.');
    else if (!validarCNPJ(cnpj)) addWizardError(errors, 'cnpj', 'Informe um CNPJ válido.');
    if (!rawValue('protocolo')) addWizardError(errors, 'protocolo', 'Informe o número do protocolo.');
    if (!rawValue('razao_social')) addWizardError(errors, 'razao_social', 'Informe a razão social.');
  }

  if (step === 2) {
    const seg = getMacrossegmento();
    if (!seg) {
      addWizardError(errors, 'macrossegmento', 'Selecione o macrossegmento.');
    } else {
      const ids = getFieldIds();
      const cnae = rawValue(ids.cnae);
      const tru = rawValue(ids.tru);
      if (!cnae && !tru) addWizardError(errors, ids.cnae, 'Informe o CNAE ou o código TRU/SCN.');
      else if (!findSector().row) addWizardError(errors, ids.cnae, 'O CNAE ou TRU/SCN informado não foi localizado.');
      if (!rawValue(ids.municipio)) addWizardError(errors, ids.municipio, 'Selecione o município de instalação.');
      if (seg === 'industria') {
        const ncms = getNcmValues();
        if (!ncms.length) addWizardError(errors, 'ncm_list', 'Informe ao menos um NCM dos produtos.');
        else if (!ncmInfo().rows.length) addWizardError(errors, 'ncm_list', 'Informe um NCM localizado na base de referência.');
      }
      if (seg === 'comercio') {
        const margem = Number(rawValue('com_margem'));
        if (!Number.isFinite(margem) || margem <= 0 || margem > 100) addWizardError(errors, 'com_margem', 'Informe uma margem comercial entre 0 e 100%.');
        if (!rawValue('com_origem_produtos')) addWizardError(errors, 'com_origem_produtos', 'Informe a origem principal dos produtos vendidos.');
        if (!rawValue('com_destino_vendas')) addWizardError(errors, 'com_destino_vendas', 'Informe o principal destino das vendas.');
      }

      if (tipo === 'retencao') {
        if (parseMoney('ret_producao_atual') <= 0) addWizardError(errors, 'ret_producao_atual', 'Informe a produção ou o faturamento atual.');
        if (parseMoney('ret_producao_pleito_atendido') <= 0) addWizardError(errors, 'ret_producao_pleito_atendido', 'Informe o valor esperado com o pleito atendido.');
        if (!rawValue('ret_producao_sem_acordo')) addWizardError(errors, 'ret_producao_sem_acordo', 'Informe explicitamente o cenário sem acordo, inclusive quando for zero.');
        else if (parseMoney('ret_producao_pleito_atendido') <= parseMoney('ret_producao_sem_acordo')) addWizardError(errors, 'ret_producao_pleito_atendido', 'O valor com o pleito atendido deve ser maior que o valor sem acordo.');
        if (Number(rawValue('ret_empregos_atuais')) <= 0) addWizardError(errors, 'ret_empregos_atuais', 'Informe os empregos diretos atuais.');
        if (!rawValue('ret_empregos_pleito')) addWizardError(errors, 'ret_empregos_pleito', 'Informe os empregos com o pleito atendido.');
        else if (Number(rawValue('ret_empregos_pleito')) < 0) addWizardError(errors, 'ret_empregos_pleito', 'Os empregos com o pleito atendido não podem ser negativos.');
        if (!rawValue('ret_empregos_sem_acordo')) addWizardError(errors, 'ret_empregos_sem_acordo', 'Informe os empregos sem acordo, inclusive quando for zero.');
        else if (Number(rawValue('ret_empregos_sem_acordo')) < 0) addWizardError(errors, 'ret_empregos_sem_acordo', 'Os empregos sem acordo não podem ser negativos.');
        else if (rawValue('ret_empregos_pleito') && Number(rawValue('ret_empregos_pleito')) < Number(rawValue('ret_empregos_sem_acordo'))) addWizardError(errors, 'ret_empregos_pleito', 'Os empregos com o pleito atendido não podem ser menores que os empregos sem acordo.');
        if (rawValue('ret_evidencia_saida').length < 40) addWizardError(errors, 'ret_evidencia_saida', 'Descreva a evidência do risco de saída ou redução com ao menos 40 caracteres.');
        const beneficioAtual = Number(rawValue('ret_beneficio_atual_pct'));
        const probSaida = Number(rawValue('ret_prob_saida_pct'));
        if (!Number.isFinite(beneficioAtual) || beneficioAtual < 0 || beneficioAtual > 100) addWizardError(errors, 'ret_beneficio_atual_pct', 'O benefício atual deve ficar entre 0 e 100%.');
        if (!Number.isFinite(probSaida) || probSaida < 0 || probSaida > 100) addWizardError(errors, 'ret_prob_saida_pct', 'A probabilidade de saída ou redução deve ficar entre 0 e 100%.');
      } else {
        if (!rawValue(ids.valorSem)) addWizardError(errors, ids.valorSem, 'Informe explicitamente o valor sem benefício, inclusive quando for zero.');
        const valorCom = parseMoney(ids.valor);
        const valorSem = parseMoney(ids.valorSem);
        if (valorCom <= 0) addWizardError(errors, ids.valor, 'Informe um valor econômico com benefício maior que zero.');
        else if (valorCom <= valorSem) addWizardError(errors, ids.valor, 'O valor com benefício deve ser maior que o valor sem benefício.');
        if (Number(rawValue(ids.empregos)) <= 0) addWizardError(errors, ids.empregos, 'Informe os empregos diretos previstos.');
      }
      if (parseMoney(ids.salario) <= 0) addWizardError(errors, ids.salario, 'Informe o salário médio mensal.');
      const renuncia = Number(rawValue(tipo === 'retencao' ? 'ret_beneficio_pleiteado_pct' : ids.renuncia));
      const meta = Number(rawValue(tipo === 'retencao' ? 'ret_meta_recuperacao_tributos' : ids.meta));
      if (!Number.isFinite(renuncia) || renuncia < 0 || renuncia > 100) addWizardError(errors, tipo === 'retencao' ? 'ret_beneficio_pleiteado_pct' : ids.renuncia, 'A renúncia pleiteada deve ficar entre 0 e 100%.');
      if (!Number.isFinite(meta) || meta < 0 || meta > 100) addWizardError(errors, tipo === 'retencao' ? 'ret_meta_recuperacao_tributos' : ids.meta, 'A meta de recuperação tributária deve ficar entre 0 e 100%.');
    }
  }

  if (step === 3) {
    const local = rawValue('local');
    if (!local) addWizardError(errors, 'local', 'Informe a parcela de insumos produzida localmente, inclusive quando for zero.');
    else if (Number(local) < 0 || Number(local) > 100) addWizardError(errors, 'local', 'A parcela de insumos locais deve ficar entre 0 e 100%.');
    if (!rawValue('produtos')) addWizardError(errors, 'produtos', 'Descreva os produtos produzidos ou comercializados.');
    if (!rawValue('destino')) addWizardError(errors, 'destino', 'Selecione o destino da produção.');
    [
      ['substitui', 'Informe se o produto substitui importações.'],
      ['novo_produto', 'Informe se o produto é novo ou pouco produzido no estado.'],
      ['estrategico', 'Informe se o setor é estratégico para a política estadual.']
    ].forEach(([id, message]) => {
      if (rawValue(id) === 'nao_informado') addWizardError(errors, id, message);
    });
    if (tipo !== 'retencao' && rawValue('adicionalidade') === 'nao_informado') {
      addWizardError(errors, 'adicionalidade', 'Informe se o projeto ocorreria na Paraíba sem o benefício.');
    }
    if (Number(rawValue('permanencia_anos')) <= 0) addWizardError(errors, 'permanencia_anos', 'Informe o tempo previsto do projeto na Paraíba.');
    const ativos = rawValue('ativos_recuperaveis_pct');
    if (!ativos) addWizardError(errors, 'ativos_recuperaveis_pct', 'Informe a parcela de ativos fixos recuperáveis, inclusive quando for zero.');
    else if (Number(ativos) < 0 || Number(ativos) > 100) addWizardError(errors, 'ativos_recuperaveis_pct', 'A parcela de ativos recuperáveis deve ficar entre 0 e 100%.');
    const setor = findSector().row;
    if (getMacrossegmento() === 'industria' && setor && !ncmAdherence(setor.codigo).ok) {
      addWizardError(errors, 'produtos', ncmAdherence(setor.codigo).message);
    }
  }

  if (step === 4) {
    [
      ['ext_pct_vendas_pb', 'A parcela do mercado da PB abastecida de fora deve ficar entre 0 e 100%.'],
      ['ext_pct_captura_entrada', 'A receita capturada via DIFAL/ST/entrada deve ficar entre 0 e 100%.'],
      ['ext_prob_abastecimento_externo', 'A probabilidade de abastecimento externo deve ficar entre 0 e 100%.']
    ].forEach(([id, message]) => {
      const value = Number(rawValue(id));
      if (!Number.isFinite(value) || value < 0 || value > 100) addWizardError(errors, id, message);
    });
  }

  if (show && errors.length) showWizardErrors(step, errors);
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateAllWizardSteps() {
  clearWizardValidation();
  for (let step = 1; step <= wizardMaxStep; step++) {
    const result = validateWizardStep(step, {
      show: false,
      clear: false
    });
    if (!result.valid) {
      setWizardStep(step);
      showWizardErrors(step, result.errors);
      switchMainTab('entrada');
      return false;
    }
  }
  return true;
}

function goToWizardStep(step) {
  const target = Math.max(1, Math.min(wizardMaxStep, Number(step) || 1));
  clearWizardValidation();
  setWizardStep(target);
  document.getElementById('wizard_nav')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
  return true;
}

function updateWizardVisibility() {
  document.querySelectorAll('.wizard-panel').forEach(panel => {
    const sameStep = Number(panel.dataset.step) === currentWizardStep;
    const isRetention = panel.id === 'panel_retencao';
    const show = sameStep && (!isRetention || getTipoAnalise() === 'retencao');
    panel.classList.toggle('active', show);
  });
  const prev = document.getElementById('wizard_prev'),
    next = document.getElementById('wizard_next'),
    hint = document.getElementById('wizard_hint'),
    eyebrow = document.getElementById('wizard_eyebrow'),
    title = document.getElementById('wizard_title'),
    track = document.getElementById('wizard_progress_track'),
    bar = document.getElementById('wizard_progress_bar');
  const stepLabel = `Etapa ${currentWizardStep} de ${wizardMaxStep}`;
  const isFinalStep = currentWizardStep === wizardMaxStep;
  if (prev) prev.disabled = currentWizardStep === 1;
  if (next) next.textContent = isFinalStep ? 'Gerar relatório' : 'Continuar';
  if (hint) hint.textContent = stepLabel;
  if (eyebrow) eyebrow.textContent = stepLabel;
  if (title) title.textContent = wizardStepTitles[currentWizardStep];
  if (track) track.setAttribute('aria-valuenow', String(currentWizardStep));
  if (bar) bar.style.width = `${currentWizardStep / wizardMaxStep * 100}%`;
}

function nextWizardStep() {
  if (currentWizardStep === wizardMaxStep) {
    avaliar();
    return;
  }
  goToWizardStep(currentWizardStep + 1);
}

function prevWizardStep() {
  clearWizardValidation();
  setWizardStep(currentWizardStep - 1);
  document.getElementById('wizard_nav')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// NCM dinâmico
let ncmCount = 0;

function adicionarNCM(valor = '') {
  ncmCount++;
  const id = `ncm_item_${ncmCount}`,
    div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'display:flex;gap:6px;align-items:center';
  div.innerHTML = `<input type="text" class="ncm-input" placeholder="Ex.: 22021000" style="flex:1" oninput="onNcmChange()"/><button type="button" class="light" onclick="removerNCM('${id}')" style="padding:5px 10px;margin:0;font-size:13px;flex-shrink:0">✕</button>`;
  div.querySelector('input').value = valor;
  document.getElementById('ncm_list')?.appendChild(div);
  onNcmChange();
}

function removerNCM(id) {
  document.getElementById(id)?.remove();
  onNcmChange();
}

function getNcmValues() {
  return Array.from(document.querySelectorAll('.ncm-input')).map(el => normNcm(el.value.trim())).filter(Boolean);
}

function ncmInfo() {
  const raw = getNcmValues(),
    rows = raw.map(n => techNcm[n]).filter(Boolean);
  return {
    raw,
    rows,
    avgScore: rows.length ? rows.reduce((s, r) => s + Number(r.score || 0), 0) / rows.length : null
  };
}

function onNcmChange() {
  const h = document.getElementById('ncm_hint');
  if (h) h.textContent = getNcmValues().length ? `${getNcmValues().length} NCM(s) informado(s).` : 'Informe ao menos um NCM para atividades industriais.';
}

// CNPJ
let cnpjConsultaTimer = null;
let cnpjConsultaEmAndamento = '';
let cnpjConsultaRequest = 0;
window.cnpjRfProfile = null;

function limparPerfilCnpj() {
  window.cnpjRfProfile = null;
  const box = document.getElementById('cnpj_company_profile');
  if (box) {
    box.hidden = true;
    box.innerHTML = '';
  }
}

function preencherDadosTeste() {
  const cnpj = document.getElementById('cnpj');
  const razaoSocial = document.getElementById('razao_social');
  const status = document.getElementById('cnpj_status');
  clearTimeout(cnpjConsultaTimer);
  cnpjConsultaRequest += 1;
  limparPerfilCnpj();
  if (cnpj) {
    cnpj.value = '98.765.432/0001-98';
    clearFieldValidation(cnpj);
  }
  if (razaoSocial) {
    razaoSocial.value = 'Empresa Teste';
    clearFieldValidation(razaoSocial);
  }
  if (status) {
    status.textContent = 'Dados fictícios preenchidos para teste. Substitua-os antes de usar o formulário em um processo real.';
    status.className = 'hint';
  }
  document.getElementById('protocolo')?.focus();
}

function normalizeCnpjLookupText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function formatCnpjRfDate(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 8) return 'Não informada';
  const date = digits.slice(0, 8);
  return `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)}`;
}

function formatCnpjRfCep(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : (value || 'Não informado');
}

function cnpjRfAddress(profile) {
  const e = profile?.endereco || {};
  const street = [e.tipo_logradouro, e.logradouro].filter(Boolean).join(' ');
  const firstLine = [street, e.numero, e.complemento].filter(Boolean).join(', ');
  const secondLine = [e.bairro, e.municipio, e.uf].filter(Boolean).join(' — ');
  return [firstLine, secondLine, e.cep ? `CEP ${formatCnpjRfCep(e.cep)}` : ''].filter(Boolean).join(' · ') || 'Não informado';
}

function renderCnpjRfProfileHtml(profile, title = 'Cadastro da Receita Federal') {
  if (!profile) return '';
  const active = normalizeCnpjLookupText(profile.situacao_cadastral) === 'ativa';
  const mainActivity = profile.cnae_principal || {};
  const secondary = Array.isArray(profile.atividades_secundarias) ? profile.atividades_secundarias : [];
  const secondaryHtml = secondary.length ? `
    <details class="cnpj-secondary-activities">
      <summary>Atividades secundárias (${Number(profile.total_atividades_secundarias || secondary.length)})</summary>
      <ul>${secondary.map(item => `<li><b>${escapeHtml(item.codigo || '-')}</b> — ${escapeHtml(item.descricao || 'Descrição não informada')}</li>`).join('')}</ul>
    </details>` : '';
  const reason = profile.motivo_situacao_cadastral ? `<span>Motivo: ${escapeHtml(profile.motivo_situacao_cadastral)}</span>` : '';
  return `<div class="cnpj-profile-card">
    <div class="cnpj-profile-head">
      <div><span class="cnpj-profile-kicker">${escapeHtml(title)}</span><strong>${escapeHtml(profile.razao_social || 'Razão social não informada')}</strong></div>
      <span class="cnpj-status-badge ${active ? 'active' : 'inactive'}">${escapeHtml(profile.situacao_cadastral || 'Situação não informada')}</span>
    </div>
    <div class="cnpj-profile-grid">
      <div><b>Estabelecimento</b><span>${escapeHtml(profile.matriz_filial || 'Não informado')} · início em ${formatCnpjRfDate(profile.data_inicio_atividade)}</span></div>
      <div><b>Porte e natureza jurídica</b><span>${escapeHtml(profile.porte || 'Não informado')} · ${escapeHtml(profile.natureza_juridica || 'Não informada')}</span></div>
      <div><b>Capital social</b><span>${money(Number(profile.capital_social || 0))}</span></div>
      <div><b>Localização cadastral</b><span>${escapeHtml(cnpjRfAddress(profile))}</span></div>
      <div class="wide"><b>CNAE principal</b><span>${escapeHtml(mainActivity.codigo || '-')} — ${escapeHtml(mainActivity.descricao || 'Descrição não informada')}</span></div>
      <div><b>Simples Nacional</b><span>${escapeHtml(profile.simples_nacional || 'Não informado')}</span></div>
      <div><b>MEI</b><span>${escapeHtml(profile.mei || 'Não informado')}</span></div>
    </div>
    ${reason}
    ${secondaryHtml}
    <p class="cnpj-source-note">Fonte: Receita Federal do Brasil, Dados Abertos do CNPJ, competência ${escapeHtml(profile.competencia || 'não informada')}. Consulta feita no índice local em ${escapeHtml(profile.consultado_em || '-')}. Dados cadastrais não substituem certidões, diligência fiscal ou comprovação documental.</p>
  </div>`;
}

function getCnpjRfProfile(cnpj) {
  const digits = String(cnpj || '').replace(/\D/g, '');
  return window.cnpjRfProfile?.cnpj === digits ? window.cnpjRfProfile : null;
}

function applyCnpjRfProfile(profile) {
  const razaoSocial = document.getElementById('razao_social');
  const nomeFantasia = document.getElementById('nome_fantasia');
  if (razaoSocial && profile.razao_social) {
    razaoSocial.value = profile.razao_social;
    clearFieldValidation(razaoSocial);
  }
  if (nomeFantasia && profile.nome_fantasia) nomeFantasia.value = profile.nome_fantasia;

  const porte = document.getElementById('porte_empresa');
  const porteMap = { '01': 'micro', '03': 'pequena' };
  if (porte && porteMap[profile.porte_codigo]) porte.value = porteMap[profile.porte_codigo];
  const ufOrigem = document.getElementById('uf_origem');
  if (ufOrigem && profile.endereco?.uf === 'PB') ufOrigem.value = 'PB';

  const cnae = String(profile.cnae_principal?.codigo || '').replace(/\D/g, '');
  ['cnae', 'cnae_com'].forEach(id => {
    const input = document.getElementById(id);
    if (input && cnae && !input.value.trim()) input.value = cnae;
  });
  const municipalityName = normalizeCnpjLookupText(profile.endereco?.municipio);
  const municipality = municipalities.find(item => normalizeCnpjLookupText(item.nome) === municipalityName);
  if (municipality) {
    ['municipio', 'municipio_com'].forEach(id => {
      const select = document.getElementById(id);
      if (select && !select.value) select.value = municipality.codigo;
    });
  }
  updateSectorUI();
}

function agendarConsultaCNPJ(el) {
  clearTimeout(cnpjConsultaTimer);
  const digits = String(el?.value || '').replace(/\D/g, '');
  if (window.cnpjRfProfile && window.cnpjRfProfile.cnpj !== digits) limparPerfilCnpj();
  const status = document.getElementById('cnpj_status');
  if (digits.length !== 14) {
    if (status) {
      status.textContent = digits.length ? 'Complete os 14 dígitos para consultar a base local da Receita Federal.' : '';
      status.className = 'hint';
    }
    return;
  }
  if (!validarCNPJ(digits)) {
    if (status) {
      status.textContent = 'CNPJ inválido.';
      status.className = 'hint cnpj-bad';
    }
    return;
  }
  if (status) {
    status.textContent = 'CNPJ válido. Consultando a base local da Receita Federal...';
    status.className = 'hint';
  }
  cnpjConsultaTimer = window.setTimeout(() => consultarCNPJ(), 700);
}

function formatarCNPJ(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 14);
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d+)/, '$1.$2');
  el.value = v;
}

function validarCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '');
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;
  const calc = len => {
    let s = 0,
      p = len - 7;
    for (let i = 0; i < len; i++) {
      s += parseInt(n[i]) * p--;
      if (p < 2) p = 9;
    }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(n[12]) && calc(13) === parseInt(n[13]);
}
async function consultarCNPJ() {
  const cnpj = document.getElementById('cnpj')?.value.replace(/\D/g, ''),
    status = document.getElementById('cnpj_status');
  if (cnpj.length !== 14) return;
  if (!validarCNPJ(cnpj)) {
    status.textContent = 'CNPJ inválido.';
    status.className = 'hint cnpj-bad';
    return;
  }
  if (getCnpjRfProfile(cnpj) || cnpjConsultaEmAndamento === cnpj) return;
  const requestId = ++cnpjConsultaRequest;
  cnpjConsultaEmAndamento = cnpj;
  status.textContent = 'Consultando a base local da Receita Federal...';
  status.className = 'hint';
  try {
    const base = typeof iaBaseUrl === 'function' ? iaBaseUrl() : 'http://127.0.0.1:8771';
    const response = await fetch(`${base}/consulta_cnpj/${cnpj}`, {
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      const error = new Error(payload.error || 'CNPJ não localizado na base local da Receita Federal.');
      error.status = response.status;
      throw error;
    }
    if (requestId !== cnpjConsultaRequest || document.getElementById('cnpj')?.value.replace(/\D/g, '') !== cnpj) return;
    const profile = {
      ...(payload.empresa || {}),
      fonte: payload.fonte || 'Receita Federal do Brasil — Dados Abertos do CNPJ',
      competencia: payload.competencia || '',
      consultado_em: new Date().toLocaleString('pt-BR')
    };
    window.cnpjRfProfile = profile;
    applyCnpjRfProfile(profile);
    const box = document.getElementById('cnpj_company_profile');
    if (box) {
      box.innerHTML = renderCnpjRfProfileHtml(profile);
      box.hidden = false;
    }
    status.textContent = `CNPJ localizado na base da Receita Federal — competência ${profile.competencia || 'não informada'}.`;
    status.className = normalizeCnpjLookupText(profile.situacao_cadastral) === 'ativa' ? 'hint cnpj-ok' : 'hint cnpj-bad';
  } catch (e) {
    if (requestId !== cnpjConsultaRequest) return;
    limparPerfilCnpj();
    if (e.status === 503) status.textContent = 'Base local da Receita Federal ainda não instalada. Execute preparar_base_cnpj_rf.py e mantenha o serviço local ativo.';
    else if (e.status === 404) status.textContent = 'CNPJ válido, mas não localizado no recorte PB da base da Receita Federal.';
    else status.textContent = 'Serviço local indisponível. Inicie o serviço para consultar a base da Receita Federal.';
    status.className = 'hint cnpj-bad';
  } finally {
    if (cnpjConsultaEmAndamento === cnpj) cnpjConsultaEmAndamento = '';
  }
}

// sector
function findSector() {
  const ids = getFieldIds();
  let tru = normCode(document.getElementById(ids.tru)?.value || '');
  const cnae = normCode(document.getElementById(ids.cnae)?.value || '');
  let msg = '';
  if (cnae) {
    const hit = trad.find(r => normCode(r.cnae) === cnae) || trad.find(r => normCode(r.cnae).slice(0, 4) === cnae.slice(0, 4));
    if (hit) {
      tru = normCode(hit.codigo_tru);
      msg = `CNAE ${cnae} → TRU/SCN ${tru}: ${hit.setor_tru}.`;
    } else msg = `CNAE ${cnae} não localizado no tradutor.`;
  }
  const row = mult.find(r => normCode(r.codigo) === tru);
  return {
    row,
    tru,
    cnae,
    msg
  };
}

function sectorGroup(code) {
  const c = normCode(code),
    n = Number(c);
  if (['0191', '0192', '0280'].includes(c)) return {
    kind: 'goods',
    label: 'Agropecuária'
  };
  if (['0581', '0791', '0792'].includes(c)) return {
    kind: 'goods',
    label: 'Indústria Extrativa'
  };
  if (n >= 1091 && n <= 3300) return {
    kind: 'goods',
    label: 'Indústria de Transformação'
  };
  if (['4500', '4680'].includes(c)) return {
    kind: 'margin',
    label: 'Comércio'
  };
  if (['4901', '5280'].includes(c)) return {
    kind: 'margin',
    label: 'Transporte/Distribuição'
  };
  return {
    kind: 'margin',
    label: 'Serviços'
  };
}

function updateSectorUI() {
  const ids = getFieldIds(),
    found = findSector();
  const group = found.row ? sectorGroup(found.row.codigo) : {
    kind: 'goods',
    label: 'Não identificado'
  };
  const atvEl = document.getElementById(ids.atvInfo);
  if (atvEl) atvEl.textContent = found.row ? `${group.label}: ${found.row.codigo} — ${found.row.setor}` : 'Informe CNAE ou TRU/SCN.';
  return {
    found,
    group
  };
}

function tokens(s) {
  const stop = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'para', 'por', 'em', 'com', 'sem', 'ou', 'um', 'uma', 'no', 'na', 'nos', 'nas', 'outros', 'outras', 'produto', 'produtos']);
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 4 && !stop.has(t));
}

function ncmAdherence(code) {
  const group = sectorGroup(code);
  if (group.kind !== 'goods') return {
    required: false,
    ok: true,
    message: 'NCM não exigido para esta atividade.'
  };
  const info = ncmInfo();
  if (!info.raw.length) return {
    required: false,
    ok: true,
    message: 'NCM não informado. Classificação agregada do setor.'
  };
  if (!info.rows.length) return {
    required: true,
    ok: false,
    message: 'NCM informado não localizado no tradutor.'
  };
  const descTokens = new Set(tokens(document.getElementById('produtos')?.value || ''));
  const sectorMatch = info.rows.some(r => normCode(r.codigo_setor) === normCode(code));
  const textMatch = info.rows.some(r => tokens((r.descricao || '') + ' ' + (r.nome_conteudo || '')).some(t => descTokens.has(t)));
  const ok = sectorMatch || textMatch;
  return {
    required: true,
    ok,
    message: ok ? 'Aderência NCM-produto atendida.' : 'NCM não aderente à descrição do produto nem ao setor identificado.'
  };
}

function sectorEmploymentPB(code) {
  return Object.values(empSectorMun[normCode(code)] || {}).reduce((a, v) => a + Number(v || 0), 0);
}

function sectorEmploymentMun(code, mun) {
  return Number((empSectorMun[normCode(code)] || {})[mun] || 0);
}

function robustSpecialization(code, mun) {
  if (!mun) return {
    ok: false,
    ql: 0,
    emp: 0
  };
  const qlValue = Number((ql[normCode(code)] || {})[mun] || 0),
    emp = sectorEmploymentMun(code, mun);
  const pb = sectorEmploymentPB(code),
    minJobs = Math.max(5, Math.min(30, Math.ceil(pb * 0.005)));
  return {
    ok: qlValue > 1 && emp >= minJobs,
    ql: qlValue,
    emp,
    minJobs
  };
}

function specializedSectors(mun, impactSectors = []) {
  if (!mun) return [];
  const impactCodes = new Set(impactSectors.map(s => normCode(s.codigo))),
    rows = [];
  for (const [code, vals] of Object.entries(ql)) {
    const spec = robustSpecialization(code, mun);
    if (spec.ok) {
      const sector = (mult.find(r => normCode(r.codigo) === normCode(code)) || {}).setor || code;
      rows.push({
        codigo: normCode(code),
        setor: sector,
        ql: spec.ql,
        emprego: spec.emp,
        impacted: impactCodes.has(normCode(code))
      });
    }
  }
  return rows.sort((a, b) => Number(b.impacted) - Number(a.impacted) || b.emprego - a.emprego || b.ql - a.ql);
}

function concentrationSectors(code, valueBRL, targetShare = 0.5) {
  const col = [];
  for (const [rowCode, vals] of Object.entries(leontief)) {
    const dp = normCode(rowCode) === normCode(code) ? 1 : 0,
      v = Math.max(0, Number(vals[code] || 0) - dp);
    col.push({
      codigo: rowCode,
      setor: (mult.find(r => normCode(r.codigo) === rowCode) || {}).setor || rowCode,
      coef: v,
      impacto: v * valueBRL
    });
  }
  const ordered = col.filter(s => s.coef > 0).sort((a, b) => b.coef - a.coef),
    total = ordered.reduce((acc, s) => acc + s.coef, 0);
  let cum = 0;
  const sel = [];
  for (const s of ordered) {
    cum += s.coef;
    sel.push({
      ...s,
      participacao: total ? s.coef / total : 0,
      participacao_acumulada: total ? cum / total : 0
    });
    if (total && cum / total >= targetShare) break;
  }
  return sel;
}

function allIndirectSectors(code, valueBRL) {
  const col = [];
  for (const [rowCode, vals] of Object.entries(leontief)) {
    const dp = normCode(rowCode) === normCode(code) ? 1 : 0,
      v = Math.max(0, Number(vals[code] || 0) - dp);
    if (v > 0) col.push({
      codigo: rowCode,
      setor: (mult.find(r => normCode(r.codigo) === rowCode) || {}).setor || rowCode,
      coef: v,
      impacto: v * valueBRL
    });
  }
  return col.sort((a, b) => b.impacto - a.impacto);
}

function selectImpactSectorsByShare(sectors, targetShare = 0.5) {
  const ordered = [...(sectors || [])].filter(s => Number(s.coef || 0) > 0).sort((a, b) => Number(b.coef || 0) - Number(a.coef || 0));
  const total = ordered.reduce((acc, s) => acc + Number(s.coef || 0), 0);
  let cum = 0;
  const sel = [];
  for (const s of ordered) {
    cum += Number(s.coef || 0);
    sel.push({
      ...s,
      participacao: total ? Number(s.coef || 0) / total : 0,
      participacao_acumulada: total ? cum / total : 0
    });
    if (total && cum / total >= targetShare) break;
  }
  return sel;
}

function impactMunicipalCoverage(impactSectors) {
  if (!impactSectors.length || !municipalities.length) return {
    count: 0,
    share: 0
  };
  let count = 0;
  for (const m of municipalities) {
    if (impactSectors.some(s => robustSpecialization(s.codigo, m.codigo).ok)) count++;
  }
  return {
    count,
    share: count / municipalities.length
  };
}

function npv(rate, flows) {
  return flows.reduce((acc, v, i) => acc + v / Math.pow(1 + rate, i), 0);
}

function irr(flows) {
  const hp = flows.some(v => v > 0),
    hn = flows.some(v => v < 0);
  if (!hp || !hn) return null;
  let lo = -0.99,
    hi = 2,
    flo = npv(lo, flows),
    fhi = npv(hi, flows);
  for (let i = 0; i < 40 && flo * fhi > 0; i++) {
    hi *= 2;
    fhi = npv(hi, flows);
    if (hi > 1000) return null;
  }
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2,
      fm = npv(mid, flows);
    if (Math.abs(fm) < 1e-7) return mid;
    if (flo * fm <= 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}
