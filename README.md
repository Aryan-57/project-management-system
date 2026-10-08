# Still · Project workspace

A calm web and Android project-management app with **one NestJS REST API, PostgreSQL database and set of user accounts**. Web project/task CRUD, native Android task CRUD, search/combined filters, user dashboard and revocable JWT sessions are implemented in source. Android uses SecureStore; browser auth uses HttpOnly cookies + CSRF. No client uses a separate data store for required operations.

This is the **implementation phase**. Automated tests and browser/device acceptance were explicitly deferred. APK signing/build, public hosting, distribution and recording remain unfinished; see [build status](docs/build-status.md) and [requirements](docs/requirements.md). No external service was published.

## Prerequisites

Node 22.13+ (22.x), pnpm 11.18.0, Git, PostgreSQL 17 or Docker Desktop. For Android device builds: Android Studio, Android SDK/platform tools and compatible JDK; Expo Go may be used only if its installed version supports SDK 56. A distributed APK is still required for submission. If pnpm is unavailable, install `pnpm@11.18.0` with your chosen Node package-manager setup.

```sh
pnpm install --frozen-lockfile
pnpm --filter @still/contracts build
pnpm --filter @still/design-tokens build
pnpm db:generate
```

The lockfile is part of source control. Prisma generates `apps/api/src/generated/prisma`; generated code/build outputs are ignored. Native package versions come from Expo SDK 56's compatibility matrix. Backend configuration is validated only on API startup; code generation/builds need no live DB or secret.

## Local configuration

Run `pnpm setup:local` to create ignored local environment files with random database, JWT and synthetic demo credentials. Existing files are preserved; secrets are never printed. The mobile default targets the Android emulator. Alternatively, copy each `.env.example` to `.env` beside it and replace every placeholder before starting. Never commit actual environment files.

| Variable            | Scope / purpose                                                                     |
| ------------------- | ----------------------------------------------------------------------------------- |
| POSTGRES_PASSWORD   | Root Docker development DB password; match API DATABASE_URL                         |
| DATABASE_URL        | API PostgreSQL URL; use environment-specific DB and TLS in deployment               |
| JWT_SECRET          | API-only random signing secret, at least 32 chars; placeholder values rejected      |
| NODE_ENV            | API `development`, `staging` or `production`; Secure cookie outside development     |
| PORT                | API listen port, default 3001                                                       |
| WEB_ORIGINS         | Comma-separated exact origins, local `http://localhost:5173`; no paths or wildcards |
| SESSION_HOURS       | Session expiry, default 168; 1–720                                                  |
| TRUST_PROXY_HOPS    | Trusted reverse-proxy hop count; default 0; match your actual topology              |
| COOKIE_SAME_SITE    | `lax` default, `strict`, or `none`; none requires HTTPS                             |
| DEMO_PASSWORD       | Synthetic seed password only; choose locally, 8–72 UTF-8 bytes                      |
| VITE_API_URL        | Public web API base including `/api`; local `/api` uses Vite proxy                  |
| EXPO_PUBLIC_API_URL | Public Android API base including `/api`; injected at bundle build time             |
| APP_ENV             | Mobile development/staging/production; release URL and cleartext policy             |

Environment templates for local/staging/production are beside each app. Web/mobile public prefixes must never contain secrets. Nest and Prisma use `apps/api/.env`; run their commands through the workspace filters so cwd is correct.

## Database and synthetic data

```sh
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

Migrations are versioned SQL generated from the Prisma schema. `db:migrate` runs `prisma migrate deploy`; for future schema edits use Prisma's development migration workflow and commit the resulting migration. Never reset/drop a database to upgrade it. If using an existing local PostgreSQL instance, create the database/user yourself and set DATABASE_URL instead of starting Docker.

Seed requires NODE_ENV=development and DEMO_PASSWORD in the API environment. It creates only synthetic `alex@example.test` / Alex Morgan, a Website refresh project and three tasks across priorities/statuses. Use your local DEMO_PASSWORD to sign in; reruns use upserts and do not overwrite edits/passwords. You may also register your own synthetic account on either platform. One account's data is isolated from every other account.

## Start the apps

In separate terminals at repository root:

```sh
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

Open `http://localhost:5173`. The web dev proxy sends `/api` to Nest at `http://127.0.0.1:3001`; keep WEB_ORIGINS aligned with the origin actually opened. Swagger is `http://localhost:3001/api/docs`; OpenAPI JSON is `/api/openapi.json`; readiness is `/api/health`. Backend needs a migrated reachable DB and valid API `.env` to start.

The Android emulator reaches the Windows host with `EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api`. A physical phone needs a reachable LAN address or USB `adb reverse`; see [deployment/mobile networking](docs/deployment.md). Restart Expo when public env values change. `pnpm --filter @still/mobile android` creates the native project/build and requires the Android toolchain. Project creation/edit/deletion is available on web; Android project viewing and full task CRUD satisfy the required mobile scope.

Login is persisted by the backend cookie on web and Expo SecureStore on Android. Logout revokes only the current device's server session, clears its credentials and user query cache. On expiry both clients show an explicit sign-in message. Offline/recoverable errors keep open drafts and offer retry; signing out while offline requires reconnecting so the server session can actually be revoked.

## Build commands (no tests)

```sh
pnpm build
pnpm typecheck
pnpm peers check
pnpm --filter @still/mobile export:android
```

`pnpm build` emits shared package declarations, `apps/api/dist` and `apps/web/dist`. Android export emits a JS/assets bundle, **not an installable APK**. EAS preview/production profiles produce APKs after Expo account/signing setup and an actual deployed HTTPS API URL; no remote build was submitted. See [deployment](docs/deployment.md). Build-only CI is prepared and has no test or deployment step. No test scripts/suites were added.

After editing shared source, rebuild the shared packages before restarting API/web. Expo resolves their native TypeScript entry directly. Web pages are split by route; UI primitives live in `components/ui` with shadcn configuration.

## Architecture, design and handoff

- [Architecture/security decisions](docs/architecture.md)
- [API contracts, auth transports, errors](docs/api.md)
- [Mermaid ER diagram](docs/er-diagram.md)
- [Design specification and Figma reference](docs/design.md)
- [Requirements and submission checklist](docs/requirements.md)
- [Local/staging/production and APK instructions](docs/deployment.md)
- [Build evidence and unfinished work](docs/build-status.md)
- [Five-minute demo recording script](docs/demo-script.md)

The assignment PDF is the behavior/submission source of truth; IMPLEMENTATION_PLAN.md supports coverage. Its earlier testing/deployment gates are superseded in this phase by the explicit instruction to focus on implementation and defer tests/publication. Single-replica API rate limiting, last-successful-write updates, no durable offline edits, annotated wireframes and pending actual APK/acceptance are documented limitations.
