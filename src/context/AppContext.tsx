import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  User, Role, Tag, Task, Project, Team, EODEntry, Goal, Report, 
  ActivityLog, FilterState, SavedView, DrawerPanel, Organization, Priority, TaskStatus, Notification
} from '../types';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { teamService } from '../services/teamService';
import { goalService } from '../services/goalService';
import { eodService } from '../services/eodService';
import { reportService } from '../services/reportService';
import { organizationService } from '../services/organizationService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { tagService } from '../services/tagService';
import { analyticsService, type AnalyticsData } from '../services/analyticsService';

interface AppContextType {
  // Current session & RBAC
  currentUser: User;
  updateCurrentUser: (userData: Partial<User>) => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Data collections
  users: User[];
  teams: Team[];
  tags: Tag[];
  projects: Project[];
  tasks: Task[];
  eodEntries: EODEntry[];
  goals: Goal[];
  reports: Report[];
  activities: ActivityLog[];
  savedViews: SavedView[];

  // Active view screen
  activeScreen: string;
  setActiveScreen: (screen: string) => void;

  // Drawer / Side-Panel Stack
  panelStack: DrawerPanel[];
  pushPanel: (panel: DrawerPanel) => void;
  popPanel: () => void;
  closeAllPanels: () => void;

  // Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Mobile & Sidebar Menu State
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  currentOrgSlug: string;
  setCurrentOrgSlug: (slug: string) => void;
  userOrgs: Organization[];
  pendingInvites: any[];
  addOrg: (org: Organization) => void;
  updateOrgMemberStatus: (slug: string, role: Role | 'Pending Role Assignment', status: 'APPROVED' | 'PENDING' | 'REJECTED') => void;
  refreshInvites: () => Promise<void>;
  inAppAcceptInvite: (inviteId: string) => Promise<any>;
  inAppDeclineInvite: (inviteId: string) => Promise<any>;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Task Filter Bar State
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  saveCurrentView: (name: string) => void;
  applySavedView: (view: SavedView) => void;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addSubtask: (taskId: string, title: string, assigneeId?: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<{ title: string; done: boolean; assigneeId?: string }>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, text: string) => void;
  updateComment: (taskId: string, commentId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  submitEOD: (entry: Omit<EODEntry, 'id' | 'userId' | 'userName' | 'userAvatar' | 'userRole' | 'teamId' | 'teamName'>) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  deleteTag: (tagId: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  addTeam: (team: Omit<Team, 'id' | 'orgId'>, targetOrgSlug?: string) => Promise<Team | void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  reorderTasks: (newTasks: Task[]) => void;
  reorderProjects: (newProjects: Project[]) => void;
  reorderGoals: (newGoals: Goal[]) => void;
  reorderTags: (newTags: Tag[]) => void;
  refreshReports: () => Promise<void>;
  generateReport: (payload: any) => Promise<any>;
  attachTagToEntity: (tagId: string, entityType: 'task' | 'project' | 'person' | 'goal', entityId: string) => Promise<void>;
  detachTagFromEntity: (tagId: string, entityType: 'task' | 'project' | 'person' | 'goal', entityId: string) => Promise<void>;
  analyticsData: AnalyticsData | null;
  isAnalyticsLoading: boolean;
  refreshAnalytics: (timeRange?: string) => Promise<void>;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  tagIds: [],
  statuses: [],
  assigneeIds: [],
  priorities: [],
  projectIds: [],
  hasBlockerOnly: false
};

const mapTaskStatusToFrontend = (status: string): TaskStatus => {
  switch (status?.toLowerCase()) {
    case 'in_progress': return 'InProgress';
    case 'at_risk': return 'AtRisk';
    case 'blocked': return 'Blocked';
    case 'done': return 'Done';
    default: return 'Todo';
  }
};

const mapTaskStatusToBackend = (status?: TaskStatus): string => {
  switch (status) {
    case 'InProgress': return 'in_progress';
    case 'AtRisk': return 'at_risk';
    case 'Blocked': return 'blocked';
    case 'Done': return 'done';
    default: return 'todo';
  }
};

const mapPriorityToFrontend = (priority: string): Priority => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'Urgent';
    case 'high': return 'High';
    case 'low': return 'Low';
    default: return 'Medium';
  }
};

