import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StackedFolderSidebar } from './StackedFolderSidebar';
import { SpiderWebCanvas, type EdgeOverlayFilter } from './SpiderWebCanvas';
import { RelationshipCarousel } from './RelationshipCarousel';
import { NodeDetailPopupCard } from './NodeDetailPopupCard';
import { ArrowLeft, Search, Plus, Hexagon, LayoutGrid, RotateCcw } from 'lucide-react';
import type { EntityType } from '../../types';

export const SpiderWebRelationshipsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveScreen, currentOrgSlug, pushPanel } = useApp();
  
  const [viewMode, setViewMode] = useState<'spiderweb' | 'carousel'>('spiderweb');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<EntityType | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set(['core-org']));
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusDepth, setFocusDepth] = useState<number>(2);
  const [edgeOverlayFilter, setEdgeOverlayFilter] = useState<EdgeOverlayFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSelectNode = (id: string, type?: EntityType) => {
    setSelectedNodeId(id);
    setFocusNodeId(id);
    if (type) setSelectedNodeType(type);
  };

  const handleDrillDown = (id: string, type: EntityType) => {
    setExpandedNodeIds(prev => new Set([...prev, id]));
    handleSelectNode(id, type);
  };

  const handleToggleExpandNode = (nodeId: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleResetView = () => {
    setExpandedNodeIds(new Set(['core-org']));
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setFocusNodeId(null);
    setSearchQuery('');
  };

  const handleOpenDetailDrawer = (nodeId?: string, nodeType?: EntityType) => {
    const targetId = nodeId || selectedNodeId;
    const targetType = nodeType || selectedNodeType;
    if (!targetId) return;

    let rawId = targetId;
    if (rawId.startsWith('usr-') || rawId.startsWith('user-')) {
      rawId = rawId.replace(/^usr-|^user-/, '').split('-team-')[0].split('-proj-')[0];
      pushPanel({ type: 'person', id: rawId });
    } else if (rawId.startsWith('proj-')) {
      pushPanel({ type: 'project', id: rawId.replace(/^proj-/, '') });
    } else if (rawId.startsWith('task-')) {
      pushPanel({ type: 'task', id: rawId.replace(/^task-/, '') });
    } else if (rawId.startsWith('goal-')) {
      pushPanel({ type: 'goal', id: rawId.replace(/^goal-/, '') });
    } else if (targetType) {
      pushPanel({ type: targetType as any, id: rawId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Navigation Header */}
      <div className="h-14 px-4 sm:px-6 bg-white/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveScreen('dashboard');
              navigate(`/${currentOrgSlug || 'epicordia'}/dashboard`);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold transition-all text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs">
            <button
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                viewMode === 'carousel'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
              <span>Master-Detail</span>
            </button>
            <button
              onClick={() => setViewMode('spiderweb')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                viewMode === 'spiderweb'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Hexagon className="w-3.5 h-3.5 text-amber-500" />
              <span>Hexagon Grid</span>
            </button>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search person, project, task..."
            className="w-full bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none font-mono"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {selectedNodeId && (
            <button
              onClick={handleResetView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition-all text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entity</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <StackedFolderSidebar
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          expandedFolderIds={Array.from(expandedNodeIds)}
          onToggleFolder={handleToggleExpandNode}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

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
          <div className="flex-1 h-full relative">
            <SpiderWebCanvas
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              expandedNodeIds={expandedNodeIds}
              onToggleExpandNode={handleToggleExpandNode}
              focusNodeId={focusNodeId}
              focusDepth={focusDepth}
              onSetFocusDepth={setFocusDepth}
              edgeOverlayFilter={edgeOverlayFilter}
              onSetEdgeOverlayFilter={setEdgeOverlayFilter}
              searchQuery={searchQuery}
            />

            {selectedNodeId && (
              <NodeDetailPopupCard
                selectedNodeId={selectedNodeId}
                selectedNodeType={selectedNodeType}
                onClose={() => {
                  setSelectedNodeId(null);
                  setSelectedNodeType(null);
                  setFocusNodeId(null);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
