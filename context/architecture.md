# Architecture

Architecture style:
Modular Monolith.

Layers:
- Core Platform
- Business Modules
- Provider Adapter Layer

Rules:
- Modules communicate through contracts/events.
- External providers are isolated.
