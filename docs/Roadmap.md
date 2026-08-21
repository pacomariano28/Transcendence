# Consolidated Technical Document: Multiplayer Music Trivia

## 1. Development Roadmap

### Phase 1: Infrastructure and Database
* **Nginx:** Configure as a reverse proxy for HTTPS and serving static React assets.
* **Routing:** Redirect `/api/*` and WebSockets to the API Gateway.
* **Architecture:** Deployment across isolated containers:
    * API Gateway
        * Implementation of the `/api/search` route with proxying to iTunes and a temporary caching system.
    * Game Service
    * Auth & User Service
    * Content Service
* **Persistence:** PostgreSQL + Prisma ORM.

### Phase 2: Authentication and Profiling (Auth Service)
* **OAuth 2.0:** Implementation with Spotify API.
* **Data Extraction:** Retrieval of musical metadata to generate the `taste_profile` (JSON).
* **Gateway:** Global token validation and rate limiting enforcement.

### Phase 3: Generation Engine (Content Service)
* **Ingestion:** Reception of aggregated profiles via synchronous HTTP REST.
* **AI:** Integration with OpenAI/Gemini to process genres and artists.
* **Validation:** Queries to iTunes Search API to confirm audio URLs (.mp3, 15s).
* **Fallback:** Automatic replacement logic if iTunes returns no results.

### Phase 4: Client Development (Frontend)
* **Stack:** React + Vite (HMR) + Tailwind CSS.
* **Audio:** Web Audio API (`AudioContext`) to mitigate audio drift.
* **Search:**
    * Input with 300ms debounce.
    * REST queries to the search endpoint on the API Gateway.
* **UX:** Optimistic UI (instant lock via Spacebar).

### Phase 5: State Machine (Game Service & WebSockets)
* **Socket.io:** Source of truth for in-memory timers and rooms.
* **Synchronization:**
    1. Distribution of URLs.
    2. Reception of `READY`.
    3. `START_COUNTDOWN` (5s).
    4. Audio playback start and server-side timer (0.0s - 15.0s).
* **Events:**
    * `LOCK_REQUEST`: State validation.
    * `GAME_PAUSED`: Exact timestamp to stop audio on clients.
    * `SUBMIT_GUESS`: Processing and emission of `GUESS_REVEAL`.

### Phase 6: Scoring and Error Handling

| Concept | Applied Logic |
| :--- | :--- |
| **Correct Answer** | Base points + Speed bonus (`(Total - Elapsed) * Factor`) |
| **Wrong Answer / Timeout** | Fixed penalty + 5s `COOLDOWN` (input disabled) |
| **Disconnection** | Immediate playback resume for remaining players |
| **Troll Pause** | 10s server-side limit -> Penalty + Automatic resume |
| **Drift Correction** | Resume playback with `seekTo` based on server timestamp |
