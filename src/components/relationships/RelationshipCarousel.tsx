import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  ChevronLeft, ChevronRight, ExternalLink, ArrowRight,
  CheckCircle2, Circle, AlertCircle, Ban,
  Users, Briefcase, CheckSquare, Target, ShieldAlert,
  Calendar, Layers, ArrowUpRight,
  HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EntityType, Team, Project, Task, User as UserType, TaskStatus } from '../../types';
import { 
  getProjectContributors, normalizeEntityId, normalizeUserId, 
  findUserByAnyId, isTaskAssignedToUser 
} from '../../utils/projectContributors';

interface CarouselItem {
  id: string;
  type: EntityType;
  title: string;
  subtitle?: string;
  data: any;
}

interface RelationshipCarouselProps {
  selectedNodeId: string | null;
  selectedNodeType: EntityType | null;
  onSelectNode: (id: string, type: EntityType) => void;
  onDrillDown: (id: string, type: EntityType) => void;
  onOpenDrawer: (id: string, type: EntityType) => void;
  searchQuery?: string;
}

export const RelationshipCarousel: React.FC<RelationshipCarouselProps> = ({
  selectedNodeId,
  selectedNodeType,
  onSelectNode,
  onDrillDown,
  onOpenDrawer,
  searchQuery = ''
}) => {
  const { 
    teams, projects, users, tasks, goals, eodEntries,
    updateTask, currentOrgSlug 
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper for Member EOD & Blocker Lookup
  const getMemberEodAndBlockers = useCallback((userId: string) => {
    const userObj = findUserByAnyId(userId, users);
    const userEod = eodEntries.find(e => 
      e.userId === userId || 
      (userObj && (e.userId === userObj.id || e.userName === userObj.name))
    );
    const userTasks = tasks.filter(t => isTaskAssignedToUser(t, userObj || userId, users));
    const completedTasks = userTasks.filter(t => t.status === 'Done');
    const blockedTasks = userTasks.filter(t => t.status === 'Blocked' || t.status === 'AtRisk' || Boolean(t.blockedReason));
    const hasEodBlocker = Boolean(userEod && userEod.blockers && userEod.blockers.trim() && userEod.blockers.toLowerCase() !== 'no blockers');

    return {
      eod: userEod,
      accomplishments: userEod?.accomplishments ?? [],
      completedTasksCount: completedTasks.length,
      hasBlocker: hasEodBlocker || blockedTasks.length > 0,
      blockerText: hasEodBlocker ? userEod?.blockers : null,
      blockedTaskId: userEod?.blockedTaskId,
      flaggedToManager: Boolean(userEod?.flaggedToManager),
      blockedTasks
    };
  }, [eodEntries, users, tasks]);

  // Determine current parent container and compute carousel items
  const { containerLabel, carouselItems } = useMemo(() => {
    let rawId = selectedNodeId || 'core-org';
    let type = selectedNodeType;

    if (rawId === 'core-org' || rawId === 'org-core' || !selectedNodeId) {
      // Level 0: Organization -> Show Teams
      const items: CarouselItem[] = teams.map((t: Team) => ({
        id: `team-${t.id}`,
        type: 'team',
        title: t.name,
        subtitle: `Lead: ${t.leadName}`,
        data: t
      }));

      const orgDisplayName = currentOrgSlug 
        ? currentOrgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        : 'Organization';

      return {
        containerLabel: `${orgDisplayName} • Squads (${items.length})`,
        carouselItems: items
      };
    }

    // Team selected -> Show Projects
    if (rawId.startsWith('team-') || type === 'team') {
      const teamId = rawId.replace('team-', '');
      const teamObj = teams.find(t => t.id === teamId);
      const teamProjects = projects.filter(p => {
        const tIds = p.teamIds !== undefined ? p.teamIds : (p.teamId ? [p.teamId] : []);
        return tIds.includes(teamId);
      });

      const items: CarouselItem[] = teamProjects.map((p: Project) => ({
        id: `proj-${p.id}`,
        type: 'project',
        title: p.name,
        subtitle: p.description || p.status,
        data: p
      }));

      return {
        containerLabel: `${teamObj ? teamObj.name : 'Team'} • Projects (${items.length})`,
        carouselItems: items
      };
    }

    // Project selected -> Show Tasks
    if (rawId.startsWith('proj-') || type === 'project') {
      const projId = rawId.replace('proj-', '');
      const projObj = projects.find(p => p.id === projId);
      const projTasks = tasks.filter(t => t.projectId === projId);

      const items: CarouselItem[] = projTasks.map((t: Task) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: t.description,
        data: t
      }));

      return {
        containerLabel: `${projObj ? projObj.name : 'Project'} • Tasks (${items.length})`,
        carouselItems: items
      };
    }

    // Task selected -> Show all sibling Tasks in the project
    if (rawId.startsWith('task-') || type === 'task') {
      const taskId = rawId.replace('task-', '');
      const currentTask = tasks.find(t => t.id === taskId);
      const projId = currentTask?.projectId;
      const projObj = projects.find(p => p.id === projId);
      const siblingTasks = projId ? tasks.filter(t => t.projectId === projId) : (currentTask ? [currentTask] : []);

      const items: CarouselItem[] = siblingTasks.map((t: Task) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: t.description,
        data: t
      }));

      return {
        containerLabel: `${projObj ? projObj.name : 'Project'} • Tasks (${items.length})`,
        carouselItems: items
      };
    }

    // Person's Assigned Tasks -> Show all tasks assigned to this specific member
    if (rawId.startsWith('usr-tasks-')) {
      const userObj = findUserByAnyId(rawId, users);
      const userTasks = tasks.filter(t => isTaskAssignedToUser(t, userObj || rawId, users));
      
      // Also check contributing projects
      const userProjects = projects.filter(p => 
        (p.memberIds || []).some(mId => mId === userObj?.id || normalizeEntityId(mId) === normalizeEntityId(userObj?.id)) ||
        p.leadId === userObj?.id ||
        normalizeEntityId(p.leadId) === normalizeEntityId(userObj?.id) ||
        getProjectContributors(p, teams, users, tasks).some(c => c.id === userObj?.id || normalizeEntityId(c.id) === normalizeEntityId(userObj?.id))
      );

      const projectTasks = tasks.filter(t => userProjects.some(p => p.id === t.projectId));

      let items: CarouselItem[] = [];
      let label = '';

      if (userTasks.length > 0) {
        items = userTasks.map((t: Task) => ({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: `${t.projectName || 'Project'} • Assigned to ${userObj?.name || 'Member'}`,
          data: t
        }));
        label = `${userObj ? userObj.name : 'Member'} • Assigned Tasks (${items.length})`;
      } else if (projectTasks.length > 0) {
        items = projectTasks.map((t: Task) => ({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: `${t.projectName || 'Project'} • Contributor: ${userObj?.name || 'Member'}`,
          data: t
        }));
        label = `${userObj ? userObj.name : 'Member'} • Project Tasks (${items.length} in ${userProjects.length} Projects)`;
      }

      return {
        containerLabel: label || `${userObj ? userObj.name : 'Member'} • Assigned Tasks (0)`,
        carouselItems: items
      };
    }

    // Person selected -> Show sibling squad members, with active person centered
    if (rawId.startsWith('usr-') || rawId.startsWith('user-') || type === 'person') {
      const userObj = findUserByAnyId(rawId, users);
      const teamId = userObj?.teamId;
      const siblingMembers = teamId 
        ? users.filter(u => u.teamId === teamId || normalizeEntityId(u.teamId) === normalizeEntityId(teamId))
        : users;

      const items: CarouselItem[] = siblingMembers.map((u: UserType) => ({
        id: `usr-${u.id}`,
        type: 'person',
        title: u.name,
        subtitle: `${u.title} • ${u.role}`,
        data: u
      }));

      return {
        containerLabel: `${userObj ? userObj.teamName || 'Squad' : 'Members'} • Contributors (${items.length})`,
        carouselItems: items
      };
    }

    // Goal selected -> Show linked tasks
    if (rawId.startsWith('goal-') || type === 'goal') {
      const goalId = rawId.replace('goal-', '');
      const goalObj = goals.find(g => g.id === goalId);
      const linkedTasks = tasks.filter(t => (goalObj?.linkedTaskIds || []).includes(t.id));

      const items: CarouselItem[] = linkedTasks.map((t: Task) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: t.description,
        data: t
      }));

      return {
        containerLabel: `${goalObj ? goalObj.title : 'Goal'} • Linked Tasks (${items.length})`,
        carouselItems: items
      };
    }

    return {
      containerLabel: 'Items',
      carouselItems: []
    };
  }, [selectedNodeId, selectedNodeType, teams, projects, tasks, users, goals, currentOrgSlug]);

  // Filter items if search query is provided
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return carouselItems;
    const lower = searchQuery.toLowerCase();
    return carouselItems.filter(item => 
      item.title.toLowerCase().includes(lower) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(lower))
    );
  }, [carouselItems, searchQuery]);

  // Sync index when selectedNodeId points directly to an item
  useEffect(() => {
    if (!selectedNodeId || filteredItems.length === 0) {
      setCurrentIndex(0);
      return;
    }

    const cleanSelected = normalizeEntityId(selectedNodeId).toLowerCase();

    const foundIdx = filteredItems.findIndex(item => {
      const cleanItem = normalizeEntityId(item.id).toLowerCase();
      return item.id === selectedNodeId || cleanItem === cleanSelected;
    });

    if (foundIdx >= 0) {
      setCurrentIndex(foundIdx);
    } else {
      setCurrentIndex(0);
    }
  }, [selectedNodeId, filteredItems]);

  const handleGoNext = useCallback(() => {
    if (filteredItems.length <= 1) return;
    setCurrentIndex(prev => {
      const nextIdx = (prev + 1) % filteredItems.length;
      const targetItem = filteredItems[nextIdx];
      if (targetItem) onSelectNode(targetItem.id, targetItem.type);
      return nextIdx;
    });
  }, [filteredItems, onSelectNode]);

  const handleGoPrev = useCallback(() => {
    if (filteredItems.length <= 1) return;
    setCurrentIndex(prev => {
      const prevIdx = (prev - 1 + filteredItems.length) % filteredItems.length;
      const targetItem = filteredItems[prevIdx];
      if (targetItem) onSelectNode(targetItem.id, targetItem.type);
      return prevIdx;
    });
  }, [filteredItems, onSelectNode]);

  // Keyboard Left / Right Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGoNext, handleGoPrev]);

  // Helpers for Status & Energy Index
  const getTaskStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" /> Done
          </span>
        );
      case 'InProgress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            <div className="w-2 h-2 rounded-full border-2 border-neutral-600 dark:border-neutral-300 border-t-transparent animate-spin" /> In Progress
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-neutral-600">
            <Ban className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" /> Blocked
          </span>
        );
      case 'AtRisk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" /> At Risk
          </span>
        );
      case 'Todo':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-50 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800">
            <Circle className="w-3.5 h-3.5 text-neutral-400" /> Todo
          </span>
        );
    }
  };

  if (filteredItems.length === 0) {
    const isUserTasksView = Boolean(selectedNodeId && selectedNodeId.startsWith('usr-tasks-'));
    const targetUser = isUserTasksView ? findUserByAnyId(selectedNodeId, users) : undefined;

    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
          {isUserTasksView ? <CheckSquare className="w-7 h-7 text-neutral-600 dark:text-neutral-300" /> : <Layers className="w-7 h-7" />}
        </div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          {isUserTasksView
            ? `No tasks assigned to ${targetUser?.name || 'this member'} yet`
            : `No items found in ${containerLabel}`}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-5 font-mono">
          {isUserTasksView
            ? `${targetUser?.name || 'This member'} is a registered contributor, but has no active tasks directly assigned.`
            : 'Select a different node in the left hierarchy or create a new entity to populate this view.'}
        </p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('pulse:open-create-item', { 
              detail: { 
                type: 'task', 
                assigneeId: targetUser?.id, 
                teamId: targetUser?.teamId 
              } 
            }));
          }}
          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium shadow-sm hover:opacity-90 transition-opacity"
        >
          {isUserTasksView ? `+ Assign Task to ${targetUser?.name || 'Member'}` : 'Create Entity'}
        </button>
      </div>
    );
  }

  const activeItem = filteredItems[currentIndex] || filteredItems[0];
  const prevItem = filteredItems[(currentIndex - 1 + filteredItems.length) % filteredItems.length];
  const nextItem = filteredItems[(currentIndex + 1) % filteredItems.length];

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden relative select-none font-sans bg-[#F4F5F7] dark:bg-[#0F1115]">
      {/* Top Context Subheader */}
      <div className="px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#1A1D24]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {containerLabel}
          </span>
        </div>

        {/* Counter & Controls */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/80 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">
            {currentIndex + 1} of {filteredItems.length}
          </span>

          <div className="flex items-center gap-0.5 bg-neutral-50 dark:bg-neutral-800/80 p-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleGoPrev}
              disabled={filteredItems.length <= 1}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors"
              title="Previous item (← key)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoNext}
              disabled={filteredItems.length <= 1}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors"
              title="Next item (→ key)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Carousel Viewport with Peeked Siblings */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-0 relative overflow-hidden">
        {/* Left Peeked Sibling Card */}
        {filteredItems.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleGoPrev}
            className="hidden xl:block absolute left-4 w-72 h-[440px] rounded-2xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 p-5 shadow-lg cursor-pointer transform -translate-x-8 scale-95 hover:opacity-70 transition-opacity overflow-hidden"
          >
            <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
              Previous
            </div>
            <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {prevItem.title}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mt-1 font-mono">
              {prevItem.subtitle}
            </p>
          </motion.div>
        )}

        {/* Center Active Large Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-2xl max-h-full rounded-2xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 sm:p-7 flex flex-col justify-between overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-20"
          >
            {/* 1. Header Row */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
                <div className="flex items-center gap-3">
                  {activeItem.type === 'person' ? (
                    <UserAvatar name={activeItem.title} avatarUrl={activeItem.data?.avatarUrl} size="md" />
                  ) : (
                    <span className="p-2.5 rounded-xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
                      {activeItem.type === 'team' && <Users className="w-4 h-4" />}
                      {activeItem.type === 'project' && <Briefcase className="w-4 h-4" />}
                      {activeItem.type === 'task' && <CheckSquare className="w-4 h-4" />}
                      {activeItem.type === 'goal' && <Target className="w-4 h-4" />}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block">
                      {activeItem.type === 'person' ? 'Team Member Profile' : `${activeItem.type} Overview`}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {activeItem.title}
                    </h2>
                    {activeItem.subtitle && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5 block">
                        {activeItem.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inspect Entity Button (Opens SlideOverDrawer) */}
                <button
                  onClick={() => onOpenDrawer(activeItem.id, activeItem.type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-medium transition-colors shrink-0"
                  title="Open Full Details Panel"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

              {/* 2. Body Details based on Entity Type */}

              {/* MEMBER (PERSON) CARD WITH DAILY PULSE & BOTTLENECKS */}
              {activeItem.type === 'person' && (() => {
                const user = activeItem.data as UserType;
                const { eod, accomplishments, completedTasksCount, hasBlocker, blockerText, flaggedToManager, blockedTasks } = getMemberEodAndBlockers(user.id);
                const userProjects = projects.filter(p => 
                  (p.memberIds || []).some(mId => mId === user.id || normalizeEntityId(mId) === normalizeEntityId(user.id)) || 
                  p.leadId === user.id || 
                  normalizeEntityId(p.leadId) === normalizeEntityId(user.id) ||
                  getProjectContributors(p, teams, users, tasks).some(c => c.id === user.id || normalizeEntityId(c.id) === normalizeEntityId(user.id))
                );
                const userTasks = tasks.filter(t => isTaskAssignedToUser(t, user, users));

                return (
                  <div className="space-y-4">
                    {/* Role & Capacity Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Squad</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">{user.teamName || 'Engineering'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Weekly Capacity</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">{user.capacityHoursPerWeek || 40} hrs/wk</span>
                      </div>
                      <div 
                        onClick={() => {
                          const cleanId = normalizeUserId(user.id);
                          onDrillDown(`usr-tasks-${cleanId}`, 'task');
                        }}
                        className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                        title="Click to view assigned tasks"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Assigned Tasks</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                          <span>{userTasks.length} Tasks</span>
                          <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>

                    {/* DAILY PULSE SECTION */}
                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HeartPulse className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          <span className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                            Daily Pulse Check-In
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                          {eod ? `Logged: ${eod.date}` : 'No check-in recorded'}
                        </span>
                      </div>

                      {/* Real check-in data or explicit empty state */}
                      {eod ? (
                        <div className="space-y-2">
                          {accomplishments.length > 0 ? (
                            <div className="space-y-1.5 pt-0.5">
                              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                                Today's Accomplishments ({accomplishments.length})
                              </span>
                              <div className="space-y-1">
                                {accomplishments.map((acc, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                                    <span>{acc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between font-mono">
                              <span>Check-in submitted</span>
                              <span className="text-[11px] text-neutral-500">{completedTasksCount} tasks completed</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 text-center">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            No check-in recorded for today
                          </p>
                        </div>
                      )}
                    </div>

                    {/* BOTTLENECK & BLOCKER ALERT SECTION */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                        <span className="text-[11px] font-mono font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                          Bottlenecks & Blockers
                        </span>
                      </div>

                      {hasBlocker ? (
                        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100">
                              <Ban className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                              Active Blocker Reported
                            </span>
                            {flaggedToManager && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                                Escalated to Manager
                              </span>
                            )}
                          </div>

                          {blockerText && (
                            <p className="font-mono text-[11px] leading-relaxed bg-white dark:bg-[#1A1D24] p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                              "{blockerText}"
                            </p>
                          )}

                          {blockedTasks.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-mono font-medium text-neutral-500 dark:text-neutral-400 block">
                                Blocked Tasks ({blockedTasks.length}):
                              </span>
                              {blockedTasks.map(bt => (
                                <div key={bt.id} className="flex items-center justify-between bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 p-2 rounded-lg text-xs">
                                  <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{bt.title}</span>
                                  {bt.blockedReason && (
                                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">
                                      {bt.blockedReason}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                            <span>No active bottlenecks reported</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                            Clear
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Active Projects Pills */}
                    {userProjects.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                          Contributing Projects ({userProjects.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {userProjects.map(p => (
                            <button
                              key={p.id}
                              onClick={() => onDrillDown(`proj-${p.id}`, 'project')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 text-xs font-medium transition-colors"
                            >
                              <span>{p.name}</span>
                              <ArrowUpRight className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TEAM CARD */}
              {activeItem.type === 'team' && (() => {
                const team = activeItem.data as Team;
                const teamProjects = projects.filter(p => (p.teamIds || [p.teamId]).includes(team.id));
                const teamMembers = users.filter(u => u.teamId === team.id || (team.memberIds || []).includes(u.id));

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Team Lead</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">{team.leadName}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Active Projects</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">{teamProjects.length} Projects</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Members</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">{teamMembers.length} People</span>
                      </div>
                    </div>

                    {/* Members Pulse & Bottleneck Strip */}
                    {teamMembers.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                          Squad Members Pulse
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teamMembers.map(m => {
                            const { hasBlocker, eod } = getMemberEodAndBlockers(m.id);

                            return (
                              <div
                                key={m.id}
                                onClick={() => onDrillDown(`usr-${m.id}`, 'person')}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size="xs" />
                                  <div className="truncate">
                                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 block truncate">{m.name}</span>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono block">{m.title}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {hasBlocker && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                                      Blocked
                                    </span>
                                  )}
                                  {eod && !hasBlocker && (
                                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                                      Checked in
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* PROJECT CARD */}
              {activeItem.type === 'project' && (() => {
                const project = activeItem.data as Project;
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'Done');
                const progressPct = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
                const projectPeople = getProjectContributors(project, teams, users, tasks);

                return (
                  <div className="space-y-4">
                    {project.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
                        {project.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">Execution Progress</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{progressPct}% ({completedTasks.length}/{projectTasks.length} Tasks)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Status</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{project.status}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Target Date</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{project.targetEndDate || 'Ongoing'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-0.5">Contributors</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{projectPeople.length} Members</span>
                      </div>
                    </div>

                    {/* Contributors Row with Pulse & Blocker Status */}
                    {projectPeople.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                          Assigned Contributors & Pulse
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
                          {projectPeople.map(p => {
                            const { hasBlocker } = getMemberEodAndBlockers(p.id);
                            const cleanPId = normalizeUserId(p.id);

                            return (
                              <div
                                key={p.id}
                                onClick={() => onDrillDown(`usr-${cleanPId}`, 'person')}
                                className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors border border-neutral-200 dark:border-neutral-700"
                              >
                                <div className="relative">
                                  <UserAvatar name={p.name} avatarUrl={p.avatarUrl} size="xs" />
                                  {hasBlocker && (
                                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{p.name}</span>
                                {hasBlocker && (
                                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">Blocked</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TASK CARD */}
              {activeItem.type === 'task' && (() => {
                const task = activeItem.data as Task;
                const assignees = users.filter(u => isTaskAssignedToUser(task, u, users));

                return (
                  <div className="space-y-4">
                    {/* Blocker Alert Callout if Blocked */}
                    {task.status === 'Blocked' && task.blockedReason && (
                      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-300 dark:border-neutral-700 flex items-start gap-2.5 text-xs text-neutral-800 dark:text-neutral-200">
                        <ShieldAlert className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold text-neutral-900 dark:text-neutral-100">Active Blocker Alert</strong>
                          <p className="font-mono text-[11px] mt-0.5 text-neutral-600 dark:text-neutral-400">{task.blockedReason}</p>
                        </div>
                      </div>
                    )}

                    {task.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
                        {task.description}
                      </p>
                    )}

                    {/* Status & Priority Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {getTaskStatusBadge(task.status)}
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                        {task.priority} Priority
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>Due: {task.dueDate}</span>
                        </span>
                      )}
                    </div>

                    {/* Subtasks Checklist */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#14161F] border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                          Checklist ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})
                        </span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                          {task.subtasks.map(st => (
                            <div
                              key={st.id}
                              onClick={() => {
                                const updatedSubtasks = task.subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s);
                                updateTask(task.id, { subtasks: updatedSubtasks });
                              }}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {st.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              )}
                              <span className={`truncate ${st.done ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assignees with EOD Pulse Indicators */}
                    {assignees.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Assigned to:</span>
                        <div className="flex items-center gap-2">
                          {assignees.map(u => {
                            const { hasBlocker } = getMemberEodAndBlockers(u.id);
                            const cleanUId = normalizeUserId(u.id);

                            return (
                              <div 
                                key={u.id} 
                                onClick={() => onDrillDown(`usr-${cleanUId}`, 'person')}
                                className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2 py-0.5 rounded-md text-xs cursor-pointer transition-colors border border-neutral-200 dark:border-neutral-700"
                              >
                                <div className="relative">
                                  <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                                  {hasBlocker && (
                                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                                  )}
                                </div>
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">{u.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 3. Action Footer */}
            <div className="pt-5 mt-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                <span>Use </span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300">←</kbd>
                <span> </span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300">→</kbd>
                <span> to browse siblings</span>
              </div>

              {/* Primary Drill-Down Action Button */}
              {activeItem.type !== 'task' && (
                <button
                  onClick={() => {
                    if (activeItem.type === 'person') {
                      const uId = normalizeUserId(activeItem.data?.id || activeItem.id);
                      onDrillDown(`usr-tasks-${uId}`, 'task');
                    } else {
                      onDrillDown(activeItem.id, activeItem.type);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>
                    {activeItem.type === 'team' ? 'View Projects' : 
                     activeItem.type === 'project' ? 'View Tasks & People' : 
                     'View Assigned Tasks'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Peeked Sibling Card */}
        {filteredItems.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleGoNext}
            className="hidden xl:block absolute right-4 w-72 h-[440px] rounded-2xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 p-5 shadow-lg cursor-pointer transform translate-x-8 scale-95 hover:opacity-70 transition-opacity overflow-hidden"
          >
            <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
              Next
            </div>
            <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {nextItem.title}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mt-1 font-mono">
              {nextItem.subtitle}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
