import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@still/contracts';
import { api, ApiError, onExpired, setToken } from './api';
const key = 'still.session';
const Context = createContext<{
  user: User | null;
  loading: boolean;
  error: string;
  message: string;
  accept: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}>(null!);
export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const clear = async (text: string) => {
    setToken(null);
    await client.cancelQueries();
    client.clear();
    setUser(null);
    setExpiresAt('');
    setMessage(text);
    await SecureStore.deleteItemAsync(key);
  };
  const accept = async (session: Session) => {
    if (!session.token) throw new Error('Server did not return a mobile session.');
    await SecureStore.setItemAsync(key, session.token);
    setToken(session.token);
    await client.cancelQueries();
    client.clear();
    setUser(session.user);
    setExpiresAt(session.expiresAt);
    setMessage('');
    setError('');
  };
  const restore = async () => {
    setLoading(true);
    setError('');
    try {
      const saved = await SecureStore.getItemAsync(key);
      if (saved) {
        setToken(saved);
        const session = await api<Session>('/auth/me');
        setUser(session.user);
        setExpiresAt(session.expiresAt);
      }
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    onExpired(() => clear('Your session has expired. Please sign in again.'));
    void restore();
    return () => onExpired(async () => {});
  }, []);
  useEffect(() => {
    if (!expiresAt) return;
    const check = () => {
      if (Date.now() >= new Date(expiresAt).getTime())
        void clear('Your session has expired. Please sign in again.');
    };
    const timer = setInterval(check, 1000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [expiresAt]);
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    await clear('You have signed out.');
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
