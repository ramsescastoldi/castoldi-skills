#!/usr/bin/env python3
"""
Renderiza o card de matéria a partir do LINK da notícia.

Lê a página, extrai og:image, manchete, linha-fina, autor e data, baixa a foto
e chama o gerar_noticia.py. Opcionalmente envia direto no Telegram do fluxo.

Só roda onde há rede livre (o Mac que opera o fluxo). Nada é inventado: campo
que não vier da página fica vazio, e sem assinatura confirmada usa "Redação".

Uso:
  python3 render_do_link.py --link https://... --estilo metropoles \
      --kicker "Economia" --saida ~/renders/post.png [--telegram]
"""
import argparse
import html
import json
import os
import re
import sys
import tempfile
import urllib.request
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar_noticia import gerar, ESTILOS  # noqa: E402

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

MESES = ["jan", "fev", "mar", "abr", "mai", "jun",
         "jul", "ago", "set", "out", "nov", "dez"]


def baixar(url, binario=False, timeout=30):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Language": "pt-BR,pt;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        dados = r.read()
    return dados if binario else dados.decode("utf-8", "replace")


def meta(pagina, *chaves):
    """Primeiro <meta> que casar com uma das chaves (property ou name)."""
    for chave in chaves:
        padrao = (r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]*content=["\']([^"\']*)'
                  % re.escape(chave))
        m = re.search(padrao, pagina, re.I)
        if not m:
            padrao = (r'<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']%s["\']'
                      % re.escape(chave))
            m = re.search(padrao, pagina, re.I)
        if m and m.group(1).strip():
            return html.unescape(m.group(1).strip())
    return ""


def do_jsonld(pagina):
    """Extrai autor e data do bloco JSON-LD, quando existir."""
    autor, data = "", ""
    for bloco in re.findall(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            pagina, re.I | re.S):
        try:
            dado = json.loads(bloco.strip())
        except Exception:
            continue
        for no in (dado if isinstance(dado, list) else [dado]):
            if not isinstance(no, dict):
                continue
            if "@graph" in no and isinstance(no["@graph"], list):
                for g in no["@graph"]:
                    if isinstance(g, dict) and not autor:
                        autor = nome_autor(g.get("author"))
                    if isinstance(g, dict) and not data:
                        data = g.get("datePublished", "") or ""
            if not autor:
                autor = nome_autor(no.get("author"))
            if not data:
                data = no.get("datePublished", "") or ""
    return autor, data


def nome_autor(a):
    if isinstance(a, dict):
        return str(a.get("name", "")).strip()
    if isinstance(a, list) and a:
        nomes = [nome_autor(x) for x in a]
        return ", ".join(n for n in nomes if n)
    if isinstance(a, str):
        return a.strip()
    return ""


def formatar_data(bruta):
    """ISO 8601 -> '04/08/2026 09h12'. Não reconheceu, devolve como veio."""
    if not bruta:
        return ""
    try:
        limpa = re.sub(r"(\+\d{2}):(\d{2})$", r"\1\2", bruta.replace("Z", "+0000"))
        for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
            try:
                d = datetime.strptime(limpa, fmt)
                return d.strftime("%d/%m/%Y %Hh%M") if "%H" in fmt else d.strftime("%d/%m/%Y")
            except ValueError:
                continue
    except Exception:
        pass
    return bruta


