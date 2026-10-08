import { Text } from 'react-native';
import { Tabs } from 'expo-router';
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#45634b',
        tabBarInactiveTintColor: '#526178',
        tabBarStyle: { minHeight: 64 },
        tabBarLabelStyle: { fontSize: 12 },
        headerTintColor: '#45634b',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarAccessibilityLabel: 'Overview dashboard',
          tabBarIcon: () => <Text accessibilityElementsHidden>◈</Text>,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarAccessibilityLabel: 'Your projects',
          tabBarIcon: () => <Text accessibilityElementsHidden>▤</Text>,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarAccessibilityLabel: 'Your tasks',
          tabBarIcon: () => <Text accessibilityElementsHidden>✓</Text>,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarAccessibilityLabel: 'Account and sign out',
          tabBarIcon: () => <Text accessibilityElementsHidden>○</Text>,
        }}
      />
    </Tabs>
  );
}
