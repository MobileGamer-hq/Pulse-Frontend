import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StackedFolderSidebar } from './StackedFolderSidebar';
import { SpiderWebCanvas, type EdgeOverlayFilter } from './SpiderWebCanvas';
import { RelationshipCarousel } from './RelationshipCarousel';
import { NodeDetailPopupCard } from './NodeDetailPopupCard';
import { 
  Search, ShieldAlert, Target, 
  ChevronRight, ExternalLink, ArrowLeft,
  RotateCcw, Briefcase, CheckSquare, User as UserIcon, Building2,
  LayoutGrid, Users, Hexagon
} from 'lucide-react';
import type { EntityType } from '../../types';
import { findUserByAnyId, normalizeEntityId } from '../../utils/projectContributors';

export const RelationshipsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setActiveScreen, pushPanel, projects, tasks, goals, users, 
    teams, tags, currentOrgSlug 
  } = useApp();

  // Active View Mode: 'carousel' (Master-Detail Daily Driver) | 'spiderweb' (Exploratory Topology Graph)
  const [viewMode, setViewMode] = useState<'carousel' | 'spiderweb'>('carousel');

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<EntityType | null>(null);
  
  // Default expanded state: Ring 0 (Org Core) is open
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set(['core-org']));
  
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusDepth, setFocusDepth] = useState<number>(2);
  const [edgeOverlayFilter, setEdgeOverlayFilter] = useState<EdgeOverlayFilter>('all');
  const [isFolderSidebarCollapsed, setIsFolderSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Node Selection Handler
  const handleSelectNode = (id: string, type?: EntityType, _fromCanvas = false) => {
    setSelectedNodeId(id);
    setFocusNodeId(id);

    let resolvedType = type;
    if (!resolvedType) {
      if (id.startsWith('proj-') || projects.some(p => p.id === id)) resolvedType = 'project';
      else if (id.startsWith('usr-tasks-')) resolvedType = 'task';
      else if (id.startsWith('usr-') || id.startsWith('user-') || users.some(u => u.id === id)) resolvedType = 'person';
      else if (id.startsWith('task-') || tasks.some(t => t.id === id)) resolvedType = 'task';
      else if (id.startsWith('team-') || teams.some(t => t.id === id)) resolvedType = 'team';
      else if (id.startsWith('goal-') || goals.some(g => g.id === id)) resolvedType = 'goal';
      else if (id.startsWith('tag-') || tags.some(t => t.id === id)) resolvedType = 'tag';
    }
    if (resolvedType) setSelectedNodeType(resolvedType);

    // Auto-expand ancestral branch so children remain visible
    if (id.startsWith('usr-tasks-')) {
      const userObj = findUserByAnyId(id, users);
      if (userObj) {
        setExpandedNodeIds(prev => new Set([...prev, `team-${userObj.teamId}`, `usr-${userObj.id}`]));
      }
    } else if (id.startsWith('proj-')) {
      const projId = id.replace('proj-', '');
      const proj = projects.find(p => p.id === projId);
      if (proj) {
        const teamId = proj.teamIds?.[0] || proj.teamId;
        setExpandedNodeIds(prev => new Set([...prev, `team-${teamId}`, `proj-${projId}`]));
      }
    } else if (id.startsWith('task-')) {
      const taskId = id.replace('task-', '');
      const tsk = tasks.find(t => t.id === taskId);
      if (tsk) {
        const proj = projects.find(p => p.id === tsk.projectId);
        const teamId = proj ? (proj.teamIds?.[0] || proj.teamId) : null;
        setExpandedNodeIds(prev => {
          const next = new Set(prev);
          if (teamId) next.add(`team-${teamId}`);
          next.add(`proj-${tsk.projectId}`);
          return next;
        });
      }
    }
  };

  // Drill-Down into children in Carousel view
  const handleDrillDown = (id: string, type: EntityType) => {
    // Expand this node in the tree and set as selected
    setExpandedNodeIds(prev => new Set([...prev, id]));
    handleSelectNode(id, type);
  };

  // Toggle Node / Folder Expansion (Bidirectional with Sidebar)
  const handleToggleExpandNode = (nodeId: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Reset View to Clean Org Core + Teams State
  const handleResetView = () => {
    setExpandedNodeIds(new Set(['core-org']));
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setFocusNodeId(null);
    setSearchQuery('');
    setEdgeOverlayFilter('all');
  };

  // Preset Filters
  const handlePresetFocus = (preset: 'all' | 'projects' | 'blocked' | 'goals') => {
    if (preset === 'all') {
      handleResetView();
    } else if (preset === 'projects') {
      const allTeamIds = teams.map(t => `team-${t.id}`);
      setExpandedNodeIds(new Set(['core-org', ...allTeamIds]));
      setSelectedNodeId(null);
      setFocusNodeId(null);
    } else if (preset === 'blocked') {
      setEdgeOverlayFilter('blockers');
      const blockedTask = tasks.find(t => t.status === 'Blocked');
      if (blockedTask) {
        handleSelectNode(`task-${blockedTask.id}`, 'task');
      }
    } else if (preset === 'goals') {
      setEdgeOverlayFilter('okrs');
      if (goals.length > 0) {
        handleSelectNode(`goal-${goals[0].id}`, 'goal');
      }
    }
  };

  // Open Full Slide-Over Drawer
  const handleOpenDetailDrawer = (nodeId?: string, nodeType?: EntityType) => {
    const targetId = nodeId || selectedNodeId;
    const targetType = nodeType || selectedNodeType;
    if (!targetId) return;

    let rawId = targetId;
    if (rawId === 'core-org' || rawId === 'org-core') {
      setActiveScreen('dashboard');
      navigate(`/${currentOrgSlug || 'epicordia'}/dashboard`);
      return;
    }

    if (rawId.startsWith('usr-tasks-')) {
      const userObj = findUserByAnyId(rawId, users);
      if (userObj) {
        pushPanel({ type: 'person', id: userObj.id });
        return;
      }
    }
    if (rawId.startsWith('usr-') || rawId.startsWith('user-')) {
      const userObj = findUserByAnyId(rawId, users);
      if (userObj) {
        pushPanel({ type: 'person', id: userObj.id });
        return;
      }
      rawId = normalizeEntityId(rawId);
      pushPanel({ type: 'person', id: rawId });
      return;
    }
    if (rawId.startsWith('proj-')) {
      pushPanel({ type: 'project', id: normalizeEntityId(rawId) });
      return;
    }
    if (rawId.startsWith('task-')) {
      pushPanel({ type: 'task', id: normalizeEntityId(rawId) });
      return;
    }
    if (rawId.startsWith('goal-')) {
      pushPanel({ type: 'goal', id: normalizeEntityId(rawId) });
      return;
    }
    if (rawId.startsWith('tag-')) {
      pushPanel({ type: 'tag', id: normalizeEntityId(rawId) });
      return;
    }
    if (rawId.startsWith('team-')) {
      const cleanTeamId = normalizeEntityId(rawId);
      const t = teams.find(team => team.id === cleanTeamId || team.id === rawId || normalizeEntityId(team.id) === cleanTeamId);
      if (t?.leadId) pushPanel({ type: 'person', id: t.leadId });
      else {
        setActiveScreen('team');
        navigate(`/${currentOrgSlug || 'epicordia'}/team`);
      }
      return;
    }

    if (targetType === 'project') pushPanel({ type: 'project', id: rawId });
    else if (targetType === 'person') pushPanel({ type: 'person', id: rawId });
    else if (targetType === 'task') pushPanel({ type: 'task', id: rawId });
    else if (targetType === 'goal') pushPanel({ type: 'goal', id: rawId });
    else if (projects.length > 0) {
      pushPanel({ type: 'project', id: projects[0].id });
    }
  };

  // Interactive Breadcrumbs Calculation
  const breadcrumbs = useMemo(() => {
    const orgName = currentOrgSlug 
      ? currentOrgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
      : 'Workspace';

    const crumbs: Array<{ label: string; id: string | null; icon?: React.ReactNode }> = [
      { label: orgName, id: 'core-org', icon: <Building2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> }
    ];

    if (!selectedNodeId || selectedNodeId === 'core-org') return crumbs;

    let targetId = selectedNodeId;

    if (targetId.startsWith('usr-tasks-')) {
      const userObj = findUserByAnyId(targetId, users);
      if (userObj) {
        const teamObj = teams.find(t => t.id === userObj.teamId || normalizeEntityId(t.id) === normalizeEntityId(userObj.teamId));
        if (teamObj) {
          crumbs.push({ label: teamObj.name, id: `team-${teamObj.id}`, icon: <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
        }
        crumbs.push({ label: userObj.name, id: `usr-${userObj.id}`, icon: <UserIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
        crumbs.push({ label: 'Assigned Tasks', id: targetId, icon: <CheckSquare className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
      }
    } else if (targetId.startsWith('team-')) {
      const tId = normalizeEntityId(targetId);
      const teamObj = teams.find(t => t.id === tId || normalizeEntityId(t.id) === tId);
      if (teamObj) {
        crumbs.push({ label: teamObj.name, id: `team-${teamObj.id}`, icon: <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
      }
    } else if (targetId.startsWith('proj-')) {
      const pId = normalizeEntityId(targetId);
      const projObj = projects.find(p => p.id === pId || normalizeEntityId(p.id) === pId);
      if (projObj) {
        const teamObj = teams.find(t => (projObj.teamIds || [projObj.teamId]).some(tid => tid === t.id || normalizeEntityId(tid) === normalizeEntityId(t.id)));
        if (teamObj) {
          crumbs.push({ label: teamObj.name, id: `team-${teamObj.id}`, icon: <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
        }
        crumbs.push({ label: projObj.name, id: `proj-${projObj.id}`, icon: <Briefcase className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
      }
    } else if (targetId.startsWith('task-')) {
      const tId = normalizeEntityId(targetId);
      const taskObj = tasks.find(t => t.id === tId || normalizeEntityId(t.id) === tId);
      if (taskObj) {
        const projObj = projects.find(p => p.id === taskObj.projectId || normalizeEntityId(p.id) === normalizeEntityId(taskObj.projectId));
        if (projObj) {
          const teamObj = teams.find(t => (projObj.teamIds || [projObj.teamId]).some(tid => tid === t.id || normalizeEntityId(tid) === normalizeEntityId(t.id)));
          if (teamObj) {
            crumbs.push({ label: teamObj.name, id: `team-${teamObj.id}`, icon: <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
          }
          crumbs.push({ label: projObj.name, id: `proj-${projObj.id}`, icon: <Briefcase className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
        }
        crumbs.push({ label: taskObj.title, id: `task-${taskObj.id}`, icon: <CheckSquare className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
      }
    } else if (targetId.startsWith('usr-') || targetId.startsWith('user-')) {
      const userObj = findUserByAnyId(targetId, users);
      if (userObj) {
        const teamObj = teams.find(t => t.id === userObj.teamId || normalizeEntityId(t.id) === normalizeEntityId(userObj.teamId));
        if (teamObj) {
          crumbs.push({ label: teamObj.name, id: `team-${teamObj.id}`, icon: <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
        }
        crumbs.push({ label: userObj.name, id: targetId, icon: <UserIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
      }
    } else if (targetId.startsWith('goal-')) {
      const gId = targetId.replace('goal-', '');
      const goalObj = goals.find(g => g.id === gId);
      if (goalObj) {
        crumbs.push({ label: goalObj.title, id: `goal-${goalObj.id}`, icon: <Target className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> });
      }
    }

    return crumbs;
  }, [selectedNodeId, currentOrgSlug, teams, projects, tasks, users, goals]);

  // Search auto-focus handler
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) return;

    const lower = val.toLowerCase();
    const matchedUser = users.find(u => u.name.toLowerCase().includes(lower));
    if (matchedUser) {
      handleSelectNode(`usr-${matchedUser.id}`, 'person');
      return;
    }

    const matchedTask = tasks.find(t => t.title.toLowerCase().includes(lower));
    if (matchedTask) {
      handleSelectNode(`task-${matchedTask.id}`, 'task');
      return;
    }

    const matchedProj = projects.find(p => p.name.toLowerCase().includes(lower));
    if (matchedProj) {
      handleSelectNode(`proj-${matchedProj.id}`, 'project');
      return;
    }

    const matchedTeam = teams.find(t => t.name.toLowerCase().includes(lower));
    if (matchedTeam) {
      handleSelectNode(`team-${matchedTeam.id}`, 'team');
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#F4F5F7] dark:bg-[#0F1115] flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-13 px-4 sm:px-6 bg-white dark:bg-[#1A1D24] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0 font-mono text-xs text-neutral-900 dark:text-neutral-100 z-40">
        {/* Left: Back Button & Synced Interactive Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              setActiveScreen('dashboard');
              navigate(`/${currentOrgSlug || 'epicordia'}/dashboard`);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0" />

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1 shrink-0">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                <button
                  onClick={() => {
                    if (crumb.id) handleSelectNode(crumb.id);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors truncate max-w-[160px] ${
                    idx === breadcrumbs.length - 1
                      ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  title={crumb.label}
                >
                  {crumb.icon}
                  <span className="truncate">{crumb.label}</span>
                </button>
              </React.Fragment>
            ))}

            {/* 1-Click Reset to Org Hierarchy */}
            {selectedNodeId && (
              <button
                onClick={handleResetView}
                className="flex items-center gap-1 px-2 py-1 ml-1 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono text-[10px] font-medium transition-all"
                title="Collapse drill-downs and reset to Organization Overview"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle: Carousel vs Hexagon Grid */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xs shrink-0">
          <button
            onClick={() => setViewMode('carousel')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-all ${
              viewMode === 'carousel'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
            <span>Master-Detail</span>
          </button>

          <button
            onClick={() => setViewMode('spiderweb')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-all ${
              viewMode === 'spiderweb'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Hexagon className="w-3.5 h-3.5 opacity-70" />
            <span>Hexagon Grid</span>
          </button>
        </div>

        {/* Search & Presets */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden md:block w-44 lg:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-all placeholder:text-neutral-400 font-mono"
            />
          </div>

          <div className="hidden xl:flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 p-0.5 rounded-lg">
            <button
              onClick={() => handlePresetFocus('all')}
              className="px-2 py-0.5 rounded text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-neutral-700 transition-all font-medium"
            >
              All
            </button>
            <button
              onClick={() => handlePresetFocus('projects')}
              className="px-2 py-0.5 rounded text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-neutral-700 transition-all font-medium"
            >
              Projects
            </button>
            <button
              onClick={() => handlePresetFocus('blocked')}
              className="px-2 py-0.5 rounded text-[10px] text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-all font-medium flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3 text-neutral-500" /> Blockers
            </button>
            <button
              onClick={() => handlePresetFocus('goals')}
              className="px-2 py-0.5 rounded text-[10px] text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-all font-medium flex items-center gap-1"
            >
              <Target className="w-3 h-3 text-neutral-500" /> Goals
            </button>
          </div>

          {selectedNodeId && (
            <button
              onClick={() => handleOpenDetailDrawer()}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Inspect</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Viewport */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Side: Animated Hierarchy Explorer */}
        <StackedFolderSidebar
          selectedNodeId={selectedNodeId}
          onSelectNode={(id, type) => handleSelectNode(id, type, false)}
          expandedFolderIds={Array.from(expandedNodeIds)}
          onToggleFolder={handleToggleExpandNode}
          isCollapsed={isFolderSidebarCollapsed}
          onToggleCollapse={() => setIsFolderSidebarCollapsed(prev => !prev)}
        />

        {/* Right Side: Conditional View Rendering */}
        {viewMode === 'carousel' ? (
          <RelationshipCarousel
            selectedNodeId={selectedNodeId}
            selectedNodeType={selectedNodeType}
            onSelectNode={(id, type) => handleSelectNode(id, type)}
            onDrillDown={handleDrillDown}
            onOpenDrawer={handleOpenDetailDrawer}
            searchQuery={searchQuery}
          />
        ) : (
          <>
            <SpiderWebCanvas
              selectedNodeId={selectedNodeId}
              onSelectNode={(id, type) => handleSelectNode(id, type, true)}
              expandedNodeIds={expandedNodeIds}
              onToggleExpandNode={handleToggleExpandNode}
              focusNodeId={focusNodeId}
              focusDepth={focusDepth}
              onSetFocusDepth={setFocusDepth}
              edgeOverlayFilter={edgeOverlayFilter}
              onSetEdgeOverlayFilter={setEdgeOverlayFilter}
              searchQuery={searchQuery}
            />

            {/* Floating Detail Popup in Spiderweb mode */}
            <NodeDetailPopupCard
              selectedNodeId={selectedNodeId}
              selectedNodeType={selectedNodeType}
              onClose={() => {
                setSelectedNodeId(null);
                setSelectedNodeType(null);
                setFocusNodeId(null);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
