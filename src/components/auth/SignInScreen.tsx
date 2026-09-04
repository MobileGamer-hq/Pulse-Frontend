import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';
import { authService } from '../../services/authService';

interface SignInScreenProps {
  onSuccess?: () => void;
  onNavigateToSetup?: () => void;
  onNavigateToInvite?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSuccess,
  onNavigateToInvite
}) => {
  const navigate = useNavigate();
  const { updateCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      const session = data.session;
      const user = data.user;

      if (!user) {
        throw new Error('Sign in failed: User identity not found.');
      }

      const fullName = user.user_metadata?.full_name || email.split('@')[0];
      const authToken = session?.access_token || user.id;

      // 2. Update React Context & Save credentials and session token
      updateCurrentUser({
        id: user.id,
        email,
        name: fullName,
      });

      localStorage.setItem('pulse_auth_token', authToken);
      localStorage.setItem('pulse_user_id', user.id);
      localStorage.setItem('pulse_user_email', email);
      localStorage.setItem('pulse_user_name', fullName);

      // 3. Sync user profile with PostgreSQL backend
      await authService.syncUser({
        email,
        fullName,
      }).catch((syncErr) => console.warn('[Backend User Sync Notice]:', syncErr));

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
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-sm">
          ◇
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight block leading-tight">Pulse</span>
          <span className="text-[10px] text-neutral-400 font-mono block">by Epicordia</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Sign In to Your Account</h1>
        <p className="text-xs text-neutral-500 mt-1">Access your engineering & operations workspaces</p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold flex items-center justify-center gap-2 shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Supabase...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs space-y-2">
          <div>
            <span className="text-neutral-500">Don't have an account yet? </span>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Create New Account
            </button>
          </div>
          {onNavigateToInvite && (
            <div>
              <button
                type="button"
                onClick={onNavigateToInvite}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
              >
                Have an invitation token? Join workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
