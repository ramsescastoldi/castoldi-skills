# PRODUÇÃO LOCAL — Site Margem (Ramsés Castoldi)

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `index.html` | O site inteiro: landing de venda + formulário do diagnóstico (página única) |
| `diagnostico.html` | Redirecionamento do caminho antigo pra `/?pg=diagnostico` |
| `_redirects` | Regra da Netlify: qualquer caminho desconhecido cai na página (mata os 404) |
| `worker/margem-worker.js` | A **IA na nuvem**: cola no Worker `margem` da Cloudflare |
| `rodar-local.command` | Clique duplo no Mac → abre o site em `http://localhost:8787` |

## Rodar localmente (Mac)

Clique duplo em `rodar-local.command`. (Se o Mac bloquear: botão direito → Abrir.
Se pedir permissão de execução: no Terminal, `chmod +x rodar-local.command`.)

O site abre em `http://localhost:8787`. Tudo funciona localmente —
checkouts do Mercado Pago, formulário (envia pro Netlify Forms do projeto
reserva + CRM) e a prévia por IA (chama o Worker na nuvem).

## A IA na nuvem (uma configuração única)

1. Cloudflare → Workers & Pages → Worker **`margem`** → **Edit code**
2. Apague tudo e cole o conteúdo de `worker/margem-worker.js` → **Deploy**
3. Settings → **Variables and Secrets** → Add → tipo **Secret**:
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: sua chave de API da Anthropic (crie em **console.anthropic.com** → API Keys)
4. Pronto. O formulário passa a mostrar a "⚡ Prévia instantânea do diagnóstico"
   calculada pela IA (modelo `claude-opus-5-5`, ~R$ 0,15 por diagnóstico).

A matemática da margem (bruta, líquida, resultado) é calculada no código, de forma
determinística — a IA entra na análise, no benchmark do setor e na recomendação.

## Publicar atualização no site oficial

O domínio `margem.lumenclubpainel.com.br` serve o projeto Netlify `margem-castoldi`.
Pra atualizar: arraste **esta pasta inteira** (ou um zip dela, sem a subpasta worker
se preferir) na aba Deploys: https://app.netlify.com/projects/margem-castoldi/deploys
— ou peça no chat do Claude ("publica a nova versão do site margem").

## Endereços e configurações vivas

- Site oficial: `https://margem.lumenclubpainel.com.br` (formulário: `/?pg=diagnostico`)
- Alternativos: `https://margem-castoldi.netlify.app` · `https://margem.ramses-79e.workers.dev`
- **Mercado Pago — URLs de retorno** (configure em cada link de pagamento):
  - R$ 9,97 → `https://margem.lumenclubpainel.com.br/?pg=diagnostico&p=997`
  - R$ 49,66 → `https://margem.lumenclubpainel.com.br/?pg=diagnostico&p=4966`
- Checkouts: 9,97 `mpago.la/2w1tYxX` · 49,66 `mpago.li/2NLByZA` · Call 297 `mpago.li/2ej3uUc`
  (constantes `CHECKOUT` no topo do script do `index.html`)
- Respostas do formulário: painel Netlify → projeto **margem-castoldi-antigo** → aba Forms
  (não delete esse projeto; configure lá a notificação por e-mail)
- Leads/avisos: CRM via webhook n8n `crm-lead-add`
