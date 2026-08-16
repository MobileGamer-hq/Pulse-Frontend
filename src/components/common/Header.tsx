import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EntityLink } from './EntityLink';
import { Search, Bell, HelpCircle, Settings, ShieldAlert, Moon, Sun, Menu, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isElectron } from '../../utils/platform';

export const Header: React.FC = () => {
  const { 
    setIsSearchOpen, isDarkMode, setIsDarkMode, currentUser, 
    eodEntries, tasks, pushPanel, setActiveScreen, setIsMobileMenuOpen 
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const flaggedEods = eodEntries.filter(e => e.flaggedToManager);
  const inElectron = isElectron();

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

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveScreen('dashboard')}>
          <span className="w-5 h-5 rounded bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-[10px]">◇</span>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">Pulse Core</h2>
            {inElectron ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-medium">
                <Monitor className="w-2.5 h-2.5" /> Desktop
              </span>
            ) : (
              <span className="text-[9px] text-neutral-400 font-mono hidden xs:inline">by Epicordia</span>
            )}
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
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 mt-2 w-72 sm:w-80 p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 text-left text-xs font-mono"
              >
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center font-sans">
                  <span>Alerts &amp; Notifications</span>
                  <span className="text-[10px] text-neutral-400">4 active</span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  <div 
                    onClick={() => { setShowNotifications(false); setActiveScreen('notifications'); }}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-neutral-400"
                  >
                    <div className="flex items-center justify-between text-red-600 font-bold">
                      <span>⚠️ CRITICAL BLOCKER</span>
                      <span className="text-[9px] text-neutral-400 font-normal">Just now</span>
                    </div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-sans">TSK-892 Database Migration Failure</div>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Database migration script failing on staging environment.</p>
                  </div>

                  {flaggedEods.map(e => (
                    <div key={e.id} className="p-2 rounded bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                        <ShieldAlert className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                        Manager Blocker Flag
                      </div>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                        {e.userName} reported: "{e.blockers}"
                      </div>
                    </div>
                  ))}

                  {blockedTasks.map(t => (
                    <div key={t.id} className="p-2 rounded bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">Blocked Task</span>
                        <EntityLink type="task" id={t.id} />
                      </div>
                      <p className="text-[11px] text-neutral-500">{t.blockedReason}</p>
                    </div>
                  ))}
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
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            onClick={() => pushPanel({ type: 'person', id: currentUser.id })}
            className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 cursor-pointer"
          />
        </div>
      </div>
    </header>
  );
};