const getInitialOrgs = (): Organization[] => {
  const stored = localStorage.getItem('pulse_user_orgs');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

const getInitialUser = (): User => ({
  id: localStorage.getItem('pulse_user_id') || '00000000-0000-0000-0000-000000000001',
  orgId: localStorage.getItem('pulse_tenant_slug') || 'epicordia',
  name: localStorage.getItem('pulse_user_name') || 'Workspace Admin',
  email: localStorage.getItem('pulse_user_email') || 'admin@pulse.dev',
  role: 'Admin',
  teamId: 'team-main',
  teamName: 'Core Operations',
  title: 'Workspace Admin',
  capacityHoursPerWeek: 40,
  activeProjectIds: []
});

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(getInitialUser());
  const [activeRole, setActiveRoleState] = useState<Role>('Admin');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pulse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pulse_theme', 'light');
    }
  }, [isDarkMode]);

  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eodEntries, setEodEntries] = useState<EODEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activities] = useState<ActivityLog[]>([]);

  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [panelStack, setPanelStack] = useState<DrawerPanel[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
const getInitialOrgSlug = (): string => {
  const storedSlug = localStorage.getItem('pulse_tenant_slug');
  if (storedSlug) return storedSlug;
  const orgs = getInitialOrgs();
  return orgs.length > 0 ? orgs[0].slug : '';
};

const [currentOrgSlug, setCurrentOrgSlug] = useState<string>(getInitialOrgSlug);
const [userOrgs, setUserOrgs] = useState<Organization[]>(getInitialOrgs());
const [pendingInvites, setPendingInvites] = useState<any[]>([]);
const [notifications, setNotifications] = useState<Notification[]>([]);

const fetchNotifications = async () => {
  try {
    const res = await notificationService.getNotifications();
    if (res?.notifications && Array.isArray(res.notifications)) {
      setNotifications(res.notifications);
    }
  } catch (err) {
    console.warn('[fetchNotifications error]:', err);
  }
};

const markNotificationAsRead = async (notificationId: string) => {
  setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  try {
    await notificationService.markAsRead(notificationId);
  } catch (err) {
    console.warn('[markNotificationAsRead error]:', err);
  }
};

const markAllNotificationsAsRead = async () => {
  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  try {
    await notificationService.markAllAsRead();
  } catch (err) {
    console.warn('[markAllNotificationsAsRead error]:', err);
  }
};

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);

  const refreshAnalytics = async (timeRange: string = '30d') => {
    setIsAnalyticsLoading(true);
    try {
      const res = await analyticsService.getAnalytics(currentOrgSlug, timeRange);
      if (res?.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.warn('[refreshAnalytics error]:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    setCurrentUser(prev => {
      const next = { ...prev, ...userData };
      if (userData.id) localStorage.setItem('pulse_user_id', userData.id);
      if (userData.email) localStorage.setItem('pulse_user_email', userData.email);
      if (userData.name) localStorage.setItem('pulse_user_name', userData.name);
      return next;
    });
  };

  // Fetch real data from backend API on mount & on org slug change
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        // Sync User & Fetch Me Profile + Org Memberships + Pending Invites from Backend
        const meRes = await authService.getMe().catch(() => null);
        if (meRes?.user) {
          setCurrentUser(prev => ({
            ...prev,
            id: meRes.user.id,
            email: meRes.user.email,
            name: meRes.user.fullName || prev.name,
          }));
          localStorage.setItem('pulse_user_id', meRes.user.id);
          localStorage.setItem('pulse_user_email', meRes.user.email);
          if (meRes.user.fullName) {
            localStorage.setItem('pulse_user_name', meRes.user.fullName);
          }
        }

        if (meRes?.pendingInvites) {
          setPendingInvites(meRes.pendingInvites);
        }

        if (meRes?.user?.memberships) {
          const userMemberships: Organization[] = meRes.user.memberships.map((m: any) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: (m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : 'Pending Role Assignment') as any,
            status: m.status.toUpperCase(),
            membersCount: m.organization?._count?.memberships ?? (m.organization?.membershipsCount || 1),
            activeProjects: m.organization?._count?.projects ?? 0,
          }));
          setUserOrgs(userMemberships);
          localStorage.setItem('pulse_user_orgs', JSON.stringify(userMemberships));
        }

        // Fetch Approved Org Members
        const membersRes = await organizationService.getOrgMembers(currentOrgSlug).catch(() => null);
        let fetchedUsers: User[] = [];
        if (membersRes?.members && Array.isArray(membersRes.members)) {
          fetchedUsers = membersRes.members.map((m: any) => ({
            id: m.id,
            orgId: m.orgId || currentOrgSlug,
            name: m.name || m.email.split('@')[0],
            email: m.email,
            role: m.role || 'Member',
            teamId: 'team-main',
            teamName: 'Core Operations',
            title: m.role || 'Member',
            avatarUrl: m.avatarUrl,
            capacityHoursPerWeek: m.capacityHoursPerWeek || 40,
            activeProjectIds: [],
          }));
        }

        const currentUserObj: User = {
          id: currentUser.id,
          orgId: currentOrgSlug,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role || 'Admin',
          teamId: 'team-main',
          teamName: 'Core Operations',
          title: currentUser.title || 'Workspace Admin',
          capacityHoursPerWeek: currentUser.capacityHoursPerWeek || 40,
          activeProjectIds: [],
        };

        if (!fetchedUsers.some(u => u.id === currentUser.id)) {
          fetchedUsers.unshift(currentUserObj);
        }
        setUsers(fetchedUsers);

        // Keep userOrgs member count in sync with fetched approved members
        if (fetchedUsers.length > 0 && currentOrgSlug) {
          setUserOrgs(prev => {
            const next = prev.map(org =>
              org.slug.toLowerCase() === currentOrgSlug.toLowerCase()
                ? { ...org, membersCount: Math.max(org.membersCount || 0, fetchedUsers.length) }
                : org
            );
            localStorage.setItem('pulse_user_orgs', JSON.stringify(next));
            return next;
          });
        }

        // Fetch Projects
        const projectsRes = await projectService.getProjects(currentOrgSlug).catch(() => null);
        if (projectsRes?.projects) {
          const mappedProjects: Project[] = projectsRes.projects.map((p: any) => ({
            id: p.id,
            orgId: p.orgId,
            name: p.name,
            description: p.description || '',
            status: (p.status?.toLowerCase() === 'planning' ? 'Planning' : p.status?.toLowerCase() === 'completed' ? 'Completed' : 'Active') as any,
            leadId: p.leadId || '',
            leadName: p.lead?.fullName || 'Unassigned',
            teamId: p.teamId || '',
            teamName: p.team?.name || '',
            startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
            targetEndDate: p.targetEndDate ? new Date(p.targetEndDate).toISOString().split('T')[0] : '',
            templateType: p.templateType || 'SoftwareSprint',
            memberIds: p.members ? p.members.map((m: any) => m.userId) : [],
            tagIds: p.projectTags ? p.projectTags.map((pt: any) => pt.tagId) : [],
          }));
          setProjects(mappedProjects);
        }

        // Fetch Tasks
        const tasksRes = await taskService.getTasks(currentOrgSlug).catch(() => null);
        if (tasksRes?.tasks) {
          const mappedTasks: Task[] = tasksRes.tasks.map((t: any) => ({
            id: t.id,
            orgId: t.orgId,
            projectId: t.projectId,
            projectName: t.project?.name || 'Project',
            title: t.title,
            description: t.description || '',
            status: mapTaskStatusToFrontend(t.status),
            priority: mapPriorityToFrontend(t.priority),
            assigneeIds: t.assignees ? t.assignees.map((a: any) => a.userId) : [],
            estimatedHours: Number(t.estimatedHours || 0),
            actualHours: Number(t.actualHours || 0),
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
            tagIds: t.taskTags ? t.taskTags.map((tt: any) => tt.tagId) : [],
            linkedGoalId: t.linkedGoalId,
            dependencyTaskIds: t.dependencies ? t.dependencies.map((d: any) => d.dependsOnTaskId) : [],
            blockedReason: t.blockedReason,
            subtasks: t.subtasks || [],
            comments: t.comments ? t.comments.map((c: any) => ({
              id: c.id,
              authorId: c.authorId,
              authorName: c.author?.fullName || 'User',
              text: c.text,
              createdAt: c.createdAt,
            })) : [],
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }));
          setTasks(mappedTasks);
        }

        // Fetch Teams
        const teamsRes = await teamService.getTeams(currentOrgSlug).catch(() => null);
        if (teamsRes?.teams) {
          const mappedTeams: Team[] = teamsRes.teams.map((tm: any) => ({
            id: tm.id,
            orgId: tm.orgId,
            name: tm.name,
            leadId: tm.leadId || '',
            leadName: tm.lead?.fullName || '',
            memberIds: tm.members ? tm.members.map((m: any) => m.userId) : [],
            workflowTemplate: tm.workflowTemplate,
          }));
          setTeams(mappedTeams);
        }

        // Fetch Goals
        const goalsRes = await goalService.getGoals(currentOrgSlug).catch(() => null);
        if (goalsRes?.goals) {
          const mappedGoals: Goal[] = goalsRes.goals.map((g: any) => ({
            id: g.id,
            orgId: g.orgId,
            title: g.title,
            description: g.description || '',
            ownerType: g.ownerType,
            ownerId: g.ownerId,
            ownerName: 'Org',
            targetDate: g.targetDate ? new Date(g.targetDate).toISOString().split('T')[0] : '',
            status: g.status === 'on_track' ? 'OnTrack' : g.status === 'at_risk' ? 'AtRisk' : 'Behind',
            keyResults: g.keyResults || [],
            tagIds: g.goalTags ? g.goalTags.map((gt: any) => gt.tagId) : [],
          }));
          setGoals(mappedGoals);
        }

        // Fetch EOD Entries
        const eodRes = await eodService.getEodEntries(currentOrgSlug).catch(() => null);
        if (eodRes?.entries) {
          const mappedEod: EODEntry[] = eodRes.entries.map((e: any) => ({
            id: e.id,
            userId: e.userId,
            userName: e.user?.fullName || 'Team Member',
            userAvatar: e.user?.avatarUrl,
            userRole: 'Member',
            teamId: e.teamId || '',
            teamName: 'Operations',
            date: e.entryDate ? new Date(e.entryDate).toISOString().split('T')[0] : '',
            accomplishments: e.accomplishments || [],
            completedTaskIds: e.completedTasks ? e.completedTasks.map((ct: any) => ct.taskId) : [],
            blockers: e.blockers || '',
            blockedTaskId: e.blockedTaskId,
            energyIndex: e.energyIndex || 3,
            flaggedToManager: e.flaggedToManager,
          }));
          setEodEntries(mappedEod);
        }

        // Fetch Reports
        const reportsRes = await reportService.getReports(currentOrgSlug).catch(() => null);
        if (reportsRes?.reports) {
          const mappedReports: Report[] = reportsRes.reports.map((r: any) => ({
            id: r.id,
            orgId: r.orgId,
            type: r.type || 'weekly_summary',
            title: r.title,
            periodLabel: r.periodLabel || 'Current Period',
            periodStart: r.periodStart ? new Date(r.periodStart).toISOString().split('T')[0] : '',
            periodEnd: r.periodEnd ? new Date(r.periodEnd).toISOString().split('T')[0] : '',
            status: (r.status === 'completed' ? 'Ready' : r.status === 'generating' ? 'Draft' : r.status) as any,
            pdfFileUrl: r.pdfFileUrl || '',
            summaryJson: r.summaryJson || null,
            errorMessage: r.errorMessage,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
            completedAt: r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : '',
            tasksCompleted: r.summaryJson?.completedTasks ?? r.summaryStats?.tasksCompleted ?? 0,
            tasksPlanned: r.summaryJson?.totalTasks ?? r.summaryStats?.tasksPlanned ?? 0,
            avgSentiment: r.summaryStats?.avgEnergy || 4.5,
            blockersRaised: r.summaryJson?.blockedTasks ?? r.summaryStats?.blockersRaised ?? 0,
            blockersResolved: r.summaryStats?.blockersResolved || 0,
            okrMilestonesReached: 0,
            executiveSummary: r.executiveSummary || 'Automated executive progress brief.',
            keyRisks: [],
            teamHighlights: []
          }));
          setReports(mappedReports);
        }

        // Fetch Real Tags from Backend
        const tagsRes = await tagService.getTags(currentOrgSlug).catch(() => null);
        if (tagsRes?.tags && Array.isArray(tagsRes.tags)) {
          const mappedTags: Tag[] = tagsRes.tags.map((t: any) => ({
            id: t.id,
            orgId: t.orgId,
            name: t.name,
            colorHex: t.colorHex || '#3B82F6',
            bgHex: t.bgHex || 'rgba(59, 130, 246, 0.1)',
            textHex: t.textHex || '#3B82F6',
            description: t.description,
            createdBy: '',
            appliesTo: ['task', 'project', 'person', 'goal'],
          }));
          setTags(mappedTags);
        }

        // Fetch Real Notifications from Backend
        await fetchNotifications();

        // Fetch Real Analytics from Backend
        await refreshAnalytics();
      } catch (err) {
        console.warn('[AppContext] Offline or API load error, using local fallback state:', err);
      }
    };

    loadBackendData();
  }, [currentOrgSlug]);

  const addOrg = async (org: Organization) => {
    setUserOrgs(prev => {
      const existing = prev.find(o => o.slug === org.slug);
      let next;
      if (existing) {
        next = prev.map(o => o.slug === org.slug ? { ...o, ...org } : o);
      } else {
        next = [...prev, org];
      }
      localStorage.setItem('pulse_user_orgs', JSON.stringify(next));
      return next;
    });

    setCurrentOrgSlug(org.slug);
    localStorage.setItem('pulse_tenant_slug', org.slug);

    // Create org in Backend API and wait for DB transaction to complete
    try {
      await organizationService.createOrganization({
        name: org.name,
        slug: org.slug,
      });
    } catch (err) {
      console.warn('[addOrg API Error]:', err);
    }
  };

  const updateOrgMemberStatus = (slug: string, role: Role | 'Pending Role Assignment', status: 'APPROVED' | 'PENDING' | 'REJECTED') => {
    setUserOrgs(prev => {
      const next = prev.map(o => o.slug === slug ? { ...o, role, status } : o);
      localStorage.setItem('pulse_user_orgs', JSON.stringify(next));
      return next;
    });
    localStorage.setItem(`pulse_org_status_${slug}`, status);
    if (role !== 'Pending Role Assignment') {
      localStorage.setItem(`pulse_user_role_${slug}`, role);
    }
  };

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: 'sv-1',
      name: 'My Critical Frontend Bugs',
      isPinned: true,
      filters: {
        ...DEFAULT_FILTERS,
        tagIds: ['tag-1', 'tag-3'],
        priorities: ['Urgent', 'High']
      }
    },
    {
      id: 'sv-2',
      name: 'Blocked Backend Items',
      isPinned: true,
      filters: {
        ...DEFAULT_FILTERS,
        tagIds: ['tag-2'],
        statuses: ['Blocked'],
        hasBlockerOnly: true
      }
    }
  ]);

  const setActiveRole = (role: Role) => {
    setActiveRoleState(role);
    const matchedUser = users.find(u => u.role === role) || { ...currentUser, role };
    setCurrentUser(matchedUser);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pushPanel = (panel: DrawerPanel) => {
    setPanelStack(prev => [...prev, panel]);
  };

  const popPanel = () => {
    setPanelStack(prev => prev.slice(0, prev.length - 1));
  };

  const closeAllPanels = () => {
    setPanelStack([]);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const saveCurrentView = (name: string) => {
    const newView: SavedView = {
      id: `sv-${Date.now()}`,
      name,
      filters: { ...filters },
      isPinned: false
    };
    setSavedViews(prev => [...prev, newView]);
  };

  const applySavedView = (view: SavedView) => {
    setFilters(view.filters);
  };

  // Data mutation actions synced with backend API
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await taskService.createTask(currentOrgSlug, {
      projectId: taskData.projectId,
      title: taskData.title,
      description: taskData.description,
      status: mapTaskStatusToBackend(taskData.status),
      priority: taskData.priority?.toLowerCase(),
      assigneeIds: taskData.assigneeIds,
      estimatedHours: taskData.estimatedHours,
      dueDate: taskData.dueDate,
    });

    if (res?.task?.id) {
      const createdTask: Task = {
        id: res.task.id,
        orgId: res.task.orgId,
        projectId: res.task.projectId,
        projectName: taskData.projectName || 'Project',
        title: res.task.title,
        description: res.task.description || '',
        status: mapTaskStatusToFrontend(res.task.status),
        priority: mapPriorityToFrontend(res.task.priority),
        assigneeIds: res.task.assignees ? res.task.assignees.map((a: any) => a.userId) : [],
        estimatedHours: Number(res.task.estimatedHours || 0),
        actualHours: Number(res.task.actualHours || 0),
        dueDate: res.task.dueDate ? new Date(res.task.dueDate).toISOString().split('T')[0] : '',
        startDate: res.task.startDate ? new Date(res.task.startDate).toISOString().split('T')[0] : '',
        tagIds: [],
        linkedGoalId: res.task.linkedGoalId,
        dependencyTaskIds: [],
        blockedReason: res.task.blockedReason,
        subtasks: [],
        comments: [],
        createdAt: res.task.createdAt,
        updatedAt: res.task.updatedAt,
      };
      setTasks(prev => [createdTask, ...prev]);
      return createdTask;
    }
    throw new Error(res?.error || 'Failed to create task in database.');
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const timestamp = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: timestamp } : t));

    try {
      await taskService.updateTask(currentOrgSlug, taskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status ? mapTaskStatusToBackend(updates.status) : undefined,
        priority: updates.priority ? updates.priority.toLowerCase() : undefined,
        blockedReason: updates.blockedReason,
        actualHours: updates.actualHours,
      });
    } catch (err) {
      console.warn('[updateTask API error]:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setPanelStack(prev => prev.filter(p => !(p.type === 'task' && p.id === taskId)));
    try {
      if (currentOrgSlug) {
        await taskService.deleteTask(currentOrgSlug, taskId);
      }
    } catch (err) {
      console.warn('[deleteTask API error]:', err);
    }
  };

  const addSubtask = async (taskId: string, title: string, assigneeId?: string) => {
    const tempId = `sub-${Date.now()}`;
    const newSubtask = { id: tempId, title, done: false, assigneeId };
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: [...(t.subtasks || []), newSubtask] };
    }));
    try {
      if (currentOrgSlug) {
        const res = await taskService.createSubtask(currentOrgSlug, taskId, title);
        if (res?.subtask?.id) {
          setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: (t.subtasks || []).map(st => st.id === tempId ? { ...st, id: res.subtask.id } : st),
            };
          }));
        }
      }
    } catch (err) {
      console.warn('[addSubtask error]:', err);
    }
  };

  const updateSubtask = async (taskId: string, subtaskId: string, updates: Partial<{ title: string; done: boolean; assigneeId?: string }>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, ...updates } : st)
      };
    }));
    try {
      if (currentOrgSlug) {
        await taskService.updateSubtask(currentOrgSlug, taskId, subtaskId, updates);
      }
    } catch (err) {
      console.warn('[updateSubtask error]:', err);
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId) };
    }));
    try {
      if (currentOrgSlug) {
        await taskService.deleteSubtask(currentOrgSlug, taskId, subtaskId);
      }
    } catch (err) {
      console.warn('[deleteSubtask error]:', err);
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    let nextDone = true;
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).map(st => {
          if (st.id === subtaskId) {
            nextDone = !st.done;
            return { ...st, done: nextDone };
          }
          return st;
        })
      };
    }));
    try {
      if (currentOrgSlug) {
        await taskService.updateSubtask(currentOrgSlug, taskId, subtaskId, { done: nextDone });
      }
    } catch (err) {
      console.warn('[toggleSubtask error]:', err);
    }
  };

  const addComment = async (taskId: string, text: string) => {
    const tempId = `comment-${Date.now()}`;
    const newComment = {
      id: tempId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      text,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, comments: [...(t.comments || []), newComment] };
    }));
    try {
      if (currentOrgSlug) {
        const res = await taskService.addComment(currentOrgSlug, taskId, text);
        if (res?.comment?.id) {
          setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              comments: (t.comments || []).map(c => c.id === tempId ? { ...c, id: res.comment.id } : c),
            };
          }));
        }
      }
    } catch (err) {
      console.warn('[addComment error]:', err);
    }
  };

  const updateComment = (taskId: string, commentId: string, text: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        comments: (t.comments || []).map(c => c.id === commentId ? { ...c, text } : c)
      };
    }));
  };

  const deleteComment = async (taskId: string, commentId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) };
    }));
    try {
      if (currentOrgSlug) {
        await taskService.deleteComment(currentOrgSlug, taskId, commentId);
      }
    } catch (err) {
      console.warn('[deleteComment error]:', err);
    }
  };

  const submitEOD = async (entryData: Omit<EODEntry, 'id' | 'userId' | 'userName' | 'userAvatar' | 'userRole' | 'teamId' | 'teamName'>) => {
    const res = await eodService.submitEod(currentOrgSlug, {
      entryDate: entryData.date,
      accomplishments: entryData.accomplishments,
      blockers: entryData.blockers,
      energyIndex: entryData.energyIndex,
      flaggedToManager: entryData.flaggedToManager,
      completedTaskIds: entryData.completedTaskIds,
    });
    if (res?.entry?.id) {
      const createdEntry: EODEntry = {
        id: res.entry.id,
        userId: res.entry.userId,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        userRole: currentUser.role,
        teamId: res.entry.teamId || '',
        teamName: 'Operations',
        date: res.entry.entryDate ? new Date(res.entry.entryDate).toISOString().split('T')[0] : '',
        accomplishments: res.entry.accomplishments || [],
        completedTaskIds: res.entry.completedTasks ? res.entry.completedTasks.map((ct: any) => ct.taskId) : [],
        blockers: res.entry.blockers || '',
        blockedTaskId: res.entry.blockedTaskId,
        energyIndex: res.entry.energyIndex || 3,
        flaggedToManager: res.entry.flaggedToManager,
      };
      setEodEntries(prev => [createdEntry, ...prev.filter(e => !(e.userId === currentUser.id && e.date === entryData.date))]);
      return createdEntry;
    }
    throw new Error(res?.error || 'Failed to submit EOD entry to database.');
  };

  const addTag = async (newTagData: Omit<Tag, 'id'>) => {
    try {
      if (currentOrgSlug) {
        const res = await tagService.createTag(currentOrgSlug, {
          name: newTagData.name,
          colorHex: newTagData.colorHex,
          bgHex: newTagData.bgHex,
          textHex: newTagData.textHex,
          description: newTagData.description,
        });
        if (res?.tag) {
          const createdTag: Tag = {
            id: res.tag.id,
            orgId: res.tag.orgId,
            name: res.tag.name,
            colorHex: res.tag.colorHex,
            bgHex: res.tag.bgHex || 'rgba(59, 130, 246, 0.1)',
            textHex: res.tag.textHex || res.tag.colorHex,
            description: res.tag.description,
            createdBy: currentUser.id,
            appliesTo: newTagData.appliesTo || ['task', 'project', 'person', 'goal'],
          };
          setTags(prev => [...prev.filter(t => t.id !== createdTag.id), createdTag]);
          return createdTag;
        }
      }
    } catch (err) {
      console.warn('[addTag error]:', err);
    }
    const fallbackTag: Tag = { ...newTagData, id: `tag-${Date.now()}` };
    setTags(prev => [...prev, fallbackTag]);
    return fallbackTag;
  };

  const updateTag = async (tagId: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, ...updates } : t));
    try {
      if (currentOrgSlug) {
        await tagService.updateTag(currentOrgSlug, tagId, updates);
      }
    } catch (err) {
      console.warn('[updateTag error]:', err);
    }
  };

  const deleteTag = async (tagId: string) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
    try {
      if (currentOrgSlug) {
        await tagService.deleteTag(currentOrgSlug, tagId);
      }
    } catch (err) {
      console.warn('[deleteTag error]:', err);
    }
  };

  const attachTagToEntity = async (tagId: string, entityType: 'task' | 'project' | 'person' | 'goal', entityId: string) => {
    if (entityType === 'task') {
      setTasks(prev => prev.map(t => t.id === entityId ? { ...t, tagIds: Array.from(new Set([...(t.tagIds || []), tagId])) } : t));
    } else if (entityType === 'project') {
      setProjects(prev => prev.map(p => p.id === entityId ? { ...p, tagIds: Array.from(new Set([...(p.tagIds || []), tagId])) } : p));
    } else if (entityType === 'goal') {
      setGoals(prev => prev.map(g => g.id === entityId ? { ...g, tagIds: Array.from(new Set([...(g.tagIds || []), tagId])) } : g));
    }
    try {
      if (currentOrgSlug) {
        await tagService.attachTag(currentOrgSlug, tagId, entityType, entityId);
      }
    } catch (err) {
      console.warn('[attachTagToEntity error]:', err);
    }
  };

  const detachTagFromEntity = async (tagId: string, entityType: 'task' | 'project' | 'person' | 'goal', entityId: string) => {
    if (entityType === 'task') {
      setTasks(prev => prev.map(t => t.id === entityId ? { ...t, tagIds: (t.tagIds || []).filter(id => id !== tagId) } : t));
    } else if (entityType === 'project') {
      setProjects(prev => prev.map(p => p.id === entityId ? { ...p, tagIds: (p.tagIds || []).filter(id => id !== tagId) } : p));
    } else if (entityType === 'goal') {
      setGoals(prev => prev.map(g => g.id === entityId ? { ...g, tagIds: (g.tagIds || []).filter(id => id !== tagId) } : g));
    }
    try {
      if (currentOrgSlug) {
        await tagService.detachTag(currentOrgSlug, tagId, entityType, entityId);
      }
    } catch (err) {
      console.warn('[detachTagFromEntity error]:', err);
    }
  };

  const refreshReports = async () => {
    try {
      if (!currentOrgSlug) return;
      const reportsRes = await reportService.getReports(currentOrgSlug).catch(() => null);
      if (reportsRes?.reports) {
        const mappedReports: Report[] = reportsRes.reports.map((r: any) => ({
          id: r.id,
          orgId: r.orgId,
          type: r.type || 'weekly_summary',
          title: r.title,
          periodLabel: r.periodLabel || 'Current Period',
          periodStart: r.periodStart ? new Date(r.periodStart).toISOString().split('T')[0] : '',
          periodEnd: r.periodEnd ? new Date(r.periodEnd).toISOString().split('T')[0] : '',
          status: (r.status === 'completed' ? 'Ready' : r.status === 'generating' ? 'Draft' : r.status) as any,
          pdfFileUrl: r.pdfFileUrl || '',
          summaryJson: r.summaryJson || null,
          errorMessage: r.errorMessage,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
          completedAt: r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : '',
          tasksCompleted: r.summaryJson?.completedTasks ?? r.summaryStats?.tasksCompleted ?? 0,
          tasksPlanned: r.summaryJson?.totalTasks ?? r.summaryStats?.tasksPlanned ?? 0,
          avgSentiment: r.summaryStats?.avgEnergy || 4.5,
          blockersRaised: r.summaryJson?.blockedTasks ?? r.summaryStats?.blockersRaised ?? 0,
          blockersResolved: r.summaryStats?.blockersResolved || 0,
          okrMilestonesReached: 0,
          executiveSummary: r.executiveSummary || 'Automated executive progress brief.',
          keyRisks: [],
          teamHighlights: []
        }));
        setReports(mappedReports);
      }
    } catch (err) {
      console.warn('[refreshReports error]:', err);
    }
  };

  const generateReport = async (payload: any) => {
    if (!currentOrgSlug) throw new Error('No active workspace selected.');
    const res = await reportService.generateReport(currentOrgSlug, payload);
    await refreshReports();
    // Poll for completion in background
    setTimeout(async () => {
      await refreshReports();
    }, 2500);
    return res;
  };

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    const res = await projectService.createProject(currentOrgSlug, {
      name: projectData.name,
      description: projectData.description,
      teamId: projectData.teamId,
      leadId: projectData.leadId,
      templateType: projectData.templateType,
      status: projectData.status,
      startDate: projectData.startDate,
      targetEndDate: projectData.targetEndDate,
    });

    if (res?.project?.id) {
      const createdProject: Project = {
        id: res.project.id,
        orgId: res.project.orgId,
        name: res.project.name,
        description: res.project.description || '',
        status: 'Active',
        leadId: res.project.leadId || '',
        teamId: res.project.teamId || '',
        startDate: res.project.startDate ? new Date(res.project.startDate).toISOString().split('T')[0] : '',
        targetEndDate: res.project.targetEndDate ? new Date(res.project.targetEndDate).toISOString().split('T')[0] : '',
        templateType: res.project.templateType || 'SoftwareSprint',
        memberIds: [],
        tagIds: [],
        linkedGoalIds: [],
      };
      setProjects(prev => [createdProject, ...prev]);
      return createdProject;
    }
    throw new Error(res?.error || 'Failed to create project in database.');
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setPanelStack(prev => prev.filter(p => !(p.type === 'project' && p.id === projectId)));
  };

  const addGoal = async (goalData: Omit<Goal, 'id'>) => {
    const res = await goalService.createGoal(currentOrgSlug, {
      title: goalData.title,
      description: goalData.description,
      ownerType: goalData.ownerType as any,
      targetDate: goalData.targetDate,
    });

    if (res?.goal?.id) {
      const createdGoal: Goal = {
        id: res.goal.id,
        orgId: res.goal.orgId,
        title: res.goal.title,
        description: res.goal.description || '',
        ownerType: res.goal.ownerType,
        ownerId: res.goal.ownerId,
        ownerName: 'Org',
        targetDate: res.goal.targetDate ? new Date(res.goal.targetDate).toISOString().split('T')[0] : '',
        status: res.goal.status === 'on_track' ? 'OnTrack' : res.goal.status === 'at_risk' ? 'AtRisk' : 'Behind',
        keyResults: res.goal.keyResults || [],
        linkedTaskIds: [],
        tagIds: [],
      };
      setGoals(prev => [createdGoal, ...prev]);
      return createdGoal;
    }
    throw new Error(res?.error || 'Failed to create goal in database.');
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `user-${Date.now()}` };
    setUsers(prev => {
      const nextUsers = [...prev, newUser];
      setUserOrgs(prevOrgs => {
        const nextOrgs = prevOrgs.map(o =>
          o.slug.toLowerCase() === currentOrgSlug.toLowerCase()
            ? { ...o, membersCount: Math.max((o.membersCount || 0) + 1, nextUsers.length) }
            : o
        );
        localStorage.setItem('pulse_user_orgs', JSON.stringify(nextOrgs));
        return nextOrgs;
      });
      return nextUsers;
    });
  };

  const addTeam = async (teamData: Omit<Team, 'id' | 'orgId'>, targetOrgSlug?: string) => {
    const slugToUse = targetOrgSlug || currentOrgSlug || localStorage.getItem('pulse_tenant_slug') || '';
    if (!slugToUse) {
      throw new Error('Organization context missing. Please select or create an organization first.');
    }

    const res = await teamService.createTeam(slugToUse, {
      name: teamData.name,
      workflowTemplate: teamData.workflowTemplate,
      memberIds: teamData.memberIds,
      leadId: teamData.leadId,
    });

    if (res?.team?.id) {
      const createdTeam: Team = {
        id: res.team.id,
        orgId: res.team.orgId,
        name: res.team.name,
        leadId: res.team.leadId,
        leadName: res.team.lead?.fullName || currentUser.name,
        memberIds: res.team.members ? res.team.members.map((m: any) => m.userId) : (teamData.memberIds || [currentUser.id]),
        workflowTemplate: res.team.workflowTemplate,
      };
      setTeams(prev => [createdTeam, ...prev]);
      return createdTeam;
    }
    throw new Error(res?.error || 'Failed to create team in database.');
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(tm => tm.id === teamId ? { ...tm, ...updates } : tm));
    try {
      await teamService.updateTeam(currentOrgSlug, teamId, {
        name: updates.name,
        workflowTemplate: updates.workflowTemplate,
        leadId: updates.leadId,
        memberIds: updates.memberIds,
      });
    } catch (err) {
      console.warn('[updateTeam API error]:', err);
    }
  };

  const deleteTeam = async (teamId: string) => {
    setTeams(prev => prev.filter(tm => tm.id !== teamId));
    try {
      await teamService.deleteTeam(currentOrgSlug, teamId);
    } catch (err) {
      console.warn('[deleteTeam API error]:', err);
    }
  };

  const reorderTasks = (newTasks: Task[]) => setTasks(newTasks);
  const reorderProjects = (newProjects: Project[]) => setProjects(newProjects);
  const reorderGoals = (newGoals: Goal[]) => setGoals(newGoals);
  const reorderTags = (newTags: Tag[]) => setTags(newTags);

  const refreshInvites = async () => {
    try {
      const res = await organizationService.getMyInvites();
      if (res?.invites) {
        setPendingInvites(res.invites);
      }
    } catch (err) {
      console.warn('[refreshInvites error]:', err);
    }
  };

  const inAppAcceptInvite = async (inviteId: string) => {
    const res = await organizationService.inAppAcceptInvite(inviteId);
    if (res?.success) {
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      // Refresh organizations list
      const meRes = await authService.getMe().catch(() => null);
      if (meRes?.user?.memberships) {
        const userMemberships: Organization[] = meRes.user.memberships.map((m: any) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: (m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : 'Member') as any,
          status: m.status.toUpperCase(),
          membersCount: m.organization?._count?.memberships ?? (m.organization?.membershipsCount || 1),
          activeProjects: m.organization?._count?.projects ?? 0,
        }));
        setUserOrgs(userMemberships);
        localStorage.setItem('pulse_user_orgs', JSON.stringify(userMemberships));
      }
      return res;
    }
    throw new Error(res?.error || 'Failed to accept invitation');
  };

  const inAppDeclineInvite = async (inviteId: string) => {
    const res = await organizationService.inAppDeclineInvite(inviteId);
    if (res?.success) {
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      return res;
    }
    throw new Error(res?.error || 'Failed to decline invitation');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        updateCurrentUser,
        activeRole,
        setActiveRole,
        isFocusMode,
        setIsFocusMode,
        isDarkMode,
        setIsDarkMode,

        users,
        teams,
        tags,
        projects,
        tasks,
        eodEntries,
        goals,
        reports,
        activities,
        savedViews,

        activeScreen,
        setActiveScreen,
        panelStack,
        pushPanel,
        popPanel,
        closeAllPanels,

        isSearchOpen,
        setIsSearchOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        currentOrgSlug,
        setCurrentOrgSlug,
        userOrgs,
        pendingInvites,
        addOrg,
        updateOrgMemberStatus,
        refreshInvites,
        inAppAcceptInvite,
        inAppDeclineInvite,
        notifications,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        filters,
        setFilters,
        resetFilters,
        saveCurrentView,
        applySavedView,

        addTask,
        updateTask,
        deleteTask,
        addSubtask,
        updateSubtask,
        deleteSubtask,
        toggleSubtask,
        addComment,
        updateComment,
        deleteComment,
        submitEOD,
        addTag,
        updateTag,
        deleteTag,
        addProject,
        updateProject,
        deleteProject,
        addGoal,
        updateGoal,
        addUser,
        addTeam,
        updateTeam,
        deleteTeam,
        reorderTasks,
        reorderProjects,
        reorderGoals,
        reorderTags,
        refreshReports,
        generateReport,
        attachTagToEntity,
        detachTagFromEntity,
        analyticsData,
        isAnalyticsLoading,
        refreshAnalytics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
