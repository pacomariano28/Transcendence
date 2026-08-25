# Songuess

Real-time multiplayer music trivia with a Stop & Solve mechanic.

songuess is a microservice-based project that pairs a React frontend with
Node/Express services for auth, content search, and playlist generation.
The repo is optimized for local development via Docker Compose and Nginx
with TLS for the Spotify callback.

## Highlights (current implementation)

- Spotify OAuth login flow and profile endpoints.
- API Gateway with request routing, rate limiting, and request IDs.
- Content service that searches the Spotify API and caches tokens in Redis.
- Playlist service that serves randomized preview tracks from Postgres via Prisma.
- React + Vite frontend with login, room create/join UI, and profile screens.
- Dockerized dev environment with Nginx reverse proxy and HTTPS.

## Architecture

- Nginx: TLS termination and reverse proxy for the frontend and /api.
- API Gateway: single entry point for REST calls and auth checks.
- Auth Service: credentials auth plus Spotify OAuth.
- Content Service: Spotify search with Redis token caching.
- Playlist Service: random playlist generation backed by Postgres.
- Game Service: scaffolded (real-time loop integration in progress).

## Tech stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Data: Postgres, Prisma, Redis
- Infra: Nginx, Docker Compose

## Local development

Prerequisites:

- Docker and Docker Compose
- GNU Make

Setup:

1. Copy env templates and fill values:
   - srcs/backend/api-gateway/.env.example -> .env
   - srcs/backend/auth-service/.env.example -> .env
   - srcs/backend/content-service/.env.example -> .env
   - srcs/backend/playlist-service/.env.example -> .env
2. Add Spotify credentials:
   - SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
   - SPOTIFY_REDIRECT_URI = https://127.0.0.1:8443/api/auth/spotify/callback
3. If you need HTTPS locally for Spotify, generate certs for Nginx:
   - bash infra/scripts/certs.sh
4. Start the stack:
   - make up
   - playlist-service downloads the built-in Classic Mix in the background
     on first start (Spotify metadata via content-service, clips via the
     same worker used for lobby playlists). Rounds can start once
     `/available-count` reports at least 5 ready songs.

Access:

- https://127.0.0.1:8443 (Nginx)
- http://localhost:5173 (frontend dev server)
- http://localhost:4000 (API gateway)

Common commands:

- make up: start the stack
- make down: stop the stack and prune volumes
- make logs: tail all service logs
- make frontend/api-gateway/auth/content/playlist: rebuild a service
- make postgres or make redis: recreate those containers and volumes (destructive)

## Environment variables (per service)

- API Gateway: srcs/backend/api-gateway/.env
  - CLIENT_ID, CLIENT_SECRET (Spotify)
  - CONTENT_SERVICE_URL, AUTH_SERVICE_URL, PLAYLIST_SERVICE_URL
  - REDIS_URL and rate limit settings
- Auth Service: srcs/backend/auth-service/.env
  - DATABASE_URL, JWT_SECRET
  - SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
- Content Service: srcs/backend/content-service/.env
  - CLIENT_ID, CLIENT_SECRET (Spotify)
  - GEMINI_API_KEY (optional, future use)
  - REDIS_URL
- Playlist Service: srcs/backend/playlist-service/.env
  - DATABASE_URL, CONTENT_SERVICE_URL
  - DEFAULT_SPOTIFY_PLAYLIST_ID (built-in Classic Mix source playlist)
- Frontend: srcs/frontend/.env (optional, currently empty)

## Ports

- 8443 -> Nginx HTTPS
- 5173 -> Frontend dev server
- 4000 -> API Gateway
- 4002 -> Auth Service
- 4003 -> Content Service
- 4004 -> Playlist Service
- 5432 -> Postgres
- 16379 -> Redis (host) -> 6379 (container)

## Data and persistence

- Postgres stores auth data and playlist metadata (Prisma).
- Redis caches Spotify access tokens and can be reused for other caching.
