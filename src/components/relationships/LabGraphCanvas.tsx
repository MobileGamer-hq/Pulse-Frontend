import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ZoomIn, ZoomOut, RotateCcw, Play, Pause, 
  Zap, Link2, Check, MousePointer, Plus, Grid,
  RefreshCw, Folder, CheckCircle2, Target
} from 'lucide-react';
import type { EntityType, Team, Project, User as UserType, Task, Goal, Tag } from '../../types';

export interface GraphNode {
  id: string; // e.g. 'team-team-eng' or 'proj-proj-1' or 'usr-user-1' or 'task-task-101'
  entityId: string;
  type: EntityType;
  label: string;
  sublabel?: string;
  avatarUrl?: string;
  color?: string;
  status?: string;
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

interface LabGraphCanvasProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, type: EntityType) => void;
  searchQuery?: string;
}

export const LabGraphCanvas: React.FC<LabGraphCanvasProps> = ({
  selectedNodeId,
  onSelectNode,
  searchQuery = ''
}) => {
  const { teams, projects, users, tasks, goals, tags, eodEntries, updateTask, updateProject, isDarkMode, addTask, addProject, addGoal } = useApp();

  // Canvas viewport camera state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Active Tool Mode: 'select' | 'connector'
  const [activeTool, setActiveTool] = useState<'select' | 'connector'>('select');

  // Physics & Animation toggle
  const [isPhysicsRunning, setIsPhysicsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Custom persistent node positions (overrides force simulation when dragged)
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('pulse_lab_node_positions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save node positions on update
  const savePositions = (positions: Record<string, { x: number; y: number }>) => {
    setCustomPositions(positions);
    try {
      localStorage.setItem('pulse_lab_node_positions', JSON.stringify(positions));
    } catch {}
  };

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoverDropTargetId, setHoverDropTargetId] = useState<string | null>(null);

  // Connector & Edge Selection State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Visibility filters
  const [visibility, setVisibility] = useState<Record<EntityType, boolean>>({
    team: true,
    project: true,
    person: true,
    task: true,
    goal: true,
    tag: false
  });

  // Entity Creation Modal Trigger inside canvas
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particleOffsetRef = useRef(0);
  const [particleTick, setParticleTick] = useState(0);

  // Generate initial nodes and edges based on Pulse data (Auto-arrangement out of the box)
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesMap: Map<string, GraphNode> = new Map();
    const edgesList: GraphEdge[] = [];

    // Level 0: Teams
    teams.forEach((t: Team, index: number) => {
      const angle = (index / Math.max(1, teams.length)) * Math.PI * 2;
      const radius = 260;
      const nodeId = `team-${t.id}`;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: t.id,
        type: 'team',
        label: t.name,
        sublabel: `Lead: ${t.leadName}`,
        x: savedPos ? savedPos.x : Math.cos(angle) * radius,
        y: savedPos ? savedPos.y : Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 36,
        level: 0
      });
    });

    // Level 1: Projects
    projects.forEach((p: Project, index: number) => {
      const linkedTeamIds = p.teamIds && p.teamIds.length > 0 ? p.teamIds : [p.teamId];
      const parentTeamNode = nodesMap.get(`team-${linkedTeamIds[0]}`);
      const parentX = parentTeamNode ? parentTeamNode.x : 0;
      const parentY = parentTeamNode ? parentTeamNode.y : 0;
      
      const angle = (index / Math.max(1, projects.length)) * Math.PI * 2 + 0.5;
      const dist = 180;
      const nodeId = `proj-${p.id}`;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: p.id,
        type: 'project',
        label: p.name,
        sublabel: p.status,
        status: p.status,
        x: savedPos ? savedPos.x : parentX + Math.cos(angle) * dist,
        y: savedPos ? savedPos.y : parentY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 32,
        level: 1
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

    // Level 2: Users / People
    users.forEach((u: UserType, index: number) => {
      const nodeId = `usr-${u.id}`;
      const parentTeamNode = nodesMap.get(`team-${u.teamId}`);
      const baseX = parentTeamNode ? parentTeamNode.x : 0;
      const baseY = parentTeamNode ? parentTeamNode.y : 0;

      const angle = (index / Math.max(1, users.length)) * Math.PI * 2 + 1.2;
      const dist = 220;
      const savedPos = customPositions[nodeId];

      const userEod = eodEntries.find(e => e.userId === u.id);
      let eodStatus: 'good' | 'low' | 'blocked' | 'neutral' = 'neutral';
      if (userEod) {
        if (userEod.flaggedToManager || userEod.blockedTaskId) eodStatus = 'blocked';
        else if (userEod.energyIndex <= 2) eodStatus = 'low';
        else eodStatus = 'good';
      }

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: u.id,
        type: 'person',
        label: u.name,
        sublabel: u.title,
        avatarUrl: u.avatarUrl,
        eodStatus,
        x: savedPos ? savedPos.x : baseX + Math.cos(angle) * dist,
        y: savedPos ? savedPos.y : baseY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 24,
        level: 2
      });

      if (parentTeamNode) {
        edgesList.push({
          id: `edge-${parentTeamNode.id}-${nodeId}`,
          source: parentTeamNode.id,
          target: nodeId,
          relation: 'team_member'
        });
      }

      u.activeProjectIds.forEach(pId => {
        const projNodeId = `proj-${pId}`;
        if (nodesMap.has(projNodeId)) {
          edgesList.push({
            id: `edge-${projNodeId}-${nodeId}`,
            source: projNodeId,
            target: nodeId,
            relation: 'assigned_project'
          });
        }
      });
    });

    // Level 3: Tasks
    tasks.forEach((tsk: Task, index: number) => {
      const nodeId = `task-${tsk.id}`;
      const parentProjNode = nodesMap.get(`proj-${tsk.projectId}`);
      const baseX = parentProjNode ? parentProjNode.x : (index * 40 - 200);
      const baseY = parentProjNode ? parentProjNode.y : (index * 40 - 200);

      const angle = (index / Math.max(1, tasks.length)) * Math.PI * 2 + 2.1;
      const dist = 140 + (index % 3) * 30;
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
        x: savedPos ? savedPos.x : baseX + Math.cos(angle) * dist,
        y: savedPos ? savedPos.y : baseY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 20,
        level: 3
      });

      if (parentProjNode) {
        edgesList.push({
          id: `edge-${parentProjNode.id}-${nodeId}`,
          source: parentProjNode.id,
          target: nodeId,
          relation: 'has_task',
          animated: tsk.status === 'InProgress'
        });
      }

      tsk.assigneeIds.forEach(uId => {
        const userNodeId = `usr-${uId}`;
        if (nodesMap.has(userNodeId)) {
          edgesList.push({
            id: `edge-${nodeId}-${userNodeId}`,
            source: nodeId,
            target: userNodeId,
            relation: 'assigned_to'
          });
        }
      });

      tsk.dependencyTaskIds.forEach(depId => {
        const depNodeId = `task-${depId}`;
        edgesList.push({
          id: `edge-dep-${depNodeId}-${nodeId}`,
          source: depNodeId,
          target: nodeId,
          relation: 'depends_on',
          animated: true
        });
      });
    });

    // Level 4: Goals / OKRs
    goals.forEach((g: Goal, index: number) => {
      const nodeId = `goal-${g.id}`;
      const angle = (index / Math.max(1, goals.length)) * Math.PI * 2 + 3.8;
      const dist = 380;
      const savedPos = customPositions[nodeId];

      let totalKR = 0;
      let currKR = 0;
      g.keyResults.forEach(kr => {
        totalKR += kr.targetValue;
        currKR += kr.currentValue;
      });
      const progress = totalKR > 0 ? Math.round((currKR / totalKR) * 100) : 50;

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: g.id,
        type: 'goal',
        label: g.title,
        sublabel: `OKR • ${progress}%`,
        progress,
        status: g.status,
        x: savedPos ? savedPos.x : Math.cos(angle) * dist,
        y: savedPos ? savedPos.y : Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 26,
        level: 4
      });

      g.linkedTaskIds.forEach(tId => {
        const taskNodeId = `task-${tId}`;
        if (nodesMap.has(taskNodeId)) {
          edgesList.push({
            id: `edge-${taskNodeId}-${nodeId}`,
            source: taskNodeId,
            target: nodeId,
            relation: 'aligned_to',
            animated: true
          });
        }
      });
    });

    // Tags
    tags.forEach((tg: Tag, index: number) => {
      const nodeId = `tag-${tg.id}`;
      const angle = (index / Math.max(1, tags.length)) * Math.PI * 2;
      const dist = 480;
      const savedPos = customPositions[nodeId];

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: tg.id,
        type: 'tag',
        label: tg.name,
        color: tg.colorHex,
        x: savedPos ? savedPos.x : Math.cos(angle) * dist,
        y: savedPos ? savedPos.y : Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 18,
        level: 5
      });
    });

    return {
      initialNodes: Array.from(nodesMap.values()),
      initialEdges: edgesList
    };
  }, [teams, projects, users, tasks, goals, tags, eodEntries, customPositions]);

  const [deletedEdgeIds, setDeletedEdgeIds] = useState<Set<string>>(() => new Set());
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges.filter(e => !deletedEdgeIds.has(e.id)));
  }, [initialNodes, initialEdges, deletedEdgeIds]);

  // Determine connected node IDs for focus & dimming
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const set = new Set<string>();

    let targetNodeId = selectedNodeId;
    const foundNode = nodes.find(n => n.id === selectedNodeId || n.entityId === selectedNodeId);
    if (foundNode) targetNodeId = foundNode.id;

    set.add(targetNodeId);

    edges.forEach(e => {
      if (e.source === targetNodeId) set.add(e.target);
      if (e.target === targetNodeId) set.add(e.source);
    });

    return set;
  }, [selectedNodeId, nodes, edges]);

  // Physics animation tick loop
  useEffect(() => {
    if (!isPhysicsRunning) return;

    let running = true;

    const tickPhysics = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n }));
        const nodesLength = newNodes.length;

        for (let i = 0; i < nodesLength; i++) {
          for (let j = i + 1; j < nodesLength; j++) {
            const n1 = newNodes[i];
            const n2 = newNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy + 100;
            const dist = Math.sqrt(distSq);

            const force = (400 * 15) / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (!customPositions[n1.id]) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (!customPositions[n2.id]) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const desiredDist = 160;
            const force = (dist - desiredDist) * 0.02;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (!customPositions[source.id]) {
              source.vx += fx;
              source.vy += fy;
            }
            if (!customPositions[target.id]) {
              target.vx -= fx;
              target.vy -= fy;
            }
          }
        });

        return newNodes.map(n => {
          if (customPositions[n.id]) return n;
          n.vx *= 0.82;
          n.vy *= 0.82;
          return {
            ...n,
            x: n.x + n.vx,
            y: n.y + n.vy
          };
        });
      });

      particleOffsetRef.current = (particleOffsetRef.current + 1.2) % 100;
      setParticleTick(particleOffsetRef.current);

      if (running) {
        animationFrameRef.current = requestAnimationFrame(tickPhysics);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tickPhysics);

    return () => {
      running = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPhysicsRunning, edges, customPositions]);

  // Screen mouse/canvas coordinate conversion helper
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Mouse pan & node drag event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (connectingSourceId) return;

    const targetEl = e.target as HTMLElement;
    const isSvgCanvas = targetEl.tagName === 'svg' || targetEl.tagName === 'rect' && targetEl.getAttribute('id') === 'canvas-bg';

    if (isSvgCanvas) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Connect two nodes together functionally & visually
  const handleConnectNodes = (sourceNode: GraphNode, targetNode: GraphNode) => {
    if (sourceNode.id === targetNode.id) return;

    let successMsg = '';

    // Task -> Task (Dependency)
    if (sourceNode.type === 'task' && targetNode.type === 'task') {
      const srcTask = tasks.find(t => t.id === sourceNode.entityId);
      if (srcTask && !srcTask.dependencyTaskIds.includes(targetNode.entityId)) {
        updateTask(sourceNode.entityId, {
          dependencyTaskIds: [...srcTask.dependencyTaskIds, targetNode.entityId]
        });
        successMsg = `Linked dependency: "${sourceNode.label}" depends on "${targetNode.label}"`;
      }
    }
    // Task -> Person (Assignee)
    else if (sourceNode.type === 'task' && targetNode.type === 'person') {
      updateTask(sourceNode.entityId, { assigneeIds: [targetNode.entityId] });
      successMsg = `Assigned task "${sourceNode.label}" to ${targetNode.label}`;
    }
    else if (sourceNode.type === 'person' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { assigneeIds: [sourceNode.entityId] });
      successMsg = `Assigned task "${targetNode.label}" to ${sourceNode.label}`;
    }
    // Task -> Project (Project Assignment)
    else if (sourceNode.type === 'task' && targetNode.type === 'project') {
      updateTask(sourceNode.entityId, { projectId: targetNode.entityId });
      successMsg = `Moved task "${sourceNode.label}" to project "${targetNode.label}"`;
    }
    else if (sourceNode.type === 'project' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { projectId: sourceNode.entityId });
      successMsg = `Moved task "${targetNode.label}" to project "${sourceNode.label}"`;
    }
    // Task -> Goal (OKR Alignment)
    else if (sourceNode.type === 'task' && targetNode.type === 'goal') {
      updateTask(sourceNode.entityId, { linkedGoalId: targetNode.entityId });
      successMsg = `Aligned task "${sourceNode.label}" to OKR "${targetNode.label}"`;
    }
    else if (sourceNode.type === 'goal' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { linkedGoalId: sourceNode.entityId });
      successMsg = `Aligned task "${targetNode.label}" to OKR "${sourceNode.label}"`;
    }
    // Project -> Team (Multi-Team Assignment)
    else if (sourceNode.type === 'project' && targetNode.type === 'team') {
      const proj = projects.find(p => p.id === sourceNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds && proj.teamIds.length > 0 ? proj.teamIds : [proj.teamId];
        if (!currentTeams.includes(targetNode.entityId)) {
          updateProject(sourceNode.entityId, { teamIds: [...currentTeams, targetNode.entityId], teamId: targetNode.entityId });
          successMsg = `Linked project "${sourceNode.label}" to Team "${targetNode.label}"`;
        }
      }
    }
    else if (sourceNode.type === 'team' && targetNode.type === 'project') {
      const proj = projects.find(p => p.id === targetNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds && proj.teamIds.length > 0 ? proj.teamIds : [proj.teamId];
        if (!currentTeams.includes(sourceNode.entityId)) {
          updateProject(targetNode.entityId, { teamIds: [...currentTeams, sourceNode.entityId], teamId: sourceNode.entityId });
          successMsg = `Linked project "${targetNode.label}" to Team "${sourceNode.label}"`;
        }
      }
    }
    // Project -> Goal (Goal Linking)
    else if (sourceNode.type === 'project' && targetNode.type === 'goal') {
      const proj = projects.find(p => p.id === sourceNode.entityId);
      if (proj && !proj.linkedGoalIds.includes(targetNode.entityId)) {
        updateProject(sourceNode.entityId, { linkedGoalIds: [...proj.linkedGoalIds, targetNode.entityId] });
        successMsg = `Linked project "${sourceNode.label}" to Goal "${targetNode.label}"`;
      }
    }
    else if (sourceNode.type === 'goal' && targetNode.type === 'project') {
      const proj = projects.find(p => p.id === targetNode.entityId);
      if (proj && !proj.linkedGoalIds.includes(sourceNode.entityId)) {
        updateProject(targetNode.entityId, { linkedGoalIds: [...proj.linkedGoalIds, sourceNode.entityId] });
        successMsg = `Linked project "${targetNode.label}" to Goal "${sourceNode.label}"`;
      }
    }

    if (successMsg) {
      setToastMessage(successMsg);
      setTimeout(() => setToastMessage(null), 3500);
    }

    // Add visual edge
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

  // Delete an existing edge connection and update underlying data model
  const handleDeleteEdge = (edge: GraphEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    let successMsg = `Unlinked connection between "${sourceNode.label}" and "${targetNode.label}"`;

    // Task -> Task (Dependency)
    if (sourceNode.type === 'task' && targetNode.type === 'task') {
      const srcTask = tasks.find(t => t.id === sourceNode.entityId);
      if (srcTask) {
        updateTask(sourceNode.entityId, {
          dependencyTaskIds: srcTask.dependencyTaskIds.filter(id => id !== targetNode.entityId)
        });
      }
    }
    // Task -> Person (Assignee)
    else if (sourceNode.type === 'task' && targetNode.type === 'person') {
      const srcTask = tasks.find(t => t.id === sourceNode.entityId);
      if (srcTask) {
        updateTask(sourceNode.entityId, {
          assigneeIds: srcTask.assigneeIds.filter(id => id !== targetNode.entityId)
        });
      }
    }
    else if (sourceNode.type === 'person' && targetNode.type === 'task') {
      const tgtTask = tasks.find(t => t.id === targetNode.entityId);
      if (tgtTask) {
        updateTask(targetNode.entityId, {
          assigneeIds: tgtTask.assigneeIds.filter(id => id !== sourceNode.entityId)
        });
      }
    }
    // Task -> Project (Move task out of project)
    else if (sourceNode.type === 'task' && targetNode.type === 'project') {
      updateTask(sourceNode.entityId, { projectId: 'unassigned' });
    }
    else if (sourceNode.type === 'project' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { projectId: 'unassigned' });
    }
    // Task -> Goal (OKR Alignment)
    else if (sourceNode.type === 'task' && targetNode.type === 'goal') {
      updateTask(sourceNode.entityId, { linkedGoalId: undefined });
    }
    else if (sourceNode.type === 'goal' && targetNode.type === 'task') {
      updateTask(targetNode.entityId, { linkedGoalId: undefined });
    }
    // Project -> Team (Multi-Team Unlink)
    else if (sourceNode.type === 'project' && targetNode.type === 'team') {
      const proj = projects.find(p => p.id === sourceNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds !== undefined ? proj.teamIds : (proj.teamId ? [proj.teamId] : []);
        const updatedTeams = currentTeams.filter(tId => tId !== targetNode.entityId);
        updateProject(sourceNode.entityId, { teamIds: updatedTeams, teamId: updatedTeams[0] || '' });
      }
    }
    else if (sourceNode.type === 'team' && targetNode.type === 'project') {
      const proj = projects.find(p => p.id === targetNode.entityId);
      if (proj) {
        const currentTeams = proj.teamIds !== undefined ? proj.teamIds : (proj.teamId ? [proj.teamId] : []);
        const updatedTeams = currentTeams.filter(tId => tId !== sourceNode.entityId);
        updateProject(targetNode.entityId, { teamIds: updatedTeams, teamId: updatedTeams[0] || '' });
      }
    }
    // Project -> Goal (Goal Unlink)
    else if (sourceNode.type === 'project' && targetNode.type === 'goal') {
      const proj = projects.find(p => p.id === sourceNode.entityId);
      if (proj) {
        updateProject(sourceNode.entityId, { linkedGoalIds: proj.linkedGoalIds.filter(gId => gId !== targetNode.entityId) });
      }
    }
    else if (sourceNode.type === 'goal' && targetNode.type === 'project') {
      const proj = projects.find(p => p.id === targetNode.entityId);
      if (proj) {
        updateProject(targetNode.entityId, { linkedGoalIds: proj.linkedGoalIds.filter(gId => gId !== sourceNode.entityId) });
      }
    }

    // Remove edge visually & record in deletedEdgeIds
    setDeletedEdgeIds(prev => new Set(prev).add(edge.id));
    setEdges(prev => prev.filter(e => e.id !== edge.id));
    setHoveredEdgeId(null);
    setSelectedEdgeId(null);

    setToastMessage(successMsg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard shortcut listener for Delete/Backspace key on selected edge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        const edgeToDelete = edges.find(edge => edge.id === selectedEdgeId);
        if (edgeToDelete) {
          handleDeleteEdge(edgeToDelete);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, edges]);

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
        newX = Math.round(newX / 16) * 16;
        newY = Math.round(newY / 16) * 16;
      }

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));

      // Proximity drop target detection for ANY node type!
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
      
      // If dropped onto another node, trigger structural linking!
      if (hoverDropTargetId && draggedNode) {
        const targetNode = nodes.find(n => n.id === hoverDropTargetId);
        if (targetNode) {
          handleConnectNodes(draggedNode, targetNode);
        }
      }

      // Save persistent custom node position
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

  // Node Drag Start on Node Shape
  const handleNodeMouseDown = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(node.entityId, node.type);

    // If connector mode or connecting handle active, complete link connection!
    if (connectingSourceId) {
      if (connectingSourceId !== node.id) {
        const sourceNode = nodes.find(n => n.id === connectingSourceId);
        if (sourceNode) {
          handleConnectNodes(sourceNode, node);
        }
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

  // HTML5 Drag and Drop from Folder Sidebar onto Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropFromSidebar = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/pulse-node');
    if (!dataStr) return;

    try {
      const payload = JSON.parse(dataStr);
      const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
      const nodeId = `${payload.type === 'person' ? 'usr' : payload.type === 'project' ? 'proj' : payload.type}-${payload.id}`;

      // Save dropped position and select node
      savePositions({
        ...customPositions,
        [nodeId]: { x: canvasCoords.x, y: canvasCoords.y }
      });
      onSelectNode(payload.id, payload.type);

      // Ensure entity visibility
      setVisibility(v => ({ ...v, [payload.type]: true }));

      setToastMessage(`Placed ${payload.type} "${payload.label}" on canvas`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {}
  };

  // Touch Pinch-to-Zoom & Pan Handlers
  const touchDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const delta = dist / touchDistRef.current;
      setZoom(z => Math.max(0.2, Math.min(3.0, z * delta)));
      touchDistRef.current = dist;
    } else if (e.touches.length === 1 && isPanning) {
      setPan({ x: e.touches[0].clientX - panStart.x, y: e.touches[0].clientY - panStart.y });
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
    setIsPanning(false);
  };

  // Attach native non-passive wheel listener to prevent browser/folder view zoom when zooming in on canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.ctrlKey || e.metaKey ? (e.deltaY < 0 ? 1.05 : 0.95) : (e.deltaY < 0 ? 1.08 : 0.92);
      setZoom(z => Math.max(0.2, Math.min(3.0, z * zoomFactor)));
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, []);

  const handleTidyLayout = () => {
    setCustomPositions({});
    try {
      localStorage.removeItem('pulse_lab_node_positions');
    } catch {}
    setIsPhysicsRunning(true);
    setToastMessage('Tidied up topology layout automatically!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Create Quick Entity from Canvas Tool Dock
  const handleQuickCreateEntity = (type: EntityType) => {
    // Resolve context from selected node
    const selectedNode = nodes.find(n => n.id === selectedNodeId || n.entityId === selectedNodeId);
    let targetTeamId = teams[0]?.id || 'team-eng';
    let targetProjectId = projects[0]?.id || 'proj-1';
    let targetProjectName = projects[0]?.name || 'Pulse Architecture';

    if (selectedNode) {
      if (selectedNode.type === 'team') {
        targetTeamId = selectedNode.entityId;
        const teamProj = projects.find(p => p.teamId === selectedNode.entityId);
        if (teamProj) {
          targetProjectId = teamProj.id;
          targetProjectName = teamProj.name;
        }
      } else if (selectedNode.type === 'project') {
        targetProjectId = selectedNode.entityId;
        const proj = projects.find(p => p.id === selectedNode.entityId);
        if (proj) {
          targetTeamId = proj.teamId;
          targetProjectName = proj.name;
        }
      }
    }

    if (type === 'task') {
      const newTitle = `New Canvas Task ${tasks.length + 1}`;
      addTask({
        orgId: 'org-acme',
        projectId: targetProjectId,
        projectName: targetProjectName,
        title: newTitle,
        description: 'Created directly from Lab Relationship Canvas.',
        status: 'Todo',
        priority: 'Medium',
        assigneeIds: [users[0]?.id || 'user-1'],
        estimatedHours: 10,
        actualHours: 0,
        dueDate: '2026-09-01',
        tagIds: [tags[0]?.id || 'tag-1'],
        dependencyTaskIds: [],
        subtasks: [],
        comments: []
      });
      setToastMessage(`Created task "${newTitle}" under ${targetProjectName}`);
    } else if (type === 'project') {
      const newProjTitle = `New Project ${projects.length + 1}`;
      const targetTeam = teams.find(t => t.id === targetTeamId);
      addProject({
        orgId: 'org-acme',
        name: newProjTitle,
        description: 'Created directly from Lab Relationship Canvas.',
        templateType: 'SoftwareSprint',
        teamId: targetTeamId,
        leadId: users[0]?.id || 'user-1',
        memberIds: [users[0]?.id || 'user-1'],
        tagIds: [tags[0]?.id || 'tag-1'],
        linkedGoalIds: [goals[0]?.id || 'goal-1'],
        startDate: '2026-08-15',
        targetEndDate: '2026-10-15',
        status: 'Active'
      });
      setToastMessage(`Created project "${newProjTitle}" under ${targetTeam ? targetTeam.name : 'Team'}`);
    } else if (type === 'goal') {
      const newGoalTitle = `New OKR Goal ${goals.length + 1}`;
      addGoal({
        orgId: 'org-acme',
        title: newGoalTitle,
        description: 'Created directly from Lab Relationship Canvas.',
        ownerType: 'org',
        ownerId: 'org-acme',
        ownerName: 'Acme Corp',
        targetDate: '2026-10-30',
        status: 'OnTrack',
        tagIds: [tags[0]?.id || 'tag-1'],
        linkedTaskIds: [],
        keyResults: [
          { id: `kr-${Date.now()}`, title: 'Complete canvas deliverables', targetValue: 100, currentValue: 25, unit: '%', linkedTaskIds: [] }
        ]
      });
      setToastMessage(`Created new goal "${newGoalTitle}"`);
    }
    setIsAddMenuOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const strokeLinkColor = isDarkMode ? '#6B7280' : '#A3A3A3';
  const strokeLinkActiveColor = isDarkMode ? '#FFFFFF' : '#171717';

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDropFromSidebar}
      className="relative flex-1 w-full h-full bg-[#F4F5F7] dark:bg-[#0A0A0A] text-neutral-900 dark:text-white overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans"
    >
      {/* Grid Pattern */}
      <div 
        id="canvas-bg"
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `radial-gradient(${isDarkMode ? '#ffffff' : '#9ca3af'} 1.2px, transparent 1.2px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Floating Figma Tool Dock (Bottom Center Toolbar) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-2xl backdrop-blur-xl pointer-events-auto font-mono text-xs text-neutral-800 dark:text-neutral-200">
        {/* Tool: Select Move */}
        <button
          onClick={() => setActiveTool('select')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTool === 'select'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
          title="Select & Move Tool (V)"
        >
          <MousePointer className="w-4 h-4" />
          <span>Move</span>
        </button>

        {/* Tool: Connector Arrow */}
        <button
          onClick={() => setActiveTool(activeTool === 'connector' ? 'select' : 'connector')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTool === 'connector'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
          title="Draw Relationship Line (C)"
        >
          <Link2 className="w-4 h-4" />
          <span>Connect</span>
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

        {/* Add Entity Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="px-3 py-1.5 rounded-xl font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entity</span>
          </button>

          {isAddMenuOpen && (
            <div className="absolute bottom-12 left-0 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 text-xs">
              <button
                onClick={() => handleQuickCreateEntity('task')}
                className="w-full px-3 py-1.5 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>New Task</span>
              </button>
              <button
                onClick={() => handleQuickCreateEntity('project')}
                className="w-full px-3 py-1.5 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 font-medium"
              >
                <Folder className="w-4 h-4 text-blue-500" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => handleQuickCreateEntity('goal')}
                className="w-full px-3 py-1.5 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 font-medium"
              >
                <Target className="w-4 h-4 text-rose-500" />
                <span>New Goal OKR</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

        {/* Snap Grid Toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-1.5 rounded-xl transition-all ${
            snapToGrid ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Toggle Grid Snapping"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Auto-Tidy Layout */}
        <button
          onClick={handleTidyLayout}
          className="p-1.5 rounded-xl text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          title="Auto-Tidy Graph Layout"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none font-mono">
        {/* Left: Entity Visibility Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-2xl shadow-lg backdrop-blur-md pointer-events-auto">
          {(['team', 'project', 'person', 'task', 'goal', 'tag'] as EntityType[]).map(type => {
            const isVisible = visibility[type];
            return (
              <button
                key={type}
                onClick={() => setVisibility(v => ({ ...v, [type]: !v[type] }))}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all flex items-center gap-1.5 ${
                  isVisible
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white bg-neutral-100 dark:bg-neutral-800/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  type === 'team' ? 'bg-amber-500' :
                  type === 'project' ? 'bg-blue-500' :
                  type === 'person' ? 'bg-emerald-500' :
                  type === 'task' ? 'bg-purple-500' :
                  type === 'goal' ? 'bg-rose-500' : 'bg-neutral-400'
                }`} />
                {type}s
              </button>
            );
          })}
        </div>

        {/* Right: Physics & Zoom Controls */}
        <div className="flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-2xl shadow-lg backdrop-blur-md pointer-events-auto text-xs">
          <button
            onClick={() => setIsPhysicsRunning(!isPhysicsRunning)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              isPhysicsRunning 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
            }`}
          >
            {isPhysicsRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Physics</span>
          </button>

          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              showParticles 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' 
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Energy</span>
          </button>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          <button
            onClick={() => { setZoom(0.85); setPan({ x: 380, y: 260 }); }}
            className="p-1.5 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Recenter Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => z * 1.15)}
            className="p-1.5 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => z * 0.85)}
            className="p-1.5 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Toast Feedback Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce font-mono">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main SVG Canvas Layer */}
      <svg className="w-full h-full relative z-10 pointer-events-auto">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <defs>
            <marker id="lab-arrow-head" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeLinkColor} />
            </marker>
            <marker id="lab-arrow-head-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeLinkActiveColor} />
            </marker>
          </defs>

          {/* 1. Link Edges */}
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
            const cx = (sourceNode.x + targetNode.x) / 2 + dy * 0.15;
            const cy = (sourceNode.y + targetNode.y) / 2 - dx * 0.15;

            const pathD = `M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`;

            const t = (particleTick / 100);
            const px = (1 - t) * (1 - t) * sourceNode.x + 2 * (1 - t) * t * cx + t * t * targetNode.x;
            const py = (1 - t) * (1 - t) * sourceNode.y + 2 * (1 - t) * t * cy + t * t * targetNode.y;

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
                {/* Thick Invisible Hit Area for Easy Edge Selection & Hover */}
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth="16"
                  fill="none"
                />

                {/* Visible Edge Path */}
                <path
                  d={pathD}
                  stroke={isEdgeHovered || isEdgeSelected ? '#EF4444' : (isHighlighted ? strokeLinkActiveColor : strokeLinkColor)}
                  strokeWidth={isEdgeHovered || isEdgeSelected ? 3.5 : (isHighlighted ? 2 : 1.2)}
                  strokeDasharray={edge.relation === 'depends_on' ? '4 4' : undefined}
                  fill="none"
                  markerEnd={isEdgeHovered || isEdgeSelected ? undefined : (isHighlighted ? 'url(#lab-arrow-head-active)' : 'url(#lab-arrow-head)')}
                />

                {showParticles && isHighlighted && !isEdgeHovered && !isEdgeSelected && (
                  <circle
                    cx={px}
                    cy={py}
                    r={3.5}
                    fill={isDarkMode ? '#FFFFFF' : '#000000'}
                    className="drop-shadow-[0_0_6px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                  />
                )}

                {/* Midpoint Disconnect / Delete Link Button */}
                {(isEdgeHovered || isEdgeSelected) && (
                  <g
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
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

          {/* Connection Dragging Temporary Line */}
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

          {/* 2. Graph Nodes */}
          {nodes.map(node => {
            if (!visibility[node.type]) return null;

            const isSelected = selectedNodeId === node.id || selectedNodeId === node.entityId;
            const isDimmed = connectedNodeIds ? !connectedNodeIds.has(node.id) : false;
            const isSearched = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
            const isHoverTarget = hoverDropTargetId === node.id;

            const opacity = isDimmed ? 0.15 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={e => handleNodeMouseDown(node, e)}
                opacity={opacity}
                className="cursor-grab active:cursor-grabbing group transition-opacity duration-300"
              >
                {/* Proximity Re-Assignment Target Highlight */}
                {isHoverTarget && (
                  <circle
                    r={node.radius + 18}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    className="animate-spin"
                  />
                )}

                {/* Search / Selection Highlight Ring */}
                {(isSelected || isSearched) && (
                  <circle
                    r={node.radius + 10}
                    fill="none"
                    stroke={isSearched ? '#3B82F6' : (isDarkMode ? '#FFFFFF' : '#000000')}
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="animate-spin-slow"
                  />
                )}

                {node.type === 'team' && (
                  <g>
                    <polygon
                      points="-32,-18 0,-34 32,-18 32,18 0,34 -32,18"
                      fill={isDarkMode ? '#1E1E1E' : '#FFFFFF'}
                      stroke={isSelected ? (isDarkMode ? '#FFFFFF' : '#000000') : '#F59E0B'}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="drop-shadow-sm"
                    />
                    <text textAnchor="middle" dy="-3" fill={isDarkMode ? '#FFFFFF' : '#171717'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {node.entityId.replace('team-', '').substring(0, 4).toUpperCase()}
                    </text>
                    <text textAnchor="middle" dy="9" fill="#F59E0B" fontSize="7" fontWeight="bold" fontFamily="monospace">
                      TEAM
                    </text>
                    <text textAnchor="middle" dy="48" fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                      {node.label}
                    </text>
                  </g>
                )}

                {node.type === 'project' && (
                  <g>
                    <circle
                      r={node.radius}
                      fill={isDarkMode ? '#000000' : '#171717'}
                      stroke={isSelected ? '#3B82F6' : '#60A5FA'}
                      strokeWidth={isSelected ? '3.5' : '2.5'}
                      className="drop-shadow-md"
                    />
                    <text textAnchor="middle" dy="-2" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {node.entityId.replace('proj-', 'PRJ-')}
                    </text>
                    <text textAnchor="middle" dy="10" fill="#93C5FD" fontSize="8" fontFamily="monospace">
                      {node.status}
                    </text>
                    <text textAnchor="middle" dy={node.radius + 18} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                      {node.label.length > 24 ? `${node.label.substring(0, 22)}...` : node.label}
                    </text>
                  </g>
                )}

                {node.type === 'person' && (
                  <g>
                    <circle
                      r={node.radius + 4}
                      fill="none"
                      stroke={
                        node.eodStatus === 'blocked' ? '#EF4444' :
                        node.eodStatus === 'low' ? '#F59E0B' :
                        node.eodStatus === 'good' ? '#10B981' : '#9CA3AF'
                      }
                      strokeWidth="2.5"
                      className={node.eodStatus === 'blocked' ? 'animate-pulse' : ''}
                    />

                    <circle r={node.radius} fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
                    <text textAnchor="middle" dy="4" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {node.label.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                    </text>

                    <text textAnchor="middle" dy={node.radius + 16} fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                      {node.label}
                    </text>
                    {node.sublabel && (
                      <text textAnchor="middle" dy={node.radius + 28} fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="8.5" fontFamily="monospace">
                        {node.sublabel.length > 20 ? `${node.sublabel.substring(0, 18)}...` : node.sublabel}
                      </text>
                    )}
                  </g>
                )}

                {node.type === 'task' && (
                  <g>
                    <rect
                      x="-26"
                      y="-16"
                      width="52"
                      height="32"
                      rx="8"
                      fill={isDarkMode ? '#18181B' : '#FFFFFF'}
                      stroke={isSelected ? (isDarkMode ? '#FFFFFF' : '#000000') : (node.color || '#8B5CF6')}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="drop-shadow-xs"
                    />
                    <text textAnchor="middle" dy="-2" fill={isDarkMode ? '#FFFFFF' : '#171717'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {node.entityId.replace('task-', 'T-')}
                    </text>
                    <text textAnchor="middle" dy="9" fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="7" fontFamily="sans-serif">
                      {node.status}
                    </text>
                    <text textAnchor="middle" dy="32" fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                      {node.label.length > 26 ? `${node.label.substring(0, 24)}...` : node.label}
                    </text>
                  </g>
                )}

                {node.type === 'goal' && (
                  <g>
                    <rect
                      x="-22"
                      y="-22"
                      width="44"
                      height="44"
                      rx="6"
                      transform="rotate(45)"
                      fill={isDarkMode ? '#1E1B4B' : '#4C1D95'}
                      stroke={isSelected ? '#FFFFFF' : '#EC4899'}
                      strokeWidth="2"
                    />
                    <text textAnchor="middle" dy="-3" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      OKR
                    </text>
                    <text textAnchor="middle" dy="9" fill="#F472B6" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {node.progress}%
                    </text>
                    <text textAnchor="middle" dy="42" fill={isDarkMode ? '#F5F5F5' : '#171717'} fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                      {node.label.length > 26 ? `${node.label.substring(0, 24)}...` : node.label}
                    </text>
                  </g>
                )}

                {node.type === 'tag' && (
                  <g>
                    <rect
                      x="-30"
                      y="-13"
                      width="60"
                      height="26"
                      rx="13"
                      fill={node.color || '#4B5563'}
                    />
                    <text textAnchor="middle" dy="4" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                      {node.label}
                    </text>
                  </g>
                )}

                {/* Connector handle port on hover or when connecting */}
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
