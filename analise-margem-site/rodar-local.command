#!/bin/bash
# Roda o site Margem localmente no Mac: clique duplo neste arquivo.
cd "$(dirname "$0")"
echo ""
echo "  Site Margem rodando em:  http://localhost:8787"
echo "  Formulário:              http://localhost:8787/?pg=diagnostico"
echo "  (Ctrl+C aqui no terminal pra parar)"
echo ""
open "http://localhost:8787" 2>/dev/null
python3 -m http.server 8787
