import type { ApiErrorBody } from '@still/contracts';
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Partial<ApiErrorBody>,
  ) {
    super(
      body.message ?? 'No connection. Check your network and try again. Your draft is still here.',
    );
  }
}
let token: string | null = null;
let expired: () => Promise<void> = async () => {};
export const setToken = (value: string | null) => {
  token = value;
};
export const onExpired = (handler: () => Promise<void>) => {
  expired = handler;
};
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base)
    throw new ApiError(0, {
      message: 'API address is not configured. Set EXPO_PUBLIC_API_URL and restart Expo.',
    });
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method ?? 'GET',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': 'mobile',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw e;
    throw new ApiError(0, { code: 'NETWORK_ERROR' });
  }
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: 'The server is unavailable. Please retry.' }));
    if (response.status === 401 && !['/auth/login', '/auth/register'].includes(path))
      await expired();
    throw new ApiError(response.status, body);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values))
    if (v !== '' && v !== undefined) params.set(k, String(v));
  return '?' + params;
}
