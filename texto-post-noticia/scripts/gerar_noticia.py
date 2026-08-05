#!/usr/bin/env python3
"""
Gera o post de notícia no MODELO CARD DE MATÉRIA (@eusouramses).

Layout 1080x1350:
  - Foto da notícia sangrando na tela inteira (cover).
  - Card branco arredondado sobreposto na parte de baixo, com o conteúdo da
    matéria REAL: editoria, manchete, linha-fina, assinatura, data e veículo.

Estilos disponíveis (--estilo): metropoles (padrão), g1, veja, expresso.

REGRA DE INTEGRIDADE: manchete, linha-fina, autor, data e veículo devem vir da
matéria real. Este script não inventa nada — ele só desenha o que recebe.

Uso:
  python gerar_noticia.py --foto foto.jpg \
      --manchete "Manchete exatamente como saiu no veículo" \
      --linha-fina "Linha-fina da matéria." \
      --kicker "Economia" --autor "Redação" --data "04/08/2026 10h11" \
      --veiculo "Metrópoles" --saida /caminho/saida.png
"""
import os
import argparse
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(HERE), "assets")

S = 2                      # supersampling (2x retina)
W, H = 1080 * S, 1350 * S

PRETO_TEXTO = (26, 26, 26)
CINZA_TEXTO = (92, 92, 92)
CINZA_DATA = (110, 110, 110)
BRANCO = (255, 255, 255)

# Cada estilo replica a diagramação de um veículo das referências.
ESTILOS = {
    "metropoles": {
        "acento": (176, 34, 36),
        "fonte_manchete": ("Bitter.ttf", "Bold"),
        "fonte_linha": ("Bitter.ttf", "Regular"),
        "fonte_kicker": ("Inter.ttf", "Bold"),
        "fonte_autor": ("Inter.ttf", "Bold"),
        "fonte_data": ("Inter.ttf", "Regular"),
        "alinhamento": "left",
        "kicker_caps": False,
        "kicker_track": 0,
        "barra": False,
        "manchete_max": 46,
        "manchete_min": 32,
        "leading": 1.18,
    },
    "g1": {
        "acento": (192, 26, 26),
        "fonte_manchete": ("Inter.ttf", "Bold"),
        "fonte_linha": ("Inter.ttf", "Regular"),
        "fonte_kicker": ("Inter.ttf", "Bold"),
        "fonte_autor": ("Inter.ttf", "SemiBold"),
        "fonte_data": ("Inter.ttf", "Regular"),
        "alinhamento": "left",
        "kicker_caps": False,
        "kicker_track": 0,
        "barra": False,
        "manchete_max": 52,
        "manchete_min": 34,
        "leading": 1.20,
    },
    "veja": {
        "acento": (166, 26, 30),
        "fonte_manchete": ("Inter.ttf", "Bold"),
        "fonte_linha": ("Lora.ttf", "Regular"),
        "fonte_kicker": ("Lora.ttf", "Bold"),
        "fonte_autor": ("Inter.ttf", "SemiBold"),
        "fonte_data": ("Inter.ttf", "Regular"),
        "alinhamento": "center",
        "kicker_caps": True,
        "kicker_track": 4,
        "barra": False,
        "manchete_max": 48,
        "manchete_min": 32,
        "leading": 1.18,
    },
    "expresso": {
        "acento": (108, 108, 108),
        "cor_barra": (122, 190, 205),
        "fonte_manchete": ("Bitter.ttf", "Bold"),
        "fonte_linha": ("Bitter.ttf", "Regular"),
        "fonte_kicker": ("Inter.ttf", "Bold"),
        "fonte_autor": ("Bitter.ttf", "Bold"),
        "fonte_data": ("Inter.ttf", "Regular"),
        "alinhamento": "left",
        "kicker_caps": True,
        "kicker_track": 2,
        "barra": True,
        "manchete_max": 48,
        "manchete_min": 32,
        "leading": 1.16,
    },
}


def fonte(arquivo, instancia, tamanho):
    """Carrega a fonte no peso pedido (fontes variáveis do Google Fonts)."""
    f = ImageFont.truetype(os.path.join(ASSETS, arquivo), tamanho)
    try:
        f.set_variation_by_name(instancia)
    except Exception:
        pass
    return f


def fit_cover(img, tw, th):
    """Redimensiona+corta a imagem para cobrir (tw, th) sem distorcer."""
    return ImageOps.fit(img.convert("RGB"), (tw, th), Image.LANCZOS)


