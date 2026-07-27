---
name: divisao-carrossel
description: Gera um CARROSSEL completo no modelo visual DIVISAO (editorial off-white + tinta + 1 palavra em ouro) para o Instagram @eusouramses (Ramses Castoldi). Use SEMPRE que o usuario disser "carrossel", "carrossel divisao", "faz um carrossel", "carrossel editorial", "carrossel de atos", ou pedir varios slides no estilo split-screen. Entrega CAPA (foto+tese) + N slides ATO numerados + slide CTA mentoria, todos PNG 1080x1350 + legenda + funil de stories. A skill PERGUNTA a cada vez se o usuario vai mandar foto real OU quer prompt de imagem realista para a capa.
---

# Skill: divisao-carrossel — CARROSSEL (modelo DIVISAO)

Carrossel editorial coeso: **CAPA** (foto + tese) -> **ATOS numerados** (so papel, ideia por slide) -> **CTA** (mentoria). Mesma regua de ouro, mesmas fontes, mesmo rodape, numero de pagina no canto.

## ATALHO
Ativa quando o usuario disser: **"carrossel"**, "carrossel divisao", "faz um carrossel", "carrossel de atos".

## ESTRUTURA PADRAO
- **Slide 1 — CAPA** (`fmt="capa"`): foto em cima + tese + sublinha "Deslize. Ato por ato." + page "01 / N".
- **Slides 2..N-1 — ATO** (`fmt="ato"`): so papel, kicker "ATO 0X", 1 ideia forte com [[palavra]] em ouro, page "0X / N".
- **Slide N — CTA** (`fmt="cta"`): kicker "O PROXIMO PASSO", index "MENTORIA 1:1", bloco de convite + "[[@eusouramses]]".

Recomendado: 6 slides (capa + 4 atos + cta).

## ENTREGAVEIS
1. **N PNGs** 1080x1350 (render 2x), nomeados `carrossel_01..0N`.
2. **Legenda** ~1100 chars + **funil de 4 stories**.

## SISTEMA VISUAL (identico ao post/reels)
Papel `#F4EFE4` · Tinta `#181612` · OURO `#B0852E`. Lora Bold + IBM Plex Mono + selo RC. 1 palavra ouro por slide. Rodape fixo.

## PROCESSO
1. **Tema + arco:** definir a tese (capa) e 3–5 atos (1 ideia cada) + CTA.
2. **Apresentar rascunho dos textos ANTES de renderizar** (capa, atos, cta).
3. **PERGUNTAR a foto da capa:** "Foto sua/do posto ou prompt de imagem realista?"
4. **Renderizar todos os slides** (snippet abaixo).
5. **Legenda + funil.** 6. **Entregar via present_files.**

## RENDER
```python
import sys, os
SKILL_DIR = os.path.dirname(os.path.abspath("SKILL.md"))
sys.path.insert(0, SKILL_DIR)
from divisao_engine import render_format
OUT = "/mnt/user-data/outputs"; os.makedirs(OUT, exist_ok=True)
N = 6
render_format("capa", {
    "kicker":"Carrossel · %d atos" % (N-2), "index":"ESTRATEGIA / Nº 015", "page":"01 / 0%d"%N,
    # "photo":"/mnt/user-data/uploads/foto.jpg",
    "headline":["5 decisoes que","separam quem","[[lucra]] de quem","so fatura."],
    "subline":"Deslize. Ato por ato."}, os.path.join(OUT,"carrossel_01.png"))

atos = [
  (["Quem vende","sem saber a","[[margem]],","vende no escuro."], "Preco sem custo e aposta, nao gestao."),
  (["Estoque parado","nao e ativo.","E dinheiro","[[preso]]."], "Gire ou enxugue."),
  # ... mais atos
]
for i,(hl,sub) in enumerate(atos, start=2):
    render_format("ato", {"kicker":"Ato 0%d"%i, "index":"ESTRATEGIA / Nº 015",
        "page":"0%d / 0%d"%(i,N), "headline":hl, "subline":sub},
        os.path.join(OUT,"carrossel_0%d.png"%i))

render_format("cta", {"kicker":"O proximo passo","index":"MENTORIA 1:1","page":"0%d / 0%d"%(N,N),
    "headline":["Pronto para","decidir com","[[metodo]]?"],
    "cta_lines":["Trabalho lado a lado com empresarios","que pararam de apostar e passaram","a decidir com dado. Vagas limitadas.","","Processo seletivo no link da bio.","[[@eusouramses]]"]},
    os.path.join(OUT,"carrossel_0%d.png"%N))
```

## MODELO DE PROMPT DE IMAGEM REALISTA (capa)
> Retrato cinematografico realista, empresario brasileiro ~45 anos, luz lateral suave, fundo grafite desfocado, paleta quente sobria, 85mm, respiro no topo, sem texto/logo. Variacoes: escritorio / posto ao entardecer / terno escuro.

## QUALIDADE
1 ideia por ato, 1 palavra ouro por slide, numero de pagina sempre, rodape fixo, render 2x.
