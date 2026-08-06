// static/v20/mapa_territorial.js
// Modulo responsavel apenas pela apresentacao do mapa territorial e dos tooltips.

const MapaTerritorial = (() => {
  const state = {
    impactSectors: [],
    spatialScores: []
  };

  function setState(next = {}) {
    state.impactSectors = next.impactSectors || [];
    state.spatialScores = next.spatialScores || [];
  }

  function getState() {
    return {
      impactSectors: state.impactSectors,
      spatialScores: state.spatialScores
    };
  }

  function blendHex(a, b, t) {
    const pa = a.match(/\w\w/g).map(x => parseInt(x, 16));
    const pb = b.match(/\w\w/g).map(x => parseInt(x, 16));
    return '#' + pa
      .map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0'))
      .join('');
  }

  function spatialColor(score) {
    const s = Math.max(0, Math.min(100, Number(score || 0)));
    const stops = [
      ['#ffffcc', 0],
      ['#ffeda0', 25],
      ['#feb24c', 50],
      ['#f03b20', 75],
      ['#800026', 100]
    ];
    for (let i = 1; i < stops.length; i++) {
      if (s <= stops[i][1]) {
        const [c0, v0] = stops[i - 1];
        const [c1, v1] = stops[i];
        return blendHex(c0, c1, (s - v0) / (v1 - v0));
      }
    }
    return stops[stops.length - 1][0];
  }

  function spatialAttrValue(value) {
    return escapeHtml(value == null ? '' : value);
  }

  function spatialNumberAttr(value) {
    return Number.isFinite(Number(value)) ? String(Number(value)) : '';
  }

  function spatialDataAttrs(row, isOrigin) {
    const attrs = {
      'data-spatial-origin': isOrigin ? '1' : '0',
      'data-spatial-capacidade': isOrigin ? 'Origem' : (row?.capacidade_classe || 'Baixa'),
      'data-spatial-score': isOrigin || row?.score == null ? '' : spatialNumberAttr(row.score),
      'data-spatial-dist-km': isOrigin ? '0' : spatialNumberAttr(row?.dist_km),
      'data-spatial-fonte-distancia': row?.fonte_distancia || '',
      'data-spatial-setor': isOrigin ? 'Epicentro do choque' : (row?.principal_setor || 'Sem setor compatível'),
      'data-spatial-massa': spatialNumberAttr(row?.principal_massa),
      'data-spatial-vendas': spatialNumberAttr(row?.principal_vendas_observadas),
      'data-spatial-fluxo': spatialNumberAttr(row?.principal_fluxo_alvo),
      'data-spatial-retencao': spatialNumberAttr(row?.principal_retencao_pb)
    };
    return Object.entries(attrs)
      .map(([key, value]) => `${key}="${spatialAttrValue(value)}"`)
      .join(' ');
  }

  function injectSpatialDataAttrs(svg, munCode, attrs) {
    const pathRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${munCode}")[^>]*)(>)`, 'g');
    return svg.replace(pathRe, (match, start, end) => {
      const cleaned = start.replace(/\sdata-spatial-[a-z0-9-]+="[^"]*"/g, '');
      return `${cleaned} ${attrs}${end}`;
    });
  }

  function paintSpatialMap(origin, spatialRows) {
    let svg = mapSvg;
    const byMun = {};
    for (const r of spatialRows || []) byMun[r.codigo] = r;
    for (const m of municipalities) {
      const row = byMun[m.codigo] || { score: 0 };
      const isOrigin = m.codigo === origin;
      const high = !!row.capacidade_alta;
      const fill = isOrigin ? '#343a40' : (high ? spatialColor(row.score || 0) : '#d1d5db');
      const stroke = isOrigin ? '#000000' : (high ? '#7f1d1d' : '#ffffff');
      const sw = isOrigin ? '2.8' : (high ? '1.1' : '0.6');
      const pathRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${m.codigo}")[^>]*\\bfill=")[^"]*("[^>]*>)`, 'g');
      svg = svg.replace(pathRe, `$1${fill}$2`);
      const missingFillRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${m.codigo}")(?![^>]*\\bfill=)[^>]*)(>)`, 'g');
      svg = svg.replace(missingFillRe, `$1 fill="${fill}"$2`);
      const strokeRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${m.codigo}")[^>]*\\bstroke=")[^"]*("[^>]*>)`, 'g');
      svg = svg.replace(strokeRe, `$1${stroke}$2`);
      const missingStrokeRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${m.codigo}")(?![^>]*\\bstroke=)[^>]*)(>)`, 'g');
      svg = svg.replace(missingStrokeRe, `$1 stroke="${stroke}"$2`);
      const swRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${m.codigo}")[^>]*\\bstroke-width=")[^"]*("[^>]*>)`, 'g');
      svg = svg.replace(swRe, `$1${sw}$2`);
      const missingSwRe = new RegExp(`(<path\\b(?=[^>]*data-code6="${m.codigo}")(?![^>]*\\bstroke-width=)[^>]*)(>)`, 'g');
      svg = svg.replace(missingSwRe, `$1 stroke-width="${sw}"$2`);
      svg = injectSpatialDataAttrs(svg, m.codigo, spatialDataAttrs(row, isOrigin));
    }
    return svg;
  }

  function spatialRowFromPath(path) {
    if (!path) return null;
    const origin = path.getAttribute('data-spatial-origin') === '1';
    return {
      score: origin ? null : Number(path.getAttribute('data-spatial-score') || 0),
      capacidade_classe: path.getAttribute('data-spatial-capacidade') || (origin ? 'Origem' : 'Baixa'),
      dist_km: origin ? 0 : Number(path.getAttribute('data-spatial-dist-km') || 0),
      fonte_distancia: path.getAttribute('data-spatial-fonte-distancia') || '',
      principal_setor: path.getAttribute('data-spatial-setor') || (origin ? 'Epicentro do choque' : 'Sem setor compatível'),
      principal_massa: Number(path.getAttribute('data-spatial-massa') || 0),
      principal_vendas_observadas: Number(path.getAttribute('data-spatial-vendas') || 0),
      principal_fluxo_alvo: Number(path.getAttribute('data-spatial-fluxo') || 0),
      principal_retencao_pb: Number(path.getAttribute('data-spatial-retencao') || 0)
    };
  }

  function setupMapTooltips() {
    const tooltip = document.querySelector('.map-tooltip');
    if (!tooltip) return;
    document.querySelectorAll('.map-wrap svg path').forEach(path => {
      if (path.dataset.tooltipBound === '1') return;
      path.dataset.tooltipBound = '1';
      path.addEventListener('mousemove', e => {
        const mun = path.getAttribute('data-code6') ||
          (path.getAttribute('data-code') || '').slice(0, 6) ||
          path.getAttribute('id');
        const munObj = municipalities.find(m => m.codigo === mun);
        if (!munObj) return;
        const embeddedRow = path.hasAttribute('data-spatial-capacidade') ? spatialRowFromPath(path) : null;
        const row = embeddedRow || (state.spatialScores || []).find(r => r.codigo === mun);
        const isOrigin = path.getAttribute('data-spatial-origin') === '1' || row?.score === null;
        tooltip.innerHTML = isOrigin ?
          `<b>Município: ${munObj.nome}</b><br>Epicentro do choque de demanda<br>Distância do investimento: 0 km<br>Principal setor fornecedor: origem do investimento` :
          `<b>Município: ${munObj.nome}</b><br>Capacidade territorial: ${escapeHtml(row?.capacidade_classe||'Baixa')}<br>Score de Fornecimento: ${br(row?.score||0,1)} / 100<br>Distância rodoviária do investimento: ${row?.dist_km==null?'-':br(row.dist_km,1)+' km'}<br>Fonte da distância: ${escapeHtml(row?.fonte_distancia||'-')}<br>Principal Setor Fornecedor: ${escapeHtml(row?.principal_setor||'Sem setor compatível')}<br>Massa econômica compatível: ${money(row?.principal_massa||0)}<br>Venda observada no setor: ${money(row?.principal_vendas_observadas||0)}<br>Fluxo observado para o município do projeto: ${money(row?.principal_fluxo_alvo||0)}<br>Retenção PB do setor: ${br((row?.principal_retencao_pb||0)*100,1)}%`;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 10) + 'px';
      });
      path.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  }

  return {
    blendHex,
    getState,
    injectSpatialDataAttrs,
    paintSpatialMap,
    setState,
    setupMapTooltips,
    spatialColor,
    spatialDataAttrs,
    spatialRowFromPath
  };
})();

window.MapaTerritorial = MapaTerritorial;
