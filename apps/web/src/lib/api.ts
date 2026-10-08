import type { ApiErrorBody, Session } from '@still/contracts';
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Partial<ApiErrorBody>,
  ) {
    super(body.message ?? 'Unable to reach the server. Check your connection and try again.');
  }
}
let csrfToken = '';
const base = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
export const setCsrf = (value = '') => {
  csrfToken = value;
};
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method ?? 'GET',
      credentials: 'include',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, { code: 'NETWORK_ERROR' });
  }
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: 'The server is unavailable. Please retry.' }));
    if (response.status === 401 && !['/auth/login', '/auth/register'].includes(path)) {
      setCsrf();
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export function queryString(values: Record<string, unknown>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v !== '' && v !== undefined) p.set(k, String(v));
  return '?' + p;
}
export const sessionRequest = () => api<Session>('/auth/me');
