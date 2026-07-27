#!/usr/bin/env python3
"""
Gera o "texto post NINJA" (modelo @ninjasda153 adaptado para @eusouramses).

Layout 1080x1350:
  - Metade SUPERIOR: foto real da notícia (enviada pelo usuário), preenchendo a área.
  - Metade INFERIOR: fundo preto.
  - Sobre o topo do bloco preto: "@eusouramses" + "OPERAÇÃO [NOME]".
  - Centro do bloco preto: manchete em texto BRANCO BOLD MAIÚSCULO centralizado.
  - Rodapé: frase DOURADA em itálico.

Uso:
  python gerar_ninja.py --foto /caminho/foto.jpg \
      --manchete "MANCHETE DA NOTICIA EM CAIXA ALTA" \
      --operacao "NOME" \
      [--frase "Quando a regra é cara demais, o mercado encontra o atalho."] \
      --saida /mnt/user-data/outputs/post_ninja.png
"""
import os
import argparse
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(HERE), "assets")

S = 2
W, H = 1080 * S, 1350 * S
DOURADO = (212, 175, 55)
FRASE_PADRAO = "Quando a regra é cara demais, o mercado encontra o atalho."


def fit_cover(img, tw, th):
    """Redimensiona+corta a imagem para cobrir (tw, th) sem distorcer."""
    return ImageOps.fit(img.convert("RGB"), (tw, th), Image.LANCZOS)


def wrap_to_width(draw, text, font, max_w):
    """Quebra texto em linhas que cabem em max_w."""
    words = text.split()
    linhas, atual = [], ""
    for w in words:
        teste = (atual + " " + w).strip()
        if draw.textlength(teste, font=font) <= max_w:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = w
    if atual:
        linhas.append(atual)
    return linhas


def gerar(foto_path, manchete, operacao, frase, saida):
    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)

    # ---- Metade superior: foto ----
    foto_h = int(H * 0.52)
    foto = Image.open(foto_path)
    foto = fit_cover(foto, W, foto_h)
    img.paste(foto, (0, 0))

    # ---- Fontes ----
    f_arroba = ImageFont.truetype(os.path.join(ASSETS, "Arimo-Bold.ttf"), 30 * S)
    f_op = ImageFont.truetype(os.path.join(ASSETS, "Arimo-Bold.ttf"), 34 * S)
    f_frase = ImageFont.truetype(os.path.join(ASSETS, "Serif-BoldItalic.ttf"), 36 * S)

    # ---- Bloco preto inferior ----
    by = foto_h
    pad = 70 * S

    # @eusouramses + OPERAÇÃO NOME (logo abaixo da foto)
    top = by + 45 * S
    d.text((pad, top), "@eusouramses", font=f_arroba, fill=DOURADO)
    op_txt = f"OPERAÇÃO {operacao.upper()}"
    d.text((pad, top + 42 * S), op_txt, font=f_op, fill=(255, 255, 255))

    # Manchete branca bold maiúscula centralizada (fonte auto-ajustável)
    area_w = W - pad * 2
    manchete = manchete.upper()
    size = 72 * S
    while size > 30 * S:
        f_head = ImageFont.truetype(os.path.join(ASSETS, "Arimo-Bold.ttf"), size)
        linhas = wrap_to_width(d, manchete, f_head, area_w)
        lh = int(size * 1.12)
        bloco_h = len(linhas) * lh
        # área disponível entre o cabeçalho e o rodapé
        disp_top = top + 110 * S
        disp_bottom = H - 130 * S
        if bloco_h <= (disp_bottom - disp_top):
            break
        size -= 4 * S

    cy = disp_top + (disp_bottom - disp_top - bloco_h) // 2
    for ln in linhas:
        w = d.textlength(ln, font=f_head)
        d.text(((W - w) // 2, cy), ln, font=f_head, fill=(255, 255, 255))
        cy += lh

    # Frase dourada itálico no rodapé
    fw = d.textlength(frase, font=f_frase)
    if fw > area_w:
        fl = wrap_to_width(d, frase, f_frase, area_w)
    else:
        fl = [frase]
    fy = H - 60 * S - len(fl) * int(40 * S)
    for ln in fl:
        w = d.textlength(ln, font=f_frase)
        d.text(((W - w) // 2, fy), ln, font=f_frase, fill=DOURADO)
        fy += int(40 * S)

    img.save(saida)
    return saida


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--foto", required=True, help="Caminho da foto da notícia.")
    p.add_argument("--manchete", required=True, help="Manchete (vai para caixa alta).")
    p.add_argument("--operacao", required=True, help="Nome da operação (ex.: VERDADE).")
    p.add_argument("--frase", default=FRASE_PADRAO, help="Frase dourada do rodapé.")
    p.add_argument("--saida", default="/mnt/user-data/outputs/post_ninja.png")
    a = p.parse_args()
    os.makedirs(os.path.dirname(a.saida), exist_ok=True)
    gerar(a.foto, a.manchete, a.operacao, a.frase, a.saida)
    print("gerado:", a.saida)


if __name__ == "__main__":
    main()
