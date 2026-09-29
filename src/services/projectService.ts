import { supabase, getOrgIdBySlug, isUuid, ensureUserExists } from './supabaseClient';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  teamId?: string;
  leadId?: string;
  templateType?: string;
  status?: string;
  startDate?: string;
  targetEndDate?: string;
  memberIds?: string[];
  tagIds?: string[];
}

export const projectService = {
  getProjects: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { projects: [] };

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        team:teams(id, name),
        lead:users!projects_lead_id_fkey(id, full_name, avatar_url),
        members:project_members(user_id),
        projectTags:project_tags(tag_id)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[projectService.getProjects] Error:', error);
      return { projects: [] };
    }

    return { projects: data || [] };
  },

  createProject: async (orgSlug: string, payload: CreateProjectPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error(`Organization "${orgSlug}" not found.`);

    const userId = await ensureUserExists();
    const leadId = payload.leadId && isUuid(payload.leadId) ? payload.leadId : userId;
    const statusFormatted = (payload.status || 'planning').toLowerCase();
    const projectId = crypto.randomUUID();

    const insertPayload: any = {
      id: projectId,
      org_id: orgId,
      name: payload.name.trim(),
      description: payload.description || null,
      team_id: payload.teamId && isUuid(payload.teamId) ? payload.teamId : null,
      lead_id: leadId,
      template_type: payload.templateType || 'SoftwareSprint',
      status: statusFormatted,
      start_date: payload.startDate || null,
      target_end_date: payload.targetEndDate || null,
    };

    const { data: createdProject, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select(`
        *,
        team:teams(id, name),
        lead:users!projects_lead_id_fkey(id, full_name, avatar_url),
        members:project_members(user_id),
        projectTags:project_tags(tag_id)
      `)
      .single();

    if (error) {
      console.error('[projectService.createProject] Supabase error:', error);
      throw new Error(error.message || 'Failed to create project.');
    }

    if (payload.memberIds && payload.memberIds.length > 0) {
      const validMemberIds = payload.memberIds.filter(isUuid);
      if (validMemberIds.length > 0) {
        await supabase.from('project_members').insert(
          validMemberIds.map(uid => ({ project_id: projectId, user_id: uid }))
        );
      }
    }

    if (payload.tagIds && payload.tagIds.length > 0) {
      const validTagIds = payload.tagIds.filter(isUuid);
      if (validTagIds.length > 0) {
        await supabase.from('project_tags').insert(
          validTagIds.map(tid => ({ project_id: projectId, tag_id: tid }))
        );
      }
    }

    return {
      project: createdProject
    };
  },

  updateProject: async (_orgSlug: string, projectId: string, payload: Partial<CreateProjectPayload>) => {
    const updates: Record<string, any> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.teamId !== undefined) updates.team_id = payload.teamId;
    if (payload.leadId !== undefined) updates.lead_id = payload.leadId;
    if (payload.templateType !== undefined) updates.template_type = payload.templateType;
    if (payload.status !== undefined) updates.status = payload.status.toLowerCase();
    if (payload.startDate !== undefined) updates.start_date = payload.startDate;
    if (payload.targetEndDate !== undefined) updates.target_end_date = payload.targetEndDate;

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { project: data };
  },

  deleteProject: async (_orgSlug: string, projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error(error.message);
    return { success: true };
  },
};
