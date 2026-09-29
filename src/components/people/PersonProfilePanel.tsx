import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowUpRight, CheckCircle2, 
  Users, AlertCircle, X, UserX,
  Edit2, Check, AlertTriangle
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface PersonProfilePanelProps {
  id: string;
}

export const PersonProfilePanel: React.FC<PersonProfilePanelProps> = ({ id }) => {
  const { 
    users, teams, currentUser, tasks, projects, eodEntries, 
    addMemberToTeam, removeMemberFromTeam, removeMemberFromOrg, 
    closeAllPanels, pushPanel, currentOrgName,
    workloadSettings, updateUser, activeRole
  } = useApp();

  const fallbackUser = currentUser || {
    id: id || 'usr-me',
    orgId: 'epicordia',
    email: localStorage.getItem('pulse_user_email') || 'admin@pulse.app',
    name: localStorage.getItem('pulse_user_name') || 'Workspace Member',
    role: 'Admin',
    teamId: 'team-main',
    teamName: 'Core Operations',
    title: 'Workspace Lead',
    capacityHoursPerWeek: 40,
    activeProjectIds: []
  };

  const user = (users && users.find(u => u.id === id)) || (currentUser && (currentUser.id === id || id === 'usr-active') ? currentUser : null) || users?.[0] || fallbackUser;

  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityInput, setCapacityInput] = useState(user.capacityHoursPerWeek || workloadSettings.standardWeeklyHours);

  React.useEffect(() => {
    setCapacityInput(user.capacityHoursPerWeek || workloadSettings.standardWeeklyHours);
  }, [user.capacityHoursPerWeek, workloadSettings.standardWeeklyHours]);

  const canManageCapacity = ['Admin', 'Executive', 'Manager'].includes(activeRole || currentUser?.role || '');
  const canManageTeams = ['Admin', 'Manager', 'HR'].includes(activeRole || currentUser?.role || '');

  const handleSaveCapacity = () => {
    const num = Number(capacityInput);
    if (!isNaN(num) && num > 0) {
      updateUser(user.id, { capacityHoursPerWeek: num });
    }
    setIsEditingCapacity(false);
  };

  // Real data calculations
  const userTasks = tasks.filter(t => t.assigneeIds?.includes(user.id));
  const activeTasks = userTasks.filter(t => t.status !== 'Done');
  const completedTasks = userTasks.filter(t => t.status === 'Done');

  const userCapacity = user.capacityHoursPerWeek || workloadSettings.standardWeeklyHours;
  const defaultTaskHours = workloadSettings.defaultTaskEstimatedHours || 4;
  const totalActiveHours = activeTasks.reduce((s, t) => s + (t.estimatedHours || defaultTaskHours), 0);
  const isOverbooked = totalActiveHours > (user.capacityHoursPerWeek || workloadSettings.overbookedHoursThreshold) || activeTasks.length > workloadSettings.maxActiveTasks;
  const isUnderbooked = totalActiveHours < workloadSettings.optimalMinHours;
  const statusLabel = isOverbooked ? workloadSettings.overbookedLabel : isUnderbooked ? workloadSettings.underbookedLabel : workloadSettings.optimalLabel;
  const utilizationPct = Math.min(100, Math.round((totalActiveHours / (userCapacity || 1)) * 100));

  const assignedProjectIds = new Set(userTasks.map(t => t.projectId).filter(Boolean));
  const assignedProjects = projects.filter(p => assignedProjectIds.has(p.id) || p.leadId === user.id || p.memberIds?.includes(user.id));

  const userEods = eodEntries.filter(e => e.userId === user.id || e.userName === user.name);
  const consistencyScore = userEods.length > 0 ? Math.min(100, Math.round((userEods.length / 5) * 100)) : (userTasks.length > 0 ? 80 : 0);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Bar */}
      <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar 
              name={user.name} 
              avatarUrl={user.avatarUrl} 
              size="xl" 
              allowColorChange={true}
            />
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 absolute -bottom-0.5 -right-0.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {user.name || 'Team Member'}
              </h1>
              {isOverbooked && (
                <span title="Overbooked / Over capacity">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-neutral-500">
              <span>{user.title || user.role || 'Member'}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isOverbooked 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40' 
                  : isUnderbooked 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/40 dark:border-blue-800/40' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/40'
              }`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic KPI Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Active Tasks</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{activeTasks.length}</span>
            <span className="text-[10px] font-bold text-emerald-600">({completedTasks.length} done)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Project Load</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{assignedProjects.length}</span>
            <span className="text-[10px] font-bold text-neutral-400">assigned</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Daily Logs</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{userEods.length}</span>
            <span className="text-[10px] font-bold text-emerald-600">{consistencyScore}%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Capacity</span>
            {canManageCapacity && !isEditingCapacity && (
              <button
                onClick={() => setIsEditingCapacity(true)}
                className="text-[9px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="Edit weekly capacity hours"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {isEditingCapacity ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min="1"
                max="100"
                value={capacityInput}
                onChange={e => setCapacityInput(Number(e.target.value) || 0)}
                className="w-14 px-1 py-0.5 text-xs font-bold rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                autoFocus
              />
              <button
                onClick={handleSaveCapacity}
                className="p-1 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsEditingCapacity(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{userCapacity}</span>
              <span className="text-[10px] font-bold text-neutral-400">hrs/wk</span>
            </div>
          )}
          <div className="text-[9px] text-neutral-400 truncate">
            {totalActiveHours}h load ({utilizationPct}%)
          </div>
        </div>
      </div>

      {/* Role & Team Affiliations */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider font-mono">Workspace Permissions</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {user.role} Scope
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-mono text-neutral-500 block mb-1">Assigned Working Teams</span>
            <div className="flex flex-wrap gap-2 items-center">
              {teams.filter(t => (t.memberIds || []).includes(user.id) || user.teamId === t.id || (t.leadId && t.leadId === user.id)).map(t => (
                <span
                  key={t.id}
                  className="group px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.name}</span>
                  {t.leadId === user.id && <span className="text-[8px] opacity-80">(Lead)</span>}
                  {canManageTeams && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove ${user.name} from team "${t.name}"?`)) {
                          await removeMemberFromTeam(t.id, user.id);
                        }
                      }}
                      className="opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity p-0.5 cursor-pointer ml-1"
                      title={`Remove from ${t.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}

              {/* Quick Add Team Dropdown */}
              {canManageTeams && (
                <div className="relative inline-block">
                  <select
                    value=""
                    onChange={async e => {
                      const tId = e.target.value;
                      if (!tId) return;
                      await addMemberToTeam(tId, user.id);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-500 font-mono text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">+ Assign to Team...</option>
                    {teams
                      .filter(t => !(t.memberIds || []).includes(user.id) && user.teamId !== t.id && t.leadId !== user.id)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects Cards */}
      <div className="space-y-3 font-mono">
        <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Active Projects</h3>
        {assignedProjects.length === 0 ? (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center text-neutral-400 font-sans text-xs">
            No active projects currently assigned to this member.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedProjects.map(proj => {
              const pTasks = tasks.filter(t => t.projectId === proj.id);
              const donePTasks = pTasks.filter(t => t.status === 'Done');
              const pct = pTasks.length > 0 ? Math.round((donePTasks.length / pTasks.length) * 100) : 0;

              return (
                <div 
                  key={proj.id}
                  onClick={() => pushPanel({ type: 'project', id: proj.id })}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 cursor-pointer space-y-2 transition-colors"
                >
                  <div className="flex justify-between items-start font-sans font-bold text-neutral-900 dark:text-neutral-100">
                    <span className="truncate">{proj.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans line-clamp-1">{proj.description || 'No description provided.'}</p>
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned Tasks Checklist */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 font-mono">
        <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Assigned Tasks ({userTasks.length})</h3>
        {userTasks.length === 0 ? (
          <div className="py-4 text-center text-neutral-400 font-sans text-xs">
            No tasks assigned to this member.
          </div>
        ) : (
          <div className="space-y-2 font-sans">
            {userTasks.slice(0, 5).map(task => (
              <div 
                key={task.id}
                onClick={() => pushPanel({ type: 'task', id: task.id })}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-400 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {task.status === 'Done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : task.status === 'Blocked' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 shrink-0" />
                  )}
                  <span className={`font-medium truncate ${task.status === 'Done' ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                    {task.title}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-200 dark:bg-neutral-700 shrink-0">
                  {task.priority || 'Normal'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Remove from Workspace */}
      {canManageTeams && (
        <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 space-y-2 font-mono">
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
            Organization Administration
          </span>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans">
              Revoke member's workspace access and remove them from all team rosters.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to remove ${user.name} from ${currentOrgName || 'this organization'}?`)) {
                  await removeMemberFromOrg(user.id);
                  closeAllPanels();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Remove from Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
