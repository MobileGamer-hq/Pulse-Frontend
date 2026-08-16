import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  User, Role, Tag, Task, Project, Team, EODEntry, Goal, Report, 
  ActivityLog, FilterState, SavedView, DrawerPanel 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_TEAMS, INITIAL_TAGS, INITIAL_PROJECTS, INITIAL_TASKS, 
  INITIAL_EOD_ENTRIES, INITIAL_GOALS, INITIAL_REPORTS, INITIAL_ACTIVITIES 
} from '../data/mockData';

interface AppContextType {
  // Current session & RBAC
  currentUser: User;
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

  // Mobile Menu State
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

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
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, text: string) => void;
  submitEOD: (entry: Omit<EODEntry, 'id' | 'userId' | 'userName' | 'userAvatar' | 'userRole' | 'teamId' | 'teamName'>) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  addTeam: (team: Omit<Team, 'id' | 'orgId'>) => void;
  reorderTasks: (newTasks: Task[]) => void;
  reorderProjects: (newProjects: Project[]) => void;
  reorderGoals: (newGoals: Goal[]) => void;
  reorderTags: (newTags: Tag[]) => void;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Amaka Okafor (Manager)
  const [activeRole, setActiveRoleState] = useState<Role>('Manager');
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

  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [eodEntries, setEodEntries] = useState<EODEntry[]>(INITIAL_EOD_ENTRIES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [reports] = useState<Report[]>(INITIAL_REPORTS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);

  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [panelStack, setPanelStack] = useState<DrawerPanel[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  // Sync role updates
  const setActiveRole = (role: Role) => {
    setActiveRoleState(role);
    // Find matching user or adapt current user role
    const matchedUser = users.find(u => u.role === role) || { ...currentUser, role };
    setCurrentUser(matchedUser);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
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

  // Panel stack management
  const pushPanel = (panel: DrawerPanel) => {
    setPanelStack(prev => [...prev, panel]);
  };

  const popPanel = () => {
    setPanelStack(prev => prev.slice(0, prev.length - 1));
  };

  const closeAllPanels = () => {
    setPanelStack([]);
  };

  // Filter actions
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

  // Data mutation actions
  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `task-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newTask: Task = {
      ...newTaskData,
      id: newId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    setTasks(prev => [newTask, ...prev]);

    // Record activity
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      action: 'created task',
      targetRef: { id: newId, type: 'task', label: newTask.title },
      parentRef: { id: newTask.projectId, type: 'project', label: newTask.projectName },
      timestamp
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const timestamp = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: timestamp } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setPanelStack(prev => prev.filter(p => !(p.type === 'task' && p.id === taskId)));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const updatedSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, done: !st.done } : st);
      return { ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    }));
  };

  const addComment = (taskId: string, text: string) => {
    const commentObj = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      text,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...t.comments, commentObj] } : t));
  };

  const submitEOD = (entryData: Omit<EODEntry, 'id' | 'userId' | 'userName' | 'userAvatar' | 'userRole' | 'teamId' | 'teamName'>) => {
    const newEntry: EODEntry = {
      ...entryData,
      id: `eod-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      userRole: currentUser.role,
      teamId: currentUser.teamId,
      teamName: currentUser.teamName
    };
    setEodEntries(prev => [newEntry, ...prev.filter(e => !(e.userId === currentUser.id && e.date === entryData.date))]);

    // Record activity
    setActivities(prev => [{
      id: `act-${Date.now()}`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      action: 'submitted daily EOD check-in',
      targetRef: { id: newEntry.id, type: 'person', label: `${currentUser.name} EOD`, sublabel: `Energy ${entryData.energyIndex}/5` },
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const addTag = (newTagData: Omit<Tag, 'id'>) => {
    const newTag: Tag = {
      ...newTagData,
      id: `tag-${Date.now()}`
    };
    setTags(prev => [...prev, newTag]);
  };

  const updateTag = (tagId: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, ...updates } : t));
  };

  const addProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = { ...projectData, id: `proj-${Date.now()}` };
    setProjects(prev => [newProject, ...prev]);
  };

  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...goalData, id: `goal-${Date.now()}` };
    setGoals(prev => [newGoal, ...prev]);
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
  };

  const addTeam = (teamData: Omit<Team, 'id' | 'orgId'>) => {
    const newTeam: Team = { ...teamData, id: `team-${Date.now()}`, orgId: 'org-acme' };
    setTeams(prev => [...prev, newTeam]);
  };

  const reorderTasks = (newTasks: Task[]) => setTasks(newTasks);
  const reorderProjects = (newProjects: Project[]) => setProjects(newProjects);
  const reorderGoals = (newGoals: Goal[]) => setGoals(newGoals);
  const reorderTags = (newTags: Tag[]) => setTags(newTags);

  return (
    <AppContext.Provider
      value={{
        currentUser,
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

        filters,
        setFilters,
        resetFilters,
        saveCurrentView,
        applySavedView,

        addTask,
        updateTask,
        deleteTask,
        toggleSubtask,
        addComment,
        submitEOD,
        addTag,
        updateTag,
        addProject,
        addGoal,
        addUser,
        addTeam,
        reorderTasks,
        reorderProjects,
        reorderGoals,
        reorderTags
      }}
    >
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
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
