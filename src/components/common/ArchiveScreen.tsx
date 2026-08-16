import React from 'react';
import { Archive } from 'lucide-react';

export const ArchiveScreen: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Workspace Archive</h1>
          <p className="text-xs text-neutral-500">Completed sprints, archived projects, and historic performance logs.</p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
        <Archive className="w-10 h-10 text-neutral-400 mx-auto" />
        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Archived Repository</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          All historic projects and completed sprint logs are automatically retained here for SOC2 compliance.
        </p>
      </div>
    </div>
  );
};
