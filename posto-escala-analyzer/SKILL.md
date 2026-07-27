---
name: posto-escala-analyzer
description: Analyze fuel station shift schedules versus actual hourly sales data, identify over/under-staffing, calculate labor costs based on Mato Grosso (Brazil) fuel station collective bargaining agreement (CCT SINPOSPETRO-MT 2026/2027), detect labor compliance risks, and propose optimized scales with monthly cost savings. Use this skill whenever the user asks about analyzing schedules, escalas, headcount, dimensionamento, produtividade por hora, custos de folha, otimização de equipe, sugestão de escala, comparativo 6x1 vs 12x36, or any analysis combining sales-by-hour data with staffing for gas stations / postos de combustível in Brazil — even if they don't explicitly ask for "analysis" (e.g. "tenho os dados de vendas e a escala, o que faço?" should trigger this). Also triggers when user uploads "Vendas por Hora" PDF reports together with shift/scale spreadsheets.
---

# Posto Escala Analyzer

This skill analyzes fuel station (posto de combustível) staffing scales against hourly sales data to identify mismatches, calculate labor costs under the CCT SINPOSPETRO-MT 2026/2027 (Mato Grosso/Brazil collective bargaining), and propose optimized scales with quantified monthly savings.

## When to use

Use whenever a user wants to evaluate, optimize, or critique fuel station staffing — particularly when they have:
- Hourly sales reports (typical "Vendas por Hora" PDFs from Brazilian fuel station POS systems)
- A current shift schedule (escala) in spreadsheet, photo, or text form
- Headcount per shift (turno)

The user may not say "analyze" — phrases like "minha escala faz sentido?", "tô contratando demais?", "quero economizar na folha", "consigo fechar o turno da noite?" all warrant this skill.

## Core analytical workflow

Follow this sequence. Skipping steps produces shallow recommendations.

### Step 1 — Gather the four required inputs

The analysis requires ALL of these. If any is missing, ask the user before proceeding. Don't guess.

1. **Operating hours** per day type (weekday / Saturday / Sunday / holiday) and how many shifts (turnos) the station runs.
2. **Headcount per shift, by role** — frentista, caixa, lubrificador, líder de pista, limpeza, administrativo, vigia, gerente, estoquista. Note any "coringa" (floater) or substitutes.
3. **Hourly sales data** for the last 30 days, broken down by hour AND by day-of-week (this is the standard "Vendas por Hora" PDF report). What matters is **liters sold per hour per weekday type**, not just totals.
4. **Edge cases**: who covers vigia folgas, who covers lubricação after the lubrifier leaves, gestantes/restrictions, current vacations.

### Step 2 — Compute productivity per hour (liters/attendant/hour)

Productivity is the central metric. Pure liters/hour is misleading because it ignores headcount.

For each hour H in the operating window:
1. Take the total liters sold in hour H across all weekdays in the period, divide by the number of weekday occurrences in that period — this gives **average liters/hour for weekday H**.
2. Repeat separately for Saturday and Sunday.
3. Identify how many "attendants" (caixa + frentista) are working in hour H. Apoio (líder, lubrificador, limpeza, admin, vigia, gerente, estoquista) does NOT count as attendant — they don't pump fuel or operate the till.
4. Productivity = avg liters/hour ÷ attendants in that hour.

**Reference bands** (after analyzing 3 stations of varying sizes in Diamantino/MT):
- < 100 L/attendant/h → ocioso (idle); consider reducing
- 100–300 L/attendant/h → adequate
- 300–500 L/attendant/h → tight; pico
- &gt; 500 L/attendant/h → overload; risk of queue and lost sales

**Important:** these bands are for a typical mid-volume Brazilian station. A high-volume station (truck stop, BR-163 corridor) sustainably runs 600–800 L/attendant/h because clients are routine and pumps are fast. Adjust the bands by ~50% upward for those.

### Step 3 — Map the picos (peak hours) per weekday

Don't just look at the daily average. Stations have different peak shapes per weekday:
- A wholesale/agricultural station may peak Wednesday 11:00 (loading day) and Friday 17:00.
- A truck-stop may peak Saturday all day.
- An urban station may peak Monday morning and Friday evening.

Output the top 5 peak hour-slots per weekday and check if they're under-staffed or over-staffed against current schedule.

### Step 4 — Apply CCT SINPOSPETRO-MT 2026/2027 cost model

Reference values are in `references/cct_mt_2026.md`. Always read that file before computing costs.

For each colaborador in the scale, compute monthly cost as:
```
salário_base × (1 + adicional_noturno_pct) × (1 + encargos)  +  benefícios
```
Where:
- **salário_base** = piso da função na CCT (frentista R$ 1.685, caixa R$ 1.941,78, etc.)
- **adicional_noturno_pct** = (% of hours worked between 22:00 and 05:00) × 20%
- **encargos** = 0.60 (60% — INSS patronal + RAT + Sistema S + FGTS + 13º + férias + provisão rescisão)
- **benefícios** = R$ 370 ajuda alimentação + R$ 50 vale-combustível (6x1) ou R$ 30 (12x36)

