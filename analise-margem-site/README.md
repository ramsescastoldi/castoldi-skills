# Margem Real — Ramsés Castoldi (analise.lumenclubpainel.com.br)

Landing page do posicionamento **"especialista em MARGEM para qualquer negócio"**
(varejo e serviços), com escada de produtos (boi de piranha):

| Degrau | Preço | Entrega |
|---|---|---|
| Diagnóstico-relâmpago | grátis | leitura inicial no WhatsApp (form → CRM) |
| Margem Real | R$ 9,97 | margem real da empresa + benchmark do setor via IA |
| Diagnóstico de Margem | R$ 49,66 | + curva de upside + plano de ação + desbloqueia agenda da call |
| Call de Margem 1:1 | R$ 387 | 1h diagnóstico+mentoria, agendamento manual mediante pagamento |

Na call é ofertada a mentoria high ticket. Tese da copy: empresa boa tem margem,
desconto é desespero; a maioria perde ~28,66% de margem por não conhecer o
benchmark do mercado (calculadora mostra a perda anual a partir do faturamento).

**Checkout:** os links de pagamento ficam na const `CHECKOUT` no topo do
`<script>` do `index.html`. Enquanto vazios, os botões de compra marcam o
interesse do lead e caem no formulário (nenhum clique se perde).

## Arquitetura

```
index.html (HTML único, sem build, sem dependência externa de dados)
   │
   ├─ calculadora de perda: faturamento × margem típica do setor × 28,66%
   │  (faixas por segmento na const SEGMENTOS; índice na const INDICE_PERDA)
   │
   ├─ checkout: const CHECKOUT {997, 4966, 387} — links Kiwify/outro.
   │  Vazio → botão marca interesse e envia pro formulário.
   │
   └─ lead:  POST x-www-form-urlencoded (sem preflight, mode no-cors)
             → https://n8n.srv1662375.hstgr.cloud/webhook/crm-lead-add
             → workflow "crm-leads" valida e cria página no Notion
             → aparece na aba Leads do crm.lumenclubpainel.com.br
```

Campos enviados ao webhook: `nome`, `email`, `whatsapp` (só dígitos, o workflow
prefixa 55), `cargo = "Margem | <segmento> | <faixa fat> | <interesse>"` (tag de
origem/qualificação no CRM) e `origem = "direct"`.

## Status do deploy

✅ **NO AR** em https://analise-margem-lumen.netlify.app (Netlify, projeto
`analise-margem-lumen`, time Lumen — o mesmo de calculadora.lumenpostoclub.com.br).

**Pra atualizar o site:** edite o `index.html` aqui, mergeie na `main`, e
publique o arquivo novo no projeto Netlify (drag-and-drop do `index.html` na aba
Deploys, ou peça no Cowork "republica o site de análise de margem").

Obs.: existe um projeto vazio `analise-margem-lumen-apagar` no Netlify (sobra da
criação) — pode deletar na UI.

## O que precisa ser configurado (uma vez)

1. **Domínio próprio** — duas opções:
   - `analise.lumenpostoclub.com.br` (recomendado — esse domínio já roda no
     Netlify, ex.: calculadora): Netlify → projeto `analise-margem-lumen` →
     Domain settings → Add domain alias.
   - `analise.lumenclubpainel.com.br`: além do Add domain no Netlify, criar no
     Cloudflare o CNAME `analise` → `analise-margem-lumen.netlify.app`
     (modo "DNS only").

2. **Links de checkout** — criar os produtos (R$ 9,97 / R$ 49,66 / R$ 387)
   na Kiwify (ou outro) e colar as URLs na const `CHECKOUT` do `index.html`.

3. **(Opcional) n8n** — o webhook `crm-lead-add` tem `allowedOrigins` restrito a
   `https://crm.lumenclubpainel.com.br`. O envio funciona mesmo assim (POST
   urlencoded simples não dispara preflight e a resposta é tratada como opaca),
   mas se quiser resposta legível/confirmável no navegador, adicione
   `https://analise.lumenclubpainel.com.br` no allowedOrigins do node
   "Webhook Lead Add" do workflow `crm-leads` (`p3P0xMU60CZ0Tr7P`).

