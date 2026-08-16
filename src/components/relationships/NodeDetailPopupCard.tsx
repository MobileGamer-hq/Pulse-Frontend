import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, ExternalLink, Folder, Target, Users, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeDetailPopupCardProps {
  selectedNodeId: string | null;
  onClose: () => void;
}

export const NodeDetailPopupCard: React.FC<NodeDetailPopupCardProps> = ({
  selectedNodeId,
  onClose
}) => {
  const { teams, projects, users, tasks, goals, tags, eodEntries, pushPanel } = useApp();

  if (!selectedNodeId) return null;

  // Resolve node entity
  let entityType: 'team' | 'project' | 'person' | 'task' | 'goal' | 'tag' = 'project';
  let rawId = selectedNodeId;

  if (selectedNodeId.startsWith('team-')) {
    entityType = 'team';
    rawId = selectedNodeId.replace('team-', '');
  } else if (selectedNodeId.startsWith('proj-')) {
    entityType = 'project';
    rawId = selectedNodeId.replace('proj-', '');
  } else if (selectedNodeId.startsWith('usr-') || selectedNodeId.startsWith('user-')) {
    entityType = 'person';
    rawId = selectedNodeId.replace('usr-', '').replace('user-', '');
  } else if (selectedNodeId.startsWith('task-')) {
    entityType = 'task';
    rawId = selectedNodeId.replace('task-', '');
  } else if (selectedNodeId.startsWith('goal-')) {
    entityType = 'goal';
    rawId = selectedNodeId.replace('goal-', '');
  } else if (selectedNodeId.startsWith('tag-')) {
    entityType = 'tag';
    rawId = selectedNodeId.replace('tag-', '');
  }

  const teamData = teams.find(t => t.id === rawId || t.id === `team-${rawId}`);
  const projectData = projects.find(p => p.id === rawId || p.id === `proj-${rawId}`);
  const userData = users.find(u => u.id === rawId || u.id === `user-${rawId}`);
  const taskData = tasks.find(t => t.id === rawId || t.id === `task-${rawId}`);
  const goalData = goals.find(g => g.id === rawId || g.id === `goal-${rawId}`);
  const tagData = tags.find(t => t.id === rawId || t.id === `tag-${rawId}`);

  const handleOpenDrawer = () => {
    if (entityType === 'project' && projectData) pushPanel({ type: 'project', id: projectData.id });
    else if (entityType === 'person' && userData) pushPanel({ type: 'person', id: userData.id });
    else if (entityType === 'task' && taskData) pushPanel({ type: 'task', id: taskData.id });
    else if (entityType === 'goal' && goalData) pushPanel({ type: 'goal', id: goalData.id });
    else if (entityType === 'tag' && tagData) pushPanel({ type: 'tag', id: tagData.id });
    else if (projectData) pushPanel({ type: 'project', id: projectData.id });
  };

  const userEod = userData ? eodEntries.find(e => e.userId === userData.id) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="absolute bottom-6 right-6 z-40 w-80 sm:w-96 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 shadow-2xl backdrop-blur-xl p-4 font-sans overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              {entityType}
            </span>

            <span className="text-[10px] font-mono text-neutral-400">
              #{rawId}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        {entityType === 'task' && taskData && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                {taskData.title}
              </h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                taskData.status === 'Done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                taskData.status === 'Blocked' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse' :
                taskData.status === 'InProgress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {taskData.status}
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
              {taskData.description}
            </p>

            {taskData.blockedReason && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Blocker:</strong> {taskData.blockedReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Priority</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{taskData.priority}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Due Date</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{taskData.dueDate}</span>
              </div>
            </div>
          </div>
        )}

        {entityType === 'project' && projectData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-500 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {projectData.name}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
              {projectData.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Workflow</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{projectData.templateType}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <span className="block text-[9px] text-neutral-400">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{projectData.status}</span>
              </div>
            </div>
          </div>
        )}

        {entityType === 'person' && userData && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={userData.avatarUrl}
                alt={userData.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{userData.name}</h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono block">{userData.title}</span>
              </div>
            </div>

            {userEod && (
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase">
                  <span>Daily EOD Energy</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{userEod.energyIndex}/5 Gauge</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-1 italic font-mono">
                  "{userEod.accomplishments[0] || 'No EOD notes'}"
                </p>
              </div>
            )}

            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Team: <strong className="text-neutral-900 dark:text-neutral-100">{userData.teamName}</strong> • {userData.role}
            </div>
          </div>
        )}

        {entityType === 'goal' && goalData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {goalData.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
              {goalData.description}
            </p>

            <div className="space-y-1 pt-1 font-mono">
              <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span>Key Results ({goalData.keyResults.length})</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{goalData.status}</span>
              </div>
              {goalData.keyResults.map(kr => (
                <div key={kr.id} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 text-[10px] space-y-1 border border-neutral-200/50 dark:border-neutral-800">
                  <div className="flex justify-between font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="truncate">{kr.title}</span>
                    <span>{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ width: `${Math.min(100, (kr.currentValue / (kr.targetValue || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {entityType === 'team' && teamData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{teamData.name}</h3>
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-400 font-mono space-y-1">
              <div>Lead: <strong className="text-neutral-900 dark:text-neutral-100">{teamData.leadName}</strong></div>
              <div>Members: <strong className="text-neutral-900 dark:text-neutral-100">{teamData.memberIds.length} users</strong></div>
            </div>
          </div>
        )}

        {entityType === 'tag' && tagData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tagData.colorHex }} />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{tagData.name}</h3>
            </div>

            {tagData.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono leading-relaxed">
                {tagData.description}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 font-mono">Press Esc to close</span>
          <button
            onClick={handleOpenDrawer}
            className="px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <span>Full Inspection</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
