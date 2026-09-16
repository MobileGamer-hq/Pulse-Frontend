import { supabase, getOrgIdBySlug, isUuid, ensureUserExists } from './supabaseClient';

export interface SubmitEODPayload {
  entryDate?: string;
  accomplishments: string[];
  blockers?: string;
  blockedTaskId?: string;
  energyIndex?: number;
  flaggedToManager?: boolean;
  completedTaskIds?: string[];
}

export const eodService = {
  getEodEntries: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { entries: [] };

    try {
      const { data, error } = await supabase
        .from('eod_entries')
        .select(`
          *,
          user:users(id, full_name, avatar_url, email),
          completedTasks:eod_completed_tasks(task_id)
        `)
        .eq('org_id', orgId)
        .order('entry_date', { ascending: false });

      if (error) {
        console.warn('[eodService.getEodEntries] Error with user relation, trying fallback:', error);
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('eod_entries')
          .select('*')
          .eq('org_id', orgId)
          .order('entry_date', { ascending: false });

        if (fallbackErr || !fallbackData) return { entries: [] };
        return {
          entries: fallbackData.map((e: any) => ({
            id: e.id,
            userId: e.user_id,
            orgId: e.org_id,
            teamId: e.team_id,
            entryDate: e.entry_date,
            accomplishments: e.accomplishments || [],
            blockers: e.blockers || '',
            blockedTaskId: e.blocked_task_id,
            energyIndex: e.energy_index || 3,
            flaggedToManager: e.flagged_to_manager || false,
            user: undefined,
            completedTasks: [],
          }))
        };
      }

      return {
        entries: (data || []).map((e: any) => ({
          id: e.id,
          userId: e.user_id,
          orgId: e.org_id,
          teamId: e.team_id,
          entryDate: e.entry_date,
          accomplishments: e.accomplishments || [],
          blockers: e.blockers || '',
          blockedTaskId: e.blocked_task_id,
          energyIndex: e.energy_index || 3,
          flaggedToManager: e.flagged_to_manager || false,
          user: e.user ? {
            id: e.user.id,
            fullName: e.user.full_name || e.user.fullName || '',
            avatarUrl: e.user.avatar_url || e.user.avatarUrl || '',
            email: e.user.email || ''
          } : undefined,
          completedTasks: e.completedTasks || [],
        }))
      };
    } catch (e) {
      console.warn('[eodService.getEodEntries] Exception:', e);
      return { entries: [] };
    }
  },

  submitEod: async (orgSlug: string, payload: SubmitEODPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const userId = await ensureUserExists();
    const entryDate = payload.entryDate ? payload.entryDate.split('T')[0] : new Date().toISOString().split('T')[0];

    // Check if an entry already exists for this user and date
    const { data: existing } = await supabase
      .from('eod_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_date', entryDate)
      .maybeSingle();

    const rowPayload: any = {
      id: existing?.id || crypto.randomUUID(),
      org_id: orgId,
      user_id: userId,
      entry_date: entryDate,
      accomplishments: payload.accomplishments || [],
      blockers: payload.blockers || null,
      blocked_task_id: payload.blockedTaskId && isUuid(payload.blockedTaskId) ? payload.blockedTaskId : null,
      energy_index: payload.energyIndex || 3,
      flagged_to_manager: payload.flaggedToManager || false,
    };

    const { data: entry, error } = await supabase
      .from('eod_entries')
      .upsert(rowPayload, { onConflict: 'user_id,entry_date' })
      .select()
      .single();

    if (error) {
      console.warn('[eodService.submitEod] Error:', error);
      throw new Error(error.message);
    }

    if (payload.completedTaskIds && payload.completedTaskIds.length > 0) {
      const validTaskIds = payload.completedTaskIds.filter(isUuid);
      if (validTaskIds.length > 0) {
        await supabase.from('eod_completed_tasks').delete().eq('eod_id', entry.id);
        await supabase.from('eod_completed_tasks').insert(
          validTaskIds.map(tid => ({ eod_id: entry.id, task_id: tid }))
        );
      }
    }

    return {
      entry: {
        id: entry.id,
        userId: entry.user_id,
        teamId: entry.team_id || '',
        entryDate: entry.entry_date,
        accomplishments: entry.accomplishments,
        blockers: entry.blockers,
        blockedTaskId: entry.blocked_task_id,
        energyIndex: entry.energy_index,
        flaggedToManager: entry.flagged_to_manager,
        completedTasks: (payload.completedTaskIds || []).map(tid => ({ taskId: tid })),
      }
    };
  },

  deleteEod: async (entryId: string) => {
    if (!entryId) return { success: false };
    try {
      if (isUuid(entryId)) {
        await supabase.from('eod_completed_tasks').delete().eq('eod_id', entryId);
        const { error } = await supabase.from('eod_entries').delete().eq('id', entryId);
        if (error) {
          console.warn('[eodService.deleteEod] Supabase error:', error);
        }
      }
      return { success: true };
    } catch (err) {
      console.warn('[eodService.deleteEod] Exception:', err);
      return { success: true };
    }
  },
};
