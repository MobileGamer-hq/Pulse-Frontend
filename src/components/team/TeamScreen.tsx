import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Search, UserPlus, Eye, Users, Layers, Plus, Edit3, Trash2, X, Check, 
  UserMinus, UserX, RotateCw, AlertTriangle
} from 'lucide-react';
import type { Team, WorkflowTemplate, User } from '../../types';

export const TeamScreen: React.FC = () => {
  const { 
    users, teams, updateTeam, deleteTeam, removeMemberFromTeam, removeMemberFromOrg, 
    pushPanel, refreshWorkspaceData, currentOrgName, activeRole, currentUser 
  } = useApp();
  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>('all');
  const [memberQuery, setMemberQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // RBAC Permission Guard: Only Admins, Managers, and HR can create/edit teams or assign/reassign members
  const canManageTeams = ['Admin', 'Manager', 'HR'].includes(activeRole || currentUser?.role || '');

  // Modal State for Removing Member from Organization
  const [orgUserToRemove, setOrgUserToRemove] = useState<User | null>(null);

  // Modal State for Editing Team Info
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState('');
  const [editTemplate, setEditTemplate] = useState<WorkflowTemplate>('SoftwareSprint');
  const [editLeadId, setEditLeadId] = useState('');
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Modal State for Dedicated "Manage Team Members"
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);

  // Quick Assign User to Team Modal (when on 'all' view)
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWorkspaceData(false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Active selected team object (if not 'all')
  const selectedTeam = selectedTeamId !== 'all' ? teams.find(t => t.id === selectedTeamId) : null;

  // Filter members belonging to selected team (or all users if 'all')
  const teamMembers = users.filter(u => {
    if (selectedTeamId === 'all') return true;
    if (!selectedTeam) return false;
    return (
      (selectedTeam.memberIds || []).includes(u.id) ||
      u.teamId === selectedTeam.id ||
      (selectedTeam.leadId && selectedTeam.leadId === u.id)
    );
  });

  const filteredMembers = teamMembers.filter(u => 
    u.name.toLowerCase().includes(memberQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(memberQuery.toLowerCase()) ||
    u.title.toLowerCase().includes(memberQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(memberQuery.toLowerCase())
  );

  const handleStartEditTeam = (team: Team) => {
    if (!canManageTeams) {
      alert('Permission Denied: Only Admins and Managers have privilege to edit team configurations.');
      return;
    }
    setEditingTeam(team);
    setEditName(team.name);
    setEditTemplate((team.workflowTemplate as WorkflowTemplate) || 'SoftwareSprint');
    setEditLeadId(team.leadId || '');
    
    // Compute current members for this team
    const currentMemberIds = users
      .filter(u => (team.memberIds || []).includes(u.id) || u.teamId === team.id || (team.leadId && team.leadId === u.id))
      .map(u => u.id);
    setEditMemberIds(Array.from(new Set(currentMemberIds.length > 0 ? currentMemberIds : (team.leadId ? [team.leadId] : []))));
  };

  const handleSaveTeamEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeams) return;
    if (!editingTeam || !editName.trim()) return;

    const leadUser = users.find(u => u.id === editLeadId);
    const finalMemberIds = Array.from(new Set(editLeadId ? [editLeadId, ...editMemberIds] : editMemberIds));

    updateTeam(editingTeam.id, {
      name: editName.trim(),
      workflowTemplate: editTemplate,
      leadId: editLeadId,
      leadName: leadUser?.name || editingTeam.leadName,
      memberIds: finalMemberIds,
    });

    setEditingTeam(null);
  };

  const handleOpenManageMembers = (team: Team) => {
    if (!canManageTeams) {
      alert('Permission Denied: Only Admins and Managers have privilege to assign or manage team rosters.');
      return;
    }
    setManagingTeam(team);
    const currentMemberIds = users
      .filter(u => (team.memberIds || []).includes(u.id) || u.teamId === team.id || (team.leadId && team.leadId === u.id))
      .map(u => u.id);
    setSelectedMemberIds(Array.from(new Set(currentMemberIds.length > 0 ? currentMemberIds : (team.leadId ? [team.leadId] : []))));
    setManageSearchQuery('');
    setIsManageMembersOpen(true);
  };

  const handleSaveManageMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeams || !managingTeam) return;

    const finalMemberIds = Array.from(new Set(managingTeam.leadId ? [managingTeam.leadId, ...selectedMemberIds] : selectedMemberIds));
    await updateTeam(managingTeam.id, {
      memberIds: finalMemberIds
    });

    setIsManageMembersOpen(false);
    setManagingTeam(null);
  };

  const handleRemoveMemberFromCurrentTeam = async (userToRemove: User) => {
    if (!canManageTeams) {
      alert('Permission Denied: Only Admins and Managers can remove members from teams.');
      return;
    }
    if (!selectedTeam) return;
    if (selectedTeam.leadId === userToRemove.id) {
      alert(`${userToRemove.name} is the Team Lead. To remove them, please assign a new Team Lead first in Edit Team Info.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${userToRemove.name} from team "${selectedTeam.name}"?`)) {
      await removeMemberFromTeam(selectedTeam.id, userToRemove.id);
    }
  };

  const handleRemoveMemberFromSpecificTeam = async (teamId: string, userToRemove: User) => {
    if (!canManageTeams) {
      alert('Permission Denied: Only Admins and Managers can remove members from teams.');
      return;
    }
    const target = teams.find(t => t.id === teamId);
    const tName = target ? target.name : 'this team';
    if (window.confirm(`Are you sure you want to remove ${userToRemove.name} from team "${tName}"?`)) {
      await removeMemberFromTeam(teamId, userToRemove.id);
    }
  };

  const handleConfirmRemoveFromOrg = async () => {
    if (!canManageTeams) return;
    if (!orgUserToRemove) return;
    await removeMemberFromOrg(orgUserToRemove.id);
    setOrgUserToRemove(null);
  };

  const handleSaveAssignUserToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeams) {
      alert('Permission Denied: Only Admins and Managers have privilege to assign teams.');
      return;
    }
    if (!assigningUser || !targetTeamId) return;

    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam) return;

    const currentMemberIds = users
      .filter(u => (targetTeam.memberIds || []).includes(u.id) || u.teamId === targetTeam.id || (targetTeam.leadId && targetTeam.leadId === u.id))
      .map(u => u.id);
    
    if (!currentMemberIds.includes(assigningUser.id)) {
      const newMemberIds = [...currentMemberIds, assigningUser.id];
      await updateTeam(targetTeam.id, {
        memberIds: newMemberIds
      });
    }

    setAssigningUser(null);
    setTargetTeamId('');
  };

  const handleDeleteTeamConfirm = (teamId: string) => {
    if (!canManageTeams) return;
    deleteTeam(teamId);
    if (selectedTeamId === teamId) {
      setSelectedTeamId('all');
    }
    setDeletingTeamId(null);
  };

  const WORKFLOW_TEMPLATES: { id: WorkflowTemplate; label: string }[] = [
    { id: 'SoftwareSprint', label: 'Software Sprint (Agile)' },
    { id: 'KanbanFlow', label: 'Kanban Continuous Flow' },
    { id: 'MarketingLaunch', label: 'Marketing Campaign Launch' },
    { id: 'SalesPipeline', label: 'Sales & Revenue Pipeline' },
    { id: 'DesignSystem', label: 'Design System Iteration' },
    { id: 'ExecutiveStrategy', label: 'Executive Strategy & Goals' },
    { id: 'GeneralOps', label: 'General Operations' },
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Teams &amp; Organization Roster</h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Select a team to inspect its members, assign organization members, and manage workflow templates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh roster and teams"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {canManageTeams && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Teams Selector Horizontal Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            Organization Teams ({teams.length})
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            Click a team card to inspect members or manage team assignments
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
            const teamUsers = users.filter(u => 
              (t.memberIds || []).includes(u.id) || 
              u.teamId === t.id || 
              (t.leadId && t.leadId === u.id)
            );
            const mCount = teamUsers.length;

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
                      {mCount} {mCount === 1 ? 'member' : 'members'}
                    </span>

                    {canManageTeams && (
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
                    )}
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

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {selectedTeam && canManageTeams && (
              <>
                <button
                  onClick={() => handleOpenManageMembers(selectedTeam)}
                  className="px-3.5 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Add / Manage Members
                </button>

                <button
                  onClick={() => handleStartEditTeam(selectedTeam)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Settings
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
          
          <div className="flex items-center gap-2">
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

            {selectedTeam && canManageTeams && (
              <button
                onClick={() => handleOpenManageMembers(selectedTeam)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Members</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
              <tr>
                <th className="pb-2">Member</th>
                <th className="pb-2">Title &amp; Role</th>
                <th className="pb-2">Team Affiliation</th>
                <th className="pb-2">Weekly Capacity</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedTeam ? `No members currently assigned to ${selectedTeam.name}` : 'No members found'}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {selectedTeam 
                          ? 'Add existing organization members or invite new members to this team.' 
                          : 'Invite members to build your organization roster.'}
                      </p>
                    </div>

                    {canManageTeams && (
                      selectedTeam ? (
                        <button
                          onClick={() => handleOpenManageMembers(selectedTeam)}
                          className="mt-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          + Add Members to {selectedTeam.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'member' } }))}
                          className="mt-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite Workspace Member
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ) : (
                filteredMembers.map(m => {
                  const memberTeams = teams.filter(t => 
                    (t.memberIds || []).includes(m.id) || 
                    m.teamId === t.id || 
                    (t.leadId && t.leadId === m.id)
                  );

                  const isLeadOfSelected = selectedTeam && selectedTeam.leadId === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                        <div 
                          className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => pushPanel({ type: 'person', id: m.id })}
                        >
                          <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size="sm" />
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {isLeadOfSelected && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  TEAM LEAD
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-normal">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-neutral-500 font-sans">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{m.title}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">Role: {m.role}</div>
                      </td>

                      <td className="py-3">
                        <div className="flex flex-wrap gap-1 items-center">
                          {memberTeams.length > 0 ? (
                            memberTeams.map(t => (
                              <span 
                                key={t.id} 
                                className="group/pill inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                              >
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTeamId(t.id);
                                  }}
                                  className="hover:underline cursor-pointer"
                                >
                                  {t.name}
                                </span>
                                {canManageTeams && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMemberFromSpecificTeam(t.id, m);
                                    }}
                                    className="opacity-40 group-hover/pill:opacity-100 hover:text-red-500 transition-opacity cursor-pointer p-0.5"
                                    title={`Remove ${m.name} from ${t.name}`}
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-mono">Unassigned</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {m.capacityHoursPerWeek || 40} hrs / wk
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {selectedTeam ? (
                            <>
                              <button
                                onClick={() => pushPanel({ type: 'person', id: m.id })}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="View Profile Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {canManageTeams && !isLeadOfSelected && (
                                <button
                                  onClick={() => handleRemoveMemberFromCurrentTeam(m)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  title={`Remove ${m.name} from ${selectedTeam.name}`}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}

                              {canManageTeams && (
                                <button
                                  onClick={() => setOrgUserToRemove(m)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  title={`Remove ${m.name} from organization`}
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {canManageTeams && (
                                <button
                                  onClick={() => {
                                    setAssigningUser(m);
                                    setTargetTeamId(teams[0]?.id || '');
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Assign to team"
                                >
                                  <Plus className="w-3 h-3" />
                                  Assign Team
                                </button>
                              )}

                              <button
                                onClick={() => pushPanel({ type: 'person', id: m.id })}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="View Profile Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {canManageTeams && (
                                <button
                                  onClick={() => setOrgUserToRemove(m)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  title={`Remove ${m.name} from organization`}
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remove Member from Organization Confirmation Modal */}
      {orgUserToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                  Remove Member from Organization
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  Revoke workspace access
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-neutral-900 dark:text-neutral-100">{orgUserToRemove.name}</span> ({orgUserToRemove.email}) from <strong>{currentOrgName || 'this workspace'}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-[11px] text-red-800 dark:text-red-300 font-mono space-y-1">
              <div>• User will lose access to all projects, tasks, and goals in this organization.</div>
              <div>• They will be unassigned from all team rosters.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrgUserToRemove(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold font-mono hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveFromOrg}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold font-mono hover:bg-red-700 shadow-sm cursor-pointer"
              >
                Yes, Remove from Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated "Manage Team Members" Modal */}
      {isManageMembersOpen && managingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Add Members to {managingTeam.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Select organization members to assign to this team
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsManageMembersOpen(false);
                  setManagingTeam(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManageMembers} className="space-y-4">
              {/* Search & Bulk Selection Actions */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manageSearchQuery}
                    onChange={e => setManageSearchQuery(e.target.value)}
                    placeholder="Search organization members by name or email..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between px-1 text-[11px] font-mono">
                  <span className="text-neutral-500">
                    {selectedMemberIds.length} of {users.length} members selected
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds(users.map(u => u.id))}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds(managingTeam.leadId ? [managingTeam.leadId] : [])}
                      className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-bold cursor-pointer"
                    >
                      Deselect Non-Leads
                    </button>
                  </div>
                </div>
              </div>

              {/* Members Checklist */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-neutral-100 dark:border-neutral-800 rounded-xl p-2 bg-neutral-50/50 dark:bg-neutral-950/50">
                {users
                  .filter(u => 
                    u.name.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
                    u.role.toLowerCase().includes(manageSearchQuery.toLowerCase())
                  )
                  .map(user => {
                    const isSelected = selectedMemberIds.includes(user.id);
                    const isLead = managingTeam.leadId === user.id;

                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (isLead) return; // Lead cannot be deselected
                          if (isSelected) {
                            setSelectedMemberIds(prev => prev.filter(id => id !== user.id));
                          } else {
                            setSelectedMemberIds(prev => [...prev, user.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-neutral-800 border-neutral-900/40 dark:border-neutral-100/40 shadow-xs'
                            : 'bg-white/60 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                              : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />

                          <div className="min-w-0">
                            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
                              <span>{user.name}</span>
                              {isLead && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                                  TEAM LEAD
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono truncate">{user.email} • {user.role}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-semibold text-neutral-400 shrink-0 ml-2">
                          {user.title || user.role}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between font-mono">
                <span className="text-[10px] text-neutral-400">
                  {selectedMemberIds.length} members will belong to this team.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageMembersOpen(false);
                      setManagingTeam(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Members
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Assign User to Team Modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Assign {assigningUser.name} to Team
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">Select a team workspace</p>
                </div>
              </div>

              <button
                onClick={() => setAssigningUser(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignUserToTeam} className="space-y-4">
              <div>
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1 uppercase">
                  Select Team
                </label>
                <select
                  value={targetTeamId}
                  onChange={e => setTargetTeamId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.workflowTemplate || 'SoftwareSprint'})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setAssigningUser(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Assign to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Info Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Edit Team Info</h3>
                  <p className="text-[11px] text-neutral-500 font-mono">Update team settings, lead, &amp; members</p>
                </div>
              </div>

              <button
                onClick={() => setEditingTeam(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    onChange={e => {
                      const newLId = e.target.value;
                      setEditLeadId(newLId);
                      if (newLId && !editMemberIds.includes(newLId)) {
                        setEditMemberIds(prev => [...prev, newLId]);
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Team Lead --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Members Selection Checklist in Edit Modal */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block uppercase">
                  Assign Team Members ({editMemberIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-neutral-100 dark:border-neutral-800 rounded-xl p-2 bg-neutral-50/50 dark:bg-neutral-950/50">
                  {users.map(user => {
                    const isSelected = editMemberIds.includes(user.id);
                    const isLead = editLeadId === user.id;

                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (isLead) return;
                          if (isSelected) {
                            setEditMemberIds(prev => prev.filter(id => id !== user.id));
                          } else {
                            setEditMemberIds(prev => [...prev, user.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                            : 'bg-transparent border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'border-neutral-300 dark:border-neutral-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">{user.name}</span>
                          {isLead && (
                            <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1 py-0.2 rounded">
                              LEAD
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">{user.role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 cursor-pointer"
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
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteTeamConfirm(deletingTeamId)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm cursor-pointer"
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
