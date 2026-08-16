import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EntityLink } from './EntityLink';
import { Search, X, FolderGit2, CheckSquare, Target, Tag as TagIcon, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, users, projects, tasks, goals, tags } = useApp();
  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingUsers = q ? users.filter(u => u.name.toLowerCase().includes(q) || u.title.toLowerCase().includes(q)) : [];
  const matchingProjects = q ? projects.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) : [];
  const matchingTasks = q ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : [];
  const matchingGoals = q ? goals.filter(g => g.title.toLowerCase().includes(q)) : [];
  const matchingTags = q ? tags.filter(t => t.name.toLowerCase().includes(q)) : [];

  const totalResults = matchingUsers.length + matchingProjects.length + matchingTasks.length + matchingGoals.length + matchingTags.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsSearchOpen(false)}
        className="fixed inset-0 drawer-overlay"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 mx-4"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Global search people, projects, tasks, goals, tags... (Ctrl+K)"
            className="w-full text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="text-center py-8 text-neutral-400 text-xs">
              Type anything to search across all connected entities in Pulse.
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No matching entity found for "{query}".
            </div>
          )}

          {matchingTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Tasks ({matchingTasks.length})
              </div>
              <div className="space-y-1.5">
                {matchingTasks.map(t => (
                  <div key={t.id} onClick={() => setIsSearchOpen(false)}>
                    <EntityLink type="task" id={t.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingProjects.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5" /> Projects ({matchingProjects.length})
              </div>
              <div className="space-y-1.5">
                {matchingProjects.map(p => (
                  <div key={p.id} onClick={() => setIsSearchOpen(false)}>
                    <EntityLink type="project" id={p.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingUsers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> People ({matchingUsers.length})
              </div>
              <div className="space-y-1.5">
                {matchingUsers.map(u => (
                  <div key={u.id} onClick={() => setIsSearchOpen(false)}>
                    <EntityLink type="person" id={u.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingGoals.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> OKR Goals ({matchingGoals.length})
              </div>
              <div className="space-y-1.5">
                {matchingGoals.map(g => (
                  <div key={g.id} onClick={() => setIsSearchOpen(false)}>
                    <EntityLink type="goal" id={g.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingTags.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5" /> Tags ({matchingTags.length})
              </div>
              <div className="space-y-1.5">
                {matchingTags.map(tg => (
                  <div key={tg.id} onClick={() => setIsSearchOpen(false)}>
                    <EntityLink type="tag" id={tg.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
