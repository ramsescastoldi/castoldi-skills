---
name: dashboard-online-lumen
description: Cria, atualiza ou debuga o dashboard online de vendas multi-filial do Lumen Posto Club hospedado no Netlify (https://dashboard-lumen.netlify.app). Use quando o usuário (Ramsés) digitar "dashboard online", "atualizar dashboard online", "publicar dashboard", "dashboard netlify", "atualizar HTML do dashboard", "corrigir dashboard", "ajustar visual do dashboard online", ou variações sobre o dashboard publicado na web (não o sob demanda da skill dashboard-vendas). Cobre: gerar/regenerar o index.html com dados ao vivo da API do Apps Script, ajustes visuais, troca de cores/layout, adição de novos componentes, correção do Apps Script (formato de datas), diagnóstico de erros (CORS, Hooks, CDN, redirect Google, sintaxe), instruções de redeploy no Netlify. NÃO cobre: criação inicial da skill, configuração do Apps Script base (já está funcionando) — isso é responsabilidade da skill dashboard-vendas.
license: Proprietária - uso interno Lumen Posto Club.
---

# Dashboard Online Multi-Filial — Lumen Posto Club

## Quando usar esta skill

Acione esta skill SEMPRE que o usuário pedir:
- "atualizar dashboard online"
- "publicar dashboard"
- "novo deploy do dashboard"
- "mudar visual do dashboard online"
- "adicionar gráfico no dashboard"
- "dashboard netlify não funciona"
- "debugar dashboard publicado"
- "trocar cores do dashboard online"
- "corrigir dashboard" (quando o contexto for o dashboard online)
- "datas erradas no dashboard"
- "heatmap todo verde no dashboard"
- ou qualquer variação envolvendo o dashboard hospedado em `dashboard-lumen.netlify.app`

**NÃO confunda com a skill `dashboard-vendas`** — aquela é a skill que roda sob demanda no chat compilando emails. Esta é especificamente sobre o dashboard online publicado.

## Contexto do projeto

O usuário (Ramsés) tem:
- Uma planilha Google Sheets chamada **"Base Master Vendas — Lumen"** com aba `Vendas`
- Um Apps Script implantado como Web App público (URL atual: `https://script.google.com/macros/s/AKfycby4ID9LBmCjLNVgbKb4btcq1NCXNIx8OudWEKOc3Yj4xagJiJi4QZCMulEzjZEGYKQN/exec`)
- Um site Netlify chamado `dashboard-lumen` ([dashboard-lumen.netlify.app](https://dashboard-lumen.netlify.app))
- Apps Script importa automaticamente relatórios diários por email
- Dashboard online consome a API e renderiza tudo
- 3 filiais ativas: 301-CELEIRO, 401-DIAMANTINO, 502-TRUCK
- 5 produtos: Etanol, Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500

## Stack tecnológica

- **HTML único** com React via CDN (sem build)
- **Bibliotecas** carregadas via `cdn.jsdelivr.net` (NÃO usar `unpkg.com` — já deu problema)
- **React 18.2.0** + **ReactDOM 18.2.0**
- **PropTypes 15.8.1** (Recharts depende — carregar ANTES da Recharts)
- **Recharts 2.12.7** (caminho `/umd/Recharts.js`, SEM `.min`)
- **Babel Standalone 7.23.10** (pra processar JSX inline)
- **Hospedagem:** Netlify (drag-and-drop manual)

## Fluxo obrigatório (executar nesta ordem)

### Passo 1 — Identificar a intenção exata

Antes de gerar código, descubra qual o pedido:

| Tipo de pedido | Ação |
|----------------|------|
| Ajuste visual (cores/tamanhos) | Editar template e regenerar HTML |
| Adicionar componente novo | Estender template com novo Card |
| Erro no dashboard publicado | Pedir print do Console (F12), diagnosticar |
| Atualizar URL da API | Alterar variável `API_URL` (CUIDADO COM `=`) |
| Datas/período aparecem como `-` ou ano puro | **Corrigir Apps Script** (problema de raiz) + atualizar HTML pra parsear datas |
| Heatmap todo verde sem variação | Trocar fórmula fixa `v/30` por gradiente proporcional ao min/max real |
| Não está funcionando | Seguir checklist de diagnóstico (ver `references/troubleshooting.md`) |

### Passo 2 — Usar o template base

O template completo e validado está em `references/template_index_html.txt`. **NUNCA escreva o HTML do zero** — sempre parta deste template, que já contém todas as correções de bugs aprendidas.

Esse template **JÁ INCLUI**:
- ✅ Parser de datas robusto (`parseDate` que aceita ISO, BR, e Date)
- ✅ Campo `DataNormalizada` calculado em `dadosBrutos` para garantir datas válidas
- ✅ Heatmap com gradiente proporcional (vermelho → amarelo → verde) baseado no min/max REAL dos dados
- ✅ Fallback gracioso quando datas estão inválidas (mensagem amigável em vez de gráfico vazio)
- ✅ Período no header com formato DD/MM/YY
- ✅ Todos os hooks ANTES de returns condicionais
- ✅ Subtítulo do heatmap mostra a faixa real (ex: "Faixa: 12.06% a 24.58%")

### Passo 3 — Aplicar customizações solicitadas

**Cores (manter consistência Lumen):**
- Cor de destaque principal: `#C8102E` (vermelho combustível)
- Cor de fundo: `#0F1419`
- Cor de cards: `#1A2330`
- Verde lucro: `#2D7D46`
- Azul: `#1B4D8C`

**Paleta de filiais:**
```javascript
const PALETA_FILIAIS = ["#C8102E", "#1B4D8C", "#2D7D46", "#E89923", "#7C3AED", "#06B6D4", "#DC2626", "#059669"];
```

**URL da API atual:**
```javascript
const API_URL = "https://script.google.com/macros/s/AKfycby4ID9LBmCjLNVgbKb4btcq1NCXNIx8OudWEKOc3Yj4xagJiJi4QZCMulEzjZEGYKQN/exec";
```

⚠️ **Cuidado ao trocar URL:** sempre manter o `=` entre `API_URL` e a string. Erro comum do usuário: cola URL e apaga o `=` por acidente, gerando `SyntaxError: Missing initializer in const declaration`. **Sempre fazer a edição da URL via ferramenta de edição (sed/str_replace), não dependendo de cópia manual.**

### Passo 4 — Validar regras críticas (checklist obrigatório)

Antes de entregar o HTML, confirme:

- [ ] CDN é `cdn.jsdelivr.net`, NÃO `unpkg.com`
- [ ] Recharts é versão `2.12.7` com caminho `/umd/Recharts.js` (sem `.min`)
- [ ] PropTypes carregado ANTES da Recharts no HTML
- [ ] Babel é versão `7.23.10`
- [ ] URL da API é `script.google.com/macros/s/.../exec` (NÃO `script.googleusercontent.com`)
- [ ] Linha do `API_URL` tem `=` entre o nome e a string
- [ ] **TODOS os useMemo estão ANTES dos returns condicionais** (regras dos Hooks do React)
- [ ] `dadosBrutos` é definido com `useMemo` E inclui `DataNormalizada` calculada
- [ ] Função `parseDate` está presente e trata múltiplos formatos
- [ ] Heatmap usa gradiente proporcional ao min/max real (não fórmula fixa)
- [ ] Período usa `DataNormalizada`, não `Data` direto
- [ ] Timeline usa `DataNormalizada`, não `Data` direto
- [ ] Tem fallback de erro pra cada hipótese (URL não configurada, CORS, biblioteca não carregada, datas inválidas)
- [ ] `fetch()` usa `redirect: 'follow'` pra tratar redirect do Google
- [ ] Parse JSON é manual com try/catch (alguns ambientes retornam content-type errado)

### Passo 5 — Entregar arquivo + instruções de deploy

Salve o arquivo em `/mnt/user-data/outputs/index.html` e use `present_files`.

Após entregar, dê instruções concisas de redeploy:

> "Pra publicar:
> 1. Painel Netlify → site dashboard-lumen → aba **Deploys**
> 2. Arraste o `index.html` na área de drag-and-drop
> 3. Aguarde 'Published' (~30s)
> 4. Acesse `https://dashboard-lumen.netlify.app` em **janela anônima** (Ctrl+Shift+N) pra evitar cache"

### Passo 6 — Quando precisar corrigir o Apps Script

Se o problema for de raiz (datas como ano puro, campos faltando), além do HTML, é necessário corrigir o `doGet()` do Apps Script. Ver `references/apps_script_correcoes.md` para o código pronto.

⚠️ **CRÍTICO:** após editar o Apps Script, o usuário precisa criar **NOVA implantação** (não basta salvar). E gera-se uma URL NOVA que precisa ir pro `index.html`.

## Regras de diagnóstico de erros

Se o usuário disser que algo não está funcionando, NÃO chute soluções — peça o **erro do Console (F12)** primeiro. Os erros mais comuns e suas correções estão em `references/troubleshooting.md`.

### Princípio de diagnóstico

1. **Sempre pergunte primeiro:** "manda print do Console (F12 → aba Console → F5)"
2. **Identifique o erro EXATO** antes de propor solução
3. **NÃO refaça o arquivo todo** se for problema pontual — corrija só a linha específica
4. **Confirme as fontes possíveis de bug:**
   - URL da API errada (formato `googleusercontent` vs `google.com`)
   - Sintaxe quebrada por colagem (`=` faltando, aspas a mais)
   - Biblioteca CDN não carregou (`Recharts is not defined`)
   - Hooks do React fora de ordem (`Rendered fewer hooks`)
   - Datas no formato errado vindas do Apps Script

## Comportamentos importantes

- **Seja transparente:** se você não sabe a causa exata do erro, peça mais informação ao invés de chutar
- **Vá devagar:** o usuário não é desenvolvedor profissional — explique cada passo em português claro
- **Use printscreens estratégicas:** sempre peça F12 → Console → print quando há erro
- **NÃO sugira mudar de stack:** o usuário escolheu HTML+Netlify+Apps Script. Trabalhe DENTRO dessa stack
- **NÃO reescreva o template do zero** se for ajuste pontual — copie o template e mude só o que precisa
- **Sempre teste mentalmente o fluxo de hooks** antes de entregar — usar a regra "todos os useMemo antes de returns condicionais"
- **Quando trocar URL da API:** sempre faça você mesmo via `str_replace`/edição direta, não dependa do usuário copiar/colar (alto risco de erro de sintaxe)
- **Sempre valide o template** antes de entregar — checar checklist do Passo 4

## Limitações conhecidas (e soluções)

| Problema | Causa | Solução já validada |
|----------|-------|---------------------|
| Dashboard fica em "Inicializando..." | Recharts não carregou | Usar `cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.js` |
| "Erro ao carregar dados" | URL da API errada (`script.googleusercontent.com`) | Pegar URL correta em **Apps Script → Implantar → Gerenciar implantações** |
| "Cannot read properties of undefined (reading 'oneOfType')" | PropTypes não carregou antes da Recharts | Garantir que PropTypes vem ANTES da Recharts no HTML |
| "Rendered fewer hooks than expected" | useMemo depois de return condicional | Mover TODOS os useMemo para ANTES de qualquer if/return |
| "SyntaxError: Missing initializer in const declaration" | Usuário apagou o `=` ao colar URL | Sempre fazer a edição da URL via tooling, não dependendo de cópia manual |
| CORS errors | Apps Script não público | Implantar com "Quem tem acesso: Qualquer pessoa" |
| Mudou código mas Netlify mostra antigo | Cache do navegador | Testar em janela anônima (Ctrl+Shift+N) |
| Período aparece como `-` ou `/A/` | Apps Script retornando datas como ano puro (ex: 2026) | Atualizar `doGet()` no Apps Script com formatação `Utilities.formatDate()` + nova implantação |
| Heatmap todo verde sem variação visual | Fórmula fixa `intensidade = v/30` quando todos os dados estão na mesma faixa | Usar gradiente proporcional ao min/max real dos dados |
| Gráfico Evolução Diária com pontos isolados | Mesma causa: datas inválidas no JSON | Mesma solução: corrigir Apps Script + parser robusto no HTML |

## Referências disponíveis

- `references/template_index_html.txt` — HTML completo validado (versão final, com gradiente do heatmap + parser de datas robusto)
- `references/troubleshooting.md` — Guia de diagnóstico dos erros mais comuns + correções
- `references/customization_guide.md` — Como modificar cores, layout e adicionar componentes
- `references/api_data_schema.md` — Schema do JSON retornado pela API e campos disponíveis
- `references/apps_script_correcoes.md` — Código pronto da função `doGet()` corrigida com formatação de datas
