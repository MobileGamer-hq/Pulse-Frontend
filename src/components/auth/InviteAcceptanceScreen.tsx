import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Key, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface InviteAcceptanceScreenProps {
  onSuccess?: () => void;
  onComplete?: () => void;
}

export const InviteAcceptanceScreen: React.FC<InviteAcceptanceScreenProps> = ({ onSuccess, onComplete }) => {
  const { setActiveScreen } = useApp();
  const params = useParams<{ token?: string }>();

  const urlToken = params.token && params.token !== 'demo' ? params.token : '';

  const [inviteToken, setInviteToken] = useState(urlToken);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Credentials State
  const [fullName, setFullName] = useState(localStorage.getItem('pulse_user_name') || '');
  const [email, setEmail] = useState(localStorage.getItem('pulse_user_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('pulse_auth_token');
    const userId = localStorage.getItem('pulse_user_id');
    if (token && userId) {
      setIsAuthenticated(true);
    }
  }, []);

  // Step A: Handle Auth (Login or Register)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const userName = fullName.trim() || email.split('@')[0];

      localStorage.setItem('pulse_auth_token', 'demo-auth-token');
      localStorage.setItem('pulse_user_id', 'usr-active');
      localStorage.setItem('pulse_user_email', email);
      localStorage.setItem('pulse_user_name', userName);

      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step B: Handle Accept Invitation
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inviteToken.trim()) {
      setError('Please enter your invitation code/token.');
      return;
    }

    setLoading(true);
    try {
      const joinedSlug = 'epicordia';
      localStorage.setItem('pulse_tenant_slug', joinedSlug);

      if (onComplete) {
        onComplete();
      } else if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = `/${joinedSlug}/dashboard`;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] flex items-center justify-center p-6 font-sans text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Form Column */}
        <div className="p-8 lg:p-12 space-y-6 flex flex-col justify-between">
          <div>
            {/* Header Logo */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs shadow-sm">
                  ◇
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight block leading-tight">Pulse</span>
                  <span className="text-[9px] text-neutral-400 font-mono block">by Epicordia</span>
                </div>
              </div>

              <button
                onClick={() => setActiveScreen('welcome')}
                className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                ← Welcome
              </button>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              Accept Team Invitation
            </h1>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              {!isAuthenticated
                ? 'Step 1: Sign in or create an account to accept your organization invitation.'
                : 'Step 2: Enter invitation token to join your workspace.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* If NOT Authenticated: Show Login / Signup Tab Form */}
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                    authMode === 'signin'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                {authMode === 'signup' && (
                  <div>
                    <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => { setFullName(e.target.value); setError(null); }}
                        placeholder="e.g. Somto Member"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null); }}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-black pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : authMode === 'signup' ? 'CREATE ACCOUNT & CONTINUE →' : 'SIGN IN & CONTINUE →'}
                </button>
              </form>
            </div>
          ) : (
            /* If Authenticated: Show Logged In Profile + Token Form */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Authenticated as {localStorage.getItem('pulse_user_name') || 'User'}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      {localStorage.getItem('pulse_user_email')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('pulse_auth_token');
                    setIsAuthenticated(false);
                  }}
                  className="text-[10px] font-mono text-neutral-400 hover:text-red-500 underline"
                >
                  Switch Account
                </button>
              </div>

              <form onSubmit={handleAcceptInvite} className="space-y-4 text-xs">
                <div>
                  <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                    Invitation Code / Token <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={inviteToken}
                      onChange={e => { setInviteToken(e.target.value); setError(null); }}
                      placeholder="Enter invite code (e.g. INV-9821)"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      ACCEPT INVITATION &amp; JOIN WORKSPACE <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column Visual Workspace Preview */}
        <div className="hidden lg:flex bg-neutral-100 dark:bg-neutral-950 p-8 items-center justify-center relative border-l border-neutral-200 dark:border-neutral-800">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs">
                ◇
              </div>
              <div>
                <div className="font-bold text-xs">Multi-Tenant Alignment</div>
                <div className="text-[10px] font-mono text-neutral-400">Join multiple teams seamlessly</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-[11px] font-mono space-y-1 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              <div>✓ Belong to multiple organizations</div>
              <div>✓ Switch workspaces without logging out</div>
              <div>✓ Retain personal profile &amp; credentials</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
