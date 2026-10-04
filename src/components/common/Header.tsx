import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { PulseLogo } from './PulseLogo';
import { Search, Bell, HelpCircle, Settings, ShieldAlert, Moon, Sun, Menu, Building2, CheckCircle2, AlertTriangle, Plus, ChevronsUpDown, ChevronRight, Check, Key, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setIsSearchOpen, isOpsOpen, setIsOpsOpen, isDarkMode, setIsDarkMode, currentUser, 
    currentOrgSlug, setCurrentOrgSlug, currentOrgName, userOrgs, eodEntries, tasks, pushPanel, setActiveScreen, setIsMobileMenuOpen,
    notifications
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const isMeaningfulBlocker = (text?: string): boolean => {
    if (!text) return false;
    const t = text.trim().toLowerCase();
    return t !== '' && t !== 'none' && t !== 'no' && t !== 'nil' && t !== 'n/a' && t !== 'no blockers' && t !== 'none.';
  };

  const blockedTasks = tasks.filter(t => t.status === 'Blocked' || t.status === 'AtRisk');
  const flaggedEods = eodEntries.filter(e => isMeaningfulBlocker(e.blockers) || (e.flaggedToManager && isMeaningfulBlocker(e.blockers)));
  const unreadNotifs = (notifications || []).filter(n => !n.isRead);
  const totalAlertCount = unreadNotifs.length + blockedTasks.length + flaggedEods.length;

  const handleSwitchOrg = (slug: string) => {
    const cleanSlug = slug.toLowerCase();
    localStorage.setItem('pulse_tenant_slug', cleanSlug);
    setCurrentOrgSlug(cleanSlug);
    setShowOrgDropdown(false);
    navigate(`/${cleanSlug}/dashboard`);
  };

  return (
    <header className="h-14 bg-[#F4F5F7] dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-6 flex items-center justify-between shrink-0 font-sans gap-2 select-none relative">
      {/* Left Title & Mobile Menu Trigger & Org Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Organization Switcher Dropdown Trigger */}
        <div className="relative">
          <button 
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-2xs group" 
            onClick={() => setShowOrgDropdown(prev => !prev)}
            title="Switch workspace or create organization"
          >
            <PulseLogo size="xs" />
            <div className="flex items-center gap-1.5 text-left min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 tracking-tight leading-none truncate max-w-[120px] sm:max-w-[180px]">
                {currentOrgName}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 shrink-0 transition-colors" />
            </div>
          </button>

          {/* Org Switcher Popover Dropdown */}
          <AnimatePresence>
            {showOrgDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowOrgDropdown(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-72 sm:w-80 p-2.5 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 text-left font-sans text-xs space-y-2"
                >
                  {/* Current Active Workspace Summary */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Current Workspace</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        Active
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {currentOrgName}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      pulse.epicordia.com/{currentOrgSlug || 'epicordia'}
                    </div>
                  </div>

                  {/* List of user workspaces for 1-click switch */}
                  {userOrgs && userOrgs.length > 1 && (
                    <div className="space-y-1 pt-1">
                      <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                        Switch Organization
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {userOrgs.map(org => {
                          const isCurrent = (org.slug || '').toLowerCase() === (currentOrgSlug || '').toLowerCase();
                          return (
                            <button
                              key={org.id || org.slug}
                              onClick={() => handleSwitchOrg(org.slug)}
                              className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                                isCurrent 
                                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold' 
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  <Building2 className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs truncate capitalize">{org.name || org.slug}</div>
                                  <div className="text-[10px] text-neutral-400 font-mono truncate">pulse.epicordia.com/{org.slug}</div>
                                </div>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Navigation Buttons */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                    <button
                      onClick={() => {
                        setShowOrgDropdown(false);
                        navigate('/select-org');
                      }}
                      className="w-full p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-neutral-500" />
                        <span>All Organizations & Switcher</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>

                    <button
                      onClick={() => {
                        setShowOrgDropdown(false);
                        navigate('/create-org');
                      }}
                      className="w-full p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 flex items-center justify-between transition-opacity cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Create New Organization</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setShowOrgDropdown(false);
                        navigate('/join-org');
                      }}
                      className="w-full p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Key className="w-4 h-4 text-neutral-400" />
                        <span>Join via Token or Link</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center Search Input - Expanded on sm+, compact icon on mobile */}
      <div className="flex-1 max-w-sm mx-2">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-400 flex items-center justify-between hover:border-neutral-400 transition-colors shadow-none"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate hidden xs:inline">Search tasks, projects, or people...</span>
            <span className="truncate xs:hidden">Search...</span>
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono text-neutral-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-1 sm:gap-2.5">
        {/* Ops AI Trigger Button */}
        <button
          onClick={() => setIsOpsOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            isOpsOpen
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
              : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
          }`}
          title="Open Ops AI Operational Manager (Cmd+J)"
        >
          <Bot className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
          <span className="hidden xs:inline">Ops</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[9px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-500">
            ⌘J
          </kbd>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(prev => !prev)}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className={`p-2 rounded-lg border transition-colors relative ${
              totalAlertCount > 0
                ? 'border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            {totalAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[9px] font-bold">
                {totalAlertCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 mt-2 w-72 sm:w-80 p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 text-left text-xs font-mono"
              >
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center font-sans">
                  <span>Alerts &amp; Notifications</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {totalAlertCount > 0 ? `${totalAlertCount} active` : '0 active'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto font-sans">
                  {totalAlertCount === 0 ? (
                    <div className="p-4 text-center text-neutral-400 font-mono text-xs flex flex-col items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>All caught up! No active alerts.</span>
                    </div>
                  ) : (
                    <>
                      {unreadNotifs.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            setActiveScreen('notifications');
                            navigate(`/${currentOrgSlug || 'epicordia'}/notifications`);
                          }}
                          className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-neutral-400"
                        >
                          <div className="flex items-center justify-between text-neutral-900 dark:text-neutral-100 font-bold font-mono text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400 uppercase tracking-wider">{n.type?.replace('_', ' ')}</span>
                            <span className="text-neutral-400 font-normal">{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                          </div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1">{n.title}</div>
                          {n.body && <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>}
                        </div>
                      ))}

                      {flaggedEods.map(e => (
                        <div 
                          key={e.id} 
                          onClick={() => {
                            setShowNotifications(false);
                            setActiveScreen('pulse');
                            navigate(`/${currentOrgSlug || 'epicordia'}/pulse`);
                          }}
                          className="p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400 text-xs">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Manager Blocker Flag
                          </div>
                          <div className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                            {e.userName} reported: "{e.blockers}"
                          </div>
                        </div>
                      ))}

                      {blockedTasks.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => { setShowNotifications(false); pushPanel({ type: 'task', id: t.id }); }}
                          className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-400"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-red-600 text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                              {t.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">{t.blockedReason || t.description || 'Task flagged as blocked'}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      setActiveScreen('notifications');
                      navigate(`/${currentOrgSlug || 'epicordia'}/notifications`);
                    }}
                    className="text-xs font-bold font-mono text-neutral-800 dark:text-neutral-200 hover:underline"
                  >
                    Open Notification Center →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Support Help Icon */}
        <button
          onClick={() => setActiveScreen('support')}
          className="hidden sm:block p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          title="Support & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => {
            setActiveScreen('admin');
            navigate(`/${currentOrgSlug || 'epicordia'}/admin`);
          }}
          className="hidden sm:block p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Pill */}
        <div className="pl-1 sm:pl-2 border-l border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <UserAvatar
            name={currentUser.name}
            avatarUrl={currentUser.avatarUrl}
            size="sm"
            onClick={() => pushPanel({ type: 'person', id: currentUser.id })}
          />
        </div>
      </div>
    </header>
  );
};
