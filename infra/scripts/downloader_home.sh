#!/bin/bash

set -e

export PATH="$HOME/.local/bin:$PATH"

# 1. Definición de rutas absolutas
TARGET_DIR="$HOME/Escritorio/transcendence/srcs/frontend/public/media"
SEED_FILE="$HOME/Escritorio/transcendence/srcs/backend/playlist-service/prisma/seed.ts"

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
command -v python3 >/dev/null 2>&1 || { echo "python3 missing"; exit 1; }

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

# 4. Limpieza del directorio de destino
echo "Preparando directorio de destino..."
mkdir -p "$TARGET_DIR"
rm -f "$TARGET_DIR"/preview_*.mp3
rm -f "$TARGET_DIR"/song_*.mp3

echo "Obteniendo datos del CSV..."

songs=()
isrcs=()

# Extraer Canción + Artista
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

# Extraer ISRC
while IFS= read -r line; do
  isrcs+=("$line")
done < <(python3 -c '
import csv, sys
with open(sys.argv[1], newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        isrc_key = next((k for k in row if k.strip().lower() == "isrc"), None)
        if isrc_key and row[isrc_key].strip():
            print(row[isrc_key].strip())
        else:
            print("UNKNOWN_ISRC")
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
  ISRC="${isrcs[$i]}"

  # Añadimos la palabra "audio" a la búsqueda para evitar videoclips
  SEARCH_TERM="$song audio"

  echo "🎧 [$INDEX] buscando y descargando: $SEARCH_TERM"

  FILE="$TARGET_DIR/song_$INDEX.mp3"
  PREVIEW_NAME="preview_$INDEX.mp3"
  PREVIEW_PATH="$TARGET_DIR/$PREVIEW_NAME"

  # Usamos ytsearch1 normal, pero guardamos el error por si falla
  if yt-dlp --quiet --no-warnings -x --audio-format mp3 "ytsearch1:$SEARCH_TERM" -o "$FILE" 2> yt-error.log; then
    
    if ffmpeg -y -i "$FILE" -ss 00:00:00 -t 20 "$PREVIEW_PATH" >/dev/null 2>&1; then

      rm -f "$FILE"

      # Guardamos usando la clave isrc como solicitaste
      cat <<EOF >> "$SEED_DATA_TMP"
      {
        isrc: "$ISRC",
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
    ERROR_MSG=$(cat yt-error.log | head -n 1)
    echo -e "${RED}❌ download error en yt-dlp: $ERROR_MSG (Skipeando)${NC}"
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
if [ -s "$SEED_DATA_TMP" ]; then
  cat "$SEED_DATA_TMP" >> "$SEED_FILE"
fi

# Escribir el cierre del seed
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
rm -f yt-error.log
rm -f songs_tmp.json songs.json 2>/dev/null

echo -e "${GREEN}DONE → $SUCCESS_COUNT canciones descargadas correctamente y seed.ts actualizado.${NC}"
echo "================================"
