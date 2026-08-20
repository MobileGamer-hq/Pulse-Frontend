import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { Search, UserPlus, Trash2, Eye, Users } from 'lucide-react';
import type { User } from '../../types';

export const TeamScreen: React.FC = () => {
  const { users, activeRole, pushPanel } = useApp();
  const [memberQuery, setMemberQuery] = useState('');
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  // Sync users list from AppContext or fallback to initial users
  const displayUsers = localUsers.length > 0 ? localUsers : users;

  const filteredMembers = displayUsers.filter(u => 
    u.name.toLowerCase().includes(memberQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(memberQuery.toLowerCase()) ||
    u.title.toLowerCase().includes(memberQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(memberQuery.toLowerCase())
  );

  const handleRemoveUser = (user: User) => {
    setMemberToRemove(user);
  };

  const confirmRemoveUser = () => {
    if (!memberToRemove) return;
    const updated = displayUsers.filter(u => u.id !== memberToRemove.id);
    setLocalUsers(updated);
    setMemberToRemove(null);
  };

  const canManageMembers = ['Admin', 'Manager', 'HR'].includes(activeRole);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Team &amp; People Directory</h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Manage organization members, assign RBAC roles, and govern capacity allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'team' } }))}
            className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Users className="w-4 h-4" />
            + Create Team
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'member' } }))}
            className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            + Invite Member
          </button>
        </div>
      </div>

      {/* Top Team Capacity Cards */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
        <div className="flex justify-between items-center">
          <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Team Capacity &amp; Resource Allocation
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
            Active Members: {displayUsers.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Overall Load</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">82%</div>
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
              <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '82%' }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Available Hrs / Week</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {displayUsers.reduce((acc, u) => acc + (u.capacityHoursPerWeek || 40), 0)} hrs
            </div>
            <span className="text-[11px] text-neutral-500">Based on active team rosters</span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Active Simulation Role</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{activeRole}</div>
            <span className={`text-[11px] font-bold ${canManageMembers ? 'text-green-600' : 'text-amber-600'}`}>
              {canManageMembers ? '✓ Full Member Management' : '🔒 Scoped Member View'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Aggregated Pulse Feed + Active Roster Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (2 Cols): Aggregated Pulse Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Aggregated Pulse</h3>

            <div className="space-y-4 font-mono">
              {displayUsers.slice(0, 3).map(u => (
                <div key={u.id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{u.name}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">Today</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                    Active on team {u.teamName}. Assigned to {u.activeProjectIds?.length || 1} core initiatives.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {u.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                      • {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (3 Cols): Active Roster Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Organization Roster</h3>
                <span className="text-[11px] text-neutral-500 font-mono">Showing {filteredMembers.length} team members</span>
              </div>
              
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberQuery}
                  onChange={e => setMemberQuery(e.target.value)}
                  placeholder="Search member by name, role..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                  <tr>
                    <th className="pb-2">Member</th>
                    <th className="pb-2">Title &amp; Team</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                        <div 
                          className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => pushPanel({ type: 'person', id: m.id })}
                        >
                          <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size="sm" />
                          <div>
                            <div className="font-bold text-xs">{m.name}</div>
                            <div className="text-[10px] text-neutral-400 font-normal">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-neutral-500 font-sans">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{m.title}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{m.teamName}</div>
                      </td>

                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.role === 'Admin' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                          m.role === 'Executive' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          m.role === 'Manager' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          m.role === 'HR' ? 'bg-pink-100 text-pink-800 border-pink-300' :
                          m.role === 'TeamLead' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          'bg-neutral-100 text-neutral-800 border-neutral-300'
                        }`}>
                          • {m.role}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => pushPanel({ type: 'person', id: m.id })}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManageMembers && (
                            <button
                              onClick={() => handleRemoveUser(m)}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title={`Remove ${m.name} from team`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Confirm Member Offboarding</h3>
                <p className="text-xs text-neutral-500 font-mono">Action evaluated under privilege: {activeRole}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans">
              Are you sure you want to remove <strong>{memberToRemove.name}</strong> ({memberToRemove.title}) from the organization roster? Their access to projects and tasks will be revoked.
            </p>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 font-mono">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={confirmRemoveUser}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
