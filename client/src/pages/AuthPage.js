import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthPage({ initialMode = 'login', initialToken = '', onAuthSuccess }) {
  const {
    login,
    register,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
  } = useAuth();
  const { notify } = useGame();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', token: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  useEffect(() => {
    setMode(initialMode);
    setForm((current) => ({ ...current, token: initialToken }));
    setError('');
    setMessage('');
  }, [initialMode, initialToken]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        notify('success', 'Login successful', 3000);
        onAuthSuccess?.();
      } else if (mode === 'register') {
        await register({ name: form.name, email: form.email, password: form.password });
        setMessage('Check your email to verify your account.');
        notify('success', 'Registration successful. Verify your email to continue.', 4000);
        setMode('verify');
      } else if (mode === 'verify') {
        await verifyEmail(form.token);
        notify('success', 'Email verified. Welcome to ChessLive.', 3000);
        onAuthSuccess?.();
      } else if (mode === 'forgot') {
        await requestPasswordReset(form.email);
        setMessage('If that email exists, a reset link has been sent.');
        notify('info', 'Password reset instructions are ready.', 4000);
        setMode('reset');
      } else if (mode === 'reset') {
        await resetPassword({ token: form.token, password: form.password });
        setMessage('Password updated. Please sign in.');
        notify('success', 'Password updated. Please sign in.', 3000);
        setMode('login');
      }
    } catch (err) {
      const message = err.message || 'Authentication failed';
      setError(message);
      notify('error', message, 4000);
    } finally {
      setLoading(false);
    }
  };

  const title = {
    login: 'Sign in',
    register: 'Create account',
    verify: 'Verify email',
    forgot: 'Reset password',
    reset: 'Set new password',
  }[mode];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-icon">♛</div>
          <h1 className="brand-name">Chess<span>Live</span></h1>
          <p className="brand-tagline">Secure multiplayer chess</p>
        </div>

        <form onSubmit={submit}>
          <h2 className="auth-title">{title}</h2>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={update('name')} maxLength={50} required />
            </div>
          )}

          {['login', 'register', 'forgot'].includes(mode) && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={update('email')} maxLength={320} required />
            </div>
          )}

          {['login', 'register', 'reset'].includes(mode) && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={update('password')} minLength={8} maxLength={128} required />
            </div>
          )}

          {['verify', 'reset'].includes(mode) && (
            <div className="form-group">
              <label className="form-label">{mode === 'verify' ? 'Verification Token' : 'Reset Token'}</label>
              <input className="form-input" value={form.token} onChange={update('token')} required />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <LoadingSpinner label="" inline size="sm" /> : title}
          </button>
        </form>

        <div className="auth-links">
          {mode !== 'login' && <button onClick={() => setMode('login')}>Sign in</button>}
          {mode !== 'register' && <button onClick={() => setMode('register')}>Create account</button>}
          {mode !== 'verify' && <button onClick={() => setMode('verify')}>Verify email</button>}
          {mode !== 'forgot' && <button onClick={() => setMode('forgot')}>Forgot password</button>}
        </div>
      </div>
    </div>
  );
}
