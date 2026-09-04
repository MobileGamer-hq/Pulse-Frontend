import { apiRequest } from './apiClient';

export interface CreateOrgPayload {
  name: string;
  slug: string;
  industry?: string;
  companySize?: string;
  logoUrl?: string;
}

export const organizationService = {
  createOrganization: async (payload: CreateOrgPayload) => {
    return apiRequest('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  joinOrganization: async (slug: string) => {
    return apiRequest('/organizations/join', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    });
  },

  getPendingMembers: async (orgSlug: string) => {
    return apiRequest('/organizations/me/pending-members', {
      orgSlug,
    });
  },

  getOrgMembers: async (orgSlug: string) => {
    return apiRequest('/organizations/me/members', {
      orgSlug,
    });
  },

  approveMember: async (orgSlug: string, userId: string, role: string = 'member') => {
    return apiRequest(`/organizations/me/members/${userId}/approve`, {
      method: 'PATCH',
      orgSlug,
      body: JSON.stringify({ role }),
    });
  },

  createInvite: async (orgSlug: string, payload: { email: string; role?: string; teamId?: string }) => {
    return apiRequest(`/organizations/${orgSlug}/invites`, {
      method: 'POST',
      orgSlug,
      body: JSON.stringify(payload),
    });
  },

  getMyInvites: async () => {
    return apiRequest('/invites/my-invites');
  },

  getInviteByToken: async (token: string) => {
    return apiRequest(`/invites/${token}`);
  },

  acceptInviteByToken: async (token: string) => {
    return apiRequest(`/invites/${token}/accept`, {
      method: 'POST',
    });
  },

  inAppAcceptInvite: async (inviteId: string) => {
    return apiRequest(`/invites/${inviteId}/in-app-accept`, {
      method: 'POST',
    });
  },

  inAppDeclineInvite: async (inviteId: string) => {
    return apiRequest(`/invites/${inviteId}/in-app-decline`, {
      method: 'POST',
    });
  },
};
