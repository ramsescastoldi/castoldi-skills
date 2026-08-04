---
name: texto-post-noticia
description: 'Gera o POST DE NOTÍCIA no MODELO CARD DE MATÉRIA para o Instagram @eusouramses (Ramses Castoldi) — foto da notícia sangrando na tela inteira 1080x1350 com um card branco arredondado sobreposto reproduzindo a matéria real (editoria, manchete, linha-fina, assinatura, data e veículo). Use SEMPRE que o usuário disser "card de matéria", "post de notícia", "modelo card", "post estilo print", "card de notícia", "modelo Metrópoles", "modelo g1", ou pedir a arte de uma notícia no formato de print de reportagem. Quatro estilos: metropoles, g1, veja, expresso. SEMPRE pedir a foto e o LINK da matéria antes de renderizar — manchete, autor e data são copiados do veículo, nunca inventados. Entrega o PNG + legenda de ~1000 caracteres + funil de 4 stories.'
---

# Skill: texto-post-noticia

Post de notícia no formato "print da matéria": a foto sangra na tela inteira e
um card branco reproduz a reportagem real. É o formato que empresta a
credibilidade do veículo ao post — e por isso exige rigor com a fonte.

## REGRA ZERO — INTEGRIDADE DA MATÉRIA

Este formato só é legítimo enquanto reproduz uma matéria que **existe**.

- **Manchete:** copiada do veículo, sem uma vírgula mudada. Editorializar a
  manchete e manter a marca do veículo embaixo é falsificar matéria.
- **Autor:** o nome real da assinatura. Se a matéria não tem assinatura, ou não
  foi possível confirmar, use `Redação` — **nunca invente nome de jornalista**.
- **Data e veículo:** como saíram na página.
- **Link:** obrigatório antes de renderizar. Sem link conferido, não renderiza.
- A opinião do Ramsés vai na **legenda** e no slide 2, nunca dentro do card.

Motivo prático, além do ético: o perfil já teve link bloqueado pelo Meta.
Matéria adulterada com marca de veículo é exatamente o que derruba conta.

## PASSO OBRIGATÓRIO ANTES DE RENDERIZAR

Pedir ao usuário (ou puxar da fila do fluxo ninja, `fila/AAAA-MM-DD.json`):

1. A **foto** da matéria (idealmente a `og:image` da própria página).
2. O **link** da matéria.
3. Confirmar **manchete, linha-fina, autor, data, veículo e editoria** lendo a
   página. Campo que não der para confirmar: deixa de fora, não inventa.

## LAYOUT — 1080x1350, 2x retina

- Foto cobrindo a tela inteira (cover, sem distorcer).
- Card branco arredondado (raio 26), margem lateral 58 e inferior 66, com
  sombra sutil para recortar sobre foto clara.
- Dentro do card, nesta ordem: editoria → manchete → linha-fina → assinatura,
  data e veículo. Altura do card calculada a partir do conteúdo.
- Manchete com corpo auto-ajustável (máx. 3 linhas com linha-fina, 4 sem).

### Estilos (`--estilo`)

| Estilo | Referência | Característica |
|---|---|---|
| `metropoles` | Metrópoles | padrão; serifada Bitter, editoria vermelha, veículo à direita |
| `g1` | g1 | sans Inter, sem editoria, byline "Por **Nome**, veículo — praça" |
| `veja` | Veja Negócios | tudo centralizado, editoria em versalete espacejado |
| `expresso` | Estadão/Expresso | barra vertical de acento ao lado da manchete |

## COMO GERAR

```bash
python scripts/gerar_noticia.py \
  --foto foto.jpg \
  --kicker "Economia" \
  --manchete "Manchete exatamente como saiu no veículo" \
  --linha-fina "Linha-fina real da matéria." \
  --autor "Nome Real" --data "04/08/2026 09h12" --veiculo "Agência Senado" \
  --estilo metropoles \
  --saida /mnt/user-data/outputs/post_noticia.png
```

Byline dividido (estilo g1 — só o nome sai colorido):
`--autor-prefixo "Por " --autor "Nome Real" --autor-sufixo ", g1 — Brasília"`

Assinatura discreta do perfil no rodapé do card: `--assinatura`

### Direto do link (caminho preferido — exige rede livre)

`render_do_link.py` lê a página, extrai `og:image`, manchete, linha-fina,
autor e data, baixa a foto e renderiza. É o que o fluxo automático deve chamar.

```bash
python3 scripts/render_do_link.py \
  --link "https://veiculo.com.br/materia" \
  --estilo metropoles --saida ~/renders/post.png --telegram
```

- Autor sai do JSON-LD (`author.name`) ou das metatags; sem assinatura
  confirmada, cai em `Redação`. Nunca inventa nome.
- `--telegram` envia no `@ramsesninjabot`, lendo o token de `~/lumen-ninja/.env`.
- Página sem `og:image` aborta com aviso — nesse caso passe a foto na mão pelo
  `gerar_noticia.py`.
- `--manchete` existe só para consertar extração torta, **nunca** para
  editorializar (ver REGRA ZERO).

**QC obrigatório:** abrir o PNG (Read) antes de entregar — nada cortado,
quebrado ou encostando.

## ENTREGÁVEIS

1. **PNG** 1080x1350.
2. **Legenda ~1000 caracteres**, primeira linha `@eusouramses`, em code block.
   É aqui que mora a tese — o card é neutro de propósito. Estrutura: re-hook →
   o fato com o crédito ao veículo → leitura liberal (Bastiat/Hayek quando
   couber) → CTA "Comenta MENTORIA".
3. **Funil de 4 stories** (1h, 4h, 8h, 20h após postar).

## REGRAS DE COPY

Valem as do fluxo ninja (`~/lumen-ninja/prompts/copy-doutrina.md`):
herói é o leitor, atacar culturas e sistemas — nunca pessoas ou grupos,
sem promessa de ganho financeiro, sem URL enquanto durar o bloqueio,
CTA só com MARGEM · MENTORIA · CRESCER · EU QUERO.

## ASSETS

- `assets/Bitter.ttf` — serifada da manchete/linha-fina (variável, pesos nomeados).
- `assets/Inter.ttf` — sans de editoria, assinatura, data e veículo.
- `assets/Lora.ttf` — serifada do estilo `veja`.
