# Documento Técnico Consolidado: Multiplayer Music Trivia

## 1. Roadmap de Desarrollo

### Fase 1: Infraestructura y Base de Datos
* **Nginx:** Configurar como proxy inverso para HTTPS y gestión de recursos estáticos de React.
* **Enrutamiento:** Redirigir `/api/*` y WebSockets al API Gateway.
* **Arquitectura:** Despliegue en contenedores independientes:
    * API Gateway
      * Implementación de ruta /api/search con proxy a iTunes y sistema de caché temporal.
    * Game Service
    * Auth & User Service
    * Content Service
* **Persistencia:** PostgreSQL + Prisma ORM.

### Fase 2: Autenticación y Perfilado (Auth Service)
* **OAuth 2.0:** Implementación con Spotify API.
* **Data Extraction:** Obtención de metadatos musicales para generar el `taste_profile` (JSON).
* **Gateway:** Validación de tokens globales y aplicación de *rate limiting*.

### Fase 3: Motor de Generación (Content Service)
* **Ingesta:** Recepción de perfiles agregados vía HTTP REST síncrono.
* **IA:** Integración con OpenAI/Gemini para procesar géneros y artistas.
* **Validación:** Consulta a iTunes Search API para confirmar URLs de audio (.mp3, 15s).
* **Fallback:** Lógica de reemplazo automático si iTunes no devuelve resultados.

### Fase 4: Desarrollo de Cliente (Frontend)
* **Stack:** React + Vite (HMR) + Tailwind CSS.
* **Audio:** Web Audio API (`AudioContext`) para mitigar *audio drift*.
* **Búsqueda:** * Input con *debounce* de 300ms.
    * Consultas REST al endpoint de búsqueda en el API Gateway.
* **UX:** UI optimista (bloqueo instantáneo con barra espaciadora).

### Fase 5: Máquina de Estados (Game Service & WebSockets)
* **Socket.io:** Fuente de verdad para temporizadores y salas en memoria.
* **Sincronización:**
    1. Distribución de URLs.
    2. Recepción de `READY`.
    3. `START_COUNTDOWN` (5s).
    4. Inicio de audio y temporizador de servidor (0.0s - 15.0s).
* **Eventos:**
    * `LOCK_REQUEST`: Validación de estado.
    * `GAME_PAUSED`: Timestamp exacto para detener audio en clientes.
    * `SUBMIT_GUESS`: Procesamiento y emisión de `GUESS_REVEAL`.

### Fase 6: Puntuación y Gestión de Errores

| Concepto | Lógica Aplicada |
| :--- | :--- |
| **Acierto** | Puntos base + Bono de velocidad (`(Total - Transcurrido) * Factor`) |
| **Fallo/Timeout** | Penalización fija + `COOLDOWN` de 5s (entrada deshabilitada) |
| **Desconexión** | Reanudación inmediata del audio para el resto de jugadores |
| **Troll Pause** | Límite de 10s en servidor -> Penalización + Reanudación automática |
| **Drift Correction** | Reanudación con `seekTo` basado en timestamp del servidor |
