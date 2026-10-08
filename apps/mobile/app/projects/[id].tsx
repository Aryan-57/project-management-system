import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@still/contracts';
import { api } from '../../src/api';
import { Badge, ErrorState, Loading, Notice, Screen, styles } from '../../src/ui';
import { TaskList } from '../../src/task-list';
export default function ProjectDetail() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const query = useQuery({
    queryKey: ['project', id],
    queryFn: ({ signal }) => api<Project>('/projects/' + id, { signal }),
  });
  const refresh = async () => {
    setRefreshing(true);
    try {
      await client.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <Screen refreshing={refreshing} onRefresh={() => void refresh()}>
      {saved ? <Notice success text="Task saved." /> : null}
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <Text style={styles.eyebrow}>PROJECT WORKSPACE</Text>
          <Text style={styles.title}>{query.data.name}</Text>
          <Badge value={query.data.status} />
          <Text style={styles.text}>{query.data.description}</Text>
          <View style={styles.card}>
            <Text style={styles.muted}>
              Start {query.data.startDate} · End {query.data.endDate}
            </Text>
            <Text style={styles.muted}>Created {query.data.createdAt.slice(0, 10)}</Text>
            <Text style={styles.text}>
              {query.data.completedTaskCount} / {query.data.taskCount} tasks completed
            </Text>
          </View>
          <TaskList projectId={id} />
        </>
      )}
    </Screen>
  );
}
