'use client';
/**
 * AuthGate — global authentication gate for every application route.
 *
 * Unauthenticated visitors see the DRISHTI-X login experience instead of the
 * app; after sign-in the originally requested route is already on screen, so
 * no redirect bookkeeping is needed. CONTINUE AS PUBLIC USER mints a real
 * backend-enforced public_user session (see signInPublic), never a flag.
 * Only /emergency (device-local SOS) stays reachable without a session —
 * emergency info must never sit behind sign-in. All data still loads
 * client-side after authentication; the backend denies unauthenticated calls.
 */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoginCard from './LoginCard';
import { useAuth } from '@/store/authStore';
import { requiresAuth } from './gateRules';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  if (token || !requiresAuth(pathname)) return <>{children}</>;

  if (!open) {
    return (
      <main className="min-h-screen text-slate-200 font-mono flex items-center justify-center p-4" data-testid="auth-gate">
        <div className="dx-hud max-w-md w-full text-center" role="alertdialog" aria-label="Sign in required">
          <div className="dx-hud-edge" />
          <div className="dx-micro">DRISHTI-X · RESTRICTED</div>
          <h1 className="text-xl font-extrabold text-white mt-1">Sign in required</h1>
          <p className="text-xs text-slate-400 mt-1">Authenticate as an operator or continue as a public user to enter.</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-3 min-h-[44px] px-4 rounded bg-[#00d2ff] text-black text-xs font-bold">
            SIGN IN
          </button>
          <div className="mt-2">
            <Link href="/emergency" className="text-[11px] text-[#7de9ff] hover:underline">Emergency SOS (no sign-in needed) →</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-200 font-mono flex items-center justify-center p-4" data-testid="auth-gate">
      <LoginCard onClose={() => setOpen(false)} redirectTo={null} />
    </main>
  );
}
