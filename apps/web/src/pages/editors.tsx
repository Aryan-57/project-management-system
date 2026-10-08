import { useEffect, useState } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  priorities,
  projectStatuses,
  taskStatuses,
  projectSchema,
  taskSchema,
  type Page,
  type Project,
  type ProjectInput,
  type Task,
  type TaskInput,
} from '@still/contracts';
import { api, ApiError } from '@/lib/api';
import { ErrorState, Loading, PageTitle } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
function Field({
  name,
  label,
  register,
  errors,
  type = 'text',
  options,
  hint,
}: {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  type?: string;
  options?: readonly string[];
  hint?: string;
}) {
  const error = errors[name]?.message as string | undefined;
  const props = {
    ...register(name),
    id: name,
    'aria-invalid': !!error,
    'aria-describedby': name + '-hint',
  };
  return (
    <label htmlFor={name}>
      {label}
      {options ? (
        <select {...props}>
          {options.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea rows={4} {...props} />
      ) : (
        <Input type={type} {...props} />
      )}
      <span id={name + '-hint'} className={error ? 'field-error' : 'field-hint'}>
        {error ?? hint}
      </span>
    </label>
  );
}
function setServerErrors(form: ReturnType<typeof useForm<any>>, error: unknown) {
  const e = error as ApiError;
  form.setError('root', { message: e.message });
  for (const [key, values] of Object.entries(e.body?.fieldErrors ?? {}))
    form.setError(key, { message: values[0] });
}
const today = () => new Date().toISOString().slice(0, 10);
export function ProjectEditorPage() {
  const { id } = useParams();
  const client = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['project', id],
    queryFn: ({ signal }) => api<Project>('/projects/' + id, { signal }),
    enabled: !!id,
  });
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Not Started',
      startDate: today(),
      endDate: today(),
    },
  });
  useEffect(() => {
    if (query.data && !form.formState.isDirty) {
      const { name, description, status, startDate, endDate } = query.data;
      form.reset({ name, description, status, startDate, endDate });
    }
  }, [query.data]);
  if (id && query.isPending) return <Loading />;
  if (id && query.isError)
    return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const submit = form.handleSubmit(async (body) => {
    try {
      const project = await api<Project>(id ? '/projects/' + id : '/projects', {
        method: id ? 'PUT' : 'POST',
        body,
      });
      await client.invalidateQueries();
      navigate('/projects/' + project.id, {
        state: { success: id ? 'Project updated.' : 'Project created.' },
      });
    } catch (e) {
      setServerErrors(form, e);
    }
  });
  return (
    <>
      <Link className="back-link" to={id ? '/projects/' + id : '/projects'}>
        ← Back to projects
      </Link>
      <PageTitle
        eyebrow="MAKE ROOM FOR YOUR NEXT IDEA"
        title={id ? 'Edit project' : 'New project'}
        description="Give your project a clear name, a timeline, and a place to grow."
      />
      <form className="editor panel" onSubmit={submit} noValidate>
        <Field
          name="name"
          label="Project name"
          register={form.register}
          errors={form.formState.errors}
        />
        <Field
          name="description"
          label="Description"
          type="textarea"
          register={form.register}
          errors={form.formState.errors}
          hint="Optional. What does success look like?"
        />
        <Field
          name="status"
          label="Status"
          options={projectStatuses}
          register={form.register}
          errors={form.formState.errors}
        />
        <div className="form-columns">
          <Field
            name="startDate"
            label="Start date"
            type="date"
            register={form.register}
            errors={form.formState.errors}
          />
          <Field
            name="endDate"
            label="End date"
            type="date"
            register={form.register}
            errors={form.formState.errors}
          />
        </div>
        {form.formState.errors.root && (
          <div role="alert" className="notice">
            {form.formState.errors.root.message} Your draft is still here.
          </div>
        )}
        <div className="form-actions">
          <Button variant="outline" asChild>
            <Link to={id ? '/projects/' + id : '/projects'}>Cancel</Link>
          </Button>
          <Button disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : 'Save project'}
          </Button>
        </div>
      </form>
    </>
  );
}
export function TaskEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [projectSearch, setProjectSearch] = useState('');
  const query = useQuery({
    queryKey: ['task', id],
    queryFn: ({ signal }) => api<Task>('/tasks/' + id, { signal }),
    enabled: !!id,
  });
  const projects = useInfiniteQuery({
    queryKey: ['project-options', projectSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api<Page<Project>>(
        '/projects?pageSize=100&page=' + pageParam + '&search=' + encodeURIComponent(projectSearch),
        { signal },
      ),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  });
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      projectId: params.get('projectId') ?? '',
      priority: 'Medium',
      status: 'Pending',
      dueDate: today(),
    },
  });
  useEffect(() => {
    if (query.data && !form.formState.isDirty) {
      const { name, description, projectId, priority, status, dueDate } = query.data;
      form.reset({ name, description, projectId, priority, status, dueDate });
    }
  }, [query.data]);
  if (id && query.isPending) return <Loading />;
  if (id && query.isError)
    return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const items = projects.data?.pages.flatMap((p) => p.items) ?? [];
  const selected = query.data;
  const options =
    selected && !items.some((p) => p.id === selected.projectId)
      ? [{ id: selected.projectId, name: selected.projectName }, ...items]
      : items;
  const back = query.data?.projectId ?? params.get('projectId');
  const submit = form.handleSubmit(async (body) => {
    try {
      const task = await api<Task>(id ? '/tasks/' + id : '/tasks', {
        method: id ? 'PUT' : 'POST',
        body,
      });
      await client.invalidateQueries();
      navigate('/projects/' + task.projectId, {
        state: { success: id ? 'Task updated.' : 'Task created.' },
      });
    } catch (e) {
      setServerErrors(form, e);
    }
  });
  return (
    <>
      <Link className="back-link" to={back ? '/projects/' + back : '/tasks'}>
        ← Back to tasks
      </Link>
      <PageTitle
        eyebrow="THE NEXT SMALL STEP"
        title={id ? 'Edit task' : 'New task'}
        description="A specific step is a good place to start."
      />
      <form className="editor panel" onSubmit={submit} noValidate>
        <label>
          Find a project
          <Input
            aria-label="Find a project"
            placeholder="Search project names…"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
          />
        </label>
        <label>
          Project
          <select
            {...form.register('projectId')}
            aria-invalid={!!form.formState.errors.projectId}
            aria-describedby="project-error"
          >
            <option value="">Choose a project</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span id="project-error" className="field-error">
            {form.formState.errors.projectId?.message}
          </span>
        </label>
        {projects.isPending && <p role="status">Loading projects…</p>}
        {projects.isError && (
          <ErrorState error={projects.error} retry={() => void projects.refetch()} />
        )}{' '}
        {projects.hasNextPage && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void projects.fetchNextPage()}
            disabled={projects.isFetchingNextPage}
          >
            Load more projects
          </Button>
        )}
        {!projects.isPending && !projects.isError && !options.length && (
          <p>
            No matching projects. <Link to="/projects/new">Create a project</Link> or change your
            search.
          </p>
        )}
        <Field
          name="name"
          label="Task name"
          register={form.register}
          errors={form.formState.errors}
        />
        <Field
          name="description"
          label="Description"
          type="textarea"
          register={form.register}
          errors={form.formState.errors}
        />
        <div className="form-columns">
          <Field
            name="priority"
            label="Priority"
            options={priorities}
            register={form.register}
            errors={form.formState.errors}
          />
          <Field
            name="status"
            label="Status"
            options={taskStatuses}
            register={form.register}
            errors={form.formState.errors}
          />
        </div>
        <Field
          name="dueDate"
          label="Due date"
          type="date"
          register={form.register}
          errors={form.formState.errors}
        />
        {form.formState.errors.root && (
          <div role="alert" className="notice">
            {form.formState.errors.root.message} Your draft is still here.
          </div>
        )}
        <div className="form-actions">
          <Button variant="outline" asChild>
            <Link to={back ? '/projects/' + back : '/tasks'}>Cancel</Link>
          </Button>
          <Button disabled={form.formState.isSubmitting || projects.isPending}>
            {form.formState.isSubmitting ? 'Saving…' : 'Save task'}
          </Button>
        </div>
      </form>
    </>
  );
}
