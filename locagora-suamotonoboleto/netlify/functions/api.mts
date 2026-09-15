import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const LIMITE_VAGAS = 40;
const VALOR_VOUCHER = 50;
const ESTOQUE_TOTAL = 65;
const ESTOQUE_VENDIDAS = 7; // 65 - 7 = 58 disponíveis hoje

const POSTO_PIN = Netlify.env.get("POSTO_PIN") || "5050";
const ADMIN_KEY = Netlify.env.get("ADMIN_KEY") || "locagora-admin";
const TG_TOKEN = Netlify.env.get("TELEGRAM_BOT_TOKEN") || "";
const TG_SECRET = (TG_TOKEN.split(":")[1] || "locagora").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);

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
  keyboard: [
    [{ text: "🏍️ Vendeu uma moto" }, { text: "📊 Estoque" }],
    [{ text: "📸 Fotos da landing" }, { text: "📈 Acessos" }],
    [{ text: "🛠️ Criar site" }, { text: "✅ Gerar página" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

const draftKey = (chatId: number) => `tg/draft/${chatId}`;

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

function hojeCuiaba(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Cuiaba" });
}

// ponytail: contagem simples por escrita direta; se o tráfego crescer muito, trocar por agregação assíncrona
async function registrarVisita(s: ReturnType<typeof getStore>) {
  try {
    const v = ((await s.get("visitas", { type: "json" })) as any) || { total: 0, dia: "", hoje: 0 };
    const dia = hojeCuiaba();
    await s.setJSON("visitas", {
      total: (v.total || 0) + 1,
      dia,
      hoje: v.dia === dia ? (v.hoje || 0) + 1 : 1,
    });
  } catch {
    // contagem é melhor-esforço, nunca derruba a página
  }
}

async function estoque(s: ReturnType<typeof getStore>) {
  const e = (await s.get("estoque", { type: "json" })) as { total: number; vendidas: number; negociando?: number } | null;
  return e || { total: ESTOQUE_TOTAL, vendidas: ESTOQUE_VENDIDAS, negociando: 0 };
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

    // ---------- STATUS DO LEAD ----------
    if (action === "status" && req.method === "GET") {
      const code = (url.searchParams.get("c") || "").toUpperCase().trim();
      const lead = (await s.get(`lead/${code}`, { type: "json" })) as any;
      if (!lead) return json({ ok: false, erro: "Código não encontrado." }, 404);
      const c = await contador(s);
      const { blobs } = await s.list({ prefix: "lead/" });
      return json({
        ok: true,
        inscritos: blobs.length,
        code: lead.code,
        nome: lead.nome,
        validado: lead.validado,
        voucher: lead.voucher
          ? { code: lead.voucher.code, valor: lead.voucher.valor, usadoEm: lead.voucher.usadoEm }
          : null,
        restantes: Math.max(0, LIMITE_VAGAS - c.validados),
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
          secret_token: TG_SECRET,
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
      if (req.headers.get("x-telegram-bot-api-secret-token") !== TG_SECRET)
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

      // foto recebida = moto para o site de vendas OU carrossel da landing oficial
      if (msg.photo?.length) {
        const draft = (await s.get(draftKey(chatId), { type: "json" })) as any;
        if (!draft) {
          await tgSend(chatId, "Antes de mandar foto, aperte um botão:\n🏍️ Vendeu uma moto (registra a venda)\n📸 Fotos da landing (motos disponíveis)\n🛠️ Criar site (página de vendas)", true);
          return json({ ok: true });
        }
        if (draft.modo === "venda") {
          const cap = String(msg.caption || "").trim();
          if (!cap) {
            await tgSend(chatId, "⚠️ Manda a foto DE NOVO com a legenda no formato:\n<code>Carlos | CG 160 Titan</code>\n(primeiro nome do comprador | modelo)", true);
            return json({ ok: true });
          }
          const [nomeRaw, modelo] = cap.split("|").map((t) => t.trim());
          const nome = (nomeRaw || "").split(" ")[0].slice(0, 20);
          if (!nome) {
            await tgSend(chatId, "⚠️ Faltou o nome do comprador na legenda: <code>Carlos | CG 160 Titan</code>", true);
            return json({ ok: true });
          }
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          const fr = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
          const fd = (await fr.json()) as any;
          if (!fd.ok) {
            await tgSend(chatId, "⚠️ Não consegui baixar essa foto. Tenta de novo.", true);
            return json({ ok: true });
          }
          const bin = await fetch(`https://api.telegram.org/file/bot${TG_TOKEN}/${fd.result.file_path}`);
          const id = String(Date.now());
          await s.set(`venda/foto/${id}`, await bin.arrayBuffer(), { metadata: { ct: "image/jpeg" } });
          await s.setJSON(`venda/reg/${id}`, { id, nome, modelo: modelo || "", em: new Date().toISOString() });

          const e = await estoque(s);
          const vendidas = Math.min(e.total, e.vendidas + 1);
          await s.setJSON("estoque", { total: e.total, vendidas, negociando: Math.max(0, (e.negociando || 0) - 1) });
          const restam = Math.max(0, e.total - vendidas);
          await s.delete(draftKey(chatId));
          await tgNotify(
            s,
            `🎉 <b>MOTO VENDIDA!</b>\n👤 ${nome}${modelo ? `\n🏍️ ${modelo}` : ""}\n📉 Restam <b>${restam}</b> de ${e.total}\n📸 Já está no mural do site\n🕐 ${agoraCuiaba()}`
          );
          return json({ ok: true });
        }

        if (draft.modo === "landing") {
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          const fr = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
          const fd = (await fr.json()) as any;
          if (fd.ok) {
            const bin = await fetch(`https://api.telegram.org/file/bot${TG_TOKEN}/${fd.result.file_path}`);
            await s.set(`foto/${Date.now()}`, await bin.arrayBuffer(), { metadata: { ct: "image/jpeg" } });
            const { blobs } = await s.list({ prefix: "foto/" });
            await tgSend(chatId, `📸 Foto adicionada à landing oficial (${blobs.length} no carrossel). Manda mais ou aperte outro botão para sair.`, true);
          } else {
            await tgSend(chatId, "⚠️ Não consegui baixar essa foto. Tenta de novo.", true);
          }
          return json({ ok: true });
        }
        const cap = String(msg.caption || "").trim();
        if (!cap) {
          await tgSend(chatId, "⚠️ Manda a foto DE NOVO com a legenda no formato:\n<code>CG 160 Titan | R$ 18.900 | Entrada R$ 1.000 | 36x de R$ 640</code>", true);
          return json({ ok: true });
        }
        const [modelo, valor, entrada, parcelas] = cap.split("|").map((t) => t.trim());
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fr = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
        const fd = (await fr.json()) as any;
        let fotoId = "";
        if (fd.ok) {
          const bin = await fetch(`https://api.telegram.org/file/bot${TG_TOKEN}/${fd.result.file_path}`);
          fotoId = String(Date.now());
          await s.set(`promo/foto/${fotoId}`, await bin.arrayBuffer(), { metadata: { ct: "image/jpeg" } });
        }
        draft.motos.push({
          foto: fotoId,
          modelo: modelo || `Moto ${draft.motos.length + 1}`,
          valor: valor || "",
          entrada: entrada || "",
          parcelas: parcelas || "",
        });
        await s.setJSON(draftKey(chatId), draft);
        await tgSend(chatId, `🏍️ <b>${modelo || "Moto"}</b> adicionada (${draft.motos.length} no site).\nManda a próxima foto ou aperte ✅ Gerar página.`, true);
        return json({ ok: true });
      }

      if (texto.startsWith("/start")) {
        await tgSend(chatId, `🔔 <b>Bot da Locagora ativo!</b>\n🏍️ Registrar venda (baixa do estoque + mural)\n📊 Ver e mudar motos disponíveis\n📸 Subir fotos das motos pro site\n📈 Acessos ao site\nUse os botões aqui embaixo 👇`, true);
      } else if (texto.includes("status")) {
        const leads = await todosLeads(s);
        const c = await contador(s);
        const usados = leads.filter((l) => l.voucher?.usadoEm).length;
        await tgSend(
          chatId,
          `📋 <b>STATUS DOS CADASTROS</b>\n📝 Cadastrados: <b>${leads.length}</b>\n✅ Validados na loja: <b>${c.validados}/${LIMITE_VAGAS}</b>\n🎟️ Vagas restantes: <b>${Math.max(0, LIMITE_VAGAS - c.validados)}</b>\n⛽ Vouchers usados no posto: <b>${usados}</b>\n🕐 ${agoraCuiaba()}`,
          true
        );
      } else if (texto.includes("vendeu")) {
        await s.setJSON(draftKey(chatId), { modo: "venda" });
        const e = await estoque(s);
        await tgSend(
          chatId,
          `🏍️ <b>Registrar venda</b> (restam ${Math.max(0, e.total - e.vendidas)} de ${e.total})\nManda a FOTO da entrega com a legenda:\n<code>Carlos | CG 160 Titan</code>\n(primeiro nome do comprador | modelo)\n\nO site desconta 1 do estoque e publica a foto no mural na hora.`,
          true
        );
      } else if (texto.includes("negocia")) {
        const n = texto.match(/(\d{1,3})/);
        const e = await estoque(s);
        if (n) {
          const negociando = parseInt(n[1], 10);
          await s.setJSON("estoque", { total: e.total, vendidas: e.vendidas, negociando });
          await tgSend(chatId, `🔥 Site agora mostra <b>${negociando}</b> em negociação.\nO alerta vermelho avisa que o contador pode virar ${Math.max(0, e.total - e.vendidas - 1)} a qualquer momento.`, true);
        } else {
          await tgSend(chatId, `🤝 Em negociação agora: <b>${e.negociando || 0}</b>\n\n<i>Para mudar, mande: negociando 3</i>`, true);
        }
      } else if (texto.includes("estoque")) {
        const n = texto.match(/estoque\s+(\d{1,4})/);
        const e = await estoque(s);
        if (n) {
          const disp = parseInt(n[1], 10);
          const total = Math.max(e.total, e.vendidas + disp);
          await s.setJSON("estoque", { total, vendidas: total - disp, negociando: e.negociando || 0 });
          await tgSend(chatId, `✅ Agora o site mostra <b>${disp}</b> motos disponíveis.\n(de ${total} — ${total - disp} já saíram)`, true);
        } else {
          await tgSend(
            chatId,
            `📊 <b>ESTOQUE</b>\n🔵 Disponíveis no site: <b>${Math.max(0, e.total - e.vendidas)}</b>\n✅ Já saíram: <b>${e.vendidas}</b> de ${e.total}\n🤝 Em negociação: <b>${e.negociando || 0}</b>\n🕐 ${agoraCuiaba()}\n\n<i>Mudar disponíveis: estoque 45</i>\n<i>Mudar negociação: negociando 3</i>`,
            true
          );
        }
      } else if (texto.includes("acessos")) {
        const v = ((await s.get("visitas", { type: "json" })) as any) || { total: 0, dia: "", hoje: 0 };
        const e = await estoque(s);
        const { blobs: vendas } = await s.list({ prefix: "venda/reg/" });
        const hoje = v.dia === hojeCuiaba() ? v.hoje || 0 : 0;
        await tgSend(
          chatId,
          `📈 <b>ACESSOS AO SITE</b>\n👀 Hoje: <b>${hoje}</b>\n📊 Total: <b>${v.total || 0}</b>\n\n🔵 Disponíveis: <b>${Math.max(0, e.total - e.vendidas)}</b> de ${e.total}\n🤝 Em negociação: <b>${e.negociando || 0}</b>\n🎉 Vendas no mural: <b>${vendas.length}</b>\n🕐 ${agoraCuiaba()}`,
          true
        );
      } else if (texto.includes("fotos da landing")) {
        await s.setJSON(draftKey(chatId), { modo: "landing" });
        await tgSend(
          chatId,
          "📸 <b>Modo fotos da landing oficial.</b>\nManda as fotos das motos (sem legenda) — elas entram no carrossel \"As motos que te esperam\" da página principal na hora.\nPara apagar alguma, use o painel admin.",
          true
        );
      } else if (texto.includes("criar site")) {
        await s.setJSON(draftKey(chatId), { modo: "promo", motos: [] });
        await tgSend(
          chatId,
          "🛠️ <b>Vamos montar seu site de vendas!</b>\nMe manda cada moto como uma FOTO com a legenda neste formato:\n<code>CG 160 Titan | R$ 18.900 | Entrada R$ 1.000 | 36x de R$ 640</code>\n(pode mandar quantas quiser)\nQuando terminar, aperte ✅ Gerar página.",
          true
        );
      } else if (texto.includes("gerar")) {
        const draft = (await s.get(draftKey(chatId), { type: "json" })) as any;
        if (!draft?.motos?.length) {
          await tgSend(chatId, "Nenhuma moto no rascunho. Aperte 🛠️ Criar site e mande as fotos com legenda.", true);
        } else {
          const slug = gerarCodigo("", 6).slice(1).toLowerCase();
          await s.setJSON(`promo/site/${slug}`, { motos: draft.motos, criadoEm: new Date().toISOString() });
          await s.delete(draftKey(chatId));
          await tgSend(
            chatId,
            `✅ <b>Página no ar!</b>\n${url.origin}/promo.html?p=${slug}\n🏍️ ${draft.motos.length} moto(s) publicada(s).\nCompartilha esse link — cada interessado que clicar em "QUERO ESSA NO BOLETO" cai aqui no bot com nome e WhatsApp.`,
            true
          );
        }
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
        await tgSend(chatId, "Use os botões aqui embaixo 👇\n<i>Dica: para mudar o estoque, mande \"estoque 45\".</i>", true);
      }
      return json({ ok: true });
    }

    // ---------- CONFIG PÚBLICA (pixel etc.) ----------
    if (action === "config" && req.method === "GET") {
      return json({
        ok: true,
        pixel: Netlify.env.get("META_PIXEL_ID") || null,
        whats: Netlify.env.get("WHATSAPP_NUMERO") || null,
      });
    }

    // ---------- EMITIR VALE AVULSO (admin) ----------
    // /api/emitir?k=CHAVE&nome=Fulano%20de%20Tal&fone=65999999999
    if (action === "emitir" && req.method === "GET") {
      if (url.searchParams.get("k") !== ADMIN_KEY) return json({ ok: false, erro: "Chave inválida." }, 401);
      const nome = String(url.searchParams.get("nome") || "").trim().replace(/\s+/g, " ").slice(0, 80);
      const fone = normalizarFone(String(url.searchParams.get("fone") || ""));
      if (nome.length < 3) return json({ ok: false, erro: "Informe o nome: &nome=Fulano de Tal" }, 400);
      if (!fone) return json({ ok: false, erro: "WhatsApp inválido: &fone=65999999999" }, 400);

      // reaproveita o cadastro se o telefone já existir
      const ref = (await s.get(`fone/${fone}`, { type: "json" })) as { code: string } | null;
      let code = ref?.code || "";
      let lead: any = code ? await s.get(`lead/${code}`, { type: "json" }) : null;

      const cru = url.searchParams.get("json") === "1";
      const telaQR = (c: string) => Response.redirect(`${url.origin}/qr.html?c=${encodeURIComponent(c)}`, 302);

      if (lead?.voucher) {
        if (!cru) return telaQR(lead.code);
        return json({
          ok: true,
          jaTinha: true,
          nome: lead.nome,
          code: lead.code,
          vale: lead.voucher.code,
          usadoEm: lead.voucher.usadoEm ? agoraCuiaba(lead.voucher.usadoEm) : null,
          link: `${url.origin}/vale.html?v=${lead.voucher.code}`,
        });
      }

      if (!lead) {
        code = gerarCodigo("MOTO", 4);
        while (await s.get(`lead/${code}`, { type: "json" })) code = gerarCodigo("MOTO", 4);
        lead = { code, nome, fone, criadoEm: new Date().toISOString(), validado: null, voucher: null };
        await s.setJSON(`fone/${fone}`, { code });
      }

      let vcode = gerarCodigo("VALE50", 5);
      while (await s.get(`voucher/${vcode}`, { type: "json" })) vcode = gerarCodigo("VALE50", 5);
      const em = new Date().toISOString();
      lead.validado = { pos: null, em };
      lead.voucher = { code: vcode, valor: VALOR_VOUCHER, criadoEm: em, usadoEm: null };
      await s.setJSON(`lead/${lead.code}`, lead);
      await s.setJSON(`voucher/${vcode}`, { leadCode: lead.code });

      await tgNotify(
        s,
        `🎟️ <b>VALE EMITIDO NA MÃO</b>\n👤 ${lead.nome}\n📱 ${foneBonito(fone)}\n💰 <code>${vcode}</code> (R$ ${VALOR_VOUCHER})\n🕐 ${agoraCuiaba(em)}`
      );
      if (!cru) return telaQR(lead.code);
      return json({
        ok: true,
        jaTinha: false,
        nome: lead.nome,
        code: lead.code,
        vale: vcode,
        link: `${url.origin}/vale.html?v=${vcode}`,
      });
    }

    // ---------- ESTOQUE DE MOTOS ----------
    if (action === "estoque" && req.method === "GET") {
      await registrarVisita(s);
      const e = await estoque(s);
      return json({
        ok: true,
        total: e.total,
        vendidas: e.vendidas,
        disponiveis: Math.max(0, e.total - e.vendidas),
        negociando: e.negociando || 0,
      });
    }

    // ---------- MURAL DE VENDAS ----------
    if (action === "vendas" && req.method === "GET") {
      const { blobs } = await s.list({ prefix: "venda/reg/" });
      const ids = blobs.map((b) => b.key.slice(10)).sort().reverse().slice(0, 12);
      const vendas = await Promise.all(ids.map((id) => s.get(`venda/reg/${id}`, { type: "json" })));
      return json({ ok: true, vendas: vendas.filter(Boolean) });
    }

    // ---------- FOTOS DAS MOTOS ----------
    if (action === "fotos" && req.method === "GET") {
      const { blobs } = await s.list({ prefix: "foto/" });
      return json({ ok: true, ids: blobs.map((b) => b.key.slice(5)).sort().reverse() });
    }

    if (action === "foto" && req.method === "GET") {
      const id = (url.searchParams.get("id") || "").replace(/[^0-9]/g, "");
      const t = url.searchParams.get("t");
      const prefixo = t === "promo" ? "promo/foto/" : t === "venda" ? "venda/foto/" : "foto/";
      const res = await s.getWithMetadata(`${prefixo}${id}`, { type: "arrayBuffer" });
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

    // ---------- SITE DE VENDAS GERADO PELO BOT ----------
    if (action === "promo" && req.method === "GET") {
      const p = (url.searchParams.get("p") || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const site = (await s.get(`promo/site/${p}`, { type: "json" })) as any;
      if (!site) return json({ ok: false, erro: "Página não encontrada." }, 404);
      return json({ ok: true, motos: site.motos });
    }

    // ---------- INTERESSE EM MOTO (da página de vendas → Telegram) ----------
    if (action === "interesse" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const nome = String(body.nome || "").trim().replace(/\s+/g, " ").slice(0, 80);
      const fone = normalizarFone(String(body.fone || ""));
      if (nome.length < 3) return json({ ok: false, erro: "Digite seu nome completo." }, 400);
      if (!fone) return json({ ok: false, erro: "WhatsApp inválido. Use DDD + número. Ex: (65) 99999-9999" }, 400);
      const moto = String(body.moto || "").slice(0, 80);
      await s.setJSON(`interesse/${Date.now()}`, { nome, fone, moto, em: new Date().toISOString() });
      await tgNotify(
        s,
        `🎯 <b>INTERESSE EM MOTO</b>\n🏍️ ${moto}\n👤 ${nome}\n📱 ${foneBonito(fone)}\n🕐 ${agoraCuiaba()}\n👉 Chama agora: https://wa.me/${fone}`
      );
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
