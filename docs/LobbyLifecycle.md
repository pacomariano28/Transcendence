# Lobby Lifecycle and Socket Contracts

## Scope

This document defines the canonical lobby lifecycle and the Socket.io contracts for pre-game flow.

## Canonical Phases

- `lobby`
- `countdown`
- `in-game`
- `finished`

## Identity and Auth

- The server derives `userId` from the authenticated session/JWT.
- Clients must not send `userId` in payloads; any `displayName` provided is treated as a hint and can be overridden by server profile data.

## Transition Rules

| From        | To          | Trigger                                                      | Reversible | Notes                                                  |
| ----------- | ----------- | ------------------------------------------------------------ | ---------- | ------------------------------------------------------ |
| `lobby`     | `countdown` | All players ready and expected count reached, or host starts | Yes        | Abort on readiness drop, player leave, or host cancel. |
| `countdown` | `lobby`     | Abort reason (ready drop, host cancel, timeout)              | N/A        | Must emit `match:countdown_aborted`.                   |
| `countdown` | `in-game`   | Countdown reaches 0                                          | No         | Game lifecycle takes over.                             |
| `in-game`   | `finished`  | Final round resolved or server ends match                    | No         | Do not revert to lobby.                                |
| `finished`  | `lobby`     | Rematch/reset                                                | No         | New `matchId`.                                         |

## Event Contracts

### Client -> Server

- `match:create`
  - Payload: `{ expectedPlayers, displayName? }`
  - Result: server joins socket to `matchId`, emits `match:created` and `match:state`.

- `match:join`
  - Payload: `{ matchId, displayName? }`
  - Result: server joins socket to room, emits `match:joined` and `match:state`.

- `match:ready`
  - Payload: `{}`
  - Result: marks player ready and emits updated `match:state`. If all ready, emits `match:countdown`.

- `match:countdown_abort`
  - Payload: `{ matchId, reason }`
  - Result: set phase to `lobby`, emit `match:countdown_aborted` and `match:state`.
  - `reason` enum: `HOST_CANCELLED | PLAYER_LEFT | READY_DROPPED | READY_TIMEOUT`.

### Server -> Client

- `match:created`
  - Payload: `MatchStatePayload`

- `match:joined`
  - Payload: `MatchStatePayload`

- `match:state`
  - Payload:
    ```json
    {
      "matchId": "ABC123",
      "expectedPlayers": 4,
      "phase": "lobby",
      "players": [
        {
          "userId": "u1",
          "displayName": "Ada",
          "ready": true,
          "connected": true,
          "disconnectedAt": null
        },
        {
          "userId": "u2",
          "displayName": "Max",
          "ready": false,
          "connected": false,
          "disconnectedAt": "2026-05-22T18:12:01Z"
        }
      ]
    }
    ```

- `match:countdown`
  - Payload: `{ matchId, seconds }`
  - Semantics: broadcast once to start countdown timer. UI counts down locally and expects server to confirm phase transition.

- `match:phase`
  - Payload: `{ matchId, phase, previousPhase, reason? }`
  - Semantics: authoritative phase transitions with optional reason for UI.

- `match:countdown_aborted`
  - Payload: `{ matchId, reason }`
  - Semantics: revert UI to lobby and clear countdown.

- `match:error`
  - Payload: `{ message }`
  - `message` codes: `MATCH_NOT_FOUND | PLAYER_NOT_IN_MATCH | MATCH_FULL | UNAUTHORIZED | INVALID_STATE | COUNTDOWN_ABORTED | UNKNOWN_ERROR`.

## Required Server Guards

- Reject `match:ready` if `phase` is not `lobby`.
- Reject `match:join` if `expectedPlayers` already reached.
- Reject `match:countdown_abort` unless the requester is host.

## Discovery Notes (Implementation Alignment)

- `MatchPhase` currently defines only `lobby | countdown`, but code sets `in-game`.
- `matchService.markReady` starts an internal countdown and emits `countdown` and `match-started`, but the socket handler ignores those emit callbacks and instead broadcasts `match:countdown` once.
- Countdown duration differs between services (3s in `matchService`, 5s in socket handler). Align on one value.
