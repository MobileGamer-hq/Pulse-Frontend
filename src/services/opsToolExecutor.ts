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

        // Execute task creation through AppContext
        appContext.addTask({
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
          subtasks: [],
          comments: [],
        });

        return {
          tool: 'create_task',
          status: 'success',
          wasNoOp: false,
          message: `Created task "${title}" in project "${projName}" with due date ${dueDate}.`,
          data: { title, projectName: projName, dueDate },
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

        appContext.updateTask(task.id, updates);

        return {
          tool: 'update_task',
          status: 'success',
          wasNoOp: false,
          message: `Updated task "${task.title}".`,
          data: { taskId: task.id, title: task.title, updates },
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

        appContext.updateTask(task.id, {
          status: (p.next_status || 'InProgress') as any,
          blockedReason: undefined,
        });

        return {
          tool: 'resolve_blocker',
          status: 'success',
          wasNoOp: false,
          message: `Cleared blocker from "${task.title}" and set status to ${p.next_status || 'InProgress'}.`,
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

      case 'query_team_state':
      case 'analyze_dependencies':
      case 'audit_sprint': {
        return {
          tool,
          status: 'success',
          wasNoOp: true,
          message: 'Team state queried from client context.',
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
