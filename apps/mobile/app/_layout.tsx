import { useEffect } from 'react';
import { AppState, Text } from 'react-native';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { SessionProvider, useSession } from '../src/session';
import { ErrorState, Loading, Screen, styles } from '../src/ui';
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 15000, networkMode: 'always' },
    mutations: { retry: false, networkMode: 'always' },
  },
});
function Navigation() {
  const session = useSession();
  const segments = useSegments();
  const authRoute = segments[0] === 'login' || segments[0] === 'register';
  if (session.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (session.error)
    return (
      <Screen>
        <Text style={styles.title}>Reconnect to your workspace</Text>
        <ErrorState error={new Error(session.error)} retry={session.retry} />
      </Screen>
    );
  if (!session.user && !authRoute) return <Redirect href="/login" />;
  if (session.user && authRoute) return <Redirect href="/(tabs)" />;
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#45634b',
        headerTitleStyle: { fontSize: 18 },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Still · Sign in' }} />
      <Stack.Screen name="register" options={{ title: 'Create account' }} />
      <Stack.Screen name="projects/[id]" options={{ title: 'Project' }} />
      <Stack.Screen name="tasks/new" options={{ title: 'New task' }} />
      <Stack.Screen name="tasks/[id]" options={{ title: 'Edit task' }} />
    </Stack>
  );
}
export default function RootLayout() {
  useEffect(() => {
    const app = AppState.addEventListener('change', (state) =>
      focusManager.setFocused(state === 'active'),
    );
    const net = NetInfo.addEventListener((state) =>
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false),
    );
    return () => {
      app.remove();
      net();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <SessionProvider>
          <StatusBar style="dark" />
          <Navigation />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
