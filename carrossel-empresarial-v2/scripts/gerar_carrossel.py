#!/usr/bin/env python3
"""
Gera o CARROSSEL EMPRESARIAL V2 (@eusouramses) — foto no topo + texto embaixo.

Layout 1080x1350 @2x, fonte Arimo Bold (assets/Arimo-Bold.ttf):
  CAPA      foto ~600px + kicker dourado + headline grande + rodapé.
  DECISÃO N foto ~560px + rótulo dourado "DECISÃO N" + texto + rodapé.
  CTA       fundo preto, caixa dourada "CLUBE EMPRESA BLINDADA" + link.

Marcação nos textos do config: <br> quebra linha, <span class="red">..</span>
vermelho urgência, <span class="gold">..</span> dourado autoridade, <b> é
ignorado (tudo já é bold).

Uso:
  python scripts/gerar_carrossel.py --config scripts/config_exemplo.json \
      --saida-dir /mnt/user-data/outputs
"""
import os
import re
import json
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(HERE), "assets")
FONTE = os.path.join(ASSETS, "Arimo-Bold.ttf")

S = 2
W, H = 1080 * S, 1350 * S
OFFWHITE = "#f8f5ed"
TINTA = "#1a1a1a"
VERMELHO = "#c0392b"
DOURADO = "#b8893a"
PRETO_CTA = "#0f0f0f"
CORES = {"red": VERMELHO, "gold": DOURADO, None: None}
CORTE_MARCA_DAGUA = 0.09  # corta ~9% da base das fotos


def fonte(px):
    return ImageFont.truetype(FONTE, px)


def parse_markup(texto):
    """Devolve linhas; cada linha é lista de (palavra, cor|None)."""
    linhas = []
    for parte in re.split(r"<br\s*/?>", texto):
        parte = re.sub(r"</?b>", "", parte)
        seg, linha = re.split(r'(<span class="(?:red|gold)">.*?</span>)', parte), []
        for s in seg:
            m = re.match(r'<span class="(red|gold)">(.*?)</span>', s)
            cor = CORES[m.group(1)] if m else None
            for w in (m.group(2) if m else s).split():
                if linha and w[0] in ",.;:!?)…":
                    pw, pc = linha[-1]
                    linha[-1] = (pw + w, pc)  # cola pontuação na palavra anterior
                else:
                    linha.append((w, cor))
        linhas.append(linha)
    return linhas


def quebrar(d, linhas, f, max_w):
    """Reflui as linhas do markup para caberem em max_w."""
    out = []
    for linha in linhas:
        atual = []
        for w, cor in linha:
            teste = " ".join(x for x, _ in atual + [(w, cor)])
            if d.textlength(teste, font=f) <= max_w or not atual:
                atual.append((w, cor))
            else:
                out.append(atual)
                atual = [(w, cor)]
        out.append(atual)
    return out


def texto_rico(d, linhas, f, x, y, lh, cor_base, centralizar_em=None):
    """Desenha linhas de (palavra, cor). centralizar_em=W centraliza cada linha."""
    esp = d.textlength(" ", font=f)
    for linha in linhas:
        lw = sum(d.textlength(w, font=f) for w, _ in linha) + esp * (len(linha) - 1)
        cx = (centralizar_em - lw) // 2 if centralizar_em else x
        for w, cor in linha:
            d.text((cx, y), w, font=f, fill=cor or cor_base)
            cx += d.textlength(w, font=f) + esp
        y += lh
    return y


def ajustar_fonte(d, texto, max_w, max_h, tam_ini, tam_min, entrelinha=1.15):
    """Reduz a fonte até o bloco caber em max_w x max_h."""
    tam = tam_ini
    while tam > tam_min:
        f = fonte(tam)
        linhas = quebrar(d, parse_markup(texto), f, max_w)
        lh = int(tam * entrelinha)
        if len(linhas) * lh <= max_h:
            return f, linhas, lh
        tam -= 2 * S
    f = fonte(tam_min)
    linhas = quebrar(d, parse_markup(texto), f, max_w)
    return f, linhas, int(tam_min * entrelinha)


def foto_topo(img, caminho, altura, pos="center"):
    foto = Image.open(caminho).convert("RGB")
    fw, fh = foto.size
    foto = foto.crop((0, 0, fw, int(fh * (1 - CORTE_MARCA_DAGUA))))
    anchor = {"top": (0.5, 0.0), "center": (0.5, 0.5), "bottom": (0.5, 1.0)}[pos]
    img.paste(ImageOps.fit(foto, (W, altura), Image.LANCZOS, centering=anchor), (0, 0))


