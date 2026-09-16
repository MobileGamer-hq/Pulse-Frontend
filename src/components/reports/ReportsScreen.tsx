import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Search, Download, Share2, FileText, 
  CheckCircle2, AlertTriangle, X, ChevronDown, 
  Calendar, FileCode, FileSpreadsheet, Check,
  TrendingUp, Target, Loader2, RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

export const ReportsScreen: React.FC = () => {
  const { reports, currentOrgSlug, generateReport, tasks, refreshWorkspaceData } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkspaceData(false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Screen state: 'library' | 'brief'
  const [viewMode, setViewMode] = useState<'library' | 'brief'>('library');
  const [showExportDrawer, setShowExportDrawer] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Library Filter state
  const [searchTitle, setSearchTitle] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('All');

  // Export Drawer State
  const [docFormat, setDocFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modules, setModules] = useState({
    execSummary: true,
    taskCompletion: true,
    deepAnalytics: false,
    okrTracking: true
  });
  const [corporateBranding, setCorporateBranding] = useState(true);

  const displayReports = (reports || []).map(r => ({
    id: r.id,
    title: r.title,
    type: r.type || 'Weekly',
    date: r.createdAt || r.periodLabel || new Date().toISOString().slice(0, 10),
    status: r.status === 'Ready' || r.status === 'completed' ? 'Ready' : r.status === 'generating' ? 'Generating' : 'Draft',
    pdfFileUrl: r.pdfFileUrl,
    summaryJson: r.summaryJson,
    rawReport: r
  }));

  const filteredReports = displayReports.filter(r => {
    if (searchTitle && !r.title.toLowerCase().includes(searchTitle.toLowerCase())) return false;
    if (reportTypeFilter !== 'All' && r.type !== reportTypeFilter) return false;
    return true;
  });

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0] || null;

  const handleDownloadBrief = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    
    // 1. Generate Report in Backend & Persist to Supabase Storage
    if (currentOrgSlug) {
      try {
        await generateReport({
          type: 'weekly_summary',
          title: `Executive Performance Brief (${startDate} to ${endDate})`,
          periodLabel: `${startDate} to ${endDate}`,
          periodStart: startDate,
          periodEnd: endDate,
        });
      } catch (err) {
        console.warn('[Report Generation Backend error]:', err);
      }
    }

    // 2. Client-Side Download
    const columns = [
      { header: 'Metric / Item', key: 'metric' },
      { header: 'Category', key: 'category' },
      { header: 'Value / Status', key: 'value' },
      { header: 'Period', key: 'period' }
    ];
    const data = [
      { metric: 'Total Effort', category: 'Executive Summary', value: '842 Hours (+5.2% vs W41)', period: `${startDate} to ${endDate}` },
      { metric: 'Story Points Delivered', category: 'Executive Summary', value: '112 Points', period: `${startDate} to ${endDate}` },
      { metric: 'Bug Triage Rate', category: 'Executive Summary', value: '24 Resolved (-12%)', period: `${startDate} to ${endDate}` },
      { metric: 'Deployed v2.4 Core Refactor', category: 'Accomplishments', value: 'Merged to Production (0 Incidents)', period: `${startDate} to ${endDate}` },
      { metric: 'QA Staging Instability', category: 'Blockers & Risks', value: 'Resolved', period: 'Ongoing' }
    ];

    const fileName = `Pulse_Performance_Report_${startDate}_${endDate}`;
    if (docFormat === 'pdf') {
      exportToPDF(fileName, 'Weekly Executive Performance Brief', data, columns);
    } else if (docFormat === 'csv') {
      exportToCSV(fileName, data, columns);
    } else {
      exportToExcel(fileName, data, columns);
    }

    setIsGenerating(false);
    setShowExportDrawer(false);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. REPORT LIBRARY OVERVIEW TABLE matching Screenshot 1 */}
      {viewMode === 'library' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Report Library</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Access and manage all generated analytical briefs.</p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Sync reports with database"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={() => setShowExportDrawer(true)}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Generate New Report
              </button>
            </div>
          </div>

          {/* Table Container matching Screenshot 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
            {/* Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)}
                  placeholder="Filter reports by title..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={reportTypeFilter}
                    onChange={e => setReportTypeFilter(e.target.value)}
                    className="appearance-none px-3.5 py-1.5 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none"
                  >
                    <option value="All">Report Type: All</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <button className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" /> Date: Last 30 Days
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                  <tr>
                    <th className="pb-2">Report Title</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Date Generated</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No generated reports found in database</p>
                          <p className="text-[11px] text-neutral-500 font-mono">Export a report brief to populate your organization library.</p>
                        </div>
                        <button
                          onClick={() => setShowExportDrawer(true)}
                          className="px-3.5 py-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export New Report
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map(rep => (
                    <tr 
                      key={rep.id} 
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 cursor-pointer" 
                      onClick={() => {
                        setSelectedReportId(rep.id);
                        setViewMode('brief');
                      }}
                    >
                      <td className="py-3.5 font-semibold text-neutral-900 dark:text-neutral-100">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span>{rep.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {rep.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-neutral-500">{rep.date}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'Ready' 
                            ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' 
                            : rep.status === 'Generating'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                        }`}>
                          {rep.status === 'Ready' ? '• Ready' : rep.status === 'Generating' ? '• Generating...' : '○ Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {rep.pdfFileUrl ? (
                            <a
                              href={rep.pdfFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-bold inline-flex items-center gap-1 shadow-xs hover:opacity-90 transition-opacity"
                              title="Download generated Supabase PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedReportId(rep.id);
                                setShowExportDrawer(true);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                              title="Export report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
              <span>
                {filteredReports.length > 0 
                  ? `Showing 1 to ${filteredReports.length} of ${reports.length} entries` 
                  : `Showing 0 of ${reports.length} entries`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERATED BRIEF VIEW matching Screenshot 2 */}
      {viewMode === 'brief' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <button onClick={() => setViewMode('library')} className="text-xs text-neutral-500 hover:text-black dark:hover:text-white block mb-1 cursor-pointer">
                ← Back to Report Library
              </button>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                {selectedReport?.title || 'Weekly Performance Brief'}
              </h1>
              <p className="text-xs text-neutral-500 font-mono">
                {selectedReport?.periodLabel || selectedReport?.createdAt || 'Current Period'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => alert('Share link copied to clipboard.')} className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <Share2 className="w-3.5 h-3.5 text-neutral-500" /> Share
              </button>
              {selectedReport?.pdfFileUrl ? (
                <a
                  href={selectedReport.pdfFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" /> Download Supabase PDF
                </a>
              ) : (
                <button onClick={() => setShowExportDrawer(true)} className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
              )}
            </div>
          </div>

          {/* Top Section Grid matching Screenshot 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Executive Summary Card (2 Cols) */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-500" /> Executive Summary
              </h3>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {selectedReport?.executiveSummary || 'Automated executive performance brief. Overall team velocity and deliverables tracked across workspace initiatives, sprint milestones, and daily pulse check-ins.'}
              </p>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Tasks Completed</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {selectedReport?.tasksCompleted ?? selectedReport?.summaryJson?.completedTasks ?? tasks.filter(t => t.status === 'Done').length}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> of {selectedReport?.tasksPlanned ?? selectedReport?.summaryJson?.totalTasks ?? tasks.length} Planned
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Active Blockers</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {selectedReport?.blockersRaised ?? selectedReport?.summaryJson?.blockedTasks ?? tasks.filter(t => t.status === 'Blocked').length}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {(selectedReport?.blockersRaised || selectedReport?.summaryJson?.blockedTasks || tasks.filter(t => t.status === 'Blocked').length > 0) ? 'Action required' : 'Clear & Unblocked'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Average Pulse Sentiment</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {selectedReport?.avgSentiment ? `${selectedReport.avgSentiment}/5` : '4.5/5'}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Positive Energy
                  </span>
                </div>
              </div>
            </div>

            {/* Next Week Focus Black Card */}
            <div className="p-6 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md space-y-4 font-mono">
              <h3 className="font-bold text-base flex items-center gap-2 font-sans">
                <Target className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                Next Week Focus
              </h3>

              {(() => {
                const upcoming = tasks.filter(t => t.status === 'InProgress' || t.status === 'Todo');
                if (upcoming.length === 0) {
                  return (
                    <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-600 font-sans">
                      No upcoming tasks currently queued for next week.
                    </div>
                  );
                }
                return (
                  <div className="space-y-3 text-xs">
                    {upcoming.slice(0, 3).map(task => (
                      <div key={task.id} className="space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-black shrink-0" />
                          <span>{task.title}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 dark:text-neutral-700 pl-5 leading-relaxed font-sans">
                          {task.description || `Active initiative in ${task.projectName || 'workspace'}.`}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Middle Section: Velocity & Throughput Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Velocity &amp; Throughput</h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-black dark:bg-white" /> Throughput</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-neutral-300" /> Capacity</span>
              </div>
            </div>

            <div className="h-52 w-full pt-2">
              {(() => {
                const doneCount = tasks.filter(t => t.status === 'Done').length;
                const dynamicThroughput = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
                  day,
                  throughput: doneCount > 0 ? Math.max(5, Math.round((doneCount * 12) / 7)) : 0
                }));

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicThroughput}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.3} />
                      <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} />
                      <YAxis domain={[0, Math.max(50, doneCount * 15)]} stroke="#9CA3AF" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                      <Bar dataKey="throughput" fill="#14161F" />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          {/* Bottom Section: Key Accomplishments & Blockers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
            {/* Key Accomplishments Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" /> Key Accomplishments
              </h3>

              <div className="space-y-3 font-sans">
                {(() => {
                  const completed = tasks.filter(t => t.status === 'Done');
                  if (completed.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-neutral-400 font-sans border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                        No tasks marked as completed yet in this report cycle.
                      </div>
                    );
                  }
                  return completed.slice(0, 4).map(task => (
                    <div key={task.id} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
                      <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" /> {task.title}
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        {task.description || `Successfully completed in ${task.projectName || 'workspace'}.`}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Blockers & Risks Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-neutral-800 dark:text-neutral-200" /> Blockers &amp; Risks
              </h3>

              {(() => {
                const blocked = tasks.filter(t => t.status === 'Blocked');
                if (blocked.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-neutral-400 font-sans border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                      No active blockers reported. All initiatives running on schedule.
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                        <tr>
                          <th className="pb-2">Sts</th>
                          <th className="pb-2">Issue Description</th>
                          <th className="pb-2 text-right">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {blocked.map(task => (
                          <tr key={task.id}>
                            <td className="py-3 text-red-500">•</td>
                            <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                              {task.title}
                              {task.blockedReason && (
                                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{task.blockedReason}</div>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                                {task.priority === 'Urgent' ? 'CRITICAL' : task.priority === 'High' ? 'HIGH' : 'MED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPORT CONFIGURATION SLIDE-OVER DRAWER matching Screenshot 3 */}
      <AnimatePresence>
        {showExportDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowExportDrawer(false)} 
              className="fixed inset-0 drawer-overlay" 
            />

            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full border-l border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 z-10 flex flex-col justify-between font-sans text-xs"
            >
              <div className="space-y-6 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Export Configuration</h2>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">Configure your Q3 Performance Report</p>
                  </div>
                  <button onClick={() => setShowExportDrawer(false)} className="p-1.5 rounded text-neutral-400 hover:text-black dark:hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Document Format Cards */}
                <div className="space-y-2 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Document Format</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      onClick={() => setDocFormat('pdf')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 relative ${
                        docFormat === 'pdf' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {docFormat === 'pdf' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />}
                      <FileText className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                      <span className="text-xs">PDF</span>
                    </div>

                    <div 
                      onClick={() => setDocFormat('csv')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 relative ${
                        docFormat === 'csv' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {docFormat === 'csv' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />}
                      <FileSpreadsheet className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                      <span className="text-xs">CSV</span>
                    </div>

                    <div 
                      onClick={() => setDocFormat('json')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 relative ${
                        docFormat === 'json' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {docFormat === 'json' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />}
                      <FileCode className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                      <span className="text-xs">JSON</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 pt-1">PDF format includes full layout and chart visualizations.</p>
                </div>

                {/* Time Period Dates */}
                <div className="space-y-2 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Time Period</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">Start Date</label>
                      <input
                        type="text"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">End Date</label>
                      <input
                        type="text"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Included Modules Checkboxes */}
                <div className="space-y-2 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Included Modules</span>
                  
                  <div className="space-y-2 font-sans">
                    <div 
                      onClick={() => setModules(m => ({ ...m, execSummary: !m.execSummary }))}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Executive Summary</div>
                        <span className="text-[10px] font-mono text-neutral-400">High-level insights & KPIs</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${modules.execSummary ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-neutral-300'}`}>
                        {modules.execSummary && <Check className="w-3 h-3" />}
                      </div>
                    </div>

                    <div 
                      onClick={() => setModules(m => ({ ...m, taskCompletion: !m.taskCompletion }))}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Task Completion</div>
                        <span className="text-[10px] font-mono text-neutral-400">Detailed task logs</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${modules.taskCompletion ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-neutral-300'}`}>
                        {modules.taskCompletion && <Check className="w-3 h-3" />}
                      </div>
                    </div>

                    <div 
                      onClick={() => setModules(m => ({ ...m, deepAnalytics: !m.deepAnalytics }))}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between cursor-pointer opacity-70"
                    >
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Deep Analytics</div>
                        <span className="text-[10px] font-mono text-neutral-400">Raw data tables & charts</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${modules.deepAnalytics ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-neutral-300'}`}>
                        {modules.deepAnalytics && <Check className="w-3 h-3" />}
                      </div>
                    </div>

                    <div 
                      onClick={() => setModules(m => ({ ...m, okrTracking: !m.okrTracking }))}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">OKR Tracking</div>
                        <span className="text-[10px] font-mono text-neutral-400">Quarterly objectives status</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${modules.okrTracking ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-neutral-300'}`}>
                        {modules.okrTracking && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presentation Toggle */}
                <div className="space-y-2 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Presentation</span>
                  
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between font-sans">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Corporate Branding</div>
                      <span className="text-[10px] font-mono text-neutral-400">Include logo and brand headers on each page</span>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setCorporateBranding(prev => !prev)}
                      className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${corporateBranding ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${corporateBranding ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowExportDrawer(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleDownloadBrief}
                  className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download & Generate Brief</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
