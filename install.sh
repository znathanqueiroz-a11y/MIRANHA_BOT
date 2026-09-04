#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
echo "🕷️ Instalando Miranha Bot FINAL..."
pkg update -y
pkg install -y nodejs ffmpeg
npm install --no-audit --no-fund
npm run check
echo
echo "✅ Instalação concluída e validada."
echo "▶️ Agora rode: npm start"
