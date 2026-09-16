import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  X, ExternalLink, Folder, Target, Users, ShieldAlert, 
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EntityType } from '../../types';
import { getProjectContributors } from '../../utils/projectContributors';

interface NodeDetailPopupCardProps {
  selectedNodeId: string | null;
  selectedNodeType?: EntityType | null;
  onClose: () => void;
}

export const NodeDetailPopupCard: React.FC<NodeDetailPopupCardProps> = ({
  selectedNodeId,
  selectedNodeType,
  onClose
}) => {
  const navigate = useNavigate();
  const { 
    teams, projects, users, tasks, goals, tags, eodEntries, 
    pushPanel, setActiveScreen, currentOrgSlug 
  } = useApp();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedNodeId) return null;

  // Clean raw ID and handle compound strings
  let rawId = selectedNodeId;
  let detectedType: EntityType | 'core' | null = null;

  if (rawId === 'core-org' || rawId === 'org-core' || rawId === currentOrgSlug) {
    detectedType = 'core';
  } else if (rawId.startsWith('usr-') || rawId.startsWith('user-')) {
    detectedType = 'person';
    rawId = rawId.replace(/^usr-|^user-/, '');
    if (rawId.includes('-team-')) rawId = rawId.split('-team-')[0];
    if (rawId.includes('-proj-')) rawId = rawId.split('-proj-')[0];
  } else if (rawId.startsWith('team-')) {
    detectedType = 'team';
    rawId = rawId.replace(/^team-/, '');
  } else if (rawId.startsWith('proj-')) {
    detectedType = 'project';
    rawId = rawId.replace(/^proj-/, '');
  } else if (rawId.startsWith('task-')) {
    detectedType = 'task';
    rawId = rawId.replace(/^task-/, '');
  } else if (rawId.startsWith('goal-')) {
    detectedType = 'goal';
    rawId = rawId.replace(/^goal-/, '');
  } else if (rawId.startsWith('tag-')) {
    detectedType = 'tag';
    rawId = rawId.replace(/^tag-/, '');
  }

  // If selectedNodeType prop is provided, prefer it if no explicit prefix
  const targetType = selectedNodeType || detectedType;

  // Lookup across collections
  const taskData = tasks.find(t => t.id === rawId || t.id === selectedNodeId || t.id === `task-${rawId}`);
  const projectData = projects.find(p => p.id === rawId || p.id === selectedNodeId || p.id === `proj-${rawId}`);
  const userData = users.find(u => u.id === rawId || u.id === selectedNodeId || u.id === `usr-${rawId}` || u.id === `user-${rawId}`);
  const teamData = teams.find(t => t.id === rawId || t.id === selectedNodeId || t.id === `team-${rawId}`);
  const goalData = goals.find(g => g.id === rawId || g.id === selectedNodeId || g.id === `goal-${rawId}`);
  const tagData = tags.find(t => t.id === rawId || t.id === selectedNodeId || t.id === `tag-${rawId}`);

  // Final entityType determination
  let resolvedType: EntityType | 'core' = 'project';
  if (detectedType === 'core') {
    resolvedType = 'core';
  } else if (targetType === 'task' && taskData) {
    resolvedType = 'task';
  } else if (targetType === 'project' && projectData) {
    resolvedType = 'project';
  } else if (targetType === 'person' && userData) {
    resolvedType = 'person';
  } else if (targetType === 'team' && teamData) {
    resolvedType = 'team';
  } else if (targetType === 'goal' && goalData) {
    resolvedType = 'goal';
  } else if (targetType === 'tag' && tagData) {
    resolvedType = 'tag';
  } else if (taskData) {
    resolvedType = 'task';
  } else if (projectData) {
    resolvedType = 'project';
  } else if (userData) {
    resolvedType = 'person';
  } else if (teamData) {
    resolvedType = 'team';
  } else if (goalData) {
    resolvedType = 'goal';
  } else if (tagData) {
    resolvedType = 'tag';
  } else if (selectedNodeId === 'core-org' || selectedNodeId === 'org-core') {
    resolvedType = 'core';
  } else if (targetType) {
    resolvedType = targetType;
  }

  const handleOpenDrawer = () => {
    if (resolvedType === 'task' && taskData) {
      pushPanel({ type: 'task', id: taskData.id });
    } else if (resolvedType === 'project' && projectData) {
      pushPanel({ type: 'project', id: projectData.id });
    } else if (resolvedType === 'person' && userData) {
      pushPanel({ type: 'person', id: userData.id });
    } else if (resolvedType === 'goal' && goalData) {
      pushPanel({ type: 'goal', id: goalData.id });
    } else if (resolvedType === 'tag' && tagData) {
      pushPanel({ type: 'tag', id: tagData.id });
    } else if (resolvedType === 'team' && teamData) {
      if (teamData.leadId) {
        pushPanel({ type: 'person', id: teamData.leadId });
      } else {
        setActiveScreen('team');
        navigate(`/${currentOrgSlug || 'epicordia'}/team`);
      }
    } else if (resolvedType === 'core') {
      setActiveScreen('dashboard');
      navigate(`/${currentOrgSlug || 'epicordia'}/dashboard`);
    } else if (projectData) {
      pushPanel({ type: 'project', id: projectData.id });
    } else if (userData) {
      pushPanel({ type: 'person', id: userData.id });
    } else if (taskData) {
      pushPanel({ type: 'task', id: taskData.id });
    }
  };

  const userEod = userData ? eodEntries.find(e => e.userId === userData.id) : null;
  const projectContributors = projectData ? getProjectContributors(projectData, teams, users, tasks) : [];
  const projectTasks = projectData ? tasks.filter(t => t.projectId === projectData.id) : [];
  const completedProjectTasks = projectTasks.filter(t => t.status === 'Done');
  const projectProgress = projectTasks.length > 0 ? Math.round((completedProjectTasks.length / projectTasks.length) * 100) : 0;
  const projectTeam = projectData ? teams.find(t => t.id === projectData.teamId || (projectData.teamIds && projectData.teamIds.includes(t.id))) : null;
  const taskProject = taskData ? projects.find(p => p.id === taskData.projectId) : null;
  const taskAssignees = taskData ? users.filter(u => taskData.assigneeIds.includes(u.id)) : [];
  const teamMembers = teamData ? users.filter(u => (teamData.memberIds || []).includes(u.id) || u.teamId === teamData.id || teamData.leadId === u.id) : [];
  const teamProjects = teamData ? projects.filter(p => p.teamId === teamData.id || (p.teamIds && p.teamIds.includes(teamData.id))) : [];
  const userProjects = userData ? projects.filter(p => getProjectContributors(p, teams, users, tasks).some(u => u.id === userData.id)) : [];
  const userTasks = userData ? tasks.filter(t => t.assigneeIds.includes(userData.id)) : [];

  const orgDisplayName = currentOrgSlug 
    ? currentOrgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    : 'Workspace Core';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="absolute bottom-6 right-6 z-40 w-80 sm:w-96 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 shadow-2xl backdrop-blur-xl p-4 font-sans overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 border ${
              resolvedType === 'task' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
              resolvedType === 'project' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' :
              resolvedType === 'person' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
              resolvedType === 'team' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
              resolvedType === 'goal' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800' :
              resolvedType === 'tag' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
            }`}>
              {resolvedType === 'core' ? 'ORGANIZATION' : resolvedType}
            </span>

            <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[150px]">
              #{rawId.length > 12 ? `${rawId.slice(0, 8)}...` : rawId}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details: Task */}
        {resolvedType === 'task' && taskData && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                {taskData.title}
              </h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                taskData.status === 'Done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                taskData.status === 'Blocked' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse' :
                taskData.status === 'AtRisk' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                taskData.status === 'InProgress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 
                'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {taskData.status}
              </span>
            </div>

            {taskData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                {taskData.description}
              </p>
            )}

            {taskData.blockedReason && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Blocker:</strong> {taskData.blockedReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Priority</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{taskData.priority}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Due Date</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{taskData.dueDate || 'No date'}</span>
              </div>
            </div>

            {taskProject && (
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Project: <strong className="text-neutral-900 dark:text-neutral-100">{taskProject.name}</strong></span>
              </div>
            )}

            {taskAssignees.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-mono text-neutral-400">Assigned:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {taskAssignees.map(u => (
                    <div key={u.id} className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[10px]">
                      <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Details: Project */}
        {resolvedType === 'project' && projectData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {projectData.name}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {projectData.status}
              </span>
            </div>

            {projectData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                {projectData.description}
              </p>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                <span>Task Progress</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {completedProjectTasks.length}/{projectTasks.length} Done ({projectProgress}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${projectProgress}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Workflow</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate block">{projectData.templateType}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Team</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate block">
                  {projectTeam ? projectTeam.name : 'Cross-Functional'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Contributors: <strong className="text-neutral-900 dark:text-neutral-100">{projectContributors.length} members</strong></span>
                <span>Total Tasks: <strong>{projectTasks.length}</strong></span>
              </div>
              {projectContributors.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {projectContributors.slice(0, 5).map(u => (
                      <UserAvatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                    ))}
                  </div>
                  {projectContributors.length > 5 && (
                    <span className="text-[10px] font-mono text-neutral-400 font-bold">
                      +{projectContributors.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Details: Person */}
        {resolvedType === 'person' && userData && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={userData.name} avatarUrl={userData.avatarUrl} size="lg" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{userData.name}</h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono block truncate">{userData.title}</span>
                <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 block">{userData.role}</span>
              </div>
            </div>

            {userEod ? (
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase">
                  <span>Daily Pulse Energy</span>
                  <span className={`font-bold ${
                    userEod.energyIndex >= 4 ? 'text-emerald-600 dark:text-emerald-400' :
                    userEod.energyIndex >= 3 ? 'text-blue-600 dark:text-blue-400' :
                    userEod.energyIndex >= 2 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {userEod.energyIndex}/5 Gauge
                  </span>
                </div>
                {userEod.accomplishments && userEod.accomplishments.length > 0 && (
                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-1 italic font-mono">
                    "{userEod.accomplishments[0]}"
                  </p>
                )}
                {userEod.blockers && userEod.blockers.length > 0 && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 line-clamp-1 font-mono">
                    ⚠️ {userEod.blockers[0]}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 text-[11px] font-mono text-neutral-400 text-center">
                No Pulse logged yet today
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Team</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate block">{userData.teamName}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Assignments</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{userTasks.length} tasks • {userProjects.length} proj</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Details: Goal */}
        {resolvedType === 'goal' && goalData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 text-pink-500 shrink-0" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {goalData.title}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300">
                {goalData.status}
              </span>
            </div>

            {goalData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                {goalData.description}
              </p>
            )}

            <div className="space-y-1.5 pt-1 font-mono">
              <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span>Key Results ({goalData.keyResults?.length || 0})</span>
                <span className="text-pink-600 dark:text-pink-400 font-bold">{goalData.targetDate || 'Target Active'}</span>
              </div>
              {goalData.keyResults && goalData.keyResults.map(kr => (
                <div key={kr.id} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 text-[10px] space-y-1 border border-neutral-200/50 dark:border-neutral-800">
                  <div className="flex justify-between font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="truncate max-w-[180px]">{kr.title}</span>
                    <span>{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 rounded-full" 
                      style={{ width: `${Math.min(100, (kr.currentValue / (kr.targetValue || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Details: Team */}
        {resolvedType === 'team' && teamData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{teamData.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Team Lead</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate block">{teamData.leadName || 'Unassigned'}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Headcount</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{teamMembers.length} members</span>
              </div>
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-400 font-mono space-y-1 pt-1">
              <div className="text-[10px] text-neutral-400 font-bold uppercase">Linked Projects ({teamProjects.length}):</div>
              <div className="flex flex-wrap gap-1">
                {teamProjects.map(p => (
                  <span key={p.id} className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-800 dark:text-neutral-200">
                    {p.name}
                  </span>
                ))}
                {teamProjects.length === 0 && <span className="text-[10px] text-neutral-400">No active projects</span>}
              </div>
            </div>
          </div>
        )}

        {/* Content Details: Tag */}
        {resolvedType === 'tag' && tagData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: tagData.colorHex }} />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{tagData.name}</h3>
            </div>

            {tagData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono leading-relaxed">
                {tagData.description}
              </p>
            )}

            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 text-xs font-mono space-y-1">
              <div className="text-[10px] text-neutral-400">Applies To:</div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                {tagData.appliesTo?.join(', ') || 'All Entities'}
              </div>
            </div>
          </div>
        )}

        {/* Content Details: Core Org Hub */}
        {resolvedType === 'core' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{orgDisplayName}</h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono leading-relaxed">
              Central organizational hub connecting all teams, projects, workflows, and members.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Teams</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{teams.length} teams</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Projects</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{projects.length} active</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Members</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{users.length} members</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Tasks</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{tasks.length} total</span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback if entity not resolved */}
        {!taskData && !projectData && !userData && !goalData && !teamData && !tagData && resolvedType !== 'core' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 text-xs font-mono space-y-1">
              <div className="font-bold text-neutral-900 dark:text-neutral-100">Selected Node: #{rawId}</div>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Type: {resolvedType}. Node details loaded from graph.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 font-mono">Press Esc to close</span>
          <button
            onClick={handleOpenDrawer}
            className="px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <span>{resolvedType === 'core' ? 'Open Dashboard' : 'Full Inspection'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
