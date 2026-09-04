#!/data/data/com.termux/files/usr/bin/bash
set -e

DEST="$(cd "$(dirname "$0")" && pwd)"
ORIGEM="${1:-$(cd "$DEST/.." && pwd)}"

echo "🕷️ Migrando dados antigos..."
echo "Origem: $ORIGEM"
echo "Destino: $DEST"

if [ -d "$ORIGEM/auth_info_baileys" ] && [ "$ORIGEM/auth_info_baileys" != "$DEST/auth_info_baileys" ]; then
  rm -rf "$DEST/auth_info_baileys"
  cp -a "$ORIGEM/auth_info_baileys" "$DEST/"
  echo "✅ Sessão do WhatsApp copiada."
fi

if [ -f "$ORIGEM/config/config.js" ] && [ "$ORIGEM/config/config.js" != "$DEST/config/config.js" ]; then
  cp "$ORIGEM/config/config.js" "$DEST/config/config.js"
  echo "✅ Config do dono copiada."
fi

if [ -d "$ORIGEM/database" ] && [ "$ORIGEM/database" != "$DEST/database" ]; then
  rm -rf "$DEST/database_antigo"
  cp -a "$ORIGEM/database" "$DEST/database_antigo"
  echo "✅ Database antigo guardado em database_antigo/ para não perder dados."

  if [ -f "$ORIGEM/database/prefixo.json" ]; then
    cp "$ORIGEM/database/prefixo.json" "$DEST/database/prefixo.json"
    echo "✅ Prefixo antigo migrado."
  fi
fi

echo
echo "✅ Migração concluída."
echo "Os bancos antigos ficaram preservados em database_antigo/ para evitar incompatibilidade de formato."
echo "Agora rode:"
echo "  cd \"$DEST\""
echo "  bash install.sh"
echo "  npm run check"
echo "  npm start"
