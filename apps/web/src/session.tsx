import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@still/contracts';
import { api, ApiError, sessionRequest, setCsrf } from './lib/api';
const Context = createContext<{
  user: User | null;
  loading: boolean;
  error: string;
  message: string;
  accept: (session: Session) => void;
  logout: () => Promise<void>;
  retry: () => void;
}>(null!);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const client = useQueryClient();
  const clear = (message: string) => {
    void client.cancelQueries();
    client.clear();
    setCsrf();
    setUser(null);
    setExpiresAt('');
    setMessage(message);
  };
  const accept = (session: Session) => {
    client.clear();
    setCsrf(session.csrfToken);
    setUser(session.user);
    setExpiresAt(session.expiresAt);
    setMessage('');
    setError('');
  };
  const restore = async () => {
    setLoading(true);
    setError('');
    try {
      accept(await sessionRequest());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        clear('Please sign in to continue. If you had a session, it has expired.');
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void restore();
    const expired = () => clear('Your session has expired. Please sign in again.');
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, []);
  useEffect(() => {
    if (!expiresAt) return;
    const check = () => {
      if (Date.now() >= new Date(expiresAt).getTime())
        clear('Your session has expired. Please sign in again.');
    };
    const timer = window.setInterval(check, 1000);
    const visible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [expiresAt]);
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    clear('You have signed out.');
  };
  return (
    <Context.Provider
      value={{ user, loading, error, message, accept, logout, retry: () => void restore() }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
