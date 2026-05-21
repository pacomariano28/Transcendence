1. Personalized recommendations based on user behavior
   El sistema personaliza las recomendaciones usando el perfil Spotify del usuario.

Cómo se justifica
Se obtienen artistas y géneros más escuchados.
Se almacena esa información en un perfil persistente.
Las canciones generadas se adaptan a esos gustos.
Defensa
Aunque no analizamos métricas de partidas, sí utilizamos preferencias reales del usuario como base de recomendación. Eso ya constituye una forma de personalización basada en comportamiento musical.

2. Content-based filtering
   El sistema aplica un filtrado basado en contenido, porque las recomendaciones se generan a partir de características musicales concretas.

Cómo se justifica
Si un usuario escucha principalmente pop e indie pop, el sistema tenderá a generar canciones de esos estilos o de artistas relacionados.
Si otro usuario tiene un perfil centrado en rock, la generación se orientará hacia ese tipo de contenido.
Defensa
Las recomendaciones no se hacen por azar ni por popularidad global, sino usando atributos del contenido musical del usuario: artistas, géneros y afinidad musical.

3. Collaborative filtering
   Este punto no sería el más fuerte del sistema si lo planteáis solo con perfil individual, pero podéis defender una aproximación ligera si combináis perfiles de varios usuarios en una sala.

Cómo se justifica
La sala se forma con varios jugadores.
El sistema agrupa los perfiles de todos ellos.
La recomendación final surge del perfil colectivo del grupo.
Defensa
Aunque no implementamos un collaborative filtering clásico basado en matrices usuario-item, sí hacemos una agregación de preferencias de múltiples usuarios para construir recomendaciones compartidas. Esto se puede presentar como una versión simplificada de recomendación colaborativa a nivel de sala.

4. Continuously improve recommendations over time
   Este punto se cubre mediante la actualización persistente del perfil musical del usuario.

Cómo se justifica
El perfil no es estático.
Se sincroniza periódicamente con Spotify.
Si cambian los gustos del usuario, el sistema actualiza su perfil.
Las futuras recomendaciones usan datos más recientes.
Defensa
La mejora continua no depende de analizar partidas, sino de mantener el perfil musical actualizado. Cuanto más se sincroniza la cuenta y más información hay disponible, más afinadas serán las recomendaciones.

Cómo venderlo de forma sólida
Puedes decir algo como:

“El sistema genera recomendaciones musicales personalizadas a partir de perfiles persistentes de usuario sincronizados con Spotify. Estos perfiles incluyen artistas y géneros predominantes, y se combinan cuando hay varios jugadores en una sala para generar una selección adaptada al grupo. Las recomendaciones se actualizan con datos recientes del usuario, permitiendo una evolución progresiva del sistema sin necesidad de entrenar un modelo propio desde cero.”

#!/bin/bash

urls=(
"https://www.youtube.com/watch?v=hTWKbfoikeg"
"https://www.youtube.com/watch?v=wXuFG8uQpZ8"
"https://www.youtube.com/watch?v=fJ9rUzIMcZQ"
"https://www.youtube.com/watch?v=0xyxtzD54rM"
"https://www.youtube.com/watch?v=YQHsXMglC9A"
)

i=1

for url in "${urls[@]}"
do
  yt-dlp -x --audio-format mp3 "$url" -o "song\_$i.mp3"

ffmpeg -i "song*$i.mp3" -ss 00:00:30 -t 20 "preview*$i.mp3"

rm "song\_$i.mp3"

((i++))
done