def quebrar(draw, texto, font, max_w):
    """Quebra o texto em linhas que cabem em max_w."""
    linhas, atual = [], ""
    for p in texto.split():
        teste = (atual + " " + p).strip()
        if draw.textlength(teste, font=font) <= max_w or not atual:
            atual = teste
        else:
            linhas.append(atual)
            atual = p
    if atual:
        linhas.append(atual)
    return linhas


def largura_track(draw, texto, font, track):
    """Largura de um texto considerando o espacejamento entre letras."""
    if not track:
        return draw.textlength(texto, font=font)
    return sum(draw.textlength(c, font=font) for c in texto) + track * (len(texto) - 1)


def desenhar_track(draw, xy, texto, font, fill, track):
    """Desenha texto com espacejamento entre letras (tracking)."""
    if not track:
        draw.text(xy, texto, font=font, fill=fill)
        return
    x, y = xy
    for c in texto:
        draw.text((x, y), c, font=font, fill=fill)
        x += draw.textlength(c, font=font) + track


def ajustar_manchete(draw, texto, cfg, max_w, max_linhas):
    """Acha o maior corpo de manchete que cabe em max_linhas."""
    arq, inst = cfg["fonte_manchete"]
    tamanho = cfg["manchete_max"] * S
    minimo = cfg["manchete_min"] * S
    while tamanho > minimo:
        f = fonte(arq, inst, tamanho)
        linhas = quebrar(draw, texto, f, max_w)
        if len(linhas) <= max_linhas:
            return f, linhas
        tamanho -= 2 * S
    f = fonte(arq, inst, minimo)
    return f, quebrar(draw, texto, f, max_w)


