#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/MIRANHA_BOT"

mkdir -p config

printf "Cole sua chave da API da OpenAI (ela não será exibida): "
IFS= read -r -s CHAVE
printf "\n"

if [ -z "$CHAVE" ]; then
  echo "❌ Nenhuma chave informada."
  exit 1
fi

printf "%s" "$CHAVE" > config/openai.key
chmod 600 config/openai.key
unset CHAVE

echo "✅ Chave salva em config/openai.key"
echo "🔒 Não envie esse arquivo nem sua chave para ninguém."
