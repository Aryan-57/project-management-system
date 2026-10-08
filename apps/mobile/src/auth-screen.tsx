import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { loginSchema, registerSchema, type RegisterInput, type Session } from '@still/contracts';
import { api, ApiError } from './api';
import { useSession } from './session';
import { Button, Field, Notice, Screen, styles } from './ui';
export function AuthScreen({ register = false }: { register?: boolean }) {
  const session = useSession();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(register ? registerSchema : loginSchema) as any,
    defaultValues: { fullName: '', email: '', password: '' },
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      const body = register ? values : { email: values.email, password: values.password };
      await session.accept(
        await api<Session>(register ? '/auth/register' : '/auth/login', { method: 'POST', body }),
      );
    } catch (e) {
      const error = e as ApiError;
      form.setError('root', { message: error.message });
      for (const [key, values] of Object.entries(error.body?.fieldErrors ?? {}))
        form.setError(key as keyof RegisterInput, { message: values[0] });
    }
  });
  return (
    <Screen keyboard>
      <Text style={[styles.title, { color: '#45634b', fontSize: 42 }]}>still.</Text>
      <Text style={styles.eyebrow}>MAKE ROOM FOR PROGRESS</Text>
      <Text style={styles.title}>{register ? 'A fresh start' : 'Welcome back'}</Text>
      <Text style={styles.muted}>
        One account for web and Android. Your projects, always with you.
      </Text>
      {session.message ? <Notice text={session.message} /> : null}
      {register && (
        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field
              label="Full name"
              autoComplete="name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Field
            label="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <Field
            label="Password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={register ? 'new-password' : 'current-password'}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      {register && <Text style={styles.muted}>At least 8 characters; at most 72 UTF-8 bytes.</Text>}
      {form.formState.errors.root && (
        <Notice text={form.formState.errors.root.message ?? 'Please retry.'} />
      )}
      <Button
        title={
          form.formState.isSubmitting ? 'Please wait…' : register ? 'Create account' : 'Sign in'
        }
        disabled={form.formState.isSubmitting}
        onPress={() => void submit()}
      />
      <Button
        secondary
        title={register ? 'Already have an account? Sign in' : 'New here? Create an account'}
        onPress={() => router.replace(register ? '/login' : '/register')}
      />
    </Screen>
  );
}
