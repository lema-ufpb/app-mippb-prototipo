// static/v20/mapa_ia.js
// Modulo responsavel apenas pela leitura documental e pela redacao assistida por IA.

function iaBaseUrl() {
  return (document.getElementById('ia_service_url')?.value || 'http://127.0.0.1:8771').replace(/\/$/, '');
}

function setIaStatus(msg, cls = '') {
  const el = document.getElementById('ia_status');
  if (el) {
    el.textContent = msg;
    el.className = 'ai-status' + (cls ? ' ' + cls : '');
  }
}

function setIaStatusHtml(html, cls = '') {
  const el = document.getElementById('ia_status');
  if (el) {
    el.innerHTML = html;
    el.className = 'ai-status' + (cls ? ' ' + cls : '');
  }
}

function setDocumentoStatus(msg, cls = '') {
  const doc = document.getElementById('documento_status');
  if (doc) {
    doc.textContent = msg;
    doc.className = 'ai-status' + (cls ? ' ' + cls : '');
  }
}

function setDocumentoStatusHtml(html, cls = '') {
  const doc = document.getElementById('documento_status');
  if (doc) {
    doc.innerHTML = html;
    doc.className = 'ai-status' + (cls ? ' ' + cls : '');
  }
}

function fileUrlFromPath(path) {
  if (!path) return '';
  const normalized = String(path).split('/').map(part => encodeURIComponent(part)).join('/');
  return normalized.startsWith('/') ? 'file://' + normalized : 'file:///' + normalized;
}

function iaConnectionErrorMessage(err) {
  const url = iaBaseUrl();
  return `Não foi possível conectar ao serviço local de IA em ${url}. Abra um Terminal na pasta do projeto e execute ./iniciar_servico_ia.command. Se quiser usar Llama/Ollama, execute ./iniciar_servico_ia_llama.command com o Ollama aberto. Detalhe técnico: ${err?.message||err||'falha de conexão'}.`;
}

function normalizeIaFields(fields) {
  if (Array.isArray(fields)) return fields;
  if (fields && typeof fields === 'object') {
    return Object.entries(fields).map(([field, item]) => ({
      field,
      label: item?.label || field,
      value: item?.value ?? '',
      confidence: item?.confidence ?? '',
      evidence: item?.evidence || '',
      note: item?.note || ''
    }));
  }
  return [];
}

function lockFieldFromIA(el, field) {
  if (!el) return;
  el.disabled = true;
  el.classList.add('ia-locked');
  el.dataset.iaLocked = 'true';
  el.dataset.iaField = field || '';
  el.title = 'Campo preenchido por leitura documental e bloqueado para edição manual.';
  const noteId = `ia_lock_note_${el.id}`;
  if (el.id && !document.getElementById(noteId)) {
    const note = document.createElement('span');
    note.id = noteId;
    note.className = 'ia-lock-note';
    note.textContent = 'Preenchido por leitura documental. Edição manual bloqueada.';
    el.insertAdjacentElement('afterend', note);
  }
}

