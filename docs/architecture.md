# Repository architecture

This repository keeps the web app and its future hosting setup together while leaving room for shared code if the project needs it.

## Boundaries

### `apps/web/`

Owns the browser application. Once a framework is chosen, keep routes or pages, feature-specific code, shared app components, assets, styles, and browser utilities under this directory. Avoid putting product features at the repository root.

### `packages/ui/`

Reserved for UI components, tokens, and utilities that are intentionally shared. Start with app-local components; extract them here only when a real second consumer exists.

### `docs/`

Stores design and implementation decisions, setup instructions, and operational notes.

### `infrastructure/`

Reserved for hosting and deployment configuration. Add platform-specific files after the hosting target and build process are selected.

## Suggested web source areas

The `apps/web/src/` directory can be organized into `assets/`, `components/`, `features/`, `layouts/`, `lib/`, `pages/`, and `styles/` as the chosen framework and app needs require. This is a guide, not a requirement to create empty directories or adopt a particular framework.

## Decisions to make before implementation

- Select the web framework and package manager.
- Define local development and production build commands.
- Select the hosting platform and document its required build and environment settings.
