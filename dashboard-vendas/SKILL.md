---
name: dashboard-vendas
description: Compila relatórios de vendas de combustíveis enviados por email para gerar um dashboard consolidado com comparativo de margem entre filiais. Use SEMPRE que o usuário (Ramsés) digitar o comando "dashboard", "gerar dashboard", "atualizar dashboard", "dashboard de vendas", ou variações como "monta o dashboard das filiais", "compila as vendas da semana", "comparativo de margem". Cobre: busca no Gmail por emails com assunto "vendas" e anexos dos últimos 7 dias, download e parsing de planilhas .xlsx no formato do relatório de Margem de Lucro de Combustíveis, identificação automática de filial pelo cabeçalho do relatório, consolidação multi-filial, geração de dashboard React interativo + planilha Excel consolidada com comparativos.
license: Proprietária - uso interno Lumen Posto Club / rede de postos.
---

# Dashboard de Vendas Multi-Filial

## Quando usar esta skill

Acione esta skill SEMPRE que o usuário digitar:
- "dashboard"
- "gerar dashboard"
- "atualizar dashboard"
- "dashboard de vendas"
- "monta o dashboard"
- "compila as vendas"
- "comparativo de margem por filial"
- ou qualquer variação clara que peça consolidação de vendas das filiais

## Contexto do usuário

O usuário é **Ramsés**, gestor de uma rede de postos de combustíveis (Lumen Posto Club / rede com múltiplas filiais identificadas por código numérico, ex: "502 - POSTO 10 TRUCK"). Ele recebe relatórios de vendas por email regularmente e precisa de visão consolidada com comparativo entre filiais.

## Fluxo obrigatório (executar nesta ordem)

### Passo 1 — Confirmar intenção e período

Antes de buscar emails, confirme brevemente o período. **NÃO pergunte tudo de novo** — apenas confirme o padrão:

> "Vou buscar relatórios de vendas dos últimos 7 dias no seu email. Confirma ou prefere outro período?"

Aguarde resposta. Se confirmar, prossiga. Se pedir outro período, ajuste.

### Passo 2 — Buscar emails no Gmail

Use a ferramenta `Gmail:search_threads` com a query:

```
subject:vendas has:attachment newer_than:7d
```

(ajustar `newer_than` conforme período confirmado: `7d`, `30d`, etc.)

Configure `pageSize: 50` para garantir cobertura.

Se a busca retornar **zero resultados**, informe o usuário:
> "Não encontrei emails com assunto 'vendas' e anexos nos últimos X dias. Quer que eu busque em outro período ou com outro assunto?"

### Passo 3 — Listar threads encontradas e identificar anexos

Para cada thread retornada, use `Gmail:get_thread` com `messageFormat: FULL_CONTENT` para obter os anexos.

**Importante:** o conector Gmail atual NÃO baixa anexos diretamente. Se a skill conseguir extrair texto da mensagem mas não os anexos binários (.xlsx), informe o usuário:

> "Encontrei X emails relevantes. O Gmail não permite baixar anexos automaticamente — você precisa baixar os arquivos e me enviar pelo chat (arrastar ou clicar em 'anexar'). Aqui estão os emails encontrados:
> - [data] — [remetente] — [assunto] — [nome do anexo]
> - ..."

Liste todos os emails com data, remetente e nome do anexo. Em seguida aguarde os arquivos serem enviados via upload.

### Passo 4 — Processar cada planilha recebida

Para cada arquivo `.xlsx` em `/mnt/user-data/uploads/`:

1. **Leia primeiro o SKILL.md de xlsx**: `/mnt/skills/public/xlsx/SKILL.md`
2. **Use o parser de referência**: ver `references/parser_relatorio.py`
3. **Estrutura esperada do relatório** (ver `references/formato_relatorio.md`):
   - Linha "Filial: XXX - NOME DA FILIAL"
   - Linhas "Produto: 000XXX - NOME DO PRODUTO"
   - Cabeçalho "Dt. Venda | Dias | P.Custo | P.Venda | Venda-Custo | % Mrg Bruta | % Markup | Litragem | T. Custo | T. Venda | L.Bruto"
   - Linhas de dados com data como datetime
   - Linhas "Subtotal" e "Total" — IGNORAR (recalcular)

4. **Extraia para DataFrame com colunas**: `Data, Filial, Produto, P_Custo, P_Venda, Margem_Bruta_Pct, Markup_Pct, Litragem, Total_Custo, Total_Venda, Lucro_Bruto`

5. **Limpe nomes**: remover códigos dos produtos (ex: "000002 - ETANOL" → "Etanol"), normalizar nome da filial (manter formato "502 - POSTO 10 TRUCK")

6. **Concatene** todos os DataFrames em um único `df_consolidado`

### Passo 5 — Validar dados consolidados

Antes de gerar o dashboard:
- Verifique se há **mais de uma filial** no consolidado (objetivo da skill é comparativo)
- Se só houver uma filial, alerte: "Só identifiquei a filial X. Quer que eu gere o dashboard mesmo assim ou tem outras planilhas pra incluir?"
- Verifique datas: se houver datas no futuro relativo a `today()`, alerte mas prossiga
- Verifique outliers: margens > 50% ou < 0% devem ser sinalizadas mas não removidas

### Passo 6 — Gerar planilha consolidada

