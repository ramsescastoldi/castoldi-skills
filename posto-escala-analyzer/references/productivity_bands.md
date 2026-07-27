# Bandas de Produtividade — Litros por Atendente por Hora

Calibração empírica feita em postos de Mato Grosso (Diamantino, abril/2026). Use como referência inicial e ajuste conforme o perfil do posto analisado.

## Tipologia de postos e bandas esperadas

### 🏪 Posto Urbano de Médio Porte
**Perfil:** Cidade de 20-50k habitantes, atende cidadãos locais, frota de motos e carros, alguma movimentação de fim de semana.
**Volume típico:** 150–300 mil litros/mês.
**Headcount típico:** 12–18 colaboradores.
**Bandas L/atendente/h:**
- Ocioso: < 100
- Adequado: 100–300
- Apertado (pico): 300–500
- Sobrecarga: > 500

**Picos típicos:** 11h-13h (almoço), 17h-19h (saída do trabalho), 11h quartas (dia de feira/movimento comercial).

### 🚛 Posto Truck-Stop / BR-corredor
**Perfil:** Localizado em rodovia, atende caminhoneiros e frota pesada, abastecimento contínuo durante o dia.
**Volume típico:** 400–700 mil litros/mês.
**Headcount típico:** 22–32 colaboradores.
**Bandas L/atendente/h:**
- Ocioso: < 200
- Adequado: 200–600
- Apertado (pico): 600–800
- Sobrecarga: > 800

**Picos típicos:** Distribuídos ao longo do dia (10h-19h), com sábado sendo o dia de maior volume. Domingo cai 40-50%.

### 🌾 Posto Agrícola / Celeiro
**Perfil:** Atende produtores rurais, mistura de carros de passeio e caminhões agrícolas, sazonalidade forte.
**Volume típico:** 100–200 mil litros/mês.
**Headcount típico:** 8–14 colaboradores.
**Bandas L/atendente/h:**
- Ocioso: < 80
- Adequado: 80–250
- Apertado (pico): 250–450
- Sobrecarga: > 450

**Picos típicos:** Dependem da safra. Em colheita, pico 06h-08h e 17h-19h. Fora de safra, mais distribuído.

### 🌙 Postos com Operação 24h
**Perfil noturno (22h-05h):**
- Volume típico: < 50 L/h em postos urbanos
- Volume típico: 100-300 L/h em postos rodoviários (BR-163, BR-070)
- **Critério de viabilidade:** Receita marginal noturna deve cobrir custo do colaborador noturno + adicional 20% + risco de segurança. Com piso R$ 1.685 + encargos = ~R$ 3.600/mês (360 horas/mês), custo mínimo é R$ 10/h. Margem média de combustível ~5-8% sobre receita. Para empatar, precisa vender 200-300 L/h continuamente à noite.

## Como calibrar para um posto novo

1. **Calcule o volume médio por hora** em dia útil para os horários 09h, 12h, 15h, 18h.
2. **Compare com a banda de seu perfil** (urbano / rodoviário / agrícola).
3. Se o posto consistentemente fica em "Adequado" mesmo com headcount maior que o esperado → **excesso de pessoal**.
4. Se fica em "Sobrecarga" mesmo com headcount maior que o esperado → **fluxo concentrado em pouco tempo** (rever distribuição de turnos).

## Sinais empíricos de problemas

| Sintoma | Causa provável |
|---|---|
| Hora 17h vendendo 700+ L/atend em 4 dias da semana | Subdimensionamento de tarde |
| Manhã (07-10h) consistentemente abaixo de 100 L/atend | Equipe entra cedo demais |
| Sábado vendendo 80% do dia útil mas com mesma equipe | Domingo provavelmente pode ser reduzido |
| Hora de troca de turno com vendas baixas | Bom; é sinal de planejamento correto |
| Hora de troca de turno com vendas altas | RUIM — passagem mal posicionada, reescalar |

## Métricas de verificação (sanity checks)

Antes de propor mudanças drásticas, verificar se os dados de venda fazem sentido:

- **Volume mensal /  bombas / ano** ≈ 600-1500 mil litros é típico para posto MT médio.
- **Faturamento médio R$/L** atual em MT ≈ R$ 6,30-6,80 (gasolina + diesel mistos).
- **Razão fim de semana / dia útil** geralmente 0,7-1,1 (sábado pode até superar dia útil em postos rodoviários).
- **Fator de ociosidade do horário noturno** (vendas 22h-05h ÷ vendas 12h-19h) < 0,15 indica que noite não se sustenta sozinha.
