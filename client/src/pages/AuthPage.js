import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordInput from '../components/PasswordInput';

export default function AuthPage({ initialMode = 'login', initialToken = '', onAuthSuccess, onEmailVerified }) {
  const {
    login,
    register,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
  } = useAuth();
  const { notify } = useGame();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', token: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const verificationInFlightRef = useRef('');

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  useEffect(() => {
    setMode(initialMode);
    setForm((current) => ({ ...current, token: initialToken }));
    setError('');
    setMessage('');
  }, [initialMode, initialToken]);

  useEffect(() => {
    if (initialMode !== 'verify' || !initialToken) return;
    if (verificationInFlightRef.current === initialToken) return;
    verificationInFlightRef.current = initialToken;

    let active = true;
    setLoading(true);
    setError('');
    setMessage('');

    verifyEmail(initialToken)
      .then(() => {
        if (!active) return;
        notify('success', 'Email verified. Please sign in.', 3000);
        setMessage('Email verified. Please sign in.');
        setMode('login');
        onEmailVerified?.();
      })
      .catch((err) => {
        if (!active) return;
        const message = err.message || 'Email verification failed';
        setError(message);
        notify('error', message, 4000);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialMode, initialToken, notify, onEmailVerified, verifyEmail]);

  const validateClientForm = () => {
    if (mode === 'register') {
      if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
        return 'All fields are required.';
      }
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Password and Confirm Password must match.';
    }

    if (mode === 'reset') {
      if (!form.password || !form.confirmPassword) return 'All fields are required.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Password and Confirm Password must match.';
      if (!form.token) return 'Password reset link is invalid or expired.';
    }

    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const validationError = validateClientForm();
      if (validationError) {
        throw new Error(validationError);
      }

      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        notify('success', 'Login successful', 3000);
        onAuthSuccess?.();
      } else if (mode === 'register') {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        setMessage('Account created. Check your email for the verification link, then sign in.');
        notify('success', 'Registration successful. Check your email to verify your account.', 4000);
        setMode('login');
      } else if (mode === 'verify') {
        if (!form.token) throw new Error('Open the verification link from your email.');
        await verifyEmail(form.token);
        notify('success', 'Email verified. Please sign in.', 3000);
        setMode('login');
        onEmailVerified?.();
      } else if (mode === 'forgot') {
        await requestPasswordReset(form.email);
        setMessage('If that email exists, a reset link has been sent.');
        notify('info', 'Password reset instructions are ready.', 4000);
      } else if (mode === 'reset') {
        await resetPassword({
          token: form.token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
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
    verify: 'Verifying email',
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
              <PasswordInput value={form.password} onChange={update('password')} minLength={8} maxLength={128} required />
            </div>
          )}

          {['register', 'reset'].includes(mode) && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <PasswordInput value={form.confirmPassword} onChange={update('confirmPassword')} minLength={8} maxLength={128} required />
            </div>
          )}

          {mode === 'verify' && (
            <div className="form-success">
              {loading ? 'Verifying your email...' : 'Open the verification link from your email to continue.'}
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
          {mode !== 'forgot' && <button onClick={() => setMode('forgot')}>Forgot password</button>}
        </div>
      </div>
    </div>
  );
}
