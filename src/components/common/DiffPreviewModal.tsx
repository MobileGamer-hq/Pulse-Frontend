import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, X, ShieldAlert, ArrowRight, Layers } from 'lucide-react';
import { type DryRunDiff, aiService } from '../../services/aiService';

interface DiffPreviewModalProps {
  diff: DryRunDiff;
  userRole?: string;
  onConfirmed: (undoToken: string) => void;
  onCancelled: () => void;
}

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({
  diff,
  userRole,
  onConfirmed,
  onCancelled,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApply = async () => {
    setIsApplying(true);
    setErrorMsg(null);
    try {
      const res = await aiService.confirmDryRun({
        dryRunId: diff.dryRunId,
        userRole: userRole || 'Member',
      });
      onConfirmed(res.undoToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply changes.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Dry-Run Diff Preview
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                  {diff.affectedCount} item{diff.affectedCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{diff.summary}</p>
            </div>
          </div>
          <button
            onClick={onCancelled}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Risk Warnings */}
          {diff.warnings && diff.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Schedule &amp; Dependency Risks Detected</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-neutral-600 dark:text-neutral-300 text-[11px] pl-1 font-mono">
                {diff.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Proposed Field-Level Changes */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              Proposed Changes ({diff.changes.length})
            </span>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {diff.changes.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate text-xs">
                      {c.label}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      {c.entityType} • {c.field}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                    <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 line-through">
                      {String(c.fromValue || 'None')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                      {String(c.toValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="text-[11px] text-neutral-500 font-mono">
            Requires Manager or Admin confirmation
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancelled}
              disabled={isApplying}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-bold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white transition-colors font-bold text-xs shadow-xs"
            >
              {isApplying ? (
                <span>Applying...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Apply Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
