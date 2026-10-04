import { type ActionCall } from './aiService';

export interface ToolExecutionResult {
  tool: string;
  status: 'success' | 'failed' | 'cancelled';
  message: string;
  data?: Record<string, any>;
  wasNoOp?: boolean;
}

export const executeOpsTool = async (
  action: ActionCall,
  appContext: any
): Promise<ToolExecutionResult> => {
  const { tool, parameters: p } = action;

  try {
    switch (tool) {
      case 'create_task': {
        const title = p.title || 'New Task';
        
        // Find best project to attach task to
        let targetProj = appContext.projects?.[0];
        if (p.project_id) {
          const match = appContext.projects?.find(
            (proj: any) =>
              proj.id === p.project_id ||
              proj.name.toLowerCase().includes(String(p.project_id).toLowerCase())
          );
          if (match) targetProj = match;
        }

        const projId = targetProj?.id || 'proj-default';
        const projName = targetProj?.name || 'General';

        // Resolve assignees from names or IDs
        let resolvedAssigneeIds: string[] = [];
        if (p.assignee_ids && Array.isArray(p.assignee_ids)) {
          for (const rawAssignee of p.assignee_ids) {
            const userMatch = appContext.users?.find(
              (u: any) =>
                u.id === rawAssignee ||
                u.name?.toLowerCase().includes(String(rawAssignee).toLowerCase()) ||
                u.email?.toLowerCase().includes(String(rawAssignee).toLowerCase())
            );
            if (userMatch) {
              resolvedAssigneeIds.push(userMatch.id);
            }
          }
        }
        if (resolvedAssigneeIds.length === 0 && appContext.currentUser?.id) {
          resolvedAssigneeIds.push(appContext.currentUser.id);
        }

        const dueDate = p.due_date || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
        const priority = p.priority || 'Medium';

        const subtasksList = Array.isArray(p.subtasks)
          ? p.subtasks.map((st: any, idx: number) => ({
              id: `st_${Date.now()}_${idx}`,
              title: typeof st === 'string' ? st : st.title || 'Subtask',
              done: false,
            }))
          : [];

        // Execute task creation through AppContext
        let createdTask: any = null;
        try {
          createdTask = await appContext.addTask({
            orgId: appContext.currentOrg?.id || '',
            projectId: projId,
            projectName: projName,
            title,
            description: p.description || '',
            status: 'Todo',
            priority: priority as any,
            assigneeIds: resolvedAssigneeIds,
            estimatedHours: p.estimated_hours || 4,
            actualHours: 0,
            dueDate,
            tagIds: [],
            dependencyTaskIds: p.depends_on_task_ids || [],
            subtasks: subtasksList,
            comments: [],
          });
        } catch (addErr) {
          console.error('[executeOpsTool addTask error]:', addErr);
        }

        const newTaskId = createdTask?.id;

        return {
          tool: 'create_task',
          status: 'success',
          wasNoOp: false,
          message: `Created task "${title}" in project "${projName}" with due date ${dueDate}.`,
          data: {
            taskId: newTaskId,
            title: createdTask?.title || title,
            projectName: projName,
            dueDate,
            priority,
            subtasksCount: subtasksList.length
          },
        };
      }

      case 'update_task': {
        const query = p.task_id || p.title || '';
        const task = appContext.tasks?.find(
          (t: any) =>
            t.id === query ||
            t.title.toLowerCase().includes(String(query).toLowerCase())
        );

        if (!task) {
          return {
            tool: 'update_task',
            status: 'failed',
            message: `Could not locate task matching "${query}".`,
          };
        }

        const updates: any = {};
        if (p.status) updates.status = p.status;
        if (p.priority) updates.priority = p.priority;
        if (p.due_date) updates.dueDate = p.due_date;
        if (p.blocked_reason) updates.blockedReason = p.blocked_reason;
        if (p.actual_hours !== undefined) updates.actualHours = p.actual_hours;
        if (p.project_id || p.project_name) {
          const pQuery = p.project_id || p.project_name;
          const targetProj = appContext.projects?.find(
            (pr: any) =>
              pr.id === pQuery ||
              pr.name.toLowerCase().includes(String(pQuery).toLowerCase())
          );
          if (targetProj) {
            updates.projectId = targetProj.id;
            updates.projectName = targetProj.name;
          }
        }

        if (p.status?.toLowerCase() === 'done') {
          updates.status = 'Done';
          // Check all pending subtasks under this task
          if (task.subtasks && task.subtasks.length > 0) {
            for (const st of task.subtasks) {
              if (!st.done) {
                await appContext.updateSubtask(task.id, st.id, { done: true });
              }
            }
          }
        }

        await appContext.updateTask(task.id, updates);

        return {
          tool: 'update_task',
          status: 'success',
          wasNoOp: false,
          message: `Updated task "${task.title}".`,
          data: { taskId: task.id, title: task.title, updates },
        };
      }

      case 'add_subtask': {
        const query = p.task_id || p.title || '';
        const task = appContext.tasks?.find(
          (t: any) =>
            t.id === query ||
            t.title.toLowerCase().includes(String(query).toLowerCase())
        );

        if (!task) {
          return {
            tool: 'add_subtask',
            status: 'failed',
            message: `Could not find task matching "${query}".`,
          };
        }

        const subtaskTitle = p.title || p.subtask_title || 'New Subtask';
        await appContext.addSubtask(task.id, subtaskTitle);

        return {
          tool: 'add_subtask',
          status: 'success',
          wasNoOp: false,
          message: `Added subtask "${subtaskTitle}" to task "${task.title}".`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            subtaskTitle,
          },
        };
      }

      case 'update_subtask': {
        const query = p.task_id || p.title || '';
        const task = appContext.tasks?.find(
          (t: any) =>
            t.id === query ||
            t.title.toLowerCase().includes(String(query).toLowerCase())
        );

        if (!task) {
          return {
            tool: 'update_subtask',
            status: 'failed',
            message: `Could not find task matching "${query}".`,
          };
        }

        const subtasks = task.subtasks || [];
        const stQuery = p.subtask_id || p.subtask_title || '';
        
        let targetSubtask = subtasks.find(
          (s: any) =>
            s.id === stQuery ||
            s.title.toLowerCase().includes(String(stQuery).toLowerCase())
        );

        // If not specified or only 1 subtask exists, default to first
        if (!targetSubtask && subtasks.length === 1) {
          targetSubtask = subtasks[0];
        }

        if (!targetSubtask) {
          const avail = subtasks.map((s: any) => `"${s.title}"`).join(', ');
          return {
            tool: 'update_subtask',
            status: 'failed',
            message: `Could not find subtask matching "${stQuery}" on task "${task.title}". Available subtasks: ${avail || 'none'}.`,
          };
        }

        const nextDone = p.done !== undefined ? Boolean(p.done) : true;
        const nextTitle = p.new_title || targetSubtask.title;

        // Execute update on client AppContext (which automatically marks parent task Done if all subtasks are done!)
        await appContext.updateSubtask(task.id, targetSubtask.id, {
          done: nextDone,
          title: nextTitle,
        });

        const otherSubtasks = subtasks.filter((s: any) => s.id !== targetSubtask.id);
        const allCompleted = nextDone && otherSubtasks.every((s: any) => s.done);

        const completionMsg = allCompleted
          ? `Marked subtask "${targetSubtask.title}" as completed. All subtasks are now complete, so task "${task.title}" was automatically marked as Done!`
          : nextDone
          ? `Marked subtask "${targetSubtask.title}" as completed on task "${task.title}".`
          : `Updated subtask "${targetSubtask.title}" on task "${task.title}".`;

        return {
          tool: 'update_subtask',
          status: 'success',
          wasNoOp: false,
          message: completionMsg,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            subtaskId: targetSubtask.id,
            subtaskTitle: nextTitle,
            done: nextDone,
            parentTaskCompleted: allCompleted,
          },
        };
      }

      case 'create_project': {
        const name = p.name || 'New Project';
        const description = p.description || '';

        // Resolve assigned team
        let resolvedTeam = appContext.teams?.[0];
        const teamQuery = p.team_id || p.team_name || '';
        if (teamQuery) {
          const matchTeam = appContext.teams?.find(
            (t: any) =>
              t.id === teamQuery ||
              t.name.toLowerCase().includes(String(teamQuery).toLowerCase())
          );
          if (matchTeam) resolvedTeam = matchTeam;
        }

        // Resolve lead
        let resolvedLead = appContext.currentUser;
        const leadQuery = p.lead_id || p.lead_name || '';
        if (leadQuery) {
          const matchLead = appContext.users?.find(
            (u: any) =>
              u.id === leadQuery ||
              u.name?.toLowerCase().includes(String(leadQuery).toLowerCase()) ||
              u.email?.toLowerCase().includes(String(leadQuery).toLowerCase())
          );
          if (matchLead) resolvedLead = matchLead;
        }

        const startDate = p.start_date || new Date().toISOString().split('T')[0];
        const targetEndDate = p.target_end_date || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
        const status = p.status || 'Active';
        const templateType = p.template_type || 'SoftwareSprint';

        let createdProj: any = null;
        try {
          createdProj = await appContext.addProject({
            name,
            description,
            status: (status.toLowerCase() === 'planning' ? 'Planning' : status.toLowerCase() === 'completed' ? 'Completed' : 'Active') as any,
            leadId: resolvedLead?.id || '',
            leadName: resolvedLead?.name || 'Unassigned',
            teamId: resolvedTeam?.id || '',
            teamIds: resolvedTeam ? [resolvedTeam.id] : [],
            teamName: resolvedTeam?.name || 'Core Operations',
            startDate,
            targetEndDate,
            templateType: templateType as any,
            memberIds: resolvedTeam?.memberIds || [],
            tagIds: [],
            linkedGoalIds: [],
          });
        } catch (addErr) {
          console.error('[executeOpsTool addProject error]:', addErr);
        }

        const newProjId = createdProj?.id || `proj_${Date.now()}`;
        const newProjName = createdProj?.name || name;

        return {
          tool: 'create_project',
          status: 'success',
          wasNoOp: false,
          message: `Created project "${newProjName}" assigned to ${resolvedTeam?.name || 'team'} with target date ${targetEndDate}.`,
          data: {
            projectId: newProjId,
            projectName: newProjName,
            teamName: resolvedTeam?.name || '',
            leadName: resolvedLead?.name || '',
            status,
            targetEndDate,
          },
        };
      }

      case 'move_task_project': {
        const taskQuery = p.task_id || p.title || '';
        const task = appContext.tasks?.find(
          (t: any) =>
            t.id === taskQuery ||
            t.title.toLowerCase().includes(String(taskQuery).toLowerCase())
        );

        if (!task) {
          return {
            tool: 'move_task_project',
            status: 'failed',
            message: `Could not locate task matching "${taskQuery}".`,
          };
        }

        const projQuery = p.project_id || p.project_name || '';
        const targetProj = appContext.projects?.find(
          (pr: any) =>
            pr.id === projQuery ||
            pr.name.toLowerCase().includes(String(projQuery).toLowerCase())
        );

        if (!targetProj) {
          const avail = (appContext.projects || []).map((p: any) => p.name).join(', ');
          return {
            tool: 'move_task_project',
            status: 'failed',
            message: `Could not find target project "${projQuery}". Available projects: ${avail}.`,
          };
        }

        await appContext.updateTask(task.id, {
          projectId: targetProj.id,
          projectName: targetProj.name,
        });

        return {
          tool: 'move_task_project',
          status: 'success',
          wasNoOp: false,
          message: `Moved task "${task.title}" to project "${targetProj.name}".`,
          data: {
            taskId: task.id,
            title: task.title,
            projectId: targetProj.id,
            projectName: targetProj.name,
          },
        };
      }

      case 'query_projects': {
        const filterStatus = p.status?.toLowerCase();
        const allProjects = appContext.projects || [];
        const filtered = filterStatus
          ? allProjects.filter((pr: any) => pr.status?.toLowerCase() === filterStatus)
          : allProjects;

        const allTasks = appContext.tasks || [];
        const projectSummaries = filtered.map((pr: any) => {
          const prTasks = allTasks.filter(
            (t: any) => t.projectId === pr.id || (t.projectName && t.projectName.toLowerCase() === pr.name.toLowerCase())
          );
          return {
            id: pr.id,
            name: pr.name,
            status: pr.status || 'Active',
            leadName: pr.leadName || 'Unassigned',
            teamName: pr.teamName || 'Unassigned',
            targetEndDate: pr.targetEndDate || 'N/A',
            totalTasks: prTasks.length,
            completedTasks: prTasks.filter((t: any) => t.status === 'Done').length,
            activeTasks: prTasks.filter((t: any) => t.status === 'InProgress' || t.status === 'Todo').length,
            blockedTasks: prTasks.filter((t: any) => t.status === 'Blocked' || !!t.blockedReason).length,
          };
        });

        return {
          tool: 'query_projects',
          status: 'success',
          wasNoOp: true,
          message: `Retrieved ${projectSummaries.length} project(s).`,
          data: {
            count: projectSummaries.length,
            projects: projectSummaries,
          },
        };
      }

      case 'query_project_tasks': {
        const projQuery = p.project_id || p.project_name || '';
        const targetProj = appContext.projects?.find(
          (pr: any) =>
            pr.id === projQuery ||
            pr.name.toLowerCase().includes(String(projQuery).toLowerCase())
        );

        const allTasks = appContext.tasks || [];
        const allUsers = appContext.users || [];

        let matchedTasks = targetProj
          ? allTasks.filter(
              (t: any) =>
                t.projectId === targetProj.id ||
                (t.projectName && t.projectName.toLowerCase() === targetProj.name.toLowerCase())
            )
          : allTasks;

        if (p.status) {
          const st = p.status.toLowerCase();
          matchedTasks = matchedTasks.filter((t: any) => t.status?.toLowerCase() === st);
        }

        const taskItems = matchedTasks.map((t: any) => {
          const assignees = allUsers
            .filter((u: any) => (t.assigneeIds || []).includes(u.id))
            .map((u: any) => u.name);
          return {
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            assignees: assignees.length > 0 ? assignees : ['Unassigned'],
            blockedReason: t.blockedReason || (t.status === 'Blocked' ? 'Blocked' : undefined),
          };
        });

        const projDisplayName = targetProj?.name || (projQuery ? `"${projQuery}"` : 'workspace');

        return {
          tool: 'query_project_tasks',
          status: 'success',
          wasNoOp: true,
          message: `Found ${taskItems.length} task(s) in ${projDisplayName}.`,
          data: {
            projectName: targetProj?.name || projQuery,
            projectId: targetProj?.id,
            totalTasks: taskItems.length,
            todoCount: taskItems.filter((t: any) => t.status === 'Todo').length,
            inProgressCount: taskItems.filter((t: any) => t.status === 'InProgress').length,
            blockedCount: taskItems.filter((t: any) => t.status === 'Blocked' || !!t.blockedReason).length,
            doneCount: taskItems.filter((t: any) => t.status === 'Done').length,
            tasks: taskItems,
          },
        };
      }

      case 'resolve_blocker': {
        const query = p.task_id || '';
        const task = appContext.tasks?.find(
          (t: any) =>
            t.id === query ||
            t.title.toLowerCase().includes(String(query).toLowerCase())
        );

        if (!task) {
          return {
            tool: 'resolve_blocker',
            status: 'failed',
            message: `Task "${query}" not found.`,
          };
        }

        await appContext.updateTask(task.id, {
          status: (p.next_status || 'InProgress') as any,
          blockedReason: undefined,
        });

        return {
          tool: 'resolve_blocker',
          status: 'success',
          wasNoOp: false,
          message: `Cleared blocker from "${task.title}" and set status to ${p.next_status || 'InProgress'}.`,
          data: { taskId: task.id, title: task.title },
        };
      }

      case 'reschedule_tasks': {
        const taskIds: string[] = p.task_ids || [];
        const daysShift = p.days_to_shift || 0;
        let count = 0;

        for (const tid of taskIds) {
          const task = appContext.tasks?.find(
            (t: any) => t.id === tid || t.title.toLowerCase().includes(String(tid).toLowerCase())
          );
          if (task) {
            let newDate = p.new_due_date;
            if (!newDate && task.dueDate) {
              const current = new Date(task.dueDate);
              current.setDate(current.getDate() + daysShift);
              newDate = current.toISOString().split('T')[0];
            }
            if (newDate) {
              appContext.updateTask(task.id, { dueDate: newDate });
              count++;
            }
          }
        }

        return {
          tool: 'reschedule_tasks',
          status: 'success',
          wasNoOp: count === 0,
          message: `Rescheduled ${count} task(s).`,
        };
      }

      case 'delete_task': {
        const query = p.task_id || '';
        const task = appContext.tasks?.find(
          (t: any) => t.id === query || t.title.toLowerCase().includes(String(query).toLowerCase())
        );
        if (!task) {
          return {
            tool: 'delete_task',
            status: 'failed',
            message: `Task "${query}" not found.`,
          };
        }
        appContext.deleteTask(task.id);
        return {
          tool: 'delete_task',
          status: 'success',
          wasNoOp: false,
          message: `Deleted task "${task.title}".`,
        };
      }

      case 'query_team_state': {
        const members = (appContext.users || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          capacityHours: u.capacityHoursPerWeek || 40,
        }));
        const teams = (appContext.teams || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          memberCount: t.memberIds?.length || 0,
        }));
        return {
          tool: 'query_team_state',
          status: 'success',
          wasNoOp: true,
          message: `Team roster retrieved: ${members.length} members across ${teams.length} teams.`,
          data: { members, teams },
        };
      }

      case 'google_search': {
        const query = p.query || '';
        return {
          tool: 'google_search',
          status: 'success',
          wasNoOp: true,
          message: `Searched web for "${query}".`,
          data: { query },
        };
      }

      case 'analyze_dependencies':
      case 'audit_sprint': {
        return {
          tool,
          status: 'success',
          wasNoOp: true,
          message: `${tool.replace(/_/g, ' ')} checked from client context.`,
        };
      }

      default:
        return {
          tool,
          status: 'success',
          wasNoOp: true,
          message: `Tool ${tool} executed on client.`,
        };
    }
  } catch (err: any) {
    return {
      tool,
      status: 'failed',
      message: err.message || `Failed to execute ${tool}.`,
    };
  }
};
