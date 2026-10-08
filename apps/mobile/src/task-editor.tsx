import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  priorities,
  taskStatuses,
  taskSchema,
  type Page,
  type Project,
  type Task,
  type TaskInput,
} from '@still/contracts';
import { api, ApiError } from './api';
import {
  Button,
  Choice,
  choices,
  ErrorState,
  Field,
  Loading,
  Notice,
  Screen,
  styles,
  useDebounced,
} from './ui';
export function TaskEditor() {
  const { id, projectId } = useLocalSearchParams<{ id?: string; projectId?: string }>();
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const term = useDebounced(search);
  const query = useQuery({
    queryKey: ['task', id],
    queryFn: ({ signal }) => api<Task>('/tasks/' + id, { signal }),
    enabled: !!id,
  });
  const projects = useInfiniteQuery({
    queryKey: ['project-options', term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api<Page<Project>>(
        '/projects?pageSize=100&page=' + pageParam + '&search=' + encodeURIComponent(term),
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
      projectId: projectId ?? '',
      priority: 'Medium',
      status: 'Pending',
      dueDate: new Date().toISOString().slice(0, 10),
    },
  });
  const selectedId = form.watch('projectId');
  const selectedProject = useQuery({
    queryKey: ['project', selectedId],
    queryFn: ({ signal }) => api<Project>('/projects/' + selectedId, { signal }),
    enabled: !!selectedId,
  });
  useEffect(() => {
    if (query.data && !form.formState.isDirty) {
      const { name, description, projectId, priority, status, dueDate } = query.data;
      form.reset({ name, description, projectId, priority, status, dueDate });
    }
  }, [query.data]);
  if (id && query.isPending)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (id && query.isError)
    return (
      <Screen>
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      </Screen>
    );
  const items = projects.data?.pages.flatMap((p) => p.items) ?? [];
  const selected = selectedId
    ? {
        id: selectedId,
        name:
          selectedProject.data?.name ??
          (query.data?.projectId === selectedId ? query.data.projectName : 'Selected project'),
      }
    : undefined;
  const options =
    selected && !items.some((p) => p.id === selected.id) ? [selected, ...items] : items;
  const submit = form.handleSubmit(async (body) => {
    try {
      const task = await api<Task>(id ? '/tasks/' + id : '/tasks', {
        method: id ? 'PUT' : 'POST',
        body,
      });
      await client.invalidateQueries();
      router.replace({ pathname: '/projects/[id]', params: { id: task.projectId, saved: '1' } });
    } catch (e) {
      const error = e as ApiError;
      form.setError('root', { message: error.message });
      for (const [key, values] of Object.entries(error.body?.fieldErrors ?? {}))
        form.setError(key as keyof TaskInput, { message: values[0] });
    }
  });
  return (
    <Screen keyboard>
      <Text style={styles.eyebrow}>THE NEXT SMALL STEP</Text>
      <Text style={styles.title}>{id ? 'Edit task' : 'New task'}</Text>
      <Text style={styles.muted}>Give the work a clear name and a next step.</Text>
      <Field label="Find a project" value={search} onChangeText={setSearch} />
      <Controller
        control={form.control}
        name="projectId"
        render={({ field, fieldState }) => (
          <Choice
            label="Project"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            options={[
              { label: 'Choose a project', value: '' },
              ...options.map((p) => ({ label: p.name, value: p.id })),
            ]}
          />
        )}
      />
      {projects.isPending ? (
        <Loading />
      ) : projects.isError ? (
        <ErrorState error={projects.error} retry={() => void projects.refetch()} />
      ) : !options.length ? (
        <Text style={styles.muted}>
          No matching projects. Create a project on web, or change your search.
        </Text>
      ) : null}
      {selectedProject.isError ? (
        <ErrorState error={selectedProject.error} retry={() => void selectedProject.refetch()} />
      ) : null}
      {projects.hasNextPage ? (
        <Button
          title="Load more projects"
          secondary
          disabled={projects.isFetchingNextPage}
          onPress={() => void projects.fetchNextPage()}
        />
      ) : null}
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field
            label="Task name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <Field
            label="Description (optional)"
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="priority"
        render={({ field, fieldState }) => (
          <Choice
            label="Priority"
            value={field.value}
            onChange={field.onChange}
            options={choices(priorities)}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="status"
        render={({ field, fieldState }) => (
          <Choice
            label="Status"
            value={field.value}
            onChange={field.onChange}
            options={choices(taskStatuses)}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="dueDate"
        render={({ field, fieldState }) => (
          <Field
            label="Due date (YYYY-MM-DD)"
            placeholder="2026-10-15"
            keyboardType="numbers-and-punctuation"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      {form.formState.errors.root ? (
        <Notice
          text={form.formState.errors.root.message ?? 'Please retry. Your draft is still here.'}
        />
      ) : null}
      <Button
        title={form.formState.isSubmitting ? 'Saving…' : 'Save task'}
        disabled={form.formState.isSubmitting || projects.isPending}
        onPress={() => void submit()}
      />
      <Button title="Cancel" secondary onPress={() => router.back()} />
    </Screen>
  );
}
