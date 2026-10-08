# Antigravity prompts: build the Project Management System

Use the **Master Prompt** once to establish the project rules and architecture. Then give Antigravity the stage prompts **one at a time and in order**. These prompts intentionally focus on building; defer test writing and test runs until the build is in place and the user asks to begin testing.

## Master Prompt

```text
Act as the lead product engineer building the project in this workspace. Implement the Project Management System described in `Intern_Task_Full_Stack_Developer.pdf`. Read the full PDF and inspect the repository before changing anything. The repository currently may contain only the assignment and planning documents. Treat the PDF as the source of truth for required behavior and deliverables. `IMPLEMENTATION_PLAN.md` is the supporting implementation and coverage plan.

## Goal
Build a polished, responsive web app and an Android app backed by the SAME REST API, PostgreSQL database, and user accounts. A user must be able to log in on either platform and see the same projects and tasks after refreshing. Android is required; iOS is optional. Work on implementation first. Do not write or run automated tests, test suites, or a testing phase yet. Keep the architecture easy to test later and keep a concise list of unfinished requirements, but focus this work on product code, UI, docs, and build configuration.

## Stack decisions
- TypeScript pnpm monorepo with `apps/web`, `apps/mobile`, `apps/api`, and shared packages such as `packages/contracts` and `packages/design-tokens`.
- Web: React + Vite + React Router + Tailwind CSS + shadcn/ui. Build responsive, accessible screens; shadcn/ui is for web only.
- Mobile: React Native + Expo + Expo Router. Use native mobile controls and navigation; share contracts/design tokens, not web DOM components.
- API: NestJS REST API. This single backend serves both clients.
- Database: PostgreSQL with Prisma ORM and versioned migrations.
- Data fetching: TanStack Query. Forms: React Hook Form and Zod schemas. Put shared request/response types, enums and suitable Zod schemas in the shared contracts package; validate requests again on the API.
- Documentation: OpenAPI/Swagger, README, architecture notes and Mermaid ER diagram.
- Use supported compatible package versions, check current official docs, and commit the package manager lockfile. Do not guess obsolete commands or APIs.

## Use tools where they help
- Figma + Figma MCP: first create/review web dashboard, projects, project detail/task list, forms, and Android screen designs. Include loading, empty, validation, error, offline, and expired-session states plus responsive behavior. Use Figma's required skills/workflow for any Figma MCP actions. If access to a design file is missing, proceed with an implementation-ready design system in the repo and report the exact limitation.
- Context7: while implementing, retrieve current docs/examples for the actual selected versions of React/Vite, shadcn/ui/Tailwind, NestJS, Prisma and Expo. Prefer official library sources for behavior and verify snippets against installed versions.
- Expo MCP: use for Expo-specific docs, compatible package guidance, build workflow information, and supported local app inspection. Authenticate/setup only if available in this environment. Do not assume it can automate Android on this machine; use the actual available device workflow and report any unavailable capability.
- GitHub and Vercel integrations: use only when connected and relevant to source hosting/deploy configuration. Do not publish, deploy, or create public services without explicit authorization. Prepare repository/deployment configuration locally first.
- Playwright MCP and regular Playwright project tests belong to the later verification phase; defer them now. Do not add a Playwright MCP as a substitute for repeatable tests.
- Codex Security is optional; reserve a repository/diff scan for the later security review after implementation exists.
- Consult the available Vercel backend, environment-variable and deployment skills when those decisions/configuration become active; consult the React best-practices skill after multiple TSX components exist. Apply the Expo and Figma workflows when their tools are actually called.

## Required behavior from the assignment
Authentication on both clients: register, login, logout, and current-user session. User fields are full name, unique email and password. Hash passwords with bcrypt or equivalent; never store/return plaintext. Persist sessions until logout or expiry. Implement `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.

Projects: users can create, read, edit, delete and list their own projects. Fields: name, description, status (`Not Started`, `In Progress`, `Completed`), start date, end date and server-created date. Implement `GET /api/projects`, `GET /api/projects/{id}`, `POST /api/projects`, `PUT /api/projects/{id}`, `DELETE /api/projects/{id}`.

