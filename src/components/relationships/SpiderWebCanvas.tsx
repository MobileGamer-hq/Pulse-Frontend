import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ZoomIn, ZoomOut, Link2, Check, 
  User as UserIcon, Grid, MousePointer, 
  SlidersHorizontal, LayoutGrid, Hexagon, Activity,
  ShieldAlert, Target, GitCommit,
  RotateCcw
} from 'lucide-react';
import type { EntityType, Team, Project, Goal, User as UserType } from '../../types';
import { getProjectContributors } from '../../utils/projectContributors';

export interface GraphNode {
  id: string;
  entityId: string;
  type: EntityType;
  label: string;
  sublabel?: string;
  avatarUrl?: string;
  status?: string;
  color?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  level: number;
  parentId?: string;
  childProjectsCount?: number;
  childTasksCount?: number;
  childPeopleCount?: number;
  eodStatus?: 'good' | 'low' | 'blocked' | 'neutral';
  progress?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  category: 'tree' | 'dependency' | 'assignment' | 'blocker' | 'okr' | 'custom';
  animated?: boolean;
}

export type EdgeOverlayFilter = 'all' | 'tree' | 'dependencies' | 'blockers' | 'okrs';

interface SpiderWebCanvasProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, type: EntityType) => void;
  expandedNodeIds: Set<string>;
  onToggleExpandNode: (nodeId: string) => void;
  focusNodeId?: string | null;
  focusDepth?: number;
  edgeOverlayFilter?: EdgeOverlayFilter;
  onSetEdgeOverlayFilter?: (filter: EdgeOverlayFilter) => void;
  onSetFocusDepth?: (depth: number) => void;
  searchQuery?: string;
  onResetCamera?: () => void;
}

const AVATAR_PALETTE = [
  '#4F46E5', '#7C3AED', '#EC4899', '#F43F5E', '#EF4444', 
  '#EA580C', '#D97706', '#059669', '#0D9488', '#0891B2', 
  '#0284C7', '#2563EB', '#8B5CF6', '#10B981', '#F59E0B'
];

function getAvatarBgColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/**
 * Generates an SVG polygon points string for a regular 6-sided hexagon.
 * @param cx Center X
 * @param cy Center Y
 * @param r Outer radius (distance from center to vertex)
 * @param pointy If true, pointy-topped (-90°). If false, flat-topped (0°).
 */
