// =============================================================================
// dashboard_template.jsx — Template base do Dashboard de Vendas Multi-Filial
// (skill dashboard-vendas — Lumen Posto Club)
//
// Como usar: copie este arquivo, SUBSTITUA o array `dadosBrutos` abaixo pelos
// dados reais consolidados (uma linha por venda, formato do Passo 4 do SKILL.md)
// e salve como /mnt/user-data/outputs/dashboard_vendas.jsx.
//
// Estrutura obrigatória (Passo 7 do SKILL.md):
//   1. Header (título, período, data de geração)
//   2. Filtros por filial e por produto (botões)
//   3. 6 KPIs (Receita, Lucro, Margem Média %, Volume, Custo, Preço Médio R$/L)
//   4. Card "Ranking de Filiais" (▲ ▼ — vs média da rede)
//   5. Barras horizontais: Receita por Filial
//   6. Barras: Margem Média % por Filial (linha da média geral)
//   7. Heatmap: Margem por Produto × Filial
//   8. Timeline: Receita diária consolidada
//   9. Footer com contagens
// =============================================================================

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, AreaChart, Area, Cell,
} from "recharts";

// =============================================================================
// >>> SUBSTITUA ESTE ARRAY PELOS DADOS REAIS CONSOLIDADOS (df_consolidado) <<<
// Formato: uma linha por venda (Data ISO "YYYY-MM-DD").
// Os registros abaixo são APENAS EXEMPLO para visualizar o template.
// =============================================================================
const dadosBrutos = [
  { Data: "2026-09-01", Filial: "301 - POSTO CELEIRO", Produto: "Etanol", P_Custo: 3.89, P_Venda: 4.79, Margem_Bruta_Pct: 18.79, Markup_Pct: 23.14, Litragem: 1520.5, Total_Custo: 5914.75, Total_Venda: 7283.2, Lucro_Bruto: 1368.45 },
  { Data: "2026-09-01", Filial: "301 - POSTO CELEIRO", Produto: "Gasolina Comum", P_Custo: 5.31, P_Venda: 6.29, Margem_Bruta_Pct: 15.58, Markup_Pct: 18.46, Litragem: 3810.2, Total_Custo: 20232.16, Total_Venda: 23966.16, Lucro_Bruto: 3734.0 },
  { Data: "2026-09-01", Filial: "401 - POSTO DIAMANTINO", Produto: "Diesel S10", P_Custo: 5.62, P_Venda: 6.39, Margem_Bruta_Pct: 12.05, Markup_Pct: 13.7, Litragem: 5230.0, Total_Custo: 29392.6, Total_Venda: 33419.7, Lucro_Bruto: 4027.1 },
  { Data: "2026-09-02", Filial: "502 - POSTO 10 TRUCK", Produto: "Diesel S500", P_Custo: 5.48, P_Venda: 6.19, Margem_Bruta_Pct: 11.47, Markup_Pct: 12.96, Litragem: 8120.4, Total_Custo: 44499.79, Total_Venda: 50265.28, Lucro_Bruto: 5765.49 },
  { Data: "2026-09-02", Filial: "502 - POSTO 10 TRUCK", Produto: "Gasolina Aditivada", P_Custo: 5.45, P_Venda: 6.59, Margem_Bruta_Pct: 17.3, Markup_Pct: 20.92, Litragem: 940.7, Total_Custo: 5126.82, Total_Venda: 6199.21, Lucro_Bruto: 1072.4 },
];
// ================================ FIM DOS DADOS ==============================

// --- Paleta Lumen (manter consistência de identidade) ---
const CORES = {
  bg: "#0F1419",       // azul-petróleo escuro
  card: "#1A2330",
  borda: "#2A3441",
  acento: "#C8102E",   // vermelho combustível
  verde: "#2D7D46",    // verde lucro
  amarelo: "#E89923",  // amarelo destaque
  texto: "#E8ECF1",
  textoSuave: "#8A97A8",
};
const PALETA_FILIAIS = ["#C8102E", "#1B4D8C", "#2D7D46", "#E89923", "#7C3AED", "#06B6D4"];

const FONTE_CORPO = "'Inter', system-ui, sans-serif";
const FONTE_DISPLAY = "'Fraunces', Georgia, serif";
const FONTE_MONO = "'JetBrains Mono', monospace";

