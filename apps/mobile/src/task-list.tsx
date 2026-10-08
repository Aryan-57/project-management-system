import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { priorities, taskStatuses, type Page, type Task, type TaskInput } from '@still/contracts';
import { api, queryString } from './api';
import {
  Badge,
  Button,
  Choice,
  choices,
  Empty,
  ErrorState,
  Field,
  Loading,
  Notice,
  Pager,
  styles,
  useDebounced,
} from './ui';
export function TaskList({ projectId }: { projectId?: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const term = useDebounced(search);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['tasks', projectId, term, status, priority, page],
    queryFn: ({ signal }) =>
      api<Page<Task>>('/tasks' + queryString({ projectId, search: term, status, priority, page }), {
        signal,
      }),
  });
  const write = useMutation({
    mutationFn: (t: Task) => {
      const body: TaskInput = {
        name: t.name,
        description: t.description,
        projectId: t.projectId,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status === 'Completed' ? 'Pending' : 'Completed',
      };
      return api('/tasks/' + t.id, { method: 'PUT', body });
    },
    onSuccess: async () => {
      setMessage('Task status updated.');
      await client.invalidateQueries();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api('/tasks/' + id, { method: 'DELETE' }),
    onSuccess: async () => {
      setMessage('Task deleted.');
      await client.invalidateQueries();
    },
  });
  const confirm = (t: Task) =>
    Alert.alert('Delete this task?', `“${t.name}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(t.id) },
    ]);
  return (
    <>
      <Text style={styles.heading}>Tasks</Text>
      <Button
        title="+ New task"
        onPress={() =>
          router.push({ pathname: '/tasks/new', params: projectId ? { projectId } : {} })
        }
      />
      <Field
        label="Search tasks by name"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      <Choice
        label="Task status"
        value={status}
        options={choices(taskStatuses, 'All statuses')}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
      <Choice
        label="Priority"
        value={priority}
        options={choices(priorities, 'All priorities')}
        onChange={(v) => {
          setPriority(v);
          setPage(1);
        }}
      />
      <Button
        secondary
        title="Clear filters"
        onPress={() => {
          setSearch('');
          setStatus('');
          setPriority('');
          setPage(1);
        }}
      />
      {message ? <Notice text={message} success /> : null}
      {write.isError || remove.isError ? (
        <Notice
          text={
            (write.error?.message ?? remove.error?.message ?? '') +
            ' Previous values were kept. Retry the action.'
          }
        />
      ) : null}
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          {query.data.items.length ? (
            query.data.items.map((t) => (
              <View key={t.id} style={styles.card}>
                <Text style={styles.heading}>{t.name}</Text>
                <Text style={styles.muted}>{t.projectName}</Text>
                <View style={styles.row}>
                  <Badge value={t.status} />
                  <Badge value={t.priority} />
                </View>
                {t.description ? <Text style={styles.text}>{t.description}</Text> : null}
                <Text style={styles.muted}>
                  Due {t.dueDate} · Created {t.createdAt.slice(0, 10)}
                </Text>
                <Button
                  secondary
                  title={t.status === 'Completed' ? 'Reopen task' : 'Mark completed'}
                  accessibilityLabel={`${t.status === 'Completed' ? 'Reopen' : 'Complete'} ${t.name}`}
                  disabled={write.isPending}
                  onPress={() => write.mutate(t)}
                />
                <View style={styles.row}>
                  <Button
                    title="Edit"
                    secondary
                    accessibilityLabel={`Edit ${t.name}`}
                    onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: t.id } })}
                  />
                  <Button
                    title="Delete"
                    danger
                    accessibilityLabel={`Delete ${t.name}`}
                    disabled={remove.isPending}
                    onPress={() => confirm(t)}
                  />
                </View>
              </View>
            ))
          ) : (
            <Empty filtered={!!(search || status || priority)} />
          )}
          <Pager page={page} total={query.data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
