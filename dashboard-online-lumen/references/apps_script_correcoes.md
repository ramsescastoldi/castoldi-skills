# Apps Script — `doGet()` corrigido (formatação de datas)

Código pronto para o Web App que alimenta o dashboard online. Corrige o bug
conhecido de **datas serializadas como ano puro** (ex: `2026`), que quebra o
período no header e a timeline do dashboard.

## O bug

Quando o `doGet()` devolve o valor cru da célula de data, o `JSON.stringify`
do Apps Script pode serializar como Date ISO com fuso deslocado — e, em células
mal formatadas, como **só o ano** (`2026`). No dashboard isso aparece como:

- período no header virando `-` ou `/A/`
- gráfico "Evolução Diária" vazio ou com pontos isolados
- tela de aviso "as datas vieram inválidas"

## A correção

Formatar a data **dentro do `doGet()`** com
`Utilities.formatDate(data, "America/Cuiaba", "yyyy-MM-dd")` — assim o JSON já
sai com a string ISO certa, no fuso de Cuiabá, e o HTML não precisa adivinhar
nada.

## Código completo (substituir o `doGet()` inteiro)

```javascript
/**
 * doGet — API do dashboard online Lumen.
 * Lê a aba "Vendas" da planilha "Base Master Vendas — Lumen" e devolve
 * um array JSON de registros, com Data formatada como "yyyy-MM-dd"
 * no fuso America/Cuiaba (correção do bug de datas como ano puro).
 */
function doGet() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet(); // Base Master Vendas — Lumen
  var aba = planilha.getSheetByName("Vendas");
  if (!aba) {
    return ContentService
      .createTextOutput(JSON.stringify({ erro: "Aba 'Vendas' não encontrada" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) {
    // só cabeçalho (ou vazia) — devolve array vazio, não erro
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var cabecalho = valores[0]; // Data | Filial | Produto | P_Custo | P_Venda | ...
  var registros = [];

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0] && !linha[1]) continue; // linha vazia

    var registro = {};
    for (var j = 0; j < cabecalho.length; j++) {
      var campo = String(cabecalho[j]).trim();
      var valor = linha[j];

      if (campo === "Data") {
        // >>> A CORREÇÃO: nunca mandar o Date cru <<<
        if (valor instanceof Date) {
          registro[campo] = Utilities.formatDate(valor, "America/Cuiaba", "yyyy-MM-dd");
        } else {
          // célula como texto: manda como veio (o parseDate do HTML trata DD/MM/YYYY)
          registro[campo] = String(valor);
        }
      } else if (typeof valor === "number") {
        registro[campo] = valor;
      } else {
        registro[campo] = String(valor).trim();
      }
    }
    registros.push(registro);
  }

  return ContentService
    .createTextOutput(JSON.stringify(registros))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Pontos do código que NÃO podem ser mudados:

- `Utilities.formatDate(valor, "America/Cuiaba", "yyyy-MM-dd")` — o fuso é
  **America/Cuiaba** (MT). Usar o fuso do script/planilha errado desloca a
  venda pro dia anterior/seguinte.
- `ContentService.createTextOutput(JSON.stringify(...)).setMimeType(ContentService.MimeType.JSON)`
  — é o padrão de resposta JSON de Web App. Não usar `HtmlService`.
- Os nomes das colunas da aba `Vendas` viram os nomes dos campos do JSON —
  precisam bater com `references/api_data_schema.md`
  (`Data, Filial, Produto, P_Custo, P_Venda, Margem_Bruta_Pct, Markup_Pct, Litragem, Total_Custo, Total_Venda, Lucro_Bruto`).

## Passo a passo para publicar (NOVA implantação — obrigatório)

⚠️ **Salvar o código NÃO atualiza o Web App.** Apps Script só serve a versão
implantada — depois de editar o `doGet()`, é preciso criar uma **NOVA
implantação**:

1. Na planilha **Base Master Vendas — Lumen**: menu **Extensões → Apps Script**.
2. Substituir a função `doGet()` inteira pelo código acima e salvar (Ctrl+S).
3. Clicar em **Implantar → Nova implantação**.
4. Tipo: **App da Web**.
5. Configurar:
   - "Executar como": **Eu** (a conta do Ramsés)
   - "Quem tem acesso": **Qualquer pessoa** (senão dá CORS no dashboard)
6. Clicar **Implantar** e autorizar se pedir.
7. Copiar a **URL do app da Web** (começa com
   `https://script.google.com/macros/s/` e termina em `/exec`).

⚠️ **A URL MUDA a cada nova implantação.** A URL antiga continua servindo o
código VELHO. Depois de implantar:

8. Atualizar a linha `const API_URL = "...";` no `index.html` com a URL nova —
   edição via ferramenta (str_replace), mantendo o `=` e as aspas.
9. Redeploy no Netlify (arrastar o `index.html` na aba Deploys).
10. Testar em **janela anônima** (Ctrl+Shift+N).

## Como testar a API isolada (antes de mexer no HTML)

Cole a URL `/exec` direto no navegador. Resposta esperada: JSON puro começando
com `[{"Data":"2026-...`. Se aparecer página de login do Google ou HTML,
a implantação não está pública (voltar ao passo 5) ou a URL é a errada.
