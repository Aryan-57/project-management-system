import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  FolderOpen,
  ListTodo,
  CircleCheck,
  Clock,
  Activity,
  RefreshCw,
} from 'lucide-react';
import type { Dashboard, Page, Project, Task } from '@still/contracts';
import { api } from '@/lib/api';
import { useSession } from '@/session';
import { Badge, Empty, ErrorState, Loading, PageTitle } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './projects';
export function DashboardPage() {
  const { user } = useSession();
  const client = useQueryClient();
  const stats = useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => api<Dashboard>('/dashboard', { signal }),
  });
  const projects = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: ({ signal }) => api<Page<Project>>('/projects?pageSize=3', { signal }),
  });
  const tasks = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: ({ signal }) => api<Page<Task>>('/tasks?status=Pending&pageSize=5', { signal }),
  });
  const cards = [
    { key: 'totalProjects', label: 'Total projects', icon: FolderOpen },
    { key: 'totalTasks', label: 'Total tasks', icon: ListTodo },
    { key: 'completedTasks', label: 'Completed tasks', icon: CircleCheck },
    { key: 'pendingTasks', label: 'Pending tasks', icon: Clock },
    { key: 'projectsInProgress', label: 'Projects in progress', icon: Activity },
  ] as const;
  return (
    <>
      <PageTitle
        eyebrow="YOUR WORK, AT A GLANCE"
        title={`Hello, ${user?.fullName.split(' ')[0]}.`}
        description="A clear view of where things stand. One step at a time."
        actions={
          <>
            <Button variant="outline" onClick={() => void client.invalidateQueries()}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/projects/new">+ New project</Link>
            </Button>
          </>
        }
      />
      {stats.isPending ? (
        <Loading />
      ) : stats.isError ? (
        <ErrorState error={stats.error} retry={() => void stats.refetch()} />
      ) : (
        <div className="stats-grid">
          {cards.map(({ key, label, icon: Icon }) => (
            <article className="stat-card" key={key}>
              <div>
                <span>{label}</span>
                <Icon size={18} />
              </div>
              <strong>{stats.data[key]}</strong>
              <small>
                {key === 'pendingTasks'
                  ? 'Waiting for the next step'
                  : key === 'completedTasks'
                    ? 'Every finish counts'
                    : 'Across your workspace'}
              </small>
            </article>
          ))}
        </div>
      )}
      <section className="section-heading">
        <div>
          <h2>Recent projects</h2>
          <p>Keep your next milestone in sight.</p>
        </div>
        <Link to="/projects">
          View all projects <ArrowUpRight size={16} />
        </Link>
      </section>
      {projects.isPending ? (
        <Loading />
      ) : projects.isError ? (
        <ErrorState error={projects.error} retry={() => void projects.refetch()} />
      ) : projects.data.items.length ? (
        <div className="project-grid">
          {projects.data.items.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Empty>
          <Button asChild>
            <Link to="/projects/new">Create your first project</Link>
          </Button>
        </Empty>
      )}
      <section className="section-heading">
        <div>
          <h2>Next up</h2>
          <p>Pending tasks, ordered by due date.</p>
        </div>
        <Link to="/tasks">
          View all tasks <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="panel">
        {tasks.isPending ? (
          <Loading />
        ) : tasks.isError ? (
          <ErrorState error={tasks.error} retry={() => void tasks.refetch()} />
        ) : tasks.data.items.length ? (
          tasks.data.items.map((task) => (
            <Link className="next-task" to={`/tasks/${task.id}/edit`} key={task.id}>
              <span className="task-circle" aria-hidden="true" />
              <div>
                <strong>{task.name}</strong>
                <small>{task.projectName}</small>
              </div>
              <Badge value={task.priority} />
              <time>{task.dueDate}</time>
              <ArrowUpRight size={16} />
            </Link>
          ))
        ) : (
          <div className="state compact">
            <h3>Nothing pending. A little breathing room.</h3>
            <p>Find all your tasks in the Tasks view.</p>
          </div>
        )}
      </div>
    </>
  );
}
