#!/bin/bash
# Instala dependencias necessárias para criação de figurinhas no Render

set -e

echo "Atualizando pacotes..."
apt-get update

echo "Instalando ffmpeg e webp..."
apt-get install -y ffmpeg webp

echo "Dependências instaladas."
ffmpeg -version | head -1
webpmux -version || true
