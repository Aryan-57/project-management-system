import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '../../src/session';
import { Button, Notice, Screen, styles } from '../../src/ui';
export default function Account() {
  const session = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    setError('');
    try {
      await session.logout();
    } catch (e) {
      setError((e as Error).message + ' Reconnect and retry to revoke your session.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR PERSONAL WORKSPACE</Text>
      <Text style={styles.title}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>{session.user?.fullName}</Text>
        <Text style={styles.text}>{session.user?.email}</Text>
        <Text style={styles.muted}>Joined {session.user?.createdAt.slice(0, 10)}</Text>
      </View>
      <Text style={styles.muted}>
        Your web and Android apps share the same projects and tasks. Pull to refresh after a change
        on another device.
      </Text>
      {error ? <Notice text={error} /> : null}
      <Button
        title={busy ? 'Signing out…' : 'Sign out'}
        disabled={busy}
        onPress={() => void logout()}
      />
    </Screen>
  );
}
