import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StackedFolderSidebar } from './StackedFolderSidebar';
import { SpiderWebCanvas } from './SpiderWebCanvas';
import { NodeDetailPopupCard } from './NodeDetailPopupCard';
import { ArrowLeft, Search, Plus } from 'lucide-react';

export const SpiderWebRelationshipsScreen: React.FC = () => {
  const { setActiveScreen } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>(['team-eng', 'team-design', 'proj-1', 'proj-2']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
  };

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolderIds(prev => 
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Navigation Header */}
      <div className="h-14 px-4 sm:px-6 bg-white/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold transition-all text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex items-center gap-2">
            <span className="text-base">🕸️</span>
            <div>
              <h1 className="text-xs font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                Spider Web Canvas
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono border border-neutral-200 dark:border-neutral-700">
                  Version 3 • Concentric Layers
                </span>
              </h1>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">Concentric radial rings • Multi-project instances</p>
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search nodes or multi-instance members..."
            className="w-full bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none font-mono"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'task' } }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entity</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Interactive Stacked Folder Sidebar */}
        <StackedFolderSidebar
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          expandedFolderIds={expandedFolderIds}
          onToggleFolder={handleToggleFolder}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Spider Web Canvas Viewport */}
        <div className="flex-1 h-full relative">
          <SpiderWebCanvas
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            searchQuery={searchQuery}
          />

          {/* Node Detail Popup Drawer */}
          {selectedNodeId && (
            <NodeDetailPopupCard
              selectedNodeId={selectedNodeId}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
