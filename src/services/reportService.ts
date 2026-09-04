import { apiRequest } from './apiClient';

export interface GenerateReportPayload {
  type: 'weekly_summary' | 'executive_dossier' | 'team_health' | 'project_velocity';
  title: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
}

export const reportService = {
  getReports: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/reports`);
  },

  getReportStatus: async (orgSlug: string, reportId: string) => {
    return apiRequest(`/organizations/${orgSlug}/reports/${reportId}`);
  },

  generateReport: async (orgSlug: string, payload: GenerateReportPayload) => {
    return apiRequest(`/organizations/${orgSlug}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
