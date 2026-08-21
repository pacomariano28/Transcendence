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

# YouTube ahora requiere yt-dlp-ejs para resolver firmas/challenges
if ! python3 -c "import importlib.util; exit(0 if importlib.util.find_spec('yt_dlp_ejs') else 1)" 2>/dev/null; then
  echo "Instalando soporte YouTube para yt-dlp (yt-dlp-ejs)..."
  pip3 install --user -U "yt-dlp[default]" >/dev/null 2>&1 || {
    echo "No se pudo instalar yt-dlp[default]. Ejecuta: pip3 install -U \"yt-dlp[default]\""
    exit 1
  }
fi

# Limpiar caché obsoleta del reproductor de YouTube (causa habitual de HTTP 403)
yt-dlp --rm-cache-dir >/dev/null 2>&1 || true

download_audio() {
  local search_term="$1"
  local output_file="$2"
  local error_log="$3"

  yt-dlp --quiet --no-warnings \
    --extractor-args "youtube:player_client=android,web" \
    -x --audio-format mp3 \
    "ytsearch1:$search_term" \
    -o "$output_file" 2> "$error_log"

  [ -f "$output_file" ] && [ -s "$output_file" ]
}

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
    for i, row in enumerate(reader, start=1):
        isrc_key = next((k for k in row if k.strip().lower() == "isrc"), None)
        if isrc_key and row[isrc_key].strip():
            print(row[isrc_key].strip())
        else:
            print(f"UNKNOWN_ISRC_{i}")
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
declare -A seen_isrcs

# 6. Bucle de descarga con control de fallos
for song in "${songs[@]}"
do
  INDEX=$(printf "%03d" $((i+1)))
  ISRC="${isrcs[$i]}"

  if [[ -n "${seen_isrcs[$ISRC]}" ]]; then
    echo -e "${RED}⚠️  [$INDEX] ISRC duplicado: $ISRC (Skipeando)${NC}"
    i=$((i+1))
    continue
  fi
  seen_isrcs[$ISRC]=1

  # Añadimos la palabra "audio" a la búsqueda para evitar videoclips
  SEARCH_TERM="$song audio"

  echo "🎧 [$INDEX] buscando y descargando: $SEARCH_TERM"

  FILE="$TARGET_DIR/song_$INDEX.mp3"
  PREVIEW_NAME="preview_$INDEX.mp3"
  PREVIEW_PATH="$TARGET_DIR/$PREVIEW_NAME"

  if download_audio "$SEARCH_TERM" "$FILE" yt-error.log; then
    if ffmpeg -y -i "$FILE" -ss 00:00:00 -t 20 "$PREVIEW_PATH" 2> ffmpeg-error.log; then

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
      ERROR_MSG=$(tail -n 1 ffmpeg-error.log 2>/dev/null)
      echo -e "${RED}❌ ffmpeg error al cortar el audio: $ERROR_MSG (Skipeando)${NC}"
      rm -f "$FILE" "$PREVIEW_PATH"
    fi
  else
    ERROR_MSG=$(grep -m1 -E 'ERROR|error' yt-error.log 2>/dev/null || head -n 1 yt-error.log)
    echo -e "${RED}❌ download error en yt-dlp: $ERROR_MSG (Skipeando)${NC}"
    rm -f "$FILE"
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
rm -f yt-error.log ffmpeg-error.log
rm -f songs_tmp.json songs.json 2>/dev/null

echo -e "${GREEN}DONE → $SUCCESS_COUNT canciones descargadas correctamente y seed.ts actualizado.${NC}"
echo "================================"