function unlockIaFields() {
  document.querySelectorAll('[data-ia-locked="true"]').forEach(el => {
    el.disabled = false;
    el.classList.remove('ia-locked');
    delete el.dataset.iaLocked;
    delete el.dataset.iaField;
    el.removeAttribute('title');
  });
  document.querySelectorAll('.ia-lock-note').forEach(note => note.remove());
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function extrairContratoIA() {
  const file = document.getElementById('contrato_file')?.files?.[0];
  if (!file) {
    setIaStatus('Selecione um arquivo antes de continuar.', 'bad');
    return;
  }
  setIaStatus('Lendo documento...');
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const b64 = arrayBufferToBase64(e.target.result);
      const resp = await fetch(iaBaseUrl() + '/extrair_contrato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          content_base64: b64
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data.ok) {
        setIaStatus('Erro na extração: ' + (data.error || 'desconhecido'), 'bad');
        return;
      }
      setIaStatus('Extração concluída.');
      const normalizedFields = normalizeIaFields(data.fields);
      const result = document.getElementById('ia_result');
      if (result) result.innerHTML = `<details class="ai-extraction-details" open><summary>Campos extraídos — marque os dados aceitos</summary><div class="table-wrap"><table><tr><th>Campo</th><th>Valor sugerido</th><th>Confiança</th><th>Usar?</th></tr>${normalizedFields.map(f=>`<tr><td>${escapeHtml(f.label||f.field)}</td><td>${escapeHtml(f.value)}</td><td><span class="pill">${f.confidence||'-'}</span></td><td><input type="checkbox" data-field="${escapeHtml(f.field)}" data-value="${escapeHtml(f.value)}" checked></td></tr>${f.evidence?`<tr><td colspan="4"><span class="hint"><b>Evidência documental:</b> ${escapeHtml(f.evidence)}</span></td></tr>`:''}`).join('')}</table></div></details>`;
      window.lastExtractedFields = normalizedFields;
    } catch (err) {
      setIaStatus(iaConnectionErrorMessage(err), 'bad');
    }
  };
  reader.readAsArrayBuffer(file);
}

function setSelectFromIa(el, value) {
  if (!el) return false;
  const raw = (value || '').toString().trim();
  const normalized = normalizeCnpjLookupText(raw);
  const options = Array.from(el.options || []);
  const direct = options.find(opt => opt.value === raw);
  const byNormalizedValue = options.find(opt => normalizeCnpjLookupText(opt.value || '') === normalized);
  const byNormalizedText = options.find(opt => normalizeCnpjLookupText((opt.textContent || '').trim()) === normalized);
  const municipality = typeof municipalityFromValue === 'function' ? municipalityFromValue(raw) :
    municipalities.find(item => normalizeCnpjLookupText(item.nome) === normalized || item.codigo === raw.replace(/\D/g, '').slice(0, 6));
  const byMunicipality = municipality ? options.find(opt => opt.value === municipality.codigo) : null;
  const match = direct || byNormalizedValue || byNormalizedText || byMunicipality;
  if (!match) return false;
  el.value = match.value;
  el.dispatchEvent(new Event('change', {
    bubbles: true
  }));
  return true;
}

function applyNcmsFromIa(value) {
  const values = (value || '').toString().split(/[;,\s]+/)
    .map(v => normNcm(v))
    .filter(Boolean);
  if (!values.length) return 0;
  const list = document.getElementById('ncm_list');
  if (!list) return 0;
  Array.from(document.querySelectorAll('.ncm-input')).forEach(input => input.closest('div')?.remove());
  let applied = 0;
  values.forEach(ncm => {
    adicionarNCM(ncm);
    const inputs = Array.from(document.querySelectorAll('.ncm-input'));
    const input = inputs[inputs.length - 1];
    if (input) {
      lockFieldFromIA(input, 'ncm');
      applied += 1;
    }
  });
  onNcmChange();
  return applied ? 1 : 0;
}

