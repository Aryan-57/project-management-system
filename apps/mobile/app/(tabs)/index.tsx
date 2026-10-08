import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Dashboard, Page, Task } from '@still/contracts';
import { api } from '../../src/api';
import { useSession } from '../../src/session';
import { Badge, Button, Empty, ErrorState, Loading, Screen, styles } from '../../src/ui';
export default function DashboardScreen() {
  const { user } = useSession();
  const client = useQueryClient();
  const stats = useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => api<Dashboard>('/dashboard', { signal }),
  });
  const tasks = useQuery({
    queryKey: ['next-tasks'],
    queryFn: ({ signal }) => api<Page<Task>>('/tasks?status=Pending&pageSize=5', { signal }),
  });
  const labels = {
    totalProjects: 'Total projects',
    totalTasks: 'Total tasks',
    completedTasks: 'Completed tasks',
    pendingTasks: 'Pending tasks',
    projectsInProgress: 'Projects in progress',
  } as const;
  return (
    <Screen
      refreshing={stats.isRefetching || tasks.isRefetching}
      onRefresh={() => void client.invalidateQueries()}
    >
      <Text style={styles.eyebrow}>YOUR WORK, AT A GLANCE</Text>
      <Text style={styles.title}>Hello, {user?.fullName.split(' ')[0]}.</Text>
      <Text style={styles.muted}>A little progress. One step at a time.</Text>
      {stats.isPending ? (
        <Loading />
      ) : stats.isError ? (
        <ErrorState error={stats.error} retry={() => void stats.refetch()} />
      ) : (
        <View style={styles.row}>
          {Object.entries(labels).map(([key, label]) => (
            <View style={[styles.card, { flexGrow: 1, flexBasis: '44%' }]} key={key}>
              <Text style={styles.muted}>{label}</Text>
              <Text style={[styles.title, { fontSize: 34 }]}>
                {stats.data[key as keyof Dashboard]}
              </Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.heading}>Next up</Text>
      {tasks.isPending ? (
        <Loading />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} retry={() => void tasks.refetch()} />
      ) : tasks.data.items.length ? (
        tasks.data.items.map((t) => (
          <View key={t.id} style={styles.card}>
            <Text style={styles.heading}>{t.name}</Text>
            <Text style={styles.muted}>
              {t.projectName} · Due {t.dueDate}
            </Text>
            <Badge value={t.priority} />
            <Button
              title="View task"
              secondary
              accessibilityLabel={`View ${t.name}`}
              onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: t.id } })}
            />
          </View>
        ))
      ) : (
        <Empty />
      )}
      <Button title="View all projects" onPress={() => router.push('/(tabs)/projects')} />
    </Screen>
  );
}
