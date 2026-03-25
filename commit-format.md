# Commit message rules

We follow a simple, consistent commit title format (inspired by Conventional Commits).

## Format
**Title (required):**
```
<Type>(<scope>): <short imperative description>
```
- `(<scope>)` is optional (e.g., `api`, `ui`, `auth`, `db`, `docs`, `ci`).
- Keep the title concise (recommended: ≤ 72 chars).
- Use **imperative** wording: “add”, “fix”, “remove”, “update”… (no trailing period).

## Allowed Types
- **Feature**: new functionality
- **Fix**: bug fix
- **Setup**: project setup / template / initial structure
- **Docs**: documentation only
- **Refactor**: code change that doesn’t change behavior
- **Test**: add/update tests
- **Chore**: maintenance tasks (tooling, scripts, minor housekeeping)
- **Perf**: performance improvement
- **CI**: CI/pipeline changes
- **Build**: build system changes
- **Revert**: revert a previous commit

## Examples
- `Feature: add matchmaking queue`
- `Fix(auth): handle expired token`
- `Docs: update installation steps`
- `Refactor(api): simplify session creation`
- `CI: cache dependencies`

## Breaking changes
If a change is backwards-incompatible, add in the body:

BREAKING CHANGE: <what changed and why>

```
Feature(api): change /login response format
- BREAKING CHANGE: `/login` now returns `{ data: { token: string } }` instead of `{ token: string }`. Update all clients that read `token` from the root.
```
