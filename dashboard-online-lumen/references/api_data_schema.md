# Schema do JSON da API (Apps Script → dashboard)

A API é o Web App do Apps Script (`doGet()`) lendo a aba `Vendas` da planilha
**"Base Master Vendas — Lumen"**. O `index.html` faz `fetch(API_URL)` e espera
o formato abaixo. Este schema é o contrato entre o Apps Script e o template —
qualquer mudança de campo tem que acontecer nos dois lados.

## Formato geral

Um **array JSON de registros** (uma linha da aba `Vendas` = um registro = uma
venda de um produto, em um dia, em uma filial):

```json
[
  { "Data": "...", "Filial": "...", "Produto": "...", ... },
  { "Data": "...", "Filial": "...", "Produto": "...", ... }
]
```

O template também aceita o array embrulhado em `{ "dados": [...] }`, mas o
padrão (e o que o `doGet()` corrigido gera) é o array puro.

## Campos de cada registro

| Campo | Tipo | Exemplo | Observações |
|-------|------|---------|-------------|
| `Data` | string | `"2026-09-01"` | Ideal: ISO `yyyy-MM-dd` (é o que o `doGet()` corrigido gera). O template também parseia `DD/MM/YYYY` e Date serializado. |
| `Filial` | string | `"502 - POSTO 10 TRUCK"` | Formato `CÓDIGO - NOME`, com código. É a chave dos comparativos — não abreviar. |
| `Produto` | string | `"Diesel S10"` | Nome limpo, sem código. Valores atuais: Etanol, Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500. |
| `P_Custo` | number | `5.62` | Preço de custo unitário (R$/L) |
| `P_Venda` | number | `6.39` | Preço de venda unitário (R$/L) |
| `Margem_Bruta_Pct` | number | `12.05` | Margem bruta em % (12.05 = 12,05%) |
| `Markup_Pct` | number | `13.70` | Markup em % |
| `Litragem` | number | `5230.0` | Volume vendido no dia (litros) |
| `Total_Custo` | number | `29392.60` | Custo total do dia (R$) |
| `Total_Venda` | number | `33419.70` | Receita total do dia (R$) |
| `Lucro_Bruto` | number | `4027.10` | Lucro bruto do dia (R$) |

Números vêm como number JSON com ponto decimal (nunca string com vírgula).
Se algum campo vier string, o template converte defensivamente (`num()`), mas
o certo é o Apps Script já mandar number.

## Exemplo de payload VÁLIDO

```json
[
  {
    "Data": "2026-09-01",
    "Filial": "301 - POSTO CELEIRO",
    "Produto": "Etanol",
    "P_Custo": 3.89,
    "P_Venda": 4.79,
    "Margem_Bruta_Pct": 18.79,
    "Markup_Pct": 23.14,
    "Litragem": 1520.5,
    "Total_Custo": 5914.75,
    "Total_Venda": 7283.20,
    "Lucro_Bruto": 1368.45
  },
  {
    "Data": "2026-09-01",
    "Filial": "401 - POSTO DIAMANTINO",
    "Produto": "Diesel S10",
    "P_Custo": 5.62,
    "P_Venda": 6.39,
    "Margem_Bruta_Pct": 12.05,
    "Markup_Pct": 13.70,
    "Litragem": 5230.0,
    "Total_Custo": 29392.60,
    "Total_Venda": 33419.70,
    "Lucro_Bruto": 4027.10
  },
  {
    "Data": "2026-09-02",
    "Filial": "502 - POSTO 10 TRUCK",
    "Produto": "Diesel S500",
    "P_Custo": 5.48,
    "P_Venda": 6.19,
    "Margem_Bruta_Pct": 11.47,
    "Markup_Pct": 12.96,
    "Litragem": 8120.4,
    "Total_Custo": 44499.79,
    "Total_Venda": 50265.28,
    "Lucro_Bruto": 5765.49
  }
]
```

## Formatos de data problemáticos (já vistos em produção)

O campo `Data` é o mais frágil da integração. Estados possíveis:

| Valor recebido | O que é | Como o template reage |
|----------------|---------|-----------------------|
| `"2026-09-01"` | ISO — formato CORRETO (`doGet()` com `Utilities.formatDate`) | ✅ parseia direto |
| `"2026-09-01T03:00:00.000Z"` | Date serializado pelo `JSON.stringify` do Apps Script (sem formatação) | ✅ parseia, mas cuidado com fuso — prefira o `doGet()` corrigido |
| `"01/09/2026"` | Formato BR (planilha como texto) | ✅ parseia via regex DD/MM/YYYY |
| `"Mon Sep 01 2026 00:00:00 GMT-0400"` | Date serializado como string longa | ✅ parseia via `new Date(...)` |
| `2026` (number) ou `"2026"` | **O BUG CLÁSSICO**: célula de data mal formatada, o Apps Script devolve só o ano | ❌ `parseDate` devolve `null` → registro fica fora da timeline; se TODOS vierem assim, o dashboard mostra a tela de "datas inválidas" apontando pra correção do Apps Script |
| `""` ou ausente | Linha incompleta na planilha | ❌ `null`, registro fora da timeline |

**Sintomas no dashboard quando as datas vêm quebradas:** período no header como
`-`, timeline vazia ou com pontos isolados, tela de aviso de datas inválidas.
**Correção de raiz:** `references/apps_script_correcoes.md` (formatar a data no
`doGet()` com `Utilities.formatDate(data, "America/Cuiaba", "yyyy-MM-dd")` e
criar nova implantação).

## Regras de compatibilidade

- **Campo novo na planilha?** Pode adicionar à vontade — o template ignora
  campos desconhecidos. Para usar no dashboard, inclua-o no `useMemo` de
  `dadosBrutos` do `index.html`.
- **Renomear campo existente?** NÃO, sem atualizar o template junto — os nomes
  acima são contrato.
- **Registro sem `Filial` ou `Produto`?** O template descarta dos filtros
  (string vazia é filtrada), mas o certo é a planilha não ter linha incompleta.
