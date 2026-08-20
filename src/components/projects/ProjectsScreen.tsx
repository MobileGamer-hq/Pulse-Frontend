import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { ExportDropdown } from '../common/ExportDropdown';
import { 
  Search, Plus, LayoutGrid, List, ChevronDown, 
  Target, CheckCircle2, GripVertical 
} from 'lucide-react';

export const ProjectsScreen: React.FC = () => {
  const { pushPanel, projects, reorderProjects } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [deptFilter, setDeptFilter] = useState('Engineering');
  const [ownerFilter, setOwnerFilter] = useState('All');

  // Convert AppContext projects or default projects list
  const INITIAL_PROJECT_ITEMS = projects.length > 0 ? projects.map(p => ({
    id: p.id,
    code: p.id.toUpperCase(),
    name: p.name,
    status: p.status,
    progress: p.status === 'Completed' ? 100 : p.status === 'Active' ? 68 : 12,
    avatars: ['Sarah Jenkins', 'Alex Chen'],
    extraAvatars: 2,
    targetCount: 2,
    doneCount: 8
  })) : [
    {
      id: 'PRJ-092',
      code: 'PRJ-092',
      name: 'Q3 Architecture Refactor',
      status: 'Active',
      progress: 68,
      avatars: ['Sarah Jenkins', 'Alex Chen'],
      extraAvatars: 3,
      targetCount: 2,
      doneCount: 14
    },
    {
      id: 'PRJ-104',
      code: 'PRJ-104',
      name: 'Data Pipeline Optimization',
      status: 'Planning',
      progress: 12,
      avatars: ['Elena Rostova'],
      extraAvatars: 0,
      targetCount: 1,
      doneCount: 4
    },
    {
      id: 'PRJ-088',
      code: 'PRJ-088',
      name: 'Legacy System Audit',
      status: 'Completed',
      progress: 100,
      avatars: ['Marcus Vance'],
      extraAvatars: 1,
      targetCount: 3,
      doneCount: 0
    }
  ];

  const [projectItems, setProjectItems] = useState(INITIAL_PROJECT_ITEMS);
  const [draggedPrjId, setDraggedPrjId] = useState<string | null>(null);
  const [dragOverPrjId, setDragOverPrjId] = useState<string | null>(null);

  const handleProjectDrop = (targetId: string) => {
    if (!draggedPrjId || draggedPrjId === targetId) return;
    const fromIndex = projectItems.findIndex(p => p.id === draggedPrjId);
    const toIndex = projectItems.findIndex(p => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newItems = [...projectItems];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setProjectItems(newItems);

    const reorderedPrjs = [...projects];
    if (fromIndex < reorderedPrjs.length && toIndex < reorderedPrjs.length) {
      const [movedP] = reorderedPrjs.splice(fromIndex, 1);
      reorderedPrjs.splice(toIndex, 0, movedP);
      reorderProjects(reorderedPrjs);
    }

    setDraggedPrjId(null);
    setDragOverPrjId(null);
  };

  const filteredProjects = projectItems.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Project Roster</h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">Active monitoring of 24 concurrent initiatives.</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            filename="pulse_projects_export"
            title="Pulse Project Roster Report"
            data={filteredProjects.map(p => ({
              Code: p.code,
              Name: p.name,
              Status: p.status,
              Progress: `${p.progress}%`,
              TasksDone: p.doneCount
            }))}
          />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'project' } }))}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Project
          </button>
        </div>
      </div>

      {/* Filter Bar Controls matching Screenshot 2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
        <div className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID or nomenclature..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none px-3.5 py-1.5 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="Active">Status: Active</option>
              <option value="Planning">Status: Planning</option>
              <option value="Completed">Status: Completed</option>
              <option value="All">Status: All</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="appearance-none px-3.5 py-1.5 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="Engineering">Dept: Engineering</option>
              <option value="Product">Dept: Product</option>
              <option value="Design">Dept: Design</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
              className="appearance-none px-3.5 py-1.5 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="All">Owner: All</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs' : 'text-neutral-400'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs' : 'text-neutral-400'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View of Projects matching Screenshot 2 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-mono">
          {filteredProjects.map(prj => {
            const isDragging = draggedPrjId === prj.id;
            const isDragOver = dragOverPrjId === prj.id;

            return (
              <div
                key={prj.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', prj.id);
                  setDraggedPrjId(prj.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverPrjId !== prj.id) setDragOverPrjId(prj.id);
                }}
                onDragLeave={() => {
                  if (dragOverPrjId === prj.id) setDragOverPrjId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleProjectDrop(prj.id);
                }}
                onClick={() => pushPanel({ type: 'project', id: prj.id })}
                className={`p-5 rounded-2xl bg-white dark:bg-neutral-900 border space-y-4 cursor-grab active:cursor-grabbing hover:border-neutral-400 transition-all ${
                  isDragging ? 'opacity-30' : 'shadow-sm'
                } ${isDragOver ? 'border-2 border-black dark:border-white ring-2 ring-black/10' : 'border-neutral-200 dark:border-neutral-800'}`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1.5 text-neutral-400 font-bold">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span>{prj.code}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    prj.status === 'Active' ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' :
                    prj.status === 'Planning' ? 'bg-neutral-50 text-neutral-600 border border-neutral-200' :
                    'bg-neutral-100 text-neutral-700 border border-neutral-300'
                  }`}>
                    {prj.status === 'Active' ? '• Active' : prj.status === 'Planning' ? '○ Planning' : '✓ Completed'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug font-sans">
                  {prj.name}
                </h3>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
                    <span>Progress</span>
                    <span>{prj.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${prj.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center -space-x-1.5">
                    {prj.avatars.map((name, i) => (
                      <UserAvatar key={i} name={name} size="xs" />
                    ))}
                    {prj.extraAvatars > 0 && (
                      <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center text-[8px] font-bold text-neutral-600 dark:text-neutral-400">
                        +{prj.extraAvatars}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-neutral-400" /> {prj.targetCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-neutral-400" /> {prj.doneCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm font-mono">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
              <tr>
                <th className="pb-2 w-8 text-center" aria-label="Drag handle"></th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Project Name</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProjects.map(p => {
                const isDragging = draggedPrjId === p.id;
                const isDragOver = dragOverPrjId === p.id;

                return (
                  <tr 
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', p.id);
                      setDraggedPrjId(p.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverPrjId !== p.id) setDragOverPrjId(p.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverPrjId === p.id) setDragOverPrjId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleProjectDrop(p.id);
                    }}
                    className={`cursor-pointer transition-all ${
                      isDragging ? 'opacity-30 bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40'
                    } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`} 
                    onClick={() => pushPanel({ type: 'project', id: p.id })}
                  >
                    <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <GripVertical className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 cursor-grab active:cursor-grabbing mx-auto" />
                    </td>
                    <td className="py-3 font-bold text-neutral-900 dark:text-neutral-100">{p.code}</td>
                    <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">{p.progress}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
