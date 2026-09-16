import { supabase, getOrgIdBySlug } from './supabaseClient';

export interface CreateTagPayload {
  name: string;
  colorHex?: string;
  bgHex?: string;
  textHex?: string;
  description?: string;
  taskIds?: string[];
  projectIds?: string[];
  userIds?: string[];
  goalIds?: string[];
}

export const tagService = {
  getTags: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { tags: [] };

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[tagService.getTags] Error:', error);
      return { tags: [] };
    }

    return {
      tags: (data || []).map((t: any) => ({
        id: t.id,
        orgId: t.org_id,
        name: t.name,
        colorHex: t.color_hex,
        bgHex: t.bg_hex,
        textHex: t.text_hex,
        description: t.description,
      }))
    };
  },

  createTag: async (orgSlug: string, payload: CreateTagPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const tagId = crypto.randomUUID();
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        id: tagId,
        org_id: orgId,
        name: payload.name,
        color_hex: payload.colorHex || '#3B82F6',
        bg_hex: payload.bgHex || 'rgba(59, 130, 246, 0.1)',
        text_hex: payload.textHex || payload.colorHex || '#3B82F6',
        description: payload.description || null,
      })
      .select()
      .single();

    if (error) {
      console.warn('[tagService.createTag] Error:', error);
      throw new Error(error.message);
    }

    return {
      tag: {
        id: tag.id,
        orgId: tag.org_id,
        name: tag.name,
        colorHex: tag.color_hex,
        bgHex: tag.bg_hex,
        textHex: tag.text_hex,
        description: tag.description,
      }
    };
  },

  updateTag: async (_orgSlug: string, tagId: string, updates: Partial<CreateTagPayload>) => {
    const rowUpdates: Record<string, any> = {};
    if (updates.name !== undefined) rowUpdates.name = updates.name;
    if (updates.colorHex !== undefined) rowUpdates.color_hex = updates.colorHex;
    if (updates.bgHex !== undefined) rowUpdates.bg_hex = updates.bgHex;
    if (updates.textHex !== undefined) rowUpdates.text_hex = updates.textHex;
    if (updates.description !== undefined) rowUpdates.description = updates.description;

    const { data, error } = await supabase
      .from('tags')
      .update(rowUpdates)
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { tag: data };
  },

  deleteTag: async (_orgSlug: string, tagId: string) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  attachTag: async (_orgSlug: string, tagId: string, entityType: string, entityId: string) => {
    if (entityType === 'task') {
      await supabase.from('task_tags').upsert({ task_id: entityId, tag_id: tagId });
    } else if (entityType === 'project') {
      await supabase.from('project_tags').upsert({ project_id: entityId, tag_id: tagId });
    } else if (entityType === 'person' || entityType === 'user') {
      await supabase.from('user_tags').upsert({ user_id: entityId, tag_id: tagId });
    } else if (entityType === 'goal') {
      await supabase.from('goal_tags').upsert({ goal_id: entityId, tag_id: tagId });
    }
    return { success: true };
  },

  detachTag: async (_orgSlug: string, tagId: string, entityType: string, entityId: string) => {
    if (entityType === 'task') {
      await supabase.from('task_tags').delete().match({ task_id: entityId, tag_id: tagId });
    } else if (entityType === 'project') {
      await supabase.from('project_tags').delete().match({ project_id: entityId, tag_id: tagId });
    } else if (entityType === 'person' || entityType === 'user') {
      await supabase.from('user_tags').delete().match({ user_id: entityId, tag_id: tagId });
    } else if (entityType === 'goal') {
      await supabase.from('goal_tags').delete().match({ goal_id: entityId, tag_id: tagId });
    }
    return { success: true };
  },
};
