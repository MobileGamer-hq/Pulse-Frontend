import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  CheckSquare, FolderKanban, Users, Target, 
  Plus, Tag as TagIcon, X
} from 'lucide-react';

interface TagDetailPanelProps {
  id: string;
}

export const TagDetailPanel: React.FC<TagDetailPanelProps> = ({ id }) => {
  const { 
    tags, 
    tasks, 
    projects, 
    goals, 
    users, 
    pushPanel, 
    attachTagToEntity,
    detachTagFromEntity 
  } = useApp();

  const tag = tags.find(t => t.id === id || t.name.toLowerCase() === id.toLowerCase()) || { 
    id, 
    name: id, 
    colorHex: '#3B82F6',
    bgHex: 'rgba(59, 130, 246, 0.1)',
    textHex: '#3B82F6',
    description: 'Tag classification for tracking across tasks, projects, and OKR goals.' 
  };

  const taggedTasks = tasks.filter(t => (t.tagIds || []).includes(tag.id) || (t.tagIds || []).includes(tag.name));
  const taggedProjects = projects.filter(p => (p.tagIds || []).includes(tag.id) || (p.tagIds || []).includes(tag.name));
  const taggedGoals = goals.filter(g => (g.tagIds || []).includes(tag.id) || (g.tagIds || []).includes(tag.name));
  const taggedUsers = users.slice(0, 4);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<'task' | 'project' | 'goal'>('task');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;
    await attachTagToEntity(tag.id, selectedEntityType, selectedEntityId);
    setShowAssignModal(false);
    setSelectedEntityId('');
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top Header Section */}
      <div className="space-y-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <TagIcon className="w-3.5 h-3.5" style={{ color: tag.colorHex }} />
              <span>Tag Detail</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-1 flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tag.colorHex }} />
              #{tag.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button 
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> Assign to Entity
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-2xl">
          {tag.description || `Tag classification for tracking across tasks, projects, and OKR goals.`}
        </p>
      </div>

      {/* Assign Modal Dropdown Inline */}
      {showAssignModal && (
        <form onSubmit={handleAssign} className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
              Attach #{tag.name} to Workspace Item
            </span>
            <button type="button" onClick={() => setShowAssignModal(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-500 font-bold block mb-1">Entity Type</label>
              <select 
                value={selectedEntityType} 
                onChange={e => {
                  setSelectedEntityType(e.target.value as any);
                  setSelectedEntityId('');
                }}
                className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
              >
                <option value="task">Task</option>
                <option value="project">Project</option>
                <option value="goal">Goal</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 font-bold block mb-1">Select Item</label>
              <select 
                value={selectedEntityId} 
                onChange={e => setSelectedEntityId(e.target.value)}
                className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                required
              >
                <option value="">-- Choose {selectedEntityType} --</option>
                {selectedEntityType === 'task' && tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                ))}
                {selectedEntityType === 'project' && projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {selectedEntityType === 'goal' && goals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={!selectedEntityId}
              className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
            >
              Attach Tag
            </button>
          </div>
        </form>
      )}

      {/* Top 4 KPI Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Tagged Tasks</span>
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{taggedTasks.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Tagged Projects</span>
            <FolderKanban className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{taggedProjects.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Contributors</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{users.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>Linked OKRs</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{taggedGoals.length}</div>
        </div>
      </div>

      {/* Main Grid: Real Priority Tasks + Right Column Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Priority Tasks Table (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Tagged Tasks ({taggedTasks.length})</h3>
            <span className="text-[10px] text-neutral-400">Live</span>
          </div>

          {taggedTasks.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-neutral-500 font-sans">No tasks currently have this tag attached.</p>
              <button
                onClick={() => {
                  setSelectedEntityType('task');
                  setShowAssignModal(true);
                }}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] font-bold rounded-lg cursor-pointer"
              >
                + Assign to a task
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                  <tr>
                    <th className="pb-2">Task Title</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {taggedTasks.map(t => (
                    <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer" onClick={() => pushPanel({ type: 'task', id: t.id })}>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                        {t.title}
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
                          • {t.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => detachTagFromEntity(tag.id, 'task', t.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Remove tag"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column Cards: Linked Objectives & Active Contributors */}
        <div className="space-y-4">
          {/* Linked Objectives Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-neutral-500" /> Linked Objectives ({taggedGoals.length})
            </h3>

            {taggedGoals.length === 0 ? (
              <p className="text-[11px] text-neutral-400 font-sans">No goals tagged yet.</p>
            ) : (
              <div className="space-y-2.5 font-sans">
                {taggedGoals.map(g => (
                  <div key={g.id} className="space-y-1 cursor-pointer" onClick={() => pushPanel({ type: 'goal', id: g.id })}>
                    <div className="flex items-baseline gap-2 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" />
                      <span>{g.title}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 pl-4">{g.description || 'OKR Target'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Contributors Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-500" /> Team Directory
            </h3>

            <div className="space-y-2.5 font-sans">
              {taggedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2.5 cursor-pointer" onClick={() => pushPanel({ type: 'person', id: u.id })}>
                  <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{u.name}</div>
                    <div className="text-[10px] font-mono text-neutral-400">{u.title || u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Projects */}
      <div className="space-y-3 font-mono pt-2">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Tagged Projects ({taggedProjects.length})</span>
        </div>

        {taggedProjects.length === 0 ? (
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center font-sans text-xs text-neutral-500 bg-white dark:bg-neutral-900">
            No projects associated with this tag yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {taggedProjects.map(p => (
              <div 
                key={p.id}
                onClick={() => pushPanel({ type: 'project', id: p.id })}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3 cursor-pointer hover:border-neutral-400"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">{p.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {p.status}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans">{p.description || 'Project initiative'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
