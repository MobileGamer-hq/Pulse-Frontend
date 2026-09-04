import { apiRequest } from './apiClient';

export interface CreateTeamPayload {
  name: string;
  workflowTemplate?: string;
  memberIds?: string[];
  leadId?: string;
}

export const teamService = {
  getTeams: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/teams`);
  },

  createTeam: async (orgSlug: string, payload: CreateTeamPayload) => {
    return apiRequest(`/organizations/${orgSlug}/teams`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTeam: async (orgSlug: string, teamId: string, payload: Partial<CreateTeamPayload>) => {
    return apiRequest(`/organizations/${orgSlug}/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteTeam: async (orgSlug: string, teamId: string) => {
    return apiRequest(`/organizations/${orgSlug}/teams/${teamId}`, {
      method: 'DELETE',
    });
  },
};
