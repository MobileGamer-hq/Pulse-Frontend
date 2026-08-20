import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ZoomIn, ZoomOut, RotateCcw, Play, Pause, 
  Zap, Link2, Check
} from 'lucide-react';
import type { EntityType, Team, Project, User, Task, Goal, Tag } from '../../types';

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

interface ObsidianGraphCanvasProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, type: EntityType) => void;
  searchQuery?: string;
}

export const ObsidianGraphCanvas: React.FC<ObsidianGraphCanvasProps> = ({
  selectedNodeId,
  onSelectNode,
  searchQuery = ''
}) => {
  const { teams, projects, users, tasks, goals, tags, eodEntries, updateTask, isDarkMode } = useApp();

  // Canvas viewport state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Physics & Animation toggle
  const [isPhysicsRunning, setIsPhysicsRunning] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const repulsionForce = 400;

  // Filters state
  const [visibility, setVisibility] = useState<Record<EntityType, boolean>>({
    team: true,
    project: true,
    person: true,
    task: true,
    goal: true,
    tag: false
  });

  // Edge drag connection mode
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
  const [linkToast, setLinkToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particleOffsetRef = useRef(0);
  const [particleTick, setParticleTick] = useState(0);

  // Generate initial nodes and edges based on Pulse data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesMap: Map<string, GraphNode> = new Map();
    const edgesList: GraphEdge[] = [];

    // Level 0: Teams
    teams.forEach((t: Team, index: number) => {
      const angle = (index / Math.max(1, teams.length)) * Math.PI * 2;
      const radius = 260;
      const nodeId = `team-${t.id}`;
      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: t.id,
        type: 'team',
        label: t.name,
        sublabel: `Lead: ${t.leadName}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
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

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: p.id,
        type: 'project',
        label: p.name,
        sublabel: p.status,
        status: p.status,
        x: parentX + Math.cos(angle) * dist,
        y: parentY + Math.sin(angle) * dist,
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
    users.forEach((u: User, index: number) => {
      const nodeId = `usr-${u.id}`;
      const parentTeamNode = nodesMap.get(`team-${u.teamId}`);
      const baseX = parentTeamNode ? parentTeamNode.x : 0;
      const baseY = parentTeamNode ? parentTeamNode.y : 0;

      const angle = (index / Math.max(1, users.length)) * Math.PI * 2 + 1.2;
      const dist = 220;

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
        x: baseX + Math.cos(angle) * dist,
        y: baseY + Math.sin(angle) * dist,
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

      const primaryTag = tags.find(tg => tsk.tagIds.includes(tg.id));

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: tsk.id,
        type: 'task',
        label: tsk.title,
        sublabel: `${tsk.priority} • ${tsk.status}`,
        status: tsk.status,
        color: primaryTag ? primaryTag.colorHex : '#8B5CF6',
        x: baseX + Math.cos(angle) * dist,
        y: baseY + Math.sin(angle) * dist,
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
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
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

      nodesMap.set(nodeId, {
        id: nodeId,
        entityId: tg.id,
        type: 'tag',
        label: tg.name,
        color: tg.colorHex,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
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
  }, [teams, projects, users, tasks, goals, tags, eodEntries]);

  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

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

  useEffect(() => {
    if (!selectedNodeId) return;

    const targetNode = nodes.find(n => n.id === selectedNodeId || n.entityId === selectedNodeId);
    if (targetNode) {
      setPan({
        x: window.innerWidth / 2 - targetNode.x * zoom - 160,
        y: window.innerHeight / 2 - targetNode.y * zoom - 80
      });

      setNodes(prev => prev.map(node => {
        if (node.id === targetNode.id) return node;

        const isConnected = edges.some(e => 
          (e.source === targetNode.id && e.target === node.id) ||
          (e.target === targetNode.id && e.source === node.id)
        );

        if (isConnected) {
          const dx = node.x - targetNode.x;
          const dy = node.y - targetNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return {
            ...node,
            vx: (dx / dist) * 12,
            vy: (dy / dist) * 12
          };
        }
        return node;
      }));
    }
  }, [selectedNodeId]);

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

            const force = (repulsionForce * 15) / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
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

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        return newNodes.map(n => {
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
  }, [isPhysicsRunning, repulsionForce, edges]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (connectingSourceId) return;
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }

    if (connectingSourceId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      setMouseCanvasPos({ x: canvasX, y: canvasY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const touchDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
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
    } else if (e.touches.length === 1 && isDragging) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
    setIsDragging(false);
  };

  // Attach native non-passive wheel listener to prevent browser page/folder view zoom
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

  const handleRecenter = () => {
    setZoom(0.85);
    setPan({ x: 380, y: 260 });
  };

  const handleNodeClick = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (connectingSourceId) {
      if (connectingSourceId !== node.id) {
        const newEdge: GraphEdge = {
          id: `edge-custom-${Date.now()}`,
          source: connectingSourceId,
          target: node.id,
          relation: 'depends_on',
          animated: true
        };
        setEdges(prev => [...prev, newEdge]);
        
        const sourceNode = nodes.find(n => n.id === connectingSourceId);
        setLinkToast(`Linked "${sourceNode?.label}" -> "${node.label}"`);
        setTimeout(() => setLinkToast(null), 3500);

        if (sourceNode?.type === 'task' && node.type === 'task') {
          const currentTask = tasks.find(t => t.id === sourceNode.entityId);
          if (currentTask && !currentTask.dependencyTaskIds.includes(node.entityId)) {
            updateTask(sourceNode.entityId, {
              dependencyTaskIds: [...currentTask.dependencyTaskIds, node.entityId]
            });
          }
        }
      }
      setConnectingSourceId(null);
      return;
    }

    onSelectNode(node.entityId, node.type);
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
      className="relative flex-1 w-full h-full bg-[#F4F5F7] dark:bg-[#0A0A0A] text-neutral-900 dark:text-white overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans"
    >
      {/* Dynamic Light/Dark Dotted Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `radial-gradient(${isDarkMode ? '#ffffff' : '#9ca3af'} 1.2px, transparent 1.2px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Floating Canvas Top Controls & Preset Bar */}
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

        {/* Right: Physics & Controls Bar */}
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
            onClick={handleRecenter}
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

      {/* Dynamic Link Success Toast */}
      {linkToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce font-mono">
          <Check className="w-4 h-4" />
          <span>{linkToast}</span>
        </div>
      )}

      {/* Main SVG Graph Layer */}
      <svg className="w-full h-full relative z-10 pointer-events-auto">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeLinkColor} />
            </marker>
            <marker id="arrow-head-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeLinkActiveColor} />
            </marker>
          </defs>

          {/* 1. Link Edges */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;
            if (!visibility[sourceNode.type] || !visibility[targetNode.type]) return null;

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
              <g key={edge.id} opacity={opacity} className="transition-opacity duration-300">
                <path
                  d={pathD}
                  stroke={isHighlighted ? strokeLinkActiveColor : strokeLinkColor}
                  strokeWidth={isHighlighted ? 2 : 1.2}
                  strokeDasharray={edge.relation === 'depends_on' ? '4 4' : undefined}
                  fill="none"
                  markerEnd={isHighlighted ? 'url(#arrow-head-active)' : 'url(#arrow-head)'}
                />

                {showParticles && isHighlighted && (
                  <circle
                    cx={px}
                    cy={py}
                    r={3.5}
                    fill={isDarkMode ? '#FFFFFF' : '#000000'}
                    className="drop-shadow-[0_0_6px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                  />
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

            const opacity = isDimmed ? 0.15 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={e => handleNodeClick(node, e)}
                opacity={opacity}
                className="cursor-pointer group transition-opacity duration-300"
              >
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
                    {/* External Title Label */}
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
                    {/* External Title Label */}
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

                    {/* External Title & Role Label */}
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
                    {/* External Title Label */}
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
                    {/* External Title Label */}
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

                <g 
                  onClick={e => {
                    e.stopPropagation();
                    setConnectingSourceId(connectingSourceId === node.id ? null : node.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  transform={`translate(${node.radius + 6}, -${node.radius + 6})`}
                >
                  <circle r="10" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                  <Link2 className="w-3 h-3 text-white -translate-x-1.5 -translate-y-1.5" />
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 font-mono pointer-events-none">
        {connectingSourceId && (
          <div className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-pulse pointer-events-auto">
            <Link2 className="w-4 h-4" />
            <span>Click any target node to create a dependency link!</span>
            <button
              onClick={() => setConnectingSourceId(null)}
              className="ml-2 underline text-[10px] font-normal"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 shadow-xl backdrop-blur-md space-y-1 pointer-events-auto max-w-xs">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300">
            <span>Relationship Graph</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">60 FPS</span>
          </div>
          <p className="text-[10px] leading-relaxed opacity-80">
            Drag edge handles to connect dependencies. Click nodes to blossom expansion.
          </p>
        </div>
      </div>
    </div>
  );
};
