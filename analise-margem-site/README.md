# Análise de Margem — analise.lumenclubpainel.com.br

Landing page pública de captação de leads do **Lumen Posto Club**.

A página faz uma chamada direta sobre o problema de margem: mostra a **margem de
referência da região** do revendedor (preço médio de bomba ANP − custo médio de
distribuidora, os mesmos dados do Monitor), pergunta **"você tem essa margem?"**,
calcula quanto ele está deixando na mesa por mês, e converte com o CTA
**"Quer mudar esse jogo? Entre para o Lumen Posto Club"** + formulário de
nome / e-mail / WhatsApp que cai direto na lista de Leads do CRM.

## Arquitetura

```
index.html (HTML único, sem build)
   │
   ├─ dados: fetch em https://monitor.lumenclubpainel.com.br/data.json
   │         (fallback: snapshot embutido no próprio HTML, const FALLBACK)
   │
   └─ lead:  POST x-www-form-urlencoded (sem preflight, mode no-cors)
             → https://n8n.srv1662375.hstgr.cloud/webhook/crm-lead-add
             → workflow "crm-leads" valida e cria página no Notion
             → aparece na aba Leads do crm.lumenclubpainel.com.br
```

Campos enviados ao webhook: `nome`, `email`, `whatsapp` (só dígitos, o workflow
prefixa 55), `cargo = "Site Análise de Margem"` (serve de tag de origem no CRM)
e `origem = "direct"`.

## O que precisa ser configurado (uma vez)

1. **Publicar o site** — criar projeto no Cloudflare Pages (mesmo padrão do CRM)
   e apontar o DNS de `analise.lumenclubpainel.com.br` pra ele:

   ```bash
   CLOUDFLARE_API_TOKEN=<token-cf-pages> CLOUDFLARE_ACCOUNT_ID=79e04a87e429f8c73f3d2384fa96f2aa \
     npx wrangler@4 pages deploy analise-margem-site --project-name=analise-margem --branch=main
   ```

   (Netlify drag-and-drop também funciona — a pasta é 100% estática.)

2. **CORS do Monitor** — pro site puxar os dados AO VIVO, o
   `monitor.lumenclubpainel.com.br/data.json` precisa responder com
   `Access-Control-Allow-Origin: *`. Há um PR no repo
   `monitor-precos-lumen-painel` adicionando isso no `_headers`.
   **Sem esse header o site continua funcionando** — usa o snapshot embutido.

3. **(Opcional) n8n** — o webhook `crm-lead-add` tem `allowedOrigins` restrito a
   `https://crm.lumenclubpainel.com.br`. O envio funciona mesmo assim (POST
   urlencoded simples não dispara preflight e a resposta é tratada como opaca),
   mas se quiser resposta legível/confirmável no navegador, adicione
   `https://analise.lumenclubpainel.com.br` no allowedOrigins do node
   "Webhook Lead Add" do workflow `crm-leads` (`p3P0xMU60CZ0Tr7P`).

## Atualizar o snapshot embutido (fallback)

O snapshot é só um seguro pra quando o fetch do Monitor falhar. Pra renovar:

1. Baixe `https://monitor.lumenclubpainel.com.br/data.json`
2. Reduza para as chaves `atualizado_em`, `semana_referencia`,
   `distribuicao_ultima_data`, `kpis`, `agregados_estado`, `distribuicao_estado`
3. Substitua o objeto na linha `const FALLBACK = {...};` do `index.html`

(Ou peça no Cowork: "atualiza o snapshot do site de análise de margem".)

## Regras de dados usadas na página

- Margem de referência = `distribuicao_estado[UF].margem[produto]` do Monitor.
- Estado sem cotação de distribuidora (ou margem ≤ 0, dado sujo): usa a
  **mediana nacional** dos estados monitorados e avisa o visitante.
- Calculadora: `(margem_ref − margem_informada) × litros/mês` = dinheiro na mesa.
