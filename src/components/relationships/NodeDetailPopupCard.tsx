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
import { 
  getProjectContributors, normalizeEntityId, 
  findUserByAnyId, isTaskAssignedToUser 
} from '../../utils/projectContributors';

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
  } else if (rawId.startsWith('usr-tasks-')) {
    detectedType = 'task';
    const userObj = findUserByAnyId(rawId, users);
    if (userObj) rawId = userObj.id;
  } else if (rawId.startsWith('usr-') || rawId.startsWith('user-')) {
    detectedType = 'person';
    const userObj = findUserByAnyId(rawId, users);
    if (userObj) rawId = userObj.id;
    else rawId = normalizeEntityId(rawId);
  } else if (rawId.startsWith('team-')) {
    detectedType = 'team';
    rawId = normalizeEntityId(rawId);
  } else if (rawId.startsWith('proj-')) {
    detectedType = 'project';
    rawId = normalizeEntityId(rawId);
  } else if (rawId.startsWith('task-')) {
    detectedType = 'task';
    rawId = normalizeEntityId(rawId);
  } else if (rawId.startsWith('goal-')) {
    detectedType = 'goal';
    rawId = normalizeEntityId(rawId);
  } else if (rawId.startsWith('tag-')) {
    detectedType = 'tag';
    rawId = normalizeEntityId(rawId);
  }

  // If selectedNodeType prop is provided, prefer it if no explicit prefix
  const targetType = selectedNodeType || detectedType;

  // Lookup across collections
  const cleanId = normalizeEntityId(rawId);
  const taskData = tasks.find(t => t.id === rawId || t.id === cleanId || normalizeEntityId(t.id) === cleanId);
  const projectData = projects.find(p => p.id === rawId || p.id === cleanId || normalizeEntityId(p.id) === cleanId);
  const userData = findUserByAnyId(selectedNodeId, users) || findUserByAnyId(rawId, users);
  const teamData = teams.find(t => t.id === rawId || t.id === cleanId || normalizeEntityId(t.id) === cleanId);
  const goalData = goals.find(g => g.id === rawId || g.id === cleanId || normalizeEntityId(g.id) === cleanId);
  const tagData = tags.find(t => t.id === rawId || t.id === cleanId || normalizeEntityId(t.id) === cleanId);

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

  const userEod = userData ? eodEntries.find(e => e.userId === userData.id || e.userName === userData.name) : null;
  const projectContributors = projectData ? getProjectContributors(projectData, teams, users, tasks) : [];
  const projectTasks = projectData ? tasks.filter(t => t.projectId === projectData.id || normalizeEntityId(t.projectId) === normalizeEntityId(projectData.id)) : [];
  const completedProjectTasks = projectTasks.filter(t => t.status === 'Done');
  const projectProgress = projectTasks.length > 0 ? Math.round((completedProjectTasks.length / projectTasks.length) * 100) : 0;
  const projectTeam = projectData ? teams.find(t => t.id === projectData.teamId || (projectData.teamIds && projectData.teamIds.includes(t.id))) : null;
  const taskProject = taskData ? projects.find(p => p.id === taskData.projectId) : null;
  const taskAssignees = taskData ? users.filter(u => isTaskAssignedToUser(taskData, u, users)) : [];
  const teamMembers = teamData ? users.filter(u => (teamData.memberIds || []).includes(u.id) || u.teamId === teamData.id || teamData.leadId === u.id) : [];
  const teamProjects = teamData ? projects.filter(p => p.teamId === teamData.id || (p.teamIds && p.teamIds.includes(teamData.id))) : [];
  const userProjects = userData ? projects.filter(p => (p.memberIds || []).includes(userData.id) || p.leadId === userData.id || getProjectContributors(p, teams, users, tasks).some(u => u.id === userData.id)) : [];
  const userTasks = userData ? tasks.filter(t => isTaskAssignedToUser(t, userData, users)) : [];

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
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider shrink-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
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
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                {taskData.title}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium shrink-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                {taskData.status}
              </span>
            </div>

            {taskData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                {taskData.description}
              </p>
            )}

            {taskData.blockedReason && (
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#14161F] border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                <span><strong>Blocker:</strong> {taskData.blockedReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Priority</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{taskData.priority}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Due Date</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{taskData.dueDate || 'No date'}</span>
              </div>
            </div>

            {taskProject && (
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Project: <strong className="text-neutral-900 dark:text-neutral-100">{taskProject.name}</strong></span>
              </div>
            )}

            {taskAssignees.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-mono text-neutral-400">Assigned:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {taskAssignees.map(u => (
                    <div key={u.id} className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[10px] border border-neutral-200 dark:border-neutral-700">
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
                <Folder className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {projectData.name}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium shrink-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
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
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {completedProjectTasks.length}/{projectTasks.length} Done ({projectProgress}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full transition-all duration-500" 
                  style={{ width: `${projectProgress}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Workflow</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate block">{projectData.templateType}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Team</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate block">
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
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">{userData.name}</h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono block truncate">{userData.title}</span>
                <span className="text-[10px] font-mono text-neutral-400 block">{userData.role}</span>
              </div>
            </div>

            {userEod ? (
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#14161F] border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
                  <span>Daily Pulse</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {userEod.date}
                  </span>
                </div>
                {userEod.accomplishments && userEod.accomplishments.length > 0 && (
                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-2 font-mono">
                    "{userEod.accomplishments[0]}"
                  </p>
                )}
                {userEod.blockers && userEod.blockers.length > 0 && (
                  <p className="text-[11px] text-neutral-800 dark:text-neutral-200 line-clamp-1 font-mono flex items-center gap-1 text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    <span>{userEod.blockers[0]}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#14161F] border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-400 text-center">
                No check-in recorded for today
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Team</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate block">{userData.teamName}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Assignments</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{userTasks.length} tasks • {userProjects.length} proj</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Details: Goal */}
        {resolvedType === 'goal' && goalData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {goalData.title}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium shrink-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
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
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{goalData.targetDate || 'Target Active'}</span>
              </div>
              {goalData.keyResults && goalData.keyResults.map(kr => (
                <div key={kr.id} className="p-2 rounded-lg bg-neutral-50 dark:bg-[#14161F] text-[10px] space-y-1 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex justify-between font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="truncate max-w-[180px]">{kr.title}</span>
                    <span>{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full" 
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
              <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">{teamData.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Team Lead</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate block">{teamData.leadName || 'Unassigned'}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Headcount</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{teamMembers.length} members</span>
              </div>
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-400 font-mono space-y-1 pt-1">
              <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Linked Projects ({teamProjects.length}):</div>
              <div className="flex flex-wrap gap-1">
                {teamProjects.map(p => (
                  <span key={p.id} className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
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
              <span className="w-3.5 h-3.5 rounded-full shrink-0 bg-neutral-700 dark:bg-neutral-300" />
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{tagData.name}</h3>
            </div>

            {tagData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono leading-relaxed">
                {tagData.description}
              </p>
            )}

            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#14161F] border border-neutral-200 dark:border-neutral-800 text-xs font-mono space-y-1">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Applies To:</div>
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
              <Building2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{orgDisplayName}</h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono leading-relaxed">
              Central organizational hub connecting all teams, projects, workflows, and members.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Teams</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{teams.length} teams</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Projects</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{projects.length} active</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Members</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{users.length} members</span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#14161F] p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Tasks</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{tasks.length} total</span>
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
