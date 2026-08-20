import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  X, Plus, Network, UserPlus, 
  ArrowRight 
} from 'lucide-react';

interface ProjectDetailPanelProps {
  id: string;
}

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ id }) => {
  const { projects, popPanel } = useApp();

  const project = projects.find(p => p.id === id) || projects[0];

  const [scopedTasks, setScopedTasks] = useState([
    { id: 'TSK-892', title: 'Audit existing sync protocols', date: 'Oct 10', done: true, avatar: undefined },
    { id: 'TSK-895', title: 'Identify international node bottlenecks', date: 'Oct 15', done: true, avatar: undefined },
    { id: 'TSK-899', title: 'Draft new schema architecture', date: 'Oct 20', done: true, tags: ['Backend', 'Architecture'], avatar: undefined },
    { id: 'TSK-901', title: 'Implement pilot deployment on Node A', date: 'Nov 01', done: false },
    { id: 'TSK-905', title: 'Load testing and QA validation', date: 'Nov 10', done: false }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = scopedTasks.filter(t => t.done).length;

  const toggleTask = (taskId: string) => {
    setScopedTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setScopedTasks(prev => [
      ...prev,
      { id: `TSK-${Math.floor(100 + Math.random() * 900)}`, title: newTaskTitle.trim(), date: 'Nov 15', done: false }
    ]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 font-sans text-xs flex flex-col justify-between min-h-full">
      <div className="space-y-6">
        {/* Header Bar matching Screenshot 1 */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 uppercase">PRJ-2490</span>
            <span className="text-neutral-400">•</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
              • Active
            </span>
          </div>

          <button onClick={popPanel} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description Block */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
            {project?.name || 'Enterprise Data Sync Optimization'}
          </h1>
          <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
            {project?.description || 'A comprehensive overhaul of our primary data synchronization pipeline to reduce latency across international nodes and improve data integrity during peak loads.'}
          </p>
        </div>

        {/* Top 3 KPI Cards matching Screenshot 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Linked Objectives</span>
            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">OKR-1: Q3 Infrastructure S...</div>
            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">OKR-4: Latency Reduction</div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Target Date</span>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Nov 15, 2024</div>
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mt-1">
              <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '65%' }} />
            </div>
            <span className="text-[9px] text-neutral-400 text-right block">65%</span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <span className="text-base font-bold text-red-600 block">!</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Priority</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase">CRITICAL</span>
          </div>
        </div>

        {/* Main Grid: Scoped Tasks + Right Column Cards matching Screenshot 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (3 Cols): Scoped Tasks */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Scoped Tasks</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                {completedCount}/{scopedTasks.length} Completed
              </span>
            </div>

            <div className="space-y-2">
              {scopedTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => toggleTask(t.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    t.done 
                      ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900' 
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${
                      t.done ? 'bg-black text-white dark:bg-white dark:text-black border-black' : 'border-neutral-300'
                    }`}>
                      {t.done && '✓'}
                    </div>
                    <div>
                      <div className={`text-xs font-mono ${t.done ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100 font-medium'}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400">
                        {t.id} • {t.date}
                      </div>

                      {t.tags && (
                        <div className="flex items-center gap-1.5 mt-1.5 font-mono">
                          {t.tags.map(tg => (
                            <span key={tg} className="px-2 py-0.5 rounded text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {t.avatar && (
                    <img src={t.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  )}
                </div>
              ))}

              {isAdding ? (
                <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2 font-mono">
                  <input
                    type="text"
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-800 focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-lg text-xs">
                    Add
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1.5 pt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              )}
            </div>
          </div>

          {/* Right Column (2 Cols): Relationship Map, Assigned Team, System Tags */}
          <div className="lg:col-span-2 space-y-4 font-mono">
            {/* Relationship Map Black Card */}
            <div className="p-5 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm font-sans">
                <Network className="w-4 h-4" /> Relationship Map
              </div>
              <p className="text-[11px] text-neutral-300 dark:text-neutral-700 font-sans leading-relaxed">
                Visualize dependencies, blocking tasks, and cross-functional impacts.
              </p>
              <button 
                onClick={() => alert('Opening visual dependency relationship map...')}
                className="text-xs font-bold font-mono flex items-center gap-1 hover:underline pt-1 text-white dark:text-black"
              >
                ACCESS MAP <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Assigned Team Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans uppercase tracking-wider">Assigned Team</span>
                <UserPlus className="w-4 h-4 text-neutral-400 cursor-pointer" />
              </div>

              <div className="space-y-2.5 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name="Sarah Jenkins" size="xs" />
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">Sarah Jenkins</div>
                      <div className="text-[10px] font-mono text-neutral-400">Lead Architect</div>
                    </div>
                  </div>
                  <span className="text-neutral-400">☆</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  <UserAvatar name="James Smith" size="xs" />
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">James Smith</div>
                    <div className="text-[10px] font-mono text-neutral-400">Backend Dev</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  <UserAvatar name="Elena Rodriguez" size="xs" />
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">Elena Rodriguez</div>
                    <div className="text-[10px] font-mono text-neutral-400">Data Engineer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Tags Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">System Tags</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
                  Infrastructure
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
                  Data Sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar matching Screenshot 1 */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center font-mono">
        <button 
          onClick={() => { alert('Project archived.'); popPanel(); }}
          className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Archive
        </button>
        <button 
          onClick={() => alert('Editing project parameters...')}
          className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm"
        >
          Edit Project Details
        </button>
      </div>
    </div>
  );
};
