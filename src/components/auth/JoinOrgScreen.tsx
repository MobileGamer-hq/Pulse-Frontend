import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowRight, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PulseLogo } from '../common/PulseLogo';
import { organizationService } from '../../services/organizationService';

export const JoinOrgScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentOrgSlug, refreshWorkspaceData } = useApp();
  const [targetSlug, setTargetSlug] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = inviteToken.trim();
    const slug = targetSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (!token && !slug) {
      setError('Please enter a workspace slug or an invitation token.');
      return;
    }

    setLoading(true);
    try {
      if (token) {
        // 1. Accept by invitation token
        const res = await organizationService.acceptInviteByToken(token);
        const joinedSlug = res?.orgSlug || slug || 'epicordia';

        localStorage.setItem('pulse_tenant_slug', joinedSlug);
        localStorage.setItem(`pulse_org_status_${joinedSlug}`, 'APPROVED');
        localStorage.setItem('pulse_is_new_user', 'false');
        setCurrentOrgSlug(joinedSlug);

        await refreshWorkspaceData(false).catch(() => null);
        navigate(`/${joinedSlug}/dashboard`);
      } else {
        // 2. Submit join request to workspace waiting room
        const res = await organizationService.joinOrganization(slug);
        const resolvedSlug = res?.orgSlug || slug;

        localStorage.setItem('pulse_tenant_slug', resolvedSlug);
        localStorage.setItem(`pulse_org_status_${resolvedSlug}`, 'PENDING');
        localStorage.setItem('pulse_is_new_user', 'false');
        setCurrentOrgSlug(resolvedSlug);

        await refreshWorkspaceData(false).catch(() => null);
        navigate(`/${resolvedSlug}/waiting-room`);
      }
    } catch (err: any) {
      console.warn('[JoinOrgScreen error]:', err);
      setError(err.message || 'Failed to process workspace join request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] flex flex-col items-center justify-center p-4 font-sans text-neutral-900 dark:text-neutral-100">
      {/* Header Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <PulseLogo size="md" />
        <div>
          <span className="font-extrabold text-lg tracking-tight block leading-tight">Pulse</span>
          <span className="text-[10px] text-neutral-400 font-mono block">by Epicordia</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Join Existing Organization</h1>
        <p className="text-xs text-neutral-500 mt-1">Enter workspace credentials or invite code to request membership</p>
      </div>

      {/* Main Join Card */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
        
        {/* Info Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-mono flex items-start gap-2.5">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Requesting to join an organization places your account in a <strong>Waiting Room</strong> until an Admin accepts your membership and sets your role.</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1.5 font-mono">
              Workspace URL Route (Slug)
            </label>
            <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden focus-within:border-neutral-900 dark:focus-within:border-white transition-colors">
              <span className="pl-3.5 pr-0.5 font-mono text-neutral-400 text-xs select-none">
                pulse.epicordia.com/
              </span>
              <input
                type="text"
                value={targetSlug}
                onChange={e => { setTargetSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setError(null); }}
                placeholder="e.g. acme-corp"
                className="flex-1 py-2.5 pr-3.5 pl-0.5 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-1 block">Enter workspace route to request membership, or provide an invite token below</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1.5">
              Invite Code / Token
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inviteToken}
                onChange={e => { setInviteToken(e.target.value); setError(null); }}
                placeholder="e.g. INVITE-98241 or access token"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono text-xs"
              />
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-1 block">If you received an invite code or link, paste the token here</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{inviteToken.trim() ? 'ACCEPT INVITATION & JOIN' : 'SUBMIT JOIN REQUEST'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono">
          <button
            type="button"
            onClick={() => navigate('/select-org')}
            className="font-bold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
          >
            ← Back to Workspaces
          </button>

          <button
            type="button"
            onClick={() => navigate('/create-org')}
            className="font-bold text-black dark:text-white hover:underline cursor-pointer"
          >
            Create New Organization →
          </button>
        </div>
      </div>
    </div>
  );
};
