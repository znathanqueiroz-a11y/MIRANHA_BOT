#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
DEST="/sdcard/Download/MIRANHA-BACKUP-$(date +%Y-%m-%d_%H-%M).tar.gz"
tar --exclude=node_modules --exclude=temp_sticker -czf "$DEST" .
echo "✅ Backup criado em: $DEST"
