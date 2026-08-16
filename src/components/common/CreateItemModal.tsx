import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle2, Lock, FileText, Briefcase, Target, Tag as TagIcon, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Role, Priority, TaskStatus, WorkflowTemplate } from '../../types';

export type ItemType = 'task' | 'project' | 'goal' | 'tag' | 'member' | 'team';

interface CreateItemModalProps {
  isOpen: boolean;
  initialType?: ItemType;
  onClose: () => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  initialType = 'task',
  onClose
}) => {
  const { 
    activeRole, setActiveRole, currentUser, projects, teams, users,
    addTask, addProject, addGoal, addTag, addUser, addTeam 
  } = useApp();

  const [itemType, setItemType] = useState<ItemType>(initialType);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProjectId, setTaskProjectId] = useState(projects[0]?.id || 'proj-1');
  const [taskPriority, setTaskPriority] = useState<Priority>('Medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Todo');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState<number>(8);
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>(currentUser.id);

  // Project state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTemplate, setProjectTemplate] = useState<WorkflowTemplate>('SoftwareSprint');
  const [projectTeamId, setProjectTeamId] = useState(teams[0]?.id || 'team-eng');

  // Goal state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-10-30');
  const [goalOwnerType, setGoalOwnerType] = useState<'org' | 'team' | 'individual'>('org');

  // Tag state
  const [tagName, setTagName] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [tagColorHex, setTagColorHex] = useState('#3B82F6');

  // Member state
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<Role>('Member');
  const [memberTitle, setMemberTitle] = useState('');
  const [memberTeamId, setMemberTeamId] = useState(teams[0]?.id || 'team-eng');

  // Team state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeadId, setNewTeamLeadId] = useState<string>(currentUser.id);
  const [newTeamTemplate, setNewTeamTemplate] = useState<WorkflowTemplate>('SoftwareSprint');

  if (!isOpen) return null;

  // RBAC Permission Validation Rule Matrix
  const checkPermission = (type: ItemType): { allowed: boolean; reason: string } => {
    switch (type) {
      case 'task':
        if (['Admin', 'Manager', 'TeamLead', 'Member'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        if (activeRole === 'Executive') {
          return { allowed: false, reason: 'Executives have strategic read-only view of tasks and do not create sprint items directly.' };
        }
        if (activeRole === 'HR') {
          return { allowed: false, reason: 'HR roles are scoped to people & team management rather than technical sprint tasks.' };
        }
        return { allowed: false, reason: 'Contractors are restricted from creating new top-level tasks. Ask your Manager or Team Lead.' };

      case 'project':
        if (['Admin', 'Executive', 'Manager'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" does not have privilege to create top-level projects. Switch to Manager or Admin.` };

      case 'goal':
        if (['Admin', 'Executive', 'Manager'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot define strategic goals/OKRs. Switch to Executive, Manager, or Admin.` };

      case 'tag':
        if (['Admin', 'Manager', 'TeamLead'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot create global organization tags. Switch to Team Lead, Manager, or Admin.` };

      case 'member':
        if (['Admin', 'Manager', 'HR'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot invite or provision user accounts. Switch to HR, Manager, or Admin.` };

      case 'team':
        if (['Admin', 'Manager', 'HR'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot create new organizational teams. Switch to HR, Manager, or Admin.` };

      default:
        return { allowed: true, reason: '' };
    }
  };

  const currentPermission = checkPermission(itemType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPermission.allowed) return;

    if (itemType === 'task') {
      if (!taskTitle.trim()) return;
      const proj = projects.find(p => p.id === taskProjectId);
      addTask({
        orgId: 'org-acme',
        projectId: taskProjectId,
        projectName: proj ? proj.name : 'Core Project',
        title: taskTitle,
        description: taskDescription,
        status: taskStatus,
        priority: taskPriority,
        assigneeIds: [taskAssigneeId],
        estimatedHours: taskEstimatedHours,
        actualHours: 0,
        dueDate: '2026-08-30',
        startDate: '2026-08-16',
        tagIds: ['tag-1'],
        dependencyTaskIds: [],
        subtasks: [],
        comments: []
      });
      setSuccessMessage(`Task "${taskTitle}" created successfully under privilege ${activeRole}!`);
    } else if (itemType === 'project') {
      if (!projectName.trim()) return;
      addProject({
        orgId: 'org-acme',
        name: projectName,
        description: projectDescription,
        templateType: projectTemplate,
        teamId: projectTeamId,
        leadId: currentUser.id,
        memberIds: [currentUser.id],
        tagIds: ['tag-1'],
        linkedGoalIds: [],
        startDate: new Date().toISOString().split('T')[0],
        targetEndDate: '2026-10-31',
        status: 'Active'
      });
      setSuccessMessage(`Project "${projectName}" created successfully under privilege ${activeRole}!`);
    } else if (itemType === 'goal') {
      if (!goalTitle.trim()) return;
      addGoal({
        orgId: 'org-acme',
        title: goalTitle,
        description: goalDescription,
        ownerType: goalOwnerType,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        keyResults: [
          { id: `kr-${Date.now()}`, title: 'Initial milestone delivery', targetValue: 100, currentValue: 25, unit: '%', linkedTaskIds: [] }
        ],
        linkedTaskIds: [],
        tagIds: [],
        targetDate: goalTargetDate,
        status: 'OnTrack'
      });
      setSuccessMessage(`Goal "${goalTitle}" created successfully under privilege ${activeRole}!`);
    } else if (itemType === 'tag') {
      if (!tagName.trim()) return;
      addTag({
        orgId: 'org-acme',
        name: tagName,
        colorHex: tagColorHex,
        bgHex: `${tagColorHex}20`,
        textHex: tagColorHex,
        appliesTo: ['task', 'project'],
        description: tagDescription,
        createdBy: currentUser.name
      });
      setSuccessMessage(`Tag "#${tagName}" created successfully under privilege ${activeRole}!`);
    } else if (itemType === 'member') {
      if (!memberName.trim() || !memberEmail.trim()) return;
      const team = teams.find(t => t.id === memberTeamId);
      addUser({
        orgId: 'org-acme',
        name: memberName,
        email: memberEmail,
        role: memberRole,
        teamId: memberTeamId,
        teamName: team ? team.name : 'Core Team',
        title: memberTitle || `${memberRole} Specialist`,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        activeProjectIds: [],
        capacityHoursPerWeek: 40
      });
      setSuccessMessage(`Team Member "${memberName}" invited as ${memberRole} under privilege ${activeRole}!`);
    } else if (itemType === 'team') {
      if (!newTeamName.trim()) return;
      const leadUser = users.find(u => u.id === newTeamLeadId);
      addTeam({
        name: newTeamName,
        leadId: newTeamLeadId,
        leadName: leadUser ? leadUser.name : currentUser.name,
        memberIds: [newTeamLeadId],
        workflowTemplate: newTeamTemplate
      });
      setSuccessMessage(`Team "${newTeamName}" created successfully under privilege ${activeRole}!`);
    }

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white dark:bg-neutral-900 border-0 sm:border border-neutral-200 dark:border-neutral-800 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-2xl overflow-hidden text-xs flex flex-col max-h-none sm:max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                  Add New Item
                </h2>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  Role: <span className="font-bold text-neutral-900 dark:text-neutral-100">{activeRole}</span> ({currentUser.name})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item Category Segmented Pill Tabs - Mobile Optimized */}
          <div className="px-3 sm:px-6 py-2.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800 shrink-0 font-mono">
            <div className="p-1 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-xl flex items-center gap-1 overflow-x-auto border border-neutral-200/60 dark:border-neutral-700/50 scrollbar-none">
              {[
                { id: 'task' as ItemType, label: 'Task', icon: FileText },
                { id: 'project' as ItemType, label: 'Project', icon: Briefcase },
                { id: 'goal' as ItemType, label: 'Goal', icon: Target },
                { id: 'team' as ItemType, label: 'Team', icon: Users },
                { id: 'member' as ItemType, label: 'Member', icon: UserPlus },
                { id: 'tag' as ItemType, label: 'Tag', icon: TagIcon }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = itemType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setItemType(tab.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-100 font-bold shadow-xs border border-neutral-200/80 dark:border-neutral-700/60'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/60 dark:hover:bg-neutral-700/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {successMessage ? (
              <div className="p-6 rounded-xl bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" />
                <h3 className="font-bold text-sm">{successMessage}</h3>
                <p className="text-xs text-green-700 dark:text-green-400 font-mono">
                  State updated in live app context. Closing modal...
                </p>
              </div>
            ) : !currentPermission.allowed ? (
              /* RBAC Restriction Alert Card */
              <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 space-y-4 font-sans">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                      RBAC Privilege Limitation: Role [{activeRole}] Cannot Create {itemType.toUpperCase()}s
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 font-mono">
                      {currentPermission.reason}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-amber-800 dark:text-amber-400">Want to test adding this item?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRole('Admin')}
                      className="px-3 py-1 bg-amber-900 text-white dark:bg-amber-200 dark:text-amber-950 font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Switch to Admin Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRole('Manager')}
                      className="px-3 py-1 bg-amber-800 text-white dark:bg-amber-300 dark:text-amber-950 font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Switch to Manager Mode
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Form input fields */
              <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                {itemType === 'task' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Task Title *</label>
                      <input
                        type="text"
                        required
                        value={taskTitle}
                        onChange={e => setTaskTitle(e.target.value)}
                        placeholder="e.g. Implement WebSocket heartbeat reconnection listener"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Project</label>
                        <select
                          value={taskProjectId}
                          onChange={e => setTaskProjectId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assignee</label>
                        <select
                          value={taskAssigneeId}
                          onChange={e => setTaskAssigneeId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                        <select
                          value={taskPriority}
                          onChange={e => setTaskPriority(e.target.value as Priority)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="Urgent">Urgent</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Initial Status</label>
                        <select
                          value={taskStatus}
                          onChange={e => setTaskStatus(e.target.value as TaskStatus)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="Todo">To Do</option>
                          <option value="InProgress">In Progress</option>
                          <option value="AtRisk">At Risk</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Est. Hours</label>
                        <input
                          type="number"
                          min={1}
                          max={160}
                          value={taskEstimatedHours}
                          onChange={e => setTaskEstimatedHours(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={taskDescription}
                        onChange={e => setTaskDescription(e.target.value)}
                        placeholder="Provide details and acceptance criteria..."
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </>
                )}

                {itemType === 'project' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Project Name *</label>
                      <input
                        type="text"
                        required
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        placeholder="e.g. AI Workflow Optimization Engine"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Workflow Template</label>
                        <select
                          value={projectTemplate}
                          onChange={e => setProjectTemplate(e.target.value as WorkflowTemplate)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="SoftwareSprint">Software Sprint</option>
                          <option value="BugTracking">Bug Tracking</option>
                          <option value="MarketingCampaign">Marketing Campaign</option>
                          <option value="ClientOnboarding">Client Onboarding</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assigned Team</label>
                        <select
                          value={projectTeamId}
                          onChange={e => setProjectTeamId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={projectDescription}
                        onChange={e => setProjectDescription(e.target.value)}
                        placeholder="Overview of project deliverables..."
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </>
                )}

                {itemType === 'goal' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Goal / Strategic Objective *</label>
                      <input
                        type="text"
                        required
                        value={goalTitle}
                        onChange={e => setGoalTitle(e.target.value)}
                        placeholder="e.g. Reduce customer churn rate below 2.5%"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Goal Scope</label>
                        <select
                          value={goalOwnerType}
                          onChange={e => setGoalOwnerType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="org">Organization Strategic Goal</option>
                          <option value="team">Team OKR</option>
                          <option value="individual">Individual Objective</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Target Date</label>
                        <input
                          type="date"
                          value={goalTargetDate}
                          onChange={e => setGoalTargetDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Key Results Summary</label>
                      <textarea
                        rows={3}
                        value={goalDescription}
                        onChange={e => setGoalDescription(e.target.value)}
                        placeholder="Outline target metrics and success criteria..."
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </>
                )}

                {itemType === 'team' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Team Name *</label>
                      <input
                        type="text"
                        required
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        placeholder="e.g. Platform DevOps &amp; Security"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block font-mono">This will be the primary workspace for your initial team members.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Designated Team Lead</label>
                      <select
                        value={newTeamLeadId}
                        onChange={e => setNewTeamLeadId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.title})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Select Foundational Workflow Template
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                        {[
                          { id: 'SoftwareSprint', title: 'Software Development', desc: 'Optimized for sprints, issue tracking, and code review cycles.' },
                          { id: 'ClientOnboarding', title: 'Agency & Client Work', desc: 'Focuses on deliverables, approvals, and time tracking.' },
                          { id: 'MarketingCampaign', title: 'Sales & Pipeline', desc: 'Structured for lead progression, CRM integration, and forecasting.' },
                          { id: 'GeneralOps', title: 'General Operations', desc: 'A flexible, lightweight setup for standard task management.' }
                        ].map(tmpl => (
                          <div
                            key={tmpl.id}
                            onClick={() => setNewTeamTemplate(tmpl.id as WorkflowTemplate)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                              newTeamTemplate === tmpl.id
                                ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold shadow-xs'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{tmpl.title}</div>
                            <p className="text-[11px] text-neutral-500 font-normal leading-snug">{tmpl.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {itemType === 'tag' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Tag Name *</label>
                      <input
                        type="text"
                        required
                        value={tagName}
                        onChange={e => setTagName(e.target.value)}
                        placeholder="e.g. SOC2-Audit or Microservices"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Color Swatch</label>
                      <div className="flex items-center gap-2">
                        {['#3B82F6', '#6366F1', '#8B5CF6', '#DC2626', '#059669', '#D97706', '#4B5563'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setTagColorHex(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              tagColorHex === color ? 'scale-125 border-black dark:border-white shadow-sm' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Tag Description</label>
                      <input
                        type="text"
                        value={tagDescription}
                        onChange={e => setTagDescription(e.target.value)}
                        placeholder="What items does this tag categorize?"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {itemType === 'member' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={memberName}
                          onChange={e => setMemberName(e.target.value)}
                          placeholder="e.g. Samantha Vance"
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={memberEmail}
                          onChange={e => setMemberEmail(e.target.value)}
                          placeholder="samantha@acme.com"
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assigned Role</label>
                        <select
                          value={memberRole}
                          onChange={e => setMemberRole(e.target.value as Role)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="Member">Member</option>
                          <option value="TeamLead">Team Lead</option>
                          <option value="Manager">Manager</option>
                          <option value="HR">HR Specialist</option>
                          <option value="Executive">Executive</option>
                          <option value="Contractor">Contractor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assigned Team</label>
                        <select
                          value={memberTeamId}
                          onChange={e => setMemberTeamId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={memberTitle}
                        onChange={e => setMemberTitle(e.target.value)}
                        placeholder="e.g. Senior DevOps Specialist"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Form Footer */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Creating as: <strong>{currentUser.name} ({activeRole})</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-xs"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-lg hover:opacity-90 transition-opacity text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create {itemType.toUpperCase()}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
