import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { Search, Bell, HelpCircle, Settings, ShieldAlert, Moon, Sun, Menu, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setIsSearchOpen, isDarkMode, setIsDarkMode, currentUser, 
    currentOrgSlug, eodEntries, tasks, pushPanel, setActiveScreen, setIsMobileMenuOpen,
    notifications
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const blockedTasks = tasks.filter(t => t.status === 'Blocked' || t.status === 'AtRisk');
  const flaggedEods = eodEntries.filter(e => e.flaggedToManager || e.blockers);
  const unreadNotifs = (notifications || []).filter(n => !n.isRead);
  const totalAlertCount = unreadNotifs.length + blockedTasks.length + flaggedEods.length;

  return (
    <header className="h-14 bg-[#F4F5F7] dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-6 flex items-center justify-between shrink-0 font-sans gap-2 select-none">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => navigate('/select-org')}
          title="Click to switch organization workspace"
        >
          <span className="w-5 h-5 rounded bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-[10px] shadow-xs">◇</span>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 tracking-tight leading-none capitalize">
              {currentOrgSlug || 'Epicordia'}
            </h2>
            <span className="text-[9px] text-neutral-400 font-mono hidden xs:inline flex items-center gap-0.5">
              <Building2 className="w-2.5 h-2.5 opacity-60" /> Switch
            </span>
          </div>
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
      <div className="flex items-center gap-1 sm:gap-3">
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
                          onClick={() => { setShowNotifications(false); setActiveScreen('notifications'); }}
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
                          onClick={() => { setShowNotifications(false); setActiveScreen('pulse'); }}
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
                    onClick={() => { setShowNotifications(false); setActiveScreen('notifications'); }}
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
          onClick={() => setActiveScreen('admin')}
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
