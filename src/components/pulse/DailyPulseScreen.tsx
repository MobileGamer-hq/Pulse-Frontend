import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, BatteryCharging, ArrowRight, ArrowLeft, 
  ShieldAlert, Zap, GripVertical, Check, CheckCircle2,
  Pencil, Trash2, Plus, Search, Calendar, 
  ExternalLink, RotateCw
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const DailyPulseScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tasks, users, eodEntries, currentUser, 
    submitEOD, deleteEOD, setActiveScreen, currentOrgSlug, pushPanel,
    refreshWorkspaceData
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkspaceData(false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Active Screen Mode: 'feed' | 'wizard'
  const [activeView, setActiveView] = useState<'feed' | 'wizard'>('feed');
  const [feedTab, setFeedTab] = useState<'all' | 'my' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCompletedTaskIds, setSelectedCompletedTaskIds] = useState<string[]>(() => {
    return tasks.filter(t => t.status === 'Done').map(t => t.id);
  });
  const [accomplishments, setAccomplishments] = useState<string[]>([]);
  const [newAccInput, setNewAccInput] = useState('');

  // Drag and Drop state for accomplishments
  const [draggedAccIndex, setDraggedAccIndex] = useState<number | null>(null);
  const [dragOverAccIndex, setDragOverAccIndex] = useState<number | null>(null);

  // Accomplishment editing state
  const [editingAccIndex, setEditingAccIndex] = useState<number | null>(null);
  const [editingAccText, setEditingAccText] = useState('');

  // Blockers state
  const [hasBlocker, setHasBlocker] = useState(false);
  const [blockersText, setBlockersText] = useState('');
  const [selectedBlockedTaskId, setSelectedBlockedTaskId] = useState<string>('');
  const [flaggedToManager, setFlaggedToManager] = useState(false);

  // Energy state
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(4); // 4 = HIGH
  const [energyContext, setEnergyContext] = useState('');

  const todayIso = new Date().toISOString().split('T')[0];
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if current user checked in today
  const myTodayEntry = useMemo(() => {
    return eodEntries.find(e => (e.userId === currentUser.id || e.userName === currentUser.name) && e.date === todayIso);
  }, [eodEntries, currentUser, todayIso]);

  // Pre-fill wizard if editing today's entry
  const handleOpenWizard = (prefill = true) => {
    if (prefill && myTodayEntry) {
      setAccomplishments(myTodayEntry.accomplishments || []);
      setSelectedCompletedTaskIds(myTodayEntry.completedTaskIds || []);
      const blockerPresent = Boolean(myTodayEntry.blockers && myTodayEntry.blockers.trim() && myTodayEntry.blockers.toLowerCase() !== 'no blockers');
      setHasBlocker(blockerPresent);
      setBlockersText(blockerPresent ? myTodayEntry.blockers : '');
      setSelectedBlockedTaskId(myTodayEntry.blockedTaskId || '');
      setFlaggedToManager(Boolean(myTodayEntry.flaggedToManager));
      setEnergyLevel(myTodayEntry.energyIndex || 4);
    } else {
      setSelectedCompletedTaskIds(tasks.filter(t => t.status === 'Done').map(t => t.id));
      setAccomplishments([]);
      setHasBlocker(false);
      setBlockersText('');
      setSelectedBlockedTaskId('');
      setFlaggedToManager(false);
      setEnergyLevel(4);
      setEnergyContext('');
    }
    setStep(1);
    setActiveView('wizard');
  };

  const handleAccDrop = (targetIdx: number) => {
    if (draggedAccIndex === null || draggedAccIndex === targetIdx) return;
    const newAccs = [...accomplishments];
    const [moved] = newAccs.splice(draggedAccIndex, 1);
    newAccs.splice(targetIdx, 0, moved);
    setAccomplishments(newAccs);
    setDraggedAccIndex(null);
    setDragOverAccIndex(null);
  };

  const handleCommitNewAccInput = () => {
    if (newAccInput.trim()) {
      setAccomplishments(prev => [...prev, newAccInput.trim()]);
      setNewAccInput('');
      return true;
    }
    return false;
  };

  const handleAddAccomplishment = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitNewAccInput();
    }
  };

  const handleGoToStep2 = () => {
    handleCommitNewAccInput();
    setStep(2);
  };

  const handleToggleCompletedTask = (taskId: string) => {
    setSelectedCompletedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleFinishPulse = async () => {
    // Include pending input if not empty
    let currentAccs = [...accomplishments];
    if (newAccInput.trim()) {
      currentAccs.push(newAccInput.trim());
      setAccomplishments(currentAccs);
      setNewAccInput('');
    }

    // Compile full list of accomplishments: completed task titles + custom ad-hoc items
    const selectedTaskTitles = tasks
      .filter(t => selectedCompletedTaskIds.includes(t.id))
      .map(t => `Completed: ${t.title}`);

    const finalAccomplishments = Array.from(new Set([
      ...selectedTaskTitles,
      ...currentAccs
    ]));

    const finalBlocker = hasBlocker ? blockersText.trim() : '';

    await submitEOD({
      date: todayIso,
      accomplishments: finalAccomplishments,
      completedTaskIds: selectedCompletedTaskIds,
      blockers: finalBlocker,
      blockedTaskId: hasBlocker && selectedBlockedTaskId ? selectedBlockedTaskId : undefined,
      energyIndex: energyLevel,
      flaggedToManager: hasBlocker && (flaggedToManager || Boolean(finalBlocker))
    });

    setStep(4);
  };

  // Filtered EOD Entries for Feed
  const filteredEntries = useMemo(() => {
    return eodEntries.filter(entry => {
      // Tab filter
      if (feedTab === 'my' && !(entry.userId === currentUser.id || entry.userName === currentUser.name)) {
        return false;
      }
      if (feedTab === 'blocked') {
        const hasBlocker = Boolean(entry.blockers && entry.blockers.trim() && entry.blockers.toLowerCase() !== 'no blockers');
        if (!hasBlocker) return false;
      }

      // Member filter
      if (selectedMemberFilter !== 'all') {
        if (entry.userId !== selectedMemberFilter && entry.userName !== selectedMemberFilter) {
          return false;
        }
      }

      // Date filter
      if (selectedDateFilter === 'today' && entry.date !== todayIso) return false;
      if (selectedDateFilter === 'yesterday' && entry.date !== yesterdayIso) return false;
      if (selectedDateFilter === 'week') {
        const entryTime = new Date(entry.date).getTime();
        const weekAgo = Date.now() - 7 * 86400000;
        if (entryTime < weekAgo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = entry.userName?.toLowerCase().includes(query);
        const matchesBlocker = entry.blockers?.toLowerCase().includes(query);
        const matchesAcc = entry.accomplishments?.some(a => a.toLowerCase().includes(query));
        if (!matchesName && !matchesBlocker && !matchesAcc) return false;
      }

      return true;
    });
  }, [eodEntries, feedTab, selectedMemberFilter, selectedDateFilter, searchQuery, currentUser, todayIso, yesterdayIso]);

  // Metric summaries
  const todayEntries = eodEntries.filter(e => e.date === todayIso);
  const activeBlockersCount = eodEntries.filter(e => e.blockers && e.blockers.trim() && e.blockers.toLowerCase() !== 'no blockers').length;
  const avgEnergy = eodEntries.length > 0 
    ? eodEntries.reduce((sum, e) => sum + (e.energyIndex || 3), 0) / eodEntries.length 
    : 4.5;
  const totalCompletedTasksCount = tasks.filter(t => t.status === 'Done').length;

  const getEnergyBadge = (energy: number) => {
    switch (energy) {
      case 5:
        return { label: '⚡ Peak (5/5)', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      case 4:
        return { label: '⚡ High (4/5)', style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' };
      case 3:
        return { label: '⚡ Steady (3/5)', style: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900' };
      case 2:
        return { label: '⚡ Low (2/5)', style: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900' };
      default:
        return { label: '⚡ Critical (1/5)', style: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-900' };
    }
  };

  return (
    <div className="space-y-6 font-sans text-neutral-900 dark:text-neutral-100 max-w-7xl mx-auto">
      {/* Top Header & Navigation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Daily Pulse & Standups
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Real-time visibility into daily execution, blockers, and cognitive bandwidth.
              </p>
            </div>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Sync pulse check-ins with database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {activeView === 'wizard' ? (
            <button
              onClick={() => setActiveView('feed')}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Team Feed</span>
            </button>
          ) : (
            <>
              {myTodayEntry ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
                    <Check className="w-3 h-3" /> Checked In Today
                  </span>
                  <button
                    onClick={() => handleOpenWizard(true)}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Today's Pulse</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenWizard(false)}
                  className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Today's Pulse</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        {/* Checked in Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Checked in Today</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">{todayEntries.length}</span>
            <span className="text-xs text-neutral-400">/ {Math.max(users.length, 1)} members</span>
          </div>
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all" 
              style={{ width: `${Math.min(100, Math.round((todayEntries.length / Math.max(users.length, 1)) * 100))}%` }} 
            />
          </div>
        </div>

        {/* Active Blockers */}
        <div 
          onClick={() => {
            setActiveView('feed');
            setFeedTab('blocked');
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-neutral-900 border shadow-xs space-y-1.5 cursor-pointer transition-all hover:border-neutral-400 dark:hover:border-neutral-700 ${
            activeBlockersCount > 0 
              ? 'border-red-300 dark:border-red-900/60 bg-red-50/20' 
              : 'border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeBlockersCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`}>
              Active Blockers
            </span>
            <ShieldAlert className={`w-3.5 h-3.5 ${activeBlockersCount > 0 ? 'text-red-500' : 'text-neutral-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${activeBlockersCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
              {activeBlockersCount}
            </span>
            <span className="text-[10px] text-neutral-400">
              {activeBlockersCount > 0 ? 'Action required' : 'All clear'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 hover:underline block">Filter blocked standups →</span>
        </div>

        {/* Team Energy Index */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Team Energy</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">{avgEnergy.toFixed(1)}</span>
            <span className="text-xs text-neutral-400">/ 5.0</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {avgEnergy >= 4 ? 'Optimal Velocity' : avgEnergy >= 3 ? 'Steady Pace' : 'Impeded Bandwidth'}
          </span>
        </div>

        {/* Completed Tasks Logged */}
        <div 
          onClick={() => {
            setActiveScreen('tasks');
            navigate(`/${currentOrgSlug || 'epicordia'}/tasks`, { state: { status: 'Done' } });
          }}
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1.5 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Completed Tasks</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">{totalCompletedTasksCount}</span>
            <span className="text-xs text-neutral-400">closed</span>
          </div>
          <span className="text-[10px] text-neutral-400 hover:underline block">Explore task board →</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE: WIZARD SUBMISSION (STEP 1, 2, 3, 4)                            */}
      {/* ========================================================================= */}
      {activeView === 'wizard' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-2 font-sans">
          {/* Step Progress Ticks Bar */}
          {step < 4 && (
            <div className="flex items-center gap-2 mb-6">
              <div className={`h-1.5 w-14 rounded-full transition-all ${step >= 1 ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
              <div className={`h-1.5 w-14 rounded-full transition-all ${step >= 2 ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
              <div className={`h-1.5 w-14 rounded-full transition-all ${step >= 3 ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
            </div>
          )}

          {/* STEP 1: ACCOMPLISHMENTS */}
          {step === 1 && (
            <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">What did you accomplish today?</h2>
                <p className="text-xs text-neutral-500">
                  Select completed workspace tasks and add ad-hoc wins to document your daily progress.
                </p>
              </div>

              {/* Completed Tasks Checkbox List */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Completed Tasks ({tasks.filter(t => t.status === 'Done').length})
                  </span>
                  <span className="text-[10px] text-neutral-400">Toggle to include in pulse</span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                  {tasks.filter(t => t.status === 'Done').length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center text-neutral-400 font-mono text-xs">
                      No tasks marked "Done" yet. Add your custom accomplishments below.
                    </div>
                  ) : (
                    tasks.filter(t => t.status === 'Done').map(t => {
                      const isSelected = selectedCompletedTaskIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleCompletedTask(t.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                              : 'bg-white dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              isSelected 
                                ? 'bg-emerald-600 border-emerald-600 text-white' 
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`font-semibold truncate ${isSelected ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}>
                              {t.title}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0 ml-2">
                            {t.projectName || 'Done'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Ad-hoc Accomplishments */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Custom Accomplishments ({accomplishments.length})
                  </span>

                  <div className="space-y-2">
                    {accomplishments.map((acc, idx) => {
                      const isDragging = draggedAccIndex === idx;
                      const isDragOver = dragOverAccIndex === idx;
                      const isEditing = editingAccIndex === idx;

                      return (
                        <div 
                          key={idx} 
                          draggable={!isEditing}
                          onDragStart={(e) => {
                            if (isEditing) return;
                            e.dataTransfer.setData('text/plain', idx.toString());
                            setDraggedAccIndex(idx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverAccIndex !== idx) setDragOverAccIndex(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverAccIndex === idx) setDragOverAccIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleAccDrop(idx);
                          }}
                          className={`p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 flex items-center justify-between transition-all group ${
                            isDragging ? 'opacity-30' : 'shadow-xs'
                          } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 mr-2 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-neutral-400 cursor-grab active:cursor-grabbing shrink-0" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingAccText}
                                  onChange={e => setEditingAccText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      if (editingAccText.trim()) {
                                        const updated = [...accomplishments];
                                        updated[idx] = editingAccText.trim();
                                        setAccomplishments(updated);
                                        setEditingAccIndex(null);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingAccIndex(null);
                                    }
                                  }}
                                  className="flex-1 px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingAccText.trim()) {
                                      const updated = [...accomplishments];
                                      updated[idx] = editingAccText.trim();
                                      setAccomplishments(updated);
                                      setEditingAccIndex(null);
                                    }
                                  }}
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{acc}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-400">
                              Ad-hoc
                            </span>
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccIndex(idx);
                                  setEditingAccText(acc);
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                                title="Edit accomplishment"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setAccomplishments(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              title="Delete accomplishment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add accomplishment input with explicit + Add button */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">+</span>
                      <input
                        type="text"
                        value={newAccInput}
                        onChange={e => setNewAccInput(e.target.value)}
                        onKeyDown={handleAddAccomplishment}
                        placeholder="Type a custom accomplishment and press Enter..."
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCommitNewAccInput}
                      disabled={!newAccInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveView('feed')}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:text-black dark:hover:text-white font-mono text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGoToStep2}
                  className="py-2.5 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Next: Blockers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BLOCKERS */}
          {step === 2 && (
            <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm space-y-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Any blockers today?</h2>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Flag impediments or dependencies. We'll alert your lead so you get unblocked swiftly.
                </p>
              </div>

              {/* Blockers toggle */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHasBlocker(false);
                    setBlockersText('');
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    !hasBlocker 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs' 
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>No Blockers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasBlocker(true)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    hasBlocker 
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold shadow-xs' 
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>I'm Blocked</span>
                </button>
              </div>

              {hasBlocker && (
                <div className="space-y-3.5 text-left font-mono text-xs pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Describe the Blocker
                    </label>
                    <textarea
                      rows={3}
                      value={blockersText}
                      onChange={e => setBlockersText(e.target.value)}
                      placeholder="e.g. Waiting on API credentials from DevOps team, or design approval..."
                      className="w-full p-3.5 rounded-xl border border-red-300 dark:border-red-900/80 bg-red-50/30 dark:bg-red-950/20 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Link task dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Link Blocked Task (Optional)
                    </label>
                    <select
                      value={selectedBlockedTaskId}
                      onChange={e => setSelectedBlockedTaskId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                    >
                      <option value="">-- No specific task linked --</option>
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                      ))}
                    </select>
                  </div>

                  {/* Flag to manager checkbox */}
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flaggedToManager}
                      onChange={e => setFlaggedToManager(e.target.checked)}
                      className="rounded border-neutral-300 dark:border-neutral-700 text-black"
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300">
                      Flag as high-priority notification to team lead / manager
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-neutral-400 text-[10px]">STEP 2 OF 3</span>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Next: Energy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ENERGY INDEX */}
          {step === 3 && (
            <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm space-y-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                <Zap className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Energy & Focus Index</h2>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Assess your cognitive bandwidth and physical capacity for deep execution.
                </p>
              </div>

              {/* 5 Battery Level Boxes */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 pt-2">
                {[
                  { level: 1, label: 'CRIT', fullLabel: 'CRITICAL', desc: 'Exhausted / Blocked' },
                  { level: 2, label: 'LOW', fullLabel: 'LOW', desc: 'Low Focus' },
                  { level: 3, label: 'STEADY', fullLabel: 'STEADY', desc: 'Moderate Pace' },
                  { level: 4, label: 'HIGH', fullLabel: 'HIGH', desc: 'Productive' },
                  { level: 5, label: 'PEAK', fullLabel: 'PEAK', desc: 'Flow State' }
                ].map(item => {
                  const isSelected = energyLevel === item.level;
                  return (
                    <div
                      key={item.level}
                      onClick={() => setEnergyLevel(item.level as any)}
                      className={`p-2.5 sm:p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 ${
                        isSelected
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <BatteryCharging className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-400'}`} />
                      <span className="text-[9px] font-mono font-bold tracking-wider">{item.fullLabel}</span>
                      <span className="text-[8px] opacity-70 hidden sm:block font-sans">{item.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Context Input */}
              <div className="text-left space-y-1 font-mono text-xs">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Context Note (Optional)</span>
                <textarea
                  rows={2}
                  value={energyContext}
                  onChange={e => setEnergyContext(e.target.value)}
                  placeholder="Optional brief reflection on today's focus factors..."
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishPulse}
                  className="py-3 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Submit Daily Pulse</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CHECK-IN COMPLETE CONFIRMATION */}
          {step === 4 && (
            <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm space-y-6 text-center font-sans">
              <div className="w-14 h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Check-in Complete</h2>
                <p className="text-xs text-neutral-500">
                  Your Daily Pulse has been recorded in the workspace and synced with your team feed.
                </p>
              </div>

              <div className="space-y-3.5 text-left font-mono text-xs">
                {/* Accomplishments Breakdown */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Key Accomplishments ({selectedCompletedTaskIds.length + accomplishments.length})
                  </span>
                  <ul className="space-y-1 text-neutral-600 dark:text-neutral-300 text-[11px] font-sans">
                    {tasks.filter(t => selectedCompletedTaskIds.includes(t.id)).map(t => (
                      <li key={t.id} className="flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>[Task] {t.title}</span>
                      </li>
                    ))}
                    {accomplishments.map((acc, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{acc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Blockers & Energy Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" /> Blockers Raised
                    </span>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px] font-sans">
                      {hasBlocker && blockersText ? blockersText : 'None reported (Smooth progress).'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                      <BatteryCharging className="w-3.5 h-3.5 text-neutral-600" /> Energy Index
                    </span>
                    <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mt-1.5">
                      <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${(energyLevel / 5) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block pt-0.5">
                      {energyLevel === 5 ? 'Peak' : energyLevel === 4 ? 'High' : energyLevel === 3 ? 'Steady' : 'Low'} ({energyLevel}/5)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                >
                  ✏️ Edit Submission
                </button>
                <button
                  onClick={() => setActiveView('feed')}
                  className="flex-1 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  View in Team Feed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: TEAM STANDUPS & CHECK-INS FEED                                 */}
      {/* ========================================================================= */}
      {activeView === 'feed' && (
        <div className="space-y-5">
          {/* Feed Toolbar & Filter Tabs */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
            {/* Tab selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setFeedTab('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  feedTab === 'all'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Check-ins ({eodEntries.length})
              </button>

              <button
                onClick={() => setFeedTab('my')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  feedTab === 'my'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                My Check-ins
              </button>

              <button
                onClick={() => setFeedTab('blocked')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  feedTab === 'blocked'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Blocked ({activeBlockersCount})</span>
              </button>
            </div>

            {/* Filter Search & Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search standups..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* Date Filter */}
              <select
                value={selectedDateFilter}
                onChange={e => setSelectedDateFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past 7 Days</option>
              </select>

              {/* Member Filter */}
              <select
                value={selectedMemberFilter}
                onChange={e => setSelectedMemberFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] focus:outline-none"
              >
                <option value="all">All Teammates</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Standup Entries Feed */}
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3 font-mono text-xs">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">No standups match your current filter</p>
                <p className="text-neutral-400 text-[11px]">
                  Submit your daily pulse or adjust your search parameters to view team telemetry.
                </p>
              </div>
              <button
                onClick={() => handleOpenWizard(false)}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit Today's Pulse
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map(entry => {
                const entryUser = users.find(u => u.id === entry.userId || u.name === entry.userName);
                const displayName = entryUser?.name || entry.userName || 'Team Member';
                const displayAvatar = entryUser?.avatarUrl || entry.userAvatar;
                const displayRole = entryUser?.role || entry.userRole || 'Member';
                const displayTeam = entryUser?.teamName || entry.teamName || 'Operations';
                const hasActiveBlocker = Boolean(entry.blockers && entry.blockers.trim() && entry.blockers.toLowerCase() !== 'no blockers');
                const linkedBlockedTask = entry.blockedTaskId ? tasks.find(t => t.id === entry.blockedTaskId) : undefined;
                const isAuthor = entry.userId === currentUser.id || entry.userName === currentUser.name;
                const energyBadge = getEnergyBadge(entry.energyIndex || 3);

                return (
                  <div
                    key={entry.id}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Row: User Meta, Energy Badge, Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => {
                          if (entryUser) pushPanel({ type: 'person', id: entryUser.id });
                        }}
                      >
                        <UserAvatar name={displayName} avatarUrl={displayAvatar} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline text-sm">
                              {displayName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {displayRole}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-neutral-400 mt-0.5 block">
                            {displayTeam} • {entry.date === todayIso ? 'Today' : entry.date === yesterdayIso ? 'Yesterday' : entry.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        {/* Energy Badge */}
                        <span className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${energyBadge.style}`}>
                          {energyBadge.label}
                        </span>

                        {isAuthor && entry.date === todayIso && (
                          <button
                            onClick={() => handleOpenWizard(true)}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Edit your check-in for today"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this check-in?')) {
                              deleteEOD(entry.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Delete check-in"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Section: Accomplishments */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                        Accomplishments & Completed Work
                      </span>

                      {/* Accomplishment Bullet items */}
                      {entry.accomplishments && entry.accomplishments.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-sans">
                          {entry.accomplishments.map((acc, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                              <span className="leading-relaxed">{acc}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (!entry.completedTaskIds || entry.completedTaskIds.length === 0) ? (
                        <div className="text-xs text-neutral-400 italic">
                          No specific accomplishments listed.
                        </div>
                      ) : null}

                      {/* Referenced Completed Tasks Pills */}
                      {entry.completedTaskIds && entry.completedTaskIds.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-xs">
                          <span className="text-[10px] text-neutral-400">Linked Tasks:</span>
                          {entry.completedTaskIds.map(taskId => {
                            const refTask = tasks.find(t => t.id === taskId);
                            return (
                              <button
                                key={taskId}
                                onClick={() => pushPanel({ type: 'task', id: taskId })}
                                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                title={refTask?.title || taskId}
                              >
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[180px]">{refTask?.title || 'Done Task'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Blockers */}
                    <div>
                      {hasActiveBlocker ? (
                        <div className="p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-1.5">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-300">
                              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                              <span>Active Blocker Reported</span>
                            </div>
                            {entry.flaggedToManager && (
                              <span className="px-2 py-0.5 rounded text-[9px] bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold uppercase">
                                Flagged to Manager
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-sans text-red-900 dark:text-red-200 leading-relaxed pl-5">
                            {entry.blockers}
                          </p>

                          {linkedBlockedTask && (
                            <div className="pl-5 pt-1 font-mono text-xs">
                              <button
                                onClick={() => pushPanel({ type: 'task', id: linkedBlockedTask.id })}
                                className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-[10px] hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Blocked Task: {linkedBlockedTask.title}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>No blockers reported • Full velocity</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
