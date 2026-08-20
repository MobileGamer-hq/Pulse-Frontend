import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ZoomIn, ZoomOut, Link2, Check, 
  User as UserIcon, Grid, MousePointer, 
  SlidersHorizontal, LayoutGrid
} from 'lucide-react';
import type { EntityType, Team, Project, Task, Goal, User as UserType } from '../../types';

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
  eodStatus?: 'good' | 'low' | 'blocked' | 'neutral';
  progress?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  animated?: boolean;
}

interface SpiderWebCanvasProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, type: EntityType) => void;
  searchQuery?: string;
}

export const SpiderWebCanvas: React.FC<SpiderWebCanvasProps> = ({
  selectedNodeId,
  onSelectNode,
  searchQuery = ''
}) => {
  const { teams, projects, users, tasks, goals, tags, eodEntries, updateTask, updateProject, isDarkMode } = useApp();

  // Canvas viewport camera state
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 450, y: 350 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Active Tool Mode: 'select' | 'connector'
  const [activeTool, setActiveTool] = useState<'select' | 'connector'>('select');
  const [showWebGrid, setShowWebGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Toggle Option: 'avatar' | 'card' Profile View for People
  const [displayMode, setDisplayMode] = useState<'avatar' | 'card'>('card');

  // Custom persistent node positions
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('pulse_spider_web_node_positions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const savePositions = (positions: Record<string, { x: number; y: number }>) => {
    setCustomPositions(positions);
    try {
      localStorage.setItem('pulse_spider_web_node_positions', JSON.stringify(positions));
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

  // Visibility filters
  const [visibility] = useState<Record<EntityType, boolean>>({
    team: true,
    project: true,
    person: true,
    task: true,
    goal: true,
    tag: false
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate concentric spider web nodes & edges
  const { initialNodes, initialEdges, webRings } = useMemo(() => {
    const nodesMap: Map<string, GraphNode> = new Map();
    const edgesList: GraphEdge[] = [];

    // Spider Web Concentric Layer Radii
    const RING_TEAMS = 190;    // Ring 1: Teams
    const RING_PROJ = 360;     // Ring 2: Projects
    const RING_PEOPLE = 530;   // Ring 3: People (Contextual Instances)
    const RING_TASKS = 700;    // Ring 4: Tasks
    const RING_GOALS = 860;    // Ring 5: Goals / OKRs

    // Ring 0: Central Org Core
    nodesMap.set('core-org', {
      id: 'core-org',
      entityId: 'org-acme',
      type: 'team',
      label: 'Pulse Org Core',
      sublabel: 'Acme Central Hub',
      x: customPositions['core-org']?.x ?? 0,
      y: customPositions['core-org']?.y ?? 0,
      vx: 0, vy: 0,
      radius: 42,
      level: 0
    });

    // Ring 1: Teams
    const teamAngles: Record<string, number> = {};
    teams.forEach((t: Team, index: number) => {
      const angle = (index / Math.max(1, teams.length)) * Math.PI * 2 - Math.PI / 2;
      teamAngles[t.id] = angle;
      const nodeId = `team-${t.id}`;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: t.id,
        type: 'team',
        label: t.name,
        sublabel: `Lead: ${t.leadName}`,
        x: savedPos ? savedPos.x : Math.cos(angle) * RING_TEAMS,
        y: savedPos ? savedPos.y : Math.sin(angle) * RING_TEAMS,
        vx: 0, vy: 0,
        radius: 36,
        level: 1
      });

      edgesList.push({
        id: `edge-core-${nodeId}`,
        source: 'core-org',
        target: nodeId,
        relation: 'has_team'
      });
    });

    // Ring 2: Projects
    projects.forEach((p: Project, pIndex: number) => {
      const linkedTeamIds = p.teamIds !== undefined ? p.teamIds : (p.teamId ? [p.teamId] : []);
      const primaryTeamId = linkedTeamIds[0] || teams[0]?.id || 'team-eng';
      const baseAngle = teamAngles[primaryTeamId] ?? 0;

      const sectorSpread = 0.5;
      const offset = ((pIndex % 3) - 1) * (sectorSpread / 2);
      const angle = baseAngle + offset;
      const nodeId = `proj-${p.id}`;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: p.id,
        type: 'project',
        label: p.name,
        sublabel: p.status,
        status: p.status,
        x: savedPos ? savedPos.x : Math.cos(angle) * RING_PROJ,
        y: savedPos ? savedPos.y : Math.sin(angle) * RING_PROJ,
        vx: 0, vy: 0,
        radius: 32,
        level: 2
      });

      linkedTeamIds.forEach(tId => {
        const teamNode = nodesMap.get(`team-${tId}`);
        if (teamNode) {
          edgesList.push({
            id: `edge-${teamNode.id}-${nodeId}`,
            source: teamNode.id,
            target: nodeId,
            relation: 'has_project'
          });
        }
      });
    });

    // Ring 3: People / Members (Contextual Multi-Occurrence Instances!)
    users.forEach((u: UserType, uIndex: number) => {
      const userProjects = projects.filter(p => p.memberIds.includes(u.id));
      const userEod = eodEntries.find(e => e.userId === u.id);
      let eodStatus: 'good' | 'low' | 'blocked' | 'neutral' = 'neutral';
      if (userEod) {
        if (userEod.flaggedToManager || userEod.blockedTaskId) eodStatus = 'blocked';
        else if (userEod.energyIndex <= 2) eodStatus = 'low';
        else eodStatus = 'good';
      }

      if (userProjects.length === 0) {
        const baseAngle = teamAngles[u.teamId] ?? 0;
        const angle = baseAngle + ((uIndex % 4) - 1.5) * 0.16;
        const nodeId = `usr-${u.id}-team-${u.teamId}`;
        const savedPos = customPositions[nodeId];

        nodesMap.set(nodeId, {
          id: nodeId,
          entityId: u.id,
          type: 'person',
          label: u.name,
          sublabel: u.title,
          avatarUrl: u.avatarUrl,
          eodStatus,
          x: savedPos ? savedPos.x : Math.cos(angle) * RING_PEOPLE,
          y: savedPos ? savedPos.y : Math.sin(angle) * RING_PEOPLE,
          vx: 0, vy: 0,
          radius: 26,
          level: 3
        });

        const teamNode = nodesMap.get(`team-${u.teamId}`);
        if (teamNode) {
          edgesList.push({
            id: `edge-${teamNode.id}-${nodeId}`,
            source: teamNode.id,
            target: nodeId,
            relation: 'team_member'
          });
        }
      } else {
        // Create a contextual instance under EACH project the member is contributing to!
        userProjects.forEach((proj, idx) => {
          const projNode = nodesMap.get(`proj-${proj.id}`);
          const primaryTeamId = proj.teamId;
          const baseAngle = projNode ? Math.atan2(projNode.y, projNode.x) : (teamAngles[primaryTeamId] ?? 0);
          const angle = baseAngle + (idx - (userProjects.length - 1) / 2) * 0.18;
          const nodeId = `usr-${u.id}-proj-${proj.id}`;
          const savedPos = customPositions[nodeId];

          nodesMap.set(nodeId, {
            id: nodeId,
            entityId: u.id,
            type: 'person',
            label: u.name,
            sublabel: u.title,
            avatarUrl: u.avatarUrl,
            eodStatus,
            x: savedPos ? savedPos.x : Math.cos(angle) * RING_PEOPLE,
            y: savedPos ? savedPos.y : Math.sin(angle) * RING_PEOPLE,
            vx: 0, vy: 0,
            radius: 26,
            level: 3
          });

          if (projNode) {
            edgesList.push({
              id: `edge-${projNode.id}-${nodeId}`,
              source: projNode.id,
              target: nodeId,
              relation: 'assigned_project'
            });
          }
        });
      }
    });

    // Ring 4: Tasks
    tasks.forEach((tsk: Task, tIndex: number) => {
      const projNode = nodesMap.get(`proj-${tsk.projectId}`);
      const baseAngle = projNode ? Math.atan2(projNode.y, projNode.x) : (tIndex / tasks.length) * Math.PI * 2;
      const angle = baseAngle + ((tIndex % 5) - 2) * 0.14;
      const nodeId = `task-${tsk.id}`;
      const savedPos = customPositions[nodeId];
      const primaryTag = tags.find(tg => tsk.tagIds.includes(tg.id));

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: tsk.id,
        type: 'task',
        label: tsk.title,
        sublabel: `${tsk.priority} • ${tsk.status}`,
        status: tsk.status,
        color: primaryTag ? primaryTag.colorHex : '#8B5CF6',
        x: savedPos ? savedPos.x : Math.cos(angle) * RING_TASKS,
        y: savedPos ? savedPos.y : Math.sin(angle) * RING_TASKS,
        vx: 0, vy: 0,
        radius: 20,
        level: 4
      });

      if (projNode) {
        edgesList.push({
          id: `edge-${projNode.id}-${nodeId}`,
          source: projNode.id,
          target: nodeId,
          relation: 'has_task',
          animated: tsk.status === 'InProgress'
        });
      }

      // Connect task to assigned person node instance(s)
      tsk.assigneeIds.forEach(uId => {
        const matchingPersonNode = Array.from(nodesMap.values()).find(n => n.type === 'person' && n.entityId === uId && n.id.includes(tsk.projectId));
        const personNodeId = matchingPersonNode ? matchingPersonNode.id : Array.from(nodesMap.values()).find(n => n.type === 'person' && n.entityId === uId)?.id;

        if (personNodeId) {
          edgesList.push({
            id: `edge-${nodeId}-${personNodeId}`,
            source: nodeId,
            target: personNodeId,
            relation: 'assigned_to'
          });
        }
      });
    });

    // Ring 5: Goals / OKRs
    goals.forEach((g: Goal, gIndex: number) => {
      const angle = (gIndex / Math.max(1, goals.length)) * Math.PI * 2;
      const nodeId = `goal-${g.id}`;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: g.id,
        type: 'goal',
        label: g.title,
        sublabel: g.status,
        progress: 70,
        x: savedPos ? savedPos.x : Math.cos(angle) * RING_GOALS,
        y: savedPos ? savedPos.y : Math.sin(angle) * RING_GOALS,
        vx: 0, vy: 0,
        radius: 24,
        level: 5
      });
    });

    return {
      initialNodes: Array.from(nodesMap.values()),
      initialEdges: edgesList,
      webRings: [RING_TEAMS, RING_PROJ, RING_PEOPLE, RING_TASKS, RING_GOALS]
    };
  }, [teams, projects, users, tasks, goals, tags, eodEntries, customPositions]);

  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges.filter(e => !deletedEdgeIds.has(e.id)));
  }, [initialNodes, initialEdges, deletedEdgeIds]);

  // Determine selected node & multi-occurrence sibling nodes (highlight all instances of same person)
  const matchingMultiNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const selectedNode = nodes.find(n => n.id === selectedNodeId || n.entityId === selectedNodeId);
    if (!selectedNode) return new Set<string>();

    const set = new Set<string>();
    nodes.forEach(n => {
      if (n.entityId === selectedNode.entityId) {
        set.add(n.id);
      }
    });
    return set;
  }, [selectedNodeId, nodes]);

  // Connected node IDs for focus & dimming
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const set = new Set<string>(matchingMultiNodeIds);

    matchingMultiNodeIds.forEach(targetId => {
      edges.forEach(e => {
        if (e.source === targetId) set.add(e.target);
        if (e.target === targetId) set.add(e.source);
      });
    });

    return set;
  }, [selectedNodeId, matchingMultiNodeIds, edges]);

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
    const isSvgCanvas = targetEl.tagName === 'svg' || (targetEl.tagName === 'rect' && targetEl.getAttribute('id') === 'spider-bg');

    if (isSvgCanvas) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleConnectNodes = (sourceNode: GraphNode, targetNode: GraphNode) => {
    if (sourceNode.id === targetNode.id) return;

    let successMsg = '';

    // Task -> Task
    if (sourceNode.type === 'task' && targetNode.type === 'task') {
      const srcTask = tasks.find(t => t.id === sourceNode.entityId);
      if (srcTask && !srcTask.dependencyTaskIds.includes(targetNode.entityId)) {
        updateTask(sourceNode.entityId, { dependencyTaskIds: [...srcTask.dependencyTaskIds, targetNode.entityId] });
        successMsg = `Linked dependency: "${sourceNode.label}" depends on "${targetNode.label}"`;
      }
    }
    // Task -> Person
    else if (sourceNode.type === 'task' && targetNode.type === 'person') {
      updateTask(sourceNode.entityId, { assigneeIds: [targetNode.entityId] });
      successMsg = `Assigned task "${sourceNode.label}" to ${targetNode.label}`;
    }
    else if (sourceNode.type === 'person' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { assigneeIds: [sourceNode.entityId] });
      successMsg = `Assigned task "${targetNode.label}" to ${sourceNode.label}`;
    }
    // Task -> Project
    else if (sourceNode.type === 'task' && targetNode.type === 'project') {
      updateTask(sourceNode.entityId, { projectId: targetNode.entityId });
      successMsg = `Moved task "${sourceNode.label}" to project "${targetNode.label}"`;
    }
    else if (sourceNode.type === 'project' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { projectId: sourceNode.entityId });
      successMsg = `Moved task "${targetNode.label}" to project "${sourceNode.label}"`;
    }
    // Project -> Team
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

  const strokeLinkColor = isDarkMode ? '#334155' : '#CBD5E1';
  const strokeLinkActiveColor = isDarkMode ? '#60A5FA' : '#2563EB';

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none font-sans transition-colors duration-300 ${
        isDarkMode ? 'bg-neutral-950 text-white' : 'bg-[#F8FAFC] text-neutral-900'
      }`}
    >
      {/* Spider Web Layer Badge */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-xl flex items-center gap-2">
          <span className="text-base">🕸️</span>
          <div>
            <h2 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">Spider Web Topology</h2>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">Version 3 • Concentric Layers</p>
          </div>
        </div>
      </div>

      {/* Floating Control Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-2xl flex items-center gap-2 font-mono text-xs">
        {/* Tool Modes */}
        <button
          onClick={() => { setActiveTool('select'); setConnectingSourceId(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
            activeTool === 'select'
              ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Move Tool (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Move</span>
        </button>

        <button
          onClick={() => setActiveTool('connector')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
            activeTool === 'connector'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Connector Tool (C)"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Connect</span>
        </button>

        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 my-auto" />

        {/* Display Toggle: Avatar Photo vs Profile Card View */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setDisplayMode('avatar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              displayMode === 'avatar' 
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
            title="Show Circular Avatar Initials"
          >
            <UserIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>Initials</span>
          </button>
          <button
            onClick={() => setDisplayMode('card')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              displayMode === 'card' 
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
            title="Show Full Profile Card (Name + Role + Energy)"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cards</span>
          </button>
        </div>

        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 my-auto" />

        {/* Spider Web Grid Toggle */}
        <button
          onClick={() => setShowWebGrid(prev => !prev)}
          className={`p-2 rounded-xl transition-all ${
            showWebGrid ? 'text-amber-500 bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
          title="Toggle Concentric Web Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Snap to Grid */}
        <button
          onClick={() => setSnapToGrid(prev => !prev)}
          className={`p-2 rounded-xl transition-all ${
            snapToGrid ? 'text-blue-500 bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
          title="Snap to Grid"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 my-auto" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setZoom(z => z * 1.15)}
            className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] w-10 text-center font-bold text-neutral-900 dark:text-white">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => z * 0.85)}
            className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
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

      {/* Main SVG Spider Web Canvas */}
      <svg className="w-full h-full relative z-10 pointer-events-auto">
        <rect id="spider-bg" width="100%" height="100%" fill="transparent" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <defs>
            <marker id="spider-arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#475569' : '#94A3B8'} />
            </marker>
            <marker id="spider-arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#60A5FA' : '#2563EB'} />
            </marker>
          </defs>

          {/* 1. Spider Web Concentric Geometry Background */}
          {showWebGrid && (
            <g opacity={isDarkMode ? 0.25 : 0.65}>
              {/* Concentric Web Rings */}
              {webRings.map((r) => (
                <circle
                  key={`web-ring-${r}`}
                  cx="0"
                  cy="0"
                  r={r}
                  fill="none"
                  stroke={isDarkMode ? '#475569' : '#64748B'}
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              ))}

              {/* Radial Web Spokes */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const outerR = 900;
                return (
                  <line
                    key={`spoke-${i}`}
                    x1="0"
                    y1="0"
                    x2={Math.cos(angle) * outerR}
                    y2={Math.sin(angle) * outerR}
                    stroke={isDarkMode ? '#334155' : '#94A3B8'}
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* 2. Link Edges */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;
            if (!visibility[sourceNode.type] || !visibility[targetNode.type]) return null;

            const isEdgeHovered = hoveredEdgeId === edge.id;
            const isEdgeSelected = selectedEdgeId === edge.id;
            const isHighlighted = connectedNodeIds
              ? connectedNodeIds.has(sourceNode.id) && connectedNodeIds.has(targetNode.id)
              : true;

            const opacity = connectedNodeIds ? (isHighlighted ? 1 : 0.12) : 0.75;

            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const cx = (sourceNode.x + targetNode.x) / 2 + dy * 0.12;
            const cy = (sourceNode.y + targetNode.y) / 2 - dx * 0.12;

            const pathD = `M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`;

            return (
              <g 
                key={edge.id} 
                opacity={opacity} 
                className="transition-opacity duration-300 group/edge cursor-pointer"
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(prev => prev === edge.id ? null : prev)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(edge.id);
                }}
              >
                {/* Thick Invisible Hit Area */}
                <path d={pathD} stroke="transparent" strokeWidth="16" fill="none" />

                {/* Visible Path */}
                <path
                  d={pathD}
                  stroke={isEdgeHovered || isEdgeSelected ? '#EF4444' : (isHighlighted ? strokeLinkActiveColor : strokeLinkColor)}
                  strokeWidth={isEdgeHovered || isEdgeSelected ? 3.5 : (isHighlighted ? 2 : 1.2)}
                  strokeDasharray={edge.relation === 'depends_on' ? '4 4' : undefined}
                  fill="none"
                  markerEnd={isEdgeHovered || isEdgeSelected ? undefined : (isHighlighted ? 'url(#spider-arrow-active)' : 'url(#spider-arrow)')}
                />

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
                    <text textAnchor="middle" dy="4" fill="#FFFFFF" fontSize="11" fontWeight="bold" pointerEvents="none">✕</text>
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

          {/* 3. Concentric Spider Web Nodes */}
          {nodes.map(node => {
            if (!visibility[node.type]) return null;

            const isSelected = selectedNodeId === node.id || selectedNodeId === node.entityId;
            const isMultiMatch = matchingMultiNodeIds.has(node.id);
            const isSearched = searchQuery ? node.label.toLowerCase().includes(searchQuery.toLowerCase()) : false;
            const isDimmed = connectedNodeIds ? !connectedNodeIds.has(node.id) : false;
            const opacity = isDimmed ? 0.15 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={e => handleNodeMouseDown(node, e)}
                opacity={opacity}
                className="cursor-grab active:cursor-grabbing group transition-opacity duration-300"
              >
                {/* Search Match Highlight */}
                {isSearched && (
                  <circle
                    r={node.radius + 16}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="3"
                    className="animate-ping"
                  />
                )}
                {/* Multi-Occurrence Glowing Ring for same Person across Web */}
                {isMultiMatch && (
                  <circle
                    r={node.radius + 12}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="animate-spin-slow"
                  />
                )}

                {/* Selection Highlight */}
                {isSelected && (
                  <circle
                    r={node.radius + 8}
                    fill="none"
                    stroke={isDarkMode ? '#FFFFFF' : '#000000'}
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />
                )}

                {/* Center Core Node */}
                {node.level === 0 && (
                  <g>
                    <circle r={node.radius} fill={isDarkMode ? '#1E1B4B' : '#EEF2FF'} stroke="#6366F1" strokeWidth="3" className="drop-shadow-xl" />
                    <text textAnchor="middle" dy="-3" fill={isDarkMode ? '#FFFFFF' : '#1E1B4B'} fontSize="11" fontWeight="bold" fontFamily="monospace">ACME</text>
                    <text textAnchor="middle" dy="10" fill={isDarkMode ? '#A5B4FC' : '#4F46E5'} fontSize="8" fontWeight="bold" fontFamily="monospace">CORE</text>
                    <text textAnchor="middle" dy={node.radius + 18} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="11" fontWeight="bold">Acme Organization</text>
                  </g>
                )}

                {/* Team Nodes */}
                {node.type === 'team' && node.level > 0 && (
                  <g>
                    <polygon points="-32,-18 0,-34 32,-18 32,18 0,34 -32,18" fill={isDarkMode ? '#18181B' : '#FFFFFF'} stroke="#F59E0B" strokeWidth="2.5" />
                    <text textAnchor="middle" dy="-2" fill={isDarkMode ? '#FFFFFF' : '#18181B'} fontSize="9" fontWeight="bold" fontFamily="monospace">TEAM</text>
                    <text textAnchor="middle" dy="10" fill="#D97706" fontSize="7.5" fontWeight="bold" fontFamily="monospace">{node.entityId.replace('team-', '').substring(0, 4).toUpperCase()}</text>
                    <text textAnchor="middle" dy={node.radius + 20} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="11" fontWeight="bold">{node.label}</text>
                  </g>
                )}

                {/* Project Nodes */}
                {node.type === 'project' && (
                  <g>
                    <circle r={node.radius} fill={isDarkMode ? '#09090B' : '#FFFFFF'} stroke="#3B82F6" strokeWidth="2.5" />
                    <text textAnchor="middle" dy="-2" fill={isDarkMode ? '#FFFFFF' : '#18181B'} fontSize="9" fontWeight="bold" fontFamily="monospace">PRJ</text>
                    <text textAnchor="middle" dy="10" fill="#2563EB" fontSize="7.5" fontFamily="monospace">{node.status}</text>
                    <text textAnchor="middle" dy={node.radius + 18} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="11" fontWeight="bold">{node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}</text>
                  </g>
                )}

                {/* Person Nodes: Toggle Option Avatar Initials vs Full Profile Card View */}
                {node.type === 'person' && (
                  displayMode === 'avatar' ? (
                    /* Initials Mode */
                    <g>
                      <circle
                        r={node.radius}
                        fill={isDarkMode ? '#18181B' : '#FFFFFF'}
                        stroke={node.eodStatus === 'blocked' ? '#EF4444' : node.eodStatus === 'low' ? '#F59E0B' : '#10B981'}
                        strokeWidth="2.5"
                      />
                      <text textAnchor="middle" dy="4" fill={isDarkMode ? '#FFFFFF' : '#18181B'} fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {node.label.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </text>
                      <text textAnchor="middle" dy={node.radius + 16} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="10.5" fontWeight="bold">{node.label}</text>
                    </g>
                  ) : (
                    /* Full Profile Card View */
                    <g transform="translate(-60, -26)">
                      <rect
                        width="120"
                        height="52"
                        rx="12"
                        fill={isDarkMode ? '#18181B' : '#FFFFFF'}
                        stroke={node.eodStatus === 'blocked' ? '#EF4444' : node.eodStatus === 'low' ? '#F59E0B' : '#3B82F6'}
                        strokeWidth="2"
                        className="drop-shadow-xl"
                      />
                      {/* Avatar Initials Circle inside card */}
                      <circle cx="20" cy="26" r="13" fill={isDarkMode ? '#27272A' : '#F4F4F5'} />
                      <text x="20" y="30" textAnchor="middle" fill={isDarkMode ? '#FFFFFF' : '#18181B'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {node.label.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </text>
                      {/* Name & Title */}
                      <text x="40" y="22" fill={isDarkMode ? '#FFFFFF' : '#18181B'} fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                        {node.label.length > 13 ? `${node.label.substring(0, 11)}..` : node.label}
                      </text>
                      <text x="40" y="34" fill={isDarkMode ? '#A1A1AA' : '#71717A'} fontSize="7.5" fontFamily="sans-serif">
                        {node.sublabel ? (node.sublabel.length > 15 ? `${node.sublabel.substring(0, 13)}..` : node.sublabel) : 'Specialist'}
                      </text>
                      {/* Status indicator pill */}
                      <circle cx="106" cy="14" r="4" fill={node.eodStatus === 'blocked' ? '#EF4444' : node.eodStatus === 'low' ? '#F59E0B' : '#10B981'} />
                    </g>
                  )
                )}

                {/* Task Nodes */}
                {node.type === 'task' && (
                  <g>
                    <rect x="-18" y="-18" width="36" height="36" rx="8" fill={isDarkMode ? '#18181B' : '#FFFFFF'} stroke={node.color || '#8B5CF6'} strokeWidth="2" />
                    <text textAnchor="middle" dy="4" fill={isDarkMode ? '#FFFFFF' : '#18181B'} fontSize="9" fontWeight="bold" fontFamily="monospace">TASK</text>
                    <text textAnchor="middle" dy={node.radius + 16} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="10.5" fontWeight="bold">{node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}</text>
                  </g>
                )}

                {/* Goal Nodes */}
                {node.type === 'goal' && (
                  <g>
                    <rect x="-20" y="-20" width="40" height="40" rx="6" transform="rotate(45)" fill={isDarkMode ? '#311B92' : '#EEF2FF'} stroke="#EC4899" strokeWidth="2" />
                    <text textAnchor="middle" dy="3" fill={isDarkMode ? '#FFFFFF' : '#311B92'} fontSize="9" fontWeight="bold">OKR</text>
                    <text textAnchor="middle" dy={node.radius + 20} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="10.5" fontWeight="bold">{node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}</text>
                  </g>
                )}

                {/* Connector Handle Port */}
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
                  <text textAnchor="middle" dy="3.5" fill="#FFFFFF" fontSize="10" fontWeight="bold">🔗</text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
