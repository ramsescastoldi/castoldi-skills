---
name: divisao-reels
description: Gera a CAPA de REELS (1080x1920 vertical) no modelo visual DIVISAO (editorial off-white + tinta + 1 palavra em ouro) para o Instagram @eusouramses (Ramses Castoldi). Use SEMPRE que o usuario disser "reels", "capa de reels", "capa do reels", "thumb do reels", "faz a capa", "reels divisao", ou pedir a arte de cima de um video vertical. Entrega PNG 1080x1920 renderizado + roteiro/gancho + legenda + funil de stories. A skill PERGUNTA a cada vez se o usuario vai mandar foto real (frame do video) OU quer um prompt de imagem realista.
---

# Skill: divisao-reels — CAPA DE REELS (modelo DIVISAO)

Capa vertical 9:16: **foto/frame cinematografico em cima (60%)**, gancho editorial embaixo sobre papel off-white, **uma palavra em ouro**. Mesma identidade do post e do carrossel.

## ATALHO
Ativa quando o usuario disser: **"reels"**, "capa de reels", "capa do reels", "thumb", "faz a capa".

## ENTREGAVEIS
1. **PNG** 1080x1920 (render 2x).
2. **Gancho de abertura** (3 primeiros segundos) + bullets do roteiro.
3. **Legenda** ~1100 chars + **funil de 4 stories**.

## SISTEMA VISUAL (identico ao post)
- Papel `#F4EFE4` · Tinta `#181612` · OURO `#B0852E`. Manchete Lora Bold · rotulos IBM Plex Mono · selo RC.
- 1 palavra em ouro (`[[palavra]]`). Rodape fixo: RC + RAMSES CASTOLDI + @eusouramses + indice.
- Foto ocupa 60% do topo (mais alta que no post, por ser vertical).

## TEXTO DA CAPA
Gancho curto e seco, que para o scroll. 3–6 linhas. Ex.:
"O lucro do seu posto nao vaza na bomba. Vaza na [[decisao]]."
Kicker tipico: "ASSISTA ATE O FIM", "VEJA ISSO", "3 ERROS".

## PROCESSO
1. **Tema/gancho** (se nao dado, escolher validado).
2. **Construir o gancho** com 1 palavra em ouro + kicker + indice (`REELS · ESTRATEGIA`).
3. **PERGUNTAR a foto:** "Manda um frame do video / foto sua, ou quer um prompt de imagem realista?"
   - FOTO -> `"photo":"/caminho/frame.jpg"`. PROMPT -> entregue o prompt e renderize com placeholder.
4. **Renderizar** (snippet abaixo).
5. **Roteiro:** gancho (0–3s) + 3 a 5 bullets + CTA falado.
6. **Legenda + funil de stories.**
7. **Entregar via present_files.**

## RENDER
```python
import sys, os
SKILL_DIR = os.path.dirname(os.path.abspath("SKILL.md"))
sys.path.insert(0, SKILL_DIR)
from divisao_engine import render_format
OUT = "/mnt/user-data/outputs"; os.makedirs(OUT, exist_ok=True)

render_format("reels", {
    "kicker": "Assista ate o fim",
    "index":  "REELS · ESTRATEGIA",
    "photo_tag": "RAMSES CASTOLDI",
    # "photo": "/mnt/user-data/uploads/frame.jpg",
    "headline": ["O lucro do seu", "posto nao vaza", "na bomba.", "Vaza na", "[[decisao]]."],
    "subline":  "3 erros que drenam a margem.",
}, os.path.join(OUT, "reels_divisao.png"))
```

## MODELO DE PROMPT DE IMAGEM REALISTA
> Frame cinematografico vertical 9:16, realista, empresario brasileiro ~45 anos, [acao], luz lateral suave, fundo grafite desfocado, paleta quente sobria, 85mm, respiro no topo, sem texto/logo. Variacoes: escritorio / posto ao entardecer / terno escuro.

## QUALIDADE
Texto contido, 1 palavra ouro, rodape fixo, render 2x. Foto a 60% do topo.
