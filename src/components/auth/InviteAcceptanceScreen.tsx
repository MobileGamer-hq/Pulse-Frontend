import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface InviteAcceptanceScreenProps {
  onSuccess?: () => void;
  onComplete?: () => void;
}

export const InviteAcceptanceScreen: React.FC<InviteAcceptanceScreenProps> = ({ onSuccess, onComplete }) => {
  const { setActiveScreen } = useApp();

  const [fullName, setFullName] = useState('Jane Doe');
  const [assignedRole] = useState('Lead Data Analyst');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onComplete) {
      onComplete();
    } else if (onSuccess) {
      onSuccess();
    } else {
      setActiveScreen('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] flex items-center justify-center p-6 font-sans text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Form Column */}
        <div className="p-8 lg:p-12 space-y-6 flex flex-col justify-between">
          <div>
            {/* Header Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-6 h-6 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs shadow-sm">
                ◇
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight block leading-tight">Pulse</span>
                <span className="text-[9px] text-neutral-400 font-mono block">by Epicordia</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              You've been invited to join Acme Corp on Pulse.
            </h1>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Complete your profile setup to access your team's workflows, analytical reports, and strict performance metrics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                Assigned Role
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={assignedRole}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 font-mono text-xs cursor-not-allowed pr-10"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 mt-1 block">Role is defined by your workspace administrator.</span>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase tracking-wider">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-black pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pt-3"
            >
              JOIN WORKSPACE →
            </button>

            <div className="text-center text-[10px] text-neutral-400 font-mono pt-2">
              By joining, you agree to our <a href="#terms" onClick={e => e.preventDefault()} className="underline text-neutral-600">Terms of Service</a> and <a href="#privacy" onClick={e => e.preventDefault()} className="underline text-neutral-600">Privacy Policy</a>.
            </div>
          </form>
        </div>

        {/* Right Blurred Locked Workspace Column */}
        <div className="hidden lg:flex bg-neutral-100 dark:bg-neutral-950 p-8 items-center justify-center relative border-l border-neutral-200 dark:border-neutral-800">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm opacity-50 blur-[2px] space-y-4">
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-24 w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              <div className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold shadow-xl flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Workspace Locked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
