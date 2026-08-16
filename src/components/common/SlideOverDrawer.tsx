import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import { ProjectDetailPanel } from '../projects/ProjectDetailPanel';
import { PersonProfilePanel } from '../people/PersonProfilePanel';
import { GoalDetailPanel } from '../goals/GoalDetailPanel';
import { TagDetailPanel } from '../admin/TagDetailPanel';
import { RelationshipMap } from '../projects/RelationshipMap';

export const SlideOverDrawer: React.FC = () => {
  const { panelStack, popPanel, closeAllPanels, tasks, projects, users, goals, tags } = useApp();

  if (panelStack.length === 0) return null;

  const currentPanel = panelStack[panelStack.length - 1];

  // Get readable title for breadcrumb step
  const getPanelLabel = (panel: typeof currentPanel) => {
    switch (panel.type) {
      case 'task': return tasks.find(t => t.id === panel.id)?.title || 'Task Detail';
      case 'project': return projects.find(p => p.id === panel.id)?.name || 'Project Detail';
      case 'person': return users.find(u => u.id === panel.id)?.name || 'Person Profile';
      case 'goal': return goals.find(g => g.id === panel.id)?.title || 'Goal Detail';
      case 'tag': return tags.find(t => t.id === panel.id)?.name || 'Tag Detail';
      case 'relationship-map': return 'Relationship Map';
      default: return 'Detail';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAllPanels}
        className="fixed inset-0 drawer-overlay"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-2xl h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-10"
      >
        {/* Drawer Header & Breadcrumb Trail */}
        <div className="px-3 sm:px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80%] scrollbar-none">
            {panelStack.length > 1 && (
              <button
                onClick={popPanel}
                className="p-1 rounded text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors mr-1"
                title="Back to previous panel"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {panelStack.map((p, idx) => (
              <React.Fragment key={`${p.type}-${'id' in p ? p.id : p.projectId}-${idx}`}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                <span className={`text-xs truncate max-w-[100px] sm:max-w-[140px] font-medium ${
                  idx === panelStack.length - 1 
                    ? 'text-neutral-900 dark:text-neutral-100 font-semibold' 
                    : 'text-neutral-500 hover:underline cursor-pointer'
                }`}>
                  {getPanelLabel(p)}
                </span>
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={closeAllPanels}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
          {currentPanel.type === 'task' && <TaskDetailPanel id={currentPanel.id} />}
          {currentPanel.type === 'project' && <ProjectDetailPanel id={currentPanel.id} />}
          {currentPanel.type === 'person' && <PersonProfilePanel id={currentPanel.id} />}
          {currentPanel.type === 'goal' && <GoalDetailPanel id={currentPanel.id} />}
          {currentPanel.type === 'tag' && <TagDetailPanel id={currentPanel.id} />}
          {currentPanel.type === 'relationship-map' && <RelationshipMap projectId={currentPanel.projectId} />}
        </div>
      </motion.div>
    </div>
  );
};
