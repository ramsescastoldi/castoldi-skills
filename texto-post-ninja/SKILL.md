---
name: texto-post-ninja
description: 'Gera o texto post no MODELO NINJA (estilo @ninjasda153 adaptado para o @eusouramses, Ramses Castoldi). Use SEMPRE que o usuário disser texto post, post ninja, modelo ninja, faz um ninja, post de notícia, ou pedir um post no formato de manchete sobre uma notícia/foto crua. Layout 1080x1350: foto real da notícia na metade superior, fundo preto na metade inferior, manchete em texto branco bold MAIÚSCULO centralizado, @eusouramses e OPERAÇÃO NOME no topo do bloco preto, frase dourada em itálico no rodapé. SEMPRE pedir a foto ao usuário ANTES de renderizar. Entrega o PNG, legenda de ~1000 caracteres e funil de 4 stories.'
---

# Skill: texto-post-ninja

Post de impacto no estilo "Mídia Ninja" adaptado para o @eusouramses
(Ramses Castoldi — mentoria empresarial 1:1, filosofia liberal).

## QUANDO ATIVAR

- "texto post" / "post ninja" / "modelo ninja" / "faz um ninja"
- "post de notícia" / pedido de post em formato manchete sobre uma foto/notícia

## PASSO OBRIGATÓRIO ANTES DE RENDERIZAR

**SEMPRE pedir ao usuário a FOTO da notícia** (a imagem crua que vai na metade
superior). Sem foto, não renderizar. Confirmar também:
- A **manchete** (texto que vira caixa alta no centro do bloco preto).
- O **nome da operação** (ex.: OPERAÇÃO VERDADE).
- A **frase dourada** do rodapé (se não vier, usar a padrão abaixo).

## LAYOUT (FIXO) — 1080x1350, 2x retina

- **Metade superior (~52%):** foto real da notícia, preenchendo a área (cover).
- **Metade inferior:** fundo preto.
  - Topo do bloco preto: "@eusouramses" (dourado) + "OPERAÇÃO [NOME]" (branco).
  - Centro: manchete em **branco bold MAIÚSCULO**, centralizada, fonte
    auto-ajustável conforme o tamanho do texto.
  - Rodapé: **frase dourada em itálico** (serifada).

Frase dourada padrão:
> "Quando a regra é cara demais, o mercado encontra o atalho."

## COMO GERAR

```bash
cd /tmp && cp -r <skill_dir> ./texto-post-ninja && cd texto-post-ninja
python scripts/gerar_ninja.py \
  --foto /mnt/user-data/uploads/<foto_enviada> \
  --manchete "MANCHETE DA NOTICIA" \
  --operacao "VERDADE" \
  --frase "Quando a regra é cara demais, o mercado encontra o atalho." \
  --saida /mnt/user-data/outputs/post_ninja.png
```

Depois apresentar o PNG com present_files.

## ENTREGÁVEIS (os 3)

1. **PNG renderizado** (1080x1350) em /mnt/user-data/outputs.
2. **Legenda ~1000 caracteres**, primeira linha "@eusouramses", em code block
   markdown (para copy-paste limpo). Estrutura: headline curta → tese
   contracorrente + dado → Bastiat/Hayek quando couber → CTA "Comenta MENTORIA"
   + 🔗 @eusouramses.
3. **Funil de 4 stories** (1h, 4h, 8h, 20h após postar).

## REGRAS

- SEMPRE corrigir português antes de renderizar.
- Atacar CULTURAS, NARRATIVAS e SISTEMAS — nunca pessoas ou grupos sociais.
- A manchete deve refletir a notícia real; web_search antes se precisar confirmar dados.

## ASSETS

- `assets/Arimo-Bold.ttf` — manchete/cabeçalho (Helvetica-like).
- `assets/Serif-BoldItalic.ttf` — frase dourada itálica do rodapé.
