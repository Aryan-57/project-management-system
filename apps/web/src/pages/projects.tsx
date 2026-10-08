import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { projectStatuses, type Page, type Project } from '@still/contracts';
import { api, queryString } from '@/lib/api';
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  PageTitle,
  Pagination,
  Select,
  useDebounced,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Confirm } from '@/components/ui/confirm';
import { TaskList } from './tasks';
export function ProjectCard({ project: p }: { project: Project }) {
  const progress = p.taskCount ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 0;
  return (
    <Link to={`/projects/${p.id}`} className="project-card">
      <div className="flex items-center justify-between">
        <span className="project-symbol" aria-hidden="true">
          {p.name.slice(0, 1).toUpperCase()}
        </span>
        <Badge value={p.status} />
      </div>
      <h3>{p.name}</h3>
      <p className="project-description">
        {p.description || 'A fresh project, ready for your next step.'}
      </p>
      <div className="project-progress">
        <span>Task progress</span>
        <strong>{progress}%</strong>
      </div>
      <progress
        aria-label={`${p.name}: completed tasks`}
        value={p.completedTaskCount}
        max={p.taskCount || 1}
      />
      <div className="card-footer">
        <span>
          <CalendarDays size={14} />
          {p.endDate}
        </span>
        <span>
          {p.completedTaskCount}/{p.taskCount} tasks <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}
export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const query = useQuery({
    queryKey: ['projects', debounced, status, page],
    queryFn: ({ signal }) =>
      api<Page<Project>>('/projects' + queryString({ search: debounced, status, page }), {
        signal,
      }),
  });
  const reset = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };
  return (
    <>
      <PageTitle
        eyebrow="A PLACE FOR EVERY IDEA"
        title="Projects"
        description="Turn a bigger picture into a little everyday progress."
        actions={
          <Button asChild>
            <Link to="/projects/new">+ New project</Link>
          </Button>
        }
      />
      <div className="toolbar">
        <Input
          aria-label="Search projects by name"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Project status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={projectStatuses}
          all="All statuses"
        />
        <Button variant="ghost" onClick={reset}>
          Clear filters
        </Button>
        <Button
          variant="outline"
          aria-label="Refresh projects"
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          {query.data.items.length ? (
            <div className="project-grid">
              {query.data.items.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <Empty filtered={!!(search || status)}>
              <Button asChild>
                <Link to="/projects/new">Create a project</Link>
              </Button>
            </Empty>
          )}
          <Pagination {...query.data} onPage={setPage} />
        </>
      )}
    </>
  );
}
export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['project', id],
    queryFn: ({ signal }) => api<Project>('/projects/' + id, { signal }),
  });
  const remove = useMutation({
    mutationFn: () => api('/projects/' + id, { method: 'DELETE' }),
    onSuccess: async () => {
      await client.invalidateQueries();
      navigate('/projects', { state: { success: 'Project and its tasks deleted.' } });
    },
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const p = query.data;
  return (
    <>
      <Link className="back-link" to="/projects">
        ← All projects
      </Link>
      <PageTitle
        eyebrow="PROJECT WORKSPACE"
        title={p.name}
        description={p.description || 'Make your next step a clear one.'}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/projects/${p.id}/edit`}>
                <Pencil size={16} />
                Edit project
              </Link>
            </Button>
            <Confirm
              title="Delete this project?"
              description="This permanently deletes the project and every task inside it. This cannot be undone."
              busy={remove.isPending}
              onConfirm={() => remove.mutate()}
            >
              <Button variant="outline" aria-label="Delete project">
                <Trash2 size={16} />
              </Button>
            </Confirm>
          </>
        }
      />
      {remove.isError && (
        <p role="alert" className="notice">
          {remove.error.message} Try deleting again.
        </p>
      )}
      <div className="project-meta">
        <Badge value={p.status} />
        <span>Start {p.startDate}</span>
        <span>End {p.endDate}</span>
        <span>Created {p.createdAt.slice(0, 10)}</span>
        <span>
          {p.completedTaskCount} of {p.taskCount} tasks completed
        </span>
      </div>
      <TaskList projectId={id} />
    </>
  );
}
