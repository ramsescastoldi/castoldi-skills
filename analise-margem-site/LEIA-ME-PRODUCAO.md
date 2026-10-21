# PRODUÇÃO — Site Margem (Ramsés Castoldi)

## Como o site está no ar (desde 19/10/2026)

O site oficial **https://margem.lumenclubpainel.com.br** é servido por um
**Cloudflare Worker** chamado `margem` (não mais pela Netlify — o pipeline de
importação da Netlify publicava uma página errada, o "wrapper" do artifact).

Como funciona:

- O `index.html` inteiro fica guardado no **KV da Cloudflare** (namespace
  `margem-site`), dividido em pedaços base64 (`html_0` … `html_4`, ordem na
  chave `manifest`).
- O Worker `margem` monta a página a partir do KV e serve em qualquer caminho.
- O mesmo Worker responde a IA do diagnóstico em `POST /api/diagnostico`
  (matemática determinística + análise com `claude-opus-5-5`).
- `/diagnostico` redireciona para `/?pg=diagnostico` (formulário pós-compra).

Endereços ativos:

- Oficial: `https://margem.lumenclubpainel.com.br` (formulário: `/?pg=diagnostico`)
- Alternativo: `https://margem.ramses-79e.workers.dev`

## O que tem nesta pasta

| Arquivo | O que é |
|---|---|
| `index.html` | O site inteiro: landing + formulário do diagnóstico (página única) |
| `diagnostico.html` | Redirecionamento do caminho antigo pra `/?pg=diagnostico` (uso local) |
| `_redirects` | Regra antiga da Netlify (não é mais usada em produção) |
| `worker/margem-worker.js` | O código do Worker `margem` em produção (site + IA) |
| `rodar-local.command` | Clique duplo no Mac → abre o site em `http://localhost:8787` |

## Rodar localmente (Mac)

Clique duplo em `rodar-local.command`. (Se o Mac bloquear: botão direito → Abrir.)
O site abre em `http://localhost:8787`. Tudo funciona localmente — checkouts,
formulário e a prévia por IA (que chama o Worker na nuvem).

## A IA na nuvem (uma configuração única)

O Worker `margem` foi recriado, então o segredo precisa ser cadastrado de novo:

1. Cloudflare → Workers & Pages → Worker **`margem`** → Settings →
   **Variables and Secrets** → Add → tipo **Secret**
2. Nome: `ANTHROPIC_API_KEY` · Valor: sua chave da Anthropic
   (crie em **console.anthropic.com** → API Keys)

Sem a chave o formulário continua funcionando: a prévia sai calculada pela
matemática do Worker, só sem o texto da IA.

## Publicar atualização no site

Edite o `index.html` desta pasta e peça no chat do Claude:
**"publica a nova versão do site margem"** — o Claude regrava os pedaços no KV
da Cloudflare e o site atualiza (cache de ~2 minutos).

## Endereços e configurações vivas

- **Mercado Pago — URLs de retorno** (configure em cada link de pagamento):
  - R$ 9,97 → `https://margem.lumenclubpainel.com.br/?pg=diagnostico&p=997`
  - R$ 49,66 → `https://margem.lumenclubpainel.com.br/?pg=diagnostico&p=4966`
- Checkouts: 9,97 `mpago.la/2w1tYxX` · 49,66 `mpago.li/2NLByZA` · Call: urgência R$ 297 `mpago.la/19swLrY` · cheio R$ 497 `mpago.li/2ej3uUc`
  (constantes `CHECKOUT` no topo do script do `index.html`)
- Respostas do formulário: painel Netlify → projeto **margem-castoldi-antigo** → aba Forms
  (NÃO delete esse projeto; configure lá a notificação por e-mail)
- Leads/avisos: CRM via webhook n8n `crm-lead-add`
