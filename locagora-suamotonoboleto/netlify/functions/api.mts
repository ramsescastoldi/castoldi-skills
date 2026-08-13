import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const LIMITE_VAGAS = 40;
const VALOR_VOUCHER = 50;

const STAFF_PIN = Netlify.env.get("STAFF_PIN") || "2206";
const POSTO_PIN = Netlify.env.get("POSTO_PIN") || "5050";
const ADMIN_KEY = Netlify.env.get("ADMIN_KEY") || "locagora-admin";
const TG_TOKEN = Netlify.env.get("TELEGRAM_BOT_TOKEN") || "";

const store = () => getStore({ name: "locagora", consistency: "strong" });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function gerarCodigo(prefixo: string, len: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of bytes) s += CODE_CHARS[b % CODE_CHARS.length];
  return `${prefixo}-${s}`;
}

function normalizarFone(raw: string): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length === 10) d = d.slice(0, 2) + "9" + d.slice(2); // fixo antigo -> celular
  if (d.length !== 11) return null;
  if (d[2] !== "9") return null;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return null;
  return "55" + d;
}

function foneBonito(f: string): string {
  // 55 65 9XXXX XXXX
  const d = f.startsWith("55") ? f.slice(2) : f;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function agoraCuiaba(iso?: string): string {
  const dt = iso ? new Date(iso) : new Date();
  return dt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba" });
}

async function tgChats(s: ReturnType<typeof getStore>): Promise<number[]> {
  const c = (await s.get("telegram/chats", { type: "json" })) as number[] | null;
  return c || [];
}

const TG_TECLADO = {
  keyboard: [[{ text: "📋 Status dos cadastros" }, { text: "⛽ Vouchers usados no posto" }]],
  resize_keyboard: true,
  is_persistent: true,
};

async function tgSend(chatId: number, texto: string, comTeclado = false) {
  const body: Record<string, unknown> = { chat_id: chatId, text: texto, parse_mode: "HTML" };
  if (comTeclado) body.reply_markup = TG_TECLADO;
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Notifica todos os Telegrams registrados. Nunca derruba a requisição principal.
async function tgNotify(s: ReturnType<typeof getStore>, texto: string) {
  if (!TG_TOKEN) return;
  try {
    const chats = await tgChats(s);
    await Promise.all(chats.map((id) => tgSend(id, texto).catch(() => {})));
  } catch {
    // notificação é melhor-esforço
  }
}

async function contador(s: ReturnType<typeof getStore>) {
  const c = (await s.get("contador", { type: "json" })) as { validados: number } | null;
  return c || { validados: 0 };
}

async function todosLeads(s: ReturnType<typeof getStore>) {
  const { blobs } = await s.list({ prefix: "lead/" });
  const leads = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  leads.sort((a: any, b: any) => (a.criadoEm < b.criadoEm ? -1 : 1));
  return leads as any[];
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const action = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const s = store();

  try {
    // ---------- CADASTRO DE LEAD ----------
    if (action === "lead" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const nome = String(body.nome || "").trim().replace(/\s+/g, " ").slice(0, 80);
      const fone = normalizarFone(String(body.fone || ""));
      if (nome.length < 3) return json({ ok: false, erro: "Digite seu nome completo." }, 400);
      if (!fone) return json({ ok: false, erro: "WhatsApp inválido. Use DDD + número. Ex: (65) 99999-9999" }, 400);

      const existente = (await s.get(`fone/${fone}`, { type: "json" })) as { code: string } | null;
      if (existente) {
        return json({ ok: true, code: existente.code, jaCadastrado: true });
      }

      let code = gerarCodigo("MOTO", 4);
      while (await s.get(`lead/${code}`, { type: "json" })) code = gerarCodigo("MOTO", 4);

      const lead = {
        code,
        nome,
        fone,
        criadoEm: new Date().toISOString(),
        validado: null as null | { pos: number | null; em: string },
        voucher: null as null | { code: string; valor: number; criadoEm: string; usadoEm: string | null },
      };
      await s.setJSON(`lead/${code}`, lead);
      await s.setJSON(`fone/${fone}`, { code });
      await tgNotify(
        s,
        `🏍️ <b>NOVO CADASTRO</b>\n👤 ${nome}\n📱 ${foneBonito(fone)}\n🎟️ Código: <code>${code}</code>\n🕐 ${agoraCuiaba()}`
      );
      return json({ ok: true, code, jaCadastrado: false });
    }

    // ---------- VAGAS RESTANTES ----------
    if (action === "vagas" && req.method === "GET") {
      const c = await contador(s);
      return json({
        ok: true,
        total: LIMITE_VAGAS,
        validados: c.validados,
        restantes: Math.max(0, LIMITE_VAGAS - c.validados),
      });
    }

    // ---------- STATUS DO LEAD ----------
    if (action === "status" && req.method === "GET") {
      const code = (url.searchParams.get("c") || "").toUpperCase().trim();
      const lead = (await s.get(`lead/${code}`, { type: "json" })) as any;
      if (!lead) return json({ ok: false, erro: "Código não encontrado." }, 404);
      const c = await contador(s);
      return json({
        ok: true,
        code: lead.code,
        nome: lead.nome,
        validado: lead.validado,
        voucher: lead.voucher
          ? { code: lead.voucher.code, valor: lead.voucher.valor, usadoEm: lead.voucher.usadoEm }
          : null,
        restantes: Math.max(0, LIMITE_VAGAS - c.validados),
      });
    }

    // ---------- VALIDAÇÃO NA LOJA (café + libera voucher) ----------
    if (action === "validar" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const pin = String(body.pin || "").trim();
      const code = String(body.code || "").toUpperCase().trim();
      if (pin !== STAFF_PIN) return json({ ok: false, erro: "PIN da equipe incorreto." }, 401);

      const lead = (await s.get(`lead/${code}`, { type: "json" })) as any;
      if (!lead) return json({ ok: false, erro: "QR Code / código não encontrado." }, 404);

      if (lead.validado) {
        return json({
          ok: true,
          jaValidado: true,
          nome: lead.nome,
          fone: foneBonito(lead.fone),
          pos: lead.validado.pos,
          em: agoraCuiaba(lead.validado.em),
          dentroDoLimite: lead.validado.pos !== null,
          voucher: lead.voucher ? { code: lead.voucher.code, valor: lead.voucher.valor } : null,
        });
      }

      const c = await contador(s);
      const dentro = c.validados < LIMITE_VAGAS;
      const pos = dentro ? c.validados + 1 : null;
      const em = new Date().toISOString();

      let voucher = null as any;
      if (dentro) {
        let vcode = gerarCodigo("VALE50", 5);
        while (await s.get(`voucher/${vcode}`, { type: "json" })) vcode = gerarCodigo("VALE50", 5);
        voucher = { code: vcode, valor: VALOR_VOUCHER, criadoEm: em, usadoEm: null };
        await s.setJSON(`voucher/${vcode}`, { leadCode: code });
        await s.setJSON("contador", { validados: c.validados + 1 });
      }

      lead.validado = { pos, em };
      lead.voucher = voucher;
      await s.setJSON(`lead/${code}`, lead);

      await tgNotify(
        s,
        dentro
          ? `✅ <b>QR VALIDADO NA LOJA</b>\n👤 ${lead.nome}\n📱 ${foneBonito(lead.fone)}\n🏅 Posição: ${pos}/${LIMITE_VAGAS}\n💰 Voucher: <code>${voucher.code}</code> (R$ ${voucher.valor})\n🕐 ${agoraCuiaba(em)}`
          : `⚠️ <b>QR VALIDADO FORA DO LIMITE</b>\n👤 ${lead.nome}\n📱 ${foneBonito(lead.fone)}\nAs ${LIMITE_VAGAS} vagas já foram preenchidas — sem voucher.\n🕐 ${agoraCuiaba(em)}`
      );

      return json({
        ok: true,
        jaValidado: false,
        nome: lead.nome,
        fone: foneBonito(lead.fone),
        pos,
        em: agoraCuiaba(em),
        dentroDoLimite: dentro,
        voucher: voucher ? { code: voucher.code, valor: voucher.valor } : null,
      });
    }

    // ---------- VALIDAÇÃO DO VOUCHER NO POSTO ----------
    if (action === "vale" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const pin = String(body.pin || "").trim();
      const vcode = String(body.code || "").toUpperCase().trim();
      if (pin !== POSTO_PIN) return json({ ok: false, erro: "PIN do posto incorreto." }, 401);

      const ref = (await s.get(`voucher/${vcode}`, { type: "json" })) as { leadCode: string } | null;
      if (!ref) return json({ ok: false, erro: "Voucher não encontrado." }, 404);

      const lead = (await s.get(`lead/${ref.leadCode}`, { type: "json" })) as any;
      if (!lead || !lead.voucher || lead.voucher.code !== vcode)
        return json({ ok: false, erro: "Voucher inválido." }, 404);

      if (lead.voucher.usadoEm) {
        return json({
          ok: false,
          jaUsado: true,
          erro: `VOUCHER JÁ UTILIZADO em ${agoraCuiaba(lead.voucher.usadoEm)}`,
          nome: lead.nome,
          valor: lead.voucher.valor,
        }, 409);
      }

      lead.voucher.usadoEm = new Date().toISOString();
      await s.setJSON(`lead/${ref.leadCode}`, lead);

      await tgNotify(
        s,
        `⛽ <b>VOUCHER USADO NO POSTO</b>\n👤 ${lead.nome}\n📱 ${foneBonito(lead.fone)}\n💰 <code>${lead.voucher.code}</code> (R$ ${lead.voucher.valor})\n🕐 ${agoraCuiaba(lead.voucher.usadoEm)}`
      );

      return json({
        ok: true,
        nome: lead.nome,
        fone: foneBonito(lead.fone),
        valor: lead.voucher.valor,
        em: agoraCuiaba(lead.voucher.usadoEm),
      });
    }

    // ---------- TELEGRAM: setup (registra chats pendentes + ativa webhook dos botões) ----------
    // 1. Cada pessoa abre o bot no Telegram e envia /start
    // 2. Abrir /api/telegram?k=ADMIN_KEY uma vez ativa tudo e manda mensagem de teste
    if (action === "telegram" && req.method === "GET") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      if (!TG_TOKEN) return json({ ok: false, erro: "TELEGRAM_BOT_TOKEN não configurado no Netlify." }, 500);

      const set = new Set(await tgChats(s));
      const novos: { id: number; nome: string }[] = [];
      // getUpdates só funciona enquanto o webhook não existe — captura /start dados antes do setup
      try {
        const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates`);
        const data = (await r.json()) as any;
        if (data.ok) {
          for (const u of data.result || []) {
            const chat = u.message?.chat || u.my_chat_member?.chat;
            if (chat?.id && !set.has(chat.id)) {
              set.add(chat.id);
              novos.push({ id: chat.id, nome: chat.first_name || chat.title || String(chat.id) });
            }
          }
        }
      } catch {}
      const chats = [...set];
      await s.setJSON("telegram/chats", chats);

      // webhook: faz o bot responder /start e os botões em tempo real
      const wh = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: `${url.origin}/api/tghook`,
          secret_token: ADMIN_KEY.replace(/[^A-Za-z0-9_-]/g, ""),
          allowed_updates: ["message"],
        }),
      });
      const whData = (await wh.json()) as any;

      await Promise.all(
        chats.map((id) =>
          tgSend(id, `🔔 <b>Notificações Locagora ativadas!</b>\nVocê receberá aviso de cada cadastro, validação de QR e uso de voucher.\nUse os botões aqui embaixo 👇\n🕐 ${agoraCuiaba()}`, true).catch(() => {})
        )
      );
      return json({ ok: true, registrados: chats.length, novosAgora: novos, webhook: whData.ok === true });
    }

    // ---------- TELEGRAM: webhook (responde /start e os botões) ----------
    if (action === "tghook" && req.method === "POST") {
      if (req.headers.get("x-telegram-bot-api-secret-token") !== ADMIN_KEY.replace(/[^A-Za-z0-9_-]/g, ""))
        return json({ ok: false }, 401);
      const up = (await req.json().catch(() => ({}))) as any;
      const msg = up.message;
      if (!msg?.chat?.id) return json({ ok: true });
      const chatId = msg.chat.id as number;
      const texto = String(msg.text || "").trim().toLowerCase();

      // qualquer interação registra o chat automaticamente
      const chats = await tgChats(s);
      if (!chats.includes(chatId)) {
        chats.push(chatId);
        await s.setJSON("telegram/chats", chats);
      }

      if (texto.startsWith("/start")) {
        await tgSend(chatId, `🔔 <b>Notificações Locagora ativadas!</b>\nVocê receberá aviso de cada cadastro, validação de QR e uso de voucher.\nUse os botões aqui embaixo 👇`, true);
      } else if (texto.includes("status")) {
        const leads = await todosLeads(s);
        const c = await contador(s);
        const usados = leads.filter((l) => l.voucher?.usadoEm).length;
        await tgSend(
          chatId,
          `📋 <b>STATUS DOS CADASTROS</b>\n📝 Cadastrados: <b>${leads.length}</b>\n✅ Validados na loja: <b>${c.validados}/${LIMITE_VAGAS}</b>\n🎟️ Vagas restantes: <b>${Math.max(0, LIMITE_VAGAS - c.validados)}</b>\n⛽ Vouchers usados no posto: <b>${usados}</b>\n🕐 ${agoraCuiaba()}`,
          true
        );
      } else if (texto.includes("voucher")) {
        const leads = await todosLeads(s);
        const usados = leads.filter((l) => l.voucher?.usadoEm);
        const linhas = usados.length
          ? usados
              .map((l) => `#${l.validado?.pos ?? "-"} ${l.nome} — <code>${l.voucher.code}</code>\n   usado em ${agoraCuiaba(l.voucher.usadoEm)}`)
              .join("\n")
          : "Nenhum voucher usado no posto ainda.";
        await tgSend(chatId, `⛽ <b>VOUCHERS USADOS NO POSTO (${usados.length})</b>\n${linhas}`, true);
      } else {
        await tgSend(chatId, "Use os botões aqui embaixo 👇", true);
      }
      return json({ ok: true });
    }

    // ---------- ÚLTIMOS CADASTROS (prova social — só primeiro nome + inicial) ----------
    if (action === "recentes" && req.method === "GET") {
      const leads = await todosLeads(s);
      const agora = Date.now();
      const recentes = leads.slice(-5).reverse().map((l) => {
        const partes = l.nome.split(" ");
        const nome = partes[0] + (partes[1] ? " " + partes[1][0] + "." : "");
        return { nome, min: Math.max(0, Math.round((agora - new Date(l.criadoEm).getTime()) / 60000)) };
      });
      return json({ ok: true, recentes });
    }

    // ---------- CONFIG PÚBLICA (pixel etc.) ----------
    if (action === "config" && req.method === "GET") {
      return json({ ok: true, pixel: Netlify.env.get("META_PIXEL_ID") || null });
    }

    // ---------- FOTOS DAS MOTOS ----------
    if (action === "fotos" && req.method === "GET") {
      const { blobs } = await s.list({ prefix: "foto/" });
      return json({ ok: true, ids: blobs.map((b) => b.key.slice(5)).sort().reverse() });
    }

    if (action === "foto" && req.method === "GET") {
      const id = (url.searchParams.get("id") || "").replace(/[^0-9]/g, "");
      const res = await s.getWithMetadata(`foto/${id}`, { type: "arrayBuffer" });
      if (!res) return json({ ok: false, erro: "Foto não encontrada." }, 404);
      return new Response(res.data, {
        headers: {
          "content-type": String(res.metadata?.ct || "image/jpeg"),
          "cache-control": "public, max-age=86400",
        },
      });
    }

    if (action === "foto" && req.method === "POST") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      const buf = await req.arrayBuffer();
      if (buf.byteLength < 1024) return json({ ok: false, erro: "Arquivo vazio ou inválido." }, 400);
      if (buf.byteLength > 4_500_000) return json({ ok: false, erro: "Foto muito grande (máx 4MB)." }, 400);
      const id = String(Date.now());
      await s.set(`foto/${id}`, buf, { metadata: { ct: req.headers.get("content-type") || "image/jpeg" } });
      return json({ ok: true, id });
    }

    if (action === "foto-del" && req.method === "POST") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      const body = await req.json().catch(() => ({}));
      const id = String(body.id || "").replace(/[^0-9]/g, "");
      if (!id) return json({ ok: false, erro: "id obrigatório." }, 400);
      await s.delete(`foto/${id}`);
      return json({ ok: true });
    }

    // ---------- RESET TOTAL (admin — apaga todos os cadastros e zera o placar) ----------
    if (action === "reset" && req.method === "GET") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      if (url.searchParams.get("confirmar") !== "SIM")
        return json({
          ok: false,
          erro: "Isso apaga TODOS os cadastros, validações e vouchers. Para confirmar, adicione &confirmar=SIM no fim da URL.",
        }, 400);

      let apagados = 0;
      for (const prefix of ["lead/", "fone/", "voucher/"]) {
        const { blobs } = await s.list({ prefix });
        await Promise.all(blobs.map((b) => s.delete(b.key)));
        apagados += blobs.length;
      }
      await s.delete("contador");
      await tgNotify(s, `🧹 <b>SISTEMA ZERADO</b>\nTodos os cadastros, validações e vouchers foram apagados.\nPlacar de volta a ${LIMITE_VAGAS}/${LIMITE_VAGAS}.\n🕐 ${agoraCuiaba()}`);
      return json({ ok: true, registrosApagados: apagados, mensagem: `Sistema zerado. Placar de volta a ${LIMITE_VAGAS}/${LIMITE_VAGAS}. Os Telegrams registrados foram mantidos.` });
    }

    // ---------- ADMIN (JSON) ----------
    if (action === "admin" && req.method === "GET") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      const leads = await todosLeads(s);
      const c = await contador(s);
      return json({
        ok: true,
        total: leads.length,
        validados: c.validados,
        restantes: Math.max(0, LIMITE_VAGAS - c.validados),
        vouchersUsados: leads.filter((l) => l.voucher?.usadoEm).length,
        leads: leads.map((l) => ({
          code: l.code,
          nome: l.nome,
          fone: foneBonito(l.fone),
          foneLink: l.fone,
          cadastro: agoraCuiaba(l.criadoEm),
          pos: l.validado ? l.validado.pos : null,
          validadoEm: l.validado ? agoraCuiaba(l.validado.em) : null,
          voucher: l.voucher?.code || null,
          voucherUsadoEm: l.voucher?.usadoEm ? agoraCuiaba(l.voucher.usadoEm) : null,
        })),
      });
    }

    // ---------- EXPORT CSV (Excel / Google Sheets) ----------
    if (action === "export" && req.method === "GET") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      const leads = await todosLeads(s);
      const sep = url.searchParams.get("fmt") === "sheets" ? "," : ";";
      const esc = (v: unknown) => {
        const t = v === null || v === undefined ? "" : String(v);
        return /[";,\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
      };
      const linhas = [
        ["codigo", "nome", "whatsapp", "cadastrado_em", "posicao", "validado_em", "voucher", "voucher_valor", "voucher_usado_em"].join(sep),
        ...leads.map((l) =>
          [
            l.code,
            l.nome,
            "+" + l.fone,
            agoraCuiaba(l.criadoEm),
            l.validado?.pos ?? "",
            l.validado ? agoraCuiaba(l.validado.em) : "",
            l.voucher?.code || "",
            l.voucher ? l.voucher.valor : "",
            l.voucher?.usadoEm ? agoraCuiaba(l.voucher.usadoEm) : "",
          ].map(esc).join(sep)
        ),
      ];
      return new Response("\uFEFF" + linhas.join("\r\n"), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": url.searchParams.get("fmt") === "sheets"
            ? "inline"
            : 'attachment; filename="leads-locagora-suamotonoboleto.csv"',
        },
      });
    }

    return json({ ok: false, erro: "Rota não encontrada." }, 404);
  } catch (e: any) {
    console.error("Erro na API:", e);
    return json({ ok: false, erro: "Erro interno. Tente novamente." }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