def gerar(foto_path, manchete, linha_fina, kicker, autor, data, veiculo,
          estilo, assinatura, saida, prefixo="", sufixo="",
          margem_lat=58, margem_base=66, raio=26):
    cfg = ESTILOS[estilo]
    acento = cfg["acento"]
    centro = cfg["alinhamento"] == "center"

    # ---- Foto sangrando na tela inteira ----
    base = fit_cover(Image.open(foto_path), W, H)
    d = ImageDraw.Draw(base)

    # ---- Geometria do card ----
    card_x0 = margem_lat * S
    card_x1 = W - margem_lat * S
    pad = 40 * S
    barra_w = 7 * S
    barra_gap = 20 * S
    recuo = (barra_w + barra_gap) if cfg["barra"] else 0
    texto_x = card_x0 + pad + recuo
    texto_w = (card_x1 - pad) - texto_x

    # ---- Fontes ----
    f_kicker = fonte(*cfg["fonte_kicker"], 25 * S)
    f_linha = fonte(*cfg["fonte_linha"], 27 * S)
    f_autor = fonte(*cfg["fonte_autor"], 25 * S)
    f_data = fonte(*cfg["fonte_data"], 24 * S)
    f_veic = fonte("Inter.ttf", "Black", 30 * S)

    max_linhas = 3 if linha_fina else 4
    f_head, linhas_head = ajustar_manchete(d, manchete, cfg, texto_w, max_linhas)
    lh_head = int(f_head.size * cfg["leading"])
    linhas_linha = quebrar(d, linha_fina, f_linha, texto_w) if linha_fina else []
    lh_linha = int(f_linha.size * 1.34)

    # ---- Altura do card, a partir do conteúdo ----
    alt = pad
    if kicker:
        alt += int(f_kicker.size * 1.05) + 16 * S
    alt += len(linhas_head) * lh_head
    if linhas_linha:
        alt += 26 * S + len(linhas_linha) * lh_linha
    if autor or data or veiculo:
        alt += 26 * S
        if autor:
            alt += int(f_autor.size * 1.30)
        if data:
            alt += int(f_data.size * 1.30)
    if assinatura:
        alt += 22 * S
    alt += pad

    card_y1 = H - margem_base * S
    card_y0 = card_y1 - alt

    # ---- Sombra sutil: garante o recorte do card mesmo sobre foto clara ----
    sombra = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle(
        [card_x0, card_y0 + 7 * S, card_x1, card_y1 + 7 * S],
        radius=raio * S, fill=(0, 0, 0, 78))
    sombra = sombra.filter(ImageFilter.GaussianBlur(13 * S))
    base = Image.alpha_composite(base.convert("RGBA"), sombra).convert("RGB")
    d = ImageDraw.Draw(base)

    # ---- Card branco ----
    d.rounded_rectangle([card_x0, card_y0, card_x1, card_y1],
                        radius=raio * S, fill=BRANCO)

    y = card_y0 + pad

    def escrever(linhas, font, cor, altura_linha):
        nonlocal y
        for ln in linhas:
            if centro:
                x = card_x0 + (card_x1 - card_x0 - d.textlength(ln, font=font)) / 2
            else:
                x = texto_x
            d.text((x, y), ln, font=font, fill=cor)
            y += altura_linha

    # Editoria (kicker)
    if kicker:
        k = kicker.upper() if cfg["kicker_caps"] else kicker
        tr = cfg["kicker_track"] * S
        if centro:
            kx = card_x0 + (card_x1 - card_x0 - largura_track(d, k, f_kicker, tr)) / 2
        else:
            kx = texto_x
        desenhar_track(d, (kx, y), k, f_kicker, acento, tr)
        y += int(f_kicker.size * 1.05) + 16 * S

    # Barra vertical de acento (estilo Expresso), ao lado da manchete
    if cfg["barra"]:
        bloco = len(linhas_head) * lh_head
        d.rounded_rectangle(
            [card_x0 + pad, y, card_x0 + pad + barra_w, y + bloco],
            radius=barra_w // 2, fill=cfg.get("cor_barra", acento))

    # Manchete
    escrever(linhas_head, f_head, PRETO_TEXTO, lh_head)

    # Linha-fina
    if linhas_linha:
        y += 26 * S
        escrever(linhas_linha, f_linha, CINZA_TEXTO, lh_linha)

    # Assinatura, data e veículo
    if autor or data or veiculo:
        y += 26 * S
        topo_rodape = y
        if autor:
            # Só o nome vai no acento; "Por" e o veículo ficam em cinza.
            partes = [(prefixo, CINZA_DATA), (autor, acento), (sufixo, CINZA_DATA)]
            partes = [(t, c) for t, c in partes if t]
            if len(partes) > 1:
                larg = sum(d.textlength(t, font=f_autor) for t, _ in partes)
                x = (card_x0 + (card_x1 - card_x0 - larg) / 2) if centro else texto_x
                for t, cor in partes:
                    d.text((x, y), t, font=f_autor, fill=cor)
                    x += d.textlength(t, font=f_autor)
                y += int(f_autor.size * 1.30)
            else:
                escrever([autor], f_autor, acento, int(f_autor.size * 1.30))
        if data:
            escrever([data], f_data, CINZA_DATA, int(f_data.size * 1.30))
        if veiculo and not centro:
            vw = d.textlength(veiculo, font=f_veic)
            vy = topo_rodape + ((y - topo_rodape) - f_veic.size * 1.2) / 2
            d.text((card_x1 - pad - vw, vy), veiculo, font=f_veic, fill=PRETO_TEXTO)
        elif veiculo:
            escrever([veiculo], f_veic, PRETO_TEXTO, int(f_veic.size * 1.2))

    # Assinatura discreta do perfil (opcional)
    if assinatura:
        f_ass = fonte("Inter.ttf", "SemiBold", 21 * S)
        txt = "@eusouramses"
        tw = d.textlength(txt, font=f_ass)
        d.text((card_x1 - pad - tw, card_y1 - pad + 4 * S), txt,
               font=f_ass, fill=(150, 150, 150))

    base = base.resize((W // S, H // S), Image.LANCZOS)
    base.save(saida, quality=95)
    return saida


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--foto", required=True, help="Foto da matéria (sangra na tela inteira).")
    p.add_argument("--manchete", required=True, help="Manchete REAL, copiada do veículo.")
    p.add_argument("--linha-fina", default="", help="Linha-fina real da matéria.")
    p.add_argument("--kicker", default="", help="Editoria (ex.: Economia, Brasil, Mundo).")
    p.add_argument("--autor", default="", help="Assinatura real. Sem autor conhecido, use 'Redação'.")
    p.add_argument("--autor-prefixo", default="", help="Texto cinza antes do nome (ex.: 'Por ').")
    p.add_argument("--autor-sufixo", default="", help="Texto cinza depois do nome (ex.: ', g1 — Brasília').")
    p.add_argument("--data", default="", help="Data/hora como saiu no veículo.")
    p.add_argument("--veiculo", default="", help="Nome do veículo (canto direito do rodapé).")
    p.add_argument("--estilo", default="metropoles", choices=sorted(ESTILOS))
    p.add_argument("--assinatura", action="store_true",
                   help="Acrescenta '@eusouramses' discreto no rodapé do card.")
    p.add_argument("--saida", required=True)
    a = p.parse_args()

    destino = os.path.dirname(os.path.abspath(a.saida))
    os.makedirs(destino, exist_ok=True)
    gerar(a.foto, a.manchete, a.linha_fina, a.kicker, a.autor, a.data,
          a.veiculo, a.estilo, a.assinatura, a.saida,
          prefixo=a.autor_prefixo, sufixo=a.autor_sufixo)
    print("gerado:", a.saida)


if __name__ == "__main__":
    main()