def enviar_telegram(png, legenda):
    """Manda a arte no bot do fluxo ninja, lendo o token do ~/lumen-ninja/.env."""
    env = os.path.expanduser("~/lumen-ninja/.env")
    token = os.environ.get("TELEGRAM_NINJA_BOT_TOKEN", "")
    chat = os.environ.get("TELEGRAM_NINJA_CHAT_ID", "")
    if os.path.exists(env):
        for linha in open(env, encoding="utf-8"):
            m = re.match(r'\s*(?:export\s+)?(\w+)\s*=\s*"?([^"\n]*)"?', linha)
            if m and m.group(1) == "TELEGRAM_NINJA_BOT_TOKEN" and not token:
                token = m.group(2)
            if m and m.group(1) == "TELEGRAM_NINJA_CHAT_ID" and not chat:
                chat = m.group(2)
    if not token or not chat:
        print("telegram: token ou chat_id ausente — pulei o envio", file=sys.stderr)
        return False

    limite = "----------%s" % os.urandom(8).hex()
    corpo = []

    def campo(nome, valor):
        corpo.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n"
                      % (limite, nome, valor)).encode())

    campo("chat_id", chat)
    campo("caption", legenda[:1024])
    corpo.append(("--%s\r\nContent-Disposition: form-data; name=\"photo\"; "
                  "filename=\"%s\"\r\nContent-Type: image/png\r\n\r\n"
                  % (limite, os.path.basename(png))).encode())
    corpo.append(open(png, "rb").read())
    corpo.append(("\r\n--%s--\r\n" % limite).encode())

    req = urllib.request.Request(
        "https://api.telegram.org/bot%s/sendPhoto" % token,
        data=b"".join(corpo),
        headers={"Content-Type": "multipart/form-data; boundary=%s" % limite})
    with urllib.request.urlopen(req, timeout=60) as r:
        ok = json.loads(r.read().decode()).get("ok", False)
    print("telegram:", "enviado" if ok else "falhou")
    return ok


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--link", required=True, help="URL da matéria (o link final do veículo).")
    p.add_argument("--saida", required=True)
    p.add_argument("--estilo", default="metropoles", choices=sorted(ESTILOS))
    p.add_argument("--kicker", default="", help="Editoria. Vazio usa a section da página.")
    p.add_argument("--manchete", default="", help="Sobrepõe a manchete extraída (use só para corrigir extração torta).")
    p.add_argument("--veiculo", default="", help="Vazio usa o og:site_name.")
    p.add_argument("--sem-linha-fina", action="store_true")
    p.add_argument("--assinatura", action="store_true", help="'@eusouramses' discreto no card.")
    p.add_argument("--telegram", action="store_true", help="Envia no @ramsesninjabot ao final.")
    a = p.parse_args()

    print("lendo:", a.link)
    pagina = baixar(a.link)

    manchete = a.manchete or meta(pagina, "og:title", "twitter:title")
    if not manchete:
        m = re.search(r"<title[^>]*>(.*?)</title>", pagina, re.I | re.S)
        manchete = html.unescape(m.group(1).strip()) if m else ""
    # veículos costumam pendurar " - Veículo" no fim do título
    manchete = re.sub(r"\s+[-–|]\s+[^-–|]{2,30}$", "", manchete).strip()

    linha = "" if a.sem_linha_fina else meta(pagina, "og:description", "description")
    veiculo = a.veiculo or meta(pagina, "og:site_name")
    kicker = a.kicker or meta(pagina, "article:section")
    imagem = meta(pagina, "og:image", "twitter:image")

    autor, data_iso = do_jsonld(pagina)
    autor = autor or meta(pagina, "article:author", "author", "twitter:creator")
    data_iso = data_iso or meta(pagina, "article:published_time", "date")
    # article:author às vezes vem como URL de perfil — não serve de assinatura
    if autor.startswith("http") or "/" in autor:
        autor = ""
    autor = autor or "Redação"
    data = formatar_data(data_iso)

    if not manchete:
        sys.exit("não consegui extrair a manchete — confira o link")
    if not imagem:
        sys.exit("a página não expõe og:image — passe a foto na mão pelo gerar_noticia.py")

    print("  manchete:", manchete)
    print("  veículo :", veiculo, "| autor:", autor, "| data:", data or "(sem data)")

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        f.write(baixar(imagem, binario=True))
        foto = f.name

    try:
        gerar(foto, manchete, linha, kicker, autor, data, veiculo,
              a.estilo, a.assinatura, a.saida)
        print("gerado:", a.saida)
        if a.telegram:
            enviar_telegram(a.saida, "%s\n%s" % (manchete, a.link))
    finally:
        os.unlink(foto)


if __name__ == "__main__":
    main()
