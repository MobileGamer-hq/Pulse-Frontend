import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowRight, Clock, Building2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const JoinOrgScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addOrg } = useApp();
  const [targetSlug, setTargetSlug] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const slug = targetSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!slug) {
      setError('Please enter a valid workspace slug/subdomain.');
      return;
    }

    setLoading(true);
    try {
      const formattedName = slug.charAt(0).toUpperCase() + slug.slice(1) + ' Workspace';

      const newOrg = {
        id: `org-${Date.now()}`,
        name: formattedName,
        slug: slug,
        role: 'Pending Role Assignment' as const,
        status: 'PENDING' as const,
        membersCount: 1,
        activeProjects: 0
      };

      if (addOrg) {
        addOrg(newOrg);
      } else {
        const storedOrgs = JSON.parse(localStorage.getItem('pulse_user_orgs') || '[]');
        localStorage.setItem('pulse_user_orgs', JSON.stringify([...storedOrgs, newOrg]));
      }

      localStorage.setItem('pulse_is_new_user', 'false');
      localStorage.setItem(`pulse_org_status_${slug}`, 'PENDING');
      localStorage.setItem(`pulse_user_role_${slug}`, 'Pending Role Assignment');
      localStorage.setItem('pulse_tenant_slug', slug);

      setTimeout(() => {
        setLoading(false);
        navigate(`/${slug}/waiting-room`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit join request.');
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
            <label className="block text-[11px] font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1.5">
              Workspace Slug / Subdomain <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={targetSlug}
                onChange={e => { setTargetSlug(e.target.value); setError(null); }}
                placeholder="e.g. acme-corp"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">The slug from pulse.app/slug URL</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1.5">
              Invite Code / Token (Optional)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inviteToken}
                onChange={e => setInviteToken(e.target.value)}
                placeholder="e.g. INV-98241"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>SUBMIT JOIN REQUEST</span>
            <ArrowRight className="w-4 h-4" />
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
            Create New Org →
          </button>
        </div>
      </div>
    </div>
  );
};
