---
name: lumen-newsletter
description: Produza a newsletter semanal "Posto em Dia" do Lumen Posto Club entregando dois PDFs (Mobile vertical para celular + A4 vertical para computador). Use quando o usuário (Ramsés, editor-chefe do Lumen Posto Club) pedir "gerar a newsletter", "criar edição da semana", "fazer o Posto em Dia", "produzir newsletter semanal", "PDF da newsletter", ou variações para produção da newsletter editorial do clube de revendedores de combustíveis. Cobre busca de dados (ANP, CEPEA/ESALQ, Abicom, Brent/WTI, USD/BRL), montagem dos 5 cards editoriais, seção "O Que Fazer Hoje", bloco fixo Verimo Seguros e renderização final em PDFs.
---

# Lumen Newsletter — Posto em Dia

Cliente: Ramsés (Lumen Posto Club). Público: donos de posto e revendedores de combustíveis no Brasil. Frequência: semanal (sextas).

## Entregáveis (sempre dois PDFs)

1. `PostoEmDia_Semana<N>_Mobile.pdf` — 120×220mm vertical (celular). **Principal**.
2. `PostoEmDia_Semana<N>_A4.pdf` — A4 vertical (computador / impressão).

Apresente o Mobile primeiro via `present_files`.

## Fluxo (ordem)

### 1. Buscar dados em paralelo (web_search)

| Indicador | Busca | Fonte |
|---|---|---|
| Brent / WTI | "Brent crude oil price today" | ICE / Investing |
| USD/BRL | "dólar real hoje cotação" | Banco Central |
| Gasolina C, Etanol Hidratado, Diesel B S-10, GLP P-13 (médias BR) | "ANP síntese semanal preços combustíveis semana N 2026" | ANP |
| Etanol Hidratado/Anidro produtor SP | "CEPEA ESALQ etanol hidratado anidro [mês] 2026" | CEPEA/ESALQ-SP |
| Defasagem Petrobras | "Abicom defasagem Petrobras [mês] 2026" | Abicom |
| 5-8 manchetes setoriais | varia | Brasil Postos, ClubPetro, Times Brasil, Câmara, Senado, MJ, MME |

URL ANP: `https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/arq-sintese-semanal/2026/sintese-precos-NN.pdf`

**Nunca fabricar valores.** Indicador indisponível = `a confirmar` (classe `pending`) com motivo na nota de fonte.

### 2. Selecionar 5 temas + classificar

| Cor (classe) | Tag | Quando |
|---|---|---|
| `red` | "🔴 Ação Imediata" | Decisão operacional NESTA semana |
| `yellow` | "🟡 Atenção" | Mudança regulatória / cenário |
| `green` | "🟢 Oportunidade" | Janela favorável |
| `blue` | "🔵 Informativo" | Educativo (raro) |

Mix saudável em semana quente: 3 vermelhos, 1 amarelo, 1 verde. Evitar 5 da mesma cor.

### 3. Estrutura fixa de cada card (NUNCA inverter)

```html
<div class="card [COR]">
  <span class="card-tag tag-[COR]">[EMOJI] [URGÊNCIA]</span>
  <div class="card-title">[N]. [TÍTULO COM DADO CONCRETO]</div>
  <div class="card-block">
    <span class="block-label">O que aconteceu</span>
    <p>Fato objetivo: números, datas (ex: "em 17/04"), fontes citadas.</p>
  </div>
  <div class="card-block">
    <span class="block-label">Por que importa</span>
    <p>Impacto direto para o posto.</p>
  </div>
  <div class="card-block">
    <span class="block-label">Ação da semana</span>
    <p>Verbos no imperativo. Listas (1)(2)(3) ok.</p>
  </div>
</div>
```

### 4. Card de indicador

```html
<div class="ind-card [up|down|pending]">
  <div class="ind-name">[NOME]</div>
  <div class="ind-row">
    <div class="ind-value">[VALOR]</div>
    <div class="ind-var [up|down|neutral]">[▲|▼|≈] [VARIAÇÃO]</div>
  </div>
  <div class="ind-source">[FONTE — DATA]</div>
</div>
```

Pendente: trocar `<div class="ind-value">` por `<div class="ind-pending-value">a confirmar</div>` e remover `ind-var`.

Lógica de cor: alta de Brent/defasagem = `up` (vermelho, ruim para posto). Queda de etanol produtor = `down` (verde, bom para posto).

### 5. "O Que Fazer Hoje" — REGRA CRÍTICA

**Só atualizar quando cenário muda de fato**. Gatilhos: Brent rompeu faixa; defasagem saltou >10pp; nova MP/decreto/CNPE em vigor; risco de desabastecimento abriu/fechou; janela de etanol abriu/fechou; mandato de mistura mudou. Sem gatilho → manter idêntico à edição anterior.

