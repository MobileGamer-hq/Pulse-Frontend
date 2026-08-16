import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, BatteryCharging, ArrowRight, ArrowLeft, 
  ShieldAlert, Zap, GripVertical 
} from 'lucide-react';

export const DailyPulseScreen: React.FC = () => {
  const { tasks, submitEOD, setActiveScreen } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Accomplishments state
  const [accomplishments, setAccomplishments] = useState<string[]>([
    'Finalize Q3 Marketing Strategy Draft',
    'Client Sync: Alpha Corp'
  ]);
  const [newAccInput, setNewAccInput] = useState('');

  // Drag and Drop state for accomplishments
  const [draggedAccIndex, setDraggedAccIndex] = useState<number | null>(null);
  const [dragOverAccIndex, setDragOverAccIndex] = useState<number | null>(null);

  const handleAccDrop = (targetIdx: number) => {
    if (draggedAccIndex === null || draggedAccIndex === targetIdx) return;
    const newAccs = [...accomplishments];
    const [moved] = newAccs.splice(draggedAccIndex, 1);
    newAccs.splice(targetIdx, 0, moved);
    setAccomplishments(newAccs);
    setDraggedAccIndex(null);
    setDragOverAccIndex(null);
  };

  // Blockers state
  const [blockersText, setBlockersText] = useState('');

  // Energy state
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(3); // 3 = MODERATE
  const [energyContext, setEnergyContext] = useState('');

  const handleAddAccomplishment = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newAccInput.trim()) {
      e.preventDefault();
      setAccomplishments(prev => [...prev, newAccInput.trim()]);
      setNewAccInput('');
    }
  };

  const handleFinishPulse = () => {
    submitEOD({
      date: new Date().toISOString().split('T')[0],
      accomplishments: accomplishments.length > 0 ? accomplishments : ['Worked on scheduled tasks.'],
      completedTaskIds: tasks.filter(t => t.status === 'Done').map(t => t.id),
      blockers: blockersText,
      energyIndex: energyLevel,
      flaggedToManager: Boolean(blockersText.trim())
    });
    setStep(4);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 font-sans text-neutral-900 dark:text-neutral-100">
      {/* Step Progress Ticks Bar */}
      {step < 4 && (
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
          <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
          <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 3 ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
        </div>
      )}

      {/* STEP 1: ACCOMPLISHMENTS matching Screenshot 2 */}
      {step === 1 && (
        <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">What did you accomplish today?</h2>
            <p className="text-xs text-neutral-500">Review your completed tasks or add ad-hoc accomplishments to build your daily pulse.</p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Completed Tasks</span>
            
            <div className="space-y-3">
              {accomplishments.map((acc, idx) => {
                const isDragging = draggedAccIndex === idx;
                const isDragOver = dragOverAccIndex === idx;

                return (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => {
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
                    className={`p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between transition-all cursor-grab active:cursor-grabbing ${
                      isDragging ? 'opacity-30' : 'shadow-xs'
                    } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
                      <div className="w-4 h-4 rounded-full bg-black dark:bg-white" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{acc}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {idx === 0 ? 'Strategy' : 'Meetings'}
                    </span>
                  </div>
                );
              })}

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shadow-xs opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400" />
                  <span>Review updated UI assets from design team</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Design
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">Add Accomplishment</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">+</span>
                <input
                  type="text"
                  value={newAccInput}
                  onChange={e => setNewAccInput(e.target.value)}
                  onKeyDown={handleAddAccomplishment}
                  placeholder="Type here and press enter..."
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="py-3 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BLOCKERS matching Screenshot 3 */}
      {step === 2 && (
        <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Any blockers?</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Describe what's holding you back. Flags will instantly alert your manager to assist.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <textarea
              rows={4}
              value={blockersText}
              onChange={e => setBlockersText(e.target.value)}
              placeholder="I am currently blocked on..."
              className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
            />

            <span className="text-[11px] font-mono text-neutral-400 block cursor-pointer hover:underline">
              # Tag related task (optional)
            </span>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs font-mono">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className="text-neutral-400 text-[10px]">STEP 2 OF 3</span>
            <button
              onClick={() => setStep(3)}
              className="py-2.5 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ENERGY INDEX matching Screenshot 4 */}
      {step === 3 && (
        <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 flex items-center justify-center mx-auto text-xl font-bold">
            <Zap className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Energy Index</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Assess your current cognitive and physical capacity for deep work.
            </p>
          </div>

          {/* 5 Battery Level Boxes */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3 pt-2">
            {[
              { level: 1, label: 'V.LOW', fullLabel: 'VERY LOW' },
              { level: 2, label: 'LOW', fullLabel: 'LOW' },
              { level: 3, label: 'MOD', fullLabel: 'MODERATE' },
              { level: 4, label: 'HIGH', fullLabel: 'HIGH' },
              { level: 5, label: 'EXC', fullLabel: 'EXCELLENT' }
            ].map(item => {
              const isSelected = energyLevel === item.level;
              return (
                <div
                  key={item.level}
                  onClick={() => setEnergyLevel(item.level as any)}
                  className={`p-2 sm:p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 sm:space-y-2 ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <BatteryCharging className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-400'}`} />
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-tighter sm:tracking-wider sm:inline hidden">{item.fullLabel}</span>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-tighter sm:hidden">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Context Input */}
          <div className="text-left space-y-1 font-mono text-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Context (Optional)</span>
            <textarea
              rows={2}
              value={energyContext}
              onChange={e => setEnergyContext(e.target.value)}
              placeholder="Briefly note any factors impacting your energy..."
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center font-mono text-xs">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleFinishPulse}
              className="py-3 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Finish Pulse ✓
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CHECK-IN COMPLETE CONFIRMATION matching Screenshot 5 */}
      {step === 4 && (
        <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-8 shadow-sm space-y-6 text-center font-sans">
          <div className="w-14 h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
            ✓
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Check-in Complete</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Your Daily Pulse has been recorded. Here is a summary of your submission.
            </p>
          </div>

          <div className="space-y-4 text-left font-mono text-xs">
            {/* Key Accomplishments Summary */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                ✓ Key Accomplishments
              </span>
              <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-1">
                {accomplishments.map((acc, idx) => (
                  <li key={idx}>{acc}</li>
                ))}
              </ul>
            </div>

            {/* Blockers & Energy Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" /> Blockers Raised
                </span>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  {blockersText || 'None reported.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                  <BatteryCharging className="w-3.5 h-3.5 text-neutral-600" /> Energy Level
                </span>
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mt-2">
                  <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${(energyLevel / 5) * 100}%` }} />
                </div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block pt-1">
                  {energyLevel === 5 ? 'Excellent' : energyLevel === 4 ? 'High' : 'Moderate'} ({energyLevel}/5)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveScreen('dashboard')}
            className="w-full py-3.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
