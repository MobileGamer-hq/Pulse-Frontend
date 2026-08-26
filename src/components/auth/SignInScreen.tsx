import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SignInScreenProps {
  onSuccess?: () => void;
  onNavigateToSetup?: () => void;
  onNavigateToInvite?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSuccess,
  onNavigateToSetup,
  onNavigateToInvite
}) => {
  const { setActiveScreen } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const userName = email.split('@')[0] || 'User';
      const activeSlug = localStorage.getItem('pulse_tenant_slug') || 'epicordia';

      localStorage.setItem('pulse_auth_token', 'demo-auth-token');
      localStorage.setItem('pulse_user_id', 'usr-active');
      localStorage.setItem('pulse_user_email', email);
      localStorage.setItem('pulse_user_name', userName);
      localStorage.setItem('pulse_tenant_slug', activeSlug);

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/select-org';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] flex flex-col items-center justify-center p-4 font-sans text-neutral-900 dark:text-neutral-100">
      {/* Header Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-sm">
          ◇
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight block leading-tight">Pulse</span>
          <span className="text-[10px] text-neutral-400 font-mono block">by Epicordia</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
        <p className="text-xs text-neutral-500 mt-1">Access your secure workspace</p>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700"
              />
              <span className="font-mono text-[11px]">Remember me</span>
            </label>

            <a href="#forgot" onClick={e => e.preventDefault()} className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 underline">
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-mono text-[11px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {/* Demo Switcher Links */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px] text-neutral-500 font-mono">
          <button type="button" onClick={() => setActiveScreen('welcome')} className="hover:underline text-black dark:text-white font-semibold">
            ← Welcome
          </button>
          {onNavigateToSetup && (
            <button type="button" onClick={onNavigateToSetup} className="hover:underline text-black dark:text-white font-semibold">
              Setup Wizard →
            </button>
          )}
          {onNavigateToInvite && (
            <button type="button" onClick={onNavigateToInvite} className="hover:underline text-black dark:text-white font-semibold">
              Invite Flow →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
