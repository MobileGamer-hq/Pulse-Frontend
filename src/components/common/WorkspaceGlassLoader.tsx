import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { PulseLogo } from './PulseLogo';

interface WorkspaceGlassLoaderProps {
  message?: string;
  subMessage?: string;
}

export const WorkspaceGlassLoader: React.FC<WorkspaceGlassLoaderProps> = ({
  message,
  subMessage = 'Aligning workspace tasks, projects & team pulse...'
}) => {
  const { currentOrgName } = useApp();

  return (
    <motion.div
      key="workspace-glass-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/45 dark:bg-neutral-950/65 backdrop-blur-md p-4 select-none pointer-events-auto"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Floating Glassmorphism Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 max-w-sm w-full bg-white/80 dark:bg-neutral-900/85 backdrop-blur-2xl border border-white/60 dark:border-neutral-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center gap-5"
      >
        {/* Ambient Subtle Radial Glows inside glass container */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/15 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/15 dark:bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Pulse Logo Badge with pulsating wave */}
        <div className="relative flex items-center justify-center mt-1">
          {/* Pulsing radar waves */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.08, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-neutral-900/10 dark:bg-white/15"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="absolute inset-0 rounded-full bg-neutral-900/15 dark:bg-white/20"
          />

          {/* Center Brand Icon */}
          <div className="w-14 h-14 rounded-full bg-neutral-900/5 dark:bg-white/5 flex items-center justify-center p-1 shadow-xl relative z-10">
            <PulseLogo size="2xl" className="w-full h-full" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5 z-10">
          <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 tracking-tight">
            {message || `Loading ${currentOrgName}`}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed max-w-xs">
            {subMessage}
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-full overflow-hidden relative shadow-inner z-10">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-neutral-900 dark:via-white to-transparent rounded-full opacity-90"
          />
        </div>

        {/* Live Status Indicator Footer */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 z-10 pt-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">Syncing real-time workspace</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
