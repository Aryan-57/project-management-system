# REST API

Base URL: `http://localhost:3001/api` in local development; deployed clients inject `https://API_HOST/api`. Interactive documentation: `/api/docs`. Machine-readable OpenAPI: `/api/openapi.json`. Health/readiness: `GET /api/health`, which checks database connectivity.

## Authentication transports

Browser requests use `credentials: include` and an HttpOnly session cookie. Deployed cookies are Secure and use the configured SameSite setting. Browser registration/login must include a trusted Origin (the browser supplies it). Both return `{user, expiresAt, csrfToken}` with no JWT in JSON. Fetch `GET /auth/me` to restore the session and CSRF token in memory; send `X-CSRF-Token` for POST/PUT/DELETE cookie-authenticated requests. Cookie mutations also require an exact trusted Origin.

Android sends `X-Client-Platform: mobile` for register/login and receives `{user, expiresAt, token}`. Store `token` only in Expo SecureStore, then send `Authorization: Bearer JWT` to every protected endpoint. `/auth/me` returns user/expiry, not the JWT. Both transports check the same active session table. POST logout revokes the current session server-side; it does not log out other devices. Expired/revoked/malformed JWTs return 401.

`User`: `{id, fullName, email, createdAt}`. Email is normalized to lowercase and unique. Passwords must have at least 8 characters and at most 72 UTF-8 bytes. Responses and logs never contain a password/hash. Auth creation/login responses intentionally contain transport credentials only when needed for that client.

## Routes

| Method / path (relative to `/api`) | Request                           | Success                               |
| ---------------------------------- | --------------------------------- | ------------------------------------- |
| POST `/auth/register`              | `{fullName,email,password}`       | 201 Session                           |
| POST `/auth/login`                 | `{email,password}`                | 200 Session                           |
| POST `/auth/logout`                | Empty body; authenticated         | 204                                   |
| GET `/auth/me`                     | Authenticated                     | 200 Session user/expiry; CSRF for web |
| GET `/projects`                    | Project list query below          | 200 Page<Project>                     |
| GET `/projects/{id}`               | UUID path                         | 200 Project                           |
| POST `/projects`                   | Complete ProjectInput             | 201 Project                           |
| PUT `/projects/{id}`               | UUID path + complete ProjectInput | 200 Project                           |
| DELETE `/projects/{id}`            | UUID path                         | 204; cascades tasks                   |
| GET `/tasks`                       | Task list query below             | 200 Page<Task>                        |
| GET `/tasks/{id}`                  | UUID path                         | 200 Task                              |
| POST `/tasks`                      | Complete TaskInput                | 201 Task                              |
| PUT `/tasks/{id}`                  | UUID path + complete TaskInput    | 200 Task                              |
| DELETE `/tasks/{id}`               | UUID path                         | 204                                   |
| GET `/dashboard`                   | No query/body                     | 200 Dashboard                         |
| GET `/health`                      | No query/body; public             | 200 `{status:"ok"}` when DB reachable |

All project/task/dashboard routes require auth. Ownership comes from the session, never a request owner ID. Unowned IDs, including a task's target project, are indistinguishable from missing IDs (404).

## Inputs and responses

```json
{
  "name": "Website refresh",
  "description": "A synthetic studio project",
  "status": "In Progress",
  "startDate": "2026-10-08",
  "endDate": "2026-10-30"
}
```

ProjectInput requires all five fields. Project adds UUID `id`, UTC `createdAt`/`updatedAt`, `taskCount`, and `completedTaskCount`. Status is exactly `Not Started`, `In Progress`, or `Completed`. Progress counts completed tasks; changing task status does not automatically change project status.

```json
{
  "projectId": "00000000-0000-4000-8000-000000000001",
  "name": "Write launch copy",
  "description": "Draft the next step",
  "priority": "High",
  "status": "Pending",
  "dueDate": "2026-10-15"
}
```

TaskInput requires all six fields. Task adds UUID `id`, `projectName`, UTC `createdAt` and `updatedAt`. Priority is exactly `Low`, `Medium`, or `High`; status is `Pending`, `In Progress`, or `Completed`. PUT sends the complete editable object; clients omit server-only response fields. Completion is PUT with status `Completed`; reopening may set `Pending` or `In Progress`. Reassignment must target another project owned by the same user.

Names: trimmed, nonempty, at most 120 characters. Full name: 2–100 trimmed characters. Description: empty allowed, at most 4000 characters. Dates: real YYYY-MM-DD in 1900–9999; project end cannot precede start; overdue tasks allowed. Unknown request keys are rejected. UUID paths, query values and enum spelling/case are validated. JSON limit is 32 KB.

Project list: `search`, `status`, `page`, `pageSize`. Task list: `search`, `status`, `priority`, `projectId`, `page`, `pageSize`. All task filters combine with AND. Name search is case-insensitive substring matching. Omit unused filters; empty enum values are invalid. Default page=1, pageSize=24; max pageSize=100. Project results sort newest-created first; tasks sort earliest-due first; ID breaks ties. No arbitrary SQL/sorting fields are accepted.

Example: `GET /api/tasks?projectId=UUID&search=launch&status=Pending&priority=High&page=1&pageSize=24`.

Page shape: `{items: [...], total: 42, page: 1, pageSize: 24}`. Dashboard shape: `{totalProjects,totalTasks,completedTasks,pendingTasks,projectsInProgress}`. Pending is **Pending only**, not Pending + In Progress. All five counts are user-scoped.

## Errors and logging

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Please check the submitted fields.",
  "fieldErrors": { "endDate": ["End date must be on or after start date"] },
  "requestId": "server-generated-uuid"
}
```

400 invalid fields/body/path/query; 401 invalid credentials/session; 403 Origin/CSRF failure; 404 missing/inaccessible ID; 409 duplicate email; 413 oversized body; 429 rate limit; 500 recoverable server failure. No private database errors are sent. Every response carries `X-Request-Id`; auth/domain responses use `Cache-Control: no-store`. Invalid credentials use a generic email/password message. Login/register allow 20 requests/15 minutes/IP and return rate-limit headers. Keep one API replica until the limiter uses shared storage.
