import { getOrgIdBySlug, supabase } from './supabaseClient';
import { calculateAnalytics } from '../utils/analyticsCalculator';
import type { Task, Project, Team, EODEntry, User } from '../types';

export interface AnalyticsData {
  insights: {
    velocity: number;
    velocityUnit: string;
    completionRate: number;
    avgDailyFocus: number;
    consistencyScore: number;
    velocityTrend30Day: { day: number; points: number; date?: string }[];
    eodConsistencyHeatmap: { index: number; date: string; count: number; opacity: number }[];
  };
  habits: {
    energyVsExecution: { energy: number; hours: number }[];
    consistencyScore: number;
    correlation: string;
    topBlockers: { name: string; count: number; percentage: number }[];
  };
  team: {
    teamVelocitySprints: { sprint: string; points: number; active: boolean }[];
    completionDonut: { name: string; value: number }[];
    completionAggregatePct: number;
    committedPoints: number;
    completedPoints: number;
    activeSprints: { name: string; progress: number; eta: string }[];
    burndownTrajectory: { day: string; ideal: number; actual: number | null }[];
    velocityPlannedVsActual: { sprint: string; planned: number; actual: number }[];
    activeBottlenecks: { name: string; count: number }[];
  };
  bottlenecks: {
    totalBlockedTimeHours: number;
    blockedTrendVsLastWeek: string;
    criticalBlockers: {
      id: string;
      title: string;
      description: string;
      projectName: string;
      duration: string;
      owner: string;
    }[];
    frictionMap: { department: string; percentage: number }[];
    blockedTimeTrend7D: { day: string; hours: number; active: boolean }[];
  };
}

export const analyticsService = {
  getAnalytics: async (
    orgSlug: string,
    timeRange: string = '30d',
    cachedContextData?: {
      tasks?: Task[];
      eodEntries?: EODEntry[];
      projects?: Project[];
      teams?: Team[];
      users?: User[];
    }
  ): Promise<{ success: boolean; timeRange: string; data: AnalyticsData }> => {
    // If AppContext has already loaded datasets in memory, compute in 0ms!
    if (
      cachedContextData?.tasks &&
      cachedContextData?.eodEntries &&
      cachedContextData?.projects
    ) {
      const data = calculateAnalytics(
        cachedContextData.tasks,
        cachedContextData.eodEntries,
        cachedContextData.projects,
        cachedContextData.teams || [],
        cachedContextData.users || [],
        timeRange
      );
      return { success: true, timeRange, data };
    }

    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) {
      const fallback = calculateAnalytics([], [], [], [], [], timeRange);
      return { success: true, timeRange, data: fallback };
    }

    try {
      const [tasksRes, eodRes, projectsRes, teamsRes, membersRes] = await Promise.all([
        supabase.from('tasks').select('*, project:projects(name)').eq('org_id', orgId),
        supabase.from('eod_entries').select('*, completedTasks:eod_completed_tasks(task_id)').eq('org_id', orgId),
        supabase.from('projects').select('*').eq('org_id', orgId),
        supabase.from('teams').select('*').eq('org_id', orgId),
        supabase.from('organization_memberships').select('*, user:users!organization_memberships_user_id_fkey(*)').eq('org_id', orgId).eq('status', 'approved'),
      ]);

      const mappedTasks: Task[] = (tasksRes.data || []).map((t: any) => ({
        id: t.id,
        orgId: t.org_id,
        projectId: t.project_id,
        projectName: t.project?.name || 'Project',
        title: t.title,
        description: t.description || '',
        status: (t.status === 'done' ? 'Done' : t.status === 'in_progress' ? 'InProgress' : t.status === 'blocked' ? 'Blocked' : t.status === 'at_risk' ? 'AtRisk' : 'Todo') as any,
        priority: (t.priority === 'urgent' ? 'Urgent' : t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium') as any,
        assigneeIds: [],
        estimatedHours: Number(t.estimated_hours || 0),
        actualHours: Number(t.actual_hours || 0),
        dueDate: t.due_date || '',
        startDate: t.start_date || '',
        tagIds: [],
        linkedGoalId: t.linked_goal_id,
        dependencyTaskIds: [],
        blockedReason: t.blocked_reason,
        subtasks: [],
        comments: [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      const mappedEods: EODEntry[] = (eodRes.data || []).map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        userName: 'Member',
        userRole: 'Member',
        teamId: e.team_id || '',
        teamName: 'Operations',
        date: e.entry_date,
        accomplishments: e.accomplishments || [],
        completedTaskIds: (e.completedTasks || []).map((ct: any) => ct.task_id),
        blockers: e.blockers || '',
        blockedTaskId: e.blocked_task_id,
        energyIndex: e.energy_index || 3,
        flaggedToManager: e.flagged_to_manager,
      }));

      const mappedProjects: Project[] = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        orgId: p.org_id,
        name: p.name,
        description: p.description || '',
        status: (p.status === 'completed' ? 'Completed' : p.status === 'planning' ? 'Planning' : 'Active') as any,
        leadId: p.lead_id || '',
        teamId: p.team_id || '',
        startDate: p.start_date || '',
        targetEndDate: p.target_end_date || '',
        templateType: p.template_type || 'SoftwareSprint',
        memberIds: [],
        tagIds: [],
        linkedGoalIds: [],
      }));

      const mappedTeams: Team[] = (teamsRes.data || []).map((tm: any) => ({
        id: tm.id,
        orgId: tm.org_id,
        name: tm.name,
        leadId: tm.lead_id || '',
        leadName: 'Lead',
        memberIds: [],
      }));

      const mappedMembers: User[] = (membersRes.data || []).map((m: any) => ({
        id: m.user?.id || m.user_id,
        orgId: orgSlug,
        name: m.user?.full_name || 'Member',
        email: m.user?.email || '',
        role: m.role || 'Member',
        teamId: 'team-main',
        teamName: 'Core Operations',
        title: m.role || 'Member',
        capacityHoursPerWeek: 40,
        activeProjectIds: [],
      }));

      const data = calculateAnalytics(
        mappedTasks,
        mappedEods,
        mappedProjects,
        mappedTeams,
        mappedMembers,
        timeRange
      );

      return { success: true, timeRange, data };
    } catch (err) {
      console.warn('[analyticsService.getAnalytics] Error computing analytics:', err);
      const data = calculateAnalytics([], [], [], [], [], timeRange);
      return { success: true, timeRange, data };
    }
  },
};
