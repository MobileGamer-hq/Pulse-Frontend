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
import { supabase, getOrgIdBySlug, getOrgBySlug } from '../services/supabaseClient';

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
  currentOrgName: string;
  currentOrg?: Organization;
  userOrgs: Organization[];
  pendingInvites: any[];
  addOrg: (org: Organization | { name: string; slug: string; industry?: string; companySize?: string; logoUrl?: string }) => Promise<any>;
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
  submitEOD: (entry: Omit<EODEntry, 'id' | 'userId' | 'userName' | 'userAvatar' | 'userRole' | 'teamId' | 'teamName'>) => Promise<EODEntry>;
  deleteEOD: (entryId: string) => Promise<void>;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  deleteTag: (tagId: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addTeam: (team: Omit<Team, 'id' | 'orgId'>, targetOrgSlug?: string) => Promise<Team | void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addMemberToTeam: (teamId: string, userId: string) => Promise<void>;
  removeMemberFromTeam: (teamId: string, userId: string) => Promise<void>;
  removeMemberFromOrg: (userId: string) => Promise<void>;
  requestAccess: (itemType: string, note?: string) => Promise<void>;
  approveAccessRequest: (notificationId: string, requesterUserId: string, grantedRole: Role) => Promise<void>;
  dismissAccessRequest: (notificationId: string) => Promise<void>;
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
  isWorkspaceLoading: boolean;
  refreshWorkspaceData: (isSilent?: boolean) => Promise<void>;
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
  id: localStorage.getItem('pulse_user_id') || '',
  orgId: localStorage.getItem('pulse_tenant_slug') || '',
  name: localStorage.getItem('pulse_user_name') || '',
  email: localStorage.getItem('pulse_user_email') || '',
  role: 'Member',
  teamId: 'team-main',
  teamName: 'Core Operations',
  title: '',
  capacityHoursPerWeek: 40,
  activeProjectIds: []
});

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialDarkMode = (): boolean => {
  try {
    const savedTheme = localStorage.getItem('pulse_theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
  } catch (e) {}
  return false;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(getInitialUser());
  const [activeRole, setActiveRoleState] = useState<Role>('Admin');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

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

  const getInitialActiveScreen = (): string => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/tasks')) return 'tasks';
      if (path.includes('/projects')) return 'projects';
      if (path.includes('/pulse')) return 'pulse';
      if (path.includes('/relationships') || path.includes('/spiderweb-relationships') || path.includes('/lab-relationships')) return 'relationships';
      if (path.includes('/goals')) return 'goals';
      if (path.includes('/analytics')) return 'analytics';
      if (path.includes('/reports')) return 'reports';
      if (path.includes('/team')) return 'team';
      if (path.includes('/admin')) return 'admin';
      if (path.includes('/archive')) return 'archive';
      if (path.includes('/notifications')) return 'notifications';
    }
    return 'dashboard';
  };

  const [activeScreen, setActiveScreen] = useState<string>(getInitialActiveScreen);
  const [panelStack, setPanelStack] = useState<DrawerPanel[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const getInitialOrgSlug = (): string => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const nonOrgPrefixes = ['welcome', 'login', 'signin', 'register', 'signup', 'select-org', 'create-org', 'join-org', 'invite'];
      if (pathSegments.length > 0 && !nonOrgPrefixes.includes(pathSegments[0])) {
        return pathSegments[0].toLowerCase();
      }
    }
    const storedSlug = localStorage.getItem('pulse_tenant_slug');
    if (storedSlug) return storedSlug.toLowerCase();
    const orgs = getInitialOrgs();
    return orgs.length > 0 ? orgs[0].slug.toLowerCase() : 'epicordia';
  };

  const [currentOrgSlug, setCurrentOrgSlug] = useState<string>(getInitialOrgSlug);
  const [userOrgs, setUserOrgs] = useState<Organization[]>(getInitialOrgs());
  const [activeOrgDetails, setActiveOrgDetails] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const currentOrg = userOrgs.find(
    o => (o.slug || '').toLowerCase() === (currentOrgSlug || '').toLowerCase()
  );

  const currentOrgName = currentOrg?.name || activeOrgDetails?.name || (
    currentOrgSlug
      ? currentOrgSlug
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Pulse Workspace'
  );

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
      const res = await analyticsService.getAnalytics(currentOrgSlug, timeRange, {
        tasks,
        eodEntries,
        projects,
        teams,
        users,
      });
      if (res?.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.warn('[refreshAnalytics error]:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState<boolean>(true);

  const updateCurrentUser = (userData: Partial<User>) => {
    setCurrentUser(prev => {
      const next = { ...prev, ...userData };
      if (userData.id) localStorage.setItem('pulse_user_id', userData.id);
      if (userData.email) localStorage.setItem('pulse_user_email', userData.email);
      if (userData.name) localStorage.setItem('pulse_user_name', userData.name);
      return next;
    });
  };

  const loadBackendData = async (isSilent = false) => {
    if (!isSilent) {
      setIsWorkspaceLoading(true);
    }
    const minLoadTimePromise = !isSilent ? new Promise(resolve => setTimeout(resolve, 300)) : Promise.resolve();
    try {
      // Parallelize all independent initial fetches
      const [
        meRes,
        membersRes,
        projectsRes,
        tasksRes,
        teamsRes,
        goalsRes,
        eodRes,
        reportsRes,
        tagsRes
      ] = await Promise.all([
        authService.getMe().catch(() => null),
        organizationService.getOrgMembers(currentOrgSlug).catch(() => null),
        projectService.getProjects(currentOrgSlug).catch(() => null),
        taskService.getTasks(currentOrgSlug).catch(() => null),
        teamService.getTeams(currentOrgSlug).catch(() => null),
        goalService.getGoals(currentOrgSlug).catch(() => null),
        eodService.getEodEntries(currentOrgSlug).catch(() => null),
        reportService.getReports(currentOrgSlug).catch(() => null),
        tagService.getTags(currentOrgSlug).catch(() => null),
      ]);

      // Sync User & Fetch Me Profile + Org Memberships + Pending Invites from Backend
      if (meRes?.user) {
        setCurrentUser(prev => ({
          ...prev,
          id: meRes.user.id,
          email: meRes.user.email,
          name: meRes.user.fullName || prev.name || meRes.user.email.split('@')[0],
        }));
        localStorage.setItem('pulse_user_id', meRes.user.id);
        localStorage.setItem('pulse_user_email', meRes.user.email);
        if (meRes.user.fullName) {
          localStorage.setItem('pulse_user_name', meRes.user.fullName);
        }
      } else {
        setCurrentUser({
          id: '',
          orgId: currentOrgSlug,
          name: '',
          email: '',
          role: 'Member',
          teamId: '',
          teamName: '',
          title: '',
          capacityHoursPerWeek: 40,
          activeProjectIds: [],
        });
      }

      if (meRes?.pendingInvites) {
        setPendingInvites(meRes.pendingInvites);
      }

      if (meRes?.user) {
        const userMemberships: Organization[] = (meRes.user.memberships || []).map((m: any) => ({
          id: m.organization?.id || m.org_id,
          name: m.organization?.name || 'Organization',
          slug: m.organization?.slug || '',
          role: (m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : 'Member') as any,
          status: (m.status || 'approved').toUpperCase(),
          membersCount: m.organization?._count?.memberships ?? (m.organization?.membershipsCount || 1),
          activeProjects: m.organization?._count?.projects ?? 0,
        }));
        setUserOrgs(userMemberships);
        if (userMemberships.length > 0) {
          localStorage.setItem('pulse_user_orgs', JSON.stringify(userMemberships));
        } else {
          localStorage.removeItem('pulse_user_orgs');
        }

        // Sync activeRole for the current organization
        const currentMembership = userMemberships.find(m => m.slug.toLowerCase() === currentOrgSlug.toLowerCase());
        if (currentMembership && currentMembership.status === 'APPROVED') {
          const role = (currentMembership.role as Role) || 'Member';
          setActiveRoleState(role);
          setCurrentUser(prev => ({ ...prev, role }));
          localStorage.setItem(`pulse_user_role_${currentOrgSlug.toLowerCase()}`, role);
        }
      }

      if (currentOrgSlug) {
        try {
          const orgInfo = await getOrgBySlug(currentOrgSlug);
          if (orgInfo) {
            setActiveOrgDetails(orgInfo);
            setUserOrgs(prev => {
              const exists = prev.some(o => o.slug.toLowerCase() === orgInfo.slug.toLowerCase());
              if (exists) {
                const next = prev.map(o => o.slug.toLowerCase() === orgInfo.slug.toLowerCase() ? { ...o, name: orgInfo.name || o.name, id: orgInfo.id || o.id } : o);
                localStorage.setItem('pulse_user_orgs', JSON.stringify(next));
                return next;
              }
              return prev;
            });
          }
        } catch (e) {
          console.warn('[AppContext] Failed to fetch current org by slug:', e);
        }
      }

      // Fetch Approved Org Members
      let fetchedUsers: User[] = [];
      const defaultTeam = (teamsRes?.teams && teamsRes.teams.length > 0) ? teamsRes.teams[0] : null;

      if (membersRes?.members && Array.isArray(membersRes.members)) {
        fetchedUsers = membersRes.members.map((m: any) => {
          const matchedTeam = teamsRes?.teams?.find((t: any) => 
            (t.memberIds || []).includes(m.id) || 
            (t.members || []).some((tm: any) => (tm.userId || tm.user_id) === m.id) || 
            t.leadId === m.id || 
            t.lead_id === m.id ||
            t.id === m.teamId ||
            t.id === m.team_id
          ) || defaultTeam;

          return {
            id: m.id,
            orgId: m.orgId || currentOrgSlug,
            name: m.name || m.email.split('@')[0],
            email: m.email,
            role: m.role || 'Member',
            teamId: m.teamId || m.team_id || (matchedTeam ? matchedTeam.id : 'team-main'),
            teamName: m.teamName || m.team_name || (matchedTeam ? matchedTeam.name : 'Core Operations'),
            title: m.title || (m.role === 'Admin' ? 'Workspace Admin' : `${m.role || 'Member'} Specialist`),
            avatarUrl: m.avatarUrl,
            capacityHoursPerWeek: m.capacityHoursPerWeek || 40,
            activeProjectIds: m.activeProjectIds || [],
          };
        });
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

      let mappedProjects: Project[] = [];
      let mappedTasks: Task[] = [];
      let mappedTeams: Team[] = [];
      let mappedGoals: Goal[] = [];
      let mappedEod: EODEntry[] = [];
      let mappedTags: Tag[] = [];
      let mappedReports: Report[] = [];

      // Fetch Projects
      if (projectsRes?.projects) {
        mappedProjects = projectsRes.projects.map((p: any) => ({
          id: p.id,
          orgId: p.orgId || p.org_id,
          name: p.name,
          description: p.description || '',
          status: (p.status?.toLowerCase() === 'planning' ? 'Planning' : p.status?.toLowerCase() === 'completed' ? 'Completed' : 'Active') as any,
          leadId: p.leadId || p.lead_id || '',
          leadName: p.lead?.fullName || p.lead?.full_name || 'Unassigned',
          teamId: p.teamId || p.team_id || '',
          teamIds: p.teamIds || (p.teamId || p.team_id ? [p.teamId || p.team_id] : []),
          teamName: p.team?.name || '',
          startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : (p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : ''),
          targetEndDate: p.targetEndDate ? new Date(p.targetEndDate).toISOString().split('T')[0] : (p.target_end_date ? new Date(p.target_end_date).toISOString().split('T')[0] : ''),
          templateType: p.templateType || p.template_type || 'SoftwareSprint',
          memberIds: p.members ? p.members.map((m: any) => m.userId || m.user_id).filter(Boolean) : (p.memberIds || []),
          tagIds: p.projectTags ? p.projectTags.map((pt: any) => pt.tagId || pt.tag_id).filter(Boolean) : (p.tagIds || []),
          linkedGoalIds: p.linkedGoalIds || [],
        }));
        setProjects(mappedProjects);
      }

      // Fetch Tasks
      if (tasksRes?.tasks) {
        mappedTasks = tasksRes.tasks.map((t: any) => {
          const rawProjId = t.projectId || t.project_id || (typeof t.project === 'string' ? t.project : t.project?.id) || '';
          const matchingProj = mappedProjects.find(p => p.id === rawProjId);
          const rawProjName = t.project?.name || t.projectName || matchingProj?.name || 'Project';

          return {
            id: t.id,
            orgId: t.orgId || t.org_id || currentOrgSlug,
            projectId: rawProjId,
            projectName: rawProjName,
            title: t.title,
            description: t.description || '',
            status: mapTaskStatusToFrontend(t.status),
            priority: mapPriorityToFrontend(t.priority),
            assigneeIds: t.assignees ? t.assignees.map((a: any) => a.userId || a.user_id || a.id).filter(Boolean) : (t.assigneeIds || []),
            estimatedHours: Number(t.estimatedHours || t.estimated_hours || 0),
            actualHours: Number(t.actualHours || t.actual_hours || 0),
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : (t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : ''),
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : (t.start_date ? new Date(t.start_date).toISOString().split('T')[0] : ''),
            tagIds: t.taskTags ? t.taskTags.map((tt: any) => tt.tagId || tt.tag_id).filter(Boolean) : (t.tagIds || []),
            linkedGoalId: t.linkedGoalId || t.linked_goal_id || undefined,
            dependencyTaskIds: t.dependencies ? t.dependencies.map((d: any) => d.dependsOnTaskId || d.depends_on_task_id).filter(Boolean) : (t.dependencyTaskIds || []),
            blockedReason: t.blockedReason || t.blocked_reason || undefined,
            subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((st: any) => ({
              id: st.id || `st-${Math.random()}`,
              title: typeof st === 'string' ? st : (st.title || ''),
              done: typeof st === 'string' ? false : (st.done ?? st.is_completed ?? false),
              assigneeId: st.assigneeId || st.assignee_id
            })) : [],
            comments: t.comments ? t.comments.map((c: any) => ({
              id: c.id,
              authorId: c.authorId || c.author_id || c.user_id,
              authorName: c.author?.fullName || c.author?.full_name || 'User',
              text: c.text,
              createdAt: c.createdAt || c.created_at,
            })) : [],
            createdAt: t.createdAt || t.created_at,
            updatedAt: t.updatedAt || t.updated_at,
          };
        });
        setTasks(mappedTasks);
      }

      // Fetch Teams
      if (teamsRes?.teams) {
        mappedTeams = (teamsRes.teams as any[]).map((tm: any): Team => {
          const leadId = tm.leadId || tm.lead_id || '';
          const rawMembers: string[] = tm.members ? tm.members.map((m: any) => m.userId || m.user_id).filter(Boolean) : (tm.memberIds || []);
          const memberIds: string[] = Array.from(new Set(rawMembers.length > 0 ? rawMembers : (leadId ? [leadId] : [])));
          return {
            id: tm.id,
            orgId: tm.orgId || tm.org_id || currentOrgSlug,
            name: tm.name,
            leadId: leadId,
            leadName: tm.lead?.fullName || tm.lead?.full_name || tm.leadName || '',
            memberIds: memberIds,
            workflowTemplate: tm.workflowTemplate || tm.workflow_template || 'SoftwareSprint',
          };
        });
        setTeams(mappedTeams);
      }

      // Fetch Goals
      if (goalsRes?.goals) {
        mappedGoals = goalsRes.goals.map((g: any) => ({
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
          linkedTaskIds: [],
          tagIds: g.goalTags ? g.goalTags.map((gt: any) => gt.tagId) : [],
        }));
        setGoals(mappedGoals);
      }

      // Fetch EOD Entries
      if (eodRes?.entries) {
        mappedEod = eodRes.entries.map((e: any) => {
          const matchedUser = fetchedUsers.find(u => u.id === e.userId);
          const userName = e.user?.fullName || e.user?.full_name || matchedUser?.name || (e.userId === currentUser.id ? currentUser.name : '') || 'Team Member';
          const userAvatar = e.user?.avatarUrl || e.user?.avatar_url || matchedUser?.avatarUrl || (e.userId === currentUser.id ? currentUser.avatarUrl : undefined);
          const userRole = (matchedUser?.role || (e.userId === currentUser.id ? currentUser.role : 'Member')) as Role;
          const teamName = matchedUser?.teamName || 'Core Operations';

          return {
            id: e.id,
            userId: e.userId,
            userName,
            userAvatar,
            userRole,
            teamId: e.teamId || matchedUser?.teamId || '',
            teamName,
            date: e.entryDate ? new Date(e.entryDate).toISOString().split('T')[0] : '',
            accomplishments: e.accomplishments || [],
            completedTaskIds: e.completedTasks ? e.completedTasks.map((ct: any) => ct.taskId || ct.task_id) : [],
            blockers: e.blockers || '',
            blockedTaskId: e.blockedTaskId,
            energyIndex: (e.energyIndex || 3) as 1 | 2 | 3 | 4 | 5,
            flaggedToManager: e.flaggedToManager,
          };
        });
        setEodEntries(mappedEod);
      }

      // Fetch Reports
      if (reportsRes?.reports) {
        mappedReports = reportsRes.reports.map((r: any) => ({
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
      if (tagsRes?.tags && Array.isArray(tagsRes.tags)) {
        mappedTags = tagsRes.tags.map((t: any) => ({
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

      // Fetch Real Analytics directly from client-side calculator
      const analyticsRes = await analyticsService.getAnalytics(currentOrgSlug, '30d', {
        tasks: mappedTasks,
        eodEntries: mappedEod,
        projects: mappedProjects,
        teams: mappedTeams,
        users: fetchedUsers,
      });
      if (analyticsRes?.data) {
        setAnalyticsData(analyticsRes.data);
      }
    } catch (err) {
      console.warn('[AppContext] Offline or database load error, using local fallback state:', err);
    } finally {
      await minLoadTimePromise;
      if (!isSilent) {
        setIsWorkspaceLoading(false);
      }
    }
  };

  const refreshWorkspaceData = async (isSilent = false) => {
    await loadBackendData(isSilent);
  };

  // Fetch real data from backend API on mount & on org slug change
  useEffect(() => {
    loadBackendData(false);

    // Supabase Realtime live sync for the active workspace
    let channel: any = null;
    const subscribeRealtime = async () => {
      if (!currentOrgSlug) return;
      try {
        const orgId = await getOrgIdBySlug(currentOrgSlug);
        if (!orgId) return;

        const channelName = `pulse-workspace-${orgId}`;
        try {
          supabase.removeChannel(supabase.channel(channelName));
        } catch (e) {}

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', filter: `org_id=eq.${orgId}` },
            () => {
              // Live-sync workspace silently on remote collaborator changes
              loadBackendData(true);
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[AppContext] Realtime subscription offline:', e);
      }
    };

    subscribeRealtime();

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, [currentOrgSlug]);

  const addOrg = async (org: Organization | { name: string; slug: string; industry?: string; companySize?: string; logoUrl?: string }) => {
    const res = await organizationService.createOrganization({
      name: org.name,
      slug: org.slug,
      industry: (org as any).industry,
      companySize: (org as any).companySize,
      logoUrl: (org as any).logoUrl,
    });

    if (res?.organization?.id) {
      const cleanSlug = res.organization.slug;
      setCurrentOrgSlug(cleanSlug);
      localStorage.setItem('pulse_tenant_slug', cleanSlug);
      localStorage.setItem(`pulse_org_status_${cleanSlug}`, 'APPROVED');
      localStorage.setItem(`pulse_user_role_${cleanSlug}`, 'Admin');
      await loadBackendData(false);
      return res.organization;
    }
    throw new Error('Failed to create organization in database.');
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
      const finalProjId = res.task.projectId || taskData.projectId || '';
      const matchingProj = projects.find(p => p.id === finalProjId);
      const createdTask: Task = {
        id: res.task.id,
        orgId: res.task.orgId || currentOrgSlug,
        projectId: finalProjId,
        projectName: taskData.projectName || res.task.projectName || matchingProj?.name || 'Project',
        title: res.task.title,
        description: res.task.description || '',
        status: mapTaskStatusToFrontend(res.task.status),
        priority: mapPriorityToFrontend(res.task.priority),
        assigneeIds: res.task.assignees && res.task.assignees.length > 0 
          ? res.task.assignees.map((a: any) => a.userId || a.user_id || a.id).filter(Boolean)
          : (taskData.assigneeIds || []),
        estimatedHours: Number(res.task.estimatedHours || taskData.estimatedHours || 0),
        actualHours: Number(res.task.actualHours || 0),
        dueDate: res.task.dueDate ? new Date(res.task.dueDate).toISOString().split('T')[0] : (taskData.dueDate || ''),
        startDate: res.task.startDate ? new Date(res.task.startDate).toISOString().split('T')[0] : (taskData.startDate || ''),
        tagIds: taskData.tagIds || [],
        linkedGoalId: res.task.linkedGoalId || taskData.linkedGoalId || undefined,
        dependencyTaskIds: taskData.dependencyTaskIds || [],
        blockedReason: res.task.blockedReason || taskData.blockedReason || undefined,
        subtasks: taskData.subtasks || [],
        comments: [],
        createdAt: res.task.createdAt || new Date().toISOString(),
        updatedAt: res.task.updatedAt || new Date().toISOString(),
      };
      setTasks(prev => [createdTask, ...prev]);
      return createdTask;
    }
    throw new Error((res as any)?.error || 'Failed to create task in database.');
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const timestamp = new Date().toISOString();
    let updatedProjName = updates.projectName;
    if (updates.projectId && !updatedProjName) {
      const p = projects.find(proj => proj.id === updates.projectId);
      if (p) updatedProjName = p.name;
    }

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        ...updates,
        ...(updatedProjName ? { projectName: updatedProjName } : {}),
        updatedAt: timestamp
      };
    }));

    try {
      await taskService.updateTask(currentOrgSlug, taskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status ? mapTaskStatusToBackend(updates.status) : undefined,
        priority: updates.priority ? updates.priority.toLowerCase() : undefined,
        blockedReason: updates.blockedReason,
        actualHours: updates.actualHours,
        estimatedHours: updates.estimatedHours,
        startDate: updates.startDate,
        dueDate: updates.dueDate,
        linkedGoalId: updates.linkedGoalId,
        assigneeIds: updates.assigneeIds,
        tagIds: updates.tagIds,
        projectId: updates.projectId,
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
      blockedTaskId: entryData.blockedTaskId,
    });
    if (res?.entry?.id) {
      const createdEntry: EODEntry = {
        id: res.entry.id,
        userId: res.entry.userId || currentUser.id,
        userName: currentUser.name || currentUser.email?.split('@')[0] || 'You',
        userAvatar: currentUser.avatarUrl,
        userRole: currentUser.role || 'Member',
        teamId: res.entry.teamId || currentUser.teamId || '',
        teamName: currentUser.teamName || 'Core Operations',
        date: res.entry.entryDate ? new Date(res.entry.entryDate).toISOString().split('T')[0] : entryData.date,
        accomplishments: res.entry.accomplishments || entryData.accomplishments || [],
        completedTaskIds: entryData.completedTaskIds || [],
        blockers: res.entry.blockers || entryData.blockers || '',
        blockedTaskId: entryData.blockedTaskId,
        energyIndex: (entryData.energyIndex || 3) as 1 | 2 | 3 | 4 | 5,
        flaggedToManager: entryData.flaggedToManager,
      };
      setEodEntries(prev => [createdEntry, ...prev.filter(e => !(e.userId === createdEntry.userId && e.date === createdEntry.date))]);
      return createdEntry;
    }
    throw new Error((res as any)?.error || 'Failed to submit EOD entry to database.');
  };

  const deleteEOD = async (entryId: string) => {
    try {
      setEodEntries(prev => prev.filter(e => e.id !== entryId));
      await eodService.deleteEod(entryId);
    } catch (err) {
      console.warn('[deleteEOD error]:', err);
    }
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
      const assignedTeam = teams.find(t => t.id === projectData.teamId || t.id === res.project.teamId);
      const createdProject: Project = {
        id: res.project.id,
        orgId: res.project.orgId || currentOrgSlug,
        name: res.project.name,
        description: res.project.description || '',
        status: (res.project.status?.toLowerCase() === 'planning' ? 'Planning' : res.project.status?.toLowerCase() === 'completed' ? 'Completed' : 'Active') as any,
        leadId: res.project.leadId || projectData.leadId || '',
        leadName: (res.project as any).lead?.full_name || projectData.leadName || 'Unassigned',
        teamId: res.project.teamId || projectData.teamId || '',
        teamIds: projectData.teamIds || (projectData.teamId ? [projectData.teamId] : []),
        teamName: (res.project as any).team?.name || assignedTeam?.name || projectData.teamName || '',
        startDate: res.project.startDate ? new Date(res.project.startDate).toISOString().split('T')[0] : (projectData.startDate || ''),
        targetEndDate: res.project.targetEndDate ? new Date(res.project.targetEndDate).toISOString().split('T')[0] : (projectData.targetEndDate || ''),
        templateType: (res.project.templateType as any) || projectData.templateType || 'SoftwareSprint',
        memberIds: projectData.memberIds || [],
        tagIds: projectData.tagIds || [],
        linkedGoalIds: projectData.linkedGoalIds || [],
      };
      setProjects(prev => [createdProject, ...prev]);
      return createdProject;
    }
    throw new Error((res as any)?.error || 'Failed to create project in database.');
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const nextTeamId = updates.teamId !== undefined ? updates.teamId : p.teamId;
      const matchedTeam = teams.find(t => t.id === nextTeamId);
      return { 
        ...p, 
        ...updates,
        teamName: matchedTeam ? matchedTeam.name : (updates.teamName !== undefined ? updates.teamName : p.teamName)
      };
    }));
    try {
      if (currentOrgSlug) {
        await projectService.updateProject(currentOrgSlug, projectId, {
          name: updates.name,
          description: updates.description,
          teamId: updates.teamId,
          leadId: updates.leadId,
          templateType: updates.templateType,
          status: updates.status,
          startDate: updates.startDate,
          targetEndDate: updates.targetEndDate,
        });
      }
    } catch (err) {
      console.warn('[updateProject API error]:', err);
    }
  };

  const deleteProject = async (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setPanelStack(prev => prev.filter(p => !(p.type === 'project' && p.id === projectId)));
    try {
      if (currentOrgSlug) {
        await projectService.deleteProject(currentOrgSlug, projectId);
      }
    } catch (err) {
      console.warn('[deleteProject API error]:', err);
    }
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
        keyResults: (res.goal.keyResults || []).map((kr: any) => ({ ...kr, linkedTaskIds: kr.linkedTaskIds || [] })),
        linkedTaskIds: [],
        tagIds: [],
      };
      setGoals(prev => [createdGoal, ...prev]);
      return createdGoal;
    }
    throw new Error((res as any)?.error || 'Failed to create goal in database.');
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const targetSlug = (userData.orgId || currentOrgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia').toLowerCase();
    const newUser: User = { 
      ...userData, 
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orgId: targetSlug 
    };
    setUsers(prev => {
      const nextUsers = [...prev.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase()), newUser];
      try {
        const stored = JSON.parse(localStorage.getItem(`pulse_client_members_${targetSlug}`) || '[]');
        const filtered = stored.filter((m: any) => m.email?.toLowerCase() !== newUser.email.toLowerCase());
        filtered.push(newUser);
        localStorage.setItem(`pulse_client_members_${targetSlug}`, JSON.stringify(filtered));
      } catch (e) {}

      setUserOrgs(prevOrgs => {
        const nextOrgs = prevOrgs.map(o =>
          o.slug.toLowerCase() === targetSlug
            ? { ...o, membersCount: Math.max((o.membersCount || 0) + 1, nextUsers.length) }
            : o
        );
        localStorage.setItem('pulse_user_orgs', JSON.stringify(nextOrgs));
        return nextOrgs;
      });
      return nextUsers;
    });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser.id === userId) {
      updateCurrentUser(updates);
    }
  };

  const addTeam = async (teamData: Omit<Team, 'id' | 'orgId'>, targetOrgSlug?: string) => {
    const slugToUse = targetOrgSlug || currentOrgSlug || localStorage.getItem('pulse_tenant_slug') || '';
    if (!slugToUse) {
      throw new Error('Organization context missing. Please select or create an organization first.');
    }

    const leadId = teamData.leadId || currentUser.id;
    const initialMemberIds = Array.from(new Set(teamData.memberIds && teamData.memberIds.length > 0 ? teamData.memberIds : [leadId]));

    const res = await teamService.createTeam(slugToUse, {
      name: teamData.name,
      workflowTemplate: teamData.workflowTemplate,
      memberIds: initialMemberIds,
      leadId: leadId,
    });

    if (res?.team?.id) {
      const createdTeam: Team = {
        id: res.team.id,
        orgId: res.team.orgId || slugToUse,
        name: res.team.name,
        leadId: res.team.leadId || (res.team as any).lead_id || leadId,
        leadName: (res.team as any).leadName || (res.team as any).lead?.fullName || (res.team as any).lead?.full_name || teamData.leadName || currentUser.name,
        memberIds: res.team.members ? res.team.members.map((m: any) => m.userId || m.user_id).filter(Boolean) : initialMemberIds,
        workflowTemplate: (res.team.workflowTemplate || (res.team as any).workflow_template || teamData.workflowTemplate || 'SoftwareSprint') as any,
      };
      setTeams(prev => [createdTeam, ...prev]);

      // Update users assigned to this team
      if (initialMemberIds.length > 0) {
        setUsers(prev => prev.map(u => {
          if (initialMemberIds.includes(u.id)) {
            return { ...u, teamId: createdTeam.id, teamName: createdTeam.name };
          }
          return u;
        }));
      }

      return createdTeam;
    }
    throw new Error((res as any)?.error || 'Failed to create team in database.');
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(tm => tm.id === teamId ? { ...tm, ...updates } : tm));

    if (updates.memberIds !== undefined) {
      const targetTeam = teams.find(t => t.id === teamId);
      const teamName = updates.name || targetTeam?.name || 'Team';
      setUsers(prev => prev.map(u => {
        if (updates.memberIds!.includes(u.id)) {
          return { ...u, teamId: teamId, teamName: teamName };
        }
        return u;
      }));
    }

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

  const addMemberToTeam = async (teamId: string, userId: string) => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return;
    const currentMembers = targetTeam.memberIds || [];
    if (currentMembers.includes(userId)) return;
    const newMemberIds = [...currentMembers, userId];
    await updateTeam(teamId, { memberIds: newMemberIds });
  };

  const removeMemberFromTeam = async (teamId: string, userId: string) => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return;
    const currentMembers = targetTeam.memberIds || [];
    const newMemberIds = currentMembers.filter(id => id !== userId);
    await updateTeam(teamId, { memberIds: newMemberIds });
  };

  const removeMemberFromOrg = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Remove user from all teams locally
    setTeams(prev => prev.map(t => ({
      ...t,
      memberIds: (t.memberIds || []).filter(id => id !== userId),
      leadId: t.leadId === userId ? '' : t.leadId,
    })));
    try {
      await organizationService.removeMemberFromOrg(currentOrgSlug, userId);
    } catch (err) {
      console.warn('[removeMemberFromOrg error]:', err);
    }
  };

  const requestAccess = async (itemType: string, note?: string) => {
    const reqNotif = {
      id: `notif-req-${Date.now()}`,
      type: 'access_request',
      title: `Access Request: ${currentUser.name} requested privilege to create ${itemType}s`,
      body: note ? `Reason: "${note}"` : `User ${currentUser.name} (${currentUser.role}) requested privilege to create ${itemType} items.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        fullName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        email: currentUser.email
      },
      metadata: {
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterEmail: currentUser.email,
        itemType,
        currentRole: currentUser.role
      }
    };

    setNotifications(prev => [reqNotif as any, ...prev]);

    try {
      await notificationService.createNotification({
        orgSlug: currentOrgSlug,
        type: 'access_request',
        title: reqNotif.title,
        body: reqNotif.body,
        senderId: currentUser.id,
      });
    } catch (e) {
      console.warn('[requestAccess notification error]:', e);
    }
  };

  const approveAccessRequest = async (notificationId: string, requesterUserId: string, grantedRole: Role) => {
    try {
      // 1. Update user role in local state
      setUsers(prev => prev.map(u => u.id === requesterUserId ? { ...u, role: grantedRole } : u));
      if (currentUser.id === requesterUserId) {
        updateCurrentUser({ role: grantedRole });
        setActiveRole(grantedRole);
      }
      // 2. Update role in Supabase
      await organizationService.approveMember(currentOrgSlug, requesterUserId, grantedRole.toLowerCase());
      // 3. Mark notification as read and updated
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true, title: `✓ Approved (${grantedRole}): ${n.title}` } : n));
    } catch (e) {
      console.warn('[approveAccessRequest error]:', e);
    }
  };

  const dismissAccessRequest = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (e) {
      console.warn('[dismissAccessRequest error]:', e);
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
      let userMemberships: Organization[] = [];
      
      if (meRes?.user?.memberships && meRes.user.memberships.length > 0) {
        userMemberships = meRes.user.memberships
          .filter((m: any) => m.organization)
          .map((m: any) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: (m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : 'Member') as any,
            status: (m.status || 'APPROVED').toUpperCase() as any,
            membersCount: m.organization?._count?.memberships ?? (m.organization?.membershipsCount || 1),
            activeProjects: m.organization?._count?.projects ?? 0,
          }));
      }

      if (res.organization && !userMemberships.some(o => o.id === res.organization.id || o.slug === res.organization.slug)) {
        userMemberships.push({
          id: res.organization.id,
          name: res.organization.name,
          slug: res.organization.slug,
          role: 'Member',
          status: 'APPROVED',
          membersCount: 1,
          activeProjects: 0,
        });
      }

      if (userMemberships.length > 0) {
        setUserOrgs(userMemberships);
        localStorage.setItem('pulse_user_orgs', JSON.stringify(userMemberships));
      }

      if (res.orgSlug) {
        localStorage.setItem('pulse_tenant_slug', res.orgSlug);
        localStorage.setItem(`pulse_org_status_${res.orgSlug}`, 'APPROVED');
        setCurrentOrgSlug(res.orgSlug);
      }

      return res;
    }
    throw new Error((res as any)?.error || 'Failed to accept invitation');
  };

  const inAppDeclineInvite = async (inviteId: string) => {
    const res = await organizationService.inAppDeclineInvite(inviteId);
    if (res?.success) {
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      return res;
    }
    throw new Error((res as any)?.error || 'Failed to decline invitation');
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
        currentOrgName,
        currentOrg,
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
        deleteEOD,
        addTag,
        updateTag,
        deleteTag,
        addProject,
        updateProject,
        deleteProject,
        addGoal,
        updateGoal,
        addUser,
        updateUser,
        addTeam,
        updateTeam,
        deleteTeam,
        addMemberToTeam,
        removeMemberFromTeam,
        removeMemberFromOrg,
        requestAccess,
        approveAccessRequest,
        dismissAccessRequest,
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
        isWorkspaceLoading,
        refreshWorkspaceData,
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
