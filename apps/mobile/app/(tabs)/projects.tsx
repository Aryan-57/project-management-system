import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { projectStatuses, type Page, type Project } from '@still/contracts';
import { api, queryString } from '../../src/api';
import {
  Badge,
  Button,
  Choice,
  choices,
  Empty,
  ErrorState,
  Field,
  Loading,
  Pager,
  Screen,
  styles,
  useDebounced,
} from '../../src/ui';
export default function ProjectsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(search);
  const query = useQuery({
    queryKey: ['projects', term, status, page],
    queryFn: ({ signal }) =>
      api<Page<Project>>('/projects' + queryString({ search: term, status, page }), { signal }),
  });
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>Your projects</Text>
      <Text style={styles.muted}>The bigger picture, always with you.</Text>
      <Field
        label="Search projects"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      <Choice
        label="Project status"
        value={status}
        options={choices(projectStatuses, 'All statuses')}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
      <Button
        secondary
        title="Clear filters"
        onPress={() => {
          setSearch('');
          setStatus('');
          setPage(1);
        }}
      />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          {query.data.items.length ? (
            query.data.items.map((p) => (
              <View key={p.id} style={styles.card}>
                <Text style={styles.heading}>{p.name}</Text>
                <Badge value={p.status} />
                <Text style={styles.muted}>
                  {p.description || 'A fresh project, ready for the next step.'}
                </Text>
                <Text style={styles.muted}>
                  {p.completedTaskCount} / {p.taskCount} tasks completed
                </Text>
                <Text style={styles.muted}>
                  Start {p.startDate} · End {p.endDate}
                </Text>
                <Button
                  title="Open project"
                  secondary
                  accessibilityLabel={`Open ${p.name}`}
                  onPress={() => router.push({ pathname: '/projects/[id]', params: { id: p.id } })}
                />
              </View>
            ))
          ) : (
            <Empty filtered={!!(search || status)} />
          )}
          <Pager page={page} total={query.data.total} onPage={setPage} />
        </>
      )}
    </Screen>
  );
}
