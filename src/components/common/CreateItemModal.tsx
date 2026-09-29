import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle2, Lock, FileText, Briefcase, Target, Tag as TagIcon, UserPlus, Users, AlertTriangle, ArrowRight, Loader2, Check, ExternalLink, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { organizationService } from '../../services/organizationService';
import type { Role, Priority, TaskStatus, WorkflowTemplate } from '../../types';

export type ItemType = 'task' | 'project' | 'goal' | 'tag' | 'member' | 'team';

interface CreateItemModalProps {
  isOpen: boolean;
  initialType?: ItemType;
  onClose: () => void;
}

const ITEM_META: Record<ItemType, { title: string; icon: React.FC<{ className?: string }> }> = {
  task: { title: 'Create New Task', icon: FileText },
  project: { title: 'Create New Project', icon: Briefcase },
  goal: { title: 'Create Strategic Goal', icon: Target },
  team: { title: 'Create New Team', icon: Users },
  member: { title: 'Invite Team Member', icon: UserPlus },
  tag: { title: 'Create Tag', icon: TagIcon }
};

const ENTITY_EXPLANATIONS: Record<ItemType, { subtitle: string; description: string; tips: string[] }> = {
  task: {
    subtitle: 'Actionable Unit of Work',
    description: 'A task is an actionable work item assigned to one or more teammates. It tracks status, priority, time estimates, and checklist subtasks within a parent project.',
    tips: [
      'Assign tasks to an active project to track milestone delivery.',
      'Add checklist subtasks for multi-step tasks.',
      'Accurate hour estimates help forecast team capacity.'
    ]
  },
  project: {
    subtitle: 'Strategic Project Initiative',
    description: 'A project groups related tasks, milestones, and deliverables under a dedicated workflow template (e.g. Software Sprint, Kanban, Marketing Campaign).',
    tips: [
      'Assign a Project Lead responsible for timelines and blocker triage.',
      'Choose a workflow template that matches your team methodology.',
      'Link projects to strategic goals to measure broader organizational impact.'
    ]
  },
  goal: {
    subtitle: 'High-Level Strategic Goal & Objective',
    description: 'A strategic goal defines what the organization aims to achieve over a quarter or annual cycle with measurable key results.',
    tips: [
      'Set quantifiable Key Results (e.g. percentages, units, currency).',
      'Assign ownership to the organization, a team, or an individual lead.',
      'Track progress over time to identify bottlenecks early.'
    ]
  },
  team: {
    subtitle: 'Functional Working Group',
    description: 'A team represents a department or squad (e.g., Engineering, Design, Core Operations) with a designated Team Lead and default workflow templates.',
    tips: [
      'Every project and task can affiliate with a primary team.',
      'Team leads can manage team rosters and review daily check-ins.'
    ]
  },
  member: {
    subtitle: 'Workspace Teammate Invitation',
    description: 'Invite new collaborators to join your Pulse workspace. Generate secure invitation tokens or shareable invite links with predefined roles and permissions.',
    tips: [
      'Select appropriate roles and permissions (Admin, Manager, Member, Contractor, etc.).',
      'Assigned teams give new members immediate visibility into active projects.'
    ]
  },
  tag: {
    subtitle: 'Cross-Workflow Categorization Label',
    description: 'Tags provide horizontal categorization across tasks, projects, goals, and team members to filter and correlate work across boundaries.',
    tips: [
      'Use consistent color coding for tags (e.g., #urgent, #backend, #q4-initiative).',
      'Filter tasks in lists and relationship spiderwebs by tag.'
    ]
  }
};

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  initialType = 'task',
  onClose
}) => {
  const { 
    activeRole, currentUser, currentOrgSlug, projects, teams, users,
    addTask, addProject, addGoal, addTag, addUser, addTeam, requestAccess 
  } = useApp();

  const [itemType, setItemType] = useState<ItemType>(initialType);
  const [showInfoExplainer, setShowInfoExplainer] = useState(false);
  const [accessRequestNote, setAccessRequestNote] = useState('');
  const [accessRequestSent, setAccessRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<{ token: string; inviteLink: string; email: string; role: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync initialType when modal opens
  useEffect(() => {
    if (isOpen) {
      setItemType(initialType);
      setShowInfoExplainer(false);
      setAccessRequestNote('');
      setAccessRequestSent(false);
      setSuccessMessage(null);
      setSubmitError(null);
      setGeneratedInvite(null);
      setCopiedLink(false);
      setIsSubmitting(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskSubtasks([]);
      setNewModalSubtaskTitle('');
      setNewModalSubtaskAssigneeId('');
      setProjectName('');
      setProjectDescription('');
      setGoalTitle('');
      setGoalDescription('');
      setTagName('');
      setTagDescription('');
      setMemberName('');
      setMemberEmail('');
      setNewTeamName('');
      setNewTeamMemberIds([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialType && isOpen) {
      setItemType(initialType);
    }
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateItemModal.handleSubmit] Triggered!', { itemType, memberName, memberEmail, activeRole });
    if (currentPrerequisite && !currentPrerequisite.met) {
      console.warn('[CreateItemModal.handleSubmit] Prerequisite not met:', currentPrerequisite);
      return;
    }
    if (!currentPermission.allowed) {
      console.warn('[CreateItemModal.handleSubmit] Permission not allowed:', currentPermission);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const activeOrg = currentOrgSlug || 'epicordia';
      if (itemType === 'task') {
        if (!taskTitle.trim()) {
          setSubmitError('Please enter a task title.');
          setIsSubmitting(false);
          return;
        }
        const targetProjId = taskProjectId || projects[0]?.id;
        const proj = projects.find(p => p.id === targetProjId);
        await addTask({
          orgId: activeOrg,
          projectId: targetProjId,
          projectName: proj ? proj.name : 'Core Project',
          title: taskTitle.trim(),
          description: taskDescription,
          status: taskStatus,
          priority: taskPriority,
          assigneeIds: [taskAssigneeId || currentUser.id],
          estimatedHours: taskEstimatedHours || 4,
          actualHours: 0,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          startDate: new Date().toISOString().split('T')[0],
          tagIds: [],
          dependencyTaskIds: [],
          subtasks: taskSubtasks.map((st, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            title: st.title,
            done: false,
            assigneeId: st.assigneeId
          })),
          comments: []
        });
        setSuccessMessage(`Task "${taskTitle}" created successfully!`);
      } else if (itemType === 'project') {
        if (!projectName.trim()) {
          setSubmitError('Please enter a project name.');
          setIsSubmitting(false);
          return;
        }
        const targetTeamId = projectTeamId || teams[0]?.id;
        await addProject({
          orgId: activeOrg,
          name: projectName.trim(),
          description: projectDescription,
          templateType: projectTemplate,
          teamId: targetTeamId,
          leadId: currentUser.id,
          memberIds: [currentUser.id],
          tagIds: [],
          linkedGoalIds: [],
          startDate: new Date().toISOString().split('T')[0],
          targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'Active'
        });
        setSuccessMessage(`Project "${projectName}" created successfully!`);
      } else if (itemType === 'goal') {
        if (!goalTitle.trim()) {
          setSubmitError('Please enter a goal title.');
          setIsSubmitting(false);
          return;
        }
        await addGoal({
          orgId: activeOrg,
          title: goalTitle.trim(),
          description: goalDescription,
          ownerType: goalOwnerType,
          ownerId: currentUser.id,
          ownerName: currentUser.name,
          keyResults: [
            { id: `kr-${Date.now()}`, title: 'Initial milestone delivery', targetValue: 100, currentValue: 25, unit: '%', linkedTaskIds: [] }
          ],
          linkedTaskIds: [],
          tagIds: [],
          targetDate: goalTargetDate || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
          status: 'OnTrack'
        });
        setSuccessMessage(`Goal "${goalTitle}" created successfully!`);
      } else if (itemType === 'tag') {
        if (!tagName.trim()) {
          setSubmitError('Please enter a tag name.');
          setIsSubmitting(false);
          return;
        }
        await addTag({
          orgId: activeOrg,
          name: tagName.trim(),
          colorHex: tagColorHex,
          bgHex: `${tagColorHex}20`,
          textHex: tagColorHex,
          appliesTo: ['task', 'project', 'person', 'goal'],
          description: tagDescription,
          createdBy: currentUser.name
        });
        setSuccessMessage(`Tag "#${tagName}" created successfully!`);
      } else if (itemType === 'member') {
        if (!memberName.trim() || !memberEmail.trim()) {
          setSubmitError('Please enter member name and email.');
          setIsSubmitting(false);
          return;
        }
        const targetTeamId = memberTeamId || teams[0]?.id;
        const team = teams.find(t => t.id === targetTeamId);
        
        // 1. Call Organization Service to generate invitation token & link
        const targetSlug = currentOrgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia';
        console.log('[CreateItemModal] 🚀 Inviting new member:', { memberName, memberEmail, memberRole, targetSlug });
        const inviteRes = await organizationService.createInvite(targetSlug, {
          email: memberEmail.trim(),
          role: memberRole,
          teamId: targetTeamId,
        });
        console.log('[CreateItemModal] 📬 createInvite response received:', inviteRes);

        addUser({
          orgId: targetSlug,
          name: memberName,
          email: memberEmail,
          role: memberRole,
          teamId: targetTeamId,
          teamName: team ? team.name : 'Core Team',
          title: memberTitle || `${memberRole} Specialist`,
          avatarUrl: undefined,
          activeProjectIds: [],
          capacityHoursPerWeek: 40
        });

        if (inviteRes?.token && inviteRes?.inviteLink) {
          setGeneratedInvite({
            token: inviteRes.token,
            inviteLink: inviteRes.inviteLink,
            email: memberEmail.trim(),
            role: memberRole,
          });
          setIsSubmitting(false);
          return; // Remain in modal showing the token and link
        }

        setSuccessMessage(`Team Member "${memberName}" invited as ${memberRole}!`);
      } else if (itemType === 'team') {
        if (!newTeamName.trim()) {
          setSubmitError('Please enter a team name.');
          setIsSubmitting(false);
          return;
        }
        const leadUser = users.find(u => u.id === newTeamLeadId);
        const finalMemberIds = Array.from(new Set(newTeamLeadId ? [newTeamLeadId, ...newTeamMemberIds] : newTeamMemberIds));
        await addTeam({
          name: newTeamName,
          leadId: newTeamLeadId,
          leadName: leadUser ? leadUser.name : currentUser.name,
          memberIds: finalMemberIds,
          workflowTemplate: newTeamTemplate
        });
        setSuccessMessage(`Team "${newTeamName}" created successfully!`);
      }

      setTimeout(() => {
        setSuccessMessage(null);
        setIsSubmitting(false);
        onClose();
      }, 200);
    } catch (err: any) {
      console.error('[CreateItemModal] ❌ Error in item creation modal:', err);
      setSubmitError(err.message || 'Failed to save. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Form states
  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProjectId, setTaskProjectId] = useState(projects[0]?.id || '');
  const [taskPriority, setTaskPriority] = useState<Priority>('Medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Todo');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState<number>(8);
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>(currentUser.id);
  const [taskSubtasks, setTaskSubtasks] = useState<{ title: string; assigneeId?: string }[]>([]);
  const [newModalSubtaskTitle, setNewModalSubtaskTitle] = useState('');
  const [newModalSubtaskAssigneeId, setNewModalSubtaskAssigneeId] = useState('');

  // Project state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTemplate, setProjectTemplate] = useState<WorkflowTemplate>('SoftwareSprint');
  const [projectTeamId, setProjectTeamId] = useState(teams[0]?.id || '');

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
  const [memberTeamId, setMemberTeamId] = useState(teams[0]?.id || '');

  // Team state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeadId, setNewTeamLeadId] = useState<string>(currentUser.id);
  const [newTeamTemplate, setNewTeamTemplate] = useState<WorkflowTemplate>('SoftwareSprint');
  const [newTeamMemberIds, setNewTeamMemberIds] = useState<string[]>([]);

  // Sync selection IDs when data collections change
  useEffect(() => {
    if (projects.length > 0 && (!taskProjectId || !projects.some(p => p.id === taskProjectId))) {
      setTaskProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (teams.length > 0) {
      if (!projectTeamId || !teams.some(t => t.id === projectTeamId)) {
        setProjectTeamId(teams[0].id);
      }
      if (!memberTeamId || !teams.some(t => t.id === memberTeamId)) {
        setMemberTeamId(teams[0].id);
      }
    }
  }, [teams]);

  if (!isOpen) return null;

  // Prerequisite Hierarchy Dependency Validation Checks
  const checkPrerequisites = (type: ItemType): { met: boolean; title: string; message: string; requiredType: ItemType; buttonText: string } | null => {
    if (type === 'task') {
      if (teams.length === 0) {
        return {
          met: false,
          title: 'Prerequisite Required: No Teams Found',
          message: 'Before creating a Task, your workspace needs at least one Team and a Project.',
          requiredType: 'team',
          buttonText: '+ Create a Team First'
        };
      }
      if (projects.length === 0) {
        return {
          met: false,
          title: 'Prerequisite Required: No Active Projects Found',
          message: 'Tasks must be assigned to an active project. Please create a Project first before adding a task.',
          requiredType: 'project',
          buttonText: '+ Create a Project First'
        };
      }
    }

    if (type === 'project') {
      if (teams.length === 0) {
        return {
          met: false,
          title: 'Prerequisite Required: No Teams Found',
          message: 'Projects must be assigned to a team workspace. Please create a Team first before adding a project.',
          requiredType: 'team',
          buttonText: '+ Create a Team First'
        };
      }
    }

    return null;
  };

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
          return { allowed: false, reason: 'Human Resources roles are scoped to people & team management rather than technical sprint tasks.' };
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
        return { allowed: false, reason: `The role "${activeRole}" cannot define strategic goals. Switch to Executive, Manager, or Admin.` };

      case 'tag':
        if (['Admin', 'Manager', 'TeamLead'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot create global organization tags. Switch to Team Lead, Manager, or Admin.` };

      case 'member':
        if (['Admin', 'Manager', 'HR'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot invite or provision user accounts. Switch to Human Resources, Manager, or Admin.` };

      case 'team':
        if (['Admin', 'Manager', 'HR'].includes(activeRole)) {
          return { allowed: true, reason: '' };
        }
        return { allowed: false, reason: `The role "${activeRole}" cannot create new organizational teams. Switch to Human Resources, Manager, or Admin.` };

      default:
        return { allowed: true, reason: '' };
    }
  };

  const currentPrerequisite = checkPrerequisites(itemType);
  const currentPermission = checkPermission(itemType);
  const MetaIcon = ITEM_META[itemType]?.icon || Plus;
  const metaTitle = ITEM_META[itemType]?.title || 'Add New Item';



  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white dark:bg-neutral-900 border-0 sm:border border-neutral-200 dark:border-neutral-800 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-2xl overflow-hidden text-xs flex flex-col max-h-none sm:max-h-[90vh]"
        >
          {/* Dedicated Header for Current Item Type */}
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold shrink-0 shadow-xs">
                <MetaIcon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                  {metaTitle}
                </h2>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  Role: <span className="font-bold text-neutral-900 dark:text-neutral-100">{activeRole}</span> ({currentUser.name})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInfoExplainer(!showInfoExplainer)}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showInfoExplainer 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="What is this item? (Explanation & Best Practices)"
              >
                <Info className="w-4.5 h-4.5" />
                <span className="hidden sm:inline font-mono text-[11px] font-bold">Explain</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dedicated Form Content Body */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {showInfoExplainer && (
              <div className="mb-5 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-sans space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{ENTITY_EXPLANATIONS[itemType]?.subtitle || 'Item Guide'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInfoExplainer(false)}
                    className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-100 text-[11px] font-mono cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                  {ENTITY_EXPLANATIONS[itemType]?.description}
                </p>
                {ENTITY_EXPLANATIONS[itemType]?.tips && (
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Best Practices:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-[11px] text-blue-800 dark:text-blue-300">
                      {ENTITY_EXPLANATIONS[itemType].tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {generatedInvite ? (
              /* Invitation Link & Token Generated View */
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-5 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                      Invitation Token & Link Generated!
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono">
                      Invited <span className="font-bold text-neutral-900 dark:text-neutral-100">{generatedInvite.email}</span> with role <span className="font-bold text-neutral-900 dark:text-neutral-100">{generatedInvite.role}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Invitation Token
                    </label>
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 select-all flex items-center justify-between">
                      <code>{generatedInvite.token}</code>
                      <span className="text-[10px] text-neutral-400 font-normal">Valid for 7 days</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Public Acceptance Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedInvite.inviteLink}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInvite.inviteLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                          </>
                        ) : (
                          'Copy Link'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-[11px] font-mono leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <strong>In-App Acceptance</strong>: When {generatedInvite.email} logs into Pulse, this workspace invitation will also appear directly in their workspace dashboard and switcher, allowing them to Accept or Decline with 1-click without needing the link.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(generatedInvite.inviteLink, '_blank');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    Open Acceptance Link
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedInvite(null);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : successMessage ? (
              <div className="p-6 rounded-2xl bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" />
                <h3 className="font-bold text-sm">{successMessage}</h3>
                <p className="text-xs text-green-700 dark:text-green-400 font-mono">
                  State updated in live app context. Closing popup...
                </p>
              </div>
            ) : currentPrerequisite && !currentPrerequisite.met ? (
              /* Prerequisite Dependency Alert Card */
              <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900 space-y-4 font-sans">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm tracking-tight text-amber-900 dark:text-amber-200">
                      {currentPrerequisite.title}
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-mono leading-relaxed">
                      {currentPrerequisite.message}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-200 dark:border-amber-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setItemType(currentPrerequisite.requiredType)}
                    className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{currentPrerequisite.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : !currentPermission.allowed ? (
              /* RBAC Restriction & Request Access Flow */
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-5 font-sans">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                      Access Restricted: Role [{activeRole}]
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-mono leading-relaxed">
                      {currentPermission.reason}
                    </p>
                  </div>
                </div>

                {accessRequestSent ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Access Request Submitted!</span>
                    </div>
                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                      Your request to create <strong>{itemType}</strong> items has been sent to workspace Admins. You will see an update in Notifications when approved.
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Request Elevated Privilege
                      </label>
                      <p className="text-[11px] text-neutral-500 font-mono mb-2">
                        Submit a request to workspace Admins to grant you permissions or upgrade your role.
                      </p>
                      <textarea
                        value={accessRequestNote}
                        onChange={e => setAccessRequestNote(e.target.value)}
                        placeholder={`Explain why you need access to create ${itemType}s (e.g., "I am leading sprint deliverable X this week")...`}
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 font-sans resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            await requestAccess(itemType, accessRequestNote.trim());
                            setAccessRequestSent(true);
                          } catch (err: any) {
                            setSubmitError(err.message || 'Failed to submit access request');
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <span>Request Access from Admin</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Dedicated Form Fields */
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Target Project *</label>
                        <select
                          value={taskProjectId || (projects[0]?.id || '')}
                          onChange={e => setTaskProjectId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={taskDescription}
                        onChange={e => setTaskDescription(e.target.value)}
                        placeholder="Provide details and acceptance criteria..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none resize-none font-sans"
                      />
                    </div>

                    {/* Initial Subtasks breakdown section */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Subtasks Breakdown (Optional)
                      </label>

                      {taskSubtasks.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {taskSubtasks.map((st, idx) => {
                            const subAssignee = users.find(u => u.id === st.assigneeId);
                            return (
                              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono">
                                <span className="text-neutral-800 dark:text-neutral-200 font-medium">{st.title}</span>
                                <div className="flex items-center gap-2">
                                  {subAssignee ? (
                                    <span className="text-[10px] text-neutral-500">→ {subAssignee.name}</span>
                                  ) : (
                                    <span className="text-[10px] text-neutral-400">Unassigned</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setTaskSubtasks(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-neutral-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newModalSubtaskTitle}
                          onChange={e => setNewModalSubtaskTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!newModalSubtaskTitle.trim()) return;
                              setTaskSubtasks(prev => [...prev, { title: newModalSubtaskTitle.trim(), assigneeId: newModalSubtaskAssigneeId || undefined }]);
                              setNewModalSubtaskTitle('');
                            }
                          }}
                          placeholder="Add subtask title..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono focus:outline-none"
                        />
                        <select
                          value={newModalSubtaskAssigneeId}
                          onChange={e => setNewModalSubtaskAssigneeId(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                          <option value="">Assignee (Optional)</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newModalSubtaskTitle.trim()) return;
                            setTaskSubtasks(prev => [...prev, { title: newModalSubtaskTitle.trim(), assigneeId: newModalSubtaskAssigneeId || undefined }]);
                            setNewModalSubtaskTitle('');
                          }}
                          className="px-3.5 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold rounded-xl hover:bg-neutral-300 cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Workflow Template</label>
                        <select
                          value={projectTemplate}
                          onChange={e => setProjectTemplate(e.target.value as WorkflowTemplate)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="SoftwareSprint">Software Sprint</option>
                          <option value="BugTracking">Bug Tracking</option>
                          <option value="MarketingCampaign">Marketing Campaign</option>
                          <option value="ClientOnboarding">Client Onboarding</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assigned Team *</label>
                        <select
                          value={projectTeamId || (teams[0]?.id || '')}
                          onChange={e => setProjectTeamId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none resize-none font-sans"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Goal Scope</label>
                        <select
                          value={goalOwnerType}
                          onChange={e => setGoalOwnerType(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-mono"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none resize-none font-sans"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block font-mono">This will be the primary workspace for your initial team members.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Designated Team Lead</label>
                      <select
                        value={newTeamLeadId}
                        onChange={e => setNewTeamLeadId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                          { id: 'MarketingCampaign', title: 'Sales & Pipeline', desc: 'Structured for lead progression, customer relationship management, and forecasting.' },
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

                    <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 font-sans">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          Assign Initial Team Members ({newTeamMemberIds.length} selected)
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">Lead is automatically assigned</span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                        {users.map(u => {
                          const isLead = u.id === newTeamLeadId;
                          const isSelected = isLead || newTeamMemberIds.includes(u.id);

                          return (
                            <div
                              key={u.id}
                              onClick={() => {
                                if (isLead) return;
                                if (newTeamMemberIds.includes(u.id)) {
                                  setNewTeamMemberIds(prev => prev.filter(id => id !== u.id));
                                } else {
                                  setNewTeamMemberIds(prev => [...prev, u.id]);
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
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
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</span>
                                {isLead && (
                                  <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1 py-0.2 rounded">
                                    LEAD
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono">{u.role}</span>
                            </div>
                          );
                        })}
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
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
                            className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assigned Role</label>
                        <select
                          value={memberRole}
                          onChange={e => setMemberRole(e.target.value as Role)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                        >
                          <option value="Member">Member</option>
                          <option value="TeamLead">Team Lead</option>
                          <option value="Manager">Manager</option>
                          <option value="HR">Human Resources Specialist</option>
                          <option value="Executive">Executive</option>
                          <option value="Contractor">Contractor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assigned Team</label>
                        <select
                          value={memberTeamId || (teams[0]?.id || '')}
                          onChange={e => setMemberTeamId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none font-sans"
                      />
                    </div>
                  </>
                )}

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-mono text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{submitError}</span>
                  </div>
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
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-xs cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-xl hover:opacity-90 transition-opacity text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Create {itemType.toUpperCase()}</span>
                        </>
                      )}
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
