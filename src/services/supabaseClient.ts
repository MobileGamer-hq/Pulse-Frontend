import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fzeqpawcchgsgwyjjqza.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1b2BknFiDHeYkXQoCAUBEw_LxJ-xfte';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// In-memory cache for slug -> organization mapping
const orgCache = new Map<string, { id: string; slug: string; name: string }>();

export const getCurrentUserId = (): string => {
  const stored = localStorage.getItem('pulse_user_id');
  if (stored && isUuid(stored)) return stored;
  return '';
};

export const getCurrentUserEmail = (): string => {
  return localStorage.getItem('pulse_user_email') || '';
};

export const getCurrentUserName = (): string => {
  return localStorage.getItem('pulse_user_name') || '';
};

export const isUuid = (val: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

export const ensureUserExists = async (): Promise<string> => {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    throw new Error('You must be signed in to perform this action.');
  }

  const user = authData.user;
  const userId = user.id;
  const email = user.email || getCurrentUserEmail();
  const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'User';

  localStorage.setItem('pulse_user_id', userId);
  if (email) localStorage.setItem('pulse_user_email', email);
  if (name) localStorage.setItem('pulse_user_name', name);

  // Guarantee row in public.users table in Supabase
  await supabase.from('users').upsert({
    id: userId,
    email,
    full_name: name,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  return userId;
};

export const getOrgBySlug = async (slugOrId: string): Promise<{ id: string; slug: string; name: string } | null> => {
  if (!slugOrId) return null;
  const cleanKey = slugOrId.toLowerCase().trim();

  if (orgCache.has(cleanKey)) {
    return orgCache.get(cleanKey)!;
  }

  try {
    let query = supabase.from('organizations').select('id, slug, name');
    if (isUuid(slugOrId)) {
      query = query.or(`id.eq.${slugOrId},slug.eq.${cleanKey}`);
    } else {
      query = query.eq('slug', cleanKey);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      const org = { id: data.id, slug: data.slug, name: data.name };
      orgCache.set(data.slug.toLowerCase(), org);
      orgCache.set(data.id, org);
      return org;
    }
    return null;
  } catch (err) {
    console.warn('[getOrgBySlug] Supabase query error:', err);
    return null;
  }
};

export const getOrgIdBySlug = async (slugOrId: string): Promise<string | null> => {
  if (!slugOrId) return null;
  if (isUuid(slugOrId)) return slugOrId;
  const org = await getOrgBySlug(slugOrId);
  return org ? org.id : null;
};

