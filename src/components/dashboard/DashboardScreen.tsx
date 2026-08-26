import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, ShieldAlert, Clock, CheckCircle2, FolderPlus, Target, Frown, Meh, Smile, Activity } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { tasks, projects, goals, eodEntries, submitEOD, setActiveScreen } = useApp();

  const [selectedSentiment, setSelectedSentiment] = useState<'sad' | 'neutral' | 'happy'>('happy');
  const [reflectionNote, setReflectionNote] = useState('');

  const todayDate = new Date();
  const dateFormatted = todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'Planning');
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const completedTasks = tasks.filter(t => t.status === 'Done');

  const handleLogReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const indexMap = { sad: 1, neutral: 3, happy: 5 } as const;
    const isoDate = todayDate.toISOString().split('T')[0];
    submitEOD({
      date: isoDate,
      accomplishments: [reflectionNote || 'Logged daily productivity reflection.'],
      completedTaskIds: completedTasks.map(t => t.id),
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
            Dashboard Overview
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">{dateFormatted}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }));
            }}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Real Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Total Projects</span>
            <FolderPlus className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{projects.length}</span>
            <span className="text-xs text-neutral-500 font-mono">{activeProjects.length} Active</span>
          </div>
          <p className="text-xs text-neutral-500 font-mono">Workspace projects</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Active Tasks</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{tasks.length}</span>
            <span className="text-xs text-neutral-500 font-mono">{completedTasks.length} Completed</span>
          </div>
          <p className="text-xs text-neutral-500 font-mono">Assigned workspace tasks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Active Blockers</span>
            <ShieldAlert className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{blockedTasks.length}</span>
            {blockedTasks.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                Action Req.
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                Clear
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 font-mono">Tasks requiring unblocking</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Active Goals</span>
            <Target className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{goals.length}</span>
          </div>
          <p className="text-xs text-neutral-500 font-mono">Tracked OKRs & targets</p>
        </div>
      </div>

      {/* Main Grid: Real Tasks & Real Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks & Projects Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks List */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Tasks Triage</h3>
              <button onClick={() => setActiveScreen('tasks')} className="text-[11px] font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer">
                View All ({tasks.length})
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No tasks in your database yet</p>
                  <p className="text-[11px] text-neutral-500">Create a task to populate your execution board.</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }))}
                  className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        task.status === 'Done' ? 'bg-emerald-500' : task.status === 'Blocked' ? 'bg-red-500' : task.status === 'InProgress' ? 'bg-blue-500' : 'bg-neutral-400'
                      }`} />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Projects List */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Projects Overview</h3>
              <button onClick={() => setActiveScreen('projects')} className="text-[11px] font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer">
                View All ({projects.length})
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No projects in your database yet</p>
                  <p className="text-[11px] text-neutral-500 font-mono">Create your first project to organize initiatives.</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'project' } }))}
                  className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map(proj => (
                  <div key={proj.id} className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{proj.name}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Pulse & Check-ins */}
        <div className="space-y-6">
          {/* Daily Pulse Log Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Daily Pulse Check-in</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Share today's blockers & wins with your team.</p>
            </div>

            <form onSubmit={handleLogReflection} className="space-y-3 text-xs">
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  type="button"
                  onClick={() => setSelectedSentiment('sad')}
                  className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    selectedSentiment === 'sad' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700'
                  }`}
                  title="Low Energy / Blocked"
                >
                  <Frown className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSentiment('neutral')}
                  className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    selectedSentiment === 'neutral' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700'
                  }`}
                  title="Steady Progress"
                >
                  <Meh className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSentiment('happy')}
                  className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
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
                placeholder="Brief note on accomplishments or blockers..."
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Submit Check-in
              </button>
            </form>
          </div>

          {/* Real Team Pulse Check-ins Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Recent Team Check-ins
            </h3>

            {eodEntries.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 font-mono">
                No check-ins submitted yet today.
              </div>
            ) : (
              <div className="space-y-3">
                {eodEntries.slice(0, 5).map(entry => (
                  <div key={entry.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{entry.userName}</span>
                      <span className="text-neutral-400">{entry.date}</span>
                    </div>
                    {entry.accomplishments.length > 0 && (
                      <p className="text-neutral-600 dark:text-neutral-300 font-sans text-xs">{entry.accomplishments.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
