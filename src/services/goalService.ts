import { supabase, getOrgIdBySlug, isUuid, ensureUserExists } from './supabaseClient';

export interface KeyResultPayload {
  title: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
}

export interface CreateGoalPayload {
  title: string;
  description?: string;
  ownerType?: 'org' | 'team' | 'individual';
  ownerId?: string;
  targetDate?: string;
  status?: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  keyResults?: KeyResultPayload[];
}

export const goalService = {
  getGoals: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { goals: [] };

    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        keyResults:key_results(*),
        goalTags:goal_tags(tag_id)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[goalService.getGoals] Error:', error);
      return { goals: [] };
    }

    return { goals: data || [] };
  },

  createGoal: async (orgSlug: string, payload: CreateGoalPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error(`Organization "${orgSlug}" not found.`);

    const userId = await ensureUserExists();
    const ownerId = payload.ownerId && isUuid(payload.ownerId)
      ? payload.ownerId
      : (payload.ownerType === 'org' ? (orgId || userId) : userId);

    const goalId = crypto.randomUUID();
    const targetDate = payload.targetDate && payload.targetDate.trim()
      ? payload.targetDate
      : new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

    const { data: createdGoal, error } = await supabase
      .from('goals')
      .insert({
        id: goalId,
        org_id: orgId,
        title: payload.title.trim(),
        description: payload.description || null,
        owner_type: payload.ownerType || 'org',
        owner_id: ownerId,
        target_date: targetDate,
        status: payload.status || 'on_track',
      })
      .select('*, keyResults:key_results(*)')
      .single();

    if (error) {
      console.error('[goalService.createGoal] Supabase error:', error);
      throw new Error(error.message || 'Failed to create goal in database.');
    }

    if (payload.keyResults && payload.keyResults.length > 0) {
      const krRows = payload.keyResults.map(kr => ({
        id: crypto.randomUUID(),
        goal_id: goalId,
        title: kr.title,
        target_value: kr.targetValue,
        current_value: kr.currentValue || 0,
        unit: kr.unit || 'percentage',
      }));
      await supabase.from('key_results').insert(krRows);
    }

    return {
      goal: createdGoal
    };
  },
};
