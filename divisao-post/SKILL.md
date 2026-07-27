---
name: divisao-post
description: Gera um POST UNICO no modelo visual DIVISAO (editorial off-white + tinta + 1 palavra em ouro) para o Instagram @eusouramses (Ramses Castoldi). Use SEMPRE que o usuario disser "post", "post divisao", "faz um post", "post no modelo divisao", "post editorial", "post do posto", ou pedir uma arte de post unico no estilo split-screen (foto em cima, frase embaixo). Entrega PNG 1080x1350 renderizado + legenda + funil de stories. A skill PERGUNTA a cada vez se o usuario vai mandar foto real OU quer um prompt de imagem realista.
---

# Skill: divisao-post — POST UNICO (modelo DIVISAO)

Modelo visual oficial alternativo do @eusouramses: **editorial claro** (papel off-white) que se destaca no feed escuro do nicho empresario. Foto cinematografica em cima, tese embaixo, **uma palavra em ouro**.

## ATALHO
Ativa quando o usuario disser: **"post"**, "post divisao", "faz um post", "post editorial", "post unico".
(Se ele quiser o modelo preto antigo, use a skill posts-virais-empresariais-v3.)

## ENTREGAVEIS (sempre os 3)
1. **PNG** 1080x1350 (render 2x) no modelo DIVISAO.
2. **Legenda** ~1100 caracteres (estrutura de 7 blocos, estilo filosofico-liberal, CTA mentoria 1:1).
3. **Funil de 4 stories** (1h teaser / 4h enquete / 8h frase-bomba / 20h CTA).

## SISTEMA VISUAL (nao alterar)
- Papel `#F4EFE4` · Tinta `#181612` · OURO `#B0852E` · Mudo `#847C6C`.
- Manchete: **Lora Bold** (serifa). Rotulos/assinatura: **IBM Plex Mono**. Monograma **RC**: Gloock.
- **Apenas 1 palavra em ouro** por peca (marque com `[[palavra]]`). Vermelho so em denuncia pesada (`accent="red"`).
- Rodape fixo: RC + RAMSES CASTOLDI + @eusouramses + indice (ex.: `ESTRATEGIA / Nº 014`).

## FORMULA DO TEXTO (a que ja viraliza)
`TESE CONTRACORRENTE + NEGACOES EM CADEIA + DEFINICAO + [[palavra-ouro]] + sublinha seca`
- Manchete: 3–6 linhas curtas. Ex.: "Empresa nao e [[familia]]. E contrato de resultado."
- Sublinha (itálico): o antigo "Simples." -> "Quem confunde isso, perde os dois."
- REGRA DE OURO: atacar **culturas, narrativas, sistemas** — nunca pessoas ou grupos.

## PROCESSO PASSO A PASSO
1. **Tema:** se o usuario nao deu, escolha um validado (lucro, funcionario/socio, imposto, CLT, lideranca, margem de posto).
2. **Construir a manchete** com a formula. Definir kicker (a "secao": ex. "O QUE NINGUEM TE CONTA", "DENUNCIA") e o indice.
3. **PERGUNTAR a foto:** "Voce vai me mandar uma foto sua/do posto, ou quer que eu gere um prompt de imagem realista?"
   - Se FOTO: peca o arquivo e use `"photo":"/caminho/da/foto.jpg"`.
   - Se PROMPT: entregue o prompt (modelo abaixo) e renderize com placeholder ate ele trazer a imagem.
4. **Renderizar** (snippet abaixo).
5. **Escrever legenda** (7 blocos, ~1100 chars, autoridade com ANO: Mises 1949 / Hayek 1944 / Bastiat 1850 / Friedman 1962 / Schumpeter 1942).
6. **Montar funil de 4 stories.**
7. **Entregar tudo via present_files.**

## RENDER (rodar a partir da pasta desta skill)
```python
import sys, os
SKILL_DIR = os.path.dirname(os.path.abspath("SKILL.md"))  # ou caminho real desta skill
sys.path.insert(0, SKILL_DIR)
from divisao_engine import render_format
OUT = "/mnt/user-data/outputs"  # pasta de saida da sessao
os.makedirs(OUT, exist_ok=True)

render_format("post", {
    "kicker": "O que ninguem te conta",
    "index":  "ESTRATEGIA / Nº 014",
    "photo_tag": "RAMSES CASTOLDI",
    # "photo": "/mnt/user-data/uploads/foto.jpg",   # descomente se houver foto real
    "headline": ["Empresa nao e", "[[familia]].", "E contrato", "de resultado."],
    "subline":  "Quem confunde isso, perde os dois.",
    # "accent": "red",   # so para denuncia pesada
}, os.path.join(OUT, "post_divisao.png"))
```

## MODELO DE PROMPT DE IMAGEM REALISTA (quando o usuario nao tem foto)
> Retrato cinematografico realista, fotografia editorial, homem empresario brasileiro ~45 anos, [postura/acao], iluminacao lateral suave de estudio, fundo escuro grafite desfocado, paleta quente sobria, profundidade de campo, lente 85mm, alta nitidez, sem texto, sem logo, enquadramento deixando respiro no topo. Variacoes: (a) no escritorio; (b) no posto de combustivel ao entardecer; (c) de terno escuro, bracos cruzados.

## QUALIDADE
Nada encostado na borda, nada sobreposto, 1 palavra em ouro, rodape sempre igual. Render 2x.
