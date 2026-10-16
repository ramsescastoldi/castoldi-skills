# Guia de diagnóstico — Dashboard Online Lumen

Regra número 1: **NÃO chute soluções.** Peça primeiro o erro exato:

> "Manda print do Console: F12 → aba Console → F5 pra recarregar → print da tela."

Com o erro em mãos, localize-o na lista abaixo e aplique SÓ a correção indicada
(não reescreva o arquivo inteiro por causa de um problema pontual).

---

## 1. Dashboard travado em "Inicializando…"

**Sintoma no Console (F12):**
```
Uncaught ReferenceError: Recharts is not defined
```
(ou nenhum erro, mas a tela mostra "Não consegui carregar as bibliotecas")

**Causa:** a Recharts não carregou — CDN errada (unpkg), caminho errado
(`.min` no fim) ou versão diferente de 2.12.7.

**Correção passo a passo:**
1. Abrir o `index.html` e conferir a linha da Recharts. Ela DEVE ser exatamente:
   ```html
   <script crossorigin src="https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.js"></script>
   ```
2. Conferir: é `cdn.jsdelivr.net` (nunca `unpkg.com`), é `2.12.7`, o caminho é
   `/umd/Recharts.js` **sem** `.min`.
3. Salvar, arrastar de novo no Netlify (aba Deploys), testar em janela anônima.

---

## 2. "Erro ao carregar dados" / tela de erro de API

**Sintoma no Console (F12):**
```
Failed to fetch
```
ou a tela do dashboard diz "A API respondeu, mas não veio JSON".

**Causa:** URL da API errada — o clássico é colar a URL
`script.googleusercontent.com/...` (URL interna de redirect) em vez da URL de
implantação `script.google.com/macros/s/.../exec`.

**Correção passo a passo:**
1. Abrir o Apps Script da planilha → **Implantar → Gerenciar implantações**.
2. Copiar a URL do Web App (começa com `https://script.google.com/macros/s/` e
   termina em `/exec`).
3. Editar a linha `const API_URL = "...";` no `index.html` — **via ferramenta de
   edição (str_replace), nunca pedindo pro usuário colar na mão**.
4. Redeploy no Netlify + teste em janela anônima.

---

## 3. "Cannot read properties of undefined (reading 'oneOfType')"

**Sintoma no Console (F12):**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'oneOfType')
```

**Causa:** PropTypes não carregou ANTES da Recharts (a Recharts UMD depende do
global `PropTypes`).

**Correção passo a passo:**
1. No `<head>`, garantir esta ordem exata de `<script>`:
   React → ReactDOM → **PropTypes** → **Recharts** → Babel.
2. A linha do PropTypes deve ser:
   ```html
   <script crossorigin src="https://cdn.jsdelivr.net/npm/prop-types@15.8.1/prop-types.min.js"></script>
   ```
3. Redeploy + janela anônima.

---

## 4. "Rendered fewer hooks than expected"

**Sintoma no Console (F12):**
```
Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
```

**Causa:** algum `useMemo`/`useState`/`useEffect` foi adicionado DEPOIS de um
return condicional (ex: depois do `if (carregando) return ...`). Costuma
acontecer quando se adiciona um gráfico novo copiando o `useMemo` para perto do
JSX.

**Correção passo a passo:**
1. Abrir o componente `App` e localizar o comentário
   `RETURNS CONDICIONAIS — só DAQUI PRA BAIXO`.
2. Mover TODO hook que esteja abaixo desse ponto para o bloco de hooks no topo.
3. Regra permanente: **hooks sempre no topo, returns condicionais sempre depois.**

---

## 5. "SyntaxError: Missing initializer in const declaration"

**Sintoma no Console (F12):**
```
Uncaught SyntaxError: Missing initializer in const declaration
```

**Causa:** o `=` da linha `const API_URL = "...";` foi apagado sem querer ao
colar a URL nova (erro clássico de colagem manual).

**Correção passo a passo:**
1. Localizar a linha do `API_URL` e restaurar o formato completo:
   ```javascript
   const API_URL = "https://script.google.com/macros/s/.../exec";
   ```
2. Conferir também aspas duplicadas ou faltando no fim.
3. Daqui pra frente: troca de URL é SEMPRE feita pelo Claude via edição direta,
   nunca por copiar/colar do usuário.

---

## 6. Erros de CORS

**Sintoma no Console (F12):**
```
Access to fetch at 'https://script.google.com/...' from origin 'https://dashboard-lumen.netlify.app'
has been blocked by CORS policy
```

**Causa:** a implantação do Apps Script não está pública.

**Correção passo a passo:**
1. Apps Script → **Implantar → Gerenciar implantações → editar (lápis)**.
2. Em "Quem tem acesso", selecionar **"Qualquer pessoa"** (não "Qualquer pessoa
   com Conta do Google").
3. Criar **NOVA implantação** (não basta salvar!). Isso gera **URL NOVA**.
4. Atualizar o `API_URL` no `index.html` com a URL nova + redeploy no Netlify.

---

## 7. Mudei o código mas o site mostra a versão antiga

**Sintoma:** nenhum erro no Console — o site simplesmente está desatualizado.

**Causa:** cache do navegador.

**Correção passo a passo:**
1. Confirmar no painel do Netlify que o deploy novo está "Published".
2. Abrir `https://dashboard-lumen.netlify.app` em **janela anônima**
   (Ctrl+Shift+N).
