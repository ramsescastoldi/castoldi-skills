#!/bin/bash
# Renderiza os posts de notícia no modelo CARD DE MATÉRIA, no Mac que opera o fluxo.
#
#   bash rodar.sh                          # usa a fila de hoje do lumen-ninja
#   bash rodar.sh 1 3 5                    # só as notícias 1, 3 e 5 da fila
#   bash rodar.sh https://... https://...  # links avulsos, sem fila
#
# Variáveis:
#   TELEGRAM=1   envia cada arte no @ramsesninjabot ao final
#   ESTILO=g1    troca o estilo (metropoles padrão, g1, veja, expresso)
#   ASSINATURA=1 acrescenta o @eusouramses discreto no rodapé do card
#   DIA=2026-08-04  usa a fila de outro dia
#
# Precisa de: python3 com Pillow, e rede livre (não roda em container fechado).

set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NINJA="${NINJA:-$HOME/lumen-ninja}"
DIA="${DIA:-$(date +%F)}"
FILA="$NINJA/fila/$DIA.json"
SAIDA="${SAIDA:-$NINJA/renders/$DIA}"
ESTILO="${ESTILO:-metropoles}"

python3 - <<'PY' || { echo "Pillow ausente. Rode: pip3 install --user Pillow" >&2; exit 1; }
import sys
try:
    import PIL  # noqa: F401
except ImportError:
    sys.exit(1)
PY

mkdir -p "$SAIDA"

# ---- Monta a lista de links a renderizar ----
LINKS=()
SLUGS=()

if [ "$#" -gt 0 ] && [[ "${1:-}" == http* ]]; then
  i=0
  for url in "$@"; do
    i=$((i+1)); LINKS+=("$url"); SLUGS+=("avulso-$i")
  done
else
  [ -f "$FILA" ] || { echo "Fila não encontrada: $FILA
Rode a varredura antes (~/lumen-ninja/run.sh varredura) ou passe links direto." >&2; exit 1; }
  while IFS=$'\t' read -r n url; do
    [ -n "$url" ] || continue
    LINKS+=("$url"); SLUGS+=("noticia-$n")
  done < <(FILTRO="$*" python3 - "$FILA" <<'PY'
import json, os, sys
fila = json.load(open(sys.argv[1], encoding="utf-8"))
filtro = {x for x in os.environ.get("FILTRO", "").split() if x}
for item in fila:
    n = str(item.get("n", ""))
    if item.get("tipo") == "frase":          # frases não usam este modelo
        continue
    if filtro and n not in filtro:
        continue
    link = item.get("link", "")
    if link:
        print("%s\t%s" % (n, link))
PY
)
fi

[ "${#LINKS[@]}" -gt 0 ] || { echo "Nenhuma notícia para renderizar." >&2; exit 1; }

echo "Renderizando ${#LINKS[@]} post(s) — estilo $ESTILO → $SAIDA"
echo

EXTRA=()
[ "${ASSINATURA:-0}" = "1" ] && EXTRA+=(--assinatura)
[ "${TELEGRAM:-0}" = "1" ] && EXTRA+=(--telegram)

ok=0; falhou=0
for i in "${!LINKS[@]}"; do
  destino="$SAIDA/${SLUGS[$i]}.png"
  echo "── ${SLUGS[$i]}"
  if python3 "$AQUI/scripts/render_do_link.py" \
        --link "${LINKS[$i]}" --estilo "$ESTILO" \
        --saida "$destino" "${EXTRA[@]}"; then
    ok=$((ok+1))
  else
    echo "   falhou: ${LINKS[$i]}" >&2
    falhou=$((falhou+1))
  fi
  echo
done

echo "Prontos: $ok · Falharam: $falhou"
echo "Pasta: $SAIDA"
[ "$ok" -gt 0 ] && command -v open >/dev/null && open "$SAIDA"

# Falha em veículo que renderiza por JavaScript ou não expõe og:image é
# esperada — nesses casos, baixe a foto na mão e use scripts/gerar_noticia.py.
exit 0
