import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Building2, Plus, ArrowRight, Users, ChevronRight, Clock, Key, Check, X, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const OrgSwitcherScreen: React.FC = () => {
  const { 
    currentUser, 
    currentOrgSlug, 
    setCurrentOrgSlug, 
    userOrgs, 
    users,
    pendingInvites, 
    inAppAcceptInvite, 
    inAppDeclineInvite 
  } = useApp();
  const navigate = useNavigate();

  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const organizations = userOrgs || [];

  const handleSelectOrg = (org: any) => {
    const slug = (org.slug || 'epicordia').toLowerCase();
    const status = org.status || localStorage.getItem(`pulse_org_status_${slug}`) || 'APPROVED';

    localStorage.setItem('pulse_tenant_slug', slug);
    setCurrentOrgSlug(slug);

    if (status === 'PENDING') {
      navigate(`/${slug}/waiting-room`);
    } else {
      navigate(`/${slug}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-neutral-950 flex flex-col justify-between p-4 sm:p-8 font-sans text-neutral-900 dark:text-neutral-100 selection:bg-neutral-200 dark:selection:bg-neutral-800">
      
      {/* Header Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center text-sm tracking-tighter shadow-md">
            ◇
          </div>
          <div>
            <div className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">Pulse</div>
            <div className="text-[10px] text-neutral-500 font-mono">by Epicordia</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{currentUser.name}</div>
            <div className="text-[10px] text-neutral-500 font-mono">{currentUser.email || 'user@company.com'}</div>
          </div>
        </div>
      </div>

      {/* Main Switcher Content */}
      <div className="max-w-2xl w-full mx-auto my-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            {organizations.length > 0 ? 'Select Your Workspace' : 'Welcome to Pulse!'}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            {organizations.length > 0
              ? 'Select an organization pulse to enter or launch a new workspace.'
              : 'You do not belong to any organization yet. Create a new organization or accept an invitation below.'}
          </p>
        </div>

        {actionError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Pending Workspace Invitations Section */}
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Workspace Invitations ({pendingInvites.length})
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Action required
              </span>
            </div>

            <div className="space-y-3">
              {pendingInvites.map((inv: any) => {
                const org = inv.organization || {};
                const isProcessing = processingInviteId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center font-extrabold text-lg shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {org.name || 'Workspace'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0">
                            Role: {inv.presetRole ? inv.presetRole.toUpperCase() : 'MEMBER'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500 mt-1">
                          Invited by {inv.creator?.fullName || inv.creator?.email || 'Admin'} • pulse.app/{org.slug}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={isProcessing}
                        onClick={async () => {
                          try {
                            setProcessingInviteId(inv.id);
                            await inAppAcceptInvite(inv.id);
                            localStorage.setItem('pulse_tenant_slug', org.slug);
                            setCurrentOrgSlug(org.slug);
                            navigate(`/${org.slug}/dashboard`);
                          } catch (err: any) {
                            setActionError(err.message || 'Failed to accept invitation');
                            setProcessingInviteId(null);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Accept</span>
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={async () => {
                          try {
                            setProcessingInviteId(inv.id);
                            await inAppDeclineInvite(inv.id);
                            setProcessingInviteId(null);
                          } catch (err: any) {
                            setActionError(err.message || 'Failed to decline invitation');
                            setProcessingInviteId(null);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 font-mono text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Organizations List Grid OR Empty State */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Your Workspaces ({organizations.length})
            </span>
          </div>

          {organizations.length === 0 ? (
            /* Empty State for New Account with 0 Orgs */
            <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <Building2 className="w-6 h-6 text-neutral-500" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">No Organizations Found</div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-mono">
                  You have registered your account, but you haven't created or joined an organization yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 font-sans">
              {organizations.map((org: any) => {
                const isCurrent = (org.slug || '').toLowerCase() === currentOrgSlug.toLowerCase();
                const isPending = org.status === 'PENDING';

                return (
                  <div
                    key={org.id || org.slug}
                    onClick={() => handleSelectOrg(org)}
                    className={`p-4 sm:p-5 rounded-2xl cursor-pointer border transition-all flex items-center justify-between gap-4 group ${
                      isCurrent
                        ? 'bg-white dark:bg-neutral-900 border-black dark:border-white shadow-md'
                        : 'bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-900 dark:text-neutral-100 text-lg shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {org.name || org.slug}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black text-white dark:bg-white dark:text-black shrink-0">
                              Active
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Waiting Room
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 mt-1">
                          <span>pulse.app/{org.slug}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {((org.slug || '').toLowerCase() === (currentOrgSlug || '').toLowerCase() && users.length > 0)
                              ? Math.max(org.membersCount || 0, users.length)
                              : (org.membersCount !== undefined ? org.membersCount : 1)} members
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg ${
                        isPending 
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {org.role || 'Member'}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons: Create Org vs Join Org */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => navigate('/create-org')}
            className="p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-between shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/join-org')}
            className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-neutral-500" />
              <span>Join via Token or Slug</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center text-[10px] font-mono text-neutral-400 py-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
        <span>Pulse by Epicordia • Enterprise Alignment Engine</span>
        <span>Logged in as {currentUser.email || 'user@company.com'}</span>
      </div>
    </div>
  );
};