3. Se na anônima estiver certo, é só cache local: Ctrl+F5 na janela normal.

---

## 8. Período aparece como `-` ou `/A/` (datas quebradas)

**Sintoma no Console:** sem erro de JS; a tela mostra o aviso de datas
inválidas, ou o header mostra período `-`, ou datas viram só o ano (2026).

**Causa (de raiz):** o `doGet()` do Apps Script está serializando as datas da
planilha como ano puro / Date cru, em vez de string formatada.

**Correção passo a passo:**
1. Aplicar o `doGet()` corrigido de `references/apps_script_correcoes.md`
   (usa `Utilities.formatDate(data, "America/Cuiaba", "yyyy-MM-dd")`).
2. Criar **NOVA implantação** no Apps Script (URL muda!).
3. Atualizar `API_URL` no `index.html` e redeploy no Netlify.
4. O template já tem o `parseDate` robusto do lado do HTML — mantenha-o.

---

## 9. Heatmap todo verde, sem variação visual

**Sintoma:** sem erro no Console — o heatmap renderiza, mas todas as células têm
praticamente a mesma cor.

**Causa:** fórmula fixa de intensidade (ex: `intensidade = v/30`) quando todas
as margens reais estão na mesma faixa (ex: 11% a 25%).

**Correção passo a passo:**
1. Usar o gradiente proporcional do template (`corHeatmap(v, min, max)` com
   min/max calculados dos dados REAIS) — nunca uma constante mágica.
2. Conferir que o subtítulo do heatmap mostra a faixa real
   (ex: "Faixa: 12.06% a 24.58%") — se mostra, o gradiente certo está ativo.

---

## 10. Gráfico "Evolução Diária" com pontos isolados ou vazio

**Sintoma:** timeline com 1-2 pontos soltos, ou o card mostra a mensagem de
"dias insuficientes com datas válidas".

**Causa:** mesma raiz do item 8 — datas inválidas no JSON da API fazem a maioria
dos registros cair fora da timeline.

**Correção:** idêntica ao item 8 (corrigir o `doGet()` + nova implantação +
atualizar URL). Do lado do HTML, garantir que a timeline usa `DataNormalizada`,
nunca `Data` direto.

---

## Se o erro não está nesta lista

1. Peça o print do Console (F12) e a URL exata que está no `API_URL`.
2. Teste a URL da API direto no navegador — deve devolver JSON puro.
3. Se você não sabe a causa exata: **diga isso e peça mais informação.**
   Nunca refaça o arquivo inteiro no chute.
