import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'badge',
        value === 'Completed' || value === 'Low'
          ? 'badge-green'
          : value === 'High'
            ? 'badge-red'
            : value === 'In Progress' || value === 'Medium'
              ? 'badge-amber'
              : '',
      )}
    >
      {value}
    </span>
  );
}
export function Loading() {
  return (
    <div role="status" className="space-y-4" aria-label="Loading your workspace">
      <div className="skeleton h-24" />
      <div className="skeleton h-40" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error | null; retry: () => void }) {
  return (
    <div role="alert" className="state">
      <h3>We couldn’t load this view</h3>
      <p>{error?.message ?? 'Please try again.'}</p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
export function Empty({ filtered, children }: { filtered?: boolean; children?: ReactNode }) {
  return (
    <div className="state">
      <span className="empty-mark" aria-hidden="true">
        ◇
      </span>
      <h3>{filtered ? 'No matching results' : 'A little space for something new'}</h3>
      <p>
        {filtered
          ? 'Try a different search or clear your filters.'
          : 'Start with a project, then break it into achievable tasks.'}
      </p>
      {children}
    </div>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
  all = 'All',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  all?: string;
}) {
  return (
    <label className="filter-label">
      <span className="sr-only">{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (n: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {total} result{total === 1 ? '' : 's'} · Page {page} of{' '}
        {Math.max(1, Math.ceil(total / pageSize))}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page * pageSize >= total}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
export function useDebounced(value: string) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), 250);
    return () => clearTimeout(timer);
  }, [value]);
  return result;
}
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return offline ? (
    <div role="status" className="notice">
      You’re offline. Your open drafts stay here. Reconnect, then retry or refresh.
    </div>
  ) : null;
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </header>
  );
}
