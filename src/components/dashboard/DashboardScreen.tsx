import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, ShieldAlert, Clock, Edit3, Frown, Meh, Smile } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { activeRole, submitEOD, setActiveScreen } = useApp();

  const isExecutive = activeRole === 'Executive' || activeRole === 'Admin';
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical'>('All');
  const [selectedSentiment, setSelectedSentiment] = useState<'sad' | 'neutral' | 'happy'>('happy');
  const [reflectionNote, setReflectionNote] = useState('');

  const todayStr = 'Tuesday, October 24';

  const handleLogReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const indexMap = { sad: 1, neutral: 3, happy: 5 } as const;
    submitEOD({
      date: '2026-10-24',
      accomplishments: [reflectionNote || 'Logged daily productivity reflection.'],
      completedTaskIds: [],
      blockers: selectedSentiment === 'sad' ? reflectionNote : '',
      energyIndex: indexMap[selectedSentiment],
      flaggedToManager: selectedSentiment === 'sad'
    });
    setReflectionNote('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {isExecutive ? 'Executive Overview' : 'Overview'}
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">{todayStr}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('tasks')}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {!isExecutive ? (
        /* Image 1 IC Overview Screen Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Priorities Card (2 Cols) */}
          <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Today's Priorities</h3>
              <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setPriorityFilter('All')}
                  className={`px-3 py-1 rounded-md transition-all font-semibold ${
                    priorityFilter === 'All' ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs' : 'text-neutral-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPriorityFilter('Critical')}
                  className={`px-3 py-1 rounded-md transition-all font-semibold ${
                    priorityFilter === 'Critical' ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs' : 'text-neutral-500'
                  }`}
                >
                  Critical
                </button>
              </div>
            </div>

            {/* Task Priority Cards */}
            <div className="space-y-3">
              {/* Item 1: In Progress */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2 hover:border-neutral-400 transition-all">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Finalize API Schema Design</span>
                      <span className="text-[11px] font-mono text-neutral-400">Due 2:00 PM</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Review endpoint definitions with frontend team and update swagger docs.</p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        • Backend
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        PR-142
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item 2: Blocked */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2 hover:border-neutral-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-0.5 bg-red-500 rotate-45" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Database Migration Script</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-600 border border-red-200">
                        Blocked
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Waiting on DevOps approval for production staging environment access.</p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        • Infrastructure
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item 3: To Do */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2 hover:border-neutral-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Update Unit Tests for Auth Module</span>
                      <span className="text-[11px] font-mono text-neutral-400">Due Tomorrow</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Ensure 95% coverage on new JWT rotation logic implemented in v2.1.</p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        • QA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Column */}
          <div className="space-y-6">
            {/* Velocity Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Velocity</h3>
                <p className="text-[11px] text-neutral-500 font-mono">Commits & PRs Merged (Last 7 Days)</p>
              </div>

              <div className="h-28 flex items-end justify-between px-2 pt-4 border-b border-neutral-100 dark:border-neutral-800">
                {['W', 'T', 'F', 'S', 'S', 'M', 'T'].map((day, idx) => {
                  const heights = [40, 65, 85, 30, 20, 90, 75];
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div 
                        className="w-3 bg-neutral-900 dark:bg-white rounded-t transition-all duration-300" 
                        style={{ height: `${heights[idx]}%` }}
                      />
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Pulse Reflection Widget - Clean Minimal Vector Icons */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Daily Pulse</h3>
                <p className="text-[11px] text-neutral-500">End of day reflection. How productive did you feel today?</p>
              </div>

              <form onSubmit={handleLogReflection} className="space-y-3 text-xs">
                {/* Minimal Vector Icon Sentiment Selector */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSentiment('sad')}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                      selectedSentiment === 'sad' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700'
                    }`}
                    title="Low Productivity"
                  >
                    <Frown className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSentiment('neutral')}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                      selectedSentiment === 'neutral' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700'
                    }`}
                    title="Moderate Productivity"
                  >
                    <Meh className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSentiment('happy')}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                      selectedSentiment === 'happy' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white shadow-xs' : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700'
                    }`}
                    title="High Productivity"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={reflectionNote}
                  onChange={e => setReflectionNote(e.target.value)}
                  placeholder="Brief note on blockers or wins..."
                  className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Log Reflection
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Image 2 Executive Overview Layout */
        <div className="space-y-6">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                <span>Overall Capacity</span>
                <Edit3 className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">87%</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                  +2.4%
                </span>
              </div>
              <p className="text-xs text-neutral-500">Optimal load; 13% buffer available.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                <span>Active Blockers</span>
                <ShieldAlert className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">14</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                  +3
                </span>
              </div>
              <p className="text-xs text-neutral-500">Requires immediate executive attention.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                <span>Avg Turnaround</span>
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">3.2</span>
                <span className="text-xs text-neutral-500 font-mono">Days</span>
              </div>
              <p className="text-xs text-neutral-500">-0.4 days from previous quarter.</p>
            </div>
          </div>

          {/* Risk Matrix & Team Pulse Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Matrix Table (2 Cols) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Risk Matrix
                </h3>
                <button onClick={() => setActiveScreen('projects')} className="text-[10px] font-mono font-semibold text-neutral-500 hover:text-black uppercase tracking-wider">
                  View All Projects
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                    <tr>
                      <th className="pb-2">Project Code</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Burn Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-100">PRJ-Alpha-Core Integration</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Critical</span>
                      </td>
                      <td className="py-3 text-right font-bold text-red-600">$45k/wk</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-100">PRJ-Beta-Data Migration</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Elevated</span>
                      </td>
                      <td className="py-3 text-right text-neutral-700 dark:text-neutral-300">$22k/wk</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-100">PRJ-Gamma-UI Refresh</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">On Track</span>
                      </td>
                      <td className="py-3 text-right text-neutral-700 dark:text-neutral-300">$18k/wk</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Pulse Column */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Team Pulse</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">J. Doe • Eng</span>
                    <span className="text-neutral-400">2h ago</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">API endpoints finalized. Experiencing minor latency on legacy sync, investigating tomorrow.</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">S. Lee • Design</span>
                    <span className="text-neutral-400">4h ago</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">Design handoff complete for Sprint 4. Ready for review.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Q3 Objectives Progress */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Q3 Objectives Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Infrastructure Migration Phase 1</span>
                  <span className="font-mono">65%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Reduce Technical Debt</span>
                  <span className="font-mono">32%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-neutral-600 dark:bg-neutral-400 rounded-full" style={{ width: '32%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
