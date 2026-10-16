# Anatomia do relatório "Margem de Lucro de Combustíveis" (.xlsx)

Este é o formato padrão dos relatórios que chegam por email com assunto "vendas".
O parser (`parser_relatorio.py`) foi escrito exatamente para esta estrutura —
se o arquivo fugir dela, o parser emite warning e pula o arquivo (não invente dados).

## Estrutura geral do arquivo

O relatório é uma planilha única (primeira aba) organizada em blocos verticais:

1. **Cabeçalho do relatório** (linhas iniciais): título "Margem de Lucro de Combustíveis",
   período, data/hora de emissão. Varia entre sistemas — ignorar.
2. **Linha da filial**: uma célula (geralmente coluna A) no formato:

   ```
   Filial: 502 - POSTO 10 TRUCK
   ```

   É ESTA linha que identifica a filial — **nunca** o nome do arquivo.
3. **Blocos por produto**, repetidos N vezes. Cada bloco tem:
   - Linha do produto: `Produto: 000002 - ETANOL`
   - Linha de cabeçalho de colunas
   - Linhas de dados (uma por dia de venda)
   - Linha `Subtotal` do produto — **IGNORAR** (recalcular sempre)
4. **Linha `Total`** geral no fim do arquivo — **IGNORAR** (recalcular sempre)

## Cabeçalho de colunas (ordem exata)

| Dt. Venda | Dias | P.Custo | P.Venda | Venda-Custo | % Mrg Bruta | % Markup | Litragem | T. Custo | T. Venda | L.Bruto |
|-----------|------|---------|---------|-------------|-------------|----------|----------|----------|----------|---------|

Significado de cada coluna:

| Coluna | Conteúdo | Tipo na célula |
|--------|----------|----------------|
| `Dt. Venda` | Data da venda | **datetime** (não string!) |
| `Dias` | Contador de dias do período | inteiro (não usamos) |
| `P.Custo` | Preço de custo unitário (R$/L) | float |
| `P.Venda` | Preço de venda unitário (R$/L) | float |
| `Venda-Custo` | Diferença unitária (R$/L) | float (redundante, não usamos) |
| `% Mrg Bruta` | Margem bruta percentual | float (ex: 18.42) |
| `% Markup` | Markup percentual | float |
| `Litragem` | Volume vendido no dia (litros) | float |
| `T. Custo` | Custo total do dia (R$) | float |
| `T. Venda` | Receita total do dia (R$) | float |
| `L.Bruto` | Lucro bruto do dia (R$) | float |

## Exemplo esquemático de layout de células

Representação célula a célula (coluna A até K). Linhas vazias entre blocos podem existir:

```
A1:  Margem de Lucro de Combustíveis
A2:  Período: 01/09/2026 a 07/09/2026
A3:  (vazia)
A4:  Filial: 502 - POSTO 10 TRUCK
A5:  (vazia)
A6:  Produto: 000002 - ETANOL
A7:  Dt. Venda | B7: Dias | C7: P.Custo | D7: P.Venda | E7: Venda-Custo | F7: % Mrg Bruta | G7: % Markup | H7: Litragem | I7: T. Custo | J7: T. Venda | K7: L.Bruto
A8:  2026-09-01 (datetime) | 1 | 3.89 | 4.79 | 0.90 | 18.79 | 23.14 | 1520.5 | 5914.75 | 7283.20 | 1368.45
A9:  2026-09-02 (datetime) | 1 | 3.89 | 4.79 | 0.90 | 18.79 | 23.14 | 1610.0 | 6262.90 | 7711.90 | 1449.00
...
A14: Subtotal |  |  |  |  | 18.79 |  | 9834.2 | 38255.04 | 47105.82 | 8850.78   ← IGNORAR
A15: (vazia)
A16: Produto: 000005 - GASOLINA COMUM
A17: (cabeçalho de colunas repetido)
A18: dados...
...
A60: Total |  |  |  |  |  |  | 48120.7 | 231480.11 | 278930.45 | 47450.34    ← IGNORAR
```

Pontos de atenção:

- A data em `Dt. Venda` vem como **datetime nativo do Excel**, não como texto.
  É o critério mais confiável para reconhecer uma linha de dados.
- `Subtotal` e `Total` aparecem na coluna A como texto. Sempre ignorar e
  recalcular na consolidação (os subtotais do sistema às vezes arredondam diferente).
- Alguns sistemas repetem o cabeçalho de colunas dentro de cada bloco de produto;
  outros só colocam uma vez. O parser trata os dois casos (linhas de cabeçalho
  são ignoradas porque a coluna A não é datetime).

## Regras de limpeza (obrigatórias)

1. **Produto** — remover o código numérico e normalizar capitalização:
   - `Produto: 000002 - ETANOL` → `Etanol`
   - `Produto: 000005 - GASOLINA COMUM` → `Gasolina Comum`
   - `Produto: 000009 - DIESEL S10` → `Diesel S10` (siglas S10/S500 mantêm maiúsculas)
2. **Filial** — **manter o formato original com código**:
   - `Filial: 502 - POSTO 10 TRUCK` → `502 - POSTO 10 TRUCK`
   - Só remover o prefixo `Filial:` e espaços extras. O código numérico faz parte
     da identidade da filial e é usado nos comparativos.
3. **Linhas descartadas**: `Subtotal`, `Total`, cabeçalhos repetidos, linhas vazias.
4. **Números**: usar os valores das células como vêm (float). Não reparsear texto
   com vírgula — o Excel já guarda o número real.

## Colunas do DataFrame de saída (Passo 4 do SKILL.md)

```
Data, Filial, Produto, P_Custo, P_Venda, Margem_Bruta_Pct, Markup_Pct,
Litragem, Total_Custo, Total_Venda, Lucro_Bruto
```

Mapeamento a partir do relatório:

| DataFrame | Relatório |
|-----------|-----------|
| `Data` | `Dt. Venda` (datetime → date) |
| `Filial` | linha `Filial: ...` (limpa, com código) |
| `Produto` | linha `Produto: ...` (limpa, sem código) |
| `P_Custo` | `P.Custo` |
| `P_Venda` | `P.Venda` |
| `Margem_Bruta_Pct` | `% Mrg Bruta` |
| `Markup_Pct` | `% Markup` |
| `Litragem` | `Litragem` |
| `Total_Custo` | `T. Custo` |
| `Total_Venda` | `T. Venda` |
| `Lucro_Bruto` | `L.Bruto` |

A coluna `Dias` e a `Venda-Custo` do relatório **não** entram no DataFrame.

## Relatório fora do formato

Se o arquivo não tiver a linha `Filial:` ou nenhuma linha de dados reconhecível,
o parser emite um warning e pula o arquivo. Nesse caso, avise o Ramsés qual
arquivo foi pulado e por quê — nunca preencha com dados inventados.
