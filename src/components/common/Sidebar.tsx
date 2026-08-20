import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, FolderGit2, CheckSquare, BarChart3, 
  Target, Users, Settings, HelpCircle, Archive, Plus, X, Activity, Network,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { 
    activeScreen, setActiveScreen, 
    isMobileMenuOpen, setIsMobileMenuOpen,
    isSidebarCollapsed, setIsSidebarCollapsed,
    currentOrgSlug
  } = useApp();

  const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'relationships', label: 'Relationships', icon: Network },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'pulse', label: 'Daily Pulse', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'team', label: 'Team', icon: Users }
  ];

  const handleNavClick = (id: string) => {
    setActiveScreen(id);
    setIsMobileMenuOpen(false);
    navigate(`/${currentOrgSlug || 'epicordia'}/${id}`);
  };

  const handleNewInitiative = () => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'project' } }));
  };

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className={`flex flex-col justify-between h-full font-sans transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
      <div className="space-y-4">
        {/* Top Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-1'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center text-xs tracking-tighter shadow-sm shrink-0">
              ◇
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 tracking-tight">Pulse</div>
                <div className="text-[10px] text-neutral-500 font-mono">by Epicordia</div>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="hidden md:flex p-1.5 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Close button visible only on mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Initiative Button */}
        <button
          onClick={handleNewInitiative}
          title={isCollapsed ? 'New Initiative' : undefined}
          className={`w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg font-mono text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm ${
            isCollapsed ? 'px-0' : 'px-3'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>New Initiative</span>}
        </button>

        {/* Navigation Menu */}
        <nav className="space-y-1 pt-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`relative w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
                } rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility Menu */}
      <div className="space-y-1 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => handleNavClick('admin')}
          title={isCollapsed ? 'Settings' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
          } rounded-lg text-xs font-semibold transition-all ${
            activeScreen === 'admin'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={() => handleNavClick('support')}
          title={isCollapsed ? 'Support' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
          } rounded-lg text-xs font-semibold transition-all ${
            activeScreen === 'support'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Support</span>}
        </button>

        <button
          onClick={() => handleNavClick('archive')}
          title={isCollapsed ? 'Archive' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
          } rounded-lg text-xs font-semibold transition-all ${
            activeScreen === 'archive'
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
          }`}
        >
          <Archive className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Archive</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex ${
        isSidebarCollapsed ? 'w-16' : 'w-56'
      } bg-[#F4F5F7] dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col shrink-0 transition-all duration-300 ease-in-out`}>
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full h-full bg-[#F4F5F7] dark:bg-neutral-900 shadow-2xl z-10 overflow-y-auto"
            >
              {renderSidebarContent(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
