# Local, staging and production preparation

No external resources are provisioned and no deployment command has been executed. The source includes deployment templates, not live URLs.

## Web

Use `apps/web` as the Vercel project root; install from the monorepo lockfile. Its `vercel.json` builds shared packages first and emits `apps/web/dist`; SPA rewrites allow deep links. Set public `VITE_API_URL` to the actual API URL ending `/api` **before building**. It contains no secret. Current preparation assumes `https://app.example.com` and `https://api.example.com` are same-site custom domains; replace placeholders with authorized actual hosts. Preview origins must be explicitly added to the API allowlist, never a wildcard with credentials.

The local Vite proxy forwards `/api` to the same Nest API on port 3001. The production template uses direct credentialed CORS to the API, not the Vite development proxy. If the web and API are on unrelated sites, cookies require `COOKIE_SAME_SITE=none` + HTTPS, and some browsers still block third-party cookies. Prefer same-site custom domains or a reviewed same-origin reverse proxy. CSRF remains required regardless of cookie SameSite.

## API / PostgreSQL

Build from repository root using `docker build -f apps/api/Dockerfile -t still-api .`. The image includes the compiled API and Prisma CLI for migration administration. It is a simple single-stage build, not a minimized production image. Deploy it to a compatible container host with PostgreSQL, HTTPS termination and private DB connectivity. Before starting a new release, run `pnpm --filter @still/api db:migrate` against that environment with a migration role. Start the app with a least-privilege runtime DB role. Keep sessions and all project/task data in this same DB. Never point staging at production.

Use `.env.staging.example` / `.env.production.example` as name references; inject secrets in the host secret manager. Replace JWT placeholder with a random secret, use TLS-enabled database URL, exact HTTPS `WEB_ORIGINS`, PORT assigned by host, and actual proxy hop count. Keep the API single-replica for the in-memory auth rate limiter; multi-replica hosting requires a shared limiter. Readiness is `/api/health`; startup connects to the DB and fails rather than silently operating with another store. Configure health probes/restart policy at the chosen host.

The build-only GitHub workflow installs frozen dependencies, compiles web/API, typechecks all apps, and exports the Android JS bundle with an example HTTPS URL. It has no test phase, deployment step, secrets, publishing action or production credentials. `EXPO_PUBLIC_API_URL` in this compilation job is a nonfunctional placeholder; a distributed release must use the actual deployed API. The workflow is prepared locally and has not run on GitHub.

## Android APK

The source targets Expo SDK 56 and matching native dependency versions. `eas.json` preview/production profiles request `android.buildType: apk` and internal distribution. `app.config.ts` rejects missing, localhost/emulator, or non-HTTPS API URLs when APP_ENV is staging/production, and disables Android cleartext traffic for those profiles. SecureStore backup exclusion is enabled. No native APK or signed distribution artifact exists yet.

When remote build authorization is given, install/use the supported EAS CLI, authenticate using your Expo account, link the project (`eas build:configure` if necessary), add the **public** `EXPO_PUBLIC_API_URL=https://REAL_API/api` to EAS preview/production environment variables, then run from `apps/mobile`:

```sh
eas build --platform android --profile preview
```

Account linking/signing/builds can create remote artifacts; they have not been executed in this phase. EAS can manage Android signing after account authorization. For a Windows local build, install Android Studio, a compatible JDK (17 baseline), SDK/platform tools, configure ANDROID_HOME/JAVA_HOME, then `pnpm --filter @still/mobile android` to prebuild and compile a development app. A signed release requires keystore configuration and a release Gradle build in the generated Android project. `eas build --local` is not the recommended Windows build path. Keep signing files and credentials outside Git.

### Windows local preview APK

`scripts/build-android-local.ps1` generates the native project using the exact official `expo-template-bare-minimum@56.0.37` template, then runs Gradle `:app:assembleRelease` without tests. It embeds the JS bundle but keeps APP_ENV=development and the template debug signing key. The resulting `artifacts/still-local-preview.apk` is a **local preview**, not a production-signed submission. It includes arm64-v8a and x86_64, targets Android 36, and needs Android 7/API 24 or later.

Install JDK 17, Android platform 36, build tools 36.0.0 (Gradle may also install 35.0.0), NDK 27.1.12297006 and CMake 3.22.1. Set JAVA_HOME/ANDROID_HOME, or use the ignored `.local-tools/java` and `.local-tools/android-sdk` workspace locations. Official tool downloads were checksum-verified in this workspace. The script uses an unused `W:` drive alias for paths containing spaces or ampersands; choose `-DriveLetter X` if needed. Gradle cache is isolated under `.local-tools/gradle`.

```powershell
./scripts/build-android-local.ps1
# For a USB phone: set up adb reverse and bake the loopback URL into the preview.
./scripts/build-android-local.ps1 -ApiUrl http://127.0.0.1:3001/api
# Or supply the reachable LAN API URL for a physical phone.
```

The APK never changes its API address at runtime; rebuild when switching addresses. These preview addresses are intentionally unsuitable for production. Production/staging configuration still requires a deployed HTTPS shared API and proper signing. Building an APK does not establish device acceptance.

Local emulator URL: `http://10.0.2.2:3001/api`. Physical Android URL: your computer's reachable LAN address on port 3001, or `adb reverse tcp:3001 tcp:3001` with a USB device and `http://127.0.0.1:3001/api` in a development build. These are development configurations only. Open Windows firewall narrowly for a physical device if needed. API listens on 0.0.0.0; PostgreSQL Docker port binds only to loopback.

Later release acceptance must install the actual signed APK and demonstrate same-account web↔Android synchronization, expiry/revocation, offline recovery and screen-reader navigation. Native device automation is unavailable in this session; Expo MCP tools are also unavailable. This limitation does not change the Android delivery requirement.
