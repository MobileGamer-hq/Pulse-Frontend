import type { Project, Team, User, Task } from '../types';

/**
 * Returns all user objects who contribute to a project.
 * Contributors automatically include:
 * 1. Direct explicit project member IDs
 * 2. Project Lead
 * 3. All members and leads of connected team(s)
 * 4. Assignees of tasks belonging to the project
 */
export const getProjectContributors = (
  project: Project | null | undefined,
  teams: Team[],
  users: User[],
  tasks?: Task[]
): User[] => {
  if (!project) return [];

  const contributorIds = new Set<string>();

  // 1. Explicit project member IDs
  if (project.memberIds && Array.isArray(project.memberIds)) {
    project.memberIds.forEach(id => {
      if (id) contributorIds.add(id);
    });
  }

  // 2. Project Lead
  if (project.leadId) {
    contributorIds.add(project.leadId);
  }

  // 3. Connected Team(s) Members & Leads
  const linkedTeamIds = project.teamIds && project.teamIds.length > 0
    ? project.teamIds
    : (project.teamId ? [project.teamId] : []);

  linkedTeamIds.forEach(tId => {
    if (!tId) return;
    const cleanTId = tId.replace(/^team-/, '');
    const team = teams.find(t => 
      t.id === tId || 
      t.id === cleanTId || 
      t.id === `team-${cleanTId}` || 
      t.name.toLowerCase() === tId.toLowerCase()
    );

    if (team) {
      if (team.leadId) contributorIds.add(team.leadId);
      if (team.memberIds && Array.isArray(team.memberIds)) {
        team.memberIds.forEach(mId => {
          if (mId) contributorIds.add(mId);
        });
      }
      // Also check users whose teamId or teamName matches
      users.forEach(u => {
        if (
          u.teamId === team.id || 
          u.teamId === cleanTId || 
          u.teamName?.toLowerCase() === team.name.toLowerCase()
        ) {
          contributorIds.add(u.id);
        }
      });
    }
  });

  // 4. Assignees of tasks belonging to the project
  if (tasks && Array.isArray(tasks)) {
    tasks.forEach(tsk => {
      if (tsk.projectId === project.id && tsk.assigneeIds && Array.isArray(tsk.assigneeIds)) {
        tsk.assigneeIds.forEach(aId => {
          if (aId) contributorIds.add(aId);
        });
      }
    });
  }

  return users.filter(u => contributorIds.has(u.id));
};

/**
 * Returns string IDs of all contributors for a project.
 */
export const getProjectContributorIds = (
  project: Project | null | undefined,
  teams: Team[],
  users: User[],
  tasks?: Task[]
): string[] => {
  return getProjectContributors(project, teams, users, tasks).map(u => u.id);
};
