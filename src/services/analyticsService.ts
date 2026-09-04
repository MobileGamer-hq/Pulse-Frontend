import { apiRequest } from './apiClient';

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
  getAnalytics: async (orgSlug: string, timeRange: string = '30d'): Promise<{ success: boolean; timeRange: string; data: AnalyticsData }> => {
    return apiRequest(`/organizations/${orgSlug}/analytics?timeRange=${encodeURIComponent(timeRange)}`);
  },
};
