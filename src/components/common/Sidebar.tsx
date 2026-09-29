import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, FolderGit2, CheckSquare, BarChart3, 
  Target, Users, Settings, HelpCircle, Archive, Plus, X, Activity, Network,
  PanelLeftClose, PanelLeftOpen, LogOut, FileText, Building2, ChevronDown, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PulseLogo } from './PulseLogo';
import { authService } from '../../services/authService';

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
    currentOrgSlug, currentOrgName, activeRole
  } = useApp();

  const isCompanyAdmin = ['Admin', 'Executive', 'Manager'].includes(activeRole);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);


  const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'relationships', label: 'Relationships', icon: Network },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'pulse', label: 'Daily Pulse', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'team', label: 'Team', icon: Users }
  ];

  const handleNavClick = (id: string) => {
    setActiveScreen(id);
    setIsMobileMenuOpen(false);
    navigate(`/${currentOrgSlug || 'epicordia'}/${id}`);
  };

  const renderSidebarContent = (isCollapsed: boolean, isMobile = false) => (
    <div className={`flex flex-col justify-between h-full font-sans transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
      <div className="space-y-4">
        {/* Top Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-1'}`}>
          <div className="flex items-center gap-3">
            <PulseLogo size="md" className="shadow-xs shrink-0" />
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

        {/* Navigation Menu */}
        <nav className="space-y-1 pt-1">
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
                } rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
                {isActive && (
                  <motion.div
                    layoutId={isMobile ? "mobile-sidebar-active" : "desktop-sidebar-active"}
                    className="absolute inset-0 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 -z-10"
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility Menu - Collapsible UI View */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            {/* Collapsible Trigger Card */}
            <button
              onClick={() => setIsAccountMenuOpen(prev => !prev)}
              className="w-full p-2.5 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
              title="Workspace & Settings Menu"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                  <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                    {currentOrgName}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono truncate">
                    {isCompanyAdmin ? 'Workspace Admin' : 'Member Workspace'}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isAccountMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isAccountMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-1 pt-1"
                >
                  <div className="p-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/70 dark:border-neutral-800 space-y-0.5 text-xs shadow-sm">
                    {/* Switch Organization */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/select-org');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Switch Workspace</span>
                      </div>
                    </button>

                    {/* Create Organization */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/create-org');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-neutral-500" />
                      <span>New Organization</span>
                    </button>

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

                    {/* Settings */}
                    <button
                      onClick={() => handleNavClick('admin')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeScreen === 'admin'
                          ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{isCompanyAdmin ? 'Workspace Settings' : 'Personal Settings'}</span>
                    </button>

                    {/* Support */}
                    <button
                      onClick={() => handleNavClick('support')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeScreen === 'support'
                          ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Support &amp; Docs</span>
                    </button>

                    {/* Archive */}
                    <button
                      onClick={() => handleNavClick('archive')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeScreen === 'archive'
                          ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Archive</span>
                    </button>

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

                    {/* Sign Out */}
                    <button
                      onClick={() => authService.signOut()}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/select-org');
              }}
              title={`Switch Workspace (${currentOrgName})`}
              className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              title={isCompanyAdmin ? 'Workspace Settings' : 'Personal Settings'}
              className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavClick('support')}
              title="Support"
              className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => authService.signOut()}
              title="Sign Out"
              className="w-full flex items-center justify-center p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
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
              {renderSidebarContent(false, true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
