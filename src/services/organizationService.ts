import { supabase, getCurrentUserEmail, getCurrentUserName, getOrgIdBySlug, getOrgBySlug, ensureUserExists } from './supabaseClient';

export interface CreateOrgPayload {
  name: string;
  slug: string;
  industry?: string;
  companySize?: string;
  logoUrl?: string;
}

export type ValidUserRole = 'admin' | 'executive' | 'hr' | 'manager' | 'team_lead' | 'member' | 'contractor';

export const normalizeUserRole = (role?: string): ValidUserRole => {
  if (!role) return 'member';
  const clean = role.toLowerCase().replace(/[\s-]+/g, '_').trim();
  if (clean === 'admin' || clean === 'administrator') return 'admin';
  if (clean === 'executive' || clean === 'exec') return 'executive';
  if (clean === 'hr') return 'hr';
  if (clean === 'manager') return 'manager';
  if (clean === 'team_lead' || clean === 'teamlead' || clean === 'lead') return 'team_lead';
  if (clean === 'contractor') return 'contractor';
  return 'member';
};

const RESERVED_SLUGS = ['welcome', 'login', 'signin', 'register', 'signup', 'select-org', 'create-org', 'join-org', 'invite', 'admin', 'api', 'dashboard', 'settings'];

export const organizationService = {
  checkSlugAvailable: async (slug: string): Promise<{ available: boolean; reason?: string }> => {
    if (!slug) return { available: false, reason: 'Please enter a valid workspace slug.' };
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!cleanSlug) return { available: false, reason: 'Slug must contain valid alphanumeric characters.' };

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      return { available: false, reason: `"${cleanSlug}" is a reserved system keyword. Please choose another slug.` };
    }

    // Check Supabase organizations table
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, slug, name')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (!error && data) {
        return { available: false, reason: `The workspace URL "pulse.epicordia.com/${cleanSlug}" is already taken.` };
      }
    } catch (e) {
      console.warn('[checkSlugAvailable] Supabase check error:', e);
    }

    return { available: true };
  },

  createOrganization: async (payload: CreateOrgPayload) => {
    const userId = await ensureUserExists();
    const cleanSlug = payload.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    
    // Validate slug uniqueness against Supabase
    const check = await organizationService.checkSlugAvailable(cleanSlug);
    if (!check.available) {
      throw new Error(check.reason || `The workspace slug "${cleanSlug}" is already in use.`);
    }

    const orgId = crypto.randomUUID();
    const orgData = {
      id: orgId,
      name: payload.name.trim(),
      slug: cleanSlug,
      industry: payload.industry || null,
      company_size: payload.companySize || null,
      logo_url: payload.logoUrl || null,
    };

    // 1. Insert into Supabase (Source of Truth)
    const { error: orgErr } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: payload.name.trim(),
        slug: cleanSlug,
        industry: payload.industry || null,
        company_size: payload.companySize || null,
        logo_url: payload.logoUrl || null,
      });

    if (orgErr) {
      console.error('[createOrganization] Supabase org insert error:', orgErr);
      throw new Error(orgErr.message || 'Failed to create organization in database.');
    }

    const { error: memErr } = await supabase.from('organization_memberships').insert({
      id: crypto.randomUUID(),
      org_id: orgId,
      user_id: userId,
      role: 'admin',
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    });

    if (memErr) {
      console.error('[createOrganization] Supabase membership insert error:', memErr);
      throw new Error(memErr.message || 'Failed to establish administrator membership.');
    }

    localStorage.setItem('pulse_tenant_slug', cleanSlug);
    localStorage.setItem(`pulse_org_status_${cleanSlug}`, 'APPROVED');
    localStorage.setItem(`pulse_user_role_${cleanSlug}`, 'Admin');

    return { organization: orgData };
  },

  joinOrganization: async (slug: string) => {
    const userId = await ensureUserExists();
    const cleanSlug = slug.toLowerCase().trim();
    const org = await getOrgBySlug(cleanSlug);
    if (!org) {
      throw new Error(`Organization with slug "${slug}" not found.`);
    }

    const { data: existing } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('org_id', org.id)
      .eq('user_id', userId)
      .maybeSingle();

    const membershipId = existing?.id || crypto.randomUUID();

    const { error: joinError } = await supabase.from('organization_memberships').upsert({
      id: membershipId,
      org_id: org.id,
      user_id: userId,
      role: 'member',
      status: 'pending',
    }, { onConflict: 'org_id,user_id' });

    if (joinError) {
      console.error('[joinOrganization] Supabase error:', joinError);
      throw new Error(joinError.message || 'Failed to submit join request.');
    }

    localStorage.setItem('pulse_tenant_slug', cleanSlug);
    localStorage.setItem(`pulse_org_status_${cleanSlug}`, 'PENDING');

    return { message: 'Join request submitted', status: 'pending', orgId: org.id, orgSlug: org.slug };
  },

  getPendingMembers: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { pendingMembers: [] };

    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select('*, user:users!organization_memberships_user_id_fkey(*)')
        .eq('org_id', orgId)
        .eq('status', 'pending');

      if (error) {
        console.warn('[getPendingMembers] Error:', error);
        return { pendingMembers: [] };
      }

      const pendingMembers = (data || []).map((m: any) => ({
        id: m.user?.id || m.user_id,
        name: m.user?.full_name || m.user?.email?.split('@')[0] || 'Pending User',
        email: m.user?.email || '',
        role: m.role ? (m.role.charAt(0).toUpperCase() + m.role.slice(1)) : 'Member',
        avatarUrl: m.user?.avatar_url,
        joinedAt: m.joined_at,
      }));

      return { pendingMembers };
    } catch (e) {
      return { pendingMembers: [] };
    }
  },

  getOrgMembers: async (orgSlug: string) => {
    const cleanSlug = (orgSlug || localStorage.getItem('pulse_tenant_slug') || '').toLowerCase().trim();
    if (!cleanSlug) return { members: [] };

    try {
      const orgId = await getOrgIdBySlug(cleanSlug);
      if (!orgId) return { members: [] };

      const { data, error } = await supabase
        .from('organization_memberships')
        .select('*, user:users!organization_memberships_user_id_fkey(*)')
        .eq('org_id', orgId)
        .eq('status', 'approved');

      if (!error && data && data.length > 0) {
        const members = data.map((m: any) => ({
          id: m.user?.id || m.user_id,
          orgId: cleanSlug,
          name: m.user?.full_name || m.user?.email?.split('@')[0] || 'Team Member',
          email: m.user?.email || '',
          role: m.role ? (m.role.charAt(0).toUpperCase() + m.role.slice(1)) : 'Member',
          avatarUrl: m.user?.avatar_url,
          capacityHoursPerWeek: m.user?.capacity_hours_per_week || 40,
          joinedAt: m.joined_at,
        }));
        return { members };
      }
    } catch (e) {
      console.warn('[getOrgMembers] Supabase query error:', e);
    }

    return { members: [] };
  },

  approveMember: async (orgSlug: string, userId: string, role: string = 'member') => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const formattedRole = normalizeUserRole(role);
    const adminId = await ensureUserExists();

    const { error } = await supabase
      .from('organization_memberships')
      .update({
        status: 'approved',
        role: formattedRole,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) {
      console.error('[approveMember] Supabase error:', error);
      throw new Error(error.message || 'Failed to approve member.');
    }

    return { success: true };
  },

  removeMemberFromOrg: async (orgSlug: string, userId: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    // 1. Remove from organization_memberships
    const { error: memErr } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (memErr) {
      console.error('[removeMemberFromOrg] Membership delete error:', memErr);
    }

    // 2. Remove user from team_members associated with this org's teams
    try {
      const { data: orgTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('org_id', orgId);

      if (orgTeams && orgTeams.length > 0) {
        const teamIds = orgTeams.map(t => t.id);
        await supabase
          .from('team_members')
          .delete()
          .in('team_id', teamIds)
          .eq('user_id', userId);
      }
    } catch (teamErr) {
      console.warn('[removeMemberFromOrg] Team member cleanup warning:', teamErr);
    }

    return { success: true };
  },

  createInvite: async (orgSlug: string, payload: { email: string; role?: string; teamId?: string }) => {
    const cleanSlug = (orgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia').toLowerCase().trim();
    const org = await getOrgBySlug(cleanSlug);
    if (!org) {
      throw new Error(`Organization "${cleanSlug}" not found.`);
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const presetRole = normalizeUserRole(payload.role);
    const creatorId = await ensureUserExists();
    const inviteId = crypto.randomUUID();

    const { error: inviteError } = await supabase
      .from('organization_invites')
      .insert({
        id: inviteId,
        org_id: org.id,
        email: payload.email.trim().toLowerCase(),
        token,
        preset_role: presetRole,
        created_by: creatorId,
        expires_at: expiresAt,
      });

    if (inviteError) {
      console.error('[organizationService.createInvite] Supabase error:', inviteError);
      throw new Error(inviteError.message || 'Failed to create workspace invitation.');
    }

    const inviteLink = `${window.location.origin}/invite/${token}`;

    return {
      success: true,
      invite: {
        id: inviteId,
        org_id: org.id,
        email: payload.email.trim().toLowerCase(),
        token,
        preset_role: presetRole,
        presetRole: payload.role || 'Member',
        created_by: creatorId,
        expires_at: expiresAt,
        organization: org,
        creator: {
          id: creatorId,
          fullName: getCurrentUserName(),
          email: getCurrentUserEmail(),
        }
      },
      token,
      inviteLink,
    };
  },

  getMyInvites: async () => {
    const userEmail = getCurrentUserEmail().toLowerCase().trim();
    if (!userEmail) return { invites: [] };

    try {
      const { data, error } = await supabase
        .from('organization_invites')
        .select('*, organization:organizations(*)')
        .eq('email', userEmail)
        .gt('expires_at', new Date().toISOString());

      if (!error && data) {
        return { invites: data };
      }
    } catch (err) {
      console.warn('[organizationService.getMyInvites] Error:', err);
    }

    return { invites: [] };
  },

  getInviteByToken: async (token: string) => {
    if (!token) return { invite: null };

    try {
      const { data, error } = await supabase
        .from('organization_invites')
        .select('*, organization:organizations(*)')
        .eq('token', token)
        .maybeSingle();

      if (!error && data) {
        return { invite: data };
      }
    } catch (err) {
      console.warn('[organizationService.getInviteByToken] Error:', err);
    }

    return { invite: null };
  },

  acceptInviteByToken: async (token: string) => {
    const userId = await ensureUserExists();

    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .select('*, organization:organizations(*)')
      .eq('token', token)
      .maybeSingle();

    if (inviteError || !invite) {
      throw new Error('Invitation is invalid or has expired.');
    }

    const orgId = invite.org_id || invite.organization?.id;
    const orgSlug = (invite.organization?.slug || 'epicordia').toLowerCase();
    const orgName = invite.organization?.name || (orgSlug.charAt(0).toUpperCase() + orgSlug.slice(1));
    const role = invite.preset_role || 'member';

    const { error: memError } = await supabase.from('organization_memberships').upsert({
      id: crypto.randomUUID(),
      org_id: orgId,
      user_id: userId,
      role: normalizeUserRole(role),
      status: 'approved',
      approved_at: new Date().toISOString(),
    }, { onConflict: 'org_id,user_id' });

    if (memError) {
      console.error('[acceptInviteByToken] Supabase membership error:', memError);
      throw new Error(memError.message || 'Failed to activate organization membership.');
    }

    await supabase.from('organization_invites').delete().eq('id', invite.id);

    localStorage.setItem('pulse_tenant_slug', orgSlug);
    localStorage.setItem(`pulse_org_status_${orgSlug}`, 'APPROVED');
    localStorage.setItem(`pulse_user_role_${orgSlug}`, role.charAt(0).toUpperCase() + role.slice(1));

    return {
      success: true,
      orgSlug,
      orgName,
      organization: { id: orgId, name: orgName, slug: orgSlug },
    };
  },

  inAppAcceptInvite: async (inviteId: string) => {
    await ensureUserExists();
    const { data: invite, error } = await supabase
      .from('organization_invites')
      .select('*, organization:organizations(*)')
      .eq('id', inviteId)
      .maybeSingle();

    if (error || !invite) {
      throw new Error('Invitation record not found.');
    }

    return await organizationService.acceptInviteByToken(invite.token);
  },

  inAppDeclineInvite: async (inviteId: string) => {
    const { error } = await supabase.from('organization_invites').delete().eq('id', inviteId);
    if (error) {
      console.error('[inAppDeclineInvite] Supabase error:', error);
      throw new Error(error.message || 'Failed to decline invitation.');
    }
    return { success: true };
  },
};
