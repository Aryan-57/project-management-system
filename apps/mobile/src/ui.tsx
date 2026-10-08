import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useNetInfo } from '@react-native-community/netinfo';
import { tokens } from '@still/design-tokens';
const c = tokens.color;
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  title: { color: c.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.7 },
  heading: { color: c.ink, fontSize: 19, fontWeight: '600' },
  text: { color: c.ink, fontSize: 16, lineHeight: 24 },
  muted: { color: c.muted, fontSize: 14, lineHeight: 22 },
  eyebrow: { color: c.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 9,
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 16,
    color: c.ink,
  },
  label: { fontSize: 14, color: c.ink, fontWeight: '600', marginBottom: 8 },
  error: { color: c.danger, fontSize: 14, lineHeight: 22 },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.accent,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  notice: {
    backgroundColor: '#fff4de',
    borderWidth: 1,
    borderColor: '#e5d0aa',
    padding: 14,
    borderRadius: 9,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#edf0f4',
    alignSelf: 'flex-start',
  },
  badgeText: { color: c.muted, fontSize: 12, fontWeight: '600' },
});
export function Button({
  title,
  onPress,
  disabled,
  secondary,
  danger,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && { backgroundColor: c.accentSoft },
        danger && { backgroundColor: c.danger },
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: c.accent }]}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={c.muted}
        style={[
          styles.input,
          props.multiline && { minHeight: 110, textAlignVertical: 'top' },
          error && { borderColor: c.danger },
        ]}
        {...props}
      />
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, { padding: 0 }]}>
        <Picker
          accessibilityLabel={label}
          selectedValue={value}
          onValueChange={(v) => onChange(String(v))}
        >
          {options.map((v) => (
            <Picker.Item key={v.value} label={v.label} value={v.value} />
          ))}
        </Picker>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export const choices = (values: readonly string[], all?: string) => [
  ...(all ? [{ label: all, value: '' }] : []),
  ...values.map((v) => ({ label: v, value: v })),
];
export function Badge({ value }: { value: string }) {
  const green = value === 'Completed' || value === 'Low';
  const amber = value === 'In Progress' || value === 'Medium';
  return (
    <View
      style={[
        styles.badge,
        green && { backgroundColor: '#eaf1eb' },
        amber && { backgroundColor: '#fcf2df' },
        value === 'High' && { backgroundColor: '#fcebe8' },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          green && { color: '#3e6147' },
          amber && { color: '#815100' },
          value === 'High' && { color: '#a02c21' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
export function Offline() {
  const network = useNetInfo();
  return network.isConnected === false || network.isInternetReachable === false ? (
    <Notice text="You’re offline. Reconnect and pull to refresh. Open drafts stay here; previously loaded data may be out of date." />
  ) : null;
}
export function Notice({ text, success }: { text: string; success?: boolean }) {
  return (
    <View
      style={[styles.notice, success && { backgroundColor: '#eaf1eb', borderColor: '#c9ddcd' }]}
    >
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.text}>
        {text}
      </Text>
    </View>
  );
}
export function Loading() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading your workspace"
      style={{ padding: 40, alignItems: 'center', gap: 12 }}
    >
      <ActivityIndicator size="large" color={c.accent} />
      <Text style={styles.muted}>Loading your workspace…</Text>
    </View>
  );
}
export function ErrorState({ error, retry }: { error: Error | null; retry: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>We couldn’t load this view</Text>
      <Text accessibilityRole="alert" style={styles.error}>
        {error?.message}
      </Text>
      <Button title="Try again" secondary onPress={retry} />
    </View>
  );
}
export function Empty({ filtered }: { filtered?: boolean }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{filtered ? 'No matching results' : 'A fresh space'}</Text>
      <Text style={styles.muted}>
        {filtered
          ? 'Try a different search or clear the filters.'
          : 'Create a project on the web, then add your next steps here.'}
      </Text>
    </View>
  );
}
export function Screen({
  children,
  refreshing = false,
  onRefresh,
  keyboard = false,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboard?: boolean;
}) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
            ) : undefined
          }
        >
          <Offline />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Pager({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (n: number) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.muted}>
        {total} results · Page {page} of {Math.max(1, Math.ceil(total / 24))}
      </Text>
      <View style={styles.row}>
        <Button title="Previous" secondary disabled={page <= 1} onPress={() => onPage(page - 1)} />
        <Button
          title="Next"
          secondary
          disabled={page * 24 >= total}
          onPress={() => onPage(page + 1)}
        />
      </View>
    </View>
  );
}
export function useDebounced(value: string) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), 250);
    return () => clearTimeout(timer);
  }, [value]);
  return result;
}
