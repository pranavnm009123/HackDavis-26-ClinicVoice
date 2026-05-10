import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_COLOR = ['', '#be2020', '#be2020', '#b85412', '#2e7d52', '#1a5c3a'];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = getStrength(password);
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)', ok: /[A-Z]/.test(password) },
    { label: 'Number (0–9)', ok: /[0-9]/.test(password) },
    { label: 'Special character (!@#…)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="pw-strength">
      <div className="pw-strength-bar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="pw-strength-seg"
            style={{ background: i <= score ? STRENGTH_COLOR[score] : '#e0e7ef' }}
          />
        ))}
        <span style={{ color: STRENGTH_COLOR[score], fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          {STRENGTH_LABEL[score]}
        </span>
      </div>
      <ul className="pw-checklist">
        {checks.map(({ label, ok }) => (
          <li key={label} style={{ color: ok ? '#2e7d52' : '#8fa4b8' }}>
            <span>{ok ? '✓' : '○'}</span> {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuthPage() {
  const { pathname } = useLocation();
  const [mode, setMode] = useState(pathname === '/signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
      if (getStrength(form.password) < 2) { setError('Password is too weak — add uppercase letters, numbers, or symbols.'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.email, form.password, form.name);
      }
      navigate('/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>CowmunityCare</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Welcome back. Sign in to your account.' : 'Create an account to save your profile.'}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} type="button" onClick={() => { setMode('login'); setError(''); }}>Log in</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} type="button" onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full name</label>
              <input id="auth-name" type="text" placeholder="Jane Smith" value={form.name} onChange={field('name')} autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" placeholder="you@example.com" value={form.email} onChange={field('email')} required autoComplete="email" />
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" type="password" placeholder="••••••••" value={form.password} onChange={field('password')} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'signup' && <PasswordStrength password={form.password} />}
          </div>
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirm password</label>
              <input id="auth-confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={field('confirm')} required autoComplete="new-password" />
              {form.confirm && (
                <span className={form.password === form.confirm ? 'pw-match ok' : 'pw-match no'}>
                  {form.password === form.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}
            </div>
          )}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-back">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
