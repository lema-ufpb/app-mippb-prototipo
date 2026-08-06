#!/bin/zsh
set -e
cd "$(dirname "$0")"

PORT="${PAINEL_PORT:-8780}"
DEST="tmp/servir"

mkdir -p "$DEST"
cp index.html "$DEST/index.html"
for d in dados config static; do
  rm -f "$DEST/$d"
  ln -sfn "../../$d" "$DEST/$d"
done

echo "Painel MIP-PB em http://127.0.0.1:$PORT/"
cd "$DEST"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
