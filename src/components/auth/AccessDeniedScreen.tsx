import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, Send, CheckCircle2, Building2, Lock } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface AccessDeniedScreenProps {
  orgSlug?: string;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ orgSlug = 'organization' }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const formattedOrgName = orgSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const handleRequestAccess = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setRequestSent(true);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans text-neutral-900 dark:text-neutral-100 selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Top Warning Icon Header */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[11px] font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" /> Access Restricted
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Access Denied
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
            You don't have access to <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{formattedOrgName}</strong>'s Pulse. Please request access from an administrator.
          </p>
        </div>

        {/* User Identity Card */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3 text-left">
          <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate text-neutral-900 dark:text-neutral-100">{currentUser.name}</div>
            <div className="text-[11px] text-neutral-500 font-mono truncate">{currentUser.email || 'user@epicordia.com'}</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
            {currentUser.role}
          </span>
        </div>

        {/* Request Access Action */}
        {requestSent ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Access Request Sent to {formattedOrgName} Admin</span>
          </div>
        ) : (
          <button
            onClick={handleRequestAccess}
            disabled={isSending}
            className="w-full py-3 px-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-mono text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isSending ? (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Request Access from Administrator</span>
              </>
            )}
          </button>
        )}

        {/* Navigation Shortcuts */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono">
          <button
            onClick={() => navigate('/select-org')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Switch Workspace</span>
          </button>

          <button
            onClick={() => navigate('/epicordia/dashboard')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
