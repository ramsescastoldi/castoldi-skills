# Guia de customização — Dashboard Online Lumen

Como fazer os ajustes mais pedidos pelo Ramsés SEM quebrar o dashboard.
Sempre parta de `references/template_index_html.txt` — nunca escreva do zero.

---

## 1. Trocar cores (tokens no topo do template)

Todas as cores vivem em UM lugar: o objeto `CORES` e o array `PALETA_FILIAIS`,
logo abaixo do `API_URL` no `<script type="text/babel">`:

```javascript
const CORES = {
  bg: "#0F1419",       // fundo da página
  card: "#1A2330",     // fundo dos cards
  borda: "#2A3441",    // bordas dos cards e tabelas
  acento: "#C8102E",   // vermelho combustível (destaques, barras)
  verde: "#2D7D46",    // lucro / acima da média
  azul: "#1B4D8C",     // azul institucional
  amarelo: "#E89923",  // linha de média / margem
  texto: "#E8ECF1",
  textoSuave: "#8A97A8",
};
const PALETA_FILIAIS = ["#C8102E", "#1B4D8C", "#2D7D46", "#E89923", "#7C3AED", "#06B6D4", "#DC2626", "#059669"];
```

Para mudar qualquer cor: **edite só esses tokens** — os componentes referenciam
`CORES.xxx`, então a mudança se propaga sozinha. Nunca troque cor hardcoded
espalhada pelo JSX (se encontrar uma, converta para token primeiro).

Atenção: `#0F1419`, `#1A2330`, `#C8102E`, `#2D7D46` e `#1B4D8C` são a identidade
Lumen. Só troque se o Ramsés pedir explicitamente.

O CSS do `<head>` (classe `.boot` e `body`) também usa `#0F1419` — se trocar o
fundo, troque lá também.

## 2. Adicionar um Card/gráfico novo

Padrão de componente: todo bloco visual do dashboard é um `<Card>`:

```jsx
<Card titulo="Meu Gráfico Novo" subtitulo="explicação curta opcional">
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={meusDados}>
      {/* ... */}
    </BarChart>
  </ResponsiveContainer>
</Card>
```

Onde inserir cada coisa (ordem importa — regra dos Hooks!):

1. **O `useMemo` que prepara os dados** (`meusDados`) vai no **bloco de hooks no
   topo do `App`**, junto dos outros `useMemo` — SEMPRE ANTES do comentário
   `RETURNS CONDICIONAIS — só DAQUI PRA BAIXO`. Nunca perto do JSX.
2. **O JSX do `<Card>`** vai dentro do return final, entre os cards existentes
   (por exemplo, depois do heatmap e antes da timeline).
3. Se precisar de um componente Recharts ainda não usado (ex: `PieChart`),
   adicione-o ao destructuring `const { ... } = Recharts;` no topo.

Exemplo completo — volume por produto:

```jsx
// (1) no bloco de hooks, junto dos outros useMemo:
const volumePorProduto = useMemo(() => {
  return produtos.map((p) => ({
    produto: p,
    litros: dadosBrutos.filter((d) => d.Produto === p)
                       .reduce((s, d) => s + d.Litragem, 0),
  }));
}, [dadosBrutos, produtos]);

// (2) no return final, onde o card deve aparecer:
<Card titulo="Volume por Produto (L)">
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={volumePorProduto}>
      <CartesianGrid stroke={CORES.borda} vertical={false} />
      <XAxis dataKey="produto" stroke={CORES.textoSuave} fontSize={11} />
      <YAxis stroke={CORES.textoSuave} fontSize={11} />
      <Tooltip contentStyle={estiloTooltip} formatter={(v) => fmtNum(v)} />
      <Bar dataKey="litros" fill={CORES.azul} radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</Card>
```

## 3. Mudar filiais e produtos

O dashboard **não tem lista fixa** de filiais/produtos — ele deriva tudo dos
dados da API (`useMemo` de `filiais` e `produtos`). Ou seja:

- **Filial nova na rede?** Basta ela aparecer na aba `Vendas` da planilha Base
  Master — o dashboard mostra sozinho, com a próxima cor livre da
  `PALETA_FILIAIS` (o array tem 8 cores; acima de 8 filiais, adicione cores).
- **Produto novo?** Idem — aparece automaticamente nos filtros e no heatmap.
- **Renomear filial** (ex: "502 - TRUCK" → "502 - POSTO 10 TRUCK"): renomeie na
  PLANILHA, não no HTML. O nome que vem da API é o nome exibido.

Hoje a rede tem 3 filiais (301-CELEIRO, 401-DIAMANTINO, 502-TRUCK) e 5 produtos
(Etanol, Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500).

## 4. Regras que NUNCA podem ser violadas

Estas regras vêm de bugs reais já sofridos. Violar qualquer uma quebra o
dashboard em produção:

1. **Ordem dos Hooks.** TODOS os `useState`/`useEffect`/`useMemo` ficam no topo
   do `App`, antes de QUALQUER `return` condicional. Um hook depois de um
   return condicional = `Rendered fewer hooks than expected` e tela branca.
2. **PropTypes ANTES de Recharts** na ordem dos `<script>` do `<head>`.
   Invertido = `Cannot read properties of undefined (reading 'oneOfType')`.
3. **Só `cdn.jsdelivr.net`.** Nunca `unpkg.com` (já deu problema). Recharts é
   `2.12.7` no caminho `/umd/Recharts.js` SEM `.min`. Babel é `7.23.10`.
4. **`API_URL` sempre com `=`** e apontando pra
   `script.google.com/macros/s/.../exec` (nunca `script.googleusercontent.com`).
   Troca de URL é feita via edição direta (str_replace), nunca colagem manual.
5. **`fetch` com `redirect: 'follow'`** e parse JSON manual com try/catch.
6. **Período e timeline usam `DataNormalizada`**, nunca `Data` direto.
7. **Heatmap com gradiente proporcional ao min/max real** — nunca fórmula fixa
   tipo `v/30`.
8. **Não trocar de stack.** É HTML único + CDN + Babel + Netlify drag-and-drop.
   Nada de build, npm, Vite, framework — o Ramsés não é dev.

Antes de entregar qualquer customização, rode o checklist completo do Passo 4
do SKILL.md.

## 5. Depois de customizar: redeploy

1. Painel Netlify → site `dashboard-lumen` → aba **Deploys**
2. Arrastar o `index.html` novo na área de drag-and-drop
3. Aguardar "Published" (~30s)
4. Testar em **janela anônima** (Ctrl+Shift+N) pra fugir do cache