def rodape(d, esquerda, direita, cor_direita=TINTA):
    f = fonte(26 * S)
    y = H - 74 * S
    d.text((70 * S, y), esquerda, font=f, fill=DOURADO)
    d.text((W - 70 * S - d.textlength(direita, font=f), y), direita, font=f,
           fill=cor_direita)


def slide_capa(cfg):
    img = Image.new("RGB", (W, H), OFFWHITE)
    foto_topo(img, cfg["foto"], 600 * S, cfg.get("pos", "center"))
    d = ImageDraw.Draw(img)
    pad = 70 * S
    y = 600 * S + 64 * S
    d.text((pad, y), cfg.get("kicker", "SÁBADO · ESTRATÉGIA").upper(),
           font=fonte(28 * S), fill=DOURADO)
    y += 76 * S
    f, linhas, lh = ajustar_fonte(d, cfg["titulo"], W - pad * 2,
                                  H - y - 130 * S, 92 * S, 48 * S, 1.08)
    texto_rico(d, linhas, f, pad, y, lh, TINTA)
    rodape(d, "@eusouramses", "arraste →")
    return img


def slide_decisao(cfg):
    img = Image.new("RGB", (W, H), OFFWHITE)
    foto_topo(img, cfg["foto"], 560 * S, cfg.get("pos", "center"))
    d = ImageDraw.Draw(img)
    pad = 70 * S
    y = 560 * S + 60 * S
    d.text((pad, y), f"DECISÃO {cfg['num']}", font=fonte(30 * S), fill=DOURADO)
    y += 84 * S
    f, linhas, lh = ajustar_fonte(d, cfg["texto"], W - pad * 2,
                                  H - y - 130 * S, 62 * S, 36 * S)
    texto_rico(d, linhas, f, pad, y, lh, TINTA)
    rodape(d, "@eusouramses", "ESTRATÉGIA")
    return img


def slide_cta(cfg):
    img = Image.new("RGB", (W, H), PRETO_CTA)
    d = ImageDraw.Draw(img)
    pad = 90 * S
    d.text((pad, 150 * S), cfg.get("topo", "O PRÓXIMO PASSO").upper(),
           font=fonte(28 * S), fill=DOURADO)
    f, linhas, lh = ajustar_fonte(d, cfg["linha"], W - pad * 2, 520 * S,
                                  64 * S, 40 * S)
    y = texto_rico(d, linhas, f, pad, 240 * S, lh, "#f2ede1")
    # caixa dourada
    clube = cfg.get("clube", "CLUBE EMPRESA BLINDADA").upper()
    fc = fonte(44 * S)
    cw = d.textlength(clube, font=fc)
    bx0, by0 = (W - cw) // 2 - 44 * S, max(y + 90 * S, 880 * S)
    bx1, by1 = (W + cw) // 2 + 44 * S, by0 + 118 * S
    d.rectangle([bx0, by0, bx1, by1], outline=DOURADO, width=4 * S)
    d.text(((W - cw) // 2, by0 + 34 * S), clube, font=fc, fill=DOURADO)
    link = cfg.get("link", "blindada.lumenclubpainel.com.br")
    fl = fonte(30 * S)
    d.text(((W - d.textlength(link, font=fl)) // 2, by1 + 46 * S),
           link, font=fl, fill="#f2ede1")
    rodape(d, "@eusouramses", "ESTRATÉGIA", cor_direita="#f2ede1")
    return img


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--config", required=True)
    p.add_argument("--saida-dir", default="/mnt/user-data/outputs")
    a = p.parse_args()
    cfg = json.load(open(a.config, encoding="utf-8"))
    os.makedirs(a.saida_dir, exist_ok=True)

    slides = [slide_capa(cfg["capa"])]
    slides += [slide_decisao(dc) for dc in cfg["decisoes"]]
    slides.append(slide_cta(cfg["cta"]))

    for i, img in enumerate(slides, 1):
        caminho = os.path.join(a.saida_dir, f"carrossel_slide_{i:02d}.png")
        img.resize((1080, 1350), Image.LANCZOS).save(caminho)
        print("gerado:", caminho)


if __name__ == "__main__":
    main()
