// =====================================================================
// WORKER "margem" — Cloudflare Workers
// 1) POST /api/diagnostico  → IA calcula a margem real + benchmark (nuvem)
// 2) Qualquer outro caminho → proxy do site (margem-castoldi.netlify.app)
//
// CONFIGURAÇÃO (uma vez, no painel do Worker):
//   Settings → Variables and Secrets → Add → tipo "Secret"
//   Nome: ANTHROPIC_API_KEY   Valor: sua chave da console.anthropic.com
// =====================================================================

const ORIGEM_SITE = "margem-castoldi.netlify.app";
const MODELO = "claude-opus-5-5";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/diagnostico") {
      if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }), request);
      if (request.method !== "POST") return cors(json({ erro: "use POST" }, 405), request);
      try {
        return cors(await diagnostico(request, env), request);
      } catch (e) {
        return cors(json({ erro: "falha interna", detalhe: String(e).slice(0, 200) }, 500), request);
      }
    }

    // proxy do site
    url.hostname = ORIGEM_SITE;
    return fetch(url.toString(), request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function cors(resp, request) {
  const h = new Headers(resp.headers);
  h.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  h.set("Access-Control-Max-Age", "86400");
  return new Response(resp.body, { status: resp.status, headers: h });
}

const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

async function diagnostico(request, env) {
  if (!env.ANTHROPIC_API_KEY) return json({ erro: "ANTHROPIC_API_KEY não configurada no Worker" }, 500);

  const d = await request.json();
  const faturamento = num(d.faturamento_mensal);
  const cmv = num(d.custo_mercadorias);
  const fixas = num(d.despesas_fixas);
  if (!faturamento || !d.segmento) return json({ erro: "dados insuficientes (faturamento_mensal e segmento são obrigatórios)" }, 400);

  // ----- Cálculo determinístico (nunca pela IA) -----
  const margemBrutaPct = faturamento ? ((faturamento - cmv) / faturamento) * 100 : 0;
  const margemLiquidaPct = faturamento ? ((faturamento - cmv - fixas) / faturamento) * 100 : 0;
  const lucroMes = faturamento - cmv - fixas;

  const sistema = `Você é o analista de margem do método Ramsés Castoldi ("empresa boa não vive de desconto, vive de margem").
Escreva em português do Brasil, direto, sem enrolação, tom de consultor experiente que fala a língua do dono de negócio.
Você receberá os números JÁ CALCULADOS da empresa (não recalcule) e os dados da operação.
Produza a PRÉVIA do diagnóstico em até 220 palavras, nesta estrutura, sem títulos markdown:
1) Veredito em uma frase: a margem líquida de X% está acima/na média/abaixo da faixa típica do setor no Brasil (cite a faixa típica que você conhece do setor).
2) Onde o dinheiro está vazando (2 frases, com base nos números e em como a empresa precifica hoje).
3) O movimento nº 1 de pricing pra começar a recuperar margem já neste mês (2-3 frases, concreto).
Feche com: "O relatório completo com o benchmark detalhado do seu mercado chega no seu e-mail e WhatsApp."
Nunca prometa resultado garantido; são estimativas educativas.`;

  const entrada = `DADOS DA EMPRESA
Segmento: ${d.segmento}${d.descricao ? " — " + d.descricao : ""}
Cidade: ${d.cidade || "não informada"} | Tempo de empresa: ${d.tempo_empresa || "-"} | Funcionários: ${d.funcionarios || "-"}
Regime tributário: ${d.regime || "-"} | Desconto médio praticado: ${d.desconto_medio || "-"}
Como precifica hoje: ${d.como_precifica || "-"}
Maior incômodo declarado: ${d.maior_incomodo || "-"}

NÚMEROS MENSAIS (já calculados — use como estão)
Faturamento: ${brl(faturamento)}
Custo do que vende (CMV): ${brl(cmv)} | Despesas fixas: ${brl(fixas)}
Margem bruta: ${margemBrutaPct.toFixed(1)}% | Margem líquida: ${margemLiquidaPct.toFixed(1)}%
Resultado mensal: ${brl(lucroMes)}`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01"
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 1500,
      fallbacks: "default",
      system: sistema,
      messages: [{ role: "user", content: entrada }]
    })
  });

  const corpo = await r.json();
  if (!r.ok) return json({ erro: "API da Anthropic recusou", detalhe: corpo?.error?.message || r.status }, 502);

  const texto = (corpo.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  return json({
    ok: true,
    margem_bruta_pct: +margemBrutaPct.toFixed(1),
    margem_liquida_pct: +margemLiquidaPct.toFixed(1),
    lucro_mes: Math.round(lucroMes),
    previa: texto
  });
}
