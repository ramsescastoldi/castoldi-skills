# Passagem de bastão — site Margem (14/11/2026)

Resumo para continuar o trabalho em outra instância do Claude. **A fonte da verdade é a produção no Cloudflare, não este repositório** (o funil v2 foi construído direto lá por outra sessão e não está commitado aqui).

## O que está no ar — https://margem.lumenclubpainel.com.br

- **Funil v2 "Teste da Margem"**: quiz em formato de conversa de WhatsApp → diagnóstico bloqueado → checkout **R$ 47,90** (de R$ 197) + escada de 4 upsells de R$ 9,87 (planilha, plano 21 dias, plano de ação, 21 formas de agregar valor).
- **Checkout via API do Mercado Pago** (`/api/checkout`, preferências dinâmicas), webhook de venda (`/api/mp-webhook`) com aviso no **Telegram** e e-mail de acesso via **Gmail OAuth**.
- Pós-compra: formulário `/?pg=diagnostico` → `/api/relatorio` gera relatório completo (`/relatorio/{id}`), envia por e-mail; página de acesso `/acesso` recupera compra por payment_id ou e-mail.
- Números em 14/11: **34 testes concluídos, 5 vendas registradas**.

## O que EU fiz hoje (14/11) — já em produção e testado

1. **Contador de cliques**: todo clique no site vira registro no KV (`clk:{data Cuiabá}:{id}:{aleatório}`, TTL 90 dias).
   - Página manda `navigator.sendBeacon('/api/click', id)`; ids: `pv-funil` (pageview), `aulao-topo`, `chip`, `avancar`, `buy`, `escada-item`, `nao-sei`, `back`.
   - **`GET /api/stats`** → JSON com totais, por dia, testes concluídos e vendas registradas.
2. **Oferta do AULÃO R$ 997** (ao vivo 01/12 terça às 19h, 3 horas, turma de 10 — venda, compra, marketing e estratégias de vendas):
   - Faixa azul no topo do funil (`.aulao-top`) → **`GET /api/checkout-aulao?o=topo`** cria preferência MP de R$ 997 e redireciona (testado: abre o checkout do MP).
   - Upsell do aulão no **relatório entregue** (seção 5, antes da call 1:1 → `?o=relatorio`), no **card da página /acesso** (`?o=acesso`) e no **e-mail de boas-vindas** (`?o=email`) — o `?o=` identifica a origem da venda.
   - Webhook reconhece `external_reference` começando com `aulao|`: registra `venda_{id}`, avisa no Telegram ("🎓 VENDA DO AULÃO") e manda e-mail de confirmação de vaga.
3. **Rotina de verificação a cada 6 horas** (scheduled task na conta): confere site no ar, lê /api/stats, propõe melhorias; só pode regenerar copy com justificativa em dados; **nunca** mexe em preços/links de pagamento.

## Estado técnico (para editar com segurança)

- Worker: `margem` · compatibility_date `2026-10-01` · bindings: KV `MARGEM_SITE` (namespace `e84904763a124333aa0583a5a0fd427a`) + secrets `MP_CLIENT_ID/SECRET`, `TELEGRAM_BOT/CHAT`, `GOOGLE_CLIENT_ID/SECRET`, `GMAIL_USER`, `GMAIL_REFRESH_TOKEN`.
- HTML do site no KV: chave **`html_aulao_0`** (base64 de 30.623 bytes, FNV-1a `e63d5fc6`); `manifest` e `manifest_v2` = `html_aulao_0`. Versão anterior preservada em `html_v2_4` (rollback: gravar `html_v2_4` no `manifest`).
- Worker atual: 44.229 bytes, FNV-1a `2dbbf081`. Formulário do diagnóstico: `manifest_diag` → `diag_3`.
- Chaves KV: `clk:*` cliques · `venda_*` vendas · `rel_*`/`relpg_*` relatórios · `contador_testes` · `lim_*` rate-limit de e-mail.
- **Protocolo de edição seguro** (evita corromper produção): baixar valor do KV/código do worker pela API → conferir FNV-1a → editar por âncoras de texto (split/join, exigindo âncora única) → regravar; worker se redeploya com multipart PUT usando `keep_bindings: ["secret_text","kv_namespace"]`. Nunca reescrever arquivo inteiro de memória.

## Regras do dono (Ramsés)

- O importante é **VENDER A OFERTA** do aulão (R$ 997, 01/12 às 19h, 10 vagas); entrega do conteúdo ele resolve depois.
- Nunca alterar preços nem links de pagamento sem pedido explícito dele.
- Amanhã ele manda ideias de conteúdo para os produtos e para o aulão (melhorar material entregue).

## Pendências

- [ ] Ideias de conteúdo de amanhã → melhorar material entregue (upsells, relatório).
- [ ] Link da sala do aulão (entra no e-mail de confirmação e no grupo do WhatsApp antes de 01/12).
- [ ] Sincronizar este repositório com os fontes de produção (baixar via API e commitar).
- [ ] Acompanhar /api/stats: CTR da faixa do aulão (`aulao-topo` ÷ `pv-funil`) e funil (chip → avancar → buy).