Tasks belong to projects. Users can create, read, edit, delete, complete, and view tasks under projects. Fields: name, description, priority (`Low`, `Medium`, `High`), status (`Pending`, `In Progress`, `Completed`), due date and server-created date. Implement `GET /api/tasks`, `GET /api/tasks/{id}`, `POST /api/tasks`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`. Let task updates change completion/status/priority.

Dashboard: `GET /api/dashboard` returns user-scoped total projects, total tasks, completed tasks, pending tasks, and projects in progress. Define pending as status `Pending`; counts refresh after mutations.

Search/filter: search projects and tasks by name; filter projects by status and tasks by status and priority. Support combining task search/filter and project scope. Add bounded pagination if it fits cleanly, without delaying required behavior.

Mobile: Android registration/login/logout with the same account; dashboard; view projects and tasks; create/edit/delete tasks; complete/change task status and priority; search/filter tasks; pull-to-refresh. Mobile project editing is optional; project viewing is required. A mobile change must be visible on web after refresh and vice versa. Store mobile JWT in Expo SecureStore, never plain local storage/AsyncStorage. On expiry, clear session/cache and return to login with an explicit message. On network loss, show a retryable clear message and preserve drafts; never show a blank screen or crash.

## Security and correctness rules
- Enforce authentication and ownership on every protected endpoint. Users must only read/change/delete their projects and tasks. Derive task ownership through its project; never trust a client-supplied owner ID. Apply owner-scoped filters to lists, search and dashboard, and enforce ownership atomically with writes. Return 404 for inaccessible IDs to avoid confirming another user's data exists.
- Use JWT authentication and middleware/guards; logout must revoke the server-side session so the previous token no longer works. Validate signature, expiration and active session.
- Web session: use a Secure, HttpOnly cookie in deployed environments; do not put JWTs in browser localStorage. Add CSRF protection for cookie-authenticated mutations and configure credentialed CORS only for explicit trusted web origins. Mobile uses Bearer JWT from SecureStore against the same auth/session backend.
- Validate every API path, query and body on the server: required and non-empty fields, email format, real dates, date ordering, allowed enums, lengths and body size. Share schemas when practical, but never treat client validation as security.
- Use Prisma/parameterized ORM calls. Do not interpolate user input into SQL. Use explicit response DTOs; never return password hashes, secrets or sensitive session material. Redact credentials/tokens in logs.
- Add authentication rate limits, safe configuration/secret validation, structured request logging, consistent error responses and clear frontend error states. Configure trusted proxy handling correctly if rate limiting by client IP behind a host.
- Use synthetic demo data only. Never commit secrets or real personal data. Keep `.env.example` placeholders only; ignore actual `.env` files.

## UX and implementation quality
Create a calm productivity visual system with clear type hierarchy, consistent spacing, restrained color, and text labels alongside status/priority colors. Design desktop sidebar navigation and compact mobile navigation; on narrow web screens turn dense tables into readable cards. Required web screens: auth, dashboard, projects list, project detail with tasks, project create/edit and task create/edit. Required Android screens: auth, dashboard, project list/detail, task list/editor, and account/logout.

Provide loading, empty, no-results, validation, success, recoverable server/network error, offline and session-expired states. Keep drafts on recoverable errors; disable duplicate submits; confirm destructive project deletion and explain that its tasks are deleted. Support keyboard/focus, accessible labels, screen readers, contrast, text scaling, safe areas and touch targets. Keep API base URLs configurable for local and deployed use; do not hardcode localhost into a release build.

## Five additional engineering improvements to include
1. Shared typed contracts and enums across clients/API, with API-side validation as the authority.
2. Safe server-side session revocation and per-user cache clearing on logout or expiry.
3. Accessible UI states and navigation as first-class requirements, including Android screen-reader labels.
4. Clear deployment configuration separation: local/staging/production environment examples, health endpoint, and no secrets in source.
5. A requirement-to-deliverable checklist in `docs/requirements.md` so no PDF submission item is forgotten. This is a build tracking artifact, not a request to start testing now.

## Delivery workflow
Build in these stages and keep each stage reviewable:
1. Inspect repo/PDF, create architecture/design decisions and traceability checklist; establish Figma designs and workspace structure.
2. Create monorepo foundation, shared packages, env templates, PostgreSQL/Prisma schema+migrations, API modules and app shells.
3. Complete backend auth, projects, tasks, dashboard, validation, ownership, API docs and logging.
4. Complete web UI against the API.
5. Complete Android UI/session handling against the same API and produce a buildable APK configuration.
6. Finish README, ER diagram, API docs, synthetic seed instructions, deployed-backend mobile configuration, and submission checklist.

At each stage, inspect the actual code and current requirements, implement the stage rather than only describing it, and summarize changed files, decisions and remaining blockers. Do not claim features/builds/deployments that are not present. Keep this phase build-focused: no tests/test suite execution until explicitly requested. Do not deploy or publish externally without permission.
```

## Stage prompts

Paste one after the previous stage is implemented and reviewed. Keep the Master Prompt in the conversation so its requirements remain active.

### Stage 1 — Foundation and product design

