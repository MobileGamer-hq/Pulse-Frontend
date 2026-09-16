import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, LogOut, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { PulseLogo } from '../common/PulseLogo';
import { WorkspaceGlassLoader } from '../common/WorkspaceGlassLoader';
import { AnimatePresence } from 'framer-motion';

import { organizationService } from '../../services/organizationService';
import { authService } from '../../services/authService';

export const WaitingRoomScreen: React.FC = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { currentUser, setCurrentOrgSlug, setActiveRole, updateOrgMemberStatus, userOrgs, isWorkspaceLoading } = useApp();

  const activeSlug = (orgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia').toLowerCase();
  const matchedOrg = (userOrgs || []).find(o => (o.slug || '').toLowerCase() === activeSlug);
  const orgDisplayName = matchedOrg?.name || (
    activeSlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );

  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [assignedRole, setAssignedRole] = useState<string | null>(null);

  const handleSimulateApproval = async (selectedRole: string = 'Member') => {
    setLoading(true);
    try {
      if (currentUser?.id) {
        await organizationService.approveMember(activeSlug, currentUser.id, selectedRole).catch(() => null);
      }
    } finally {
      setLoading(false);
      setApproved(true);
      setAssignedRole(selectedRole);
      setActiveRole(selectedRole as any);

      if (updateOrgMemberStatus) {
        updateOrgMemberStatus(activeSlug, selectedRole as any, 'APPROVED');
      } else {
        localStorage.setItem(`pulse_org_status_${activeSlug}`, 'APPROVED');
        localStorage.setItem(`pulse_user_role_${activeSlug}`, selectedRole);
      }
    }
  };

  const handleEnterWorkspace = () => {
    localStorage.setItem('pulse_tenant_slug', activeSlug);
    setCurrentOrgSlug(activeSlug);
    navigate(`/${activeSlug}/dashboard`);
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-neutral-950 flex flex-col justify-between p-4 sm:p-8 font-sans text-neutral-900 dark:text-neutral-100 selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PulseLogo size="md" className="shadow-xs" />
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

      {/* Central Waiting Card */}
      <div className="max-w-xl w-full mx-auto my-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-md space-y-6 text-center">
        {!approved ? (
          <>
            {/* Status Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Pending Workspace Approval
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Welcome to {orgDisplayName} Workspace
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
                Your request to join this organization has been submitted. An Administrator or Manager must accept your request and assign your access role before full features are unlocked.
              </p>
            </div>

            {/* Information Summary */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Target Organization:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{orgDisplayName} ({activeSlug})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Account:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{currentUser.email || 'user@company.com'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Membership Status:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Pending Role Assignment
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 space-y-2">
                <div className="font-bold text-neutral-800 dark:text-neutral-200">Demo Testing Toolbar</div>
                <div className="text-[10px]">Simulate Admin/Manager acceptance &amp; role assignment:</div>
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  {['Member', 'TeamLead', 'Manager', 'Executive', 'Admin'].map(role => (
                    <button
                      key={role}
                      disabled={loading}
                      onClick={() => handleSimulateApproval(role)}
                      className="px-2.5 py-1 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-900 dark:text-neutral-100 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Approve as {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => navigate('/select-org')}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Switch Workspace</span>
                </button>
                <button
                  onClick={() => authService.signOut()}
                  className="py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-mono text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Approved Success View */
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                Access Granted!
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                An Admin accepted your request and assigned you the <span className="font-bold text-black dark:text-white uppercase">[{assignedRole}]</span> role.
              </p>
            </div>

            <button
              onClick={handleEnterWorkspace}
              className="w-full py-3.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>ENTER {orgDisplayName.toUpperCase()} WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center text-[10px] font-mono text-neutral-400 py-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
        <span>Pulse by Epicordia • Role-Governed Alignment System</span>
      </div>

      {/* Floating Glass Background Blur Loading Overlay */}
      <AnimatePresence>
        {isWorkspaceLoading && (
          <WorkspaceGlassLoader 
            message={`Loading ${orgDisplayName}`}
            subMessage="Verifying workspace permissions and role clearance..."
          />
        )}
      </AnimatePresence>
    </div>
  );
};
