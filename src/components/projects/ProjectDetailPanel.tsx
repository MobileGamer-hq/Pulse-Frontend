import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  X, Plus, Network, 
  ArrowRight, Loader2, Clock, Calendar, Check, Lock
} from 'lucide-react';
import { getProjectContributors } from '../../utils/projectContributors';

interface ProjectDetailPanelProps {
  id: string;
}

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ id }) => {
  const { 
    projects, tasks, teams, users, tags, currentUser, popPanel, addTask, updateTask, updateProject,
    currentOrgSlug, setActiveScreen, attachTagToEntity, detachTagFromEntity, activeRole
  } = useApp();
  const navigate = useNavigate();

  const canManageProject = ['Admin', 'Executive', 'Manager'].includes(activeRole || currentUser?.role || '');

  const handleOpenRelationshipMap = () => {
    popPanel();
    setActiveScreen('relationships');
    navigate(`/${currentOrgSlug || 'epicordia'}/relationships`);
  };

  const project = projects.find(p => p.id === id || p.name.toLowerCase() === id.toLowerCase()) || projects[0];
  const canViewTask = (t: any) => {
    if (!t.isPrivate) return true;
    const isPrivileged = ['Admin', 'Executive', 'Manager'].includes(activeRole || currentUser?.role || '');
    const isAssigned = Boolean(currentUser?.id && t.assigneeIds && t.assigneeIds.includes(currentUser.id));
    const isCreator = Boolean(currentUser?.id && t.createdBy && t.createdBy === currentUser.id);
    return isPrivileged || isAssigned || isCreator;
  };

  const projectTasks = tasks.filter(t => 
    canViewTask(t) && (
      (project && t.projectId === project.id) ||
      (t.projectId === id) ||
      (project && t.projectName && project.name && t.projectName.toLowerCase() === project.name.toLowerCase())
    )
  );
  const completedTasksCount = projectTasks.filter(t => t.status === 'Done').length;
  const progressPercent = projectTasks.length > 0 
    ? Math.round((completedTasksCount / projectTasks.length) * 100) 
    : (project?.status === 'Completed' ? 100 : 0);

  const projectContributors = getProjectContributors(project, teams, users, tasks);
  const assignedTeam = teams.find(t => t.id === project?.teamId);
  const displayMembers = projectContributors.length > 0 ? projectContributors : [currentUser];

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Project inline editing
  const [isEditingProj, setIsEditingProj] = useState(false);
  const [editProjName, setEditProjName] = useState(project?.name || '');
  const [editProjDesc, setEditProjDesc] = useState(project?.description || '');

  React.useEffect(() => {
    if (project) {
      setEditProjName(project.name);
      setEditProjDesc(project.description || '');
    }
  }, [project?.name, project?.description]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus === 'Done';
    try {
      await updateTask(taskId, { status: isDone ? 'Todo' : 'Done' });
    } catch (err) {
      console.warn('[toggleTaskStatus error]:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !project) return;

    setTaskError(null);
    setIsSubmittingTask(true);

    try {
      await addTask({
        orgId: project.orgId,
        projectId: project.id,
        projectName: project.name,
        title: newTaskTitle.trim(),
        description: '',
        status: 'Todo',
        priority: 'Medium',
        assigneeIds: [currentUser.id],
        estimatedHours: 8,
        actualHours: 0,
        dueDate: project.targetEndDate || new Date().toISOString().split('T')[0],
        tagIds: [],
        dependencyTaskIds: [],
        subtasks: [],
        comments: []
      });

      setNewTaskTitle('');
      setIsAdding(false);
    } catch (err: any) {
      setTaskError(err.message || 'Failed to create task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const projectCode = (project?.id || 'PRJ').substring(0, 8).toUpperCase();

  return (
    <div className="space-y-6 font-sans text-xs flex flex-col justify-between min-h-full">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 uppercase">{projectCode}</span>
            <span className="text-neutral-400">•</span>
            
            {/* Editable Status */}
            <select
              value={project?.status || 'Active'}
              onChange={async e => {
                if (project) {
                  try {
                    await updateProject(project.id, { status: e.target.value as any });
                  } catch (err) { console.warn(err); }
                }
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value="Active">• Active</option>
              <option value="Planning">• Planning</option>
              <option value="Completed">• Completed</option>
              <option value="Paused">• Paused</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {canManageProject && (
              <button 
                onClick={() => setIsEditingProj(prev => !prev)}
                title="Edit Project Details"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isEditingProj 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="text-xs font-mono font-bold">{isEditingProj ? 'Editing...' : 'Edit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Title & Description Block */}
        {isEditingProj ? (
          <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 space-y-3 font-mono">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Project Name</label>
              <input
                type="text"
                autoFocus
                value={editProjName}
                onChange={e => setEditProjName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Description</label>
              <textarea
                rows={3}
                value={editProjDesc}
                onChange={e => setEditProjDesc(e.target.value)}
                placeholder="Project objectives & context..."
                className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditProjName(project?.name || '');
                  setEditProjDesc(project?.description || '');
                  setIsEditingProj(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!project || !editProjName.trim()) return;
                  try {
                    await updateProject(project.id, {
                      name: editProjName.trim(),
                      description: editProjDesc.trim()
                    });
                    setIsEditingProj(false);
                  } catch (err) { console.warn(err); }
                }}
                className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
              {project?.name || 'Untitled Project'}
            </h1>
            <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
              {project?.description || 'No description provided for this project.'}
            </p>
          </div>
        )}

        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Assigned Team</span>
            {canManageProject ? (
              <select
                value={project?.teamId || ''}
                onChange={async e => {
                  if (project && e.target.value) {
                    try {
                      await updateProject(project.id, { teamId: e.target.value });
                    } catch (err) { console.warn(err); }
                  }
                }}
                className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <div className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {teams.find(t => t.id === project?.teamId)?.name || 'Unassigned'}
              </div>
            )}
            <span className="text-[10px] text-neutral-400 block">{project?.templateType || 'SoftwareSprint'}</span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Target Date</span>
            <input
              type="date"
              value={project?.targetEndDate || ''}
              onChange={async e => {
                if (project) {
                  try {
                    await updateProject(project.id, { targetEndDate: e.target.value });
                  } catch (err) { console.warn(err); }
                }
              }}
              className="w-full px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
            />
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mt-1">
              <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[9px] text-neutral-400 text-right block">{progressPercent}% Progress</span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <span className="text-base font-bold text-emerald-600 block">{completedTasksCount}/{projectTasks.length}</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Tasks Completed</span>
            <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase">
              {projectTasks.length === 0 ? 'No tasks yet' : `${projectTasks.length - completedTasksCount} remaining`}
            </span>
          </div>
        </div>

        {/* Main Grid: Scoped Tasks + Right Column Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (3 Cols): Scoped Tasks */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Project Tasks</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                {completedTasksCount}/{projectTasks.length} Completed
              </span>
            </div>

            {taskError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-mono">
                {taskError}
              </div>
            )}

            <div className="space-y-2">
              {projectTasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl space-y-2">
                  <Clock className="w-5 h-5 mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-500 font-mono">No tasks added to this project yet.</p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Task
                  </button>
                </div>
              ) : (
                projectTasks.map(t => {
                  const isDone = t.status === 'Done';
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => toggleTaskStatus(t.id, t.status)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDone 
                          ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900' 
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${
                          isDone ? 'bg-black text-white dark:bg-white dark:text-black border-black' : 'border-neutral-300'
                        }`}>
                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className={`text-xs font-mono flex items-center gap-1.5 ${isDone ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100 font-medium'}`}>
                            <span>{t.title}</span>
                            {t.isPrivate && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                <Lock className="w-2.5 h-2.5" /> Private
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              {t.dueDate || 'No due date'}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{t.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isAdding ? (
                <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2 font-mono">
                  <input
                    type="text"
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    disabled={isSubmittingTask}
                    className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-800 focus:outline-none disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmittingTask}
                    className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingTask ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setNewTaskTitle(''); }}
                    className="px-2.5 py-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1.5 pt-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task to Project
                </button>
              )}
            </div>
          </div>

          {/* Right Column (2 Cols): Relationship Map, Assigned Team */}
          <div className="lg:col-span-2 space-y-4 font-mono">
            {/* Relationship Map Card */}
            <div className="p-5 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm font-sans">
                <Network className="w-4 h-4" /> Relationship Map
              </div>
              <p className="text-[11px] text-neutral-300 dark:text-neutral-700 font-sans leading-relaxed">
                Visualize dependencies and task connections for {project?.name}.
              </p>
              <button 
                onClick={handleOpenRelationshipMap}
                className="text-xs font-bold font-mono flex items-center gap-1 hover:underline pt-1 text-white dark:text-black cursor-pointer"
              >
                ACCESS MAP <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Assigned Team Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans uppercase tracking-wider">Assigned Team</span>
                <span className="text-[10px] font-mono text-neutral-400 font-bold">{assignedTeam?.name || 'Core Team'}</span>
              </div>

              <div className="space-y-2.5 font-sans">
                {displayMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={m.name} size="xs" />
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">{m.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400">{m.title || m.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Tags Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans uppercase tracking-wider">Project Tags</span>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(prev => !prev)}
                  className="text-[10px] text-neutral-500 hover:text-black dark:hover:text-white font-mono flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Tag
                </button>
              </div>

              {isAddingTag && (
                <div className="mb-2">
                  <select
                    onChange={async (e) => {
                      if (e.target.value && project) {
                        await attachTagToEntity(e.target.value, 'project', project.id);
                        setIsAddingTag(false);
                      }
                    }}
                    defaultValue=""
                    className="w-full p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                  >
                    <option value="" disabled>-- Select Tag to Attach --</option>
                    {tags.filter(t => !(project?.tagIds || []).includes(t.id)).map(t => (
                      <option key={t.id} value={t.id}>#{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {(project?.tagIds || []).length === 0 && !isAddingTag && (
                  <span className="text-[11px] text-neutral-400 italic font-mono">No tags attached</span>
                )}
                {(project?.tagIds || []).map(tid => {
                  const tg = tags.find(x => x.id === tid) || { id: tid, name: tid, colorHex: '#3B82F6', bgHex: 'rgba(59,130,246,0.1)', textHex: '#3B82F6' };
                  return (
                    <span 
                      key={tg.id} 
                      className="px-2.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1" 
                      style={{ backgroundColor: tg.bgHex, color: tg.textHex, borderColor: 'transparent' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tg.colorHex }} />
                      #{tg.name}
                      <button
                        type="button"
                        onClick={() => project && detachTagFromEntity(tg.id, 'project', project.id)}
                        className="opacity-60 hover:opacity-100 hover:text-red-600 ml-0.5 cursor-pointer"
                        title="Remove tag from project"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center font-mono">
        <button 
          onClick={popPanel}
          className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
        >
          Close
        </button>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }))}
          className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Task
        </button>
      </div>
    </div>
  );
};
