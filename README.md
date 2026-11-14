# AgriX

AgriX is organized as a single-repository workspace for developing its web UI and hosting the app from the same repository later.

## Workspace map

- `apps/web/` — the web application, when implementation begins.
- `packages/ui/` — shared UI components and design primitives, if they become useful.
- `docs/` — project, architecture, and development notes.
- `infrastructure/` — deployment and hosting configuration when a hosting target is selected.
- `References/` — project reference material.

The web workspace is framework-neutral. The Darija voice prototype has its own local Python runtime.

## Darija voice assistant

- [GPU setup, benchmarking, and fine-tuning](docs/voice-gpu.md)
- [Local voice assistant setup](VOICE_AI_README.md)
- [Voice AI evaluation report](VOICE_AI_REPORT.md)

## Getting started

Choose and document the web stack before adding its package manifest and implementation. Keep application-specific code in `apps/web/`; move code into `packages/` only when it is shared by more than one part of the repository.

## Hosting

Hosting configuration belongs in `infrastructure/` or in the hosting platform's root-level configuration when required. Keep deployment settings and secrets out of source control; use the platform's secret store for credentials.
