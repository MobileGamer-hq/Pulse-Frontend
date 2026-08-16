import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Pencil, Link as LinkIcon, X, Plus, Paperclip, 
  ShieldAlert, ArrowRight, Target, MessageSquare, GripVertical 
} from 'lucide-react';

interface TaskDetailPanelProps {
  id: string;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ id }) => {
  const { tasks, users, tags, updateTask, toggleSubtask, addComment, popPanel } = useApp();

  const task = tasks.find(t => t.id === id);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Drag and Drop state for subtasks
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);

  if (!task) {
    return <div className="text-neutral-500 text-xs py-8 text-center font-mono">Task not found.</div>;
  }

  const completedSubtasks = task.subtasks.filter(s => s.done).length;

  const handleSubtaskDrop = (targetSubtaskId: string) => {
    if (!draggedSubtaskId || draggedSubtaskId === targetSubtaskId) return;
    const fromIdx = task.subtasks.findIndex(s => s.id === draggedSubtaskId);
    const toIdx = task.subtasks.findIndex(s => s.id === targetSubtaskId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newSubtasks = [...task.subtasks];
    const [moved] = newSubtasks.splice(fromIdx, 1);
    newSubtasks.splice(toIdx, 0, moved);
    updateTask(task.id, { subtasks: newSubtasks });
    setDraggedSubtaskId(null);
    setDragOverSubtaskId(null);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtasks = [
      ...task.subtasks,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), done: false }
    ];
    updateTask(task.id, { subtasks: newSubtasks });
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Bar matching Screenshot 1 */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="font-bold text-neutral-900 dark:text-neutral-100 uppercase">
            {task.projectName.substring(0, 3).toUpperCase()}-{task.id.substring(task.id.length - 3)}
          </span>
          <span className="text-neutral-400">•</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-neutral-500" />
            {task.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <LinkIcon className="w-4 h-4" />
          </button>
          <button onClick={popPanel} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid matching Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Title, Description, Subtasks */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
              {task.title}
            </h1>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">Description</span>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {task.description || 'The current authentication flow documentation is outdated following the migration to v2 APIs last month. This task involves completely rewriting the sequence diagrams, updating the endpoint references, and detailing the new JWT token refresh logic.'}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mt-2">
                Ensure all examples are converted to TypeScript and aligned with the new security protocols outlined in RFC-4412.
              </p>
            </div>
          </div>

          {/* Subtasks Section matching Screenshot 1 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Subtasks</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {completedSubtasks}/{task.subtasks.length} Completed
              </span>
            </div>

            <div className="space-y-2">
              {task.subtasks.map(s => {
                const isDragging = draggedSubtaskId === s.id;
                const isDragOver = dragOverSubtaskId === s.id;

                return (
                  <div 
                    key={s.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', s.id);
                      setDraggedSubtaskId(s.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverSubtaskId !== s.id) setDragOverSubtaskId(s.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverSubtaskId === s.id) setDragOverSubtaskId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSubtaskDrop(s.id);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all ${
                      isDragging ? 'opacity-40' : 'hover:border-neutral-400'
                    } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing shrink-0" />
                    <div 
                      onClick={() => toggleSubtask(task.id, s.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                        s.done 
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' 
                          : 'border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {s.done && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <span 
                      onClick={() => toggleSubtask(task.id, s.id)}
                      className={`text-xs font-mono flex-1 cursor-pointer ${s.done ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200 font-medium'}`}
                    >
                      {s.title}
                    </span>
                  </div>
                );
              })}

              {isAddingSubtask ? (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    autoFocus
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Enter subtask title..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-mono font-bold">
                    Add
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-xs font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1.5 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subtask
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Metadata Column matching Screenshot 1 */}
        <div className="space-y-4">
          {/* Metadata Box */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-4 font-mono">
            {/* Priority */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Priority</span>
              <div className="flex items-center gap-1.5 font-bold text-red-600 text-xs">
                <span className="text-sm">⇡</span> High Priority
              </div>
            </div>

            {/* Time Logged */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-500 font-semibold">
                <span>Time Logged</span>
                <span>3h 15m / 5h</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Tags */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {task.tagIds.map(tid => {
                  const tg = tags.find(x => x.id === tid);
                  if (!tg) return null;
                  return (
                    <span key={tg.id} className="px-2.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1" style={{ backgroundColor: tg.bgHex, color: tg.textHex, borderColor: 'transparent' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tg.colorHex }} />
                      {tg.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Dependencies</span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Blocked by PR-142</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Blocks ENG-105</span>
                </div>
              </div>
            </div>

            {/* Linked Goal */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Linked Goal</span>
              <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-neutral-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase">OKR Q3</div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[140px]">Infrastructure Migration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section matching Screenshot 1 */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Activity</h3>

        {/* Timeline Log Feed */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
            <img src={users[0]?.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
            <span className="font-bold text-neutral-900 dark:text-neutral-100">{users[0]?.name || 'Alex Chen'}</span>
            <span>updated description</span>
            <span className="ml-auto text-[10px] text-neutral-400">2h ago</span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">Sarah Jenkins</span>
              <span className="text-[10px] text-neutral-400">4h ago</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
              "I've completed the initial draft of the v2 docs, but we need to verify the new JWT refresh token expiration times with the backend team before publishing."
            </p>
          </div>
        </div>

        {/* Comment Input Box matching Screenshot 1 */}
        <form onSubmit={handlePostComment} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <textarea
            rows={3}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment or log an update..."
            className="w-full p-2 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none font-sans"
          />

          <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
              <Paperclip className="w-4 h-4" />
            </button>
            <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs rounded-lg hover:opacity-90 transition-opacity">
              Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
