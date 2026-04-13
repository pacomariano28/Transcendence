# API Gateway

## Overview
The **API Gateway** serves as the single entry point for all client requests in Songuess. It routes traffic to appropriate internal microservices, enforces security policies, and optimizes performance.

---

## Core Responsibilities

* ### Request Routing
    * **REST API Proxy:** Routes incoming HTTP/REST requests to internal microservices (`Auth Service`, `Game Service`, and `Content Service`).
    *   **WebSocket Proxy:** Upgrades and routes real-time WebSocket connections directly to the `Game Service`.

* ### Security & Authentication
    *   **Token Validation:** Intercepts requests and validates authorization tokens with the `Auth Service` before forwarding to protected endpoints.
    *   **CORS Management:** Enforces Cross-Origin Resource Sharing rules to restrict access to authorized frontend clients.

* ### Traffic Management
    *   **Global Rate Limiting:** Implements IP-based request caps to prevent abuse and mitigate DDoS attacks.
    *   **Endpoint-Specific Throttling:** Applies stricter limits to high-cost routes (e.g., login attempts, complex search queries).

* ### Performance Optimization
    *   **Response Caching:** Uses an in-memory caching layer for frequent, identical search queries to the `Content Service`. This reduces redundant external Spotify API calls and minimizes latency.
    *   **Payload Parsing:** Standardizes incoming request bodies into JSON format before routing.

---

## Microservices Architecture Context
The Gateway manages traffic for the following internal services:

| Service | Responsibility |
| :--- | :--- |
| **Auth & User Service** | Manages Spotify OAuth 2.0 flow, user profiles, and token issuance. |
| **Game Service** | Maintains source of truth for active matches, timers, score calculation, and real-time WebSocket rooms. |
| **Content Service** | Orchestrates AI-driven playlist generation and interfaces with Spotify API for metadata and audio previews. |

---

## Core Dependencies
*   **Express.js**: Core framework.
*   **CORS**: Cross-origin request handling.
*   **express-rate-limit**: Traffic control.
*   **node-cache / redis**: In-memory caching mechanism.
*   **http-proxy-middleware / axios**: Request proxying to internal microservices.
