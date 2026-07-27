---
name: card-reels-ramses
description: 'Gera o card para reels no formato tweet falso (estilo @eusoujessicasouza) para o Instagram do Ramses Castoldi (@eusouramses). Use SEMPRE que o usuário disser card para reels, card de reels, card pro reels, faz o card, card tweet, card falso, card de capa pro reels, card de cima do reels, ou enviar uma frase pedindo para virar capa/header de um vídeo vertical. Entrega 1080x1920 vertical com header (avatar real, Ramses Castoldi, @eusouramses, selo azul) e a headline colada no topo, resto da tela livre para sobrepor o vídeo no CapCut. Por padrão entrega 3 variações de fundo BRANCO, BEGE e PRETO. A frase muda conforme o vídeo.'
---

# Skill: card-reels-ramses

Card de capa/header para Reels do @eusouramses (Ramses Castoldi), no formato
"tweet falso" popularizado por perfis como @eusoujessicasouza. O usuário sobrepõe
o vídeo na parte livre da tela depois, no CapCut/edits.

## QUANDO ATIVAR

Ativa quando o usuário pedir:
- "card para reels" / "card de reels" / "card pro reels" / "faz o card"
- "card tweet" / "card falso" / "card de capa" / "card de cima do reels"
- Enviar uma frase curta pedindo para virar header/capa de um vídeo vertical

## ESPECIFICAÇÃO DO CARD (FIXO)

- **Formato:** 1080x1920 vertical (9:16), renderizado em 2x retina.
- **Fundo:** INTEIRO chapado, SEM degradê, SEM faixa.
- **Header** (colado no topo, ~95px do topo):
  - Avatar real circular do Ramses (~145px), com anel fino.
  - Nome "Ramses Castoldi" (Roboto Medium ~50px).
  - Handle "@eusouramses" (cinza) + selo verificado azul ao lado.
- **Headline:** Roboto Medium ~60px, 2 linhas, alinhada à esquerda,
  COLADA logo abaixo do header.
- **Resto da tela:** livre, para o usuário sobrepor o vídeo no edit.

## VARIAÇÕES (entregar as 3 por padrão)

| Variação | Fundo      | Texto/Header |
|----------|------------|--------------|
| BRANCO   | #ffffff    | preto        |
| BEGE     | #f7f3e9    | preto        |
| PRETO    | #000000    | branco       |

## REGRAS

1. **SEMPRE corrigir erros de português** na frase antes de renderizar
   (ex.: "trás" → "traz"). É um card que vai viralizar — erro vira comentário negativo.
2. A frase muda a cada vídeo; sempre usar exatamente a frase que o usuário pediu (corrigida).
3. Entregar os 3 PNGs (branco, bege, preto), salvos em /mnt/user-data/outputs e apresentados com present_files.
4. Após entregar, sugerir uma pergunta de divisão para o rodapé do reel (empurra o algoritmo).

## COMO GERAR

O script faz tudo. A frase pode vir com "|" separando as 2 linhas; sem isso,
o script quebra automaticamente em 2 linhas equilibradas.

```bash
cd /tmp && cp -r <skill_dir> ./card-reels && cd card-reels
python scripts/gerar_card.py "Um funcionário traz problema.|Um líder traz solução." --saida /mnt/user-data/outputs
```

Para gerar só uma variação:
```bash
python scripts/gerar_card.py "Sua frase aqui." --cores preto --saida /mnt/user-data/outputs
```

Depois, apresentar os arquivos gerados com present_files.

## ASSETS

- `assets/avatar.png` — foto oficial do Ramses (circular).
- `assets/Roboto-Medium.ttf` — fonte do card.
