// static/v20/territorio_calculo.js
// Modulo responsavel pelo calculo territorial: REGIC, distancias, matriz de comercio,
// QL municipal e score de capacidade de absorcao dos impactos indiretos.

const TerritorioCalculo = (() => {
  let regicIndex = null;
  let regicMaxDist = 1;
  const commerceMaxBySector = {};

  function ensureRegicIndex() {
    if (regicIndex) return regicIndex;
    regicIndex = {};
    regicMaxDist = 1;
    for (const link of (regicData.ligacoes || [])) {
      const o = String(link.cod_ori || '');
      const d = String(link.cod_dest || '');
      if (!o || !d) continue;
      const key = `${o}|${d}`;
      const dist = Number(link.dist_km || 0);
      if (dist > regicMaxDist) regicMaxDist = dist;
      if (!regicIndex[key] || dist < Number(regicIndex[key].dist_km || Infinity)) {
        regicIndex[key] = link;
      }
    }
    return regicIndex;
  }

  function regicLink(origin, dest) {
    const idx = ensureRegicIndex();
    return idx[`${origin}|${dest}`] || idx[`${dest}|${origin}`] || null;
  }

  function regicDistance(origin, dest) {
    if (!origin || !dest) return null;
    if (origin === dest) return 0;
    const link = regicLink(origin, dest);
    const dist = Number(link?.dist_km || 0);
    return dist > 0 ? dist : Math.max(regicMaxDist * 1.25, 250);
  }

  function roadDistance(origin, dest) {
    if (!origin || !dest) {
      return { dist_km: null, dur_min: null, fonte: 'não disponível' };
    }
    if (origin === dest) {
      return { dist_km: 0, dur_min: 0, fonte: 'distbrasil' };
    }
    const key = `${origin}|${dest}`;
    const rec = roadDistanceMatrix[key];
    if (rec) {
      return {
        dist_km: Number(rec[0] || 0),
        dur_min: rec[1] == null ? null : Number(rec[1]),
        fonte: 'distbrasil'
      };
    }
    const link = regicLink(origin, dest);
    const dist = Number(link?.dist_km || 0);
    if (dist > 0) {
      return { dist_km: dist, dur_min: null, fonte: 'REGIC' };
    }
    return {
      dist_km: Math.max(regicMaxDist * 1.25, 250),
      dur_min: null,
      fonte: 'estimada'
    };
  }

  function primaryPole(mun) {
    return regicData.polo_principal?.[mun]?.cod_dest || '';
  }

  function regicHierarchyWeight(origin, dest) {
    if (!origin || !dest || origin === dest) return 1;
    const direct = ensureRegicIndex()[`${origin}|${dest}`] || null;
    if (direct && String(direct.vinculo || '').toLowerCase() === 'sim') return 1.5;
    const po = primaryPole(origin);
    const pd = primaryPole(dest);
    if (po && pd && po === pd) return 1.2;
    return 1.0;
  }

  function sectorImpactVector(indirectSectors) {
    return (indirectSectors || [])
      .map(s => {
        const row = mult.find(item => normCode(item.codigo) === normCode(s.codigo)) || {};
        const empregos = (Number(s.impacto || 0) / 1000000) * Number(row.direto_por_R$_milhao || 0);
        const peso = empregos > 0 ? empregos : Number(s.impacto || 0);
        return { ...s, empregos, peso };
      })
      .filter(s => Number(s.peso || 0) > 0);
  }

  function commerceSectorStats(sectorCode) {
    const code = normCode(sectorCode);
    if (commerceMaxBySector[code]) return commerceMaxBySector[code];
    const row = comercioSetorial[code] || {};
    const salesValues = Object.values(row.vendas_municipio || {}).map(Number).filter(v => v > 0);
    const intraValues = Object.values(row.vendas_intra_municipio || {}).map(Number).filter(v => v > 0);
    const flowValues = Object.values(row.fluxos_pb || {}).map(Number).filter(v => v > 0);
    const stats = {
      maxSales: Math.max(...salesValues, 0),
      maxIntraSales: Math.max(...intraValues, 0),
      maxFlow: Math.max(...flowValues, 0)
    };
    commerceMaxBySector[code] = stats;
    return stats;
  }

  function logRatio(value, maxValue) {
    const v = Math.max(0, Number(value || 0));
    const m = Math.max(0, Number(maxValue || 0));
    if (v <= 0 || m <= 0) return 0;
    return Math.max(0, Math.min(1, Math.log(v + 1) / Math.log(m + 1)));
  }

  function commercialEvidence(sectorCode, supplierMun, targetMun) {
    const code = normCode(sectorCode);
    const row = comercioSetorial[code] || null;
    if (!row) {
      return {
        fator: 0.75,
        score: 0,
        vendas: 0,
        vendas_intra: 0,
        fluxo_alvo: 0,
        retencao_pb: 0,
        vazamento_entrada: 0,
        relacionamento_direto: false,
        disponibilidade: 'sem dados comerciais setoriais'
      };
    }
    const stats = commerceSectorStats(code);
    const vendas = Number((row.vendas_municipio || {})[supplierMun] || 0);
    const vendasIntra = Number((row.vendas_intra_municipio || {})[supplierMun] || 0);
    const fluxoAlvo = Number((row.fluxos_pb || {})[`${supplierMun}|${targetMun}`] || 0);
    const retencao = Number(row.retencao_pb || 0);
    const vazamento = Number(row.vazamento_entrada || 0);
    const salesFactor = logRatio(vendas, stats.maxSales);
    const intraFactor = logRatio(vendasIntra, stats.maxIntraSales || stats.maxSales);
    const flowFactor = logRatio(fluxoAlvo, stats.maxFlow);
    const observedScore = Math.max(0, Math.min(1,
      salesFactor * 0.45 +
      intraFactor * 0.20 +
      flowFactor * 0.20 +
      Math.max(0, Math.min(1, retencao)) * 0.15
    ));
    return {
      fator: 0.55 + 0.90 * observedScore,
      score: observedScore,
      vendas,
      vendas_intra: vendasIntra,
      fluxo_alvo: fluxoAlvo,
      retencao_pb: retencao,
      vazamento_entrada: vazamento,
      relacionamento_direto: fluxoAlvo > 0,
      disponibilidade: vendas > 0 ? 'venda observada no setor' : 'sem venda municipal observada no setor'
    };
  }

  function emptySpatialRows(origin) {
    return municipalities.map(m => {
      if (m.codigo === origin) {
        return {
          codigo: m.codigo,
          nome: m.nome,
          score: null,
          raw: null,
          oferta: 0,
          dist_km: 0,
          peso_hierarquico: 1,
          principal_setor: 'Epicentro do choque',
          principal_codigo: '',
          principal_valor: 0,
          principal_grupo: '',
          principal_massa: 0,
          principal_fator_massa: 0,
          principal_comercio_score: 0,
          principal_vendas_observadas: 0,
          principal_fluxo_alvo: 0,
          principal_retencao_pb: 0,
          capacidade_alta: false,
          capacidade_classe: 'Origem'
        };
      }
      const distInfo = roadDistance(origin, m.codigo);
      return {
        codigo: m.codigo,
        nome: m.nome,
        score: 0,
        raw: 0,
        oferta: 0,
        dist_km: distInfo.dist_km,
        dur_min: distInfo.dur_min,
        fonte_distancia: distInfo.fonte,
        peso_hierarquico: regicHierarchyWeight(origin, m.codigo),
        principal_setor: 'Sem setor tradable relevante',
        principal_codigo: '',
        principal_valor: 0,
        principal_grupo: '',
        principal_massa: 0,
        principal_fator_massa: 0,
        principal_comercio_score: 0,
        principal_vendas_observadas: 0,
        principal_fluxo_alvo: 0,
        principal_retencao_pb: 0,
        capacidade_alta: false,
        capacidade_classe: 'Baixa'
      };
    });
  }

  function spatialSupplyScores(origin, impactVector) {
    if (!origin) return [];
    if (!impactVector?.length) return emptySpatialRows(origin);
    const rows = [];
    for (const m of municipalities) {
      const mun = m.codigo;
      if (mun === origin) {
        rows.push({
          codigo: mun,
          nome: m.nome,
          score: null,
          raw: null,
          oferta: 0,
          dist_km: 0,
          peso_hierarquico: 1,
          principal_setor: 'Epicentro do choque',
          principal_codigo: '',
          principal_valor: 0,
          principal_grupo: '',
          principal_massa: 0,
          principal_fator_massa: 0,
          principal_comercio_score: 0,
          principal_vendas_observadas: 0,
          principal_fluxo_alvo: 0,
          principal_retencao_pb: 0
        });
        continue;
      }
      let oferta = 0;
      let principal = null;
      for (const s of impactVector) {
        const qlVal = Number((ql[normCode(s.codigo)] || {})[mun] || 0);
        const grupo = broadSectorFromSCN(s.codigo);
        const massa = municipalEconomicMass(mun, grupo);
        const fatorMassa = municipalMassFactor(mun, grupo);
        const comercio = commercialEvidence(s.codigo, mun, origin);
        const contrib = qlVal * Number(s.peso || 0) * fatorMassa * Number(comercio.fator || 0.75);
        oferta += contrib;
        if (!principal || contrib > principal.valor) {
          principal = {
            codigo: normCode(s.codigo),
            setor: s.setor,
            valor: contrib,
            ql: qlVal,
            empregos: Number(s.empregos || 0),
            grupo,
            massa,
            fatorMassa,
            comercio
          };
        }
      }
      const distInfo = roadDistance(origin, mun);
      const peso = regicHierarchyWeight(origin, mun);
      const denom = Math.max(1, Math.log(Number(distInfo.dist_km || 0) + 1));
      const raw = (oferta * peso) / denom;
      rows.push({
        codigo: mun,
        nome: m.nome,
        score: 0,
        raw,
        oferta,
        dist_km: distInfo.dist_km,
        dur_min: distInfo.dur_min,
        fonte_distancia: distInfo.fonte,
        peso_hierarquico: peso,
        principal_setor: principal?.setor || 'Sem setor fornecedor compatível',
        principal_codigo: principal?.codigo || '',
        principal_valor: principal?.valor || 0,
        principal_ql: principal?.ql || 0,
        principal_empregos: principal?.empregos || 0,
        principal_grupo: principal?.grupo || '',
        principal_massa: principal?.massa || 0,
        principal_fator_massa: principal?.fatorMassa || 0,
        principal_comercio_score: principal?.comercio?.score || 0,
        principal_vendas_observadas: principal?.comercio?.vendas || 0,
        principal_vendas_intra: principal?.comercio?.vendas_intra || 0,
        principal_fluxo_alvo: principal?.comercio?.fluxo_alvo || 0,
        principal_retencao_pb: principal?.comercio?.retencao_pb || 0,
        principal_vazamento_entrada: principal?.comercio?.vazamento_entrada || 0,
        principal_relacionamento_direto: !!principal?.comercio?.relacionamento_direto,
        principal_comercio_disponibilidade: principal?.comercio?.disponibilidade || 'sem dados comerciais',
        polo_principal: primaryPole(mun)
      });
    }
    const maxRaw = Math.max(...rows.filter(r => r.codigo !== origin).map(r => Number(r.raw || 0)), 0);
    for (const r of rows) {
      if (r.codigo !== origin) {
        r.score = maxRaw > 0 ? (Number(r.raw || 0) / maxRaw) * 100 : 0;
        const comercioObservado = Number(r.principal_vendas_observadas || 0) > 0;
        r.capacidade_alta = r.score >= 50 &&
          Number(r.principal_ql || 0) >= 1 &&
          Number(r.principal_massa || 0) > 0 &&
          comercioObservado;
        r.capacidade_classe = r.capacidade_alta ? 'Alta' :
          (r.score >= 25 && Number(r.principal_massa || 0) > 0 && comercioObservado ? 'Média' : 'Baixa');
      } else {
        r.capacidade_alta = false;
        r.capacidade_classe = 'Origem';
      }
    }
    return rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }

  function calcularModuloTerritorial({ origin, sectorCode, valueBRL, targetShare, hasValidMunicipio = true }) {
    const indirectSectorsAll = allIndirectSectors(sectorCode, valueBRL);
    const tradableIndirectSectorsAll = indirectSectorsAll.filter(s => isTradableSupplierSector(s.codigo));
    const impactSectorsTerritoriais = selectImpactSectorsByShare(tradableIndirectSectorsAll, targetShare);
    const spatialImpactVector = sectorImpactVector(tradableIndirectSectorsAll);
    const qlTopCount = origin ? impactSectorsTerritoriais.filter(s => robustSpecialization(s.codigo, origin).ok).length : 0;
    const spatialScores = hasValidMunicipio ? spatialSupplyScores(origin, spatialImpactVector) : [];
    const highAbsorptionRows = spatialScores.filter(s => s.codigo !== origin && s.capacidade_alta);
    const territorialAbsorption = {
      count: highAbsorptionRows.length,
      share: municipalities.length ? highAbsorptionRows.length / municipalities.length : 0,
      score: Math.min(1, highAbsorptionRows.length / 20),
      level: highAbsorptionRows.length >= 10 ? 'Alta' : (highAbsorptionRows.length >= 3 ? 'Média' : 'Baixa')
    };
    return {
      ok: !!(hasValidMunicipio && origin),
      origin,
      indirectSectorsAll,
      tradableIndirectSectorsAll,
      impactSectorsTerritoriais,
      spatialImpactVector,
      qlTopCount,
      spatialScores,
      highAbsorptionRows,
      territorialAbsorption
    };
  }

  return {
    calcularModuloTerritorial,
    commercialEvidence,
    commerceSectorStats,
    ensureRegicIndex,
    primaryPole,
    regicDistance,
    regicHierarchyWeight,
    regicLink,
    roadDistance,
    sectorImpactVector,
    spatialSupplyScores
  };
})();

window.TerritorioCalculo = TerritorioCalculo;
