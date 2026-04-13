# Development Standards

This document defines coding standards for this repository to keep the codebase consistent, readable, and easy to maintain.

## 1) Formatting (mandatory)
- Use **Prettier** for code formatting. Do not hand-format.
- Use **ESLint** for linting. Fix warnings before merging.


## 2) Naming conventions
- Files/folders: `camelCase` or `kebab-case` (pick one repo-wide; default: `camelCase` for TS files, `kebab-case` for folders).
- Functions and variables: `camelCase`
- Types and classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE` only for true constants (e.g. configuration defaults), otherwise `camelCase`.
- Route handlers:
  - Prefer explicit names when extracted: `handleLogin`, `handleRefresh`, etc.

## 3) Project structure
- Prefer separation by **feature/domain**, not by technical layers only.
- Typical example:
  - `src/routes/` → HTTP routing only (validation, calling services)
  - `src/middlewares/` → Express middlewares
  - `src/lib/` → small reusable utilities (pure functions)
  - `src/services/` → domain logic (no Express objects)
  - `src/repositories/` → data access layer (DB/Redis/etc.)

### Keep responsibilities clear
- Routes should not contain complex business logic.
- Libraries should not import Express.
- Services should not know about HTTP (Request/Response).

## 4) Comments & documentation (best practices)

### 4.1 When to comment
Write comments to explain:
- **Why** something is done (trade-offs, constraints, security reasons)
- Non-obvious behavior (edge cases, gotchas)
- Business rules (invariants)

Avoid comments that restate the code:
- Bad: `// increment i by 1`
- Good: `// We increment to skip the header line (line 0)`

### 4.2 Where to comment
Use comments in this order of preference:
1. Function/module docblocks (public/important APIs)
2. Short inline comments for tricky lines
3. Block comments above a section (when multiple lines need context)

Do not comment every line. Prefer clear naming and small functions.

### 4.3 Docblock standard (TSDoc/JSDoc style)
For exported functions, public APIs, security-sensitive logic, or anything that can be misused, use this format:

```ts
/**
 * @brief One-line summary in imperative mood (e.g. "Issues a refresh token for a user.")
 *
 * @description
 * Explain what the function does and WHY it exists.
 * Include security notes or invariants when relevant.
 *
 * @param userId - User identifier.
 * @returns The issued token data.
 * @throws Error("...") When input is invalid or operation fails.
 *
 * @example
 * const { refreshToken } = issueRefreshToken("user-123");
 */
```

Guidelines:
- `@brief` must fit on one line.
- `@description` can be multiple lines and should explain intent and constraints.
- `@throws` is required when the function throws (prefer stable error codes/messages).
- Add `@example` when the call site is not obvious.

### 4.4 Error codes/messages (recommended)
If a function is expected to throw and the caller branches on it, throw **stable error codes** (string messages or custom error classes).
Example:
- `EXPIRED_REFRESH_TOKEN`
- `INVALID_REFRESH_TOKEN`

Document them in `@throws`:
- `@throws Error("EXPIRED_REFRESH_TOKEN") if the token is expired.`
- `@throws Error("INVALID_REFRESH_TOKEN") if the token is unknown.`

## 5) TypeScript rules
- Avoid `any`. Prefer `unknown` and narrow it.
- Prefer `type` for simple structures and `interface` for public contracts that may be extended.
- Keep types close to where they’re used unless shared across features.
- Always type Express imports as `type` imports when only used for typing:
  - `import type { Request, Response } from "express";`

## 6) Security & auth (baseline rules)
- Access tokens must be short-lived.
- Refresh tokens must be treated as secrets:
  - Never log refresh tokens in production.
  - Prefer rotating refresh tokens (one-time use).
  - Store only hashes in DB (future improvement).
- Never generate tokens in business endpoints (`/me`). Use dedicated auth endpoints.

## 7) Testing & PR hygiene
- Add/adjust tests for:
  - bug fixes
  - auth flows
  - error handling
- PRs must be small and focused.
- Every PR should include:
  - what changed
  - why it changed
  - how to test


---
If you want to propose a change to these standards, open a PR and explain the trade-off.