```text
Implement Stage 1 from the Master Prompt. Read the full assignment PDF and current plan. Create the pnpm TypeScript monorepo structure for apps/web, apps/mobile, apps/api and packages/contracts/design-tokens. Use Figma MCP to create or update a design file for the desktop dashboard, responsive projects list/detail, task creation/edit, and Android login/dashboard/project/task screens. Include loading, empty, validation, offline and expired-session states. Follow the relevant Figma skill before using Figma MCP. Establish accessible visual tokens and an implementation-ready component inventory. Add docs/architecture.md and docs/requirements.md mapping every mandatory PDF condition to its future screen/API/deliverable. Set package versions based on current docs through Context7 where available. Do not implement tests or run tests. Do not deploy. Finish with the repository structure, design reference/link if available, and any access blocker.
```

### Stage 2 — Backend and database

```text
Implement Stage 2 from the Master Prompt: complete the NestJS API and PostgreSQL/Prisma data layer. Build user, auth-session, project and task schema/migrations; normalize email; add foreign keys, uniqueness, indexes and project-to-task cascade. Implement the exact required routes and OpenAPI docs. Add JWT auth with revocable server sessions, bcrypt hashing, authentication rate limiting, request validation, consistent exceptions, structured redacted logging, explicit DTOs, CORS allowlist, health endpoint, and strict owner scoping for every project/task/dashboard read and write. Support combined project/task search and filters. Keep dashboard definitions documented. Use Context7/current official docs for installed NestJS/Prisma versions. No tests or test runs yet. Do not deploy. Finish with endpoint inventory, migration/startup instructions, env names, and remaining blockers.
```

### Stage 3 — Web application

```text
Implement Stage 3 from the Master Prompt: build the complete React + Vite web application using Tailwind CSS and shadcn/ui, React Router, TanStack Query, React Hook Form and the shared Zod contracts. Use the Figma screens as the design source. Implement register/login/logout, session restore, dashboard, project CRUD, project details/task lists, task CRUD/status/priority, project/task search and filters. Use secure HttpOnly cookie session handling through the same NestJS backend, with CSRF protection as needed; never store auth tokens in localStorage. Implement responsive layouts, accessible field errors, loading/empty/no-results/error states, destructive confirmations, cache refresh after changes, and explicit offline/network handling. Configure API URL per environment. No tests or test runs yet. Do not deploy. Finish with the main user journeys implemented and the files/configuration needed to run the web app.
```

### Stage 4 — Android application

```text
Implement Stage 4 from the Master Prompt: build the Android app using React Native, Expo and Expo Router. Use Figma screens and shared contracts/design tokens. Use Expo MCP for current Expo docs and compatible dependency guidance if connected; use Expo SecureStore for the JWT. Implement registration/login/logout, session restoration, dashboard, projects and their tasks, task create/edit/delete/complete, status/priority changes, search and combined filters. Add pull-to-refresh and make every API call use the same configurable NestJS backend as web. On HTTP 401/expired token, clear SecureStore and per-user cached state, show a clear expiry message, and navigate to login. Handle no network/API errors visibly with retry and preserved drafts, not a blank/crash. Implement loading/empty/validation states, phone-friendly navigation, safe areas, keyboard behavior and screen-reader labels. Configure an installable Android APK build profile with the deployed API URL injected by environment, not hardcoded localhost. No tests or test runs yet. Do not deploy. Finish with run/build commands and device setup requirements.
```

### Stage 5 — Documentation and build handoff

```text
Implement Stage 5 from the Master Prompt. Complete a reviewer-friendly README for a fresh clone: prerequisites, pnpm setup, backend/web/mobile commands, environment variables, PostgreSQL creation, Prisma migration and synthetic seed, API docs, Android emulator/device networking, and how to point the APK at a deployed backend. Add the Mermaid ER diagram and ensure it matches the actual schema, publish the required endpoint/auth/error documentation, and complete docs/requirements.md against the original PDF. Add local/staging/production env examples with placeholders and ensure secrets are ignored. Prepare (but do not execute) deployment configuration for the web app and API, and APK distribution/build instructions. Do not create external infrastructure, publish a repository, deploy, write tests or run tests. Report completed build artifacts, commands needed, and anything still blocked by account/device access.
```

### Later prompt — begin verification only when ready

```text
The build phase is complete. Now begin verification against the acceptance plan in IMPLEMENTATION_PLAN.md and the requirements checklist. First inspect the implementation and identify the most important gaps; then add and run focused API/security, web, Android, and cross-platform checks. Prioritize ownership isolation, revocable/expired sessions, SecureStore, offline recovery, and web↔Android synchronization. Fix failures and report evidence per requirement. Do not deploy or publish without authorization.
```
