import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Plus, ShieldAlert, Clock, CheckCircle2, FolderPlus, Target, 
  Frown, Meh, Smile, Activity, ArrowUpRight, ChevronRight, 
  MoreVertical, Check, ExternalLink, GitGraph, 
  FolderGit2, Trash2, Calendar, RotateCw, Lock
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import type { Task, TaskStatus, Priority } from '../../types';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tasks, projects, goals, users, eodEntries, 
    submitEOD, deleteEOD, setActiveScreen, currentOrgSlug, pushPanel,
    updateTask, deleteTask, refreshWorkspaceData,
    currentUser, activeRole
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkspaceData(false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const [selectedSentiment, setSelectedSentiment] = useState<'sad' | 'neutral' | 'happy'>('happy');
  const [accomplishmentsNote, setAccomplishmentsNote] = useState('');
  const [blockersNote, setBlockersNote] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [activeTaskFilter, setActiveTaskFilter] = useState<'All' | 'Todo' | 'InProgress' | 'Blocked' | 'Done'>('All');
  
  // Context menu popovers
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);
  const [openTaskStatusMenuId, setOpenTaskStatusMenuId] = useState<string | null>(null);
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);

  const todayDate = new Date();
  const dateFormatted = todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const canViewTask = (t: Task) => {
    if (!t.isPrivate) return true;
    const isPrivileged = ['Admin', 'Executive', 'Manager'].includes(activeRole || currentUser?.role || '');
    const isAssigned = Boolean(currentUser?.id && t.assigneeIds && t.assigneeIds.includes(currentUser.id));
    const isCreator = Boolean(currentUser?.id && t.createdBy && t.createdBy === currentUser.id);
    return isPrivileged || isAssigned || isCreator;
  };

  const visibleTasks = tasks.filter(canViewTask);
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'Planning');
  const blockedTasks = visibleTasks.filter(t => t.status === 'Blocked');
  const completedTasks = visibleTasks.filter(t => t.status === 'Done');

  const handleLogReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    const indexMap = { sad: 1, neutral: 3, happy: 5 } as const;
    const isoDate = todayDate.toISOString().split('T')[0];

    const typedAccomplishments = accomplishmentsNote.trim()
      ? accomplishmentsNote.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const finalAccomplishments = typedAccomplishments.length > 0
      ? typedAccomplishments
      : (completedTasks.length > 0 ? completedTasks.slice(0, 3).map(t => `Completed: ${t.title}`) : []);

    const finalBlockers = hasBlocker ? blockersNote.trim() : (selectedSentiment === 'sad' ? blockersNote.trim() || 'Blocked / low bandwidth.' : '');

    await submitEOD({
      date: isoDate,
      accomplishments: finalAccomplishments,
      completedTaskIds: completedTasks.map(t => t.id),
      blockers: finalBlockers,
      energyIndex: indexMap[selectedSentiment],
      flaggedToManager: Boolean(finalBlockers)
    });

    setAccomplishmentsNote('');
    setBlockersNote('');
    setHasBlocker(false);
    setCheckinSuccess(true);
    setTimeout(() => setCheckinSuccess(false), 3000);
  };

  const filteredTasks = visibleTasks.filter(t => {
    if (activeTaskFilter === 'All') return true;
    return t.status === activeTaskFilter;
  });

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Done': return 'bg-emerald-500 text-white';
      case 'Blocked': return 'bg-red-500 text-white';
      case 'InProgress': return 'bg-blue-500 text-white';
      case 'AtRisk': return 'bg-amber-500 text-white';
      default: return 'bg-neutral-400 text-white';
    }
  };

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'Done': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Blocked': return 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 font-bold';
      case 'InProgress': return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'AtRisk': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getPriorityBadge = (priority?: Priority) => {
    if (priority === 'Urgent') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          Urgent
        </span>
      );
    }
    if (priority === 'High') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          High
        </span>
      );
    }
    return null;
  };

  // Close menus on click outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenTaskMenuId(null);
      setOpenTaskStatusMenuId(null);
      setOpenProjectMenuId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-semibold rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Refresh dashboard"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'project' } }));
            }}
            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-semibold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Project
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }));
            }}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Interactive Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Projects Card */}
        <div 
          onClick={() => {
            setActiveScreen('projects');
            navigate(`/${currentOrgSlug || 'epicordia'}/projects`);
          }}
          className="group p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-700 transition-all cursor-pointer space-y-2 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Total Projects</span>
            <div className="flex items-center gap-1">
              <FolderPlus className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">{projects.length}</span>
            <span className="text-xs text-neutral-500 font-mono group-hover:text-neutral-900 dark:group-hover:text-neutral-300 transition-colors">
              {activeProjects.length} Active
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-1">
            <span>Workspace projects</span>
            <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white flex items-center gap-0.5">
              Explore <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Active Tasks Card */}
        <div 
          onClick={() => {
            setActiveScreen('tasks');
            navigate(`/${currentOrgSlug || 'epicordia'}/tasks`);
          }}
          className="group p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-700 transition-all cursor-pointer space-y-2 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Active Tasks</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">{tasks.length}</span>
            <span className="text-xs text-neutral-500 font-mono group-hover:text-neutral-900 dark:group-hover:text-neutral-300 transition-colors">
              {completedTasks.length} Completed
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-1">
            <span>Assigned workspace tasks</span>
            <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white flex items-center gap-0.5">
              Manage <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Active Blockers Card (Pre-filters to Blocked tasks!) */}
        <div 
          onClick={() => {
            setActiveScreen('tasks');
            navigate(`/${currentOrgSlug || 'epicordia'}/tasks`, { state: { status: 'Blocked' } });
          }}
          className={`group p-5 rounded-2xl bg-white dark:bg-neutral-900 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 relative overflow-hidden ${
            blockedTasks.length > 0 
              ? 'border-red-300 dark:border-red-900/60 hover:border-red-500 bg-gradient-to-br from-red-50/30 to-white dark:from-red-950/20 dark:to-neutral-900' 
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span className={blockedTasks.length > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>Active Blockers</span>
            <div className="flex items-center gap-1">
              <ShieldAlert className={`w-4 h-4 ${blockedTasks.length > 0 ? 'text-red-500' : 'text-neutral-400'}`} />
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-extrabold tracking-tight ${blockedTasks.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
              {blockedTasks.length}
            </span>
            {blockedTasks.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                Action Req.
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Clear
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-1">
            <span>{blockedTasks.length > 0 ? 'Click to unblock tasks' : 'Tasks requiring unblocking'}</span>
            <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white flex items-center gap-0.5">
              Review <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Active Goals Card */}
        <div 
          onClick={() => {
            setActiveScreen('goals');
            navigate(`/${currentOrgSlug || 'epicordia'}/goals`);
          }}
          className="group p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-700 transition-all cursor-pointer space-y-2 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Active Goals</span>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">{goals.length}</span>
            <span className="text-xs text-neutral-500 font-mono">
              {goals.filter(g => g.status !== 'Achieved').length} Active
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-1">
            <span>Tracked Goals & targets</span>
            <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white flex items-center gap-0.5">
              View Goals <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>


      {/* Main Grid: Real Tasks & Real Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Tasks Triage & Projects Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks Triage Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Tasks Triage</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                  {tasks.length}
                </span>
              </div>

              {/* Triage Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-xs">
                {(['All', 'Todo', 'InProgress', 'Blocked', 'Done'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTaskFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTaskFilter === tab
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {tab === 'InProgress' ? 'In Progress' : tab}
                  </button>
                ))}

                <button 
                  onClick={() => {
                    setActiveScreen('tasks');
                    navigate(`/${currentOrgSlug || 'epicordia'}/tasks`);
                  }} 
                  className="pl-2 text-[11px] font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {activeTaskFilter === 'All' ? 'No tasks created yet' : `No tasks with status "${activeTaskFilter}"`}
                  </p>
                  <p className="text-[11px] text-neutral-500">Create a task to populate your execution board.</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }))}
                  className="px-3.5 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.slice(0, 6).map(task => {
                  const linkedProject = projects.find(p => p.id === task.projectId);
                  const assignees = users.filter(u => task.assigneeIds?.includes(u.id));

                  return (
                    <div 
                      key={task.id} 
                      onClick={() => pushPanel({ type: 'task', id: task.id })}
                      className="group p-3 sm:p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/30 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer relative"
                    >
                      {/* Left: Indicator, Title, Project Tag */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ${getStatusColor(task.status)}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                              {task.title}
                            </span>
                            {getPriorityBadge(task.priority)}
                            {task.isPrivate && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800" title="Private Task">
                                <Lock className="w-2.5 h-2.5" /> Private
                              </span>
                            )}
                          </div>
                          
                          {/* Sub-meta: Linked Project & Due Date */}
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-neutral-400">
                            {linkedProject && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  pushPanel({ type: 'project', id: linkedProject.id });
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                                title="Open project details"
                              >
                                <FolderGit2 className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[120px]">{linkedProject.name}</span>
                              </button>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Assignees, Status Badge Dropdown, and Context Action Menu */}
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        {/* Assignee Avatars */}
                        {assignees.length > 0 && (
                          <div className="hidden sm:flex items-center -space-x-1.5" onClick={e => e.stopPropagation()}>
                            {assignees.slice(0, 2).map(u => (
                              <button
                                key={u.id}
                                onClick={() => pushPanel({ type: 'person', id: u.id })}
                                title={`View ${u.name}'s profile`}
                                className="cursor-pointer transition-transform hover:scale-110 hover:z-10"
                              >
                                <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Interactive Status Badge Dropdown */}
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setOpenTaskStatusMenuId(openTaskStatusMenuId === task.id ? null : task.id);
                              setOpenTaskMenuId(null);
                            }}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${getStatusBadgeStyle(task.status)}`}
                            title="Click to quickly change status"
                          >
                            <span>{task.status}</span>
                            <span className="opacity-60 text-[8px]">▾</span>
                          </button>

                          {/* Status Popover Dropdown */}
                          {openTaskStatusMenuId === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 p-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 space-y-0.5 text-[11px] font-mono">
                              {(['Todo', 'InProgress', 'AtRisk', 'Blocked', 'Done'] as const).map(st => (
                                <button
                                  key={st}
                                  onClick={() => {
                                    updateTask(task.id, { status: st });
                                    setOpenTaskStatusMenuId(null);
                                  }}
                                  className={`w-full px-2 py-1 rounded-md text-left flex items-center justify-between transition-colors cursor-pointer ${
                                    task.status === st
                                      ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100'
                                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400'
                                  }`}
                                >
                                  <span>{st}</span>
                                  {task.status === st && <Check className="w-3 h-3 text-emerald-500" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3-Dots Context Menu Button */}
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setOpenTaskMenuId(openTaskMenuId === task.id ? null : task.id);
                              setOpenTaskStatusMenuId(null);
                            }}
                            className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                            title="Task actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Task Action Menu Popover */}
                          {openTaskMenuId === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 p-1.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 space-y-1 text-xs">
                              <button
                                onClick={() => {
                                  pushPanel({ type: 'task', id: task.id });
                                  setOpenTaskMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center gap-2 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Open Details</span>
                              </button>

                              {task.status !== 'Done' ? (
                                <button
                                  onClick={() => {
                                    updateTask(task.id, { status: 'Done' });
                                    setOpenTaskMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Done</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    updateTask(task.id, { status: 'InProgress' });
                                    setOpenTaskMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-2 cursor-pointer"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Mark In Progress</span>
                                </button>
                              )}

                              {task.status !== 'Blocked' && (
                                <button
                                  onClick={() => {
                                    updateTask(task.id, { status: 'Blocked' });
                                    setOpenTaskMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>Mark Blocked</span>
                                </button>
                              )}

                              {linkedProject && (
                                <button
                                  onClick={() => {
                                    pushPanel({ type: 'project', id: linkedProject.id });
                                    setOpenTaskMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2 cursor-pointer"
                                >
                                  <FolderGit2 className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>View Project</span>
                                </button>
                              )}

                              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                              <button
                                onClick={() => {
                                  deleteTask(task.id);
                                  setOpenTaskMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Task</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Projects Overview Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Projects Overview</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                  {projects.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'project' } }))}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] font-semibold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  New Project
                </button>

                <button 
                  onClick={() => {
                    setActiveScreen('projects');
                    navigate(`/${currentOrgSlug || 'epicordia'}/projects`);
                  }} 
                  className="text-[11px] font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
                >
                  View All ({projects.length}) <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No projects created yet</p>
                  <p className="text-[11px] text-neutral-500 font-mono">Create your first project to organize initiatives.</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'project' } }))}
                  className="px-3.5 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projects.slice(0, 5).map(proj => {
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const doneTasks = projTasks.filter(t => t.status === 'Done');
                  const progress = projTasks.length > 0 ? Math.round((doneTasks.length / projTasks.length) * 100) : (proj.status === 'Completed' ? 100 : 0);

                  return (
                    <div 
                      key={proj.id} 
                      onClick={() => pushPanel({ type: 'project', id: proj.id })}
                      className="group p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/30 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-2.5 text-xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FolderGit2 className="w-4 h-4 text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate block">
                              {proj.name}
                            </span>
                            {proj.description && (
                              <span className="text-[11px] text-neutral-400 line-clamp-1 font-normal">
                                {proj.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono" onClick={e => e.stopPropagation()}>
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                            proj.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : proj.status === 'Planning'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600'
                          }`}>
                            {proj.status}
                          </span>

                          {/* 3-Dots Project Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenProjectMenuId(openProjectMenuId === proj.id ? null : proj.id)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                              title="Project options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {openProjectMenuId === proj.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 p-1.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 space-y-1 text-xs">
                                <button
                                  onClick={() => {
                                    pushPanel({ type: 'project', id: proj.id });
                                    setOpenProjectMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Open Project Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    pushPanel({ type: 'relationship-map', projectId: proj.id });
                                    setOpenProjectMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center gap-2 cursor-pointer"
                                >
                                  <GitGraph className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Relationship Map</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveScreen('tasks');
                                    navigate(`/${currentOrgSlug || 'epicordia'}/tasks`, { state: { projectId: proj.id } });
                                    setOpenProjectMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center gap-2 cursor-pointer"
                                >
                                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>View Project Tasks ({projTasks.length})</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar & Task Count */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveScreen('tasks');
                              navigate(`/${currentOrgSlug || 'epicordia'}/tasks`, { state: { projectId: proj.id } });
                            }}
                            className="hover:underline hover:text-black dark:hover:text-white cursor-pointer"
                            title="Click to view tasks for this project"
                          >
                            {doneTasks.length}/{projTasks.length} tasks completed
                          </span>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress === 100 ? 'bg-emerald-500' : 'bg-black dark:bg-white'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Pulse Form & Team Pulse Standups Feed */}
        <div className="space-y-6">
          {/* Daily Pulse Log Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <span>Daily Pulse Check-in</span>
                  {checkinSuccess && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Saved!
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Share today's blockers & wins with your team.</p>
              </div>
              <button
                onClick={() => {
                  setActiveScreen('pulse');
                  navigate(`/${currentOrgSlug || 'epicordia'}/pulse`);
                }}
                className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Open Full Standup screen"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogReflection} className="space-y-3.5 text-xs">
              {/* Energy / Sentiment Selector */}
              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Today's Energy & Pace
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSentiment('sad');
                      setHasBlocker(true);
                    }}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedSentiment === 'sad'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30'
                    }`}
                  >
                    <Frown className="w-4 h-4" />
                    <span className="text-[10px] font-mono">Blocked</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSentiment('neutral')}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedSentiment === 'neutral'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30'
                    }`}
                  >
                    <Meh className="w-4 h-4" />
                    <span className="text-[10px] font-mono">Steady</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSentiment('happy')}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedSentiment === 'happy'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-50/50 dark:bg-neutral-800/30'
                    }`}
                  >
                    <Smile className="w-4 h-4" />
                    <span className="text-[10px] font-mono">High Flow</span>
                  </button>
                </div>
              </div>

              {/* Accomplishments input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  Accomplishments / Wins
                </label>
                <textarea
                  rows={2}
                  value={accomplishmentsNote}
                  onChange={e => setAccomplishmentsNote(e.target.value)}
                  placeholder="What did you get done today? (or leave blank to use completed tasks)"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
                />
              </div>

              {/* Blocker toggle & input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                    Blockers or Impediments
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasBlocker(!hasBlocker)}
                    className="text-[10px] font-mono text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer underline"
                  >
                    {hasBlocker ? 'Cancel Blocker' : '+ Add Blocker'}
                  </button>
                </div>

                {hasBlocker && (
                  <textarea
                    rows={2}
                    value={blockersNote}
                    onChange={e => setBlockersNote(e.target.value)}
                    placeholder="Describe what's holding you back (e.g. Waiting on API approval)..."
                    className="w-full p-2.5 rounded-xl border border-red-300 dark:border-red-900/80 bg-red-50/40 dark:bg-red-950/20 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-red-500"
                  />
                )}
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen('pulse');
                    navigate(`/${currentOrgSlug || 'epicordia'}/pulse`);
                  }}
                  className="text-[11px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                >
                  Full Wizard →
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Submit Check-in
                </button>
              </div>
            </form>
          </div>

          {/* Real Team Pulse Check-ins Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Recent Team Check-ins
              </h3>

              <button 
                onClick={() => {
                  setActiveScreen('pulse');
                  navigate(`/${currentOrgSlug || 'epicordia'}/pulse`);
                }}
                className="text-[11px] font-mono font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                View Feed ({eodEntries.length}) <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {eodEntries.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 font-mono">
                No check-ins submitted yet today.
              </div>
            ) : (
              <div className="space-y-3">
                {eodEntries.slice(0, 5).map(entry => {
                  const entryUser = users.find(u => u.id === entry.userId || u.name === entry.userName);
                  const displayName = entryUser?.name || entry.userName || 'Team Member';
                  const displayAvatar = entryUser?.avatarUrl || entry.userAvatar;
                  const displayRole = entryUser?.role || entry.userRole || 'Member';
                  const hasActiveBlocker = Boolean(entry.blockers && entry.blockers.trim() && entry.blockers.toLowerCase() !== 'no blockers');
                  const linkedBlockedTask = entry.blockedTaskId ? tasks.find(t => t.id === entry.blockedTaskId) : undefined;

                  return (
                    <div 
                      key={entry.id} 
                      onClick={() => {
                        setActiveScreen('pulse');
                        navigate(`/${currentOrgSlug || 'epicordia'}/pulse`);
                      }}
                      className="group p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all space-y-2 text-xs font-mono cursor-pointer"
                    >
                      {/* Top Author Row */}
                      <div className="flex justify-between items-center text-[11px]">
                        <div 
                          className="flex items-center gap-2 min-w-0" 
                          onClick={(e) => {
                            if (entryUser) {
                              e.stopPropagation();
                              pushPanel({ type: 'person', id: entryUser.id });
                            }
                          }}
                        >
                          <UserAvatar name={displayName} avatarUrl={displayAvatar} size="xs" />
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate hover:underline block leading-tight">
                              {displayName}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              {displayRole}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Energy index badge */}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            entry.energyIndex >= 4 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                              : entry.energyIndex === 3 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {entry.energyIndex >= 4 ? 'High' : entry.energyIndex === 3 ? 'Steady' : 'Low'} ({entry.energyIndex}/5)
                          </span>
                          <span className="text-neutral-400 text-[10px]">{entry.date}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this check-in?')) {
                                deleteEOD(entry.id);
                              }
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Delete check-in"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Accomplishments */}
                      {entry.accomplishments && entry.accomplishments.length > 0 ? (
                        <div className="space-y-1 pt-0.5">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">
                            Accomplishments:
                          </span>
                          <ul className="space-y-0.5 text-neutral-700 dark:text-neutral-300 font-sans text-xs">
                            {entry.accomplishments.map((acc, aIdx) => (
                              <li key={aIdx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{acc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (!entry.completedTaskIds || entry.completedTaskIds.length === 0) ? (
                        <div className="text-[11px] text-neutral-400 italic">
                          General pulse logged (no tasks specified)
                        </div>
                      ) : null}

                      {/* Completed Task Pills */}
                      {entry.completedTaskIds && entry.completedTaskIds.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5" onClick={e => e.stopPropagation()}>
                          {entry.completedTaskIds.map(taskId => {
                            const refTask = tasks.find(t => t.id === taskId);
                            return (
                              <button
                                key={taskId}
                                onClick={() => pushPanel({ type: 'task', id: taskId })}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors truncate max-w-[140px] cursor-pointer inline-flex items-center gap-1"
                                title={refTask?.title || taskId}
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{refTask?.title || 'Done Task'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Blockers alert badge or No Blockers pill */}
                      {hasActiveBlocker ? (
                        <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            <span>Blocker:</span>
                            {entry.flaggedToManager && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 uppercase font-mono ml-auto">
                                Alert Flagged
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xs text-red-800 dark:text-red-200 pl-5">
                            {entry.blockers}
                          </p>
                          {linkedBlockedTask && (
                            <div className="pl-5 pt-0.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => pushPanel({ type: 'task', id: linkedBlockedTask.id })}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-300 hover:underline cursor-pointer"
                              >
                                ↳ Task: {linkedBlockedTask.title}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 pt-0.5">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>No blockers reported</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