function applyIaValue(field, value) {
  const ids = getFieldIds();
  const aliases = {
    cnae: ids.cnae,
    tru: ids.tru,
    municipio: ids.municipio,
    valor: ids.valor,
    valor_com_beneficio: ids.valor,
    producao_com_beneficio: ids.valor,
    faturamento_com_beneficio: ids.valor,
    valor_sem_beneficio: ids.valorSem,
    producao_sem_beneficio: ids.valorSem,
    faturamento_sem_beneficio: ids.valorSem,
    empregos: ids.empregos,
    empregos_diretos: ids.empregos,
    salario: ids.salario,
    salario_medio: ids.salario,
    renuncia: ids.renuncia,
    renuncia_pct: ids.renuncia,
    meta_recuperacao_tributos: ids.meta,
    cnpj: 'cnpj',
    protocolo: 'protocolo',
    razao_social: 'razao_social',
    nome_fantasia: 'nome_fantasia',
    porte_empresa: 'porte_empresa',
    uf_origem: 'uf_origem',
    situacao_cadastral: 'situacao_cadastral',
    tipo_analise: 'tipo_analise',
    macrossegmento: 'macrossegmento',
    local: 'local',
    produtos: 'produtos',
    destino: 'destino',
    substitui: 'substitui',
    novo_produto: 'novo_produto',
    estrategico: 'estrategico',
    adicionalidade: 'adicionalidade',
    permanencia_anos: 'permanencia_anos',
    ativos_recuperaveis_pct: 'ativos_recuperaveis_pct',
    equipamentos_adquiridos_pct: 'equipamentos_adquiridos_pct',
    investimento_privado: 'investimento_privado',
    investimento_publico: 'investimento_publico',
    investimento_terreno_imovel: 'investimento_terreno_imovel',
    investimento_obras: 'investimento_obras',
    investimento_outros: 'investimento_outros',
    imovel_tipo: 'imovel_tipo',
    incentivo_locacional: 'incentivo_locacional'
  };
  if (field === 'ncm') return applyNcmsFromIa(value);
  const targetId = aliases[field] || field;
  const el = document.getElementById(targetId);
  if (!el) return 0;
  el.disabled = false;
  if (el.tagName === 'SELECT') {
    if (!setSelectFromIa(el, value)) return 0;
  } else {
    el.value = value;
    if (el.classList.contains('money-input')) formatMoneyInput(el);
    if (el.id === 'cnpj') formatarCNPJ(el);
  }
  lockFieldFromIA(el, field);
  return 1;
}

async function aplicarCamposIA() {
  const checked = document.querySelectorAll('#ia_result input[type=checkbox]:checked');
  if (!checked.length) {
    setIaStatus('Nenhum campo marcado para confirmação.');
    return;
  }
  let applied = 0;
  const rows = Array.from(checked).map(cb => ({
    field: cb.dataset.field,
    value: cb.dataset.value
  }));
  rows.filter(row => ['tipo_analise', 'macrossegmento'].includes(row.field)).forEach(row => {
    applied += applyIaValue(row.field, row.value);
  });
  if (typeof onTipoAnaliseChange === 'function') onTipoAnaliseChange();
  if (typeof onMacrossegmentoChange === 'function') onMacrossegmentoChange();
  rows.filter(row => !['tipo_analise', 'macrossegmento'].includes(row.field)).forEach(row => {
    applied += applyIaValue(row.field, row.value);
  });
  setIaStatus(`${applied} campo(s) confirmado(s), aplicado(s) e bloqueado(s) para edição manual.`, 'ok');
  updateSectorUI();
  updateChoqueUI();
  if (typeof onTipoAnaliseChange === 'function') onTipoAnaliseChange();
  if (typeof onMacrossegmentoChange === 'function') onMacrossegmentoChange();
}

function missingQualifiersForAI(w) {
  const missing = [];
  const ids = getFieldIds();
  const seg = getMacrossegmento();
  const addIf = (weightKey, fieldId, label) => {
    if (Number(w[weightKey] || 0) > 0 && !(document.getElementById(fieldId)?.value || '').toString().trim()) {
      missing.push(label);
    }
  };
  addIf('comprasLocais', 'local', 'compras locais');
  addIf('empregoDireto', ids.empregos, 'empregos diretos');
  addIf('tempoProjeto', 'permanencia_anos', 'tempo do projeto');
  addIf('ativosIrrecuperaveis', 'ativos_recuperaveis_pct', 'ativos recuperáveis/irrecuperáveis');
  if (seg === 'industria' && Number(w.tecnologia || 0) > 0 && !getNcmValues().length) {
    missing.push('NCM/conteúdo tecnológico');
  }
  if (seg === 'comercio') {
    addIf('comOrigemLocal', 'com_origem_produtos', 'origem dos produtos comercializados');
    addIf('comDestinoLocal', 'com_destino_vendas', 'destino das vendas');
  }
  return missing;
}

