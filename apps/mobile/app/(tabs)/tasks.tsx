import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Screen } from '../../src/ui';
import { TaskList } from '../../src/task-list';
export default function TasksScreen() {
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
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
      <TaskList />
    </Screen>
  );
}
