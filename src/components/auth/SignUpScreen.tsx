import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';
import { authService } from '../../services/authService';

export const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { updateCurrentUser } = useApp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the workspace terms.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      const session = data.session;
      const user = data.user;

      if (!user) {
        throw new Error('Sign up failed: User record not created in Supabase.');
      }

      const authToken = session?.access_token || user.id;

      // 2. Update React Context & Store session token in localStorage
      updateCurrentUser({
        id: user.id,
        email,
        name: fullName,
      });

      localStorage.setItem('pulse_auth_token', authToken);
      localStorage.setItem('pulse_user_id', user.id);
      localStorage.setItem('pulse_user_email', email);
      localStorage.setItem('pulse_user_name', fullName);
      localStorage.setItem('pulse_is_new_user', 'true');
      localStorage.removeItem('pulse_tenant_slug');

      // 3. Sync user profile with PostgreSQL backend
      await authService.syncUser({
        email,
        fullName,
      }).catch((syncErr) => console.warn('[Backend User Sync Notice]:', syncErr));

      // Navigate to Organizations page
      navigate('/select-org');
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
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
        <h1 className="text-2xl font-black tracking-tight">Create Your Account</h1>
        <p className="text-xs text-neutral-500 mt-1">Set up your personal credentials for Pulse by Epicordia</p>
      </div>

      {/* Account Registration Form Card */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
        
        {/* Helper Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-mono flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Account creation is separate from organization setup. You will manage your workspace after registering.</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

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
                placeholder="alex@company.com"
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

          <div>
            <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="agreeTerms" className="text-[11px] text-neutral-600 dark:text-neutral-400">
              I agree to the Workspace Terms & Privacy Policy
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account in Supabase...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs">
          <span className="text-neutral-500">Already registered? </span>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Sign In to your Account
          </button>
        </div>
      </div>
    </div>
  );
};
