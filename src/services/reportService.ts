import { supabase, getOrgIdBySlug, ensureUserExists } from './supabaseClient';

export interface GenerateReportPayload {
  type: 'weekly_summary' | 'executive_dossier' | 'team_health' | 'project_velocity';
  title: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
}

export const reportService = {
  getReports: async (orgSlug: string) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) return { reports: [] };

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[reportService.getReports] Error:', error);
      return { reports: [] };
    }

    return {
      reports: (data || []).map((r: any) => ({
        id: r.id,
        orgId: r.org_id,
        type: r.type,
        title: r.title,
        periodLabel: r.period_label,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        status: r.status,
        summaryJson: r.summary_json,
        pdfFileUrl: r.pdf_file_url,
        errorMessage: r.error_message,
        createdBy: r.created_by,
        createdAt: r.created_at,
        completedAt: r.completed_at,
      }))
    };
  },

  getReportStatus: async (_orgSlug: string, reportId: string) => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (error || !data) {
      return { report: null };
    }

    return { report: data };
  },

  generateReport: async (orgSlug: string, payload: GenerateReportPayload) => {
    const orgId = await getOrgIdBySlug(orgSlug);
    if (!orgId) throw new Error('Organization not found');

    const userId = await ensureUserExists();
    const periodStart = new Date(payload.periodStart).toISOString();
    const periodEnd = new Date(payload.periodEnd).toISOString();

    // 1. Gather quick metrics from DB for the period
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, created_at, updated_at')
      .eq('org_id', orgId);

    const { data: eods } = await supabase
      .from('eod_entries')
      .select('id, entry_date')
      .eq('org_id', orgId);

    const periodTasks = (tasks || []).filter(t => {
      const created = new Date(t.created_at);
      return created >= new Date(periodStart) && created <= new Date(periodEnd);
    });

    const totalTasks = periodTasks.length > 0 ? periodTasks.length : (tasks?.length || 0);
    const completedTasks = (tasks || []).filter(t => t.status === 'done').length;
    const blockedTasks = (tasks || []).filter(t => t.status === 'blocked' || t.status === 'at_risk').length;
    const eodEntriesCount = (eods || []).length;

    const summaryJson = {
      totalTasks,
      completedTasks,
      blockedTasks,
      eodEntriesCount,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        id: crypto.randomUUID(),
        org_id: orgId,
        type: payload.type,
        title: payload.title,
        period_label: payload.periodLabel,
        period_start: payload.periodStart,
        period_end: payload.periodEnd,
        status: 'completed',
        summary_json: summaryJson,
        created_by: userId,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn('[reportService.generateReport] Error:', error);
      throw new Error(error.message);
    }

    return {
      message: 'Report generated successfully',
      reportId: report.id,
      status: 'completed',
      report,
    };
  },
};
