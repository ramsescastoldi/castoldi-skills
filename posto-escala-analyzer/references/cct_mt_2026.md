# CCT SINPOSPETRO-MT 2026/2027 — Referência para cálculo

**Vigência:** 01/03/2026 a 28/02/2027
**Sindicatos:** SINPOSPETRO-MT (empregados) × Sindicato do Comércio Varejista de Derivados de Petróleo de MT
**Reajuste aplicado:** 5,3125% sobre piso anterior

## Pisos salariais por cargo

| Cargo | Piso (R$) |
|---|---|
| Frentista | 1.685,00 |
| Lubrificador | 1.685,00 + 252,74 grat. = **1.937,74** |
| Trocador de Óleo | 1.685,00 + 252,74 grat. = **1.937,74** |
| Lavadores | 1.685,00 |
| Enxugadores | 1.685,00 |
| Auxiliar de Escritório | 1.685,00 |
| Atendente de Conveniência | 1.685,00 |
| Telefonista/Recepcionista | 1.685,00 |
| Motorista | 1.685,00 |
| Guarda Noturno | 1.685,00 |
| Caixas | **1.941,78** |
| Chefes de Pista (Líder) | **2.024,95** |
| Gerentes | **2.256,91** |
| Demais cargos | 1.685,00 |

## Encargos patronais (estimativa MT)

Aplicar **60% sobre o salário** (inclui adicionais aplicáveis):
- INSS patronal 20%
- RAT/SAT (Risco Ambiental do Trabalho) ~3%
- Sistema S (SESC, SENAC, SEBRAE etc.) ~5,8%
- FGTS 8%
- 13º salário (1/12) ~8,33%
- Férias + 1/3 ~11,11%
- Provisão rescisão ~3,5%

## Adicional Noturno

Mínimo CLT: **20%** sobre hora normal entre 22:00 e 05:00.
Hora noturna reduzida: 52'30" (cada 1h cronológica = 1h08 no contracheque).

Para cálculo simplificado: aplicar 20% × (% das horas trabalhadas em período noturno).
Ex.: vigia das 21:50 às 05:30 (≈7h40) tem ~7h em período noturno (22h-5h) sobre 7h40 = ~91% das horas → adicional efetivo ≈ 18,2% sobre o piso.

## Benefícios obrigatórios

### Cláusula 12ª — Ajuda Alimentação
**R$ 370,00/mês**, paga até o 10º dia do mês, gratuita, **sem natureza salarial** (não compõe base de cálculo de FGTS, INSS, 13º, férias).
Pode ser descontada proporcionalmente em caso de falta injustificada.

### Cláusula 13ª — Vale Transporte / Vale Combustível
- Para empregado que mora ≥ 2 km do posto.
- Cidades **sem transporte público regular** (caso de Diamantino e maioria das cidades pequenas de MT): obrigatório vale-combustível em substituição:
  - Escala 6x1: **R$ 50,00/mês**
  - Escala 12x36: **R$ 30,00/mês**

## Cláusulas críticas para análise de escalas

### Cláusula 3ª, §3º — Definição de Frentista
> "Entende-se por frentista o funcionário que executa todas as operações relativas à venda de produtos na pista de abastecimento, tendo entre suas funções a prestação de contas do numerário pelo mesmo manuseado, **salvo quando na pista de abastecimento houver um Caixa**."

### Cláusula 3ª, §4º — Definição de Caixa
> "Entende-se por Caixa o funcionário que é o **único responsável** pelos numerários manuseados e que presta conta dos mesmos."

**Implicação prática:** O critério distintivo é a EXCLUSIVIDADE no manuseio do numerário. Funcionário que opera caixa fixo de forma predominante (mesmo sendo registrado como frentista) pode ser reclassificado pela Justiça do Trabalho.

### Cláusula 3ª, §5º — Limpeza não é acúmulo
> "Não será interpretado como acúmulo de função o fato de os empregados serem responsáveis por manter limpo o seu local de trabalho... facultado ao empregador a possibilidade de criar escala de limpeza entre os empregados de cada setor."

### Cláusula 3ª, §6º — Gratificação Lubrificador/Trocador
**R$ 252,74/mês adicional** ao piso, retroativo a 01/03/2026.

### Cláusula 9ª — SALÁRIO-SUBSTITUIÇÃO ⚠️
> "Enquanto perdurar a substituição, **que não tenha caráter meramente eventual**, os empregados substitutos farão jus ao salário contratual dos substituídos, a título de gratificação."

**Aplicação prática:** Substituição recorrente (ex.: cobertura semanal de folga) NÃO é eventual. Devida diferença salarial.

Exemplo: Aux. Escritório (R$ 1.685) que cobre Caixa toda semana → diferença R$ 256,78/mês durante o período.

### Cláusula 11ª — Anuênio
A partir do 25º mês ininterrupto na mesma empresa: **1% do piso por ano trabalhado**.
Não retroativo.

## Considerações adicionais

- **PLR (Cláusula 10ª):** facultativa. Empresa que opta deve regulamentar e dar ciência ao empregado.
- **Adiantamento quinzenal (Cláusula 5ª):** facultativo, máximo 40% do salário, pago até dia 20.
- **Desconto em folha sindical (Cláusula 8ª):** somente com autorização do empregado, máximo 30%.

## Fórmula completa de custo mensal

```
custo_total = (piso + adic_noturno) × 1.60 + 370 + vale_combustivel
```

Onde:
- `piso` = piso da função (incluindo gratificação Cláusula 3ª §6º se aplicável)
- `adic_noturno` = piso × 0.20 × (% horas em período noturno)
- `1.60` = 1 + 60% encargos
- `370` = ajuda alimentação
- `vale_combustivel` = 50 (6x1) ou 30 (12x36)

**Exemplo — Frentista 6x1:**
1.685,00 × 1,60 + 370 + 50 = **R$ 3.116,00/mês**

**Exemplo — Caixa 6x1:**
1.941,78 × 1,60 + 370 + 50 = **R$ 3.526,85/mês**

**Exemplo — Lubrificador 6x1:**
(1.685 + 252,74) × 1,60 + 370 + 50 = **R$ 3.520,38/mês**

**Exemplo — Vigia Noturno 6x1 (90% horas em período noturno):**
1.685 × (1 + 0,20×0,90) × 1,60 + 370 + 50 = 1.685 × 1,18 × 1,60 + 420 = **R$ 3.601,03/mês**
