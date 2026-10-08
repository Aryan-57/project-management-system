import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DATABASE_URL: z.url().refine((v) => /^postgres(ql)?:/.test(v)),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine((v) => !/placeholder|replace|change.me/i.test(v), 'Generate a random secret'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGINS: z
    .string()
    .min(1)
    .transform((v) =>
      v.split(',').map((s) =>
        z
          .url()
          .refine(
            (origin) => new URL(origin).origin === origin,
            'Use an exact origin without path, query or trailing slash',
          )
          .parse(s.trim()),
      ),
    ),
  SESSION_HOURS: z.coerce.number().int().min(1).max(720).default(168),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
});
export const config = schema.parse(process.env);
export const deployed = config.NODE_ENV !== 'development';
if (deployed && config.WEB_ORIGINS.some((v) => !v.startsWith('https://')))
  throw new Error('Deployed web origins must use HTTPS');
if (!deployed && config.COOKIE_SAME_SITE === 'none')
  throw new Error('SameSite=None requires HTTPS deployment');
