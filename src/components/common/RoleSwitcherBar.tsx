import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';
import type { Role } from '../../types';
import { ShieldCheck, Eye, LogIn, UserPlus, UserCheck, BookOpen, Plus, BellRing } from 'lucide-react';
import type { ItemType } from './CreateItemModal';

const ROLES: { role: Role; label: string }[] = [
  { role: 'Admin', label: 'Admin' },
  { role: 'Executive', label: 'Executive' },
  { role: 'HR', label: 'HR' },
  { role: 'Manager', label: 'Manager' },
  { role: 'TeamLead', label: 'Team Lead' },
  { role: 'Member', label: 'Member' },
  { role: 'Contractor', label: 'Contractor' }
];

interface RoleSwitcherBarProps {
  onOpenPrivileges?: () => void;
  onOpenCreateItem?: (type?: ItemType) => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({
  onOpenPrivileges,
  onOpenCreateItem
}) => {
  const { 
    activeRole, setActiveRole, currentUser, 
    isFocusMode, setIsFocusMode, activeScreen, setActiveScreen 
  } = useApp();

  const handleTriggerTestNotification = () => {
    window.dispatchEvent(new CustomEvent('pulse:trigger-toast'));
  };

  return (
    <div className="bg-neutral-950 text-white px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs border-b border-neutral-800 gap-2 font-sans shrink-0 z-40">
      {/* Left Role Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 font-bold tracking-wide text-neutral-300 uppercase text-[10px] font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Privilege Mode:</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          {ROLES.map(r => {
            const isActive = activeRole === r.role && !['welcome', 'signin', 'wizard', 'invite'].includes(activeScreen);
            return (
              <button
                key={r.role}
                onClick={() => {
                  setActiveRole(r.role);
                  if (['welcome', 'signin', 'wizard', 'invite'].includes(activeScreen)) {
                    setActiveScreen('dashboard');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg transition-all font-mono font-bold text-[11px] flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-white text-neutral-950 shadow-md ring-1 ring-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Current Acting User Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
          <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="xs" />
          <span className="text-neutral-200 font-semibold">{currentUser.name}</span>
          <span className="text-neutral-500">({currentUser.title})</span>
        </div>
      </div>

      {/* Right Quick Action Triggers */}
      <div className="flex items-center gap-2 font-mono">
        {/* Trigger Interactive Notification Toast */}
        <button
          onClick={handleTriggerTestNotification}
          className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/60 hover:bg-purple-900 font-bold flex items-center gap-1.5 transition-colors text-[11px]"
          title="Trigger in-app notification prompt (Daily Pulse, Meeting, Task Due)"
        >
          <BellRing className="w-3.5 h-3.5 text-purple-400" />
          <span>Test Reminder</span>
        </button>

        {/* Role Privileges Info Guide Button */}
        {onOpenPrivileges && (
          <button
            onClick={onOpenPrivileges}
            className="px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/60 hover:bg-blue-900 font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
            title="View detailed privilege matrix for each user type"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Role Privileges Guide</span>
          </button>
        )}

        {/* Test Creation Process Button */}
        {onOpenCreateItem && (
          <button
            onClick={() => onOpenCreateItem()}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 font-bold flex items-center gap-1.5 transition-colors text-[11px]"
            title="Test adding items under current active role"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add Item</span>
          </button>
        )}

        <div className="h-4 w-px bg-neutral-800 mx-1 hidden sm:block" />

        {/* Setup Screens Quick Nav */}
        <div className="hidden xl:flex items-center gap-1.5">
          <button
            onClick={() => setActiveScreen('welcome')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
              activeScreen === 'welcome'
                ? 'bg-white text-neutral-900 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Welcome
          </button>

          <button
            onClick={() => setActiveScreen('signin')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
              activeScreen === 'signin'
                ? 'bg-white text-neutral-900 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <LogIn className="w-3 h-3" />
            Sign In
          </button>

          <button
            onClick={() => setActiveScreen('wizard')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
              activeScreen === 'wizard'
                ? 'bg-white text-neutral-900 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            Wizard
          </button>

          <button
            onClick={() => setActiveScreen('invite')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
              activeScreen === 'invite'
                ? 'bg-white text-neutral-900 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Invite
          </button>
        </div>

        {/* Focus Mode Toggle */}
        <button
          onClick={() => setIsFocusMode(prev => !prev)}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 border ${
            isFocusMode
              ? 'bg-white text-neutral-900 border-white font-bold'
              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {isFocusMode ? 'Focus' : 'Standard'}
        </button>
      </div>
    </div>
  );
};
