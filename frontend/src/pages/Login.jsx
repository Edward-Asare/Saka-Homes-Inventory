import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@sakahomes.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? 'Welcome back' : 'Create your account'),
    [mode]
  );

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% 0%, #ccfbf1 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, #e2e8f0 0%, transparent 50%), #f7f8fa',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-4xl tracking-tight text-ink sm:text-5xl">Saka Homes</p>
          <p className="mt-2 text-sm text-muted">Inventory management for build &amp; fit-out</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-sm sm:p-8">
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === 'login'
              ? 'Sign in to view and manage stock.'
              : 'Register to start tracking inventory.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  Name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-medium text-accent transition-opacity hover:opacity-80"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-medium text-accent transition-opacity hover:opacity-80"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Demo: <span className="text-ink">admin@sakahomes.com</span> / password123
        </p>
      </div>
    </div>
  );
}
