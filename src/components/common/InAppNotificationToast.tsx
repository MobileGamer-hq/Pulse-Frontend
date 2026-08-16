import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { 
  Bell, Activity, Calendar, CheckSquare, AlertTriangle, 
  X, ArrowRight, Clock 
} from 'lucide-react';
import type { DrawerPanel } from '../../types';

export interface ToastAlert {
  id: string;
  category: 'pulse' | 'meeting' | 'task' | 'blocker' | 'custom';
  title: string;
  message: string;
  timeLabel?: string;
  actionLabel: string;
  targetScreen?: string;
  targetPanel?: DrawerPanel;
}

const SAMPLE_ALERTS: ToastAlert[] = [
  {
    id: 'toast-pulse-1',
    category: 'pulse',
    title: 'Daily Pulse Check-in',
    message: 'Time for your end-of-day reflection! Share today’s blockers & wins with your team.',
    timeLabel: 'Scheduled Now',
    actionLabel: 'Check In Now',
    targetScreen: 'pulse'
  },
  {
    id: 'toast-meeting-1',
    category: 'meeting',
    title: 'Upcoming Sprint Planning',
    message: 'Architecture & Q3 Roadmap Sync starting in 5 minutes with Engineering & Product.',
    timeLabel: 'In 5 minutes',
    actionLabel: 'Join Meeting',
    targetScreen: 'dashboard'
  },
  {
    id: 'toast-task-1',
    category: 'task',
    title: 'Task Deadline Alert',
    message: 'TSK-892 (Database Migration Script) is due in 1 hour.',
    timeLabel: 'Due 5:00 PM',
    actionLabel: 'View Task',
    targetPanel: { type: 'task', id: 'TSK-892' }
  },
  {
    id: 'toast-blocker-1',
    category: 'blocker',
    title: 'Critical Blocker Flagged',
    message: 'James Smith flagged Node A capacity blocker on Enterprise Data Sync.',
    timeLabel: 'Just now',
    actionLabel: 'Triage Alert',
    targetScreen: 'notifications'
  }
];

export const InAppNotificationToast: React.FC = () => {
  const { setActiveScreen, pushPanel } = useApp();
  const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);

  // Automatically trigger initial toast after 2.5 seconds for seamless demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveToast(SAMPLE_ALERTS[0]);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Listen for custom trigger events from anywhere in the app
  useEffect(() => {
    const handleCustomTrigger = (e: CustomEvent<ToastAlert>) => {
      if (e.detail) {
        setActiveToast(e.detail);
      } else {
        // Cycle through demo alerts
        const nextAlert = SAMPLE_ALERTS[(queueIndex + 1) % SAMPLE_ALERTS.length];
        setQueueIndex(prev => (prev + 1) % SAMPLE_ALERTS.length);
        setActiveToast(nextAlert);
      }
    };

    window.addEventListener('pulse:trigger-toast' as any, handleCustomTrigger);
    return () => window.removeEventListener('pulse:trigger-toast' as any, handleCustomTrigger);
  }, [queueIndex]);

  const handleDismiss = () => {
    setActiveToast(null);
  };

  const handleExecuteAction = () => {
    if (!activeToast) return;

    if (activeToast.targetScreen) {
      setActiveScreen(activeToast.targetScreen);
    }
    if (activeToast.targetPanel) {
      pushPanel(activeToast.targetPanel);
    }

    setActiveToast(null);
  };

  const handleSnooze = () => {
    setActiveToast(null);
    // Re-trigger in 10s for demo snooze
    setTimeout(() => {
      setActiveToast(activeToast);
    }, 10000);
  };

  const getCategoryIcon = (category: ToastAlert['category']) => {
    switch (category) {
      case 'pulse':
        return <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'blocker':
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getCategoryBadgeClass = (category: ToastAlert['category']) => {
    switch (category) {
      case 'pulse':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'meeting':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'task':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'blocker':
        return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3 font-sans text-xs"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl border flex items-center justify-center ${getCategoryBadgeClass(activeToast.category)}`}>
                {getCategoryIcon(activeToast.category)}
              </div>
              <div>
                <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <span>{activeToast.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                {activeToast.timeLabel && (
                  <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{activeToast.timeLabel}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Body */}
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans pl-1">
            {activeToast.message}
          </p>

          {/* Footer Action Buttons */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between font-mono">
            <button
              onClick={handleSnooze}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-[11px] font-semibold transition-colors"
            >
              Snooze 10m
            </button>

            <button
              onClick={handleExecuteAction}
              className="px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <span>{activeToast.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