export function getHexagonPoints(cx: number, cy: number, r: number, pointy = true): string {
  const pts: string[] = [];
  const startAngle = pointy ? -Math.PI / 2 : 0;
  for (let i = 0; i < 6; i++) {
    const angle = startAngle + (i * Math.PI) / 3;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export const SpiderWebCanvas: React.FC<SpiderWebCanvasProps> = ({
  selectedNodeId,
  onSelectNode,
  expandedNodeIds,
  onToggleExpandNode,
  focusNodeId = null,
  focusDepth = 2,
  edgeOverlayFilter = 'all',
  onSetEdgeOverlayFilter,
  onSetFocusDepth,
  searchQuery = ''
}) => {
  const { 
    teams, projects, users, tasks, goals, tags, eodEntries, 
    updateTask, updateProject, isDarkMode, currentOrgSlug 
  } = useApp();

  // Canvas viewport camera state
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 450, y: 350 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Active Tool Mode: 'select' | 'connector'
  const [activeTool, setActiveTool] = useState<'select' | 'connector'>('select');
  const [showHexGrid, setShowHexGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [enablePulseAnimation, setEnablePulseAnimation] = useState(true);

  // Toggle Option: 'avatar' | 'card' Profile View for People
  const [displayMode, setDisplayMode] = useState<'avatar' | 'card'>('card');

  // Local edge overlay filter state if not provided via props
  const [localOverlayFilter, setLocalOverlayFilter] = useState<EdgeOverlayFilter>(edgeOverlayFilter);
  const currentOverlayFilter = onSetEdgeOverlayFilter ? edgeOverlayFilter : localOverlayFilter;
  const setOverlayFilter = onSetEdgeOverlayFilter || setLocalOverlayFilter;

  // Local focus depth state if not provided
  const [localFocusDepth, setLocalFocusDepth] = useState<number>(focusDepth);
  const currentFocusDepth = onSetFocusDepth ? focusDepth : localFocusDepth;
  const setFocusDepth = onSetFocusDepth || setLocalFocusDepth;

  // Custom persistent node positions
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const savedHex = localStorage.getItem('pulse_hex_grid_node_positions');
      if (savedHex) return JSON.parse(savedHex);
      return {};
    } catch {
      return {};
    }
  });

  const savePositions = (positions: Record<string, { x: number; y: number }>) => {
    setCustomPositions(positions);
    try {
      localStorage.setItem('pulse_hex_grid_node_positions', JSON.stringify(positions));
    } catch {}
  };

  // Node Dragging & Connection State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoverDropTargetId, setHoverDropTargetId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [deletedEdgeIds, setDeletedEdgeIds] = useState<Set<string>>(() => new Set());
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate concentric Hexagon Grid nodes & edges
  const { initialNodes, initialEdges, hexRings } = useMemo(() => {
    const nodesMap: Map<string, GraphNode> = new Map();
    const edgesList: GraphEdge[] = [];

    // Hexagon Grid Concentric Tier Radii
    const HEX_RING_TEAMS = 210;    // Tier 1: Teams / Squads
    const HEX_RING_PROJ = 390;     // Tier 2: Projects
    const HEX_RING_PEOPLE = 570;   // Tier 3: People / Contributors
    const HEX_RING_TASKS = 750;    // Tier 4: Tasks
    const HEX_RING_GOALS = 920;    // Tier 5: OKRs / Goals

    // Tier 0: Central Org Core
    const orgDisplayName = currentOrgSlug 
      ? currentOrgSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
      : 'Workspace Core';

    nodesMap.set('core-org', {
      id: 'core-org',
      entityId: currentOrgSlug || 'org-core',
      type: 'team',
      label: orgDisplayName,
      sublabel: 'Organization Hub',
      x: customPositions['core-org']?.x ?? 0,
      y: customPositions['core-org']?.y ?? 0,
      vx: 0, vy: 0,
      radius: 46,
      level: 0,
      childProjectsCount: projects.length
    });

    // Tier 1: Teams / Squads (placed at Hexagon Ring 1 vertices/sectors)
    const teamAngles: Record<string, number> = {};
    const teamProjectsMap: Record<string, Project[]> = {};
    
    teams.forEach((t: Team, index: number) => {
      const angle = (index / Math.max(1, teams.length)) * Math.PI * 2 - Math.PI / 2;
      teamAngles[t.id] = angle;
      const nodeId = `team-${t.id}`;
      const savedPos = customPositions[nodeId];

      const teamProjects = projects.filter(p => {
        const pTeams = p.teamIds !== undefined ? p.teamIds : (p.teamId ? [p.teamId] : []);
        return pTeams.includes(t.id);
      });
      teamProjectsMap[t.id] = teamProjects;

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: t.id,
        type: 'team',
        label: t.name,
        sublabel: `Lead: ${t.leadName}`,
        x: savedPos ? savedPos.x : Math.cos(angle) * HEX_RING_TEAMS,
        y: savedPos ? savedPos.y : Math.sin(angle) * HEX_RING_TEAMS,
        vx: 0, vy: 0,
        radius: 38,
        level: 1,
        parentId: 'core-org',
        childProjectsCount: teamProjects.length
      });

      edgesList.push({
        id: `edge-core-${nodeId}`,
        source: 'core-org',
        target: nodeId,
        relation: 'has_team',
        category: 'tree'
      });
    });

    // Tier 2: Projects (branching from Squad Hex cells with wide sector fan)
    const projAngles: Record<string, number> = {};
    projects.forEach((p: Project) => {
      const linkedTeamIds = p.teamIds !== undefined ? p.teamIds : (p.teamId ? [p.teamId] : []);
      const primaryTeamId = linkedTeamIds[0] || teams[0]?.id || 'team-eng';
      const baseAngle = teamAngles[primaryTeamId] ?? 0;
      const siblingProjects = teamProjectsMap[primaryTeamId] || [p];
      const pIndexInTeam = Math.max(0, siblingProjects.findIndex(sp => sp.id === p.id));
      const totalInTeam = siblingProjects.length;

      const sectorSpread = totalInTeam > 1 ? Math.min(1.2, 0.42 * totalInTeam) : 0.4;
      const offset = totalInTeam > 1 
        ? (pIndexInTeam - (totalInTeam - 1) / 2) * (sectorSpread / Math.max(1, totalInTeam - 1))
        : 0;
      const angle = baseAngle + offset;
      projAngles[p.id] = angle;
      const nodeId = `proj-${p.id}`;
      const savedPos = customPositions[nodeId];

      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pPeople = getProjectContributors(p, teams, users, tasks);

      const radialStagger = (pIndexInTeam % 2 === 1) ? 35 : 0;

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: p.id,
        type: 'project',
        label: p.name,
        sublabel: p.status,
        status: p.status,
        x: savedPos ? savedPos.x : Math.cos(angle) * (HEX_RING_PROJ + radialStagger),
        y: savedPos ? savedPos.y : Math.sin(angle) * (HEX_RING_PROJ + radialStagger),
        vx: 0, vy: 0,
        radius: 34,
        level: 2,
        parentId: `team-${primaryTeamId}`,
        childTasksCount: pTasks.length,
        childPeopleCount: pPeople.length
      });

      linkedTeamIds.forEach(tId => {
        const teamNode = nodesMap.get(`team-${tId}`);
        if (teamNode) {
          edgesList.push({
            id: `edge-${teamNode.id}-${nodeId}`,
            source: teamNode.id,
            target: nodeId,
            relation: 'has_project',
            category: 'tree'
          });
        }
      });
    });

    // Tier 3: People / Contributors (Grouped per Project/Team with generous angular & radial spacing)
    // 1. Group users per project
    const projectContributorsMap = new Map<string, UserType[]>();
    projects.forEach(p => {
      const contribs = getProjectContributors(p, teams, users, tasks);
      projectContributorsMap.set(p.id, contribs);
    });

    // 2. Map standalone users with no projects
    const teamStandaloneUsersMap = new Map<string, UserType[]>();
    teams.forEach(t => {
      const teamUsers = users.filter(u => {
        if (u.teamId !== t.id) return false;
        const userProjs = projects.filter(p => (projectContributorsMap.get(p.id) || []).some(c => c.id === u.id));
        return userProjs.length === 0;
      });
      teamStandaloneUsersMap.set(t.id, teamUsers);
    });

    // Place Project-Linked Members
    projects.forEach(p => {
      const contribs = projectContributorsMap.get(p.id) || [];
      const pAngle = projAngles[p.id] ?? 0;
      const numContribs = contribs.length;

      contribs.forEach((u, cIdx) => {
        const userEod = eodEntries.find(e => e.userId === u.id);
        let eodStatus: 'good' | 'blocked' | 'neutral' = 'neutral';
        if (userEod) {
          if (userEod.flaggedToManager || userEod.blockedTaskId || (userEod.blockers && userEod.blockers.trim() && userEod.blockers.toLowerCase() !== 'no blockers')) {
            eodStatus = 'blocked';
          } else {
            eodStatus = 'good';
          }
        }

        const nodeId = `usr-${u.id}-proj-${p.id}`;
        const savedPos = customPositions[nodeId];

        // Angular spread and radial staggering to prevent any overlapping cards/avatars
        const angleOffset = numContribs > 1 ? (cIdx - (numContribs - 1) / 2) * 0.28 : 0;
        const angle = pAngle + angleOffset;
        const radialStagger = (cIdx % 2 === 1) ? 55 : (cIdx % 4 === 2 ? -35 : 0);

        nodesMap.set(nodeId, {
          id: nodeId,
          entityId: u.id,
          type: 'person',
          label: u.name,
          sublabel: u.title,
          avatarUrl: u.avatarUrl,
          eodStatus,
          x: savedPos ? savedPos.x : Math.cos(angle) * (HEX_RING_PEOPLE + radialStagger),
          y: savedPos ? savedPos.y : Math.sin(angle) * (HEX_RING_PEOPLE + radialStagger),
          vx: 0, vy: 0,
          radius: 28,
          level: 3,
          parentId: `proj-${p.id}`
        });

        const projNode = nodesMap.get(`proj-${p.id}`);
        if (projNode) {
          edgesList.push({
            id: `edge-${projNode.id}-${nodeId}`,
            source: projNode.id,
            target: nodeId,
            relation: 'assigned_project',
            category: 'tree'
          });
        }
      });
    });

    // Place Standalone Team-Only Members
    teams.forEach(t => {
      const standaloneUsers = teamStandaloneUsersMap.get(t.id) || [];
      const tAngle = teamAngles[t.id] ?? 0;
      const numUsers = standaloneUsers.length;

      standaloneUsers.forEach((u, uIdx) => {
        const userEod = eodEntries.find(e => e.userId === u.id);
        let eodStatus: 'good' | 'blocked' | 'neutral' = 'neutral';
        if (userEod) {
          if (userEod.flaggedToManager || userEod.blockedTaskId || (userEod.blockers && userEod.blockers.trim() && userEod.blockers.toLowerCase() !== 'no blockers')) {
            eodStatus = 'blocked';
          } else {
            eodStatus = 'good';
          }
        }

        const nodeId = `usr-${u.id}-team-${t.id}`;
        const savedPos = customPositions[nodeId];

        const angleOffset = numUsers > 1 ? (uIdx - (numUsers - 1) / 2) * 0.26 : 0;
        const angle = tAngle + angleOffset;
        const radialStagger = (uIdx % 2 === 1) ? 50 : 0;

        nodesMap.set(nodeId, {
          id: nodeId,
          entityId: u.id,
          type: 'person',
          label: u.name,
          sublabel: u.title,
          avatarUrl: u.avatarUrl,
          eodStatus,
          x: savedPos ? savedPos.x : Math.cos(angle) * (HEX_RING_PEOPLE + radialStagger),
          y: savedPos ? savedPos.y : Math.sin(angle) * (HEX_RING_PEOPLE + radialStagger),
          vx: 0, vy: 0,
          radius: 28,
          level: 3,
          parentId: `team-${t.id}`
        });

        const teamNode = nodesMap.get(`team-${t.id}`);
        if (teamNode) {
          edgesList.push({
            id: `edge-${teamNode.id}-${nodeId}`,
            source: teamNode.id,
            target: nodeId,
            relation: 'team_member',
            category: 'tree'
          });
        }
      });
    });

    // Tier 4: Tasks (arranged cleanly beyond project hexes with per-project fans)
    projects.forEach(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pAngle = projAngles[p.id] ?? 0;
      const numTasks = pTasks.length;

      pTasks.forEach((tsk, tIdx) => {
        const nodeId = `task-${tsk.id}`;
        const savedPos = customPositions[nodeId];
        const primaryTag = tags.find(tg => tsk.tagIds.includes(tg.id));

        const angleOffset = numTasks > 1 ? (tIdx - (numTasks - 1) / 2) * 0.18 : 0;
        const angle = pAngle + angleOffset;
        const radialStagger = (tIdx % 2 === 1) ? 45 : (tIdx % 3 === 2 ? 80 : 0);

        nodesMap.set(nodeId, {
          id: nodeId,
          entityId: tsk.id,
          type: 'task',
          label: tsk.title,
          sublabel: `${tsk.priority} • ${tsk.status}`,
          status: tsk.status,
          color: primaryTag ? primaryTag.colorHex : '#8B5CF6',
          x: savedPos ? savedPos.x : Math.cos(angle) * (HEX_RING_TASKS + radialStagger),
          y: savedPos ? savedPos.y : Math.sin(angle) * (HEX_RING_TASKS + radialStagger),
          vx: 0, vy: 0,
          radius: 22,
          level: 4,
          parentId: `proj-${tsk.projectId}`
        });

        const projNode = nodesMap.get(`proj-${tsk.projectId}`);
        if (projNode) {
          edgesList.push({
            id: `edge-${projNode.id}-${nodeId}`,
            source: projNode.id,
            target: nodeId,
            relation: 'has_task',
            category: 'tree',
            animated: tsk.status === 'InProgress'
          });
        }

        // Cross-cutting Task -> Assignee edge
        tsk.assigneeIds.forEach(uId => {
          const matchingPersonNode = Array.from(nodesMap.values()).find(n => n.type === 'person' && n.entityId === uId && n.id.includes(tsk.projectId));
          const personNodeId = matchingPersonNode ? matchingPersonNode.id : Array.from(nodesMap.values()).find(n => n.type === 'person' && n.entityId === uId)?.id;

          if (personNodeId) {
            edgesList.push({
              id: `edge-${nodeId}-${personNodeId}`,
              source: nodeId,
              target: personNodeId,
              relation: 'assigned_to',
              category: tsk.status === 'Blocked' ? 'blocker' : 'assignment'
            });
          }
        });

        // Cross-cutting Task Dependencies
        (tsk.dependencyTaskIds || []).forEach(depTaskId => {
          const targetTaskNode = nodesMap.get(`task-${depTaskId}`);
          if (targetTaskNode) {
            edgesList.push({
              id: `edge-dep-${nodeId}-${targetTaskNode.id}`,
              source: nodeId,
              target: targetTaskNode.id,
              relation: 'depends_on',
              category: 'dependency'
            });
          }
        });
      });
    });

    // Tier 5: Goals / OKRs (outer tactical hex perimeter)
    goals.forEach((g: Goal, gIndex: number) => {
      const angle = (gIndex / Math.max(1, goals.length)) * Math.PI * 2 - Math.PI / 3;
      const nodeId = `goal-${g.id}`;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: g.id,
        type: 'goal',
        label: g.title,
        sublabel: g.status,
        progress: 70,
        x: savedPos ? savedPos.x : Math.cos(angle) * HEX_RING_GOALS,
        y: savedPos ? savedPos.y : Math.sin(angle) * HEX_RING_GOALS,
        vx: 0, vy: 0,
        radius: 25,
        level: 5
      });

      // Link Goals to linked tasks/projects
      (g.linkedTaskIds || []).forEach(tId => {
        const tNode = nodesMap.get(`task-${tId}`);
        if (tNode) {
          edgesList.push({
            id: `edge-goal-${nodeId}-${tNode.id}`,
            source: nodeId,
            target: tNode.id,
            relation: 'linked_goal',
            category: 'okr'
          });
        }
      });
    });

    // Anti-Collision Relaxation Pass (Guarantees zero overlapping cards or avatars)
    const allGeneratedNodes = Array.from(nodesMap.values());
    for (let iter = 0; iter < 28; iter++) {
      for (let i = 0; i < allGeneratedNodes.length; i++) {
        const nodeA = allGeneratedNodes[i];
        if (nodeA.level === 0 || customPositions[nodeA.id]) continue;

        for (let j = i + 1; j < allGeneratedNodes.length; j++) {
          const nodeB = allGeneratedNodes[j];
          if (nodeB.level === 0) continue;

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.hypot(dx, dy) || 0.001;

          // Safe distance calculation: card mode requires ~140px, avatar mode ~80px, tasks ~65px
          const isPersonPair = nodeA.type === 'person' || nodeB.type === 'person';
          const minSeparation = isPersonPair ? (displayMode === 'card' ? 140 : 80) : (nodeA.radius + nodeB.radius + 30);

          if (dist < minSeparation) {
            const push = (minSeparation - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;

            if (!customPositions[nodeA.id] && nodeA.level > 1) {
              nodeA.x -= nx * push;
              nodeA.y -= ny * push;
            }
            if (!customPositions[nodeB.id] && nodeB.level > 1) {
              nodeB.x += nx * push;
              nodeB.y += ny * push;
            }
          }
        }
      }
    }

    return {
      allNodesMap: nodesMap,
      initialNodes: Array.from(nodesMap.values()),
      initialEdges: edgesList,
      hexRings: [HEX_RING_TEAMS, HEX_RING_PROJ, HEX_RING_PEOPLE, HEX_RING_TASKS, HEX_RING_GOALS]
    };
  }, [teams, projects, users, tasks, goals, tags, eodEntries, customPositions, currentOrgSlug]);

  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges.filter(e => !deletedEdgeIds.has(e.id)));
  }, [initialNodes, initialEdges, deletedEdgeIds]);

  // Determine active focus target (either focusNodeId or selectedNodeId or search match)
  const activeFocusId = focusNodeId || selectedNodeId;

  // Compute Multi-occurrence sibling node IDs for a person
  const matchingMultiNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const selectedNode = nodes.find(n => n.id === activeFocusId || n.entityId === activeFocusId);
    if (!selectedNode) return new Set<string>();

    const set = new Set<string>();
    nodes.forEach(n => {
      if (n.entityId === selectedNode.entityId) {
        set.add(n.id);
      }
    });
    return set;
  }, [activeFocusId, nodes]);

  // Build Adjacency Graph for N-Hop Neighborhood computation
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    edges.forEach(e => {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    });
    return map;
  }, [edges]);

  // BFS N-Hop Distance Map from Active Focus Node
  const nodeDistanceMap = useMemo(() => {
    if (!activeFocusId) return null;
    const distMap = new Map<string, number>();
    const queue: Array<{ id: string; dist: number }> = [];

    // Seed queue with all matching instances (e.g. multi-project person instances)
    const seedIds = matchingMultiNodeIds.size > 0 ? Array.from(matchingMultiNodeIds) : [activeFocusId];
    seedIds.forEach(id => {
      distMap.set(id, 0);
      queue.push({ id, dist: 0 });
    });

    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      if (dist >= currentFocusDepth) continue;

      const neighbors = adjacencyMap.get(id);
      if (neighbors) {
        neighbors.forEach(neighborId => {
          if (!distMap.has(neighborId)) {
            distMap.set(neighborId, dist + 1);
            queue.push({ id: neighborId, dist: dist + 1 });
          }
        });
      }
    }

    return distMap;
  }, [activeFocusId, matchingMultiNodeIds, adjacencyMap, currentFocusDepth]);

  // Node Visibility Calculation based on Collapsed Hierarchy & Focus
  const nodeVisibilityMap = useMemo(() => {
    const visibilityMap = new Map<string, { isVisible: boolean; opacity: number; isFocused: boolean; isGhost: boolean }>();

    nodes.forEach(node => {
      // 1. Is node explicitly focused or inside N-hop neighborhood?
      const hopDist = nodeDistanceMap ? nodeDistanceMap.get(node.id) : undefined;
      const isInFocusNeighborhood = hopDist !== undefined;

      // 2. Hierarchy Drill-Down Visibility Check:
      let isHierarchyVisible = false;

      if (node.level === 0) {
        // Core Hub is always visible
        isHierarchyVisible = true;
      } else if (node.level === 1) {
        // Teams are visible on load (Level 1)
        isHierarchyVisible = true;
      } else if (node.level === 2) {
        // Projects visible IF parent team is expanded OR project itself is in expanded set
        const parentTeamId = node.parentId;
        isHierarchyVisible = parentTeamId ? expandedNodeIds.has(parentTeamId) : false;
      } else if (node.level === 3 || node.level === 4) {
        // People & Tasks visible IF parent project is expanded
        const parentProjId = node.parentId;
        isHierarchyVisible = parentProjId ? expandedNodeIds.has(parentProjId) : false;
      } else if (node.level === 5) {
        // Goals visible IF OKRs overlay enabled or focused
        isHierarchyVisible = currentOverlayFilter === 'okrs' || currentOverlayFilter === 'all' || expandedNodeIds.has('goals');
      }

      // If search query matches this node, make it visible
      const isSearched = searchQuery ? node.label.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      if (isSearched || isInFocusNeighborhood) {
        isHierarchyVisible = true;
      }

      // Calculate Visual Opacity
      let opacity = 1;
      let isGhost = false;

      if (nodeDistanceMap) {
        // When Focus Mode is active:
        if (hopDist === 0) opacity = 1;
        else if (hopDist === 1) opacity = 1;
        else if (hopDist === 2) opacity = 0.7;
        else opacity = 0.12; // Dim out-of-focus background
      } else {
        // When in standard overview mode:
        if (!isHierarchyVisible) {
          opacity = 0; // Collapsed nodes completely clean from canvas
        } else {
          opacity = 1;
        }
      }

      visibilityMap.set(node.id, {
        isVisible: isHierarchyVisible || isInFocusNeighborhood,
        opacity,
        isFocused: hopDist === 0,
        isGhost
      });
    });

    return visibilityMap;
  }, [nodes, expandedNodeIds, nodeDistanceMap, currentOverlayFilter, searchQuery]);

  // Screen mouse/canvas coordinate conversion
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Canvas Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (connectingSourceId) return;
    const targetEl = e.target as HTMLElement;
    const isSvgCanvas = targetEl.tagName === 'svg' || (targetEl.tagName === 'rect' && targetEl.getAttribute('id') === 'hex-bg');

    if (isSvgCanvas) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleConnectNodes = (sourceNode: GraphNode, targetNode: GraphNode) => {
    if (sourceNode.id === targetNode.id) return;

    let successMsg = '';

    // Task -> Task Dependency
    if (sourceNode.type === 'task' && targetNode.type === 'task') {
      const srcTask = tasks.find(t => t.id === sourceNode.entityId);
      if (srcTask && !srcTask.dependencyTaskIds.includes(targetNode.entityId)) {
        updateTask(sourceNode.entityId, { dependencyTaskIds: [...srcTask.dependencyTaskIds, targetNode.entityId] });
        successMsg = `Linked dependency: "${sourceNode.label}" depends on "${targetNode.label}"`;
      }
    }
    // Task -> Person Assignment
    else if (sourceNode.type === 'task' && targetNode.type === 'person') {
      updateTask(sourceNode.entityId, { assigneeIds: [targetNode.entityId] });
      successMsg = `Assigned task "${sourceNode.label}" to ${targetNode.label}`;
    }
    else if (sourceNode.type === 'person' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { assigneeIds: [sourceNode.entityId] });
      successMsg = `Assigned task "${targetNode.label}" to ${sourceNode.label}`;
    }
    // Task -> Project Movement
    else if (sourceNode.type === 'task' && targetNode.type === 'project') {
      updateTask(sourceNode.entityId, { projectId: targetNode.entityId });
      successMsg = `Moved task "${sourceNode.label}" to project "${targetNode.label}"`;
    }
    else if (sourceNode.type === 'project' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { projectId: sourceNode.entityId });
      successMsg = `Moved task "${targetNode.label}" to project "${sourceNode.label}"`;
    }
    // Project -> Team Association
    else if (sourceNode.type === 'project' && targetNode.type === 'team') {
      const proj = projects.find(p => p.id === sourceNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds !== undefined ? proj.teamIds : (proj.teamId ? [proj.teamId] : []);
        if (!currentTeams.includes(targetNode.entityId)) {
          updateProject(sourceNode.entityId, { teamIds: [...currentTeams, targetNode.entityId], teamId: targetNode.entityId });
          successMsg = `Linked project "${sourceNode.label}" to Team "${targetNode.label}"`;
        }
      }
    }
    else if (sourceNode.type === 'team' && targetNode.type === 'project') {
      const proj = projects.find(p => p.id === targetNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds !== undefined ? proj.teamIds : (proj.teamId ? [proj.teamId] : []);
        if (!currentTeams.includes(sourceNode.entityId)) {
          updateProject(targetNode.entityId, { teamIds: [...currentTeams, sourceNode.entityId], teamId: sourceNode.entityId });
          successMsg = `Linked project "${targetNode.label}" to Team "${sourceNode.label}"`;
        }
      }
    }

    if (successMsg) {
      setToastMessage(successMsg);
      setTimeout(() => setToastMessage(null), 3500);
    }

    setEdges(prev => [
      ...prev,
      {
        id: `edge-custom-${Date.now()}`,
        source: sourceNode.id,
        target: targetNode.id,
        relation: 'custom_link',
        category: 'custom',
        animated: true
      }
    ]);
  };

  const handleDeleteEdge = (edge: GraphEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    let successMsg = `Unlinked connection between "${sourceNode.label}" and "${targetNode.label}"`;

    if (sourceNode.type === 'task' && targetNode.type === 'project') {
      updateTask(sourceNode.entityId, { projectId: 'unassigned' });
    } else if (sourceNode.type === 'project' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { projectId: 'unassigned' });
    } else if (sourceNode.type === 'project' && targetNode.type === 'team') {
      const proj = projects.find(p => p.id === sourceNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds !== undefined ? proj.teamIds : (proj.teamId ? [proj.teamId] : []);
        const updatedTeams = currentTeams.filter(tId => tId !== targetNode.entityId);
        updateProject(sourceNode.entityId, { teamIds: updatedTeams, teamId: updatedTeams[0] || '' });
      }
    } else if (sourceNode.type === 'team' && targetNode.type === 'project') {
      const proj = projects.find(p => p.id === targetNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds !== undefined ? proj.teamIds : (proj.teamId ? [proj.teamId] : []);
        const updatedTeams = currentTeams.filter(tId => tId !== sourceNode.entityId);
        updateProject(targetNode.entityId, { teamIds: updatedTeams, teamId: updatedTeams[0] || '' });
      }
    }

    setDeletedEdgeIds(prev => new Set(prev).add(edge.id));
    setEdges(prev => prev.filter(e => e.id !== edge.id));
    setHoveredEdgeId(null);
    setSelectedEdgeId(null);

    setToastMessage(successMsg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    setMouseCanvasPos(canvasCoords);

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }

    if (draggingNodeId) {
      let newX = canvasCoords.x - dragOffset.x;
      let newY = canvasCoords.y - dragOffset.y;

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));

      const hoverTarget = nodes.find(n => {
        if (n.id === draggingNodeId) return false;
        const dx = n.x - newX;
        const dy = n.y - newY;
        return Math.hypot(dx, dy) < 45;
      });
      setHoverDropTargetId(hoverTarget ? hoverTarget.id : null);
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      const draggedNode = nodes.find(n => n.id === draggingNodeId);
      if (hoverDropTargetId && draggedNode) {
        const targetNode = nodes.find(n => n.id === hoverDropTargetId);
        if (targetNode) {
          handleConnectNodes(draggedNode, targetNode);
        }
      }

      if (draggedNode) {
        savePositions({
          ...customPositions,
          [draggedNode.id]: { x: draggedNode.x, y: draggedNode.y }
        });
      }
    }

    setDraggingNodeId(null);
    setHoverDropTargetId(null);
    setIsPanning(false);
  };

  const handleNodeMouseDown = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(node.entityId, node.type);

    if (connectingSourceId) {
      if (connectingSourceId !== node.id) {
        const sourceNode = nodes.find(n => n.id === connectingSourceId);
        if (sourceNode) handleConnectNodes(sourceNode, node);
      }
      setConnectingSourceId(null);
      return;
    }

    if (activeTool === 'connector') {
      setConnectingSourceId(node.id);
      return;
    }

    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    setDraggingNodeId(node.id);
    setDragOffset({ x: canvasCoords.x - node.x, y: canvasCoords.y - node.y });
  };

  // Keyboard shortcut for Delete key on edge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        const edgeToDelete = edges.find(edge => edge.id === selectedEdgeId);
        if (edgeToDelete) handleDeleteEdge(edgeToDelete);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, edges]);

  // Handle Wheel Zoom without page zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(prev => Math.min(Math.max(0.2, prev * zoomFactor), 2.5));
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, []);

  const strokeLinkColor = isDarkMode ? '#27272A' : '#E4E4E7';

  const resetCamera = () => {
    setZoom(0.8);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    } else {
      setPan({ x: 450, y: 350 });
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none font-sans transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0F1115] text-[#F4F5F7]' : 'bg-[#F4F5F7] text-neutral-900'
      }`}
    >
      {/* Top Left Focus Mode Badge */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 shadow-lg flex items-center gap-2 font-mono text-xs">
          <Hexagon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {activeFocusId ? 'Focus Neighborhood' : 'Hexagon Topology Matrix'}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-normal">
              {activeFocusId ? `Depth: ${currentFocusDepth} Hop${currentFocusDepth > 1 ? 's' : ''}` : 'Click hexagonal cells or expand badges to inspect'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Control Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-2 font-mono text-xs max-w-full overflow-x-auto custom-scrollbar">
        {/* Tool Modes */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => { setActiveTool('select'); setConnectingSourceId(null); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTool === 'select'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Move Tool (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          <button
            onClick={() => setActiveTool('connector')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTool === 'connector'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Connector Tool (C)"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>
        </div>

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 my-auto shrink-0" />

        {/* Focus Depth Selector */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <span className="text-[10px] text-neutral-400 px-2 font-medium uppercase tracking-wider">Depth:</span>
          {[1, 2, 3].map(d => (
            <button
              key={d}
              onClick={() => setFocusDepth(d)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                currentFocusDepth === d
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={`Spotlight ${d}-hop neighborhood`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 my-auto shrink-0" />

        {/* Edge Overlay Filter */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setOverlayFilter('tree')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              currentOverlayFilter === 'tree'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Show clean hierarchical tree arcs only"
          >
            Tree Only
          </button>
          <button
            onClick={() => setOverlayFilter('all')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              currentOverlayFilter === 'all'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Show all structural and cross-cutting connections"
          >
            All Links
          </button>
          <button
            onClick={() => setOverlayFilter('dependencies')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${
              currentOverlayFilter === 'dependencies'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Spotlight Task Dependencies"
          >
            <GitCommit className="w-3 h-3" />
            <span>Deps</span>
          </button>
          <button
            onClick={() => setOverlayFilter('blockers')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${
              currentOverlayFilter === 'blockers'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Spotlight Blocker Alerts"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Blockers</span>
          </button>
          <button
            onClick={() => setOverlayFilter('okrs')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${
              currentOverlayFilter === 'okrs'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Spotlight OKR Alignments"
          >
            <Target className="w-3 h-3" />
            <span>OKRs</span>
          </button>
        </div>

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 my-auto shrink-0" />

        {/* Display Toggle: Initials vs Cards */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setDisplayMode('avatar')}
            className={`p-1 rounded-md transition-all ${
              displayMode === 'avatar' 
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold' 
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Hexagonal Avatar Initials"
          >
            <UserIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDisplayMode('card')}
            className={`p-1 rounded-md transition-all ${
              displayMode === 'card' 
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold' 
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Full Profile Cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid, Snap & Pulse Toggles */}
        <button
          onClick={() => setShowHexGrid(prev => !prev)}
          className={`p-1.5 rounded-lg transition-all ${
            showHexGrid ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Toggle Hexagon Grid Lattice"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setSnapToGrid(prev => !prev)}
          className={`p-1.5 rounded-lg transition-all ${
            snapToGrid ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Snap to 20px Grid"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setEnablePulseAnimation(prev => !prev)}
          className={`p-1.5 rounded-lg transition-all ${
            enablePulseAnimation 
              ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 shadow-xs' 
              : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title={enablePulseAnimation ? "Pulse Flow Active" : "Enable Pulse Animation"}
        >
          <Activity className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 my-auto shrink-0" />

        {/* Zoom Controls & Reset Camera */}
        <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setZoom(z => z * 1.15)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] w-8 text-center font-semibold text-neutral-900 dark:text-white">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => z * 0.85)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            title="Center Camera"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dynamic Toast Feedback Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce font-mono">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main SVG Hexagon Grid Canvas */}
      <svg className="w-full h-full relative z-10 pointer-events-auto">
        <rect id="hex-bg" width="100%" height="100%" fill="transparent" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <defs>
            {/* Glow filters for energetic pulse effect */}
            <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="pulse-glow-strong" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <marker id="hex-arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#475569' : '#94A3B8'} />
            </marker>
            <marker id="hex-arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#60A5FA' : '#2563EB'} />
            </marker>
          </defs>

          {/* 1. Concentric Hexagon Grid Tier Boundaries & Rays */}
          {showHexGrid && (
            <g opacity={isDarkMode ? 0.35 : 0.55}>
              {/* Concentric Tier Hexagon Boundary Perimeters */}
              {hexRings.map((r, idx) => (
                <g key={`hex-ring-${r}`}>
                  <polygon
                    points={getHexagonPoints(0, 0, r, true)}
                    fill="none"
                    stroke={isDarkMode ? '#475569' : '#94A3B8'}
                    strokeWidth={idx === 0 ? "1.8" : "1.2"}
                    strokeDasharray="8 6"
                  />
                  {/* Hexagon Corner Vertex Pins */}
                  {Array.from({ length: 6 }).map((_, vIdx) => {
                    const angle = -Math.PI / 2 + (vIdx * Math.PI) / 3;
                    const vx = r * Math.cos(angle);
                    const vy = r * Math.sin(angle);
                    return (
                      <circle
                        key={`vpin-${r}-${vIdx}`}
                        cx={vx}
                        cy={vy}
                        r={2.5}
                        fill={isDarkMode ? '#64748B' : '#94A3B8'}
                      />
                    );
                  })}
                </g>
              ))}

              {/* 6 Primary Hexagonal Sector Vector Rays */}
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = -Math.PI / 2 + (i * Math.PI) / 3;
                const outerR = 1050;
                return (
                  <line
                    key={`hex-spoke-${i}`}
                    x1="0"
                    y1="0"
                    x2={Math.cos(angle) * outerR}
                    y2={Math.sin(angle) * outerR}
                    stroke={isDarkMode ? '#334155' : '#CBD5E1'}
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </g>
          )}

          {/* 2. Link Edges with Separated Layering & Focus Mode Opacity */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const srcVis = nodeVisibilityMap.get(sourceNode.id);
            const tgtVis = nodeVisibilityMap.get(targetNode.id);

            // Don't render edge if either endpoint is invisible / collapsed
            if (!srcVis?.isVisible || !tgtVis?.isVisible) return null;

            // Apply Edge Overlay Filter
            if (currentOverlayFilter === 'tree' && edge.category !== 'tree') return null;
            if (currentOverlayFilter === 'dependencies' && edge.category !== 'dependency' && edge.category !== 'tree') return null;
            if (currentOverlayFilter === 'blockers' && edge.category !== 'blocker' && edge.category !== 'tree') return null;
            if (currentOverlayFilter === 'okrs' && edge.category !== 'okr' && edge.category !== 'tree') return null;

            const isEdgeHovered = hoveredEdgeId === edge.id;
            const isEdgeSelected = selectedEdgeId === edge.id;

            // Calculate Edge Opacity from Hop Distances
            const minNodeOpacity = Math.min(srcVis.opacity, tgtVis.opacity);
            const isEdgeHighlighted = (srcVis.isFocused || tgtVis.isFocused) || (nodeDistanceMap && nodeDistanceMap.has(sourceNode.id) && nodeDistanceMap.has(targetNode.id));
            const edgeOpacity = isEdgeHovered || isEdgeSelected ? 1 : Math.max(0.1, minNodeOpacity * (isEdgeHighlighted ? 1 : 0.5));

            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const cx = (sourceNode.x + targetNode.x) / 2 + dy * 0.12;
            const cy = (sourceNode.y + targetNode.y) / 2 - dx * 0.12;

            const pathD = `M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`;

            // Pulse Coloring & Velocity
            const isBlocked = edge.category === 'blocker' || sourceNode.status === 'Blocked' || targetNode.status === 'Blocked';
            const isInProgress = (sourceNode.status === 'InProgress' || targetNode.status === 'InProgress') || edge.animated === true;
            const isOKR = edge.category === 'okr' || sourceNode.type === 'goal' || targetNode.type === 'goal';
            const isDependency = edge.category === 'dependency';

            let pulseColor = isDarkMode ? '#60A5FA' : '#2563EB';
            let pulseDuration = 3.2;

            if (isBlocked) {
              pulseColor = '#EF4444';
              pulseDuration = 1.8;
            } else if (isInProgress) {
              pulseColor = '#06B6D4';
              pulseDuration = 2.2;
            } else if (isDependency) {
              pulseColor = '#A855F7';
              pulseDuration = 2.5;
            } else if (isOKR) {
              pulseColor = '#EC4899';
              pulseDuration = 3.6;
            }

            const coordHash = Math.abs(Math.sin(sourceNode.x * 12.9898 + targetNode.y * 78.233)) * 10;
            const staggerOffset = (coordHash % pulseDuration);

            return (
              <g 
                key={edge.id} 
                opacity={edgeOpacity} 
                className="transition-opacity duration-300 group/edge cursor-pointer"
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(prev => prev === edge.id ? null : prev)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(edge.id);
                }}
              >
                {/* Thick Hit Area */}
                <path d={pathD} stroke="transparent" strokeWidth="16" fill="none" />

                {/* Base Track Path */}
                <path
                  d={pathD}
                  stroke={
                    isEdgeHovered || isEdgeSelected 
                      ? '#EF4444' 
                      : (isEdgeHighlighted 
                          ? (isDarkMode ? '#60A5FA' : '#2563EB')
                          : (edge.category === 'blocker'
                              ? '#EF4444'
                              : (edge.category === 'okr'
                                  ? (isDarkMode ? '#EC4899' : '#DB2777')
                                  : (isDependency
                                      ? (isDarkMode ? '#A855F7' : '#9333EA')
                                      : (sourceNode.type === 'team' || targetNode.type === 'team'
                                          ? (isDarkMode ? '#1E3A8A' : '#93C5FD')
                                          : (sourceNode.type === 'project' || targetNode.type === 'project'
                                              ? (isDarkMode ? '#0E7490' : '#7DD3FC')
                                              : strokeLinkColor))))))
                  }
                  strokeWidth={isEdgeHovered || isEdgeSelected ? 3.5 : (isEdgeHighlighted ? 2.4 : (edge.category === 'tree' ? 1.6 : 1.2))}
                  strokeDasharray={isDependency ? '5 5' : (edge.category === 'assignment' ? '3 3' : undefined)}
                  fill="none"
                  markerEnd={isEdgeHovered || isEdgeSelected ? undefined : (isEdgeHighlighted ? 'url(#hex-arrow-active)' : 'url(#hex-arrow)')}
                />

                {/* Animated Pulse Energy Orb (Rendered on Active / Highlighted / In-Progress edges) */}
                {enablePulseAnimation && !isEdgeHovered && !isEdgeSelected && (isEdgeHighlighted || isInProgress || isBlocked) && (
                  <g opacity={isEdgeHighlighted ? 1 : 0.7}>
                    <circle r={isEdgeHighlighted ? 8 : 6} fill={pulseColor} opacity="0.3" filter="url(#pulse-glow-strong)">
                      <animateMotion
                        path={pathD}
                        dur={`${pulseDuration}s`}
                        begin={`-${staggerOffset}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                      />
                    </circle>
                    <circle r={isEdgeHighlighted ? 3 : 2} fill="#FFFFFF" stroke={pulseColor} strokeWidth="1.2">
                      <animateMotion
                        path={pathD}
                        dur={`${pulseDuration}s`}
                        begin={`-${staggerOffset}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                      />
                    </circle>
                  </g>
                )}

                {/* Disconnect Button at Midpoint */}
                {(isEdgeHovered || isEdgeSelected) && (
                  <g
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteEdge(edge);
                    }}
                    transform={`translate(${cx}, ${cy})`}
                    className="cursor-pointer select-none"
                  >
                    <circle r="13" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.5" className="drop-shadow-md" />
                    <text textAnchor="middle" dy="3.5" fill="#FFFFFF" fontSize="11" fontWeight="bold" pointerEvents="none">✕</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Temporary Connection Rubberband Line */}
          {connectingSourceId && (() => {
            const sourceNode = nodes.find(n => n.id === connectingSourceId);
            if (!sourceNode) return null;
            return (
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={mouseCanvasPos.x}
                y2={mouseCanvasPos.y}
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            );
          })()}

          {/* 3. Hexagonal Nodes with Sleek Cellular Geometry & On-Demand Badges */}
          {nodes.map(node => {
            const vis = nodeVisibilityMap.get(node.id);
            if (!vis || !vis.isVisible) return null;

            const isSelected = selectedNodeId === node.id || selectedNodeId === node.entityId;
            const isFocused = vis.isFocused;
            const isMultiMatch = matchingMultiNodeIds.has(node.id);
            const isSearched = searchQuery ? node.label.toLowerCase().includes(searchQuery.toLowerCase()) : false;
            const isExpanded = expandedNodeIds.has(node.id) || (node.level === 0);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={e => handleNodeMouseDown(node, e)}
                opacity={vis.opacity}
                className="cursor-grab active:cursor-grabbing group transition-opacity duration-300"
              >
                {/* Search Ping */}
                {isSearched && (
                  <polygon
                    points={getHexagonPoints(0, 0, node.radius + 16, true)}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="3"
                    className="animate-ping"
                  />
                )}

                {/* Multi-Occurrence Ring for same Person */}
                {isMultiMatch && (
                  <polygon
                    points={getHexagonPoints(0, 0, node.radius + 12, true)}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Selection & Focus Highlight Hex Aura */}
                {(isSelected || isFocused) && (
                  <polygon
                    points={getHexagonPoints(0, 0, node.radius + 8, true)}
                    fill="none"
                    stroke={isDarkMode ? '#F4F5F7' : '#18181B'}
                    strokeWidth="2.5"
                    className="drop-shadow-md"
                  />
                )}

                {/* Tier 0: Center Core Organization (Large Dual-Hexagon Hub) */}
                {node.level === 0 && (
                  <g>
                    {/* Outer Hex Halo */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius + 6, true)} 
                      fill="none" 
                      stroke={isDarkMode ? '#6366F1' : '#818CF8'} 
                      strokeWidth="1.5" 
                      strokeDasharray="4 3" 
                      opacity={0.7} 
                    />
                    {/* Central Hexagon Body */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius, true)} 
                      fill={isDarkMode ? '#1E1B4B' : '#EEF2FF'} 
                      stroke={isDarkMode ? '#818CF8' : '#6366F1'} 
                      strokeWidth="2.5" 
                      className="drop-shadow-lg" 
                    />
                    {/* Inner Accent Hex Contour */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius - 8, true)} 
                      fill="none" 
                      stroke={isDarkMode ? '#4338CA' : '#C7D2FE'} 
                      strokeWidth="1" 
                      opacity={0.8} 
                    />
                    <text textAnchor="middle" dy="-3" fill={isDarkMode ? '#FFFFFF' : '#1E1B4B'} fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                      {node.label.length > 8 ? node.label.substring(0, 8).toUpperCase() : node.label.toUpperCase()}
                    </text>
                    <text textAnchor="middle" dy="10" fill={isDarkMode ? '#A5B4FC' : '#4F46E5'} fontSize="8" fontWeight="bold" fontFamily="monospace">ORG CORE</text>
                    <text textAnchor="middle" dy={node.radius + 20} fill={isDarkMode ? '#E0E7FF' : '#1E1B4B'} fontSize="11" fontWeight="bold">{node.label}</text>
                  </g>
                )}

                {/* Tier 1: Squad / Team Nodes (Hexagon Cell with Child Projects Expander) */}
                {node.type === 'team' && node.level > 0 && (
                  <g>
                    {/* Hexagon Cell Body */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius, true)} 
                      fill={isDarkMode ? '#0F1E36' : '#EFF6FF'} 
                      stroke={isDarkMode ? '#3B82F6' : '#2563EB'} 
                      strokeWidth="2.2" 
                      className="drop-shadow-md" 
                    />
                    {/* Inner Hex Outline */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius - 7, true)} 
                      fill="none" 
                      stroke={isDarkMode ? '#1E3A8A' : '#BFDBFE'} 
                      strokeWidth="1" 
                      opacity={0.7} 
                    />
                    <text textAnchor="middle" dy="-4" fill={isDarkMode ? '#93C5FD' : '#1D4ED8'} fontSize="9.5" fontWeight="bold" fontFamily="monospace">SQUAD</text>
                    <text textAnchor="middle" dy="9" fill={isDarkMode ? '#BFDBFE' : '#3B82F6'} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                      {node.entityId.replace('team-', '').substring(0, 6).toUpperCase()}
                    </text>
                    <text textAnchor="middle" dy={node.radius + 20} fill={isDarkMode ? '#F0F9FF' : '#0F172A'} fontSize="11" fontWeight="bold">{node.label}</text>

                    {/* Interactive Sub-Tree Expander Button */}
                    {(node.childProjectsCount ?? 0) > 0 && (
                      <g 
                        transform={`translate(0, ${node.radius + 34})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpandNode(node.id);
                        }}
                        className="cursor-pointer"
                      >
                        <rect
                          x="-34"
                          y="-9"
                          width="68"
                          height="18"
                          rx="9"
                          fill={isExpanded ? (isDarkMode ? '#1E293B' : '#DBEAFE') : (isDarkMode ? '#1E3A8A' : '#2563EB')}
                          stroke={isDarkMode ? '#3B82F6' : '#93C5FD'}
                          strokeWidth="1.2"
                          className="drop-shadow-sm"
                        />
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fill={isExpanded ? (isDarkMode ? '#93C5FD' : '#1E40AF') : '#FFFFFF'}
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {isExpanded ? `▼ ${node.childProjectsCount} Proj` : `▶ ${node.childProjectsCount} Proj`}
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Tier 2: Project Nodes (Cyan Hexagon Cell with Child Tasks Expander) */}
                {node.type === 'project' && (
                  <g>
                    {/* Hexagon Body */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius, true)} 
                      fill={isDarkMode ? '#08252B' : '#ECFEFF'} 
                      stroke={isDarkMode ? '#06B6D4' : '#0891B2'} 
                      strokeWidth="2.2" 
                      className="drop-shadow-md" 
                    />
                    {/* Inner Hex Outline */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius - 6, true)} 
                      fill="none" 
                      stroke={isDarkMode ? '#164E63' : '#A5F3FC'} 
                      strokeWidth="1" 
                      opacity={0.6} 
                    />
                    <text textAnchor="middle" dy="-3" fill={isDarkMode ? '#22D3EE' : '#0E7490'} fontSize="9" fontWeight="bold" fontFamily="monospace">PRJ</text>
                    <text textAnchor="middle" dy="9" fill={isDarkMode ? '#A5F3FC' : '#0891B2'} fontSize="7" fontWeight="semibold" fontFamily="monospace">
                      {node.status && node.status.length > 8 ? `${node.status.substring(0, 7)}.` : (node.status || 'Active')}
                    </text>
                    <text textAnchor="middle" dy={node.radius + 20} fill={isDarkMode ? '#F4F5F7' : '#083344'} fontSize="11" fontWeight="bold">
                      {node.label.length > 18 ? `${node.label.substring(0, 16)}...` : node.label}
                    </text>

                    {/* Interactive Sub-Tree Expander Button */}
                    {((node.childTasksCount ?? 0) + (node.childPeopleCount ?? 0)) > 0 && (
                      <g 
                        transform={`translate(0, ${node.radius + 34})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpandNode(node.id);
                        }}
                        className="cursor-pointer"
                      >
                        <rect
                          x="-36"
                          y="-9"
                          width="72"
                          height="18"
                          rx="9"
                          fill={isExpanded ? (isDarkMode ? '#164E63' : '#E0F2FE') : (isDarkMode ? '#0891B2' : '#0284C7')}
                          stroke={isDarkMode ? '#06B6D4' : '#7DD3FC'}
                          strokeWidth="1.2"
                          className="drop-shadow-sm"
                        />
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fill={isExpanded ? (isDarkMode ? '#A5F3FC' : '#0369A1') : '#FFFFFF'}
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {isExpanded ? `▼ ${node.childTasksCount ?? 0} Tasks` : `▶ ${node.childTasksCount ?? 0} Tasks`}
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Tier 3: Person / Contributor Nodes (Hex Avatar or Profile Card) */}
                {node.type === 'person' && (() => {
                  const avatarColor = getAvatarBgColor(node.label);
                  const initials = node.label.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

                  return displayMode === 'avatar' ? (
                    <g>
                      {/* Hexagonal Avatar Container */}
                      <polygon
                        points={getHexagonPoints(0, 0, node.radius, true)}
                        fill={avatarColor}
                        stroke={isDarkMode ? '#FFFFFF' : '#18181B'}
                        strokeWidth="2"
                        className="drop-shadow-sm"
                      />
                      {/* Inner Hex Outline */}
                      <polygon
                        points={getHexagonPoints(0, 0, node.radius - 4, true)}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        opacity={0.4}
                      />
                      <text textAnchor="middle" dy="4" fill="#FFFFFF" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                        {initials}
                      </text>
                      <text textAnchor="middle" dy={node.radius + 18} fill={isDarkMode ? '#F4F5F7' : '#1C1917'} fontSize="10.5" fontWeight="bold">
                        {node.label}
                      </text>
                      {node.eodStatus === 'blocked' && (
                        <polygon
                          points={getHexagonPoints(node.radius - 2, -node.radius + 4, 6, true)}
                          fill="#EF4444"
                          stroke={isDarkMode ? '#0F1115' : '#FFFFFF'}
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  ) : (
                    <g transform="translate(-62, -28)">
                      {/* Modern Chamfered Card */}
                      <rect
                        width="124"
                        height="56"
                        rx="10"
                        fill={isDarkMode ? '#1A1D24' : '#FFFFFF'}
                        stroke={isDarkMode ? '#3F3F46' : '#E4E4E7'}
                        strokeWidth="1.5"
                        className="drop-shadow-lg"
                      />
                      {/* Hexagonal Mini Avatar inside Card */}
                      <g transform="translate(22, 28)">
                        <polygon
                          points={getHexagonPoints(0, 0, 14, true)}
                          fill={avatarColor}
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                        />
                        <text textAnchor="middle" dy="3.5" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                          {initials}
                        </text>
                      </g>
                      <text x="44" y="24" fill={isDarkMode ? '#FFFFFF' : '#1C1917'} fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                        {node.label.length > 12 ? `${node.label.substring(0, 10)}..` : node.label}
                      </text>
                      <text x="44" y="37" fill={isDarkMode ? '#A8A29E' : '#78716C'} fontSize="7.5" fontFamily="sans-serif">
                        {node.sublabel ? (node.sublabel.length > 15 ? `${node.sublabel.substring(0, 13)}..` : node.sublabel) : 'Specialist'}
                      </text>
                      {node.eodStatus === 'blocked' && (
                        <polygon
                          points={getHexagonPoints(108, 14, 5, true)}
                          fill="#EF4444"
                          stroke={isDarkMode ? '#1A1D24' : '#FFFFFF'}
                          strokeWidth="1"
                        />
                      )}
                    </g>
                  );
                })()}

                {/* Tier 4: Task Nodes (Emerald Hexagon Cell) */}
                {node.type === 'task' && (
                  <g>
                    {/* Hexagon Body */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius, true)} 
                      fill={isDarkMode ? '#052E16' : '#F0FDF4'} 
                      stroke={isDarkMode ? '#10B981' : '#059669'} 
                      strokeWidth="2" 
                      className="drop-shadow-md" 
                    />
                    {/* Inner Hex Outline */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius - 5, true)} 
                      fill="none" 
                      stroke={isDarkMode ? '#065F46' : '#A7F3D0'} 
                      strokeWidth="1" 
                      opacity={0.6} 
                    />
                    <text textAnchor="middle" dy="3.5" fill={isDarkMode ? '#34D399' : '#047857'} fontSize="8" fontWeight="bold" fontFamily="monospace">TSK</text>
                    <text textAnchor="middle" dy={node.radius + 18} fill={isDarkMode ? '#F4F5F7' : '#064E3B'} fontSize="10.5" fontWeight="bold">
                      {node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}
                    </text>
                  </g>
                )}

                {/* Tier 5: Goal / OKR Nodes (Fuchsia Hexagon Strategic Diamond) */}
                {node.type === 'goal' && (
                  <g>
                    {/* Hexagon Body */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius, true)} 
                      fill={isDarkMode ? '#2D0639' : '#FDF4FF'} 
                      stroke={isDarkMode ? '#D946EF' : '#A21CAF'} 
                      strokeWidth="2" 
                      className="drop-shadow-md" 
                    />
                    {/* Inner Hex Outline */}
                    <polygon 
                      points={getHexagonPoints(0, 0, node.radius - 5, true)} 
                      fill="none" 
                      stroke={isDarkMode ? '#701A75' : '#F5D0FE'} 
                      strokeWidth="1" 
                      opacity={0.6} 
                    />
                    <text textAnchor="middle" dy="3.5" fill={isDarkMode ? '#F0ABFC' : '#86198F'} fontSize="8.5" fontWeight="bold" fontFamily="monospace">OKR</text>
                    <text textAnchor="middle" dy={node.radius + 20} fill={isDarkMode ? '#F4F5F7' : '#581C87'} fontSize="10.5" fontWeight="bold">
                      {node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}
                    </text>
                  </g>
                )}

                {/* Connector Port Handle */}
                <g 
                  onClick={e => {
                    e.stopPropagation();
                    if (connectingSourceId && connectingSourceId !== node.id) {
                      const sourceNode = nodes.find(n => n.id === connectingSourceId);
                      if (sourceNode) handleConnectNodes(sourceNode, node);
                      setConnectingSourceId(null);
                    } else {
                      setConnectingSourceId(connectingSourceId === node.id ? null : node.id);
                    }
                  }}
                  className={`cursor-pointer transition-all ${connectingSourceId === node.id ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'}`}
                  transform={`translate(${node.radius + 6}, -${node.radius + 6})`}
                >
                  <circle r="11" fill={connectingSourceId === node.id ? '#10B981' : '#3B82F6'} stroke="#FFFFFF" strokeWidth="2" className="drop-shadow-md" />
                  <text textAnchor="middle" dy="3.5" fill="#FFFFFF" fontSize="11" fontWeight="bold">+</text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
