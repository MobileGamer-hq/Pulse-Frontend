import React from 'react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, BookOpen, MessageSquare, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const SupportModal: React.FC = () => {
  const { activeScreen, setActiveScreen } = useApp();

  if (activeScreen !== 'support') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveScreen('dashboard')} className="fixed inset-0 drawer-overlay" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 z-10 text-xs font-sans space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100">
              <HelpCircle className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
              Support & Help Desk
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Pulse by Epicordia</span>
          </div>
          <button onClick={() => setActiveScreen('dashboard')} className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">Knowledge Base & Guides</div>
              <p className="text-neutral-500 text-[11px] mt-0.5">Learn how to configure workflows, set up OKR rollups, and manage tag swatches in Pulse by Epicordia.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">24/7 Priority Support Chat</div>
              <p className="text-neutral-500 text-[11px] mt-0.5">Reach out to our dedicated support architects for workspace migration help.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 font-mono">© Epicordia Inc. All rights reserved.</span>
          <button onClick={() => setActiveScreen('dashboard')} className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono font-bold rounded-lg text-xs">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
