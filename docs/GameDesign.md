# Game Design Document: Multiplayer Music Trivia

## 1. Game Overview
A real-time, competitive music guessing game where gameplay is driven by a "Stop & Solve" mechanic. The game aggregates the musical tastes of all players in the lobby to generate a unique playlist for every match.

* **Audio Source:** iTunes Search API (15s Previews).
* **Auth/Profile Source:** Spotify OAuth (User Taste Data).

---

## 2. Core Gameplay Loop
The match consists of *N* Rounds. Each round follows this strict state machine:

### Phase A: Synchronization (The Setup)
* **Aggregation:** Server combines "Top Genres/Artists" from all connected players.
* **Generation:** AI (OpenAI/Gemini API) generates a playlist balancing these tastes.
* **Validation:** Server verifies songs exist on iTunes and fetches `.mp3` preview URLs.
* **Pre-load:** Server sends the round's Song URL to all clients.
* **Ready Check:** Clients download the audio blob and signal `READY`.
* **Countdown:** Once 100% ready, Server broadcasts `START_COUNTDOWN` (5s).

### Phase B: The Race (The Active State)
* **Playback:** At T=0, all clients play audio locally.
* **Server Timer:** Server tracks elapsed time (0.0s to 15.0s).
* **Interaction:** Players listen. First to recognize presses `SPACEBAR`.

### Phase C: The Lock (The Interruption)
* **Trigger:** Player A sends `LOCK_REQUEST`.
* **Server Logic:**
    * If state == `PLAYING`: Accept lock. Broadcast `GAME_PAUSED` with timestamp (e.g., 4.2s).
    * If state == `LOCKED`: Reject request.
* **Client Action:**
    * **All:** Pause audio immediately at 4.2s.
    * **Guesser (Player A):** Input field unlocks. Timer set to 10s.
    * **Spectators:** Input disabled. UI shows "Player A is guessing...".

### Phase D: The Guess
* **Search:** Player A types. The React Frontend calls the API Gateway (debounced). The server queries iTunes, standardizes the JSON, and returns it to the client.
* **Selection:** Player A selects a track from the dropdown.
* **Submission:** Client sends `SUBMIT_GUESS { trackId, trackName }` to Server.
* **Broadcast:** Server broadcasts `GUESS_REVEAL { trackName }` to all spectators (e.g., "Player A guessed 'Thriller'").

### Phase E: Resolution
* **Scenario 1: Correct**
    * Server calculates score.
    * Broadcast `ROUND_WIN` (Player A).
    * Show Album Art/Details. Wait 5s. Next Round.
* **Scenario 2: Incorrect / Timeout**
    * Server broadcasts `WRONG_GUESS`.
    * Penalty: Player A gets `COOLDOWN` (Input disabled for 5s).
    * Resume: Server broadcasts `RESUME_PLAYBACK { time: 4.2s }`.
    * Audio resumes for everyone. Race continues.

---

## 3. Scoring System
Points are awarded to reward speed and accuracy.

| Metric | Formula | Example |
| :--- | :--- | :--- |
| **Base Score** | Fixed value for correct answer. | 100 pts |
| **Speed Bonus** | (TotalTime - ElapsedTime) * Multiplier | Guess at 2s (13s left) = 13 * 10 = +130 pts |
| **Wrong Guess** | Flat penalty. | -50 pts |
| **Max Possible** | Base + Max Bonus. | 250 pts |

---

## 4. Technical Architecture

### Frontend (React + Vite + Tailwind CSS)
* **Build Tool & Environment:** Vite for fast compilation and Hot Module Replacement (HMR).
* **Styling:** Tailwind CSS for UI design and low-latency game components.
* **Audio Management:** Web Audio API (`AudioContext`) for precise time control and mitigating pause/resume drift between clients.
* **Optimistic UI:** When Player A presses the spacebar, the UI immediately shows the "Requesting lock..." state, but audio is not paused locally until the server confirms the action.
* **Search Component:**
    * **Input:** Text field.
    * **Logic:** `onChange` -> `debounce(300ms)` -> GET request to the API Gateway (/api/search) -> update dropdown list.

### Backend (Microservices Architecture with Express.js)
The system is divided into independent services to isolate resource consumption. Each component runs in its own container.

* **Reverse Proxy & SSL (Nginx):**
    * **Responsibility:** Infrastructure level. Handles HTTPS (SSL/TLS termination), serves compiled React static assets, and proxies all `/api/*` and WebSocket traffic to the API Gateway container.
* **API Gateway (Express.js):**
    * **Responsibility:** Application level. Acts as the single entry point for internal routing. Handles global rate limiting, token validation (via Auth Service), and routes REST/WebSocket requests to the underlying microservices. It acts as a proxy for client searches to the iTunes Search API. It applies a caching layer in-memory for identical queries and standardizes the returned metadata.
* **Game Service (Express.js + Socket.io):**
    * **Responsibility:** Maintains the "source of truth" for timers, round states, and answer resolution. Stores match state and WebSocket rooms in-memory.
    * **Logic:** Manages Socket.io channels (rooms) per match. Applies rate limiting on the `LOCK_REQUEST` event.
* **Auth & User Service (Express.js):**
    * **Responsibility:** Handles the Spotify OAuth 2.0 flow, stores encrypted tokens, and extracts Spotify API data to build the user's musical profile.
* **Content Service (Express.js):**
    * **Responsibility:** Orchestrates playlist generation. Receives aggregated profiles, queries the AI API (OpenAI/Gemini), and validates results against the iTunes API.
* **Inter-Service Communication:**
    * **Synchronous HTTP REST:** The Game Service initiates a standard HTTP `POST` request to the Content Service to generate a playlist and waits for the synchronous JSON response before starting the match.

### Database (PostgreSQL + Prisma ORM)
The Auth Service and the Game Service have their own logical schemas or separate databases.

* **Prisma Model: User** (Assigned to Auth Service)
    * `id` (String, PK, UUID)
    * `spotify_id` (String, Unique)
    * `access_token` (String, application-level encryption)
    * `refresh_token` (String, application-level encryption)
    * `taste_profile` (Json) -> e.g., `{"pop": 0.8, "metal": 0.1}`
* **Prisma Model: GameHistory** (Assigned to Game Service)
    * `id` (String, PK, UUID)
    * `played_at` (DateTime, default: now)
    * `winner_id` (String)
    * `playlist_snapshot` (Json) -> Stores the validated song list used in the match.

## 5. Edge Cases & Handling

* **The "Troll" Pause:** A player pauses but doesn't answer.
    * **Solution:** Server-side hard timeout (10s). If no answer, apply penalty and auto-resume.
* **Latency Drift:** Player A pauses at 3.0s, Player B (lagging) receives pause at 3.5s.
    * **Solution:** Server timestamp is the authority. When resuming, Server sends `seekTo: 3.0s`. Player B's client jumps back 0.5s to sync.
* **Empty Search Results:**
    * **Solution:** If iTunes returns no preview for an AI-suggested song during the Generation phase, discard it and request a replacement before the game starts.
* **Disconnection:**
    * **Solution:** If the "Guesser" disconnects during the Lock phase, immediately resume the game for the remaining players.
