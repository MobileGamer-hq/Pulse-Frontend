import { supabase, getOrgIdBySlug, isUuid, ensureUserExists, getCurrentUserName } from './supabaseClient';

export interface CreateTeamPayload {
  name: string;
  workflowTemplate?: string;
  memberIds?: string[];
  leadId?: string;
}

export const teamService = {
  getTeams: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { teams: [] };

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        lead:users!teams_lead_id_fkey(id, full_name, avatar_url),
        members:team_members(user_id)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[teamService.getTeams] Error:', error);
      return { teams: [] };
    }

    return { teams: data || [] };
  },

  createTeam: async (orgSlug: string, payload: CreateTeamPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error(`Organization "${orgSlug}" not found.`);

    const userId = await ensureUserExists();
    const leadId = payload.leadId && isUuid(payload.leadId) ? payload.leadId : userId;
    const teamId = crypto.randomUUID();
    const finalMemberIds = Array.from(new Set(payload.memberIds && payload.memberIds.length > 0 ? payload.memberIds : [leadId]));

    const { data: createdTeam, error } = await supabase
      .from('teams')
      .insert({
        id: teamId,
        org_id: orgId,
        name: payload.name.trim(),
        lead_id: leadId,
        workflow_template: payload.workflowTemplate || 'SoftwareSprint',
      })
      .select(`
        *,
        lead:users!teams_lead_id_fkey(id, full_name, avatar_url),
        members:team_members(user_id)
      `)
      .single();

    if (error) {
      console.error('[teamService.createTeam] Supabase error:', error);
      throw new Error(error.message || 'Failed to create team.');
    }

    if (finalMemberIds.length > 0) {
      const memberRows = finalMemberIds.filter(isUuid).map(uid => ({
        team_id: teamId,
        user_id: uid,
      }));
      if (memberRows.length > 0) {
        const { error: memErr } = await supabase.from('team_members').insert(memberRows);
        if (memErr) {
          console.warn('[teamService.createTeam] team_members insert error:', memErr);
        }
      }
    }

    return {
      team: {
        id: createdTeam.id,
        orgId: createdTeam.org_id,
        name: createdTeam.name,
        leadId: createdTeam.lead_id,
        leadName: createdTeam.lead?.full_name || getCurrentUserName(),
        workflowTemplate: createdTeam.workflow_template || 'SoftwareSprint',
        memberIds: finalMemberIds,
        members: finalMemberIds.map(uid => ({ userId: uid })),
      }
    };
  },

  updateTeam: async (_orgSlug: string, teamId: string, payload: Partial<CreateTeamPayload>) => {
    const updates: Record<string, any> = {};
    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.workflowTemplate !== undefined) updates.workflow_template = payload.workflowTemplate;
    if (payload.leadId !== undefined) updates.lead_id = payload.leadId;

    let updatedTeam: any = null;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select(`
          *,
          lead:users!teams_lead_id_fkey(id, full_name, avatar_url),
          members:team_members(user_id)
        `)
        .single();

      if (error) {
        console.error('[teamService.updateTeam] update error:', error);
        throw new Error(error.message || 'Failed to update team.');
      }
      updatedTeam = data;
    }

    if (payload.memberIds !== undefined) {
      await supabase.from('team_members').delete().eq('team_id', teamId);
      const validUids = payload.memberIds.filter(isUuid);
      if (validUids.length > 0) {
        const rows = validUids.map(uid => ({ team_id: teamId, user_id: uid }));
        const { error: memErr } = await supabase.from('team_members').insert(rows);
        if (memErr) {
          console.error('[teamService.updateTeam] member update error:', memErr);
          throw new Error(memErr.message || 'Failed to update team members.');
        }
      }
    }

    return { team: updatedTeam };
  },

  deleteTeam: async (_orgSlug: string, teamId: string) => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw new Error(error.message);
    return { success: true };
  },
};
