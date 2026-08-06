// static/v20/init.js — fonte canônica (extraída e desminificada da v10).
/* =========================================================================
 * Verificação de versão e proveniência do payload.
 * Falha visivelmente quando os arquivos distribuídos estiverem dessincronizados.
 * ========================================================================= */
(function verificarIntegridadePainel() {
  'use strict';

  const VERSAO_MOTOR_ESPERADA = 'formulario_avaliacao_ex_ante_v20';
  const problemas = [];
  const payload = window.MIP_PB_PAYLOAD;
  const meta = (payload && payload.metadados) || {};

  if (!payload) {
    problemas.push('Arquivo de dados (payload_mip_pb_v20.js) não carregado. Verifique se a pasta "dados/" acompanha o HTML.');
  } else {
    if (meta.versao_motor !== VERSAO_MOTOR_ESPERADA) {
      problemas.push('Payload da versão "' + (meta.versao_motor || 'desconhecida') +
        '", mas os módulos esperam "' + VERSAO_MOTOR_ESPERADA + '".');
    }
    if (!meta.hash_insumos) {
      problemas.push('Payload sem manifesto de proveniência. Regere o payload com o gerador v20.');
    }
    if (!Array.isArray(payload.multiplicadores_abertos) || payload.multiplicadores_abertos.length === 0) {
      problemas.push('Payload sem multiplicadores setoriais.');
    }
  }
  if (typeof mapSvg === 'undefined') {
    problemas.push('Mapa territorial (dados/map_svg_v20.js) não carregado.');
  }

  window.PAINEL_PROVENIENCIA = {
    versaoMotor: meta.versao_motor || null,
    versaoPacote: meta.versao_pacote || null,
    versaoMip: meta.versao_mip || null,
    anoBase: meta.ano_base || null,
    dataGeracao: meta.data_geracao || null,
    hashInsumos: meta.hash_insumos || null,
    hashInsumosCurto: meta.hash_insumos ? meta.hash_insumos.slice(0, 12) : null,
    insumos: meta.insumos || {}
  };

  if (!problemas.length) {
    if (window.console && console.info) {
      console.info('[painel] Integridade OK — ' + (meta.versao_mip || '?') +
        ', geração ' + (meta.data_geracao || '?') +
        ', insumos ' + (window.PAINEL_PROVENIENCIA.hashInsumosCurto || '?'));
    }
    return;
  }

  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;' +
    'background:#7f1d1d;color:#fff;padding:14px 20px;' +
    'font:600 14px/1.5 Inter,Arial,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.35)';
  banner.innerHTML =
    '<strong>Painel bloqueado — integridade dos arquivos comprometida</strong>' +
    '<ul style="margin:8px 0 0;padding-left:20px;font-weight:400">' +
    problemas.map(p => '<li>' + p.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</li>').join('') +
    '</ul>' +
    '<div style="margin-top:8px;font-weight:400;opacity:.85">Os cálculos foram desabilitados para evitar resultados incorretos. Distribua a pasta completa gerada pelo pipeline ou regere os artefatos.</div>';

  function instalarBanner() { document.body.prepend(banner); }
  if (document.body) instalarBanner();
  else document.addEventListener('DOMContentLoaded', instalarBanner);

  throw new Error('[painel] Inicialização abortada: ' + problemas.join(' | '));
})();

// inicialização
document.querySelectorAll('.money-input').forEach(el => {
  formatMoneyInput(el);
  el.addEventListener('blur', () => {
    formatMoneyInput(el);
    updateChoqueUI();
  });
  el.addEventListener('input', updateChoqueUI);
  el.addEventListener('focus', () => el.select());
});
document.getElementById('com_margem')?.addEventListener('input', updateChoqueUI);

function applyPolicyConfigToInputs() {
  const pesos = policyConfig.pesos || {};
  for (const [inputId, key] of Object.entries(weightInputMap)) {
    const el = document.getElementById(inputId);
    if (el && pesos[key] !== undefined) el.value = pesos[key];
  }
  const is = document.getElementById('impact_share'),
    params = policyConfig.parametros_choque || {};
  if (is && params.percentual_indireto_acumulado !== undefined) is.value = Number(params.percentual_indireto_acumulado) * 100;
}
applyPolicyConfigToInputs();
setupTabsV17();
setPesosBloqueados(true);
document.querySelectorAll('.weight-input').forEach(input => input.addEventListener('input', marcarPesoModificado));
atualizarBarraEquilibrio();
updateChoqueUI();
onTipoAnaliseChange();
selecionarEntradaManual();
adicionarNCM();
adicionarProdutoFiscal();
renderPaginaInicial();
resetTecnicaTab();
resetTributarioTab();
resetFainTab();
resetDocumentoTab();

const formularioV17 = document.getElementById('formulario');
['input', 'change'].forEach(eventName => {
  formularioV17?.addEventListener(eventName, event => {
    const target = event.target;
    if (target?.classList?.contains('ncm-input')) clearFieldValidation(document.getElementById('ncm_list'));
    else if (target?.classList?.contains('fiscal-product-input')) clearFieldValidation(document.getElementById('fiscal_product_list'));
    else clearFieldValidation(target);
    if (!document.querySelector('.field-invalid')) {
      const summary = document.getElementById('wizard_validation_summary');
      if (summary) {
        summary.hidden = true;
        summary.innerHTML = '';
      }
    }
  });
});
