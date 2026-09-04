import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { Search, UserPlus, Eye, Users, Layers, Plus, Edit3, Trash2, X, Check } from 'lucide-react';
import type { Team, WorkflowTemplate } from '../../types';

export const TeamScreen: React.FC = () => {
  const { users, teams, updateTeam, deleteTeam, pushPanel } = useApp();
  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>('all');
  const [memberQuery, setMemberQuery] = useState('');

  // Modal State for Editing Team Info
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState('');
  const [editTemplate, setEditTemplate] = useState<WorkflowTemplate>('SoftwareSprint');
  const [editLeadId, setEditLeadId] = useState('');
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Active selected team object (if not 'all')
  const selectedTeam = selectedTeamId !== 'all' ? teams.find(t => t.id === selectedTeamId) : null;

  // Filter members belonging to selected team (or all users if 'all')
  const teamMembers = users.filter(u => {
    if (selectedTeamId === 'all') return true;
    if (!selectedTeam) return false;
    return (selectedTeam.memberIds || []).includes(u.id) || u.teamId === selectedTeam.id || selectedTeam.leadId === u.id;
  });

  const filteredMembers = teamMembers.filter(u => 
    u.name.toLowerCase().includes(memberQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(memberQuery.toLowerCase()) ||
    u.title.toLowerCase().includes(memberQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(memberQuery.toLowerCase())
  );

  const handleStartEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditTemplate((team.workflowTemplate as WorkflowTemplate) || 'SoftwareSprint');
    setEditLeadId(team.leadId || '');
  };

  const handleSaveTeamEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editName.trim()) return;

    const leadUser = users.find(u => u.id === editLeadId);

    updateTeam(editingTeam.id, {
      name: editName.trim(),
      workflowTemplate: editTemplate,
      leadId: editLeadId,
      leadName: leadUser?.name || editingTeam.leadName,
    });

    setEditingTeam(null);
  };

  const handleDeleteTeamConfirm = (teamId: string) => {
    deleteTeam(teamId);
    if (selectedTeamId === teamId) {
      setSelectedTeamId('all');
    }
    setDeletingTeamId(null);
  };

  const WORKFLOW_TEMPLATES: { id: WorkflowTemplate; label: string }[] = [
    { id: 'SoftwareSprint', label: 'Software Development' },
    { id: 'BugTracking', label: 'Bug Tracking & Issues' },
    { id: 'MarketingCampaign', label: 'Marketing Campaign' },
    { id: 'ClientOnboarding', label: 'Agency & Client Work' },
    { id: 'GeneralOps', label: 'General Operations' },
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Teams &amp; Organization Roster</h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Select a team to inspect its members, edit team settings, and manage workflow templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'team' } }))}
            className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'member' } }))}
            className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Teams Selector Horizontal Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            Organization Teams ({teams.length})
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            Click a team card to inspect members or edit team info
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* All Members Card */}
          <div
            onClick={() => setSelectedTeamId('all')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              selectedTeamId === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                selectedTeamId === 'all'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              }`}>
                {users.length} Total
              </span>
            </div>

            <div>
              <div className="font-extrabold text-sm tracking-tight">All Members</div>
              <div className="text-[11px] font-mono opacity-70 mt-0.5">Entire organization directory</div>
            </div>
          </div>

          {/* Individual Team Cards */}
          {teams.map(t => {
            const isSelected = selectedTeamId === t.id;
            const mCount = (t.memberIds || []).length || users.filter(u => u.teamId === t.id).length || 1;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 group relative ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold ${
                    isSelected
                      ? 'bg-white/10 border-white/20 dark:bg-black/10 dark:border-black/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  }`}>
                    <Layers className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}>
                      {mCount} members
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditTeam(t);
                      }}
                      className={`p-1 rounded-lg transition-colors ${
                        isSelected
                          ? 'hover:bg-white/20 dark:hover:bg-black/20 text-white dark:text-black'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Edit Team Settings"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="font-extrabold text-sm tracking-tight truncate">{t.name}</div>
                  <div className="text-[11px] font-mono opacity-70 mt-0.5 truncate">
                    Lead: {t.leadName || 'Workspace Admin'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Team Active Banner & Quick Actions */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-900 dark:text-neutral-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {selectedTeam ? selectedTeam.name : 'All Workspace Members'}
                </h2>
                {selectedTeam && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    Template: {selectedTeam.workflowTemplate || 'SoftwareSprint'}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                {selectedTeam
                  ? `Showing approved members assigned to ${selectedTeam.name}.`
                  : 'Showing all approved organization members across all working groups.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {selectedTeam && (
              <>
                <button
                  onClick={() => handleStartEditTeam(selectedTeam)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Team Info
                </button>

                <button
                  onClick={() => setDeletingTeamId(selectedTeam.id)}
                  className="p-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Delete Team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="text-right border-l border-neutral-200 dark:border-neutral-800 pl-3">
              <span className="text-[10px] text-neutral-400 block uppercase font-bold">Total Members</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{teamMembers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Roster Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              {selectedTeam ? `${selectedTeam.name} Members Roster` : 'Organization Roster'}
            </h3>
            <span className="text-[11px] text-neutral-500 font-mono">Showing {filteredMembers.length} team members</span>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={memberQuery}
              onChange={e => setMemberQuery(e.target.value)}
              placeholder="Filter member by name, role..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
              <tr>
                <th className="pb-2">Member</th>
                <th className="pb-2">Title &amp; Role</th>
                <th className="pb-2">Weekly Capacity</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No members found in this team</p>
                      <p className="text-[11px] text-neutral-500 font-mono">Invite or assign team members to populate this roster.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map(m => (
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
                      <div className="text-[10px] text-neutral-400 font-mono">Role: {m.role}</div>
                    </td>

                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {m.capacityHoursPerWeek || 40} hrs / wk
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => pushPanel({ type: 'person', id: m.id })}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Team Info Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Edit Team Info</h3>
                  <p className="text-[11px] text-neutral-500 font-mono">Update team settings &amp; workflow template</p>
                </div>
              </div>

              <button
                onClick={() => setEditingTeam(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamEdit} className="space-y-4">
              <div>
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1 uppercase">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Core Engineering"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1 uppercase">
                  Workflow Template
                </label>
                <select
                  value={editTemplate}
                  onChange={e => setEditTemplate(e.target.value as WorkflowTemplate)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WORKFLOW_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1 uppercase">
                  Team Lead
                </label>
                <select
                  value={editLeadId}
                  onChange={e => setEditLeadId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Team Lead --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {deletingTeamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Delete Team</h3>
                <p className="text-xs text-neutral-500 font-mono">Confirm team deletion</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans">
              Are you sure you want to delete this team? Member associations will be unlinked. This action cannot be undone.
            </p>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 font-mono">
              <button
                onClick={() => setDeletingTeamId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteTeamConfirm(deletingTeamId)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
