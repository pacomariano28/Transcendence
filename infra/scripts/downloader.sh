#!/bin/bash

set -e

export PATH="$HOME/.local/bin:$PATH"

# 1. Definición de rutas absolutas
TARGET_DIR="/home/frmarian/Desktop/transcendence/srcs/frontend/public/media"
SEED_FILE="/home/frmarian/Desktop/transcendence/srcs/backend/playlist-service/prisma/seed.ts"

# 2. Comprobación del CSV
if [ -z "$1" ]; then
  echo "Uso: $0 <archivo_playlist.csv>"
  exit 1
fi

CSV_FILE="$1"

if [ ! -f "$CSV_FILE" ]; then
  echo "Error: El archivo '$CSV_FILE' no existe."
  exit 1
fi

# 3. Comprobación de dependencias
command -v yt-dlp >/dev/null 2>&1 || { echo "yt-dlp missing"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg missing"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq missing"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 missing"; exit 1; }

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

# 4. Limpieza del directorio de destino
echo "Preparando directorio de destino..."
mkdir -p "$TARGET_DIR"
# Elimina cualquier archivo mp3 previo para evitar acumular basura
rm -f "$TARGET_DIR"/preview_*.mp3
rm -f "$TARGET_DIR"/song_*.mp3

echo "Obteniendo datos del CSV..."

songs=()
trackIds=()

while IFS= read -r line; do
  songs+=("$line")
done < <(python3 -c '
import csv, sys
with open(sys.argv[1], newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if "Song" in row and "Artist" in row:
            print(row["Song"] + " " + row["Artist"])
' "$CSV_FILE")

while IFS= read -r line; do
  trackIds+=("$line")
done < <(python3 -c '
import csv, sys
with open(sys.argv[1], newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if "Spotify Track Id" in row:
            print(row["Spotify Track Id"])
' "$CSV_FILE")

if [ ${#songs[@]} -eq 0 ]; then
  echo -e "${RED}❌ No se encontraron canciones en el CSV. Comprueba el formato.${NC}"
  exit 1
fi

echo -e "${GREEN}✔ Se encontraron ${#songs[@]} canciones.${NC}"
echo "----------------------------------------"

# 5. Archivo temporal para ir guardando los datos válidos del seed
SEED_DATA_TMP=$(mktemp)

i=0
SUCCESS_COUNT=0

# 6. Bucle de descarga con control de fallos
for song in "${songs[@]}"
do
  INDEX=$(printf "%03d" $((i+1)))
  TRACK_ID="${trackIds[$i]}"

  echo "🎧 [$INDEX] buscando: $song"

  # El '|| true' evita que el set -e aborte el script si yt-dlp falla
  META=$(yt-dlp --dump-json "ytsearch1:$song" 2>/dev/null || true)

  if [ -z "$META" ]; then
    echo -e "${RED}❌ [$INDEX] error al buscar en youtube (Skipeando)${NC}"
    i=$((i+1))
    continue
  fi

  URL=$(echo "$META" | jq -r ".webpage_url" 2>/dev/null || true)
  
  if [ -z "$URL" ] || [ "$URL" == "null" ]; then
    echo -e "${RED}❌ [$INDEX] URL no encontrada (Skipeando)${NC}"
    i=$((i+1))
    continue
  fi

  FILE="$TARGET_DIR/song_$INDEX.mp3"
  PREVIEW_NAME="preview_$INDEX.mp3"
  PREVIEW_PATH="$TARGET_DIR/$PREVIEW_NAME"

  echo "⬇️ descargando..."

  if yt-dlp -x --audio-format mp3 "$URL" -o "$FILE" >/dev/null 2>&1; then
    if ffmpeg -y -i "$FILE" -ss 00:00:00 -t 20 "$PREVIEW_PATH" >/dev/null 2>&1; then

      # Borramos la canción completa para dejar solo la preview
      rm -f "$FILE"

      # Inyectamos el objeto TypeScript en el archivo temporal
      cat <<EOF >> "$SEED_DATA_TMP"
      {
        trackId: "$TRACK_ID",
        fileName: "$PREVIEW_NAME",
      },
EOF

      echo -e "${GREEN}✔ [$INDEX] OK${NC}"
      SUCCESS_COUNT=$((SUCCESS_COUNT+1))

    else
      echo -e "${RED}❌ ffmpeg error al cortar el audio (Skipeando)${NC}"
      rm -f "$FILE"
    fi
  else
    echo -e "${RED}❌ download error en yt-dlp (Skipeando)${NC}"
  fi

  i=$((i+1))
done

# 7. Reconstrucción del archivo seed.ts
echo "================================"
echo "Generando $SEED_FILE..."

# Escribir cabecera del seed
cat <<EOF > "$SEED_FILE"
import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
EOF

# Volcar los datos válidos almacenados en el temporal
cat "$SEED_DATA_TMP" >> "$SEED_FILE"

# Escribir el cierre del seed (nota el escape en \$disconnect)
cat <<EOF >> "$SEED_FILE"
    ],
  });
  console.log("Seeded songs!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
EOF

# Limpieza
rm -f "$SEED_DATA_TMP"
rm -f songs_tmp.json songs.json 2>/dev/null

echo -e "${GREEN}DONE → $SUCCESS_COUNT canciones descargadas correctamente y seed.ts actualizado.${NC}"
echo "================================"