async function gerarAnaliseIA() {
  if (!window.lastEvaluationContext) {
    alert('Gere o relatório antes de solicitar a análise textual.');
    return;
  }
  setDocumentoStatus('Gerando análise textual com base nos resultados calculados...');
  try {
    const resp = await fetch(iaBaseUrl() + '/gerar_analise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: window.lastEvaluationContext
      })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.ok) {
      setDocumentoStatus('Erro: ' + (data.error || 'desconhecido'), 'bad');
      return;
    }
    renderIaAnalysis(data);
    setDocumentoStatus('Análise textual gerada na aba Documento da análise. Revise a redação antes de anexar ao parecer.', 'ok');
    switchMainTab('documento');
  } catch (err) {
    setDocumentoStatus(iaConnectionErrorMessage(err), 'bad');
  }
}

function renderIaAnalysis(data) {
  const analysisText = data.analysis || '';
  const box = document.getElementById('documento_texto');
  if (box) {
    box.className = 'ai-analysis';
    box.innerHTML = `
      <div class="ai-analysis-head">
        <div><b>Análise textual assistida</b><br><span class="hint">Motor: ${escapeHtml(data.engine||'')}${data.model?' | Modelo: '+escapeHtml(data.model):''}</span></div>
        <button type="button" class="mini-icon-btn" onclick="navigator.clipboard.writeText(document.getElementById('ia_analysis_text')?.textContent||'')" title="Copiar análise">⎘</button>
      </div>
      <div id="ia_analysis_text">${escapeHtml(analysisText)}</div>`;
  }
}

async function gerarPdfAnaliseIA() {
  if (!window.lastEvaluationContext) {
    alert('Gere o relatório antes de solicitar o PDF.');
    return;
  }
  setIaStatus('Gerando PDF...');
  try {
    const resp = await fetch(iaBaseUrl() + '/gerar_pdf_analise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: window.lastEvaluationContext
      })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.ok) {
      setIaStatus('Erro: ' + (data.error || 'desconhecido'), 'bad');
      return;
    }
    setIaStatus('PDF gerado.', 'ok');
    if (data.pdf_b64) {
      const bytes = atob(data.pdf_b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analise_avaliacao.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    setIaStatus(iaConnectionErrorMessage(err), 'bad');
  }
}

function baixarBase64Arquivo(base64, mime, filename) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function mapPngBase64() {
  const svg = document.querySelector('.decision-layer .map-wrap svg') || document.querySelector('.map-wrap svg');
  if (!svg) return null;
  try {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const raw = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([raw], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    const box = svg.viewBox?.baseVal;
    const w = Math.max(900, Math.round(box?.width || svg.getBoundingClientRect().width || 1180));
    const h = Math.max(600, Math.round(box?.height || svg.getBoundingClientRect().height || 760));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png').split(',', 2)[1];
  } catch (e) {
    return null;
  }
}

async function gerarWordRelatorioHibrido() {
  if (!window.lastEvaluationContext) {
    alert('Gere o relatório antes de solicitar o documento.');
    return;
  }
  setDocumentoStatus('Gerando documento. O painel controla estrutura, tabelas e números; a IA redige apenas a interpretação...');
  try {
    const map_png_base64 = await mapPngBase64();
    const resp = await fetch(iaBaseUrl() + '/gerar_word_relatorio_hibrido', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: window.lastEvaluationContext,
        map_png_base64
      })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.ok) {
      setDocumentoStatus('Erro: ' + (data.error || 'desconhecido'), 'bad');
      return;
    }
    baixarBase64Arquivo(data.docx_base64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data.filename || 'relatorio_hibrido_ia.docx');
    if (data.saved_path) {
      const href = fileUrlFromPath(data.saved_path);
      setDocumentoStatusHtml(`<a href="${href}" target="_blank" rel="noopener">Ler documento gerado.</a>`, 'ok');
    } else {
      setDocumentoStatus('Ler documento gerado.', 'ok');
    }
  } catch (err) {
    setDocumentoStatus(iaConnectionErrorMessage(err), 'bad');
  }
}
