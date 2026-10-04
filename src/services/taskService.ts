import { supabase, getOrgIdBySlug, isUuid, ensureUserExists } from './supabaseClient';

export interface CreateTaskPayload {
  projectId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  linkedGoalId?: string;
  assigneeIds?: string[];
  tagIds?: string[];
  subtasks?: Array<{ title: string; done?: boolean } | string>;
  dependsOnTaskIds?: string[];
  blockedReason?: string;
  isPrivate?: boolean;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  actualHours?: number;
  estimatedHours?: number;
  blockedReason?: string;
  startDate?: string;
  dueDate?: string;
  linkedGoalId?: string;
  assigneeIds?: string[];
  tagIds?: string[];
  projectId?: string;
  isPrivate?: boolean;
}

export const taskService = {
  getTasks: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { tasks: [] };

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name),
        assignees:task_assignees(user_id, user:users(id, full_name, avatar_url, email)),
        taskTags:task_tags(tag_id),
        dependencies:task_dependencies!task_dependencies_task_id_fkey(depends_on_task_id),
        subtasks(*),
        comments(*, author:users(id, full_name, avatar_url))
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[taskService.getTasks] Error:', error);
      return { tasks: [] };
    }

    return { tasks: data || [] };
  },

  createTask: async (orgSlug: string, payload: CreateTaskPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const userId = await ensureUserExists();

    // Ensure valid project_id UUID
    let finalProjectId = payload.projectId;
    if (!finalProjectId || !isUuid(finalProjectId)) {
      // Find existing project in this org
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('org_id', orgId)
        .limit(1);

      if (existingProjects && existingProjects.length > 0) {
        finalProjectId = existingProjects[0].id;
      } else {
        // Create default project
        const newProjId = crypto.randomUUID();
        await supabase.from('projects').insert({
          id: newProjId,
          org_id: orgId,
          name: 'Core Initiatives',
          description: 'Default project for workspace execution',
          lead_id: userId,
          template_type: 'SoftwareSprint',
          status: 'active',
        });
        finalProjectId = newProjId;
      }
    }

    const taskId = crypto.randomUUID();
    const taskRow: Record<string, any> = {
      id: taskId,
      org_id: orgId,
      project_id: finalProjectId,
      title: payload.title.trim(),
      description: payload.description || null,
      status: (payload.status || 'todo').toLowerCase(),
      priority: (payload.priority || 'medium').toLowerCase(),
      estimated_hours: payload.estimatedHours || 0,
      actual_hours: 0,
      start_date: payload.startDate || null,
      due_date: payload.dueDate || null,
      linked_goal_id: payload.linkedGoalId && isUuid(payload.linkedGoalId) ? payload.linkedGoalId : null,
      blocked_reason: payload.blockedReason || null,
      created_by: userId,
      is_private: payload.isPrivate ?? false,
    };

    let { data: createdTask, error: taskError } = await supabase
      .from('tasks')
      .insert(taskRow)
      .select('*, project:projects(id, name)')
      .single();

    if (taskError && taskError.message?.toLowerCase().includes('is_private')) {
      // Column is_private may not exist yet in Supabase schema, retry without it
      const { is_private: _, ...fallbackRow } = taskRow;
      const fallbackResult = await supabase
        .from('tasks')
        .insert(fallbackRow)
        .select('*, project:projects(id, name)')
        .single();
      createdTask = fallbackResult.data;
      taskError = fallbackResult.error;
    }

    if (taskError) {
      console.error('[taskService.createTask] Supabase task error:', taskError);
      throw new Error(taskError.message || 'Failed to create task.');
    }

    // Persist subtasks to Supabase
    let savedSubtasks: any[] = [];
    if (payload.subtasks && payload.subtasks.length > 0) {
      const subtaskRows = payload.subtasks.map((st, idx) => ({
        id: crypto.randomUUID(),
        task_id: taskId,
        title: typeof st === 'string' ? st : st.title,
        done: typeof st === 'string' ? false : (st.done || false),
        position: idx,
      }));
      const { data: subData, error: subErr } = await supabase
        .from('subtasks')
        .insert(subtaskRows)
        .select();

      if (subErr) {
        console.warn('[taskService.createTask] Subtasks insert error:', subErr);
      } else if (subData) {
        savedSubtasks = subData;
      }
    }

    // Persist assignees to Supabase
    if (payload.assigneeIds && payload.assigneeIds.length > 0) {
      const validAssignees = payload.assigneeIds.filter(isUuid);
      if (validAssignees.length > 0) {
        await supabase.from('task_assignees').insert(
          validAssignees.map(uid => ({ task_id: taskId, user_id: uid }))
        );
      }
    }

    // Persist tags to Supabase
    if (payload.tagIds && payload.tagIds.length > 0) {
      const validTagIds = payload.tagIds.filter(isUuid);
      if (validTagIds.length > 0) {
        await supabase.from('task_tags').insert(
          validTagIds.map(tid => ({ task_id: taskId, tag_id: tid }))
        );
      }
    }

    return {
      task: {
        id: createdTask.id,
        orgId: createdTask.org_id,
        projectId: createdTask.project_id || finalProjectId,
        projectName: createdTask.project?.name || (payload as any).projectName || 'Project',
        title: createdTask.title,
        description: createdTask.description || '',
        status: createdTask.status,
        priority: createdTask.priority,
        estimatedHours: createdTask.estimated_hours || 0,
        actualHours: createdTask.actual_hours || 0,
        dueDate: createdTask.due_date,
        startDate: createdTask.start_date,
        linkedGoalId: createdTask.linked_goal_id,
        blockedReason: createdTask.blocked_reason,
        isPrivate: Boolean(createdTask.is_private ?? payload.isPrivate ?? false),
        createdBy: createdTask.created_by || userId,
        createdAt: createdTask.created_at,
        updatedAt: createdTask.updated_at,
        assignees: (payload.assigneeIds || []).map(uid => ({ userId: uid })),
        subtasks: savedSubtasks.length > 0 ? savedSubtasks.map(st => ({
          id: st.id,
          title: st.title,
          done: st.done || st.is_completed || false,
        })) : (payload.subtasks || []).map((st, idx) => ({
          id: `st-${idx}-${Date.now()}`,
          title: typeof st === 'string' ? st : st.title,
          done: typeof st === 'string' ? false : (st.done || false),
        })),
        comments: [],
      }
    };
  },

  updateTask: async (_orgSlug: string, taskId: string, payload: UpdateTaskPayload) => {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.priority !== undefined) updates.priority = payload.priority;
    if (payload.actualHours !== undefined) updates.actual_hours = payload.actualHours;
    if (payload.estimatedHours !== undefined) updates.estimated_hours = payload.estimatedHours;
    if (payload.blockedReason !== undefined) updates.blocked_reason = payload.blockedReason;
    if (payload.startDate !== undefined) updates.start_date = payload.startDate || null;
    if (payload.dueDate !== undefined) updates.due_date = payload.dueDate || null;
    if (payload.linkedGoalId !== undefined) updates.linked_goal_id = payload.linkedGoalId;
    if (payload.projectId !== undefined) updates.project_id = payload.projectId;
    if (payload.isPrivate !== undefined) updates.is_private = payload.isPrivate;

    let { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error && error.message?.toLowerCase().includes('is_private')) {
      const { is_private: _, ...fallbackUpdates } = updates;
      const retry = await supabase
        .from('tasks')
        .update(fallbackUpdates)
        .eq('id', taskId)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('[taskService.updateTask] Error:', error);
      throw new Error(error.message);
    }

    if (payload.assigneeIds !== undefined) {
      await supabase.from('task_assignees').delete().eq('task_id', taskId);
      if (payload.assigneeIds.length > 0) {
        await supabase.from('task_assignees').insert(
          payload.assigneeIds.filter(isUuid).map(uid => ({ task_id: taskId, user_id: uid }))
        );
      }
    }

    if (payload.tagIds !== undefined) {
      await supabase.from('task_tags').delete().eq('task_id', taskId);
      if (payload.tagIds.length > 0) {
        await supabase.from('task_tags').insert(
          payload.tagIds.filter(isUuid).map(tid => ({ task_id: taskId, tag_id: tid }))
        );
      }
    }

    return { task: data };
  },

  addComment: async (_orgSlug: string, taskId: string, text: string) => {
    const userId = await ensureUserExists();
    const commentId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('comments')
      .insert({
        id: commentId,
        task_id: taskId,
        author_id: userId,
        text,
      })
      .select('*, author:users(id, full_name, avatar_url)')
      .single();

    if (error) {
      console.warn('[taskService.addComment] Error:', error);
      throw new Error(error.message);
    }

    return { comment: data };
  },

  deleteComment: async (_orgSlug: string, _taskId: string, commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  createSubtask: async (_orgSlug: string, taskId: string, title: string) => {
    const subtaskId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        id: subtaskId,
        task_id: taskId,
        title,
        done: false,
      })
      .select()
      .single();

    if (error) {
      console.warn('[taskService.createSubtask] Error:', error);
      throw new Error(error.message);
    }

    return { subtask: data };
  },

  updateSubtask: async (_orgSlug: string, _taskId: string, subtaskId: string, payload: { title?: string; done?: boolean }) => {
    const { data, error } = await supabase
      .from('subtasks')
      .update(payload)
      .eq('id', subtaskId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { subtask: data };
  },

  deleteSubtask: async (_orgSlug: string, _taskId: string, subtaskId: string) => {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  addDependency: async (_orgSlug: string, taskId: string, dependsOnTaskId: string) => {
    const { error } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
      });

    if (error) throw new Error(error.message);
    return { success: true };
  },

  removeDependency: async (_orgSlug: string, taskId: string, dependsOnTaskId: string) => {
    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .match({ task_id: taskId, depends_on_task_id: dependsOnTaskId });

    if (error) throw new Error(error.message);
    return { success: true };
  },

  deleteTask: async (_orgSlug: string, taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new Error(error.message);
    return { success: true };
  },
};
