import type { Project, Team, User, Task } from '../types';

/**
 * Strips known prefixes ('usr-tasks-', 'usr-', 'user-', 'proj-', 'team-', 'task-', 'goal-', 'tag-')
 * and compound suffix tails ('-team-...', '-proj-...') to extract the canonical entity ID.
 */
export const normalizeEntityId = (raw: string | null | undefined): string => {
  if (!raw) return '';
  let clean = raw
    .replace(/^usr-tasks-/, '')
    .replace(/^(usr-|user-|proj-|team-|task-|goal-|tag-)/, '');
  if (clean.includes('-team-')) clean = clean.split('-team-')[0];
  if (clean.includes('-proj-')) clean = clean.split('-proj-')[0];
  return clean;
};

export const normalizeUserId = (raw: string | null | undefined): string => {
  return normalizeEntityId(raw);
};

/**
 * Finds a user object matching an ID in any format (e.g. '1', 'usr-1', 'user-1', 'usr-1-team-eng',
 * user full name, or email).
 */
export const findUserByAnyId = (
  rawId: string | null | undefined,
  users: User[]
): User | undefined => {
  if (!rawId || !Array.isArray(users)) return undefined;
  const clean = normalizeEntityId(rawId).toLowerCase();

  return users.find(u => {
    if (!u) return false;
    const uCleanId = normalizeEntityId(u.id).toLowerCase();
    if (u.id === rawId || uCleanId === clean) return true;
    if (u.id.toLowerCase() === `usr-${clean}` || u.id.toLowerCase() === `user-${clean}`) return true;
    if (u.name && u.name.toLowerCase() === clean) return true;
    if (u.email && u.email.toLowerCase() === clean) return true;
    return false;
  });
};

/**
 * Determines whether a task is assigned to a specific user.
 * Checks:
 * - task.assigneeIds (matching user.id, cleanId, full name, or email)
 * - task.subtasks[].assigneeId (matching user.id or cleanId)
 */
export const isTaskAssignedToUser = (
  task: Task | null | undefined,
  userOrId: User | string | null | undefined,
  usersList?: User[]
): boolean => {
  if (!task || !userOrId) return false;

  let userObj: User | undefined;
  let rawUserId = '';

  if (typeof userOrId === 'string') {
    rawUserId = userOrId;
    if (usersList) userObj = findUserByAnyId(userOrId, usersList);
  } else {
    userObj = userOrId;
    rawUserId = userOrId.id;
  }

  const cleanUserId = normalizeEntityId(rawUserId).toLowerCase();
  const userObjCleanId = userObj ? normalizeEntityId(userObj.id).toLowerCase() : '';
  const userNameLower = userObj?.name ? userObj.name.toLowerCase() : '';
  const userEmailLower = userObj?.email ? userObj.email.toLowerCase() : '';

  // 1. Direct Assignee IDs
  if (task.assigneeIds && Array.isArray(task.assigneeIds)) {
    const matched = task.assigneeIds.some(aId => {
      if (!aId) return false;
      const cleanAId = normalizeEntityId(aId).toLowerCase();
      if (aId === rawUserId || cleanAId === cleanUserId) return true;
      if (userObj) {
        if (aId === userObj.id || cleanAId === userObjCleanId) return true;
        if (userNameLower && aId.toLowerCase() === userNameLower) return true;
        if (userEmailLower && aId.toLowerCase() === userEmailLower) return true;
      }
      return false;
    });
    if (matched) return true;
  }

  // 2. Subtasks Assignee ID
  if (task.subtasks && Array.isArray(task.subtasks)) {
    const matchedSubtask = task.subtasks.some(st => {
      if (!st.assigneeId) return false;
      const cleanStId = normalizeEntityId(st.assigneeId).toLowerCase();
      if (st.assigneeId === rawUserId || cleanStId === cleanUserId) return true;
      if (userObj && (st.assigneeId === userObj.id || cleanStId === userObjCleanId)) return true;
      return false;
    });
    if (matchedSubtask) return true;
  }

  return false;
};

/**
 * Returns all direct tasks assigned to a specific user.
 */
export const getUserAssignedTasks = (
  userOrId: User | string | null | undefined,
  tasks: Task[],
  users: User[]
): Task[] => {
  if (!userOrId || !Array.isArray(tasks)) return [];
  const userObj = typeof userOrId === 'string' ? findUserByAnyId(userOrId, users) : userOrId;
  return tasks.filter(t => isTaskAssignedToUser(t, userObj || userOrId, users));
};