For the lubrificador and trocador de óleo, ADD the Cláusula 3ª §6º gratification of R$ 252,74 to the piso.

### Step 5 — Detect compliance risks and surface them

Any of these patterns is a finding worth flagging:
- Someone with one CTPS function (e.g. Aux. Escritório) recurrently covering another (e.g. Caixa) — Cláusula 9ª substitution salary applies if not paid.
- A frentista being scaled to cover the vigia overnight — interjornada 11h CLT risk.
- Limpeza in jornada partida (split shift) without contract clause.
- Operação in a day type fully without apoio (líder, admin, vigia, lubrificador all folgam at once).
- T3 (overnight) shift selling under ~50 L/h — likely deficit; calculate revenue × cost.
- "Caixa-frentista" CTPS cargo where the role is predominantly cashier — re-classification risk.

For each risk, state: severity, problem, root cause, financial/legal exposure.

### Step 6 — Propose specific staffing changes with R$/month impact

The output is the most important part. Avoid generic advice ("contrate mais gente"). Each proposed change must include:
1. **What** changes (who/which shift)
2. **Why** (which peak hour or idle hour drives it; quote the productivity number)
3. **Impact** in R$/month — savings if reducing, cost if adding, attendance gain if reorganizing
4. **Risk** if not done
5. **Priority** (Alta / Média / Baixa)

Calculate the **net monthly delta** of all proposed changes vs. current scale.

## Output format

Default output: a structured Markdown report with these sections, in this order. Keep it actionable — under 1500 words total unless the user asks for an Excel.

```markdown
# Análise de Escala vs. Vendas — [Nome do Posto]

## 1. Dados de Entrada
- Horário operacional: [...]
- Headcount atual: [N] colaboradores
- Período de vendas analisado: [DD/MM a DD/MM]
- Volume total: [N] litros / R$ [N]

## 2. Diagnóstico — Picos e Vales
[Tabela: hora, volume médio, atendentes, L/atend, status]

## 3. Pontos Críticos da Escala Atual
[Lista de 3-6 findings, cada um com: severidade, problema, impacto financeiro/legal]

## 4. Proposta de Mudanças
[Tabela: mudança, racional, impacto R$/mês, prioridade]

## 5. Resumo Financeiro
- Custo atual: R$ [N]/mês
- Custo proposto: R$ [N]/mês
- **Economia: R$ [N]/mês (R$ [N×12]/ano)**
- Variação de headcount: [N] → [N]

## 6. Próximos passos sugeridos
[2-3 ações concretas]
```

If the user later requests an Excel, generate one — but the default response is the Markdown report (faster, more readable, more actionable).

## Common pitfalls to avoid

1. **Don't compute "L/funcionário/h" using the total headcount.** That penalizes stations with strong support staff (lubrifiers, líderes). Use only attendants (caixa + frentista) for the productivity metric.

2. **Don't propose closing a night shift without checking weekend behavior.** Some stations run 24h on weekdays only; the night shift may be subsidized by truck-driver corridor flow that peaks Sunday evening.

3. **Don't recommend 12x36 for stations open less than 24h.** 12x36 only economizes when both 12h blocks are productive. A station open 06:00-22:00 (16h) running 12x36 leaves either 8h dead or requires a complementary 6x1 team — which inflates costs. Verified empirically on 3 stations (cost analysis showed +R$ 28k/month in 12x36 vs. 6x1 for 16h-operation stations).

4. **Don't ignore the substituto (folguista) cost.** Every 6x1 team needs ~17% more headcount to cover folgas. A station with 6 attendants/shift × 2 shifts × 7 days needs 14 hired, not 12.

5. **Caixa-frentista is a real cargo.** In MT this is a frentista who also operates the cash register — registered as Frentista in CTPS. Don't reclassify automatically; just flag the risk if the role is predominantly caixa.

6. **Reference the CCT clause numbers when justifying a finding.** "Joelma faz acúmulo de função" is weak. "Joelma se enquadra na Cláusula 9ª da CCT (substituição não-eventual) — devida gratificação de R$ 256,78/mês" is strong.

## Reference files

- `references/cct_mt_2026.md` — Pisos salariais, gratificações, benefícios e cláusulas críticas da CCT SINPOSPETRO-MT 2026/2027.
- `references/productivity_bands.md` — Bandas de produtividade por tipo de posto (urbano, rodoviário, agrícola, truck-stop) com calibração empírica.
- `references/example_analysis.md` — Exemplo completo (Posto 10 Diamantino abril/2026) mostrando formato de saída.

Read these on demand — they're not auto-loaded. Always read `cct_mt_2026.md` before computing costs.
