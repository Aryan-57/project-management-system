import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { priorities, taskStatuses, type Page, type Task, type TaskInput } from '@still/contracts';
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
export function TaskList({ projectId }: { projectId?: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState('');
  const client = useQueryClient();
  const debounced = useDebounced(search);
  const query = useQuery({
    queryKey: ['tasks', projectId, debounced, status, priority, page],
    queryFn: ({ signal }) =>
      api<Page<Task>>(
        '/tasks' + queryString({ projectId, search: debounced, status, priority, page }),
        { signal },
      ),
  });
  const write = useMutation({
    mutationFn: (task: Task) => {
      const body: TaskInput = {
        name: task.name,
        description: task.description,
        projectId: task.projectId,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status === 'Completed' ? 'Pending' : 'Completed',
      };
      return api('/tasks/' + task.id, { method: 'PUT', body });
    },
    onSuccess: async () => {
      setSuccess('Task status updated.');
      await client.invalidateQueries();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api('/tasks/' + id, { method: 'DELETE' }),
    onSuccess: async () => {
      setSuccess('Task deleted.');
      await client.invalidateQueries();
    },
  });
  const reset = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setPage(1);
  };
  return (
    <>
      <PageTitle
        eyebrow={projectId ? 'THE NEXT SMALL STEPS' : 'ACROSS YOUR PROJECTS'}
        title="Tasks"
        description="Make the work visible. Keep the next step simple."
        actions={
          <Button asChild>
            <Link to={'/tasks/new' + (projectId ? '?projectId=' + projectId : '')}>+ New task</Link>
          </Button>
        }
      />
      <div className="toolbar">
        <Input
          aria-label="Search tasks by name"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Task status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={taskStatuses}
          all="All statuses"
        />
        <Select
          label="Task priority"
          value={priority}
          onChange={(v) => {
            setPriority(v);
            setPage(1);
          }}
          options={priorities}
          all="All priorities"
        />
        <Button variant="ghost" onClick={reset}>
          Clear filters
        </Button>
        <Button
          variant="outline"
          aria-label="Refresh tasks"
          onClick={() => void client.invalidateQueries()}
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      {success && (
        <div role="status" className="success">
          {success}
        </div>
      )}
      {(write.isError || remove.isError) && (
        <div role="alert" className="notice">
          {write.error?.message ?? remove.error?.message} Your previous values were kept. Please
          retry.
        </div>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          {query.data.items.length ? (
            <div className="task-table">
              <div className="task-table-header">
                <span>Task / project</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Due date</span>
                <span>Actions</span>
              </div>
              {query.data.items.map((t) => (
                <article className="task-row" key={t.id}>
                  <div className="task-name">
                    <Button
                      variant="ghost"
                      className="task-toggle"
                      disabled={write.isPending}
                      aria-label={
                        t.status === 'Completed' ? `Reopen ${t.name}` : `Complete ${t.name}`
                      }
                      onClick={() => write.mutate(t)}
                    >
                      <span
                        className={
                          t.status === 'Completed' ? 'task-circle completed' : 'task-circle'
                        }
                      >
                        {t.status === 'Completed' && <Check size={14} />}
                      </span>
                    </Button>
                    <div>
                      <Link to={`/tasks/${t.id}/edit`}>
                        <strong>{t.name}</strong>
                      </Link>
                      <small>
                        <Link to={`/projects/${t.projectId}`}>{t.projectName}</Link> · Created{' '}
                        {t.createdAt.slice(0, 10)}
                      </small>
                      {t.description && <p>{t.description}</p>}
                    </div>
                  </div>
                  <Badge value={t.status} />
                  <Badge value={t.priority} />
                  <time dateTime={t.dueDate}>{t.dueDate}</time>
                  <div className="task-actions">
                    <Button variant="ghost" asChild>
                      <Link aria-label={`Edit ${t.name}`} to={`/tasks/${t.id}/edit`}>
                        <Pencil size={16} />
                      </Link>
                    </Button>
                    <Confirm
                      title="Delete this task?"
                      description={`“${t.name}” will be permanently deleted.`}
                      busy={remove.isPending}
                      onConfirm={() => remove.mutate(t.id)}
                    >
                      <Button variant="ghost" aria-label={`Delete ${t.name}`}>
                        <Trash2 size={16} />
                      </Button>
                    </Confirm>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty filtered={!!(search || status || priority)}>
              <Button asChild>
                <Link to={'/tasks/new' + (projectId ? '?projectId=' + projectId : '')}>
                  Create a task
                </Link>
              </Button>
            </Empty>
          )}
          <Pagination {...query.data} onPage={setPage} />
        </>
      )}
    </>
  );
}
