import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Building2, Plus, ArrowRight, Users, ChevronRight, Clock, 
  Key, Check, X, Mail, Loader2, AlertTriangle, User, LogOut, 
  Sun, Moon, Edit2, ChevronDown, CheckCircle2
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { PulseLogo } from '../common/PulseLogo';
import { WorkspaceGlassLoader } from '../common/WorkspaceGlassLoader';
import { AnimatePresence, motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';

const PRESET_AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#F43F5E', 
  '#EF4444', '#EA580C', '#D97706', '#059669', 
  '#0D9488', '#0891B2', '#0284C7', '#2563EB', 
  '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4'
];

export const OrgSwitcherScreen: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUser,
    currentOrgSlug, 
    setCurrentOrgSlug, 
    userOrgs, 
    users,
    pendingInvites, 
    inAppAcceptInvite, 
    inAppDeclineInvite,
    isWorkspaceLoading,
    refreshWorkspaceData,
    isDarkMode,
    setIsDarkMode
  } = useApp();
  const navigate = useNavigate();

  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Profile Menu & Edit Modal State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editTitle, setEditTitle] = useState(currentUser?.title || currentUser?.role || 'Member');
  const [editAvatarColor, setEditAvatarColor] = useState(currentUser?.avatarColor || '#4F46E5');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync edit form state when modal opens or currentUser changes
  React.useEffect(() => {
    setEditName(currentUser?.name || '');
    setEditEmail(currentUser?.email || '');
    setEditTitle(currentUser?.title || currentUser?.role || 'Member');
    setEditAvatarColor(currentUser?.avatarColor || '#4F46E5');
    setEditAvatarUrl(currentUser?.avatarUrl || '');
  }, [currentUser, showEditProfileModal]);

  const handleOpenEditProfile = () => {
    setShowProfileMenu(false);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingProfile(true);
    try {
      const updates = {
        name: editName.trim(),
        email: editEmail.trim(),
        title: editTitle.trim(),
        avatarColor: editAvatarColor,
        avatarUrl: editAvatarUrl.trim() || undefined
      };

      updateCurrentUser(updates);
      localStorage.setItem('pulse_user_name', updates.name);
      if (updates.email) localStorage.setItem('pulse_user_email', updates.email);

      // Persist to Supabase if logged in
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updates.name,
            title: updates.title,
            avatar_color: updates.avatarColor,
            avatar_url: updates.avatarUrl
          }
        });
      } catch (err) {
        console.warn('Supabase auth metadata update error:', err);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditProfileModal(false);
      }, 1000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Always refresh organization memberships on mount to ensure fresh state
  React.useEffect(() => {
    refreshWorkspaceData(false);
  }, []);

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
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-neutral-950 flex flex-col justify-between p-4 sm:p-8 font-sans text-neutral-900 dark:text-neutral-100 selection:bg-neutral-200 dark:selection:bg-neutral-800 relative">
      
      {/* Header Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PulseLogo size="lg" className="shadow-xs" />
          <div>
            <div className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">Pulse</div>
            <div className="text-[10px] text-neutral-500 font-mono">by Epicordia</div>
          </div>
        </div>

        {/* Interactive User Profile Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 hover:bg-white dark:hover:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-2xs group text-left"
            title="Open user profile & preferences"
          >
            <UserAvatar 
              name={currentUser.name} 
              avatarUrl={currentUser.avatarUrl} 
              color={currentUser.avatarColor}
              size="sm" 
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <ChevronDown className={`w-3 h-3 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">{currentUser.email || 'user@company.com'}</div>
            </div>
          </button>

          {/* User Profile Popover Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 text-left font-sans text-xs space-y-1.5"
                >
                  {/* User Preview Summary */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 space-y-1">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar 
                        name={currentUser.name} 
                        avatarUrl={currentUser.avatarUrl} 
                        color={currentUser.avatarColor}
                        size="md" 
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono truncate">{currentUser.email}</div>
                        <div className="text-[9px] font-bold text-neutral-400 font-mono uppercase mt-0.5">{currentUser.title || currentUser.role || 'Member'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold flex items-center justify-between transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-neutral-500" />
                      <span>Edit Profile &amp; Avatar</span>
                    </div>
                    <Edit2 className="w-3 h-3 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isDarkMode;
                      setIsDarkMode(next);
                      localStorage.setItem('pulse_theme', next ? 'dark' : 'light');
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold flex items-center justify-between transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-500" />}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">{isDarkMode ? 'Dark' : 'Light'}</span>
                  </button>

                  <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => authService.signOut()}
                      className="w-full p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-xs"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
                          Invited by {inv.creator?.fullName || inv.creator?.email || 'Admin'} • pulse.epicordia.com/{org.slug}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={isProcessing}
                        onClick={async () => {
                          try {
                            setProcessingInviteId(inv.id);
                            const acceptRes = await inAppAcceptInvite(inv.id);
                            const targetSlug = acceptRes?.orgSlug || org.slug || 'epicordia';
                            localStorage.setItem('pulse_tenant_slug', targetSlug);
                            localStorage.setItem(`pulse_org_status_${targetSlug}`, 'APPROVED');
                            setCurrentOrgSlug(targetSlug);
                            navigate(`/${targetSlug}/dashboard`);
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
                          <span>pulse.epicordia.com/{org.slug}</span>
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfileModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 z-10 overflow-hidden font-sans space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                      User Profile &amp; Identity
                    </h2>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Update your name, job title, and avatar appearance across Pulse.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Live Avatar Preview & Accent Picker */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <UserAvatar
                      name={editName || 'User'}
                      avatarUrl={editAvatarUrl}
                      color={editAvatarColor}
                      size="xl"
                      className="shadow-sm ring-4 ring-white dark:ring-neutral-800"
                    />
                  </div>

                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Avatar Accent Color
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {editAvatarColor}
                      </span>
                    </div>
                    <div className="grid grid-cols-8 gap-2.5 sm:gap-3 py-1">
                      {PRESET_AVATAR_COLORS.map(c => {
                        const isSelected = editAvatarColor === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditAvatarColor(c)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer relative flex items-center justify-center shrink-0 ${
                              isSelected 
                                ? 'scale-110 ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-neutral-900 shadow-sm' 
                                : 'hover:scale-105 opacity-85 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Somtochukwu Duru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Job Title / Role
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="e.g. Lead Engineer"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Photo Avatar URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={e => setEditAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile || !editName.trim()}
                    className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Glass Background Blur Loading Overlay */}
      <AnimatePresence>
        {isWorkspaceLoading && (
          <WorkspaceGlassLoader 
            message="Loading Your Organizations"
            subMessage="Retrieving your workspaces, permissions & pending invitations..."
          />
        )}
      </AnimatePresence>
    </div>
  );
};
