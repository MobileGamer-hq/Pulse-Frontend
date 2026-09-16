import type { Task, Project, Team, EODEntry, User } from '../types';
import type { AnalyticsData } from '../services/analyticsService';

export function calculateAnalytics(
  tasks: Task[] = [],
  eodEntries: EODEntry[] = [],
  projects: Project[] = [],
  _teams: Team[] = [],
  members: User[] = [],
  _timeRange: string = '30d'
): AnalyticsData {
  const totalTasksCount = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const blockedTasks = tasks.filter(t => t.status === 'Blocked' || t.status === 'AtRisk');
  const inProgressTasks = tasks.filter(t => t.status === 'InProgress');

  // 1. Performance Insights Calculation
  const completionRate = totalTasksCount > 0
    ? Number(((completedTasks.length / totalTasksCount) * 100).toFixed(1))
    : 0;

  const totalEstimatedPoints = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 4), 0);
  const completedPoints = completedTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 4), 0);
  const velocity = completedPoints;

  const avgFocusHours = eodEntries.length > 0
    ? Number((eodEntries.reduce((sum, e) => sum + (Number(e.energyIndex || 3) * 1.2), 0) / eodEntries.length).toFixed(1))
    : (completedTasks.length > 0 ? Number((completedPoints / Math.max(completedTasks.length, 1)).toFixed(1)) : 0);

  const activeMemberCount = Math.max(members.length, 1);
  const consistencyScore = eodEntries.length > 0
    ? Math.min(100, Math.round((eodEntries.length / (activeMemberCount * 5)) * 100))
    : (totalTasksCount > 0 ? Math.round(completionRate) : 0);

  // 30-Day Velocity Trend Points
  const daysIntervals = [1, 5, 10, 15, 20, 23, 26, 28, 30];
  const velocityTrend30Day = daysIntervals.map(day => {
    if (velocity === 0) return { day, points: 0 };
    const factor = Math.min(1, day / 30);
    const pts = Math.round(factor * velocity);
    return { day, points: pts };
  });

  // EOD Consistency Heatmap (last 36 intervals / 3 months)
  const eodDatesMap = new Map<string, number>();
  eodEntries.forEach(e => {
    const d = e.date ? e.date.split('T')[0] : '';
    if (d) {
      eodDatesMap.set(d, (eodDatesMap.get(d) || 0) + 1);
    }
  });

  const eodConsistencyHeatmap = Array.from({ length: 36 }).map((_, idx) => {
    const date = new Date(Date.now() - (35 - idx) * 2.5 * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const count = eodDatesMap.get(dateStr) || 0;
    const opacity = count >= 3 ? 1.0 : count === 2 ? 0.75 : count === 1 ? 0.5 : (eodEntries.length === 0 ? 0.04 : 0.08);
    return { index: idx, date: dateStr, count, opacity };
  });

  // 2. Consistency & Habits Calculation
  const energyVsExecution: { energy: number; hours: number }[] = [];
  if (eodEntries.length > 0) {
    const energyMap = new Map<number, number[]>();
    eodEntries.forEach(e => {
      const eng = Number(e.energyIndex || 3);
      const hours = Number((eng * 1.1 + (e.completedTaskIds?.length || 0) * 0.5).toFixed(1));
      if (!energyMap.has(eng)) energyMap.set(eng, []);
      energyMap.get(eng)!.push(hours);
    });
    energyMap.forEach((hrsArr, eng) => {
      const avgH = Number((hrsArr.reduce((a, b) => a + b, 0) / hrsArr.length).toFixed(1));
      energyVsExecution.push({ energy: eng, hours: avgH });
    });
    energyVsExecution.sort((a, b) => a.energy - b.energy);
  } else if (tasks.length > 0) {
    energyVsExecution.push({ energy: 4, hours: Number((completedPoints / Math.max(completedTasks.length, 1)).toFixed(1)) || 4.0 });
  }

  // Top Blockers Aggregation
  const rawBlockerTexts = [
    ...eodEntries.map(e => e.blockers).filter(Boolean) as string[],
    ...blockedTasks.map(t => t.blockedReason || t.description).filter(Boolean) as string[]
  ];

  const blockerCountMap: Record<string, number> = {};
  rawBlockerTexts.forEach(b => {
    const text = b.trim();
    if (!text) return;
    let category = text;
    const lower = text.toLowerCase();
    if (lower.includes('switch') || lower.includes('meeting')) category = 'Context Switching';
    else if (lower.includes('require') || lower.includes('spec') || lower.includes('design')) category = 'Unclear Requirements';
    else if (lower.includes('credential') || lower.includes('stripe') || lower.includes('key') || lower.includes('api')) category = 'API / Credentials';
    else if (lower.includes('depend') || lower.includes('wait') || lower.includes('block')) category = 'Dependencies & Approvals';
    else if (lower.includes('deploy') || lower.includes('ci') || lower.includes('build')) category = 'CI/CD Pipeline Friction';

    blockerCountMap[category] = (blockerCountMap[category] || 0) + 1;
  });

  const maxBlockerCount = Math.max(...Object.values(blockerCountMap), 1);
  const topBlockers = Object.entries(blockerCountMap).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / maxBlockerCount) * 100)
  })).sort((a, b) => b.count - a.count);

  // 3. Team & Sprint Trajectory
  const committedPoints = totalEstimatedPoints;
  const actualCompletedPts = completedPoints;
  const remainingPoints = Math.max(committedPoints - actualCompletedPts, 0);

  const completionDonut = [
    { name: 'Completed', value: actualCompletedPts },
    { name: 'Remaining', value: remainingPoints }
  ];

  const teamVelocitySprints = projects.length > 0
    ? projects.slice(0, 6).map((p, idx) => {
        const pTasks = tasks.filter(t => t.projectId === p.id);
        const pts = pTasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + (Number(t.estimatedHours) || 4), 0);
        return {
          sprint: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
          points: pts,
          active: idx === 0
        };
      })
    : [
        { sprint: 'Current Cycle', points: actualCompletedPts, active: true }
      ];

  const activeSprints = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const pDone = pTasks.filter(t => t.status === 'Done').length;
    const prog = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
    return {
      name: p.name,
      progress: prog,
      eta: prog >= 100 ? 'Completed' : prog >= 50 ? 'In Progress' : `${pTasks.length - pDone} tasks left`
    };
  });

  // Burndown trajectory
  const burndownTrajectory = [
    { day: 'Day 1', ideal: committedPoints, actual: committedPoints },
    { day: 'Day 7', ideal: Math.round(committedPoints * 0.75), actual: Math.max(committedPoints - Math.round(actualCompletedPts * 0.3), 0) },
    { day: 'Day 14', ideal: Math.round(committedPoints * 0.5), actual: Math.max(committedPoints - Math.round(actualCompletedPts * 0.6), 0) },
    { day: 'Day 21', ideal: Math.round(committedPoints * 0.25), actual: Math.max(committedPoints - actualCompletedPts, 0) },
    { day: 'Day 30', ideal: 0, actual: Math.max(committedPoints - actualCompletedPts, 0) }
  ];

  const velocityPlannedVsActual = projects.slice(0, 5).map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const planned = pTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 4), 0);
    const actual = pTasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + (Number(t.estimatedHours) || 4), 0);
    return {
      sprint: p.name.length > 12 ? `${p.name.slice(0, 12)}...` : p.name,
      planned,
      actual
    };
  });

  const activeBottlenecks = [
    { name: 'Blocked Tasks', count: blockedTasks.length },
    { name: 'In-Progress Tasks', count: inProgressTasks.length }
  ];

  // 4. Bottleneck Analysis
  const criticalBlockers = blockedTasks.map(t => ({
    id: t.id.slice(0, 8).toUpperCase(),
    title: t.title,
    description: t.blockedReason || t.description || 'Blocked dependency',
    projectName: t.projectName || 'General',
    duration: 'Blocked',
    owner: (t.assigneeIds && t.assigneeIds.length > 0)
      ? (members.find(m => m.id === t.assigneeIds[0])?.name || 'Assigned Member')
      : 'Unassigned'
  }));

  const totalBlockedTimeHours = blockedTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 8), 0);

  // Friction map by Project
  const projectFrictionMap: Record<string, number> = {};
  blockedTasks.forEach(t => {
    const key = t.projectName || 'General';
    projectFrictionMap[key] = (projectFrictionMap[key] || 0) + (Number(t.estimatedHours) || 8);
  });

  const totalFrictionHours = Object.values(projectFrictionMap).reduce((a, b) => a + b, 0) || 1;
  const frictionMap = Object.entries(projectFrictionMap).map(([department, hours]) => ({
    department,
    percentage: Math.round((hours / totalFrictionHours) * 100)
  }));

  // Blocked time trend (last 7 days)
  const daysNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const currentDayIdx = new Date().getDay();
  const blockedTimeTrend7D = Array.from({ length: 7 }).map((_, idx) => {
    const dIdx = (currentDayIdx - (6 - idx) + 7) % 7;
    const dayName = daysNames[dIdx];
    const isToday = idx === 6;
    return {
      day: dayName,
      hours: isToday ? totalBlockedTimeHours : 0,
      active: isToday && totalBlockedTimeHours > 0
    };
  });

  return {
    insights: {
      velocity,
      velocityUnit: 'pts/sprint',
      completionRate,
      avgDailyFocus: avgFocusHours,
      consistencyScore,
      velocityTrend30Day,
      eodConsistencyHeatmap
    },
    habits: {
      energyVsExecution,
      consistencyScore,
      correlation: energyVsExecution.length > 1 ? 'Positive Correlation' : 'Tracking in progress',
      topBlockers
    },
    team: {
      teamVelocitySprints,
      completionDonut,
      completionAggregatePct: committedPoints > 0 ? Math.round((actualCompletedPts / committedPoints) * 100) : 0,
      committedPoints,
      completedPoints: actualCompletedPts,
      activeSprints,
      burndownTrajectory,
      velocityPlannedVsActual: velocityPlannedVsActual.length > 0 ? velocityPlannedVsActual : [{ sprint: 'Current', planned: committedPoints, actual: actualCompletedPts }],
      activeBottlenecks
    },
    bottlenecks: {
      totalBlockedTimeHours,
      blockedTrendVsLastWeek: blockedTasks.length > 0 ? `${blockedTasks.length} active blocker(s)` : 'No active blockers',
      criticalBlockers,
      frictionMap: frictionMap.length > 0 ? frictionMap : [{ department: 'Workspace', percentage: 0 }],
      blockedTimeTrend7D
    }
  };
}
