---
name: Monorepo server dependencies
description: Where backend-only npm dependencies must be declared and verified in this monorepo
---

Backend-only npm packages belong in `server/package.json` and `server/package-lock.json`. The workspace package-management helper installs from the repository root, so a package can appear installed locally without being declared for the backend deployment.

**Why:** The backend workflow and deployment install from `server/`; a root-only dependency is not part of the server's reproducible install.

**How to apply:** Add the dependency to the server manifest, regenerate the server lockfile, and verify with `npm ls --prefix server --depth=0` before committing.