# Requirement-to-deliverable checklist

Assignment source: all seven pages of `Intern_Task_Full_Stack_Developer.pdf`. This tracks implementation and submission, **not test results**. `[x]` means source/configuration exists; it does not claim deployed or device-verified behavior. User instructions defer tests and override the supporting plan's earlier testing/deployment gates.

| PDF page / requirement                                                          | Build status and deliverable                                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1 — full name/email/password registration, unique email, hashed password        | [x] `contracts`, API `auth.ts`, Prisma User, web/mobile auth forms; normalized email + DB uniqueness + bcrypt  |
| 1 — login, logout, persistent session until expiry, one account                 | [x] API JWT + AuthSession revocation; web `session.tsx`, mobile `session.tsx` + SecureStore                    |
| 1–2 — project create/read/edit/delete/list own                                  | [x] API `projects.ts`, web projects/detail/editor; Android project viewing                                     |
| 2 — project name, description, three statuses, dates, created date              | [x] Shared schemas, Prisma model/migration, API DTO, web forms/detail, mobile detail                           |
| 2 — task create/edit/delete/complete/view under project                         | [x] API `tasks.ts`, web TaskList/editor, mobile task-list/editor                                               |
| 2 — task name/description/three priorities/three statuses/due and created dates | [x] Shared schemas/enums, Prisma Task, explicit DTOs, both clients                                             |
| 2 — all five owner-scoped dashboard counts                                      | [x] API `dashboard.ts`, web overview, Android overview; Pending means Pending only                             |
| 3 — name search, project status, combined task status/priority/scope filters    | [x] Server query schemas + scoped services; client filters and pagination                                      |
| 3 — Android uses same backend/database, refresh synchronization                 | [x] One configurable REST URL; pull-to-refresh + query invalidation; cross-platform runtime evidence pending   |
| 3 — Android secure token, expired session, no network states                    | [x] SecureStore only, central 401/expiry handler, visible retry/offline states, mounted drafts preserved       |
| 3–4 — responsive React web, structure/forms/loading/errors/UX                   | [x] React Router, feature components, RHF/Zod, Tailwind/shadcn patterns, responsive cards and state components |
| 4 — native navigation/forms/loading/pull-to-refresh/phone UX                    | [x] Expo Router tabs/stacks, native controls, safe areas, accessible labels                                    |
| 4 — Nest REST/middleware/routes/error/logging/CORS                              | [x] API controllers/services, guards, request IDs, redacted JSON logs, exception filter, allowlisted origins   |
| 4 — normalized PostgreSQL/foreign keys                                          | [x] Prisma schema + versioned SQL migration + ER diagram                                                       |
| 5 — bcrypt/JWT/auth/protected endpoints                                         | [x] Signature/issuer/audience/expiry + active-session guard; per-session logout revocation                     |
| 5 — owner-only reads/edits/deletes, both platforms                              | [x] Atomic owner predicates, serializable task destination ownership; inaccessible IDs → 404                   |
| 5 — every backend request validated, nonempty/email/date/enum errors            | [x] Strict Zod pipes for body/query/UUID; request-shape guard; 32 KB limit                                     |
| 5 — sensitive responses and SQL injection protection                            | [x] Explicit DTOs, parameterized Prisma, no body/token logging                                                 |
| 5 — authentication rate limiting                                                | [x] 20 attempts/15 minutes/IP; documented single-replica constraint and trusted proxy config                   |
| 6 — all required auth/project/task/dashboard routes                             | [x] See `docs/api.md`, interactive Swagger and OpenAPI JSON                                                    |
| 6 — setup/environment/database/API/deployed-mobile documentation                | [x] README, `.env.*.example`, migrations/seed, API and deployment notes                                        |
| 6–7 — public GitHub repository                                                  | [ ] External publication deferred; local Git history/lockfile prepared                                         |
| 7 — schema / ER diagram                                                         | [x] `docs/er-diagram.md`                                                                                       |
| 7 — API documentation                                                           | [x] `docs/api.md`; `/api/docs`, `/api/openapi.json` generated by API                                           |
| 7 — README                                                                      | [x] Root README                                                                                                |
| 7 — web and backend deployment URLs                                             | [ ] Hosting not authorized; local Docker/Vercel/env configuration prepared                                     |
| 7 — installable Android APK / distribution link                                 | [ ] SDK-matched source and APK EAS profiles prepared; native APK build/signing/distribution pending            |
| 7 — five-minute recording demonstrating same-account synchronization            | [ ] Script in `docs/demo-script.md`; recording after later runtime verification                                |
| 7 — synthetic data only, explainable code                                       | [x] Opt-in synthetic seed; architectural/security decisions documented                                         |

Additional engineering improvements: [x] shared typed/Zod contracts; [x] server revocation + per-user cache clearing; [x] accessible web/native navigation/states; [x] local/staging/production configuration + health; [x] this traceability file.

Optional: [x] Docker configuration, bounded pagination, build-only CI configuration; [ ] custom sorting, audit logs, RBAC, refresh tokens, push notifications, durable offline viewing, iOS acceptance. None delays required behavior. Automated tests were not authored or executed.

Unfinished required delivery work: native APK compilation/signing and device acceptance; later functional/security/accessibility/cross-platform verification; authorized public repository/deployment/distribution; final recording. Figma remains annotated wireframes; richer high-fidelity design review is unfinished. Build evidence and current environment limits are recorded in `docs/build-status.md`.