### 6. Bloco Verimo (FIXO, já no template)

Plataforma Verimo (Ramsés é franqueado), todas as seguradoras. Ramos: Auto · Patrimonial · Vida · Frota · RC Ambiental · RC Geral · Lucros Cessantes · Saúde & Odonto · Vida em Grupo. Economia média **25%**. Contato **(65) 99265-7008** (`wa.me/5565992657008`). Não alterar a menos que pedido.

### 7. Montar HTML

Copiar `template.html` para `/home/claude/PostoEmDia_Semana<N>.html` e substituir:

| Placeholder | Conteúdo |
|---|---|
| `{{EDICAO}}` | Número (ex: 17) |
| `{{PERIODO}}` | "19 a 25 / Abr / 2026" |
| `{{INDICADORES}}` | HTML dos ~11 cards de indicador |
| `{{NOTA_FONTE}}` | `<div class="source-note">⚠️ ...</div>` se houver pendência, senão string vazia |
| `{{CARDS}}` | HTML dos 5 cards editoriais |
| `{{ACOES_HOJE}}` | `<li>...</li>` para cada ação (5 itens típicos) |
| `{{FONTES}}` | "ICE, NYMEX, Banco Central, ANP, CEPEA/ESALQ, Abicom, ..." |

### 8. Gerar os 2 PDFs

Use Playwright + Chromium (script Python inline). Pré-requisito (uma vez): `pip install playwright --break-system-packages && playwright install chromium`.

```python
import asyncio
from playwright.async_api import async_playwright

HTML = "/home/claude/PostoEmDia_SemanaNN.html"  # ajuste NN
N = "16"  # número da edição
OUT = "/mnt/user-data/outputs"

async def render():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # Mobile (celular vertical)
        c = await b.new_context(viewport={"width":414,"height":896}, device_scale_factor=2)
        page = await c.new_page()
        await page.goto(f"file://{HTML}")
        await page.wait_for_load_state("networkidle")
        await page.pdf(path=f"{OUT}/PostoEmDia_Semana{N}_Mobile.pdf",
                       width="120mm", height="220mm", print_background=True,
                       margin={"top":"0","bottom":"0","left":"0","right":"0"})
        await c.close()
        # A4
        c = await b.new_context(viewport={"width":800,"height":1200}, device_scale_factor=2)
        page = await c.new_page()
        await page.goto(f"file://{HTML}")
        await page.wait_for_load_state("networkidle")
        await page.pdf(path=f"{OUT}/PostoEmDia_Semana{N}_A4.pdf",
                       format="A4", print_background=True,
                       margin={"top":"10mm","bottom":"10mm","left":"10mm","right":"10mm"})
        await b.close()

asyncio.run(render())
```

Fallback se Playwright indisponível: use `wkhtmltopdf` com mesmas dimensões (`--page-width 120mm --page-height 220mm` para Mobile, `--page-size A4` para A4).

### 9. Entregar

```python
present_files([
  "/mnt/user-data/outputs/PostoEmDia_Semana<N>_Mobile.pdf",  # principal
  "/mnt/user-data/outputs/PostoEmDia_Semana<N>_A4.pdf"
])
```

## Princípios editoriais (não-negociáveis)

1. **Copy-ready**: pronto para publicar.
2. **Operacional**: cada parágrafo com implicação prática.
3. **Conciso, sem preamble** ("Claro!", "Vou fazer..."). Direto ao conteúdo.
4. **Voz com o revendedor**: "você" + imperativo. Termos técnicos sem explicação excessiva.
5. **Citar fonte e data**: "Brent saltou 3,59% em 22/04 (ICE)" — não "Brent subiu esta semana".
6. **Hierarquia de fontes**: oficiais (ANP, CEPEA, BCB, MME) > associações (Abicom, UNICA) > especializados (Brasil Postos, ClubPetro) > imprensa econômica > aggregators.
7. **Buscas em PT**: instituição + produto + período. Sempre com "2026". 4-6 palavras.

## Padrão visual (codificado no template, NÃO alterar)

Paleta navy `#0D1B2A` + gold `#C9A84C`. Container 640px (mobile-first). Fontes 19px base, 22px títulos cards, 24px valores. Indicadores como cards empilhados (não tabela).

## Edição de referência (gold standard)

**Edição 16** (12-18/abr/2026). Replicar tom e profundidade. Cards daquela edição:
1. Brent dispara para US$ 102 (Ormuz) — vermelho
2. Defasagem Petrobras 41%/31% — vermelho
3. Subsídio diesel MP 1.349/26 — amarelo
4. Força-tarefa fiscalizou 10 mil postos — vermelho
5. Etanol safra 2026/27 — verde
