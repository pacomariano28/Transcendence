# auth-service

## What it is

Service responsible for authentication and minimal user management for the project.

## Responsibilities

**It does:**

- User registration (create account)
- Login (issue JWT)
- JWT validation/decoding (and later, role-based authorization)
- Minimal user management required for auth (email/username, password hash, status, roles)

**It does NOT do (for now):**

- Advanced user profile settings _(possible future `user-service`)_
- Game/content business logic

## Endpoints (draft)

- `GET /health` → healthcheck
- `POST /register` → create user
- `POST /login` → obtain JWT
- `GET /me` → basic data for the authenticated user

> Note: the API Gateway decides the public prefix (for example `/api/auth/*`). Internally, this service keeps “clean” routes.

## Authentication

- JWT via header: `Authorization: Bearer <token>`
- No cookies in the first iteration.

## Environment variables (draft)

- `PORT` (default: 4002)
- `DATABASE_URL` (Postgres)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional)
- `BCRYPT_ROUNDS` (optional)

## Development

- Run via Docker Compose (see `srcs/compose.yaml` and `srcs/compose.dev.yaml`).
- In dev, the API Gateway should call `http://auth-service:4002`.

## Notes

- Personal notes and decisions live in `NOTES.md`.
