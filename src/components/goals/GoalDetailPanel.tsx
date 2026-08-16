import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EntityLink } from '../common/EntityLink';
import { GripVertical } from 'lucide-react';
import type { KeyResult } from '../../types';

interface GoalDetailPanelProps {
  id: string;
}

export const GoalDetailPanel: React.FC<GoalDetailPanelProps> = ({ id }) => {
  const { goals, tasks, reorderGoals } = useApp();

  const goal = goals.find(g => g.id === id);
  if (!goal) return <div className="text-neutral-500 text-sm py-8 text-center">Goal not found.</div>;

  const [krs, setKrs] = useState<KeyResult[]>(goal.keyResults);
  const [draggedKrId, setDraggedKrId] = useState<string | null>(null);
  const [dragOverKrId, setDragOverKrId] = useState<string | null>(null);

  const handleKrDrop = (targetKrId: string) => {
    if (!draggedKrId || draggedKrId === targetKrId) return;
    const fromIdx = krs.findIndex(k => k.id === draggedKrId);
    const toIdx = krs.findIndex(k => k.id === targetKrId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newKrs = [...krs];
    const [moved] = newKrs.splice(fromIdx, 1);
    newKrs.splice(toIdx, 0, moved);
    setKrs(newKrs);

    // Sync with AppContext goals
    const updatedGoals = goals.map(g => g.id === goal.id ? { ...g, keyResults: newKrs } : g);
    reorderGoals(updatedGoals);
    setDraggedKrId(null);
    setDragOverKrId(null);
  };

  const linkedTasks = tasks.filter(t => goal.linkedTaskIds.includes(t.id));

  return (
    <div className="space-y-6 text-sm">
      <div>
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            {goal.ownerType} OKR Goal
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            {goal.status}
          </span>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">{goal.title}</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{goal.description}</p>
      </div>

      <div>
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Key Results (KRs)</span>
        <div className="space-y-3">
          {krs.map(kr => {
            const pct = Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100));
            const isDragging = draggedKrId === kr.id;
            const isDragOver = dragOverKrId === kr.id;

            return (
              <div 
                key={kr.id} 
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', kr.id);
                  setDraggedKrId(kr.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverKrId !== kr.id) setDragOverKrId(kr.id);
                }}
                onDragLeave={() => {
                  if (dragOverKrId === kr.id) setDragOverKrId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleKrDrop(kr.id);
                }}
                className={`p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border transition-all cursor-grab active:cursor-grabbing ${
                  isDragging ? 'opacity-30' : 'hover:border-neutral-400'
                } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : 'border-neutral-200 dark:border-neutral-800'}`}
              >
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-900 dark:text-neutral-100">{kr.title}</span>
                  </div>
                  <span>{kr.currentValue} / {kr.targetValue} {kr.unit} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Linked Tasks ({linkedTasks.length})</span>
        <div className="space-y-2">
          {linkedTasks.map(t => (
            <div key={t.id} className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <EntityLink type="task" id={t.id} />
              <span className="text-[10px] text-neutral-400 font-medium">{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
