import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  ChevronRight, Search, 
  CheckCircle2, Circle, AlertCircle, Ban, 
  Target, X, PanelLeftClose, PanelLeftOpen, Edit2, Trash2, Check,
  GitBranch, Users, Briefcase, Tag as TagIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskStatus, Team, Project, Task, Goal, Tag } from '../../types';
import { getProjectContributors, normalizeEntityId } from '../../utils/projectContributors';

interface StackedFolderSidebarProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, type: 'team' | 'project' | 'person' | 'task' | 'goal' | 'tag') => void;
  expandedFolderIds: string[];
  onToggleFolder: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StackedFolderSidebar: React.FC<StackedFolderSidebarProps> = ({
  selectedNodeId,
  onSelectNode,
  expandedFolderIds,
  onToggleFolder,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { teams, projects, users, tasks, goals, tags, eodEntries, updateTask, updateProject, deleteProject } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'projects' | 'tags'>('hierarchy');

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'InProgress':
        return <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />;
      case 'Blocked':
        return <Ban className="w-3.5 h-3.5 text-red-500" />;
      case 'AtRisk':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'Todo':
      default:
        return <Circle className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getUserEodStatus = (userId: string) => {
    const todayEod = eodEntries.find(e => e.userId === userId);
    if (!todayEod) return 'neutral';
    if (todayEod.flaggedToManager || todayEod.blockedTaskId || (todayEod.blockers && todayEod.blockers.trim() && todayEod.blockers.toLowerCase() !== 'no blockers')) return 'blocked';
    return 'good';
  };

  const isExpanded = (id: string) => expandedFolderIds.includes(id);

  const filteredTeams = teams.filter((t: Team) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = projects.filter((p: Project) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-[#EAEBED]/70 dark:bg-neutral-900/90 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col items-center py-4 font-sans shrink-0 backdrop-blur-md select-none transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-xs"
          title="Expand Hierarchy Explorer"
          aria-label="Expand Hierarchy Explorer"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="mt-6 flex-1 flex flex-col gap-4 items-center font-mono text-[10px] text-neutral-400">
          <GitBranch className="w-4 h-4 text-neutral-400" />
          <div className="writing-mode-vertical rotate-180 font-bold uppercase tracking-widest opacity-60">
            Explorer
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-[#EAEBED]/70 dark:bg-neutral-900/90 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col font-sans shrink-0 backdrop-blur-md select-none transition-all duration-300">
      {/* Header with clean Modern Tabs */}
      <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-bold shadow-xs">
              <GitBranch className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
              Explorer
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px] font-mono">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'hierarchy'
                    ? 'bg-white dark:bg-neutral-700 text-black dark:text-white font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Tree
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'projects'
                    ? 'bg-white dark:bg-neutral-700 text-black dark:text-white font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'tags'
                    ? 'bg-white dark:bg-neutral-700 text-black dark:text-white font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Tags
              </button>
            </div>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                title="Collapse Explorer"
                aria-label="Collapse Explorer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hierarchy..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Viewport with Smooth Cascading Animations & Rotating Chevrons */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {activeTab === 'hierarchy' && (
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
              <span>Organization Tree</span>
              <span className="text-[9px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                {teams.length} Teams
              </span>
            </div>

            {filteredTeams.map((team: Team) => {
              const isTeamExpanded = isExpanded(`team-${team.id}`);
              const isTeamSelected = selectedNodeId === `team-${team.id}` || selectedNodeId === team.id;
              const teamProjects = projects.filter((p: Project) => {
                const linkedTeams = p.teamIds !== undefined ? p.teamIds : (p.teamId ? [p.teamId] : []);
                return linkedTeams.includes(team.id);
              });

              return (
                <div key={team.id} className="space-y-1">
                  {/* Team Row */}
                  <div
                    onClick={() => {
                      onToggleFolder(`team-${team.id}`);
                      onSelectNode(team.id, 'team');
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const dataStr = e.dataTransfer.getData('application/pulse-node');
                      if (dataStr) {
                        try {
                          const payload = JSON.parse(dataStr);
                          if (payload.type === 'project') {
                            const targetProj = projects.find(p => p.id === payload.id);
                            if (targetProj) {
                              const currentTeams = targetProj.teamIds && targetProj.teamIds.length > 0 ? targetProj.teamIds : [targetProj.teamId];
                              if (!currentTeams.includes(team.id)) {
                                const newTeamIds = [...currentTeams, team.id];
                                updateProject(payload.id, { teamIds: newTeamIds, teamId: team.id });
                              }
                            }
                          }
                        } catch {}
                      }
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isTeamSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-sm ring-1 ring-black/20 dark:ring-white/20'
                        : 'bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1 rounded-lg ${isTeamSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'}`}>
                        <Users className="w-3.5 h-3.5 shrink-0" />
                      </span>
                      <span className="truncate text-xs font-semibold">{team.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                        isTeamSelected 
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' 
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                      }`}>
                        {teamProjects.length} proj
                      </span>
                      
                      {/* Smooth 90° Rotating Chevron */}
                      <motion.div
                        animate={{ rotate: isTeamExpanded ? 90 : 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="opacity-60"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Cascading Staggered Projects */}
                  <AnimatePresence>
                    {isTeamExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="pl-3 border-l-2 border-neutral-300/60 dark:border-neutral-700/60 ml-3 space-y-1.5 my-1"
                      >
                        {teamProjects.length === 0 ? (
                          <div className="text-[11px] text-neutral-400 py-1 pl-2 font-mono">No active projects</div>
                        ) : (
                          teamProjects.map((project: Project, pIdx: number) => {
                            const isProjExpanded = isExpanded(`proj-${project.id}`);
                            const isProjSelected = selectedNodeId === `proj-${project.id}` || selectedNodeId === project.id;
                            const projectTasks = tasks.filter((t: Task) => t.projectId === project.id);
                            const projectGoals = goals.filter((g: Goal) => project.linkedGoalIds.includes(g.id));
                            const projectPeople = getProjectContributors(project, teams, users, tasks);
                            const isMultiTeam = project.teamIds && project.teamIds.length > 1;

                            return (
                              <motion.div 
                                key={project.id} 
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: pIdx * 0.035, duration: 0.18 }}
                                className="space-y-1"
                              >
                                {/* Project Pill */}
                                <div
                                  draggable={true}
                                  onDragStart={e => {
                                    e.dataTransfer.setData('application/pulse-node', JSON.stringify({ id: project.id, type: 'project', label: project.name, teamId: project.teamId }));
                                  }}
                                  onDragOver={e => e.preventDefault()}
                                  onDrop={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dataStr = e.dataTransfer.getData('application/pulse-node');
                                    if (dataStr) {
                                      try {
                                        const payload = JSON.parse(dataStr);
                                        if (payload.type === 'task') {
                                          updateTask(payload.id, { projectId: project.id });
                                        }
                                      } catch {}
                                    }
                                  }}
                                  onClick={() => {
                                    onToggleFolder(`proj-${project.id}`);
                                    onSelectNode(project.id, 'project');
                                  }}
                                  className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs cursor-grab active:cursor-grabbing transition-all ${
                                    isProjSelected
                                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black font-bold shadow-xs ring-1 ring-black/20 dark:ring-white/20'
                                      : 'bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60'
                                  }`}
                                >
                                  {editingProjectId === project.id ? (
                                    <div className="flex items-center gap-1 min-w-0 flex-1" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editingProjectName}
                                        onChange={e => setEditingProjectName(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            if (editingProjectName.trim()) {
                                              updateProject(project.id, { name: editingProjectName.trim() });
                                            }
                                            setEditingProjectId(null);
                                          } else if (e.key === 'Escape') {
                                            setEditingProjectId(null);
                                          }
                                        }}
                                        className="w-full px-2 py-0.5 rounded-md border border-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-semibold focus:outline-none"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          if (editingProjectName.trim()) {
                                            updateProject(project.id, { name: editingProjectName.trim() });
                                          }
                                          setEditingProjectId(null);
                                        }}
                                        className="p-1 text-emerald-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md shrink-0"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={`p-1 rounded-md ${isProjSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'}`}>
                                          <Briefcase className="w-3 h-3 shrink-0" />
                                        </span>
                                        <span 
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProjectId(project.id);
                                            setEditingProjectName(project.name);
                                          }}
                                          className="truncate text-xs font-semibold"
                                          title="Double click to rename project"
                                        >
                                          {project.name}
                                        </span>
                                        {isMultiTeam && (
                                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono font-bold shrink-0">
                                            Multi-Team
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProjectId(project.id);
                                            setEditingProjectName(project.name);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-black dark:hover:text-white transition-opacity"
                                          title="Rename Project"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isMultiTeam) {
                                              const updatedTeams = (project.teamIds || []).filter(tId => tId !== team.id);
                                              updateProject(project.id, { teamIds: updatedTeams, teamId: updatedTeams[0] || 'team-eng' });
                                            } else {
                                              deleteProject(project.id);
                                            }
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity"
                                          title={isMultiTeam ? "Unlink from this team" : "Delete project"}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>

                                        {/* Smooth 90° Rotating Chevron */}
                                        <motion.div
                                          animate={{ rotate: isProjExpanded ? 90 : 0 }}
                                          transition={{ duration: 0.18, ease: "easeInOut" }}
                                          className="opacity-60"
                                        >
                                          <ChevronRight className="w-3 h-3" />
                                        </motion.div>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Cascading Tasks & Contributors */}
                                <AnimatePresence>
                                  {isProjExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2, ease: "easeInOut" }}
                                      className="pl-3 border-l border-neutral-300/40 dark:border-neutral-700/40 ml-2 space-y-1 my-1"
                                    >
                                      {/* Contributors */}
                                      {projectPeople.length > 0 && (
                                        <div className="pt-1">
                                          <div className="px-1 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                                            Contributors ({projectPeople.length})
                                          </div>
                                          {projectPeople.map(person => {
                                            const cleanSelected = normalizeEntityId(selectedNodeId);
                                            const isPersonSelected = selectedNodeId === `usr-${person.id}` || selectedNodeId === person.id || cleanSelected === person.id || cleanSelected === normalizeEntityId(person.id);
                                            const eodStatus = getUserEodStatus(person.id);

                                            return (
                                              <div
                                                key={person.id}
                                                onClick={() => onSelectNode(`usr-${person.id}`, 'person')}
                                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                                                  isPersonSelected
                                                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black font-semibold'
                                                    : 'hover:bg-white/80 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <div className="relative">
                                                    <UserAvatar name={person.name} avatarUrl={person.avatarUrl} size="xs" />
                                                    {eodStatus === 'blocked' && (
                                                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                                    )}
                                                  </div>
                                                  <span className="truncate">{person.name}</span>
                                                </div>
                                                <span className="text-[9px] text-neutral-400 font-mono">
                                                  {person.role}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Goals */}
                                      {projectGoals.length > 0 && (
                                        <div className="pt-1">
                                          <div className="px-1 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                                            Goals
                                          </div>
                                          {projectGoals.map((goal: Goal) => {
                                            const isGoalSelected = selectedNodeId === `goal-${goal.id}` || selectedNodeId === goal.id;
                                            return (
                                              <div
                                                key={goal.id}
                                                onClick={() => onSelectNode(goal.id, 'goal')}
                                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                                                  isGoalSelected
                                                    ? 'bg-purple-900 text-white dark:bg-purple-100 dark:text-black font-semibold'
                                                    : 'hover:bg-white/80 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                              >
                                                <Target className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                                <span className="truncate">{goal.title}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Tasks */}
                                      <div className="pt-1 space-y-1">
                                        <div className="px-1 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
                                          <span>Tasks ({projectTasks.length})</span>
                                        </div>
                                        {projectTasks.map((task: Task) => {
                                          const isTaskSelected = selectedNodeId === `task-${task.id}` || selectedNodeId === task.id;

                                          return (
                                            <div
                                              key={task.id}
                                              draggable={true}
                                              onDragStart={e => {
                                                e.dataTransfer.setData('application/pulse-node', JSON.stringify({ id: task.id, type: 'task', label: task.title }));
                                              }}
                                              onClick={() => onSelectNode(task.id, 'task')}
                                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] cursor-grab active:cursor-grabbing transition-all ${
                                                isTaskSelected
                                                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs ring-1 ring-black/20 dark:ring-white/20'
                                                  : 'bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/30'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="shrink-0">{getTaskStatusIcon(task.status)}</span>
                                                <span className="truncate text-xs font-mono">{task.title}</span>
                                              </div>
                                              <span className="text-[9px] font-mono text-neutral-400 shrink-0">
                                                {task.priority}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              All Projects ({projects.length})
            </div>
            {filteredProjects.map((proj: Project) => {
              const isSelected = selectedNodeId === `proj-${proj.id}` || selectedNodeId === proj.id;
              const projTasks = tasks.filter((t: Task) => t.projectId === proj.id);

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectNode(proj.id, 'project')}
                  className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                      : 'bg-white dark:bg-neutral-800/80 hover:bg-neutral-50 border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      <span>{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-70 line-clamp-2 leading-relaxed font-mono">
                    {proj.description}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-[10px] font-mono">
                    <span>{projTasks.length} tasks</span>
                    <span>{getProjectContributors(proj, teams, users, tasks).length} assigned</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Governed Tags ({tags.length})
            </div>
            <div className="grid grid-cols-1 gap-2">
              {tags.map((tag: Tag) => {
                const isSelected = selectedNodeId === `tag-${tag.id}` || selectedNodeId === tag.id;
                const taggedTasks = tasks.filter((t: Task) => t.tagIds.includes(tag.id));

                return (
                  <div
                    key={tag.id}
                    onClick={() => onSelectNode(tag.id, 'tag')}
                    className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-2 border-black dark:border-white bg-white dark:bg-neutral-800 shadow-sm'
                        : 'bg-white dark:bg-neutral-800/60 hover:bg-neutral-50 border-neutral-200/80 dark:border-neutral-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3.5 h-3.5" style={{ color: tag.colorHex }} />
                        <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                          {tag.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {taggedTasks.length} items
                      </span>
                    </div>
                    {tag.description && (
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                        {tag.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
        <span>Hierarchy Navigator</span>
        <span className="text-black dark:text-white font-bold">Pulse v2</span>
      </div>
    </div>
  );
};
