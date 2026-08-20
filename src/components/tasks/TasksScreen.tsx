import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { ExportDropdown } from '../common/ExportDropdown';
import { 
  List, LayoutGrid, GitCommit, Users, Filter, X, 
  ChevronDown, ChevronRight, CheckCircle2, 
  MessageSquare, Calendar, AlertTriangle, GripVertical 
} from 'lucide-react';
import type { TaskStatus } from '../../types';

type ViewMode = 'list' | 'kanban' | 'timeline' | 'workload';

export const TasksScreen: React.FC = () => {
  const { tasks, users, tags, pushPanel, reorderTasks } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleRowDrop = (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;
    const fromIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const toIndex = tasks.findIndex(t => t.id === targetTaskId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);
    reorderTasks(newTasks);
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleKanbanDrop = (targetStatus: TaskStatus, targetTaskId?: string) => {
    if (!draggedTaskId) return;
    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    if (!draggedTask) return;

    let updatedTasks = [...tasks];
    if (draggedTask.status !== targetStatus) {
      updatedTasks = updatedTasks.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t);
    }

    if (targetTaskId && targetTaskId !== draggedTaskId) {
      const fromIdx = updatedTasks.findIndex(t => t.id === draggedTaskId);
      const toIdx = updatedTasks.findIndex(t => t.id === targetTaskId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = updatedTasks.splice(fromIdx, 1);
        updatedTasks.splice(toIdx, 0, moved);
      }
    }
    reorderTasks(updatedTasks);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // Grouping expand/collapse for Timeline view
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'q3-release': true,
    'mkt-campaign': true
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clearFilters = () => {
    setSelectedStatus('All');
    setSelectedAssignee('All');
    setSelectedTag('All');
    setSelectedPriority('All');
    setHighPriorityOnly(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
    if (selectedAssignee !== 'All' && !t.assigneeIds.includes(selectedAssignee)) return false;
    if (selectedTag !== 'All' && !t.tagIds.includes(selectedTag)) return false;
    if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
    if (highPriorityOnly && t.priority !== 'Urgent' && t.priority !== 'High') return false;
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'Todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'InProgress' || t.status === 'AtRisk' || t.status === 'Blocked');
  const reviewTasks = filteredTasks.filter(t => t.status === 'Done');

  return (
    <div className="space-y-6 font-sans">
      {/* Top Title & View Mode Selector matching screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {viewMode === 'workload' ? 'Workload Matrix' : viewMode === 'kanban' ? 'Kanban Board' : 'Tasks'}
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            {viewMode === 'workload' 
              ? 'Resource allocation and capacity planning.' 
              : viewMode === 'kanban' 
              ? 'Q3 Product Launch' 
              : 'Manage and track your active initiatives.'}
          </p>
        </div>

        {/* View Switcher Tabs matching screenshots */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-700 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-600 shadow-xs' 
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-600 shadow-xs' 
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-600 shadow-xs' 
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              Timeline
            </button>

            <button
              onClick={() => setViewMode('workload')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'workload' 
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-600 shadow-xs' 
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Workload
            </button>
          </div>

          <ExportDropdown
            filename="pulse_tasks_export"
            title="Pulse Active Tasks Report"
            data={filteredTasks.map(t => ({
              ID: t.id,
              Title: t.title,
              Status: t.status,
              Priority: t.priority,
              Project: t.projectName,
              Assignees: t.assigneeIds.map(id => users.find(u => u.id === id)?.name || id).join(', '),
              DueDate: t.dueDate,
              Blocked: t.blockedReason ? `Yes: ${t.blockedReason}` : 'No'
            }))}
          />

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }))}
            className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs shrink-0"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* FILTER BAR matching exact screenshot design */}
      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral-400 font-semibold uppercase text-[11px] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
          >
            <option value="All">Status: All ▾</option>
            <option value="Todo">To Do</option>
            <option value="InProgress">In Progress</option>
            <option value="AtRisk">At Risk</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
          </select>

          {/* Assignee Dropdown */}
          <select
            value={selectedAssignee}
            onChange={e => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
          >
            <option value="All">Assignee: All ▾</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Tags Dropdown */}
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
          >
            <option value="All">Tags: All ▾</option>
            {tags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
          >
            <option value="All">Priority: All ▾</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Active Filter Pill */}
          {highPriorityOnly && (
            <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 font-semibold text-[11px]">
              • High Priority
              <button onClick={() => setHighPriorityOnly(false)} className="hover:text-red-900">×</button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            filename={`Pulse_Tasks_${new Date().toISOString().slice(0, 10)}`}
            title="Pulse Task Management Report"
            data={filteredTasks.map(t => ({
              ID: t.id,
              Title: t.title,
              Project: t.projectName,
              Status: t.status,
              Priority: t.priority,
              Assignee: t.assigneeIds.map(id => users.find(u => u.id === id)?.name || id).join(', ') || 'Unassigned',
              DueDate: t.dueDate || 'N/A'
            }))}
          />

          <button
            onClick={clearFilters}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 font-medium text-[11px]"
          >
            <X className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: LIST VIEW matching Image 1 */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-2 w-8 text-center" aria-label="Drag handle"></th>
                  <th className="py-3 px-4 w-12">Pri</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredTasks.map(t => {
                  const isDone = t.status === 'Done';
                  const assignee = users.find(u => t.assigneeIds.includes(u.id));
                  const isDragging = draggedTaskId === t.id;
                  const isDragOver = dragOverTaskId === t.id;

                  return (
                    <tr 
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        setDraggedTaskId(t.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverTaskId !== t.id) setDragOverTaskId(t.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverTaskId === t.id) setDragOverTaskId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleRowDrop(t.id);
                      }}
                      onClick={() => pushPanel({ type: 'task', id: t.id })}
                      className={`transition-all cursor-pointer ${
                        isDragging ? 'opacity-30 bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40'
                      } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`}
                    >
                      {/* Drag Handle */}
                      <td className="py-3.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing mx-auto" />
                      </td>

                      {/* Priority Icon Carets matching Image 1 */}
                      <td className="py-3.5 px-4">
                        {t.priority === 'Urgent' ? (
                          <span className="text-red-600 font-bold text-sm">⇡</span>
                        ) : t.priority === 'High' ? (
                          <span className="text-neutral-800 dark:text-neutral-200 font-bold text-sm">^</span>
                        ) : (
                          <span className="text-neutral-400 font-sans">Normal</span>
                        )}
                      </td>

                      {/* Title & Code */}
                      <td className="py-3.5 px-4">
                        <div className={`font-bold text-neutral-900 dark:text-neutral-100 ${isDone ? 'line-through opacity-50' : ''}`}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                          <span>{t.projectName.substring(0, 3).toUpperCase()}-{t.id.substring(t.id.length - 3)}</span>
                          {t.subtasks && t.subtasks.length > 0 && (
                            <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-semibold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                              ✓ {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}
                            </span>
                          )}
                          {t.comments && t.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-semibold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                              <MessageSquare className="w-3 h-3 text-neutral-400" /> {t.comments.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={assignee.name} avatarUrl={assignee.avatarUrl} size="xs" />
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">{assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-neutral-500 font-medium">
                        {t.dueDate || 'Oct 12'}
                      </td>

                      {/* Tags Swatches */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {t.tagIds.map(tid => {
                            const tg = tags.find(x => x.id === tid);
                            if (!tg) return null;
                            return (
                              <span key={tg.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1" style={{ backgroundColor: tg.bgHex, color: tg.textHex, borderColor: 'transparent' }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tg.colorHex }} />
                                {tg.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border ${
                          t.status === 'Done' 
                            ? 'bg-neutral-100 text-neutral-700 border-neutral-300' 
                            : t.status === 'InProgress' 
                            ? 'bg-white text-black border-black dark:bg-neutral-800 dark:text-white dark:border-white shadow-xs'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}>
                          {t.status === 'Done' && '✓ Done'}
                          {t.status === 'InProgress' && '💬 In Progress'}
                          {t.status === 'Todo' && '⭕ To Do'}
                          {t.status === 'Blocked' && '🚫 Blocked'}
                          {t.status === 'AtRisk' && '⚠️ At Risk'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD VIEW matching Image 2 */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Column 1: To Do */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn('Todo'); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => { e.preventDefault(); handleKanbanDrop('Todo'); }}
            className={`p-4 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900 border transition-colors space-y-4 ${
              dragOverColumn === 'Todo' ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10' : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                To Do ({todoTasks.length})
              </span>
              <span className="text-neutral-400">•••</span>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {todoTasks.map(t => (
                <div 
                  key={t.id} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.id);
                    setDraggedTaskId(t.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKanbanDrop('Todo', t.id);
                  }}
                  onClick={() => pushPanel({ type: 'task', id: t.id })} 
                  className={`p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs space-y-2 cursor-grab active:cursor-grabbing hover:border-neutral-400 transition-all ${
                    draggedTaskId === t.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-neutral-400" />
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Backend</span>
                    </div>
                    <span className="text-neutral-400">⇡</span>
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 leading-snug">{t.title}</h4>
                  <p className="text-[11px] text-neutral-500 line-clamp-2">{t.description}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-700 text-[10px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.dueDate || 'Oct 12'}</span>
                    <div className="flex items-center gap-2">
                      {t.subtasks && t.subtasks.length > 0 && (
                        <span className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300 font-semibold" title="Subtasks">
                          ✓ {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}
                        </span>
                      )}
                      {t.comments && t.comments.length > 0 && (
                        <span className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300 font-semibold" title="Comments">
                          <MessageSquare className="w-3 h-3 text-neutral-400" /> {t.comments.length}
                        </span>
                      )}
                      <UserAvatar name={users.find(u => t.assigneeIds?.includes(u.id))?.name || 'User'} avatarUrl={users.find(u => t.assigneeIds?.includes(u.id))?.avatarUrl} size="xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn('InProgress'); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => { e.preventDefault(); handleKanbanDrop('InProgress'); }}
            className={`p-4 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900 border transition-colors space-y-4 ${
              dragOverColumn === 'InProgress' ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10' : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white" />
                In Progress ({inProgressTasks.length})
              </span>
              <span className="text-neutral-400">•••</span>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {inProgressTasks.map(t => (
                <div 
                  key={t.id} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.id);
                    setDraggedTaskId(t.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKanbanDrop('InProgress', t.id);
                  }}
                  onClick={() => pushPanel({ type: 'task', id: t.id })} 
                  className={`p-4 rounded-xl bg-white dark:bg-neutral-800 border-l-4 border-l-red-500 border-neutral-200 dark:border-neutral-700 shadow-xs space-y-2 cursor-grab active:cursor-grabbing hover:border-neutral-400 transition-all ${
                    draggedTaskId === t.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-neutral-400" />
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Design</span>
                      {t.priority === 'Urgent' && <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">Critical</span>}
                    </div>
                    <span className="text-red-600 font-bold">⇡</span>
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 leading-snug">{t.title}</h4>
                  <p className="text-[11px] text-neutral-500 line-clamp-2">{t.description}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-700 text-[10px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.dueDate || 'Oct 12'}</span>
                    <div className="flex items-center gap-2">
                      {t.subtasks && t.subtasks.length > 0 && (
                        <span className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300 font-semibold" title="Subtasks">
                          ✓ {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}
                        </span>
                      )}
                      {t.comments && t.comments.length > 0 && (
                        <span className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300 font-semibold" title="Comments">
                          <MessageSquare className="w-3 h-3 text-neutral-400" /> {t.comments.length}
                        </span>
                      )}
                      <UserAvatar name={users.find(u => t.assigneeIds?.includes(u.id))?.name || 'User'} avatarUrl={users.find(u => t.assigneeIds?.includes(u.id))?.avatarUrl} size="xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Review / Done Column */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn('Done'); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => { e.preventDefault(); handleKanbanDrop('Done'); }}
            className={`p-4 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900 border transition-colors space-y-4 ${
              dragOverColumn === 'Done' ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10' : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-neutral-400" />
                Review / Done ({reviewTasks.length})
              </span>
              <span className="text-neutral-400">•••</span>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {reviewTasks.map(t => (
                <div 
                  key={t.id} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.id);
                    setDraggedTaskId(t.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKanbanDrop('Done', t.id);
                  }}
                  onClick={() => pushPanel({ type: 'task', id: t.id })} 
                  className={`p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs space-y-2 cursor-grab active:cursor-grabbing hover:border-neutral-400 transition-all ${
                    draggedTaskId === t.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-neutral-400" />
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Done</span>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 leading-snug line-through opacity-70">{t.title}</h4>
                  <p className="text-[11px] text-neutral-500 line-clamp-2">{t.description}</p>
                </div>
              ))}

              {reviewTasks.length === 0 && (
                <div className="p-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-center space-y-2 text-neutral-400 text-xs font-mono">
                  <CheckCircle2 className="w-6 h-6 text-neutral-400" />
                  <span>Drop tasks here for review</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TIMELINE GANTT VIEW matching Image 3 */}
      {viewMode === 'timeline' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="overflow-x-auto relative">
            {/* Red Today Line */}
            <div className="absolute top-0 bottom-0 left-[58%] w-0.5 bg-red-500 z-10 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 -mt-1" />
            </div>

            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 uppercase text-[10px] text-neutral-400">
                <tr>
                  <th className="py-2.5 px-4 w-64">Task Name</th>
                  <th className="py-2.5 px-4 text-center border-l border-neutral-200 dark:border-neutral-800">Week 32</th>
                  <th className="py-2.5 px-4 text-center border-l border-neutral-200 dark:border-neutral-800">Week 33</th>
                  <th className="py-2.5 px-4 text-center border-l border-neutral-200 dark:border-neutral-800">Week 34</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {/* Group 1 */}
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 font-bold">
                  <td className="py-3 px-4 flex items-center gap-1.5 cursor-pointer" onClick={() => toggleGroup('q3-release')}>
                    {expandedGroups['q3-release'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Q3 Platform Release
                  </td>
                  <td colSpan={3} className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-[65%] ml-[30%] py-1.5 px-3 rounded bg-black text-white dark:bg-white dark:text-black text-[11px] font-mono font-bold shadow-xs">
                      Q3 Platform Release
                    </div>
                  </td>
                </tr>

                {expandedGroups['q3-release'] && (
                  <>
                    <tr>
                      <td className="py-2.5 pl-8 pr-4 text-neutral-600 dark:text-neutral-400">Backend Architecture</td>
                      <td colSpan={3} className="py-2.5 px-4 border-l border-neutral-200 dark:border-neutral-800">
                        <div className="w-[35%] ml-[30%] h-4 rounded bg-neutral-600 dark:bg-neutral-400" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pl-8 pr-4 text-neutral-600 dark:text-neutral-400">API Integration</td>
                      <td colSpan={3} className="py-2.5 px-4 border-l border-neutral-200 dark:border-neutral-800">
                        <div className="w-[30%] ml-[55%] h-4 rounded bg-neutral-600 dark:bg-neutral-400" />
                      </td>
                    </tr>
                  </>
                )}

                {/* Group 2 */}
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 font-bold">
                  <td className="py-3 px-4 flex items-center gap-1.5 cursor-pointer" onClick={() => toggleGroup('mkt-campaign')}>
                    {expandedGroups['mkt-campaign'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Marketing Campaign
                  </td>
                  <td colSpan={3} className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-[45%] ml-[50%] py-1.5 px-3 rounded bg-neutral-700 text-white text-[11px] font-mono font-bold">
                      Marketing Campaign
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: WORKLOAD MATRIX VIEW matching Image 4 */}
      {viewMode === 'workload' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 uppercase text-[10px] text-neutral-400">
                <tr>
                  <th className="py-2.5 px-4 w-56">Resource</th>
                  <th className="py-2.5 px-4 text-center border-l border-neutral-200 dark:border-neutral-800">M 12</th>
                  <th className="py-2.5 px-4 text-center border-l border-neutral-200 dark:border-neutral-800">T 13</th>
                  <th className="py-2.5 px-4 text-center border-l border-neutral-200 dark:border-neutral-800">W 14</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {/* Resource 1 */}
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">Alex Chen</div>
                    <div className="text-[10px] text-neutral-400">Frontend Eng</div>
                  </td>
                  <td className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-6 rounded flex items-center justify-center text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
                      6h
                    </div>
                  </td>
                  <td className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-full bg-neutral-300 dark:bg-neutral-600 h-6 rounded flex items-center justify-center text-[10px] font-bold text-neutral-900 dark:text-neutral-100">
                      8h
                    </div>
                  </td>
                  <td className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800 text-center text-neutral-400 font-mono text-xs">
                    0h
                  </td>
                </tr>

                {/* Resource 2: Overbooked Alert */}
                <tr>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                      Sarah Jenkins <AlertTriangle className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                    </div>
                    <div className="text-[10px] text-neutral-400">Backend Lead</div>
                  </td>
                  <td className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-full bg-black text-white dark:bg-white dark:text-black h-6 rounded flex items-center justify-center text-[10px] font-bold">
                      10h
                    </div>
                  </td>
                  <td className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-full bg-black text-white dark:bg-white dark:text-black h-6 rounded flex items-center justify-center text-[10px] font-bold">
                      9h
                    </div>
                  </td>
                  <td className="py-3 px-4 border-l border-neutral-200 dark:border-neutral-800">
                    <div className="w-[60%] bg-neutral-300 dark:bg-neutral-600 h-6 rounded flex items-center justify-center text-[10px] font-bold">
                      4h
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px] text-neutral-500">
            <span>Total Resources: 12</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-neutral-300" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-black dark:bg-white" /> Overbooked</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
