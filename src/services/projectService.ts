import { apiRequest } from './apiClient';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  teamId?: string;
  leadId?: string;
  templateType?: string;
  status?: string;
  startDate?: string;
  targetEndDate?: string;
}

export const projectService = {
  getProjects: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/projects`);
  },

  createProject: async (orgSlug: string, payload: CreateProjectPayload) => {
    return apiRequest(`/organizations/${orgSlug}/projects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProject: async (orgSlug: string, projectId: string, payload: Partial<CreateProjectPayload>) => {
    return apiRequest(`/organizations/${orgSlug}/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteProject: async (orgSlug: string, projectId: string) => {
    return apiRequest(`/organizations/${orgSlug}/projects/${projectId}`, {
      method: 'DELETE',
    });
  },
};
