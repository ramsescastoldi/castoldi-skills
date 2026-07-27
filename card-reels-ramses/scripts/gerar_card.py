#!/usr/bin/env python3
"""
Gera o "card para reels" (modelo tweet falso estilo @eusoujessicasouza)
para o Instagram @eusouramses (Ramses Castoldi).

Uso:
    python gerar_card.py "Frase linha 1.|Frase linha 2." [--cores branco,bege,preto] [--saida DIR]

A frase pode vir com "|" separando linhas. Se vier sem, o script quebra
automaticamente em 2 linhas equilibradas.

Saída: 1080x1920 vertical, fundo INTEIRO chapado (sem degradê).
Header colado no topo (avatar + nome + @ + selo azul) e headline logo abaixo.
Resto da tela fica livre para sobrepor o vídeo no CapCut.
"""
import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(HERE), "assets")

S = 2  # retina 2x
W, H = 1080 * S, 1920 * S

# Paleta das variações: nome -> (fundo RGB, cor do texto RGB)
VARIACOES = {
    "branco": ((255, 255, 255), (15, 15, 15)),
    "bege":   ((247, 243, 233), (15, 15, 15)),
    "preto":  ((0, 0, 0),       (255, 255, 255)),
}


def carregar_fontes():
    fp = os.path.join(ASSETS, "Roboto-Medium.ttf")
    return (
        ImageFont.truetype(fp, 50 * S),  # nome
        ImageFont.truetype(fp, 34 * S),  # @handle
        ImageFont.truetype(fp, 60 * S),  # headline
    )


def quebrar_em_duas(frase, fonte, larg_max):
    """Quebra a frase em no máximo 2 linhas equilibradas que caibam na largura."""
    if "|" in frase:
        return [p.strip() for p in frase.split("|") if p.strip()][:2]
    palavras = frase.split()
    if len(palavras) <= 1:
        return [frase]
    melhor = None
    dummy = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(dummy)
    for i in range(1, len(palavras)):
        l1 = " ".join(palavras[:i])
        l2 = " ".join(palavras[i:])
        w1 = d.textlength(l1, font=fonte)
        w2 = d.textlength(l2, font=fonte)
        if w1 <= larg_max and w2 <= larg_max:
            dif = abs(w1 - w2)
            if melhor is None or dif < melhor[0]:
                melhor = (dif, [l1, l2])
    return melhor[1] if melhor else [frase]


def gerar(frase, cor_nome, saida):
    bg, head_color = VARIACOES[cor_nome]
    f_name, f_user, f_head = carregar_fontes()

    img = Image.new("RGBA", (W, H), bg + (255,))
    d = ImageDraw.Draw(img)

    # Avatar circular
    av = Image.open(os.path.join(ASSETS, "avatar.png")).convert("RGBA")
    asz = 145 * S
    av = av.resize((asz, asz), Image.LANCZOS)
    mask = Image.new("L", (asz, asz), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, asz, asz), fill=255)
    ax, ay = 70 * S, 95 * S
    img.paste(av, (ax, ay), mask)
    ring = (255, 255, 255, 255) if cor_nome == "preto" else (225, 225, 225, 255)
    d.ellipse((ax - 2, ay - 2, ax + asz + 2, ay + asz + 2), outline=ring, width=2 * S)

    # Nome + @ + selo
    tx = ax + asz + 40 * S
    sub_color = (190, 190, 190, 255) if cor_nome == "preto" else (110, 110, 110, 255)
    d.text((tx, ay + 30 * S), "Ramses Castoldi", font=f_name, fill=head_color + (255,))
    handle = "@eusouramses"
    d.text((tx, ay + 96 * S), handle, font=f_user, fill=sub_color)
    hw = d.textlength(handle, font=f_user)
    bx = tx + hw + 16 * S
    by = ay + 96 * S + 5 * S
    br = 19 * S
    d.ellipse((bx, by, bx + br * 2, by + br * 2), fill=(29, 155, 240, 255))
    cx, cy = bx + br, by + br
    d.line([(cx - 7 * S, cy), (cx - 2 * S, cy + 6 * S), (cx + 8 * S, cy - 7 * S)],
           fill=(255, 255, 255, 255), width=4 * S)

    # Headline (colada logo abaixo do header)
    linhas = quebrar_em_duas(frase, f_head, W - 150 * S)
    hy = ay + asz + 35 * S
    for ln in linhas:
        d.text((75 * S, hy), ln, font=f_head, fill=head_color + (255,))
        hy += 74 * S

    img.save(saida)
    return saida


def main():
    p = argparse.ArgumentParser()
    p.add_argument("frase", help='Frase do card. Use "|" para separar as 2 linhas.')
    p.add_argument("--cores", default="branco,bege,preto",
                   help="Variações a gerar, separadas por vírgula.")
    p.add_argument("--saida", default=".", help="Diretório de saída.")
    a = p.parse_args()

    os.makedirs(a.saida, exist_ok=True)
    gerados = []
    for c in [x.strip().lower() for x in a.cores.split(",") if x.strip()]:
        if c not in VARIACOES:
            print(f"[ignorado] variação desconhecida: {c}")
            continue
        out = os.path.join(a.saida, f"card_reels_{c.upper()}.png")
        gerar(a.frase, c, out)
        gerados.append(out)
        print("gerado:", out)
    return gerados


if __name__ == "__main__":
    main()
