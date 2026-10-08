import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { registerSchema, loginSchema, type RegisterInput, type Session } from '@still/contracts';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export function AuthPage() {
  const register = useLocation().pathname === '/register';
  const session = useSession();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(register ? registerSchema : loginSchema) as any,
    defaultValues: { fullName: '', email: '', password: '' },
    shouldUnregister: true,
  });
  if (session.user) return <Navigate to="/" replace />;
  const submit = form.handleSubmit(async (values) => {
    try {
      const body = register ? values : { email: values.email, password: values.password };
      session.accept(
        await api<Session>('/auth/' + (register ? 'register' : 'login'), { method: 'POST', body }),
      );
    } catch (e) {
      const error = e as ApiError;
      form.setError('root', { message: error.message });
      for (const [key, messages] of Object.entries(error.body?.fieldErrors ?? {}))
        form.setError(key as keyof RegisterInput, { message: messages[0] });
    }
  });
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link className="brand" to="/">
          ◈{' '}
          <span>
            still<span className="brand-dot">.</span>
          </span>
        </Link>
        <div>
          <p className="eyebrow">MAKE ROOM FOR PROGRESS</p>
          <h1>
            Big ideas.
            <br />
            Small steps.
            <br />
            <em>A clearer day.</em>
          </h1>
          <p>
            A thoughtful workspace for the projects you care about.
            <br />
            Your plans, always with you — on web and Android.
          </p>
          <div className="story-card">
            <span className="badge badge-green">One workspace</span>
            <p>
              Organize a project. Take the next step.
              <br />
              See your progress take shape.
            </p>
            <div className="story-progress">
              <i />
            </div>
          </div>
        </div>
        <small>Less noise. More forward.</small>
      </section>
      <main className="auth-form">
        <div className="auth-card">
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h2>{register ? 'A fresh start' : 'Welcome back'}</h2>
          <p>
            {register
              ? 'Create one account for web and Android.'
              : 'Sign in and pick up where you left off.'}
          </p>
          {session.message && (
            <div role="status" className="notice">
              {session.message}
            </div>
          )}
          <form key={register ? 'register' : 'login'} onSubmit={submit} noValidate>
            {register && (
              <label>
                Full name
                <Input
                  autoComplete="name"
                  {...form.register('fullName')}
                  aria-invalid={!!form.formState.errors.fullName}
                  aria-describedby="fullName-error"
                />
                <span id="fullName-error" className="field-error">
                  {form.formState.errors.fullName?.message}
                </span>
              </label>
            )}
            <label>
              Email address
              <Input
                type="email"
                autoComplete="email"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
                aria-describedby="email-error"
              />
              <span id="email-error" className="field-error">
                {form.formState.errors.email?.message}
              </span>
            </label>
            <label>
              Password
              <Input
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                {...form.register('password')}
                aria-invalid={!!form.formState.errors.password}
                aria-describedby="password-error"
              />
              <span id="password-error" className="field-error">
                {form.formState.errors.password?.message}
              </span>
              {register && <small>At least 8 characters; at most 72 UTF-8 bytes.</small>}
            </label>
            {form.formState.errors.root && (
              <div role="alert" className="field-error">
                {form.formState.errors.root.message}
              </div>
            )}
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in'}{' '}
              <span aria-hidden="true">→</span>
            </Button>
          </form>
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to Still?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
