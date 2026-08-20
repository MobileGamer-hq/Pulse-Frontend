import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';
import type { EntityType } from '../../types';
import { 
  FolderGit2, Target, 
  Users, AlertCircle, CheckCircle2, Clock, ShieldAlert, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntityLinkProps {
  type: EntityType;
  id: string;
  label?: string;
  sublabel?: string;
  avatarUrl?: string;
  colorHex?: string;
  className?: string;
  showIcon?: boolean;
}

export const EntityLink: React.FC<EntityLinkProps> = ({
  type,
  id,
  label,
  sublabel,
  avatarUrl,
  colorHex,
  className = '',
  showIcon = true
}) => {
  const { pushPanel, users, projects, tasks, goals, tags } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  // Fetch full target entity for preview popover
  const person = type === 'person' ? users.find(u => u.id === id) : undefined;
  const project = type === 'project' ? projects.find(p => p.id === id) : undefined;
  const task = type === 'task' ? tasks.find(t => t.id === id) : undefined;
  const goal = type === 'goal' ? goals.find(g => g.id === id) : undefined;
  const tag = type === 'tag' ? tags.find(t => t.id === id) : undefined;

  const displayLabel = label || person?.name || project?.name || task?.title || goal?.title || tag?.name || id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    pushPanel({ type: type as any, id });
  };

  // Status icon helper for tasks
  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case 'Done': return <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100 fill-neutral-900 dark:fill-neutral-100" />;
      case 'InProgress': return <Clock className="w-3.5 h-3.5 text-neutral-500" />;
      case 'AtRisk': return <AlertCircle className="w-3.5 h-3.5 text-neutral-600 stroke-dashed" />;
      case 'Blocked': return <ShieldAlert className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100 stroke-[2.5]" />;
      default: return <div className="w-3 h-3 rounded-full border border-neutral-400" />;
    }
  };

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all hover:bg-neutral-200 dark:hover:bg-neutral-800 ${
          type === 'tag' 
            ? 'border border-neutral-200 dark:border-neutral-700' 
            : 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100 hover:text-black dark:hover:text-white'
        } ${className}`}
        style={type === 'tag' && tag ? { backgroundColor: tag.bgHex, color: tag.textHex, borderColor: 'transparent' } : {}}
      >
        {type === 'person' && (
          <UserAvatar name={label || person?.name || 'User'} avatarUrl={avatarUrl || person?.avatarUrl} size="xs" />
        )}
        {type === 'project' && showIcon && <FolderGit2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />}
        {type === 'task' && showIcon && renderStatusIcon(task?.status)}
        {type === 'goal' && showIcon && <Target className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />}
        {type === 'tag' && showIcon && (
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: colorHex || tag?.colorHex || '#3B82F6' }} 
          />
        )}
        {type === 'team' && showIcon && <Users className="w-3.5 h-3.5 text-neutral-500" />}

        <span className="truncate max-w-[180px]">{displayLabel}</span>
        {sublabel && <span className="text-[10px] text-neutral-500 font-normal">({sublabel})</span>}
      </button>

      {/* Hover Card Preview Popover */}
      <AnimatePresence>
        {isHovered && (person || project || task || goal || tag) && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-64 p-3 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 text-left text-xs pointer-events-none"
          >
            {type === 'person' && person && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={person.name} avatarUrl={person.avatarUrl} size="md" />
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">{person.name}</div>
                    <div className="text-[11px] text-neutral-500">{person.title}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500">Team: {person.teamName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                    {person.role}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Active Projects: {person.activeProjectIds.length} | Capacity: {person.capacityHoursPerWeek}h/wk
                </div>
              </div>
            )}

            {type === 'project' && project && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{project.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {project.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-2">{project.description}</p>
                <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 flex justify-between text-[10px] text-neutral-400">
                  <span>Template: {project.templateType}</span>
                  <span>Target: {project.targetEndDate}</span>
                </div>
              </div>
            )}

            {type === 'task' && task && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {renderStatusIcon(task.status)}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">{task.title}</span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-2">{task.description}</p>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px]">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Priority: {task.priority}</span>
                  <span className="text-neutral-400">Due: {task.dueDate}</span>
                </div>
              </div>
            )}

            {type === 'goal' && goal && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{goal.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 font-medium">
                    {goal.status}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  Key Results: {goal.keyResults.length} | Target: {goal.targetDate}
                </div>
              </div>
            )}

            {type === 'tag' && tag && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.colorHex }} />
                  {tag.name}
                </div>
                <p className="text-[11px] text-neutral-500">{tag.description || 'Global entity tag'}</p>
                <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  Applies to: {tag.appliesTo.join(', ')}
                </div>
              </div>
            )}

            <div className="mt-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between font-medium">
              <span>Click to view profile</span>
              <ArrowRight className="w-3 h-3 text-neutral-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