// --- Formatadores pt-BR ---
const fmtBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtNum = (v, dec = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtPct = (v) => `${fmtNum(v, 1)}%`;
const fmtData = (iso) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a.slice(2)}`;
};

// --- Componentes de apoio ---
function Card({ titulo, subtitulo, children }) {
  return (
    <div style={{
      background: CORES.card, border: `1px solid ${CORES.borda}`,
      borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      {titulo && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: FONTE_DISPLAY, fontSize: 17, color: CORES.texto }}>{titulo}</div>
          {subtitulo && <div style={{ fontSize: 12, color: CORES.textoSuave, marginTop: 2 }}>{subtitulo}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function KPI({ rotulo, valor, cor }) {
  return (
    <div style={{
      background: CORES.card, border: `1px solid ${CORES.borda}`,
      borderRadius: 12, padding: "14px 16px", flex: "1 1 150px", minWidth: 150,
    }}>
      <div style={{ fontSize: 11, color: CORES.textoSuave, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {rotulo}
      </div>
      <div style={{ fontFamily: FONTE_MONO, fontSize: 22, marginTop: 6, color: cor || CORES.texto }}>
        {valor}
      </div>
    </div>
  );
}

function BotaoFiltro({ ativo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: ativo ? CORES.acento : "transparent",
        color: ativo ? "#fff" : CORES.textoSuave,
        border: `1px solid ${ativo ? CORES.acento : CORES.borda}`,
        borderRadius: 20, padding: "6px 14px", fontSize: 12,
        fontFamily: FONTE_CORPO, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// --- Interpolação de cor do heatmap (mais escuro/verde = margem maior) ---
function corHeatmap(valor, min, max) {
  if (max <= min) return CORES.verde;
  const t = (valor - min) / (max - min); // 0 → pior margem, 1 → melhor
  // vermelho (#C8102E) → amarelo (#E89923) → verde (#2D7D46)
  const paradas = [
    [200, 16, 46],   // acento
    [232, 153, 35],  // amarelo
    [45, 125, 70],   // verde
  ];
  const seg = t < 0.5 ? 0 : 1;
  const tt = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const [r1, g1, b1] = paradas[seg];
  const [r2, g2, b2] = paradas[seg + 1];
  const r = Math.round(r1 + (r2 - r1) * tt);
  const g = Math.round(g1 + (g2 - g1) * tt);
  const b = Math.round(b1 + (b2 - b1) * tt);
  return `rgb(${r},${g},${b})`;
}

// =============================================================================
// Componente principal
// =============================================================================
export default function DashboardVendas() {
  const [filialSel, setFilialSel] = useState("Todas");
  const [produtoSel, setProdutoSel] = useState("Todos");

  const filiais = useMemo(
    () => [...new Set(dadosBrutos.map((d) => d.Filial))].sort(),
    []
  );
  const produtos = useMemo(
    () => [...new Set(dadosBrutos.map((d) => d.Produto))].sort(),
    []
  );

  // Dados após filtros (KPIs refletem o filtro ativo)
  const dados = useMemo(
    () =>
      dadosBrutos.filter(
        (d) =>
          (filialSel === "Todas" || d.Filial === filialSel) &&
          (produtoSel === "Todos" || d.Produto === produtoSel)
      ),
    [filialSel, produtoSel]
  );

  // KPIs
  const kpis = useMemo(() => {
    const receita = dados.reduce((s, d) => s + d.Total_Venda, 0);
    const lucro = dados.reduce((s, d) => s + d.Lucro_Bruto, 0);
    const custo = dados.reduce((s, d) => s + d.Total_Custo, 0);
    const volume = dados.reduce((s, d) => s + d.Litragem, 0);
    return {
      receita, lucro, custo, volume,
      margem: receita > 0 ? (lucro / receita) * 100 : 0,
      precoMedio: volume > 0 ? receita / volume : 0,
    };
  }, [dados]);

  // Agregado por filial (sempre sobre a base COMPLETA — comparativo da rede)
  const porFilial = useMemo(() => {
    return filiais.map((f) => {
      const linhas = dadosBrutos.filter((d) => d.Filial === f);
      const receita = linhas.reduce((s, d) => s + d.Total_Venda, 0);
      const lucro = linhas.reduce((s, d) => s + d.Lucro_Bruto, 0);
      return {
        filial: f,
        receita,
        lucro,
        margem: receita > 0 ? (lucro / receita) * 100 : 0,
      };
    });
  }, [filiais]);

  const mediaRede = useMemo(() => {
    const receita = porFilial.reduce((s, f) => s + f.receita, 0);
    const lucro = porFilial.reduce((s, f) => s + f.lucro, 0);
    return receita > 0 ? (lucro / receita) * 100 : 0;
  }, [porFilial]);

  const ranking = useMemo(
    () => [...porFilial].sort((a, b) => b.margem - a.margem),
    [porFilial]
  );

  // Heatmap Produto × Filial (margem média)
  const heatmap = useMemo(() => {
    const celulas = {};
    let min = Infinity, max = -Infinity;
    produtos.forEach((p) => {
      filiais.forEach((f) => {
        const linhas = dadosBrutos.filter((d) => d.Produto === p && d.Filial === f);
        if (!linhas.length) return;
        const receita = linhas.reduce((s, d) => s + d.Total_Venda, 0);
        const lucro = linhas.reduce((s, d) => s + d.Lucro_Bruto, 0);
        const m = receita > 0 ? (lucro / receita) * 100 : 0;
        celulas[`${p}|${f}`] = m;
        if (m < min) min = m;
        if (m > max) max = m;
      });
    });
    return { celulas, min, max };
  }, [produtos, filiais]);

  // Timeline: receita diária consolidada (todas as filiais somadas)
  const timeline = useMemo(() => {
    const porDia = {};
    dadosBrutos.forEach((d) => {
      porDia[d.Data] = (porDia[d.Data] || 0) + d.Total_Venda;
    });
    return Object.keys(porDia).sort().map((dia) => ({
      dia: fmtData(dia),
      receita: Math.round(porDia[dia]),
    }));
  }, []);

  const datas = useMemo(() => dadosBrutos.map((d) => d.Data).sort(), []);
  const periodo = datas.length
    ? `${fmtData(datas[0])} a ${fmtData(datas[datas.length - 1])}`
    : "—";
  const hoje = new Date().toLocaleDateString("pt-BR");

  const estiloTooltip = {
    background: CORES.card, border: `1px solid ${CORES.borda}`,
    borderRadius: 8, fontSize: 12, color: CORES.texto,
  };

  return (
    <div style={{
      background: CORES.bg, minHeight: "100vh", color: CORES.texto,
      fontFamily: FONTE_CORPO, padding: 24,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* 1. HEADER */}
        <div style={{ marginBottom: 20, borderBottom: `1px solid ${CORES.borda}`, paddingBottom: 16 }}>
          <h1 style={{ fontFamily: FONTE_DISPLAY, fontSize: 28, margin: 0 }}>
            Comparativo de Vendas — <span style={{ color: CORES.acento }}>Multi-Filial</span>
          </h1>
          <div style={{ fontSize: 13, color: CORES.textoSuave, marginTop: 6, fontFamily: FONTE_MONO }}>
            Período: {periodo} · Gerado em {hoje}
          </div>
        </div>

        {/* 2. FILTROS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <BotaoFiltro ativo={filialSel === "Todas"} onClick={() => setFilialSel("Todas")}>
            Todas as filiais
          </BotaoFiltro>
          {filiais.map((f) => (
            <BotaoFiltro key={f} ativo={filialSel === f} onClick={() => setFilialSel(f)}>
              {f}
            </BotaoFiltro>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <BotaoFiltro ativo={produtoSel === "Todos"} onClick={() => setProdutoSel("Todos")}>
            Todos os produtos
          </BotaoFiltro>
          {produtos.map((p) => (
            <BotaoFiltro key={p} ativo={produtoSel === p} onClick={() => setProdutoSel(p)}>
              {p}
            </BotaoFiltro>
          ))}
        </div>

        {/* 3. KPIs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <KPI rotulo="Receita" valor={fmtBRL(kpis.receita)} />
          <KPI rotulo="Lucro" valor={fmtBRL(kpis.lucro)} cor={CORES.verde} />
          <KPI rotulo="Margem Média" valor={fmtPct(kpis.margem)} cor={CORES.amarelo} />
          <KPI rotulo="Volume (L)" valor={fmtNum(kpis.volume)} />
          <KPI rotulo="Custo" valor={fmtBRL(kpis.custo)} cor={CORES.acento} />
          <KPI rotulo="Preço Médio R$/L" valor={fmtNum(kpis.precoMedio, 2)} />
        </div>

        {/* 4. RANKING DE FILIAIS */}
        <Card
          titulo="Ranking de Filiais"
          subtitulo={`Ordenado por margem média · média da rede: ${fmtPct(mediaRede)}`}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: CORES.textoSuave, textAlign: "left" }}>
                  <th style={{ padding: "8px 10px" }}>#</th>
                  <th style={{ padding: "8px 10px" }}>Filial</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Receita</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Lucro</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Margem %</th>
                  <th style={{ padding: "8px 10px", textAlign: "center" }}>vs Rede</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((f, i) => {
                  const delta = f.margem - mediaRede;
                  const seta = Math.abs(delta) < 0.05 ? "—" : delta > 0 ? "▲" : "▼";
                  const corSeta = seta === "▲" ? CORES.verde : seta === "▼" ? CORES.acento : CORES.textoSuave;
                  return (
                    <tr key={f.filial} style={{ borderTop: `1px solid ${CORES.borda}` }}>
                      <td style={{ padding: "8px 10px", fontFamily: FONTE_MONO }}>{i + 1}</td>
                      <td style={{ padding: "8px 10px" }}>{f.filial}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONTE_MONO }}>{fmtBRL(f.receita)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONTE_MONO, color: CORES.verde }}>{fmtBRL(f.lucro)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONTE_MONO }}>{fmtPct(f.margem)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: corSeta }}>{seta}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 5. RECEITA POR FILIAL (barras horizontais) */}
        <Card titulo="Receita por Filial">
          <ResponsiveContainer width="100%" height={60 + porFilial.length * 48}>
            <BarChart data={porFilial} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid stroke={CORES.borda} horizontal={false} />
              <XAxis type="number" stroke={CORES.textoSuave} fontSize={11}
                tickFormatter={(v) => fmtBRL(v)} />
              <YAxis type="category" dataKey="filial" stroke={CORES.textoSuave}
                fontSize={11} width={160} />
              <Tooltip contentStyle={estiloTooltip} formatter={(v) => fmtBRL(v)} />
              <Bar dataKey="receita" name="Receita" radius={[0, 6, 6, 0]}>
                {porFilial.map((f, i) => (
                  <Cell key={f.filial} fill={PALETA_FILIAIS[i % PALETA_FILIAIS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 6. MARGEM MÉDIA POR FILIAL (com linha da média geral) */}
        <Card titulo="Margem Média % por Filial" subtitulo="Linha tracejada: média da rede">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porFilial} margin={{ right: 20 }}>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="filial" stroke={CORES.textoSuave} fontSize={11} />
              <YAxis stroke={CORES.textoSuave} fontSize={11} unit="%" />
              <Tooltip contentStyle={estiloTooltip} formatter={(v) => fmtPct(v)} />
              <ReferenceLine
                y={mediaRede} stroke={CORES.amarelo} strokeDasharray="6 4"
                label={{ value: `Média ${fmtPct(mediaRede)}`, fill: CORES.amarelo, fontSize: 11, position: "insideTopRight" }}
              />
              <Bar dataKey="margem" name="Margem %" radius={[6, 6, 0, 0]}>
                {porFilial.map((f) => (
                  <Cell key={f.filial} fill={f.margem >= mediaRede ? CORES.verde : CORES.acento} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 7. HEATMAP PRODUTO × FILIAL */}
        <Card
          titulo="Margem por Produto × Filial"
          subtitulo={`Cor mais verde = margem maior · faixa: ${fmtPct(heatmap.min)} a ${fmtPct(heatmap.max)}`}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 4, fontSize: 12, width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", color: CORES.textoSuave, padding: 6 }}>Produto</th>
                  {filiais.map((f) => (
                    <th key={f} style={{ color: CORES.textoSuave, padding: 6, fontWeight: 500 }}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p}>
                    <td style={{ padding: 6, color: CORES.texto }}>{p}</td>
                    {filiais.map((f) => {
                      const v = heatmap.celulas[`${p}|${f}`];
                      return (
                        <td
                          key={f}
                          style={{
                            padding: "10px 6px", textAlign: "center", borderRadius: 6,
                            fontFamily: FONTE_MONO,
                            background: v === undefined ? CORES.card : corHeatmap(v, heatmap.min, heatmap.max),
                            color: v === undefined ? CORES.textoSuave : "#fff",
                          }}
                        >
                          {v === undefined ? "—" : fmtPct(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 8. TIMELINE DE RECEITA DIÁRIA */}
        <Card titulo="Receita Diária Consolidada" subtitulo="Todas as filiais somadas">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline} margin={{ right: 20 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CORES.acento} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CORES.acento} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CORES.borda} vertical={false} />
              <XAxis dataKey="dia" stroke={CORES.textoSuave} fontSize={11} />
              <YAxis stroke={CORES.textoSuave} fontSize={11} tickFormatter={(v) => fmtBRL(v)} width={80} />
              <Tooltip contentStyle={estiloTooltip} formatter={(v) => fmtBRL(v)} />
              <Area type="monotone" dataKey="receita" name="Receita"
                stroke={CORES.acento} strokeWidth={2} fill="url(#gradReceita)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* 9. FOOTER */}
        <div style={{
          textAlign: "center", fontSize: 12, color: CORES.textoSuave,
          fontFamily: FONTE_MONO, padding: "12px 0 24px",
        }}>
          {filiais.length} filiais · {produtos.length} produtos · {dadosBrutos.length} registros · período {periodo}
        </div>
      </div>
    </div>
  );
}
