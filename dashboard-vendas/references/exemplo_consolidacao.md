# Exemplo completo de execução da skill (dados fictícios)

Este é um exemplo de ponta a ponta de uma rodada da skill `dashboard-vendas`,
com **3 filiais fictícias** e **5 produtos**, para calibrar tom, formato e nível
de detalhe da entrega. Os números são plausíveis para uma rede de postos em MT,
mas são inventados — nunca use este exemplo como dado real.

## Entrada

O Ramsés digitou **"dashboard"**. Confirmado o período padrão (últimos 7 dias),
a busca no Gmail (`subject:vendas has:attachment newer_than:7d`) encontrou 3 emails:

| Data | Remetente | Assunto | Anexo |
|------|-----------|---------|-------|
| 07/09 | sistema@rederp.com.br | Vendas diárias — Celeiro | `margem_301_0109_0709.xlsx` |
| 07/09 | sistema@rederp.com.br | Vendas diárias — Diamantino | `margem_401_0109_0709.xlsx` |
| 07/09 | sistema@rederp.com.br | Vendas diárias — Truck | `rel_vendas (3).xlsx` |

O Ramsés enviou os 3 arquivos por upload. Note que o terceiro arquivo tem nome
genérico — a filial foi identificada pelo cabeçalho interno `Filial: 502 - POSTO 10 TRUCK`,
como manda a regra (nunca pelo nome do arquivo).

## Parsing (Passo 4)

Cada arquivo foi processado com `parser_relatorio.py`:

```
OK  margem_301_0109_0709.xlsx: 35 registros | filial 301 - POSTO CELEIRO | 5 produtos
OK  margem_401_0109_0709.xlsx: 35 registros | filial 401 - POSTO DIAMANTINO | 5 produtos
OK  rel_vendas (3).xlsx: 35 registros | filial 502 - POSTO 10 TRUCK | 5 produtos
```

`df_consolidado`: **105 registros** (3 filiais × 5 produtos × 7 dias),
período 01/09/2026 a 07/09/2026. Amostra:

| Data | Filial | Produto | P_Custo | P_Venda | Margem_Bruta_Pct | Litragem | Total_Venda | Lucro_Bruto |
|------|--------|---------|---------|---------|------------------|----------|-------------|-------------|
| 2026-09-01 | 301 - POSTO CELEIRO | Etanol | 3,89 | 4,79 | 18,79 | 1.520,5 | 7.283,20 | 1.368,45 |
| 2026-09-01 | 301 - POSTO CELEIRO | Gasolina Comum | 5,31 | 6,29 | 15,58 | 3.810,2 | 23.966,16 | 3.734,00 |
| 2026-09-01 | 401 - POSTO DIAMANTINO | Diesel S10 | 5,62 | 6,39 | 12,05 | 5.230,0 | 33.419,70 | 4.027,10 |
| 2026-09-02 | 502 - POSTO 10 TRUCK | Diesel S500 | 5,48 | 6,19 | 11,47 | 8.120,4 | 50.265,28 | 5.765,49 |

## Consolidado por filial (Aba 2 da planilha)

| Filial | Receita Total | Lucro Total | Volume (L) | Margem Média % | Ticket Médio R$/L |
|--------|---------------|-------------|------------|----------------|-------------------|
| 301 - POSTO CELEIRO | R$ 612.480 | R$ 102.900 | 106.870 | 16,8% | 5,73 |
| 401 - POSTO DIAMANTINO | R$ 478.310 | R$ 67.920 | 79.450 | 14,2% | 6,02 |
| 502 - POSTO 10 TRUCK | R$ 1.421.650 | R$ 163.490 | 226.930 | 11,5% | 6,27 |
| **Rede** | **R$ 2.512.440** | **R$ 334.310** | **413.250** | **13,3%** | **6,08** |

## Margem média por Produto × Filial (Aba 3 / heatmap)

| Produto | 301 - CELEIRO | 401 - DIAMANTINO | 502 - TRUCK |
|---------|---------------|------------------|-------------|
| Etanol | 18,8% | 16,1% | 14,9% |
| Gasolina Comum | 15,6% | 14,8% | 13,2% |
| Gasolina Aditivada | 19,4% | 17,3% | 15,8% |
| Diesel S10 | 13,1% | 12,1% | 11,2% |
| Diesel S500 | 12,4% | 11,6% | 9,8% |

## Ranking (Aba 4)

| # | Filial | Margem Média % | vs Rede (13,3%) |
|---|--------|----------------|-----------------|
| 1 | 301 - POSTO CELEIRO | 16,8% | ▲ |
| 2 | 401 - POSTO DIAMANTINO | 14,2% | ▲ |
| 3 | 502 - POSTO 10 TRUCK | 11,5% | ▼ |

Validação (Passo 5): 3 filiais no consolidado ✓ · nenhuma data futura ✓ ·
1 outlier sinalizado (Diesel S500 na 502 com 9,8% de margem média e um dia
a 8,9% — abaixo do piso histórico da rede, sinalizado mas não removido).

## Entrega (Passo 8)

Foram apresentados os dois arquivos, nesta ordem:

1. `/mnt/user-data/outputs/dashboard_vendas.jsx` (abre como artifact)
2. `/mnt/user-data/outputs/Vendas_Consolidadas.xlsx`

E o resumo executivo, curto e em prosa, exatamente no formato do Passo 8:

> "Consolidei 3 filiais cobrindo o período 01/09 a 07/09.
>
> A filial **301 — POSTO CELEIRO** liderou em margem (16,8%), enquanto
> **502 — POSTO 10 TRUCK** ficou na lanterna (11,5%) — diferença de 5,3 pontos.
> Em volume de receita, **502 — POSTO 10 TRUCK** foi a maior com R$ 1,42 milhão.
>
> ⚠️ Notei que o Diesel S500 na filial 502 rodou a semana com margem média de
> 9,8%, bem abaixo do restante da rede — vale conferir se o preço de bomba
> acompanhou o último reajuste de custo.
>
> O dashboard interativo abre acima e a planilha consolidada permite drill-down."

## Por que este exemplo importa

- A filial 502 tem a **maior receita** e a **menor margem** — situação típica de
  posto de truck (muito diesel, margem apertada). O resumo separa as duas coisas
  em vez de chamar a 502 de "pior filial".
- O alerta é **concreto e acionável** (produto + filial + hipótese de causa),
  não um aviso genérico.
- O resumo tem ~5 linhas. O detalhe fica no dashboard e na planilha — não no chat.
