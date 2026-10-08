import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { FolderOpen, LayoutDashboard, ListTodo, LogOut, Menu, X } from 'lucide-react';
import { useSession } from './session';
import { Loading, ErrorState, OfflineBanner } from './components/common';
import { Button } from './components/ui/button';
const AuthPage = lazy(() => import('./pages/auth').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() =>
  import('./pages/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const ProjectsPage = lazy(() =>
  import('./pages/projects').then((m) => ({ default: m.ProjectsPage })),
);
const ProjectDetailPage = lazy(() =>
  import('./pages/projects').then((m) => ({ default: m.ProjectDetailPage })),
);
const TaskList = lazy(() => import('./pages/tasks').then((m) => ({ default: m.TaskList })));
const ProjectEditorPage = lazy(() =>
  import('./pages/editors').then((m) => ({ default: m.ProjectEditorPage })),
);
const TaskEditorPage = lazy(() =>
  import('./pages/editors').then((m) => ({ default: m.TaskEditorPage })),
);
function Shell() {
  const session = useSession();
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    document.getElementById('main-content')?.focus();
  }, [location.pathname]);
  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderOpen },
    { to: '/tasks', label: 'Tasks', icon: ListTodo },
  ];
  if (!session.user) return <Navigate to="/login" replace />;
  const logout = async () => {
    setBusy(true);
    setError('');
    try {
      await session.logout();
    } catch (e) {
      setError((e as Error).message + ' Retry to sign out securely.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="mobile-header">
        <Link className="brand" to="/">
          ◈ still.
        </Link>
        <Button
          variant="ghost"
          aria-expanded={menu}
          aria-controls="navigation"
          aria-label={menu ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </Button>
      </header>
      <aside className={menu ? 'sidebar open' : 'sidebar'} id="navigation">
        <Link className="brand" to="/">
          ◈{' '}
          <span>
            still<span className="brand-dot">.</span>
          </span>
        </Link>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink end={to === '/'} to={to} key={to}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <p>
            A little progress,
            <br />
            every day.
          </p>
          <span>Make space for what matters.</span>
        </div>
        <div className="sidebar-account">
          <span className="avatar">{session.user.fullName.slice(0, 1)}</span>
          <div>
            <strong>{session.user.fullName}</strong>
            <small>Personal workspace</small>
          </div>
        </div>
        <Button variant="ghost" onClick={logout} disabled={busy}>
          <LogOut size={17} />
          {busy ? 'Signing out…' : 'Sign out'}
        </Button>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
      </aside>
      <main id="main-content" tabIndex={-1} className="workspace">
        <div className="workspace-top">
          <span>
            Personal workspace{' '}
            <span className="text-muted-foreground">
              /{' '}
              {location.pathname.startsWith('/projects')
                ? 'Projects'
                : location.pathname.startsWith('/tasks')
                  ? 'Tasks'
                  : 'Overview'}
            </span>
          </span>
          <span className="date-label">
            {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date())}
          </span>
        </div>
        <OfflineBanner />
        {location.state?.success && (
          <p role="status" className="success">
            {location.state.success}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
export function App() {
  const session = useSession();
  if (session.loading)
    return (
      <main className="startup">
        <Loading />
      </main>
    );
  if (session.error)
    return (
      <main className="startup">
        <ErrorState error={new Error(session.error)} retry={session.retry} />
      </main>
    );
  return (
    <Suspense
      fallback={
        <main className="startup">
          <Loading />
        </main>
      }
    >
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route element={<Shell />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<ProjectEditorPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/edit" element={<ProjectEditorPage />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/new" element={<TaskEditorPage />} />
          <Route path="tasks/:id/edit" element={<TaskEditorPage />} />
          <Route
            path="*"
            element={
              <div className="state">
                <h1>That page isn’t here.</h1>
                <Link to="/">Back to your workspace</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
