import { supabase, getCurrentUserId, getCurrentUserEmail, getCurrentUserName } from './supabaseClient';

export interface UserSyncPayload {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  capacityHoursPerWeek?: number;
}

export const authService = {
  syncUser: async (payload: UserSyncPayload) => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || getCurrentUserId();
    const email = payload.email || authData?.user?.email || getCurrentUserEmail();
    const fullName = payload.fullName || authData?.user?.user_metadata?.full_name || getCurrentUserName();

    const userData = {
      id: userId,
      email,
      full_name: fullName,
      avatar_url: payload.avatarUrl || null,
      capacity_hours_per_week: payload.capacityHoursPerWeek || 40,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[authService.syncUser] Direct Supabase upsert error:', error);
      return { user: userData };
    }

    return { user: data };
  },

  getMe: async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        return {
          user: null,
          pendingInvites: [],
        };
      }

      const user = authData.user;
      const userId = user.id;
      const userEmail = user.email || '';

      // 1. Fetch user record
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. Fetch memberships with organization details
      const { data: membershipsData } = await supabase
        .from('organization_memberships')
        .select('*, organization:organizations(*)')
        .eq('user_id', userId);

      // 3. Fetch pending invites for user email
      const { data: invitesData } = await supabase
        .from('organization_invites')
        .select('*, organization:organizations(*)')
        .eq('email', userEmail.toLowerCase())
        .gt('expires_at', new Date().toISOString());

      const finalUser = {
        id: userId,
        email: userProfile?.email || userEmail,
        fullName: userProfile?.full_name || user.user_metadata?.full_name || userEmail.split('@')[0],
        avatarUrl: userProfile?.avatar_url || null,
        capacityHoursPerWeek: userProfile?.capacity_hours_per_week || 40,
        memberships: membershipsData || [],
      };

      return {
        user: finalUser,
        pendingInvites: invitesData || [],
      };
    } catch (err) {
      console.warn('[authService.getMe] Failed to query Supabase directly:', err);
      return {
        user: null,
        pendingInvites: [],
      };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[authService.signOut] error:', e);
    }
    const theme = localStorage.getItem('pulse_theme');
    localStorage.clear();
    if (theme) localStorage.setItem('pulse_theme', theme);
    window.location.href = '/welcome';
  },
};
