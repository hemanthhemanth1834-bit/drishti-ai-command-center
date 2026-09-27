'use client';
/** Real operator sign-in: glass card, validation, loading, errors, emergency + public paths. */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Siren, Users, X } from 'lucide-react';
import { signIn, useAuth } from '@/store/authStore';
import { API_BASE } from '@/platform/api';
import { setApp } from '@/store/appStore';
import { useDialogA11y } from '@/hooks/useDialogA11y';

function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[a-zA-Z0-9._-]{2,60}$/.test(v);
}

export default function LoginCard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { rememberedId } = useAuth();
  const [username, setUsername] = useState(rememberedId);
  const [secret, setSecret] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotDone, setForgotDone] = useState(false);

  // UI polish: focus moves into the sign-in dialog on open, Escape closes it.
  useDialogA11y(true, 'dx-login-dialog', onClose);

  const openForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setForgotDone(false);
    setMode('forgot');
  };

  const backToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setForgotDone(false);
    setMode('login');
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim()) { setError('Enter your operator email or username.'); return; }
    setBusy(true);
    setError('');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      // Generic request: the server never reveals whether the account exists.
      await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }), signal: ctrl.signal,
      });
      clearTimeout(t);
      setForgotDone(true);
    } catch {
      setError('Could not reach the server. Your administrator can reset operator credentials directly.');
    }
    setBusy(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim()) { setError('Enter your operator email or username.'); return; }
    if (!isEmailLike(username.trim())) { setError('That email or username looks invalid.'); return; }
    if (!secret) { setError('Enter your password.'); return; }
    setBusy(true);
    setError('');
    const r = await signIn(username.trim(), secret, remember);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? 'Authentication failed. Please check your credentials and try again.'); return; }
    onClose();
    router.push('/command');
  };

  return (
    <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={onClose}>
      <div className="login-card" id="dx-login-dialog" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="login-card-head">
          <div>
            <p className="login-brand">DRISHTI-X</p>
            <h2 id="login-title" className="login-title">Welcome to DRISHTI-X</h2>
            <p className="login-sub">Disaster Intelligence Center — operator sign-in</p>
          </div>
          <button type="button" className="login-close" onClick={onClose} aria-label="Close sign-in">
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'login' && (
        <form onSubmit={submit} noValidate>
          <label className="login-label" htmlFor="login-user">Email / Username</label>
          <input
            id="login-user" name="username" autoComplete="username" placeholder="Enter your email"
            value={username} onChange={(e) => setUsername(e.target.value)}
            className="login-input" aria-invalid={!!error} disabled={busy}
          />
          <label className="login-label" htmlFor="login-pass">Password</label>
          <div className="login-passwrap">
            <input
              id="login-pass" name="password" type={show ? 'text' : 'password'} autoComplete="current-password"
              placeholder="••••••••••" value={secret} onChange={(e) => setSecret(e.target.value)}
              className="login-input" aria-invalid={!!error} disabled={busy}
            />
            <button type="button" className="login-eye" onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="login-row">
            <label className="login-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="login-forgot" onClick={openForgot} aria-label="Open password reset request">
              Forgot password?
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
        )}
        {mode === 'forgot' && (
          <form onSubmit={submitForgot} aria-label="Password reset request">
            <p className="login-sub">Operator credentials are administrator-provisioned. Enter your username to notify your administrator.</p>
            <label className="login-label" htmlFor="forgot-user">Email / Username</label>
            <input
              id="forgot-user" name="username" autoComplete="username" placeholder="Enter your email"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="login-input" aria-invalid={!!error} disabled={busy}
            />
            {forgotDone && (
              <p className="login-note" role="status">If an operator account exists for that username, the administrator has been notified. Password-recovery email is not configured on this server.</p>
            )}
            <div className="login-row">
              <button type="button" className="login-forgot" onClick={backToLogin} aria-label="Back to sign in">
                ← Back to sign in
              </button>
              <button type="submit" className="login-submit" disabled={busy}>
                {busy ? 'SENDING…' : 'NOTIFY ADMINISTRATOR'}
              </button>
            </div>
          </form>
        )}

        <div className="login-alt">
          <Link href="/safety" onClick={() => { setApp({ mode: 'public' }); onClose(); }} className="login-public">
            <Users className="w-3.5 h-3.5" aria-hidden="true" /> CONTINUE AS PUBLIC USER
          </Link>
          <Link href="/emergency" onClick={onClose} className="login-emergency">
            <Siren className="w-3.5 h-3.5" aria-hidden="true" /> EMERGENCY ACCESS
          </Link>
        </div>
        <p className="login-note">Sessions last 12h. Credential resets are administrator-provisioned — use Forgot password to notify yours. No emergency info requires sign-in.</p>
      </div>
    </div>
  );
}
