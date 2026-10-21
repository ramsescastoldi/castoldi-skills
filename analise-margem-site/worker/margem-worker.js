// Worker "margem" — PRODUÇÃO (Cloudflare Workers)
// Serve o site inteiro (HTML guardado no KV "margem-site", em pedaços base64)
// e expõe a IA do diagnóstico em POST /api/diagnostico.
//
// Bindings necessários (já configurados no worker "margem"):
//   - KV: MARGEM_SITE → namespace "margem-site" (e84904763a124333aa0583a5a0fd427a)
//   - Secret: ANTHROPIC_API_KEY (console.anthropic.com → API Keys)
//
// KV: a chave "manifest" lista as chaves dos pedaços na ordem (html_0,html_1,...).
// Cada pedaço é o base64 de um trecho UTF-8-safe do index.html.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (url.pathname === "/api/diagnostico" && request.method === "POST") {
      return diagnostico(request, env, cors);
    }
    if (url.pathname === "/diagnostico" || url.pathname === "/diagnostico.html") {
      const p = new URLSearchParams(url.search);
      p.set("pg", "diagnostico");
      return Response.redirect(url.origin + "/?" + p.toString(), 301);
    }
    if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });

    const html = await paginaHtml(env);
    if (!html) return new Response("Site em manutencao - volte em instantes.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=120" } });
  }
};

let cacheHtml = null;
async function paginaHtml(env) {
  if (cacheHtml) return cacheHtml;
  const manifest = await env.MARGEM_SITE.get("manifest");
  if (!manifest) return null;
  const keys = manifest.trim().split(",");
  const partes = [];
  let total = 0;
  for (const k of keys) {
    const b64 = await env.MARGEM_SITE.get(k);
    if (!b64) return null;
    const bin = atob(b64.trim());
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    partes.push(arr);
    total += arr.length;
  }
  const all = new Uint8Array(total);
  let o = 0;
  for (const a of partes) { all.set(a, o); o += a.length; }
  cacheHtml = new TextDecoder("utf-8").decode(all);
  return cacheHtml;
}

function json(obj, cors, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, cors) });
}
function num(v) {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isFinite(n) ? n : 0;
}
function fmtPct(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }

async function diagnostico(request, env, cors) {
  let d = {};
  try { d = await request.json(); } catch (e) {}
  const fat = num(d.faturamento_mensal);
  const cmv = num(d.custo_mercadorias);
  const fixas = num(d.despesas_fixas);
  if (!fat || fat <= 0) return json({ ok: false, erro: "Informe o faturamento mensal." }, cors, 400);

  // Matemática determinística — a IA entra só na análise.
  const mb = (fat - cmv) / fat * 100;
  const resultado = fat - cmv - fixas;
  const ml = resultado / fat * 100;
  const r1 = Math.round(mb * 10) / 10;
  const r2 = Math.round(ml * 10) / 10;

  let previa = "";
  if (env.ANTHROPIC_API_KEY) {
    try {
      const prompt = "Voce e o analista de pricing da metodologia Castoldi (Ramses Castoldi, especialista em margem). " +
        "Um empresario respondeu o formulario do diagnostico de margem. Dados (JSON): " + JSON.stringify(d) + ". " +
        "A matematica ja foi calculada: margem bruta " + fmtPct(r1) + "%, margem liquida " + fmtPct(r2) + "%, resultado mensal R$ " + Math.round(resultado) + ". " +
        "Escreva uma PREVIA curta do diagnostico em portugues do Brasil, tom direto e consultivo, 3 paragrafos curtos: " +
        "1) leitura da situacao da margem dele comparando com o benchmark tipico do segmento informado; " +
        "2) o ponto mais critico que esta drenando margem (use os dados de desconto, forma de precificar e despesas); " +
        "3) o primeiro movimento pratico de pricing para o proximo mes. " +
        "Sem saudacao, sem markdown, sem promessa de resultado. Maximo 140 palavras.";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-opus-5-5", max_tokens: 700, messages: [{ role: "user", content: prompt }] })
      });
      const j = await resp.json();
      if (j && j.content && j.content[0] && j.content[0].text) previa = j.content[0].text.trim();
    } catch (e) {}
  }
  if (!previa) {
    // Sem chave de API (ou falha): prévia determinística, ainda útil.
    const linha1 = "Com os numeros enviados, sua margem bruta e de " + fmtPct(r1) + "% e a margem liquida fica em " + fmtPct(r2) + "%" +
      (d.segmento ? " no segmento " + d.segmento + "." : ".");
    const linha2 = r2 < 0
      ? "Atencao: a operacao esta no vermelho - as despesas fixas consomem mais do que a margem bruta gera. Prioridade absoluta: revisar precos antes de cortar custo."
      : (r2 < 5
        ? "A margem liquida esta apertada: qualquer desconto ou aumento de custo joga o resultado pro vermelho. Ha espaco claro de recuperacao via pricing."
        : "Ha base para subir margem com ajustes de pricing - o relatorio completo mostra a curva de upside e a ordem dos movimentos.");
    const linha3 = "O relatorio completo, com benchmark do seu mercado e plano de acao, chega no seu e-mail e WhatsApp em ate 24h uteis.";
    previa = linha1 + "\n\n" + linha2 + "\n\n" + linha3;
  }
  return json({ ok: true, margem_bruta_pct: r1, margem_liquida_pct: r2, resultado_mensal: Math.round(resultado), previa: previa }, cors, 200);
}
