import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Building2, Plus, ArrowRight, Users, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const OrgSwitcherScreen: React.FC = () => {
  const { currentUser, setCurrentOrgSlug } = useApp();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');

  const ORGANIZATIONS = [
    {
      id: 'org-epicordia',
      name: 'Epicordia Technologies',
      slug: 'epicordia',
      role: 'Manager',
      membersCount: 24,
      isCurrent: true,
      activeProjects: 5
    },
    {
      id: 'org-acme',
      name: 'Acme Laboratories',
      slug: 'acme',
      role: 'Executive',
      membersCount: 18,
      isCurrent: false,
      activeProjects: 3
    },
    {
      id: 'org-stark',
      name: 'Stark Enterprises',
      slug: 'stark',
      role: 'Member',
      membersCount: 42,
      isCurrent: false,
      activeProjects: 8
    }
  ];

  const handleSelectOrg = (slug: string) => {
    setCurrentOrgSlug(slug);
    navigate(`/${slug}/dashboard`);
  };

  const handleJoinInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      navigate(`/invite/${encodeURIComponent(inviteCode.trim())}`);
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
            <div className="text-[10px] text-neutral-500 font-mono">Multi-Tenant Alignment Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{currentUser.name}</div>
            <div className="text-[10px] text-neutral-500 font-mono">{currentUser.email || 'user@epicordia.com'}</div>
          </div>
        </div>
      </div>

      {/* Main Switcher Card */}
      <div className="max-w-2xl w-full mx-auto my-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Select Your Workspace
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            Switch between authorized organization pulses or launch a new tenant.
          </p>
        </div>

        {/* Organizations List Grid */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block px-1">
            Your Authorized Workspaces ({ORGANIZATIONS.length})
          </span>

          <div className="grid grid-cols-1 gap-3 font-sans">
            {ORGANIZATIONS.map(org => (
              <div
                key={org.id}
                onClick={() => handleSelectOrg(org.slug)}
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer border transition-all flex items-center justify-between gap-4 group ${
                  org.isCurrent
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
                        {org.name}
                      </span>
                      {org.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black text-white dark:bg-white dark:text-black shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 mt-1">
                      <span>pulse.com/{org.slug}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {org.membersCount} members</span>
                      <span>•</span>
                      <span>{org.activeProjects} projects</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
                    {org.role}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join or Create Workspace Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Create Workspace Button */}
          <button
            onClick={() => navigate('/register')}
            className="p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Join with Invite Code Form */}
          <form onSubmit={handleJoinInvite} className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Enter invite token..."
              className="flex-1 px-3.5 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inviteCode.trim()}
              className="px-4 py-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl font-mono text-xs font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center text-[10px] font-mono text-neutral-400 py-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
        <span>Pulse 2.0 • Multi-Tenant Enterprise Alignment Engine</span>
        <span>Logged in as {currentUser.email || 'user@epicordia.com'}</span>
      </div>
    </div>
  );
};
