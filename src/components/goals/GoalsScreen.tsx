import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Plus, MoreHorizontal, UserPlus, Link2, 
  ChevronDown, Target, GripVertical,
  User, Calendar, ArrowLeft, Trash2
} from 'lucide-react';

const ROLLUP_PROGRESS_DATA = [
  { week: 'W1', actual: 10, expected: 15 },
  { week: 'W4', actual: 28, expected: 35 },
  { week: 'W8', actual: 54, expected: 65 },
  { week: 'W12', actual: 68, expected: 90 }
];

export const GoalsScreen: React.FC = () => {
  const { goals, reorderGoals, updateGoal } = useApp();

  // Screen view state: 'grid' | 'detail' | 'create_kr'
  const [viewState, setViewState] = useState<'grid' | 'detail' | 'create_kr'>('grid');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedQuarter, setSelectedQuarter] = useState('Current Quarter');

  const selectedGoal = goals.find(g => g.id === selectedGoalId) || goals[0];

  // Inline Goal Editing state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalDesc, setEditGoalDesc] = useState('');
  const [editGoalDate, setEditGoalDate] = useState('');

  React.useEffect(() => {
    if (selectedGoal) {
      setEditGoalTitle(selectedGoal.title);
      setEditGoalDesc(selectedGoal.description || '');
      setEditGoalDate(selectedGoal.targetDate || '');
    }
  }, [selectedGoal?.id, selectedGoal?.title, selectedGoal?.description, selectedGoal?.targetDate]);

  // New Key Result Form state
  const [krTitle, setKrTitle] = useState('');
  const [metricType, setMetricType] = useState('Percentage');
  const [cadence, setCadence] = useState('Weekly');
  const [startVal, setStartVal] = useState('0');
  const [targetVal, setTargetVal] = useState('100');

  const [objectives, setObjectives] = useState<any[]>([]);

  React.useEffect(() => {
    const mapped = goals.map(g => ({
      id: g.id,
      dept: g.ownerType === 'team' ? 'Engineering' : 'Org',
      quarter: 'Current Quarter',
      title: g.title,
      owner: g.ownerName,
      avatar: undefined,
      status: g.status === 'OnTrack' ? 'On Track' : g.status === 'AtRisk' ? 'At Risk' : 'Behind',
      krCount: g.keyResults.length,
      progress: g.keyResults.length > 0 ? Math.round(g.keyResults.reduce((acc, kr) => acc + (kr.currentValue / (kr.targetValue || 1)), 0) / g.keyResults.length * 100) : 0
    }));
    setObjectives(mapped);
  }, [goals]);

  const [draggedObjId, setDraggedObjId] = useState<string | null>(null);
  const [dragOverObjId, setDragOverObjId] = useState<string | null>(null);

  const handleObjectiveDrop = (targetId: string) => {
    if (!draggedObjId || draggedObjId === targetId) return;
    const fromIdx = objectives.findIndex(o => o.id === draggedObjId);
    const toIdx = objectives.findIndex(o => o.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newObjs = [...objectives];
    const [moved] = newObjs.splice(fromIdx, 1);
    newObjs.splice(toIdx, 0, moved);
    setObjectives(newObjs);

    // Sync with AppContext goals
    const reorderedG = [...goals];
    if (fromIdx < reorderedG.length && toIdx < reorderedG.length) {
      const [movedG] = reorderedG.splice(fromIdx, 1);
      reorderedG.splice(toIdx, 0, movedG);
      reorderGoals(reorderedG);
    }

    setDraggedObjId(null);
    setDragOverObjId(null);
  };

  const handleSaveKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!krTitle.trim() || !selectedGoal) return;
    const newKR = {
      id: `kr-${Date.now()}`,
      title: krTitle.trim(),
      targetValue: Number(targetVal) || 100,
      currentValue: Number(startVal) || 0,
      unit: metricType === 'Percentage' ? '%' : 'pts',
      linkedTaskIds: []
    };
    const updatedKRs = [...(selectedGoal.keyResults || []), newKR];
    try {
      await updateGoal(selectedGoal.id, { keyResults: updatedKRs });
      setKrTitle('');
      setViewState('detail');
    } catch (err) { console.warn(err); }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. STRATEGIC OBJECTIVES GRID VIEW matching Screenshot 1 */}
      {viewState === 'grid' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Strategic Objectives</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Strategic OKRs &amp; Key Results</p>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="appearance-none px-3.5 py-2 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Product</option>
                  <option>Sales</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedQuarter}
                  onChange={e => setSelectedQuarter(e.target.value)}
                  className="appearance-none px-3.5 py-2 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option>Current Quarter</option>
                  <option>Next Quarter</option>
                  <option>All Quarters</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'goal' } }))}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> New Objective
              </button>
            </div>
          </div>

          {/* Objective Cards Grid or Empty State */}
          {objectives.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">No Strategic Objectives Found</h3>
                <p className="text-xs text-neutral-500 font-mono max-w-sm mx-auto">
                  Your workspace currently has 0 goals tracked in the database. Click below to create your first goal.
                </p>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'goal' } }))}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Create Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-mono">
            {objectives.map(obj => {
              const isDragging = draggedObjId === obj.id;
              const isDragOver = dragOverObjId === obj.id;

              return (
                <div 
                  key={obj.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', obj.id);
                    setDraggedObjId(obj.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverObjId !== obj.id) setDragOverObjId(obj.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverObjId === obj.id) setDragOverObjId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleObjectiveDrop(obj.id);
                  }}
                  onClick={() => {
                    setSelectedGoalId(obj.id);
                    setViewState('detail');
                  }}
                  className={`p-5 rounded-2xl bg-white dark:bg-neutral-900 border space-y-4 cursor-grab active:cursor-grabbing hover:border-neutral-400 transition-all ${
                    isDragging ? 'opacity-30' : 'shadow-sm'
                  } ${isDragOver ? 'border-2 border-black dark:border-white ring-2 ring-black/10' : 'border-neutral-200 dark:border-neutral-800'}`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                        • {obj.dept}
                      </span>
                      <span className="text-neutral-400">{obj.quarter}</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                  </div>

                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug font-sans">
                    {obj.title}
                  </h3>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <img src={obj.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{obj.owner}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      obj.status === 'On Track' ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' :
                      obj.status === 'At Risk' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {obj.status === 'On Track' ? 'On Track' : obj.status === 'At Risk' ? 'At Risk' : 'Behind'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
                      <span>{obj.krCount} Key Results</span>
                      <span>{obj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${obj.progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* 2. OBJECTIVE DETAIL & PROGRESS ROLLUP VIEW */}
      {viewState === 'detail' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <button onClick={() => setViewState('grid')} className="text-xs text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1.5 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Strategic Objectives
            </button>
          </div>

          {/* Dynamic Header Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 font-mono">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    OBJ-{(selectedGoal?.id || 'G1').slice(0, 6).toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedGoal?.status === 'OnTrack' ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' :
                    selectedGoal?.status === 'AtRisk' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {selectedGoal?.status === 'OnTrack' ? 'On Track' : selectedGoal?.status === 'AtRisk' ? 'At Risk' : 'Behind'}
                  </span>
                </div>

                {isEditingGoal ? (
                  <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 space-y-3 font-mono">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Objective Title</label>
                      <input
                        type="text"
                        autoFocus
                        value={editGoalTitle}
                        onChange={e => setEditGoalTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={editGoalDesc}
                        onChange={e => setEditGoalDesc(e.target.value)}
                        placeholder="Objective context..."
                        className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Target Date</label>
                      <input
                        type="date"
                        value={editGoalDate}
                        onChange={e => setEditGoalDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditGoalTitle(selectedGoal?.title || '');
                          setEditGoalDesc(selectedGoal?.description || '');
                          setEditGoalDate(selectedGoal?.targetDate || '');
                          setIsEditingGoal(false);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedGoal || !editGoalTitle.trim()) return;
                          try {
                            await updateGoal(selectedGoal.id, {
                              title: editGoalTitle.trim(),
                              description: editGoalDesc.trim(),
                              targetDate: editGoalDate
                            });
                            setIsEditingGoal(false);
                          } catch (err) { console.warn(err); }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug font-sans">
                      {selectedGoal?.title || 'Accelerate Platform Performance & Reduce Latency'}
                    </h1>
                    <p className="text-xs text-neutral-500 font-sans leading-relaxed mt-1">
                      {selectedGoal?.description || 'Optimize core infrastructure to deliver high performance.'}
                    </p>

                    <div className="flex items-center gap-2 pt-3 text-xs">
                      <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {selectedGoal?.ownerName || 'Elena Rostova'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {selectedGoal?.targetDate || 'Current Quarter'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 shrink-0 text-right">
                {(() => {
                  const progress = selectedGoal && selectedGoal.keyResults.length > 0
                    ? Math.round(selectedGoal.keyResults.reduce((acc, kr) => acc + (kr.currentValue / (kr.targetValue || 1)), 0) / selectedGoal.keyResults.length * 100)
                    : 0;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-end items-baseline gap-2">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Overall Progress</span>
                        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{progress}%</span>
                      </div>
                      <div className="w-48 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden ml-auto">
                        <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditingGoal(prev => !prev)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    {isEditingGoal ? 'Cancel Edit' : 'Edit'}
                  </button>
                  <button 
                    onClick={async () => {
                      if (!selectedGoal) return;
                      const nextStatus = selectedGoal.status === 'OnTrack' ? 'AtRisk' : selectedGoal.status === 'AtRisk' ? 'Behind' : 'OnTrack';
                      try {
                        await updateGoal(selectedGoal.id, { status: nextStatus });
                      } catch (err) { console.warn(err); }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm hover:opacity-90 cursor-pointer"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Results & Progress Rollup Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            {/* Key Results Box (2 Cols) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2 font-sans">
                  <Target className="w-4 h-4" /> Key Results ({selectedGoal?.keyResults?.length || 0})
                </h3>
                <button 
                  onClick={() => setViewState('create_kr')}
                  className="p-1 rounded text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Add Key Result"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {(!selectedGoal?.keyResults || selectedGoal.keyResults.length === 0) ? (
                  <div className="p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl space-y-2">
                    <p className="text-xs text-neutral-500 font-mono">No Key Results defined yet.</p>
                    <button
                      onClick={() => setViewState('create_kr')}
                      className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add Key Result
                    </button>
                  </div>
                ) : (
                  selectedGoal.keyResults.map((kr, krIdx) => {
                    const krPct = Math.min(100, Math.round((kr.currentValue / (kr.targetValue || 1)) * 100));
                    return (
                      <div key={kr.id || krIdx} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
                        <div className="flex justify-between items-center font-semibold">
                          <span className="text-neutral-900 dark:text-neutral-100 font-sans">{kr.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-500 font-mono">
                              Current:
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={kr.targetValue}
                              value={kr.currentValue}
                              onChange={async (e) => {
                                const val = Number(e.target.value);
                                const newKRs = [...selectedGoal.keyResults];
                                newKRs[krIdx] = { ...newKRs[krIdx], currentValue: val };
                                try {
                                  await updateGoal(selectedGoal.id, { keyResults: newKRs });
                                } catch (err) { console.warn(err); }
                              }}
                              className="w-16 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-right"
                            />
                            <span className="text-[11px] text-neutral-500 font-mono">
                              / {kr.targetValue}{kr.unit || ''} • <strong className="text-neutral-900 dark:text-neutral-100">{krPct}%</strong>
                            </span>
                            <button
                              onClick={async () => {
                                const newKRs = selectedGoal.keyResults.filter((_, i) => i !== krIdx);
                                try {
                                  await updateGoal(selectedGoal.id, { keyResults: newKRs });
                                } catch (err) { console.warn(err); }
                              }}
                              className="p-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                              title="Delete Key Result"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400">Owner: {selectedGoal.ownerName || 'Lead'} • Cadence: Weekly</p>
                        <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div className="h-full bg-black dark:bg-white rounded-full transition-all" style={{ width: `${krPct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Progress Rollup Line Chart */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 block font-sans">Progress Rollup</span>

              <div className="h-44 w-full pt-2 font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ROLLUP_PROGRESS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.3} />
                    <XAxis dataKey="week" stroke="#9CA3AF" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                    <Line type="monotone" dataKey="expected" stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="actual" stroke="#000" strokeWidth={2.5} dot={{ r: 3, fill: '#000' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 text-[10px] font-mono text-neutral-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-black dark:bg-white" /> Actual</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-neutral-400 border-dashed" /> Expected</span>
              </div>
            </div>
          </div>

          {/* Linked Tasks & Contributors Grid matching Screenshot 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            {/* Linked Tasks Table (2 Cols) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans block">Linked Tasks</span>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                    <tr>
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Task</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Effort (h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="py-3 font-semibold text-neutral-500">TSK-892</td>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Audit current edge node configurations</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">DONE</span>
                      </td>
                      <td className="py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">12.5</td>
                    </tr>

                    <tr>
                      <td className="py-3 font-semibold text-neutral-500">TSK-904</td>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Deploy caching layer v2 to US-East</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">IN PROGRESS</span>
                      </td>
                      <td className="py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">8.0</td>
                    </tr>

                    <tr>
                      <td className="py-3 font-semibold text-neutral-500">TSK-915</td>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Database index optimization query set A</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">TODO</span>
                      </td>
                      <td className="py-3 text-right text-neutral-400">--</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contributors Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Contributors</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500">4 Members</span>
              </div>

              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-3">
                  <UserAvatar name="Elena Rostova" size="sm" />
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Elena Rostova</div>
                    <div className="text-[10px] font-mono text-neutral-400">Objective Owner</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserAvatar name="Alex Chen" size="sm" />
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Alex Chen</div>
                    <div className="text-[10px] font-mono text-neutral-400">Backend Lead</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserAvatar name="Sarah Jenkins" size="sm" />
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Sarah Jenkins</div>
                    <div className="text-[10px] font-mono text-neutral-400">DevOps</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE KEY RESULT FORM VIEW matching Screenshot 3 */}
      {viewState === 'create_kr' && (
        <div className="max-w-2xl mx-auto py-4 font-sans text-xs">
          <div className="font-mono text-[10px] text-neutral-400 mb-4">
            Goals &gt; Q3 Growth Objective &gt; <span className="text-neutral-900 dark:text-neutral-100 font-bold">New Key Result</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Create Key Result</h2>
              <p className="text-xs text-neutral-500 font-mono mt-1">Define a measurable outcome that contributes to your objective.</p>
            </div>

            <form onSubmit={handleSaveKR} className="space-y-4 font-mono">
              {/* KR Title */}
              <div>
                <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Key Result Title</label>
                <input
                  type="text"
                  value={krTitle}
                  onChange={e => setKrTitle(e.target.value)}
                  placeholder="e.g., Increase user retention by 15%"
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                />
              </div>

              {/* Metric Type & Update Cadence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Metric Type</label>
                  <div className="relative">
                    <select
                      value={metricType}
                      onChange={e => setMetricType(e.target.value)}
                      className="w-full appearance-none p-3 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                    >
                      <option>Percentage</option>
                      <option>Numeric Value</option>
                      <option>Currency (USD)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Update Cadence</label>
                  <div className="relative">
                    <select
                      value={cadence}
                      onChange={e => setCadence(e.target.value)}
                      className="w-full appearance-none p-3 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                    >
                      <option>Weekly</option>
                      <option>Bi-weekly</option>
                      <option>Monthly</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Start & Target Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Start Value</label>
                  <input
                    type="text"
                    value={startVal}
                    onChange={e => setStartVal(e.target.value)}
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Target Value</label>
                  <input
                    type="text"
                    value={targetVal}
                    onChange={e => setTargetVal(e.target.value)}
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Assignment (Owner) */}
              <div>
                <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Assignment (Owner)</label>
                <button type="button" className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-500 flex items-center gap-2 text-xs font-mono">
                  <UserPlus className="w-4 h-4 text-neutral-400" />
                  Assign to a team member...
                </button>
              </div>

              {/* Linked Projects & Tasks */}
              <div className="space-y-2">
                <label className="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Linked Projects & Tasks</label>
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-2 text-xs cursor-pointer hover:border-neutral-400">
                  <Link2 className="w-4 h-4 text-neutral-400" /> Link existing project
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-2 text-xs cursor-pointer hover:border-neutral-400">
                  <Link2 className="w-4 h-4 text-neutral-400" /> Link existing task
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewState('grid')}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm"
                >
                  Save Key Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
