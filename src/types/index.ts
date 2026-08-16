export type Role = 'Admin' | 'Executive' | 'HR' | 'Manager' | 'TeamLead' | 'Member' | 'Contractor';

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Todo' | 'InProgress' | 'AtRisk' | 'Blocked' | 'Done';

export type WorkflowTemplate = 'SoftwareSprint' | 'BugTracking' | 'MarketingCampaign' | 'ClientOnboarding' | 'GeneralOps';

export type EntityType = 'person' | 'project' | 'task' | 'goal' | 'tag' | 'team';

export interface EntityRef {
  id: string;
  type: EntityType;
  label: string;
  sublabel?: string;
  avatarUrl?: string;
  color?: string;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: Role;
  teamId: string;
  teamName: string;
  title: string;
  avatarUrl: string;
  isContractor?: boolean;
  activeProjectIds: string[];
  capacityHoursPerWeek: number;
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  leadId: string;
  leadName: string;
  memberIds: string[];
  workflowTemplate?: WorkflowTemplate;
}

export interface Tag {
  id: string;
  orgId: string;
  name: string;
  colorHex: string; // e.g. '#3B82F6' or muted swatches
  bgHex: string; // e.g. ~10% opacity tint
  textHex: string;
  appliesTo: ('task' | 'project' | 'person' | 'goal')[];
  description?: string;
  createdBy: string;
}

export interface Task {
  id: string;
  orgId: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeIds: string[];
  estimatedHours: number;
  actualHours: number;
  dueDate: string;
  startDate?: string;
  tagIds: string[];
  linkedGoalId?: string;
  dependencyTaskIds: string[];
  blockedReason?: string;
  subtasks: { id: string; title: string; done: boolean }[];
  comments: { id: string; authorId: string; authorName: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface EODEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: Role;
  teamId: string;
  teamName: string;
  date: string;
  accomplishments: string[];
  completedTaskIds: string[];
  blockers: string;
  blockedTaskId?: string;
  energyIndex: 1 | 2 | 3 | 4 | 5; // 1 (critical) to 5 (peak energy)
  flaggedToManager?: boolean;
}

export interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  linkedTaskIds: string[];
}

export interface Goal {
  id: string;
  orgId: string;
  title: string;
  description: string;
  ownerType: 'org' | 'team' | 'individual';
  ownerId: string; // orgId, teamId, or userId
  ownerName: string;
  keyResults: KeyResult[];
  linkedTaskIds: string[];
  tagIds: string[];
  targetDate: string;
  status: 'OnTrack' | 'AtRisk' | 'Behind' | 'Achieved';
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string;
  templateType: WorkflowTemplate;
  teamId: string;
  leadId: string;
  memberIds: string[];
  tagIds: string[];
  linkedGoalIds: string[];
  startDate: string;
  targetEndDate: string;
  status: 'Active' | 'Planning' | 'Completed' | 'OnHold';
}

export interface Report {
  id: string;
  orgId: string;
  type: 'weekly' | 'monthly';
  title: string;
  periodLabel: string; // e.g. "Week 32, Aug 2026"
  createdAt: string;
  tasksCompleted: number;
  tasksPlanned: number;
  avgSentiment: number;
  blockersRaised: number;
  blockersResolved: number;
  okrMilestonesReached: number;
  executiveSummary: string;
  keyRisks: string[];
  teamHighlights: { teamName: string; highlight: string }[];
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetRef: EntityRef;
  parentRef?: EntityRef;
  timestamp: string;
}

export interface FilterState {
  searchQuery: string;
  tagIds: string[];
  statuses: TaskStatus[];
  assigneeIds: string[];
  priorities: Priority[];
  projectIds: string[];
  hasBlockerOnly: boolean;
  dueDateRange?: { start?: string; end?: string };
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  isPinned?: boolean;
}

export type DrawerPanel = 
  | { type: 'task'; id: string }
  | { type: 'project'; id: string }
  | { type: 'person'; id: string }
  | { type: 'goal'; id: string }
  | { type: 'tag'; id: string }
  | { type: 'relationship-map'; projectId: string };
