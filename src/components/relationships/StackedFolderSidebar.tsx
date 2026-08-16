import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Search, 
  CheckCircle2, Circle, AlertCircle, Ban, 
  Target, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskStatus, Team, Project, Task, Goal, Tag } from '../../types';

interface StackedFolderSidebarProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, type: 'team' | 'project' | 'person' | 'task' | 'goal' | 'tag') => void;
  expandedFolderIds: string[];
  onToggleFolder: (id: string) => void;
}

export const StackedFolderSidebar: React.FC<StackedFolderSidebarProps> = ({
  selectedNodeId,
  onSelectNode,
  expandedFolderIds,
  onToggleFolder
}) => {
  const { teams, projects, users, tasks, goals, tags, eodEntries } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'folders' | 'tags'>('hierarchy');

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />;
      case 'InProgress':
        return <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent animate-spin" />;
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
    if (todayEod.flaggedToManager || todayEod.blockedTaskId) return 'blocked';
    if (todayEod.energyIndex <= 2) return 'low';
    return 'good';
  };

  const isExpanded = (id: string) => expandedFolderIds.includes(id);

  const filteredTeams = teams.filter((t: Team) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = projects.filter((p: Project) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-80 h-full bg-[#EAEBED]/70 dark:bg-neutral-900/90 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col font-sans shrink-0 backdrop-blur-md select-none">
      {/* Header matching reference mockup menu card aesthetic */}
      <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
              Explorer
            </span>
          </div>

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
              onClick={() => setActiveTab('folders')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                activeTab === 'folders'
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

      {/* Stacked Folders Tree Viewport */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {activeTab === 'hierarchy' && (
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
              <span>Level 0: Organization</span>
              <span className="text-[9px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                {teams.length} Teams
              </span>
            </div>

            {filteredTeams.map((team: Team) => {
              const isTeamExpanded = isExpanded(`team-${team.id}`);
              const isTeamSelected = selectedNodeId === `team-${team.id}`;
              const teamProjects = projects.filter((p: Project) => p.teamId === team.id);

              return (
                <div key={team.id} className="space-y-1">
                  {/* Team Pill Row */}
                  <div
                    onClick={() => {
                      onToggleFolder(`team-${team.id}`);
                      onSelectNode(team.id, 'team');
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isTeamSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-sm'
                        : 'bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                        {isTeamExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />}
                      </span>
                      <span className="truncate text-xs font-semibold">{team.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                        isTeamSelected 
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' 
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                      }`}>
                        {teamProjects.length} proj
                      </span>
                      {isTeamExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                  </div>

                  {/* Level 1: Nested Projects inside Team */}
                  <AnimatePresence>
                    {isTeamExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 border-l-2 border-neutral-300/60 dark:border-neutral-700/60 ml-3 space-y-1.5 my-1"
                      >
                        {teamProjects.length === 0 ? (
                          <div className="text-[11px] text-neutral-400 py-1 pl-2 font-mono">No active projects</div>
                        ) : (
                          teamProjects.map((project: Project) => {
                            const isProjExpanded = isExpanded(`proj-${project.id}`);
                            const isProjSelected = selectedNodeId === `proj-${project.id}`;
                            const projectTasks = tasks.filter((t: Task) => t.projectId === project.id);
                            const projectGoals = goals.filter((g: Goal) => project.linkedGoalIds.includes(g.id));
                            const projectPeople = users.filter(u => project.memberIds.includes(u.id));

                            return (
                              <div key={project.id} className="space-y-1">
                                {/* Project Folder Pill */}
                                <div
                                  onClick={() => {
                                    onToggleFolder(`proj-${project.id}`);
                                    onSelectNode(project.id, 'project');
                                  }}
                                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                                    isProjSelected
                                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black font-bold shadow-xs'
                                      : 'bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Folder className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                                    <span className="truncate text-xs">{project.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[9px] font-mono opacity-70">
                                      Lvl 1
                                    </span>
                                    {isProjExpanded ? (
                                      <ChevronDown className="w-3 h-3 opacity-60" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 opacity-60" />
                                    )}
                                  </div>
                                </div>

                                {/* Level 2 & 3: Nested People & Tasks inside Project */}
                                <AnimatePresence>
                                  {isProjExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="pl-3 border-l border-neutral-300/40 dark:border-neutral-700/40 ml-2.5 space-y-1 my-1"
                                    >
                                      {/* People Section */}
                                      <div className="pt-1">
                                        <div className="px-1 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                                          Level 2: Team Members ({projectPeople.length})
                                        </div>
                                        {projectPeople.map(person => {
                                          const isPersonSelected = selectedNodeId === `usr-${person.id}` || selectedNodeId === person.id;
                                          const eodStatus = getUserEodStatus(person.id);

                                          return (
                                            <div
                                              key={person.id}
                                              onClick={() => onSelectNode(person.id, 'person')}
                                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                                                isPersonSelected
                                                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black font-semibold'
                                                  : 'hover:bg-white/80 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className="relative">
                                                  <img
                                                    src={person.avatarUrl}
                                                    alt={person.name}
                                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                                  />
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

                                      {/* Goals Section */}
                                      {projectGoals.length > 0 && (
                                        <div className="pt-1">
                                          <div className="px-1 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                                            Level 4: Aligned Goals
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

                                      {/* Tasks Section */}
                                      <div className="pt-1 space-y-1">
                                        <div className="px-1 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
                                          <span>Level 3: Tasks ({projectTasks.length})</span>
                                        </div>
                                        {projectTasks.map((task: Task) => {
                                          const isTaskSelected = selectedNodeId === `task-${task.id}` || selectedNodeId === task.id;

                                          return (
                                            <div
                                              key={task.id}
                                              onClick={() => onSelectNode(task.id, 'task')}
                                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                                                isTaskSelected
                                                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
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
                              </div>
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

        {activeTab === 'folders' && (
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              All Projects Stack ({projects.length})
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
                      <Folder className="w-4 h-4 text-blue-500" />
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
                    <span>{proj.memberIds.length} assigned</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Governed Swatches ({tags.length})
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
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: tag.colorHex }} 
                        />
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
        <span>Active Depth: Lvl 0-4</span>
        <span className="text-black dark:text-white font-bold">Obsidian Engine</span>
      </div>
    </div>
  );
};
