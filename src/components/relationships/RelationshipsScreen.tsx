import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StackedFolderSidebar } from './StackedFolderSidebar';
import { ObsidianGraphCanvas } from './ObsidianGraphCanvas';
import { NodeDetailPopupCard } from './NodeDetailPopupCard';
import { 
  Search, ShieldAlert, Target, 
  Sparkles, ChevronRight, ExternalLink, ArrowLeft
} from 'lucide-react';
import type { EntityType } from '../../types';

export const RelationshipsScreen: React.FC = () => {
  const { setActiveScreen, pushPanel, projects, tasks, goals } = useApp();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('proj-proj-1');
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([
    'team-team-eng',
    'proj-proj-1',
    'proj-proj-2'
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectNode = (id: string, type: EntityType, fromCanvas = false) => {
    setSelectedNodeId(id);

    // Auto expand parent folder hierarchy only when selecting nodes directly from the graph canvas
    if (fromCanvas) {
      if (type === 'project') {
        setExpandedFolderIds(prev => Array.from(new Set([...prev, `proj-${id}`])));
      } else if (type === 'task') {
        const taskObj = tasks.find(t => t.id === id);
        if (taskObj) {
          setExpandedFolderIds(prev => Array.from(new Set([...prev, `proj-${taskObj.projectId}`])));
        }
      }
    }
  };

  const handleToggleFolder = (id: string) => {
    setExpandedFolderIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleOpenDetailDrawer = () => {
    if (!selectedNodeId) return;

    if (selectedNodeId.startsWith('proj-')) {
      const id = selectedNodeId.replace('proj-', '');
      pushPanel({ type: 'project', id });
    } else if (selectedNodeId.startsWith('usr-') || selectedNodeId.startsWith('user-')) {
      const id = selectedNodeId.replace('usr-', '');
      pushPanel({ type: 'person', id });
    } else if (selectedNodeId.startsWith('task-')) {
      const id = selectedNodeId.replace('task-', '');
      pushPanel({ type: 'task', id });
    } else if (selectedNodeId.startsWith('goal-')) {
      const id = selectedNodeId.replace('goal-', '');
      pushPanel({ type: 'goal', id });
    } else if (selectedNodeId.startsWith('tag-')) {
      const id = selectedNodeId.replace('tag-', '');
      pushPanel({ type: 'tag', id });
    } else {
      pushPanel({ type: 'project', id: projects[0]?.id || 'proj-1' });
    }
  };

  const handlePresetFocus = (preset: 'all' | 'projects' | 'blocked' | 'goals') => {
    if (preset === 'all') {
      setSelectedNodeId(null);
    } else if (preset === 'projects') {
      if (projects.length > 0) {
        const pId = projects[0].id;
        setSelectedNodeId(`proj-${pId}`);
        setExpandedFolderIds(prev => Array.from(new Set([...prev, `proj-${pId}`])));
      }
    } else if (preset === 'blocked') {
      const blockedTask = tasks.find(t => t.status === 'Blocked');
      if (blockedTask) {
        setSelectedNodeId(`task-${blockedTask.id}`);
        setExpandedFolderIds(prev => Array.from(new Set([...prev, `proj-${blockedTask.projectId}`])));
      }
    } else if (preset === 'goals') {
      if (goals.length > 0) setSelectedNodeId(`goal-${goals[0].id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#F4F5F7] dark:bg-neutral-950 flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar with Prominent Back to Dashboard Button */}
      <div className="h-14 px-4 sm:px-6 bg-white/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0 font-mono text-xs text-neutral-900 dark:text-neutral-100 backdrop-blur-md">
        {/* Left: Back Button & Breadcrumbs */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0" />

          <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Relationships Graph</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />

          <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold truncate max-w-[200px]">
            {selectedNodeId ? selectedNodeId : 'Global Topology'}
          </span>
        </div>

        {/* Middle: Search Input */}
        <div className="relative hidden md:block max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search canvas nodes..."
            className="w-full pl-8 pr-4 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* Right Action Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-1 rounded-xl">
            <button
              onClick={() => handlePresetFocus('all')}
              className="px-2.5 py-1 rounded-lg text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-all font-bold"
            >
              All
            </button>
            <button
              onClick={() => handlePresetFocus('projects')}
              className="px-2.5 py-1 rounded-lg text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-all font-bold"
            >
              Projects
            </button>
            <button
              onClick={() => handlePresetFocus('blocked')}
              className="px-2.5 py-1 rounded-lg text-[10px] text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-neutral-700 transition-all font-bold flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" /> Blockers
            </button>
            <button
              onClick={() => handlePresetFocus('goals')}
              className="px-2.5 py-1 rounded-lg text-[10px] text-purple-600 dark:text-purple-400 hover:bg-white dark:hover:bg-neutral-700 transition-all font-bold flex items-center gap-1"
            >
              <Target className="w-3 h-3" /> OKRs
            </button>
          </div>

          {selectedNodeId && (
            <button
              onClick={handleOpenDetailDrawer}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Inspect Entity</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Viewport */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <StackedFolderSidebar
          selectedNodeId={selectedNodeId}
          onSelectNode={(id, type) => handleSelectNode(id, type, false)}
          expandedFolderIds={expandedFolderIds}
          onToggleFolder={handleToggleFolder}
        />

        <ObsidianGraphCanvas
          selectedNodeId={selectedNodeId}
          onSelectNode={(id, type) => handleSelectNode(id, type, true)}
          searchQuery={searchQuery}
        />

        {/* Floating Bottom-Right Detail Info Popup Card */}
        <NodeDetailPopupCard
          selectedNodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
};
