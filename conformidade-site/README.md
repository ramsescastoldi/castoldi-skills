# Central de Análise de Conformidade — Lumen Posto Club

Site publicado em **https://conformidade.lumenclubpainel.com.br**
(Cloudflare Pages, projeto `lumen-conformidade`, deploy por upload direto via wrangler).

`index.html` é a página inteira (HTML + CSS + JS). Ele foi recuperado da versão publicada
em produção (deploy de 02/11/2026), porque o código-fonte original só existia numa pasta local.

## Revisão semanal das normas

Toda a base normativa fica no bloco `CONFIG` do `<script>`:

- `vigencia.confirmadoEm`: data da última conferência (o site marca "vencida" 7 dias depois);
- `vigencia.normas`: os chips e o checklist da rotina semanal;
- `gasolina`, `etanol`, `diesel`: as faixas usadas no veredito.

**E32 é temporário.** Vale desde 01/08/2026 por 180 dias (até ~28/01/2027) e pode ser
prorrogado uma vez. Se não houver prorrogação, volte `gasolina.comum` para
`{alvo:30,min:29,max:31}` e troque os textos "E32" por "E30".

## ⚠️ Antes de publicar

O site em produção também tem uma **Pages Function** (`/api/gate`, que faz o bloqueio de
acesso por WhatsApp). O código dela **não está neste repositório**. Um `wrangler pages deploy`
feito só com esta pasta **apaga essa função** e quebra o bloqueio.

Para publicar, copie este `index.html` para a pasta local original do projeto (a que tem a
pasta `functions/`) e rode o deploy de lá:

```bash
npx wrangler pages deploy . --project-name lumen-conformidade --branch main
```
