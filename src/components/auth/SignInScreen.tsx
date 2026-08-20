import React, { useState } from 'react';
import { Mail, Lock, Key } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pulse_auth_token', 'authenticated-user-token');
    localStorage.setItem('pulse_user_email', email || 'user@company.com');
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveScreen('dashboard');
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

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
          <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] text-neutral-400 font-mono uppercase absolute">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveScreen('dashboard')}
            className="py-2.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-mono font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('dashboard')}
            className="py-2.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-mono font-semibold flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            SSO
          </button>
        </div>

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