/**
 * Returns all projects a user contributes to (as explicit member, lead, team member, or task assignee).
 */
export const getUserContributingProjects = (
  userOrId: User | string | null | undefined,
  projects: Project[],
  teams: Team[],
  users: User[],
  tasks: Task[]
): Project[] => {
  if (!userOrId || !Array.isArray(projects)) return [];
  const userObj = typeof userOrId === 'string' ? findUserByAnyId(userOrId, users) : userOrId;
  const targetId = userObj?.id || (typeof userOrId === 'string' ? userOrId : '');
  const cleanId = normalizeEntityId(targetId);

  return projects.filter(p => {
    // 1. Direct member or lead
    if (p.leadId === targetId || normalizeEntityId(p.leadId) === cleanId) return true;
    if (p.memberIds && Array.isArray(p.memberIds)) {
      if (p.memberIds.some(mId => mId === targetId || normalizeEntityId(mId) === cleanId)) return true;
    }
    // 2. Full project contributors list
    return getProjectContributors(p, teams, users, tasks).some(c => 
      c.id === targetId || normalizeEntityId(c.id) === cleanId
    );
  });
};

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
  if (!project || !Array.isArray(users)) return [];

  const contributorIds = new Set<string>();
  const contributorNames = new Set<string>();

  // 1. Explicit project member IDs
  if (project.memberIds && Array.isArray(project.memberIds)) {
    project.memberIds.forEach(id => {
      if (id) {
        contributorIds.add(id);
        contributorIds.add(normalizeEntityId(id));
      }
    });
  }

  // 2. Project Lead
  if (project.leadId) {
    contributorIds.add(project.leadId);
    contributorIds.add(normalizeEntityId(project.leadId));
  }

  // 3. Connected Team(s) Members & Leads
  const linkedTeamIds = project.teamIds && project.teamIds.length > 0
    ? project.teamIds
    : (project.teamId ? [project.teamId] : []);

  linkedTeamIds.forEach(tId => {
    if (!tId) return;
    const cleanTId = normalizeEntityId(tId);
    const team = teams.find(t => 
      t.id === tId || 
      t.id === cleanTId || 
      t.id === `team-${cleanTId}` || 
      normalizeEntityId(t.id) === cleanTId ||
      t.name.toLowerCase() === tId.toLowerCase()
    );

    if (team) {
      if (team.leadId) {
        contributorIds.add(team.leadId);
        contributorIds.add(normalizeEntityId(team.leadId));
      }
      if (team.memberIds && Array.isArray(team.memberIds)) {
        team.memberIds.forEach(mId => {
          if (mId) {
            contributorIds.add(mId);
            contributorIds.add(normalizeEntityId(mId));
          }
        });
      }
      // Also check users whose teamId or teamName matches
      users.forEach(u => {
        if (
          u.teamId === team.id || 
          u.teamId === cleanTId || 
          normalizeEntityId(u.teamId) === cleanTId ||
          u.teamName?.toLowerCase() === team.name.toLowerCase()
        ) {
          contributorIds.add(u.id);
          contributorIds.add(normalizeEntityId(u.id));
        }
      });
    }
  });

  // 4. Assignees of tasks belonging to the project
  if (tasks && Array.isArray(tasks)) {
    tasks.forEach(tsk => {
      if (tsk.projectId === project.id) {
        if (tsk.assigneeIds && Array.isArray(tsk.assigneeIds)) {
          tsk.assigneeIds.forEach(aId => {
            if (aId) {
              contributorIds.add(aId);
              contributorIds.add(normalizeEntityId(aId));
              contributorNames.add(aId.toLowerCase());
            }
          });
        }
        if (tsk.subtasks && Array.isArray(tsk.subtasks)) {
          tsk.subtasks.forEach(st => {
            if (st.assigneeId) {
              contributorIds.add(st.assigneeId);
              contributorIds.add(normalizeEntityId(st.assigneeId));
            }
          });
        }
      }
    });
  }

  return users.filter(u => {
    if (!u) return false;
    const cleanUId = normalizeEntityId(u.id);
    return (
      contributorIds.has(u.id) ||
      contributorIds.has(cleanUId) ||
      (u.name && contributorNames.has(u.name.toLowerCase())) ||
      (u.email && contributorNames.has(u.email.toLowerCase()))
    );
  });
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
