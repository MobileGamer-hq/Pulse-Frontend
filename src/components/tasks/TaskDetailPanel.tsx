import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Pencil, Link as LinkIcon, X, Plus, 
  ShieldAlert, MessageSquare, GripVertical,
  Trash2, Edit2, Check
} from 'lucide-react';

interface TaskDetailPanelProps {
  id: string;
}

function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'recently';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ id }) => {
  const { 
    tasks, users, tags, currentUser,
    updateTask, addSubtask, updateSubtask, deleteSubtask, toggleSubtask, 
    addComment, updateComment, deleteComment, popPanel 
  } = useApp();

  const task = tasks.find(t => t.id === id);

  // Subtask creation state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState<string>('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Subtask editing state
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Drag and Drop state for subtasks
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);

  if (!task) {
    return <div className="text-neutral-500 text-xs py-8 text-center font-mono">Task not found.</div>;
  }

  const completedSubtasks = task.subtasks.filter(s => s.done).length;
  const subtaskProgressPercent = task.subtasks.length > 0 
    ? Math.round((completedSubtasks / task.subtasks.length) * 100) 
    : 0;

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

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    addSubtask(task.id, newSubtaskTitle.trim(), newSubtaskAssigneeId || undefined);
    setNewSubtaskTitle('');
    // keep form open so user can quickly add multiple subtasks
  };

  const handleSaveSubtaskEdit = (subtaskId: string) => {
    if (!editingSubtaskTitle.trim()) return;
    updateSubtask(task.id, subtaskId, { title: editingSubtaskTitle.trim() });
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleSaveCommentEdit = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    updateComment(task.id, commentId, editingCommentText.trim());
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Bar */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Title, Description, Subtasks Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
              {task.title}
            </h1>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">Description</span>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {task.description || 'No detailed description provided for this task.'}
              </p>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Subtasks</span>
                <span className="text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400">
                  ({subtaskProgressPercent}% done)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {completedSubtasks}/{task.subtasks.length} Completed
              </span>
            </div>

            {/* Subtask Progress Bar */}
            {task.subtasks.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div 
                  className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-300 rounded-full" 
                  style={{ width: `${subtaskProgressPercent}%` }}
                />
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              {task.subtasks.map(s => {
                const isDragging = draggedSubtaskId === s.id;
                const isDragOver = dragOverSubtaskId === s.id;
                const isEditing = editingSubtaskId === s.id;
                const subtaskAssignee = users.find(u => u.id === s.assigneeId);

                return (
                  <div 
                    key={s.id} 
                    draggable={!isEditing}
                    onDragStart={(e) => {
                      if (isEditing) return;
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
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all group ${
                      isDragging ? 'opacity-40' : 'hover:border-neutral-400 dark:hover:border-neutral-700'
                    } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing shrink-0 opacity-60 group-hover:opacity-100" />
                    
                    {/* Done Checkbox */}
                    <div 
                      onClick={() => toggleSubtask(task.id, s.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                        s.done 
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' 
                          : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {s.done && <span className="text-[10px] font-bold">✓</span>}
                    </div>

                    {/* Title or Edit Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingSubtaskTitle}
                          onChange={e => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveSubtaskEdit(s.id);
                            if (e.key === 'Escape') setEditingSubtaskId(null);
                          }}
                          className="flex-1 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSubtaskEdit(s.id)}
                          className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span 
                        onClick={() => toggleSubtask(task.id, s.id)}
                        className={`text-xs font-mono flex-1 cursor-pointer truncate ${
                          s.done ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200 font-medium'
                        }`}
                      >
                        {s.title}
                      </span>
                    )}

                    {/* Assignee Selection for Subtask */}
                    <div className="flex items-center gap-1">
                      <select
                        value={s.assigneeId || ''}
                        onChange={(e) => updateSubtask(task.id, s.id, { assigneeId: e.target.value || undefined })}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 focus:outline-none cursor-pointer"
                        title="Assign subtask to team member"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>

                      {subtaskAssignee && (
                        <UserAvatar name={subtaskAssignee.name} avatarUrl={subtaskAssignee.avatarUrl} size="xs" />
                      )}
                    </div>

                    {/* Action buttons (Edit & Delete) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubtaskId(s.id);
                            setEditingSubtaskTitle(s.title);
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Edit subtask"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteSubtask(task.id, s.id)}
                        className="p-1 rounded text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Subtask Form */}
              {isAddingSubtask ? (
                <form onSubmit={handleAddSubtaskSubmit} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      placeholder="Enter subtask title (press Enter to add)..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono focus:outline-none"
                    />
                    <select
                      value={newSubtaskAssigneeId}
                      onChange={e => setNewSubtaskAssigneeId(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none"
                    >
                      <option value="">Assignee (Optional)</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle('');
                      }} 
                      className="px-2.5 py-1 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      Done
                    </button>
                    <button type="submit" className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-mono font-bold hover:opacity-90">
                      + Add Subtask
                    </button>
                  </div>
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

        {/* Right Metadata Column */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-4 font-mono">
            {/* Priority */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Priority</span>
              <div className={`flex items-center gap-1.5 font-bold text-xs ${
                task.priority === 'Urgent' ? 'text-red-600' : task.priority === 'High' ? 'text-orange-600' : 'text-neutral-700 dark:text-neutral-300'
              }`}>
                <span className="text-sm">⇡</span> {task.priority} Priority
              </div>
            </div>

            {/* Time Logged */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-500 font-semibold">
                <span>Time Logged</span>
                <span>{task.actualHours}h / {task.estimatedHours}h</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div 
                  className="h-full bg-black dark:bg-white rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((task.actualHours / (task.estimatedHours || 1)) * 100))}%` }} 
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Assignees</span>
              <div className="space-y-1.5">
                {task.assigneeIds.map(uid => {
                  const u = users.find(x => x.id === uid);
                  if (!u) return null;
                  return (
                    <div key={u.id} className="flex items-center gap-2">
                      <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{u.name}</span>
                    </div>
                  );
                })}
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
            {task.dependencyTaskIds.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Dependencies</span>
                <div className="space-y-1 text-[11px]">
                  {task.dependencyTaskIds.map(depId => (
                    <div key={depId} className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      <span>Linked to {depId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity & Dynamic Multi-Comment Stream */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-neutral-500" />
            Comments & Discussion ({task.comments.length})
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            Real-time activity stream
          </span>
        </div>

        {/* Dynamic Timeline Log Feed of Real Comments */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {task.comments.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center font-mono text-neutral-400 text-xs">
              No comments yet. Start the conversation below!
            </div>
          ) : (
            task.comments.map(c => {
              const authorUser = users.find(u => u.id === c.authorId);
              const isAuthor = c.authorId === currentUser.id;
              const isEditing = editingCommentId === c.id;

              return (
                <div 
                  key={c.id} 
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2 group transition-all"
                >
                  <div className="flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={c.authorName} avatarUrl={authorUser?.avatarUrl} size="xs" />
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{c.authorName}</span>
                      {authorUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-400">
                          {authorUser.role}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                      <span>{formatTimeAgo(c.createdAt)}</span>
                      {c.updatedAt && <span className="italic">(edited)</span>}
                      {isAuthor && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditingCommentText(c.text);
                            }}
                            className="p-0.5 hover:text-neutral-900 dark:hover:text-white"
                            title="Edit comment"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteComment(task.id, c.id)}
                            className="p-0.5 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={2}
                        value={editingCommentText}
                        onChange={e => setEditingCommentText(e.target.value)}
                        className="w-full p-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none font-sans"
                      />
                      <div className="flex justify-end gap-2 font-mono">
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveCommentEdit(c.id)}
                          className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-bold"
                        >
                          Save Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {c.text}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input Box for Posting Multiple Times */}
        <form onSubmit={handlePostComment} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <textarea
            rows={3}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handlePostComment(e);
              }
            }}
            placeholder="Write a comment or log an update... (Cmd/Ctrl+Enter to post)"
            className="w-full p-2 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none font-sans resize-none"
          />

          <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800 pt-2 font-mono">
            <span className="text-[10px] text-neutral-400">
              Posting as <strong className="text-neutral-700 dark:text-neutral-300">{currentUser.name}</strong>
            </span>
            <button 
              type="submit" 
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Post Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
