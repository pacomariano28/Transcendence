OPCIÓN 2 — No exponer el microservicio fuera de Docker/red interna

Esto ya es más serio/pro.

Idea

Nginx SOLO expone:

frontend
gateway

Y playlist-generator:

vive en red interna
sin puertos públicos

Ejemplo Docker:

playlist-generator:
expose: - "4004"

NO:

ports:

- "4004:4004"
  Entonces:

✔ gateway puede acceder
❌ navegador NO

**Ver tabla Song**
`docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c 'SELECT * FROM "Song";'`

**PASOS PARA DESCARGAR LAS CANCIONES**

1. Pegar el link de una playlist de spotify en esta web y descargar el _csv_:

- https://www.chosic.com/spotify-playlist-exporter/

2. Guardar y modificar este script en un archivo ( download.sh p.ej ) y ejecutarlo ( bash download.sh ).
   - Hay que copiar del _csv_ la tabla de nombres y pegarlas en songs=()
   - Hay que copiar del _csv_ la tabla de trackId y pegarlo en tracks=()

```
#!/bin/bash

set -e

export PATH="$HOME/.local/bin:$PATH"

command -v yt-dlp >/dev/null 2>&1 || { echo "yt-dlp missing"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg missing"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq missing"; exit 1; }

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

songs=(
"family ties kendrick lamar baby keem"
"Wish trippie redd"
"Flashing Lights kanye west"
"No Role Modelz j cole"
"90210 travis scott kacy hill"
"Everyday asap rocky rod stewart miguel mark ronson"
"Day N Nite kid cudi"
"...And to Those I Love Thanks for Sticking Around suicideboys"
"Location playboi carti"
"Let Go central cee"
"ball w/o you 21 savage"
"PRIDE kendrick lamar"
"HONEST baby keem"
"NEW MAGIC WAND tyler the creator"
"Riot earfquake tyler the creator"
"Self Care mac miller"
"Violent Crimes kanye west"
"Mr Rager kid cudi"
"Overdue travis scott"
"Miss The Rage trippie redd playboi carti"
"Wet Dreamz j cole"
"Redbone childish gambino"
"Collard Greens schoolboy q kendrick lamar"
"20 Min lil uzi vert"
"Solo future"
"infinity xxxtentacion joey"
"16 baby keem"
"I Wonder kanye west"
"Nikes on My Feet mac miller"
"5% TINT travis scott"
"Sky playboi carti"
"Praise The Lord skepta asap rocky"
"Ms Jackson outkast"
"Bitch Dont Kill My Vibe kendrick lamar"
"No Idea don toliver"
"The Color Violet tobi"
"vice city xxxtentacion"
"ORANGE SODA baby keem"
"a lot 21 savage"
"Space Cadet gunna"
"Runaway kanye west"
"EARFQUAKE tyler the creator"
"sdp interlude travis scott"
"Taking A Walk trippie redd"
"Alright kendrick lamar"
"Runnin Thru the 7th suicideboys"
"Wake Up in the Sky gucci mane bruno mars kodak black"
"Sundress asap rocky"
"Falling Down lil peep xxxtentacion"
"It Was A Good Day ice cube"
)

trackIds=(
"3QFInJAm9eyaho5vBzxInN"
"760IJcunfpbkm6sHbMmyyj"
"5TRPicyLGbAF2LGBFbHGvO"
"68Dni7IE4VyPkTOH9mRWHr"
"51EC3I1nQXpec4gDk0mQyP"
"2N3U8uTYhjX2KwGT0pf5x0"
"60PAzFNW3vAiAiVK6DRJfB"
"30QR0ndUdiiMQMA9g1PGCm"
"3yk7PJnryiJ8mAPqsrujzf"
"2axiRrUWmlFUKmPzDsjjzg"
"50a8bKqlwDEqeiEknrzkTO"
"6IZvVAP7VPPnsGX6bvgkqg"
"58k32my5lKofeZRtIvBDg9"
"0fv2KH6hac06J86hBUTcSf"
"4aOOExMBUyxKnEYb39SrTg"
"5bJ1DrEM4hNCafcDd1oxHx"
"3s7MCdXyWmwjdcWh7GWXas"
"393MDhe62s8hbH8ETrlxe5"
"6LyAwkJsHlW7RQ8S1cYAtM"
"5n4FTCMefvyKUjeWumdaWv"
"4tqcoej1zPvwePZCzuAjJd"
"3vQ4T78TTMOjQXGfXVKQJo"
"0zO8ctW0UiuOefR87OeJOZ"
"0uxSUdBrJy9Un0EYoBowng"
"4lH6nENd1y81jp7Yt9lTBX"
"7J2gyNghNTzl4EsLhXp01Q"
"1Is8hGpkGMiePASAxBluxM"
"7rbECVPkY5UODxoOUVKZnA"
"0m0GzwCkfuFcxOlLjgpudo"
"11kDth1aKUEUMq9r1pqyds"
"29TPjc8wxfz4XMn21O7VsZ"
"7ycWLEP1GsNjVvcjawXz3z"
"0I3q5fE6wg7LIfHGngUTnV"
"0yhMmqax6HRAZxI7udEask"
"7AzlLxHn24DxjgQX73F9fU"
"3azJifCSqg9fRij2yKIbWz"
"6MOst484piqXpzPPRRe8i5"
"5FkoSXiJPKTNyYgALRJFhD"
"2t8yVaLvJ0RenpXUIAC52d"
"1fewSx2d5KIZ04wsooEBOz"
"3DK6m7It6Pw857FcQftMds"
"5hVghJ4KaYES3BFUATCYn0"
"4gh0ZnHzaTMT1sDga7Ek0N"
"6vSRW8utiYAdoCfJG2v86r"
"3iVcZ5G6tvkXZkZKlMpIUs"
"1tm7c4V0kqLiN0XPVnoUcT"
"2G1tXoGBaEMJ7FKGnkf6ud"
"2aPTvyE09vUCRwVvj0I8WK"
"4jvjzW7Hm0yK4LvvE0Paz9"
"2qOm7ukLyHUXWyR4ZWLwxA"
)

OUT="songs.json"
TMP="songs_tmp.json"

echo "[" > "$TMP"

i=0
first=1

for song in "${songs[@]}"
do
  INDEX=$(printf "%03d" $((i+1)))

echo "🎧 [$INDEX] buscando: $song"

META=$(yt-dlp --dump-json "ytsearch1:$song" 2>/dev/null | tr -d '\n')

if [ $? -ne 0 ] || [ -z "$META" ]; then
echo -e "${RED}❌ [$INDEX] error${NC}"
    i=$((i+1))
continue
fi

URL=$(echo "$META" | jq -r ".webpage_url")

FILE="song_$INDEX.mp3"
PREVIEW="preview_$INDEX.mp3"

echo "⬇️ descargando..."

if yt-dlp -x --audio-format mp3 "$URL" -o "$FILE" >/dev/null 2>&1; then
if ffmpeg -y -i "$FILE" -ss 00:00:00 -t 20 "$PREVIEW" >/dev/null 2>&1; then

      rm -f "$FILE"

      TRACK_ID="${trackIds[$i]}"

      if [ $first -eq 0 ]; then
        echo "," >> "$TMP"
      fi
      first=0

      jq -n \
        --arg trackId "$TRACK_ID" \
        --arg fileName "$PREVIEW" \
        '{trackId:$trackId, fileName:$fileName}' >> "$TMP"

      echo -e "${GREEN}✔ [$INDEX] OK${NC}"

    else
      echo -e "${RED}❌ ffmpeg error${NC}"
      rm -f "$FILE"
    fi

else
echo -e "${RED}❌ download error${NC}"
fi

i=$((i+1))
done

echo "]" >> "$TMP"

mv "$TMP" "$OUT"

echo "================================"
echo "DONE → $OUT"
echo "================================"
```

3. Añadir el archivo json generado al seed.ts de auth-service.
