import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  CheckSquare, FolderKanban, Users, Target, 
  Pencil, Plus, Filter, ChevronDown 
} from 'lucide-react';

interface TagDetailPanelProps {
  id: string;
}

export const TagDetailPanel: React.FC<TagDetailPanelProps> = ({ id }) => {
  const { tags, pushPanel } = useApp();

  const tag = tags.find(t => t.id === id) || { name: 'Infrastructure' };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top Header Section matching Screenshot 2 */}
      <div className="space-y-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              🏷️ Tag Detail
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-1">
              #{tag.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button 
              onClick={() => alert('Edit tag settings...')}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button 
              onClick={() => alert('Assigning tag to entities...')}
              className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Assign
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-2xl">
          Scope: Core system architecture, database migrations, server scaling, and foundational engineering efforts supporting the primary application stack.
        </p>
      </div>

      {/* Top 4 KPI Boxes matching Screenshot 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Total Tasks</span>
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">248</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Active Projects</span>
            <FolderKanban className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">12</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Assigned People</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">45</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Linked OKRs</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">8</div>
        </div>
      </div>

      {/* Main Grid: Priority Tasks + Right Column Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Priority Tasks Table (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Priority Tasks</h3>
            <Filter className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                <tr>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Task Name</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer" onClick={() => pushPanel({ type: 'task', id: 'tsk-101' })}>
                  <td className="py-3 font-semibold text-neutral-500">INF-102</td>
                  <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Migrate Database to v14 Cluster</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">• In Progress</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">HIGH</span>
                  </td>
                  <td className="py-3 text-right text-neutral-600 dark:text-neutral-400">Oct 24</td>
                </tr>

                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer" onClick={() => pushPanel({ type: 'task', id: 'tsk-102' })}>
                  <td className="py-3 font-semibold text-neutral-500">INF-098</td>
                  <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Audit Cloud Resource Usage</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 text-neutral-500">○ To Do</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">MED</span>
                  </td>
                  <td className="py-3 text-right text-neutral-600 dark:text-neutral-400">Nov 02</td>
                </tr>

                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer" onClick={() => pushPanel({ type: 'task', id: 'tsk-103' })}>
                  <td className="py-3 font-semibold text-neutral-500">INF-115</td>
                  <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Implement Rate Limiting Middleware</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">• In Progress</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">HIGH</span>
                  </td>
                  <td className="py-3 text-right text-red-600 font-bold">Overdue</td>
                </tr>

                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer opacity-70" onClick={() => pushPanel({ type: 'task', id: 'tsk-104' })}>
                  <td className="py-3 font-semibold text-neutral-400">INF-045</td>
                  <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100 line-through">Deprecate Legacy Auth Service</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 text-neutral-500">✓ Done</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">LOW</span>
                  </td>
                  <td className="py-3 text-right text-neutral-400">Sep 15</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <button className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white font-semibold">
              View all 248 tasks →
            </button>
          </div>
        </div>

        {/* Right Column Cards: Linked Objectives & Active Contributors */}
        <div className="space-y-4">
          {/* Linked Objectives Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-neutral-500" /> Linked Objectives
            </h3>

            <div className="space-y-2.5 font-sans">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" />
                  <span>OKR-Q3-01</span>
                </div>
                <p className="text-[11px] text-neutral-500 pl-4">Achieve 99.99% Uptime across core services.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2 font-bold text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="w-2 h-2 rounded-full border border-neutral-400 shrink-0" />
                  <span>OKR-Q3-04</span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-4">Reduce average latency by 50ms globally.</p>
              </div>
            </div>
          </div>

          {/* Active Contributors Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-500" /> Active Contributors
            </h3>

            <div className="space-y-2.5 font-sans">
              <div className="flex items-center gap-2.5">
                <UserAvatar name="Sarah Jenkins" size="xs" />
                <div>
                  <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Sarah Jenkins</div>
                  <div className="text-[10px] font-mono text-neutral-400">Lead Architect</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <UserAvatar name="Michael Torres" size="xs" />
                <div>
                  <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Michael Torres</div>
                  <div className="text-[10px] font-mono text-neutral-400">DevOps</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <UserAvatar name="Amanda Lee" size="xs" />
                <div>
                  <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Amanda Lee</div>
                  <div className="text-[10px] font-mono text-neutral-400">DBA</div>
                </div>
              </div>
            </div>

            <button className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
              View all 45
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Projects matching Screenshot 2 */}
      <div className="space-y-3 font-mono pt-2">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Active Projects</span>
          <span className="text-[10px] text-neutral-400 uppercase cursor-pointer flex items-center gap-1">SORT <ChevronDown className="w-3 h-3" /></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            onClick={() => pushPanel({ type: 'project', id: 'PRJ-092' })}
            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3 cursor-pointer hover:border-neutral-400"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Project Phoenix</h4>
              <div className="flex items-center -space-x-1">
                <UserAvatar name="Sarah Jenkins" size="xs" />
                <UserAvatar name="Michael Torres" size="xs" />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans">Core Monolith Disaggregation</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-neutral-400">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => pushPanel({ type: 'project', id: 'PRJ-104' })}
            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3 cursor-pointer hover:border-neutral-400"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Global CDN Rollout</h4>
              <UserAvatar name="Elena Rostova" size="xs" />
            </div>
            <p className="text-[10px] text-neutral-400 font-sans">Edge computing initiative</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-neutral-400">
                <span>Progress</span>
                <span>12%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