Salve em `/mnt/user-data/outputs/Vendas_Consolidadas.xlsx` com:

- **Aba 1 "Dados"**: tabela limpa completa (uma linha por venda)
- **Aba 2 "Por Filial"**: pivot com `Receita Total`, `Lucro Total`, `Volume (L)`, `Margem Média %`, `Ticket Médio R$/L` por filial
- **Aba 3 "Por Produto x Filial"**: pivot cruzado de margem média
- **Aba 4 "Ranking"**: filiais ordenadas por margem média (com rank)

Use FÓRMULAS Excel reais (`=SUMIFS(...)`, `=AVERAGEIFS(...)`), não valores hardcoded — para que a planilha continue dinâmica se Ramsés colar mais dados depois.

### Passo 7 — Gerar dashboard React

Salve em `/mnt/user-data/outputs/dashboard_vendas.jsx`.

Use o template em `references/dashboard_template.jsx` como base. Substitua o array `dadosBrutos` pelos dados reais consolidados (formato JSON inline no JSX).

**Componentes obrigatórios do dashboard:**

1. **Header** com título "Comparativo de Vendas — Multi-Filial", período coberto, data de geração
2. **Filtros** por filial e por produto (botões)
3. **6 KPIs no topo**: Receita, Lucro, Margem Média %, Volume (L), Custo, Preço Médio R$/L — refletindo filtro
4. **Card "Ranking de Filiais"**: tabela ordenada por margem média com:
   - Posição (#)
   - Filial
   - Receita
   - Lucro
   - Margem %
   - Indicador visual (▲ ▼ —) comparando com a média da rede
5. **Gráfico de barras horizontal**: Receita por Filial
6. **Gráfico de barras**: Margem Média % por Filial (com linha indicando média geral da rede)
7. **Heatmap/tabela cruzada**: Margem por Produto × Filial (cor mais escura = margem maior)
8. **Timeline**: Receita diária consolidada (todas as filiais somadas)
9. **Footer** com contagem: "X filiais · Y produtos · Z registros · período DD/MM a DD/MM"

**Paleta visual** (manter consistência com a identidade Lumen):
- Background: `#0F1419` (azul-petróleo escuro)
- Cards: `#1A2330`
- Bordas: `#2A3441`
- Acento principal: `#C8102E` (vermelho — combustível)
- Verde lucro: `#2D7D46`
- Amarelo destaque: `#E89923`
- Tipografia: Fraunces (display, serif) + JetBrains Mono (mono) + Inter (corpo)

### Passo 8 — Apresentar resultado

Use `present_files` com **dois arquivos** na ordem:
1. `dashboard_vendas.jsx` (primário, abre como artifact)
2. `Vendas_Consolidadas.xlsx`

Em seguida, escreva um **resumo executivo curto** (não um relatório longo) destacando:
- Quantas filiais foram consolidadas
- Filial com **maior margem** e filial com **menor margem** (com os percentuais)
- Filial com **maior receita**
- Algum **alerta** que tenha aparecido (margem negativa, dados ausentes, divergência)
- Período coberto

Formato sugerido do resumo (em prosa, não bullets longos):

> "Consolidei N filiais cobrindo o período DD/MM a DD/MM.
>
> A filial **X — NOME** liderou em margem (XX,X%), enquanto **Y — NOME** ficou na lanterna (XX,X%) — diferença de Z pontos. Em volume de receita, **W — NOME** foi a maior com R$ XX milhões.
>
> [Se houver alerta:] ⚠️ Notei que [descrever alerta concreto].
>
> O dashboard interativo abre acima e a planilha consolidada permite drill-down."

## Regras importantes

- **NÃO** invente dados. Se um relatório vier corrompido ou em formato diferente, alerte o usuário e pule esse arquivo.
- **NÃO** rode esta skill sem ter recebido as planilhas. Se o usuário disser "dashboard" mas o Gmail não permitir baixar anexos, oriente o upload manual ANTES de prosseguir.
- **NÃO** confunda esta skill com `posto-escala-analyzer` (que analisa escalas de funcionários) ou `lumen-newsletter` (que gera newsletter editorial). Esta é exclusivamente sobre dashboard de vendas/margem.
- **SEMPRE** identifique a filial pelo cabeçalho "Filial: XXX - NOME" dentro do arquivo, não pelo nome do arquivo (que pode variar).
- **SEMPRE** entregue ambos os arquivos: o `.jsx` para visualização e o `.xlsx` para edição/auditoria.

## Limitações conhecidas

Comunique ao usuário se ele perguntar sobre automação:

- Esta skill NÃO roda automaticamente todo dia. Ela executa quando o usuário digita "dashboard".
- O conector Gmail atual NÃO baixa anexos binários — eles precisam ser enviados via upload manual no chat. Isso é uma limitação do conector, não da skill.
- Para automação real diária (sem intervenção), recomendar ferramentas como Make.com, n8n ou Zapier conectando Gmail → Google Sheets → Looker Studio.

## Referências disponíveis

- `references/formato_relatorio.md` — anatomia do relatório padrão de Margem de Lucro
- `references/parser_relatorio.py` — código pronto para extrair dados estruturados
- `references/dashboard_template.jsx` — template visual base do dashboard
- `references/exemplo_consolidacao.md` — exemplo completo de execução da skill
