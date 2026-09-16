import { supabase, getOrgIdBySlug, ensureUserExists } from './supabaseClient';

export const webhooksService = {
  getWebhooks: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { webhooks: [] };

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[webhooksService.getWebhooks] Error:', error);
      return { webhooks: [] };
    }

    return { webhooks: data || [] };
  },

  createWebhook: async (orgSlug: string, payload: { name: string; targetUrl: string; eventTriggers?: string[] }) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const secretKey = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        id: crypto.randomUUID(),
        org_id: orgId,
        name: payload.name,
        target_url: payload.targetUrl,
        secret_key: secretKey,
        event_triggers: payload.eventTriggers || ['all'],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { webhook: data };
  },

  getApiKeys: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { apiKeys: [] };

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[webhooksService.getApiKeys] Error:', error);
      return { apiKeys: [] };
    }

    return { apiKeys: data || [] };
  },

  createApiKey: async (orgSlug: string, payload: { name: string; scopes?: string[] }) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const userId = await ensureUserExists();
    const generatedKey = `pk_live_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        id: crypto.randomUUID(),
        org_id: orgId,
        name: payload.name,
        key_hash: generatedKey,
        scopes: payload.scopes || ['read', 'write'],
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { apiKey: generatedKey, secretKey: generatedKey, keyRecord: data };
  },
};
