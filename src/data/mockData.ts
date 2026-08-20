import type { Tag, User, Team, Project, Task, EODEntry, Goal, Report, ActivityLog } from '../types';

export const INITIAL_TAGS: Tag[] = [
  {
    id: 'tag-1',
    orgId: 'org-acme',
    name: 'Frontend',
    colorHex: '#3B82F6',
    bgHex: 'rgba(59, 130, 246, 0.12)',
    textHex: '#1D4ED8',
    appliesTo: ['task', 'project'],
    description: 'User interface components and client application code',
    createdBy: 'David Kim'
  },
  {
    id: 'tag-2',
    orgId: 'org-acme',
    name: 'Backend',
    colorHex: '#6366F1',
    bgHex: 'rgba(99, 102, 241, 0.12)',
    textHex: '#4338CA',
    appliesTo: ['task', 'project'],
    description: 'APIs, database migrations, and microservice infrastructure',
    createdBy: 'David Kim'
  },
  {
    id: 'tag-3',
    orgId: 'org-acme',
    name: 'Critical Fix',
    colorHex: '#DC2626',
    bgHex: 'rgba(220, 38, 38, 0.12)',
    textHex: '#991B1B',
    appliesTo: ['task'],
    description: 'P0/P1 production issues requiring immediate turnaround',
    createdBy: 'Amaka Okafor'
  },
  {
    id: 'tag-4',
    orgId: 'org-acme',
    name: 'Design System',
    colorHex: '#8B5CF6',
    bgHex: 'rgba(139, 92, 246, 0.12)',
    textHex: '#6D28D9',
    appliesTo: ['task', 'project'],
    description: 'Component primitives, typography, and token guidelines',
    createdBy: 'Elena Rostova'
  },
  {
    id: 'tag-5',
    orgId: 'org-acme',
    name: 'Client Portal',
    colorHex: '#059669',
    bgHex: 'rgba(5, 150, 105, 0.12)',
    textHex: '#047857',
    appliesTo: ['project', 'goal'],
    description: 'Customer facing dashboard and onboarding workflow',
    createdBy: 'Sarah Jenkins'
  },
  {
    id: 'tag-6',
    orgId: 'org-acme',
    name: 'Q3 Campaign',
    colorHex: '#D97706',
    bgHex: 'rgba(217, 119, 6, 0.12)',
    textHex: '#B45309',
    appliesTo: ['project', 'goal', 'task'],
    description: 'Growth marketing and demand generation initiatives',
    createdBy: 'Priya Sharma'
  },
  {
    id: 'tag-7',
    orgId: 'org-acme',
    name: 'Infrastructure',
    colorHex: '#4B5563',
    bgHex: 'rgba(75, 85, 99, 0.12)',
    textHex: '#1F2937',
    appliesTo: ['task', 'project'],
    description: 'CI/CD pipelines, Docker, Kubernetes, and cloud security',
    createdBy: 'David Kim'
  },
  {
    id: 'tag-8',
    orgId: 'org-acme',
    name: 'Security Audit',
    colorHex: '#991B1B',
    bgHex: 'rgba(153, 27, 27, 0.12)',
    textHex: '#7F1D1D',
    appliesTo: ['task', 'goal'],
    description: 'SOC2 compliance, penetration test items, vulnerability patches',
    createdBy: 'David Kim'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    orgId: 'org-acme',
    name: 'Amaka Okafor',
    email: 'amaka@acme.com',
    role: 'Manager',
    teamId: 'team-eng',
    teamName: 'Core Engineering',
    title: 'Engineering Manager',
    avatarUrl: undefined,
    activeProjectIds: ['proj-1', 'proj-2'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-2',
    orgId: 'org-acme',
    name: 'Alex Chen',
    email: 'alex.chen@acme.com',
    role: 'Member',
    teamId: 'team-eng',
    teamName: 'Core Engineering',
    title: 'Senior Backend Engineer',
    avatarUrl: undefined,
    activeProjectIds: ['proj-1'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-3',
    orgId: 'org-acme',
    name: 'Elena Rostova',
    email: 'elena@acme.com',
    role: 'TeamLead',
    teamId: 'team-design',
    teamName: 'Product Design',
    title: 'Lead Product Designer',
    avatarUrl: undefined,
    activeProjectIds: ['proj-2', 'proj-3'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-4',
    orgId: 'org-acme',
    name: 'Marcus Vance',
    email: 'marcus@acme.com',
    role: 'Member',
    teamId: 'team-eng',
    teamName: 'Core Engineering',
    title: 'Frontend Engineer',
    avatarUrl: undefined,
    activeProjectIds: ['proj-2', 'proj-3'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-5',
    orgId: 'org-acme',
    name: 'Sarah Jenkins',
    email: 'sarah@acme.com',
    role: 'Executive',
    teamId: 'team-exec',
    teamName: 'Executive Leadership',
    title: 'VP of Product',
    avatarUrl: undefined,
    activeProjectIds: ['proj-3', 'proj-4'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-6',
    orgId: 'org-acme',
    name: 'Priya Sharma',
    email: 'priya@acme.com',
    role: 'Manager',
    teamId: 'team-mktg',
    teamName: 'Marketing Ops',
    title: 'Marketing Operations Manager',
    avatarUrl: undefined,
    activeProjectIds: ['proj-4'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-7',
    orgId: 'org-acme',
    name: 'Jordan Smith',
    email: 'jordan.contractor@acme.com',
    role: 'Contractor',
    teamId: 'team-mktg',
    teamName: 'Marketing Ops',
    title: 'Growth Specialist (Contractor)',
    avatarUrl: undefined,
    isContractor: true,
    activeProjectIds: ['proj-4'],
    capacityHoursPerWeek: 25
  },
  {
    id: 'user-8',
    orgId: 'org-acme',
    name: 'David Kim',
    email: 'david.admin@acme.com',
    role: 'Admin',
    teamId: 'team-exec',
    teamName: 'Executive Leadership',
    title: 'Chief Technology Officer',
    avatarUrl: undefined,
    activeProjectIds: ['proj-1', 'proj-2'],
    capacityHoursPerWeek: 40
  },
  {
    id: 'user-9',
    orgId: 'org-acme',
    name: 'Grace Vance',
    email: 'grace.hr@acme.com',
    role: 'HR',
    teamId: 'team-exec',
    teamName: 'People & Operations',
    title: 'People & Culture Director',
    avatarUrl: undefined,
    activeProjectIds: [],
    capacityHoursPerWeek: 40
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-eng',
    orgId: 'org-acme',
    name: 'Core Engineering',
    leadId: 'user-1',
    leadName: 'Amaka Okafor',
    memberIds: ['user-1', 'user-2', 'user-4', 'user-8']
  },
  {
    id: 'team-design',
    orgId: 'org-acme',
    name: 'Product Design',
    leadId: 'user-3',
    leadName: 'Elena Rostova',
    memberIds: ['user-3']
  },
  {
    id: 'team-mktg',
    orgId: 'org-acme',
    name: 'Marketing Ops',
    leadId: 'user-6',
    leadName: 'Priya Sharma',
    memberIds: ['user-6', 'user-7']
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    orgId: 'org-acme',
    name: 'Pulse Backend Architecture',
    description: 'High-concurrency API server with multi-tenant relational schema, WebSocket event bus, and RBAC middleware.',
    templateType: 'SoftwareSprint',
    teamId: 'team-eng',
    leadId: 'user-1',
    memberIds: ['user-1', 'user-2', 'user-8'],
    tagIds: ['tag-2', 'tag-7', 'tag-8'],
    linkedGoalIds: ['goal-1'],
    startDate: '2026-08-01',
    targetEndDate: '2026-09-15',
    status: 'Active'
  },
  {
    id: 'proj-2',
    orgId: 'org-acme',
    name: 'Monochrome Design System & Component Kit',
    description: 'Accessible React UI components using strict monochrome palette, weighted icon indicators, and spring micro-interactions.',
    templateType: 'SoftwareSprint',
    teamId: 'team-design',
    leadId: 'user-3',
    memberIds: ['user-3', 'user-4'],
    tagIds: ['tag-1', 'tag-4'],
    linkedGoalIds: ['goal-1'],
    startDate: '2026-08-05',
    targetEndDate: '2026-09-30',
    status: 'Active'
  },
  {
    id: 'proj-3',
    orgId: 'org-acme',
    name: 'Global Client Onboarding Portal',
    description: 'Self-serve enterprise onboarding workflow with role provisioning, template selection, and domain setup.',
    templateType: 'ClientOnboarding',
    teamId: 'team-eng',
    leadId: 'user-5',
    memberIds: ['user-3', 'user-4', 'user-5'],
    tagIds: ['tag-5'],
    linkedGoalIds: ['goal-2'],
    startDate: '2026-08-10',
    targetEndDate: '2026-10-15',
    status: 'Planning'
  },
  {
    id: 'proj-4',
    orgId: 'org-acme',
    name: 'Q3 Enterprise Product Launch',
    description: 'Multi-channel launch campaign targeting enterprise tech buyers with interactive landing pages and case studies.',
    templateType: 'MarketingCampaign',
    teamId: 'team-mktg',
    leadId: 'user-6',
    memberIds: ['user-6', 'user-7', 'user-5'],
    tagIds: ['tag-6'],
    linkedGoalIds: ['goal-3'],
    startDate: '2026-08-01',
    targetEndDate: '2026-09-01',
    status: 'Active'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    orgId: 'org-acme',
    projectId: 'proj-1',
    projectName: 'Pulse Backend Architecture',
    title: 'Implement Multi-Tenant RBAC Middleware',
    description: 'Ensure every incoming REST & WebSocket request verifies org_id claims and validates permissions against role hierarchy.',
    status: 'InProgress',
    priority: 'Urgent',
    assigneeIds: ['user-2'],
    estimatedHours: 24,
    actualHours: 18,
    dueDate: '2026-08-14',
    startDate: '2026-08-08',
    tagIds: ['tag-2', 'tag-8'],
    linkedGoalId: 'goal-1',
    dependencyTaskIds: [],
    subtasks: [
      { id: 'sub-1', title: 'Define JWT claim payload schema', done: true },
      { id: 'sub-2', title: 'Write express/nest permission guard decorator', done: true },
      { id: 'sub-3', title: 'Unit test Contractor restricted access branch', done: false }
    ],
    comments: [
      { id: 'c-1', authorId: 'user-1', authorName: 'Amaka Okafor', text: 'Please ensure org_id is indexed on foreign keys for fast filter lookup.', createdAt: '2026-08-09T10:30:00Z' },
      { id: 'c-2', authorId: 'user-2', authorName: 'Alex Chen', text: 'Done! Added composite indexes on (org_id, id) across all tables.', createdAt: '2026-08-10T14:15:00Z' }
    ],
    createdAt: '2026-08-08T09:00:00Z',
    updatedAt: '2026-08-11T11:00:00Z'
  },
  {
    id: 'task-102',
    orgId: 'org-acme',
    projectId: 'proj-2',
    projectName: 'Monochrome Design System & Component Kit',
    title: 'Build Universal Entity Link & Hover Preview Popover',
    description: 'Create reusable `<EntityLink />` component that renders person/project/task/goal/tag badges with popover detail preview cards.',
    status: 'Done',
    priority: 'High',
    assigneeIds: ['user-4'],
    estimatedHours: 16,
    actualHours: 14,
    dueDate: '2026-08-11',
    startDate: '2026-08-09',
    tagIds: ['tag-1', 'tag-4'],
    linkedGoalId: 'goal-1',
    dependencyTaskIds: [],
    subtasks: [
      { id: 'sub-4', title: 'Design hover card layout with Framer Motion', done: true },
      { id: 'sub-5', title: 'Add slide-over trigger on click', done: true }
    ],
    comments: [
      { id: 'c-3', authorId: 'user-3', authorName: 'Elena Rostova', text: 'Verified stroke weights match Lucide icon standard!', createdAt: '2026-08-11T09:00:00Z' }
    ],
    createdAt: '2026-08-09T09:00:00Z',
    updatedAt: '2026-08-11T10:30:00Z'
  },
  {
    id: 'task-103',
    orgId: 'org-acme',
    projectId: 'proj-1',
    projectName: 'Pulse Backend Architecture',
    title: 'Fix PostgreSQL Deadlock in EOD Submission Queue',
    description: 'High concurrency during 5 PM check-in window triggers database lock contention on user EOD aggregations.',
    status: 'Blocked',
    priority: 'Urgent',
    assigneeIds: ['user-2'],
    estimatedHours: 12,
    actualHours: 8,
    dueDate: '2026-08-12',
    startDate: '2026-08-10',
    tagIds: ['tag-2', 'tag-3'],
    linkedGoalId: 'goal-1',
    dependencyTaskIds: ['task-101'],
    blockedReason: 'Waiting for DB connection pool migration to transaction-level pgbouncer proxy.',
    subtasks: [
      { id: 'sub-6', title: 'Reproduce locking queue in local benchmark script', done: true },
      { id: 'sub-7', title: 'Deploy pgbouncer transaction pool config', done: false }
    ],
    comments: [
      { id: 'c-4', authorId: 'user-2', authorName: 'Alex Chen', text: 'Flagged to Amaka: need DevOps assistance for pgbouncer staging deployment.', createdAt: '2026-08-11T10:45:00Z' }
    ],
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-08-11T11:15:00Z'
  },
  {
    id: 'task-104',
    orgId: 'org-acme',
    projectId: 'proj-2',
    projectName: 'Monochrome Design System & Component Kit',
    title: 'Develop Multi-Category Filter Bar with Saved Views',
    description: 'Implement persistent filter bar supporting Tag swatches, Status icons, Assignee avatars, Priority, Project, and Pinned views.',
    status: 'InProgress',
    priority: 'High',
    assigneeIds: ['user-4', 'user-3'],
    estimatedHours: 20,
    actualHours: 10,
    dueDate: '2026-08-15',
    startDate: '2026-08-10',
    tagIds: ['tag-1', 'tag-4'],
    linkedGoalId: 'goal-1',
    dependencyTaskIds: ['task-102'],
    subtasks: [
      { id: 'sub-8', title: 'Color swatch selector component', done: true },
      { id: 'sub-9', title: 'AND/OR boolean logic state handler', done: true },
      { id: 'sub-10', title: 'LocalStorage saved view persistence', done: false }
    ],
    comments: [],
    createdAt: '2026-08-10T13:00:00Z',
    updatedAt: '2026-08-11T08:00:00Z'
  },
  {
    id: 'task-105',
    orgId: 'org-acme',
    projectId: 'proj-3',
    projectName: 'Global Client Onboarding Portal',
    title: 'Design Client Workflows & Invitation Accept Flow',
    description: 'Figma wireframes and interactive prototypes for organization admin onboarding and team member invite link resolution.',
    status: 'AtRisk',
    priority: 'Medium',
    assigneeIds: ['user-3'],
    estimatedHours: 30,
    actualHours: 22,
    dueDate: '2026-08-18',
    startDate: '2026-08-04',
    tagIds: ['tag-4', 'tag-5'],
    linkedGoalId: 'goal-2',
    dependencyTaskIds: [],
    subtasks: [
      { id: 'sub-11', title: 'Enterprise SSO setup wireframes', done: true },
      { id: 'sub-12', title: 'Role assignment preview step', done: false }
    ],
    comments: [
      { id: 'c-5', authorId: 'user-5', authorName: 'Sarah Jenkins', text: 'Let’s ensure compliance check is integrated into step 2.', createdAt: '2026-08-07T16:00:00Z' }
    ],
    createdAt: '2026-08-04T10:00:00Z',
    updatedAt: '2026-08-10T17:00:00Z'
  },
  {
    id: 'task-106',
    orgId: 'org-acme',
    projectId: 'proj-4',
    projectName: 'Q3 Enterprise Product Launch',
    title: 'Author Technical Case Studies & Customer Landing Copy',
    description: 'Write 3 deep-dive case studies showcasing velocity improvements and blocker resolution metrics.',
    status: 'InProgress',
    priority: 'High',
    assigneeIds: ['user-6', 'user-7'],
    estimatedHours: 25,
    actualHours: 15,
    dueDate: '2026-08-16',
    startDate: '2026-08-06',
    tagIds: ['tag-6'],
    linkedGoalId: 'goal-3',
    dependencyTaskIds: [],
    subtasks: [
      { id: 'sub-13', title: 'Interview Core Eng lead (Amaka)', done: true },
      { id: 'sub-14', title: 'Draft Case Study 1: FinTech Scale-Up', done: true },
      { id: 'sub-15', title: 'Draft Case Study 2: Global Agency Ops', done: false }
    ],
    comments: [
      { id: 'c-6', authorId: 'user-7', authorName: 'Jordan Smith', text: 'Completed draft for FinTech case study! Ready for Priya review.', createdAt: '2026-08-11T09:30:00Z' }
    ],
    createdAt: '2026-08-06T11:00:00Z',
    updatedAt: '2026-08-11T09:45:00Z'
  },
  {
    id: 'task-107',
    orgId: 'org-acme',
    projectId: 'proj-2',
    projectName: 'Monochrome Design System & Component Kit',
    title: 'Interactive Relationship Map Graph (SVG / Canvas)',
    description: 'Render visual node-graph illustrating Project ↔ People ↔ Tasks ↔ Goals connections with zoom and click interaction.',
    status: 'Todo',
    priority: 'Medium',
    assigneeIds: ['user-4'],
    estimatedHours: 18,
    actualHours: 0,
    dueDate: '2026-08-20',
    startDate: '2026-08-15',
    tagIds: ['tag-1', 'tag-4'],
    linkedGoalId: 'goal-1',
    dependencyTaskIds: ['task-102'],
    subtasks: [
      { id: 'sub-16', title: 'Node coordinates force calculation', done: false },
      { id: 'sub-17', title: 'Pan and zoom SVG container wrapper', done: false }
    ],
    comments: [],
    createdAt: '2026-08-11T08:00:00Z',
    updatedAt: '2026-08-11T08:00:00Z'
  }
];

export const INITIAL_EOD_ENTRIES: EODEntry[] = [
  {
    id: 'eod-1',
    userId: 'user-2',
    userName: 'Alex Chen',
    userAvatar: undefined,
    userRole: 'Member',
    teamId: 'team-eng',
    teamName: 'Core Engineering',
    date: '2026-08-10',
    accomplishments: [
      'Completed composite DB indexes for multi-tenant org_id performance',
      'Configured JWT role assertion guards in backend middleware'
    ],
    completedTaskIds: ['task-101'],
    blockers: 'Encountered lock contention under heavy queue loads on postgres EOD transaction table.',
    blockedTaskId: 'task-103',
    energyIndex: 3,
    flaggedToManager: true
  },
  {
    id: 'eod-2',
    userId: 'user-4',
    userName: 'Marcus Vance',
    userAvatar: undefined,
    userRole: 'Member',
    teamId: 'team-eng',
    teamName: 'Core Engineering',
    date: '2026-08-10',
    accomplishments: [
      'Finished EntityLink popover component with Framer Motion animations',
      'Tested multi-level slide-over drawer stacking with breadcrumb trail'
    ],
    completedTaskIds: ['task-102'],
    blockers: 'None. Smooth execution today.',
    energyIndex: 5,
    flaggedToManager: false
  },
  {
    id: 'eod-3',
    userId: 'user-3',
    userName: 'Elena Rostova',
    userAvatar: undefined,
    userRole: 'TeamLead',
    teamId: 'team-design',
    teamName: 'Product Design',
    date: '2026-08-10',
    accomplishments: [
      'Reviewed monochrome UI kit stroke weights for all Lucide icons',
      'Updated Figma tokens for 12 tag color swatches'
    ],
    completedTaskIds: [],
    blockers: 'Awaiting feedback from Sarah on Client Portal compliance step wireframe.',
    energyIndex: 4,
    flaggedToManager: false
  },
  {
    id: 'eod-4',
    userId: 'user-7',
    userName: 'Jordan Smith',
    userAvatar: undefined,
    userRole: 'Contractor',
    teamId: 'team-mktg',
    teamName: 'Marketing Ops',
    date: '2026-08-10',
    accomplishments: [
      'Finished 1st draft of FinTech enterprise case study',
      'Prepared social media copy schedule for Q3 campaign launch'
    ],
    completedTaskIds: ['task-106'],
    blockers: 'None.',
    energyIndex: 4,
    flaggedToManager: false
  }
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    orgId: 'org-acme',
    title: 'Launch Pulse Platform V1 with Multi-Tenant Security & Monochrome UI',
    description: 'Deliver core multi-tenant backend architecture, monochrome design system, and universal entity connectivity.',
    ownerType: 'org',
    ownerId: 'org-acme',
    ownerName: 'Acme Corporation',
    targetDate: '2026-09-30',
    status: 'OnTrack',
    tagIds: ['tag-1', 'tag-2', 'tag-4'],
    linkedTaskIds: ['task-101', 'task-102', 'task-103', 'task-104', 'task-107'],
    keyResults: [
      { id: 'kr-1', title: '100% backend API endpoints verified multi-tenant org_id scoped', targetValue: 100, currentValue: 80, unit: '%', linkedTaskIds: ['task-101'] },
      { id: 'kr-2', title: 'Monochrome UI kit components published & tested', targetValue: 15, currentValue: 12, unit: 'components', linkedTaskIds: ['task-102', 'task-104'] },
      { id: 'kr-3', title: 'Zero open P0/P1 production blockers', targetValue: 0, currentValue: 1, unit: 'blockers', linkedTaskIds: ['task-103'] }
    ]
  },
  {
    id: 'goal-2',
    orgId: 'org-acme',
    title: 'Enterprise Client Onboarding Time Reduction',
    description: 'Streamline client onboarding flow from 14 days down to 48 hours via automated portal.',
    ownerType: 'team',
    ownerId: 'team-eng',
    ownerName: 'Core Engineering & Design',
    targetDate: '2026-10-30',
    status: 'AtRisk',
    tagIds: ['tag-5'],
    linkedTaskIds: ['task-105'],
    keyResults: [
      { id: 'kr-4', title: 'Self-serve admin onboarding flow completed', targetValue: 100, currentValue: 45, unit: '%', linkedTaskIds: ['task-105'] }
    ]
  },
  {
    id: 'goal-3',
    orgId: 'org-acme',
    title: 'Q3 Growth & Demand Generation',
    description: 'Drive 50 new enterprise demo requests through Q3 launch marketing campaign.',
    ownerType: 'team',
    ownerId: 'team-mktg',
    ownerName: 'Marketing Ops',
    targetDate: '2026-09-15',
    status: 'OnTrack',
    tagIds: ['tag-6'],
    linkedTaskIds: ['task-106'],
    keyResults: [
      { id: 'kr-5', title: 'Published customer case studies', targetValue: 3, currentValue: 1, unit: 'studies', linkedTaskIds: ['task-106'] },
      { id: 'kr-6', title: 'Qualified Enterprise Demo Requests', targetValue: 50, currentValue: 22, unit: 'demos', linkedTaskIds: [] }
    ]
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-1',
    orgId: 'org-acme',
    type: 'weekly',
    title: 'Weekly Executive Operational Brief',
    periodLabel: 'Week 32 (Aug 4 – Aug 11, 2026)',
    createdAt: '2026-08-11T08:00:00Z',
    tasksCompleted: 14,
    tasksPlanned: 18,
    avgSentiment: 4.1,
    blockersRaised: 3,
    blockersResolved: 2,
    okrMilestonesReached: 2,
    executiveSummary: 'Strong delivery velocity across Core Engineering and Product Design. Pulse monochrome design tokens and Universal Entity Link primitives were successfully finalized. Backend team identified a database locking issue under high EOD load, which has been escalated for pgbouncer connection pool mitigation.',
    keyRisks: [
      'PostgreSQL lock contention on EOD check-in queue during peak 5 PM window',
      'Enterprise SSO compliance wireframes pending final executive approval'
    ],
    teamHighlights: [
      { teamName: 'Core Engineering', highlight: 'Shipped multi-tenant RBAC token validator & universal entity link hover previews.' },
      { teamName: 'Product Design', highlight: 'Completed icon stroke weight standardization for Lucide monochrome palette.' },
      { teamName: 'Marketing Ops', highlight: 'Finalized 1st draft for FinTech enterprise case study.' }
    ]
  },
  {
    id: 'rep-2',
    orgId: 'org-acme',
    type: 'monthly',
    title: 'Monthly Strategic OKR & Velocity Brief',
    periodLabel: 'July – August 2026 Rollup',
    createdAt: '2026-08-01T08:00:00Z',
    tasksCompleted: 58,
    tasksPlanned: 64,
    avgSentiment: 4.3,
    blockersRaised: 8,
    blockersResolved: 8,
    okrMilestonesReached: 5,
    executiveSummary: 'Monthly team output velocity increased by 18% compared to Q2 averages. EOD submission consistency reached 94% across all teams. OKR 1 (Pulse V1 Launch) is currently on track.',
    keyRisks: [
      'Capacity constraints in Product Design as client onboarding portal ramps up'
    ],
    teamHighlights: [
      { teamName: 'Core Engineering', highlight: 'Achieved 99.9% uptime and zero multi-tenant cross-talk incidents.' },
      { teamName: 'Marketing Ops', highlight: 'Generated 22 qualified enterprise leads ahead of Q3 product launch.' }
    ]
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    actorId: 'user-4',
    actorName: 'Marcus Vance',
    action: 'completed task',
    targetRef: { id: 'task-102', type: 'task', label: 'Build Universal Entity Link & Hover Preview Popover' },
    parentRef: { id: 'proj-2', type: 'project', label: 'Monochrome Design System' },
    timestamp: '2026-08-11T10:30:00Z'
  },
  {
    id: 'act-2',
    actorId: 'user-2',
    actorName: 'Alex Chen',
    action: 'flagged blocker on task',
    targetRef: { id: 'task-103', type: 'task', label: 'Fix PostgreSQL Deadlock in EOD Submission Queue' },
    parentRef: { id: 'proj-1', type: 'project', label: 'Pulse Backend Architecture' },
    timestamp: '2026-08-11T10:45:00Z'
  },
  {
    id: 'act-3',
    actorId: 'user-7',
    actorName: 'Jordan Smith',
    action: 'submitted EOD check-in with energy index',
    targetRef: { id: 'eod-4', type: 'person', label: 'Jordan Smith EOD', sublabel: 'Energy: 4/5' },
    timestamp: '2026-08-10T17:30:00Z'
  },
  {
    id: 'act-4',
    actorId: 'user-3',
    actorName: 'Elena Rostova',
    action: 'updated key result on goal',
    targetRef: { id: 'goal-1', type: 'goal', label: 'Launch Pulse Platform V1' },
    timestamp: '2026-08-10T14:00:00Z'
  }
];
