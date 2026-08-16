import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, MoreVertical, ArrowUpRight, CheckCircle2, 
  Users, Shield 
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface PersonProfilePanelProps {
  id: string;
}

export const PersonProfilePanel: React.FC<PersonProfilePanelProps> = ({ id }) => {
  const { users, popPanel, pushPanel } = useApp();

  const user = users.find(u => u.id === id) || users[0];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Bar matching Screenshot 3 */}
      <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar 
              name={user.name} 
              avatarUrl={user.avatarUrl} 
              size="xl" 
              allowColorChange={true}
            />
            <span className="w-3 h-3 rounded-full bg-black dark:bg-white border-2 border-white dark:border-neutral-900 absolute -bottom-0.5 -right-0.5" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {user.name || 'Elena Rostova'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-neutral-500">
              <span>{user.title || 'Lead Engineer'}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                📍 DEEP WORK
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
            <MoreVertical className="w-4 h-4" />
          </button>
          <button onClick={popPanel} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Boxes matching Screenshot 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Active Tasks</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">14</span>
            <span className="text-[10px] font-bold text-emerald-600">↑2</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Project Load</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">3</span>
            <span className="text-[10px] font-bold text-neutral-400">Max 4</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">EOD Consistency</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">92%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Goal Align</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">High</span>
          </div>
        </div>
      </div>

      {/* Affiliations & Skills Badges */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-neutral-400 font-mono uppercase tracking-wider">Affiliations &amp; Skills</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-400" /> Engineering
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-neutral-400" /> {user.role}
          </span>
          {['Infrastructure', 'Node.js', 'System Architecture'].map(skill => (
            <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              #{skill}
            </span>
          ))}
        </div>
      </div>

      {/* Active Projects Cards */}
      <div className="space-y-3 font-mono">
        <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Active Projects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div 
            onClick={() => pushPanel({ type: 'project', id: 'PRJ-2490' })}
            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 cursor-pointer space-y-2"
          >
            <div className="flex justify-between items-start font-sans font-bold">
              <span>API Gateway V2</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <p className="text-[10px] text-neutral-400 font-sans">Core routing infrastructure overhaul.</p>
            <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '68%' }} />
            </div>
          </div>

          <div 
            onClick={() => pushPanel({ type: 'project', id: 'PRJ-104' })}
            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 cursor-pointer space-y-2"
          >
            <div className="flex justify-between items-start font-sans font-bold">
              <span>Nexus Core</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <p className="text-[10px] text-neutral-400 font-sans">Enterprise data sync architecture.</p>
            <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '42%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Project Tasks Checklist */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 font-mono">
        <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Cross-Project Tasks</h3>
        <div className="space-y-2 font-sans">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">Draft new schema architecture</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-200 dark:bg-neutral-700">P1</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
              <span className="font-bold">Rate limiting parameters review</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-200 dark:bg-neutral-700">P2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
