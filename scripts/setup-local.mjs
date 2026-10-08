import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = (name) => fileURLToPath(new URL(`../${name}`, import.meta.url));
const rootEnv = path('.env');
let password;
if (existsSync(rootEnv)) {
  password = readFileSync(rootEnv, 'utf8')
    .match(/^POSTGRES_PASSWORD=(.+)$/m)?.[1]
    ?.trim();
  if (!password || /replace|placeholder|changeme/i.test(password)) {
    throw new Error('Set a real POSTGRES_PASSWORD in root .env before local setup.');
  }
} else {
  password = randomBytes(24).toString('hex');
  writeFileSync(rootEnv, `POSTGRES_PASSWORD=${password}\n`, { flag: 'wx', mode: 0o600 });
}

const files = {
  'apps/api/.env': `NODE_ENV=development\nPORT=3001\nDATABASE_URL=postgresql://still:${encodeURIComponent(password)}@127.0.0.1:5432/still\nJWT_SECRET=${randomBytes(48).toString('hex')}\nWEB_ORIGINS=http://localhost:5173\nSESSION_HOURS=168\nTRUST_PROXY_HOPS=0\nCOOKIE_SAME_SITE=lax\nDEMO_PASSWORD=${randomBytes(18).toString('base64url')}\n`,
  'apps/web/.env': 'VITE_API_URL=/api\n',
  'apps/mobile/.env': 'APP_ENV=development\nEXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api\n',
};
for (const [name, value] of Object.entries(files)) {
  if (!existsSync(path(name))) {
    writeFileSync(path(name), value, { flag: 'wx', mode: 0o600 });
    console.log(`Created ignored ${name}`);
  } else {
    console.log(`Kept existing ${name}`);
  }
}
console.log(
  'Local environments ready. Synthetic seed credentials are in apps/api/.env; no secrets were printed.',
);
