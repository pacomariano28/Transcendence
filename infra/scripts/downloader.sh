#!/bin/bash

set -e

export PATH="$HOME/.local/bin:$PATH"

# 1. Definition of absolute paths
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd ../.. && pwd )"
TARGET_DIR="$ROOT_DIR/srcs/frontend/public/media"
SEED_FILE="$ROOT_DIR/srcs/backend/playlist-service/prisma/seed.ts"

# 2. CSV file check
if [ -z "$1" ]; then
  echo "Usage: $0 <playlist_file.csv>"
  exit 1
fi

CSV_FILE="$1"

if [ ! -f "$CSV_FILE" ]; then
  echo "Error: The file '$CSV_FILE' does not exist."
  exit 1
fi

# 3. Dependency check
command -v yt-dlp >/dev/null 2>&1 || { echo "yt-dlp missing"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg missing"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 missing"; exit 1; }

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

# 4. Cleanup of destination directory
echo "Preparing destination directory..."
mkdir -p "$TARGET_DIR"
rm -f "$TARGET_DIR"/preview_*.mp3
rm -f "$TARGET_DIR"/song_*.mp3

echo "Fetching data from CSV..."

songs=()
isrcs=()

# Extract Song + Artist
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

# Extract ISRC
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
  echo -e "${RED}❌ No songs found in CSV. Please check the format.${NC}"
  exit 1
fi

echo -e "${GREEN}✔ Found ${#songs[@]} songs.${NC}"
echo "----------------------------------------"

# 5. Temporary file to store valid seed data
SEED_DATA_TMP=$(mktemp)

i=0
SUCCESS_COUNT=0

# 6. Download loop with error handling
for song in "${songs[@]}"
do
  INDEX=$(printf "%03d" $((i+1)))
  ISRC="${isrcs[$i]}"

  # Add the word "audio" to the search query to avoid music videos
  SEARCH_TERM="$song audio"

  echo "🎧 [$INDEX] searching and downloading: $SEARCH_TERM"

  FILE="$TARGET_DIR/song_$INDEX.mp3"
  PREVIEW_NAME="preview_$INDEX.mp3"
  PREVIEW_PATH="$TARGET_DIR/$PREVIEW_NAME"

  # Use standard ytsearch1, but save error in case it fails
  if yt-dlp --quiet --no-warnings -x --audio-format mp3 "ytsearch1:$SEARCH_TERM" -o "$FILE" 2> yt-error.log; then
    
    if ffmpeg -y -i "$FILE" -ss 00:00:00 -t 20 "$PREVIEW_PATH" >/dev/null 2>&1; then

      rm -f "$FILE"

      # Save using the isrc key as requested
      cat <<EOF >> "$SEED_DATA_TMP"
      {
        isrc: "$ISRC",
        fileName: "$PREVIEW_NAME",
      },
EOF

      echo -e "${GREEN}✔ [$INDEX] OK${NC}"
      SUCCESS_COUNT=$((SUCCESS_COUNT+1))

    else
      echo -e "${RED}❌ ffmpeg error while trimming audio (Skipping)${NC}"
      rm -f "$FILE"
    fi
  else
    ERROR_MSG=$(cat yt-error.log | head -n 1)
    echo -e "${RED}❌ download error in yt-dlp: $ERROR_MSG (Skipping)${NC}"
  fi

  i=$((i+1))
done

# 7. Reconstruction of the seed.ts file
echo "================================"
echo "Generating $SEED_FILE..."

# Write seed header
cat <<EOF > "$SEED_FILE"
import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
EOF

# Append valid data saved in the temporary file
if [ -s "$SEED_DATA_TMP" ]; then
  cat "$SEED_DATA_TMP" >> "$SEED_FILE"
fi

# Write seed footer
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

# Cleanup
rm -f "$SEED_DATA_TMP"
rm -f yt-error.log
rm -f songs_tmp.json songs.json 2>/dev/null

echo -e "${GREEN}DONE → $SUCCESS_COUNT songs downloaded successfully and seed.ts updated.${NC}"
echo "================================"