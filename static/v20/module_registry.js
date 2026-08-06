(function(){
  function config(){
    return window.PAINEL_MODULAR || {modulos: []};
  }

  function modules(){
    return Array.isArray(config().modulos) ? config().modulos : [];
  }

  function byId(id){
    return modules().find(m => m.id === id) || null;
  }

  function isActive(id){
    const module = byId(id);
    return module ? module.ativo !== false : true;
  }

  function modulePosition(id){
    const module = byId(id);
    return module ? Number(module.posicao || 9999) : 9999;
  }

  function moduleSection(id){
    const module = byId(id);
    return module ? String(module.secao || '') : '';
  }

  function escapeAttr(value){
    return String(value || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function render(id, html, className){
    if (!isActive(id)) return '';
    return `<div data-module-id="${escapeAttr(id)}" data-module-section="${escapeAttr(moduleSection(id))}" data-module-pos="${modulePosition(id)}" class="painel-module ${escapeAttr(className || '')}">${html}</div>`;
  }

  const topLevelSelectors = {
    indicadores_tributarios: ['#relatorio_tributario', '[data-tab="tributario"]'],
    checklist_fain: ['#relatorio_fain', '[data-tab="fain"]'],
    memoria_tecnica: ['#memoria_tecnica', '[data-tab="tecnica"]'],
    documento_analise: ['#documento_analise', '[data-tab="documento"]'],
    parametros: ['#parametros', '[data-tab="parametros"]']
  };

  function applyTopLevel(root){
    Object.entries(topLevelSelectors).forEach(([id, selectors]) => {
      selectors.forEach(selector => {
        root.querySelectorAll(selector).forEach(node => {
          node.hidden = !isActive(id);
          node.classList.toggle('module-disabled', !isActive(id));
        });
      });
    });
  }

  function applyModuleVisibility(root){
    root.querySelectorAll('[data-module-id]').forEach(node => {
      const id = node.getAttribute('data-module-id');
      node.hidden = !isActive(id);
      node.classList.toggle('module-disabled', !isActive(id));
      const pos = modulePosition(id);
      if (Number.isFinite(pos)) node.style.order = String(pos);
    });
  }

  function applyModuleOrdering(root){
    root.querySelectorAll('[data-module-container]').forEach(container => {
      Array.from(container.children)
        .filter(child => child.hasAttribute('data-module-id'))
        .sort((a, b) => modulePosition(a.getAttribute('data-module-id')) - modulePosition(b.getAttribute('data-module-id')))
        .forEach(child => container.appendChild(child));
    });
  }

  function ensureActiveTab(){
    const active = document.querySelector('.tab-panel.active');
    if (active && active.hidden) {
      if (isActive('indicadores_tributarios')) switchMainTab('tributario');
      else switchMainTab('economico');
    }
  }

  function auditConfig(){
    window.auditoriaLog = window.auditoriaLog || [];
    window.auditoriaLog.push({
      evento: 'painel_modular_aplicado',
      versao: config().versao || 'v20',
      modulos_ativos: modules().filter(m => m.ativo !== false).map(m => m.id),
      modulos_inativos: modules().filter(m => m.ativo === false).map(m => m.id),
      timestamp: new Date().toISOString()
    });
  }

  function applyToDocument(root){
    const scope = root || document;
    applyTopLevel(scope);
    applyModuleVisibility(scope);
    applyModuleOrdering(scope);
    ensureActiveTab();
    auditConfig();
  }

  function getAuditTableRows(){
    return modules()
      .slice()
      .sort((a, b) => String(a.secao).localeCompare(String(b.secao)) || Number(a.posicao || 0) - Number(b.posicao || 0))
      .map(m => `<tr><td>${escapeAttr(m.id)}</td><td>${escapeAttr(m.nome || m.id)}</td><td>${escapeAttr(m.secao)}</td><td>${escapeAttr(m.tipo_visual)}</td><td>${m.ativo !== false ? 'Ativo' : 'Inativo'}</td><td>${escapeAttr(m.fonte_calculo || '-')}</td></tr>`)
      .join('');
  }

  window.PainelModular = {
    config,
    modules,
    byId,
    isActive,
    render,
    applyToDocument,
    getAuditTableRows
  };

  document.addEventListener('DOMContentLoaded', () => applyToDocument(document));
})();
