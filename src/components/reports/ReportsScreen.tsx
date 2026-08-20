import React, { useState } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Search, Download, Share2, FileText, 
  CheckCircle2, AlertTriangle, X, ChevronDown, 
  Calendar, Pencil, MoreVertical, FileCode, FileSpreadsheet, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const DAILY_THROUGHPUT_DATA = [
  { day: 'Mon', throughput: 40 },
  { day: 'Tue', throughput: 65 },
  { day: 'Wed', throughput: 50 },
  { day: 'Thu', throughput: 90 },
  { day: 'Fri', throughput: 80 },
  { day: 'Sat', throughput: 110 },
  { day: 'Sun', throughput: 95 }
];

export const ReportsScreen: React.FC = () => {
  // Screen state: 'library' | 'brief'
  const [viewMode, setViewMode] = useState<'library' | 'brief'>('library');
  const [showExportDrawer, setShowExportDrawer] = useState(false);

  // Library Filter state
  const [searchTitle, setSearchTitle] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('All');

  // Export Drawer State
  const [docFormat, setDocFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [startDate, setStartDate] = useState('2023-07-01');
  const [endDate, setEndDate] = useState('2023-09-30');
  const [modules, setModules] = useState({
    execSummary: true,
    taskCompletion: true,
    deepAnalytics: false,
    okrTracking: true
  });
  const [corporateBranding, setCorporateBranding] = useState(true);

  const REPORTS = [
    { id: 'rep-1', title: 'Weekly Performance Brief - Week 42', type: 'Weekly', date: '2023-10-24 08:30', status: 'Ready' },
    { id: 'rep-2', title: 'Monthly Strategic Review - Q3 Close', type: 'Monthly', date: '2023-10-01 14:15', status: 'Draft' },
    { id: 'rep-3', title: 'Weekly Performance Brief - Week 41', type: 'Weekly', date: '2023-10-17 09:00', status: 'Ready' },
    { id: 'rep-4', title: 'Weekly Performance Brief - Week 40', type: 'Weekly', date: '2023-10-10 08:45', status: 'Ready' },
    { id: 'rep-5', title: 'Monthly Strategic Review - August', type: 'Monthly', date: '2023-09-02 11:20', status: 'Ready' }
  ];

  const filteredReports = REPORTS.filter(r => {
    if (searchTitle && !r.title.toLowerCase().includes(searchTitle.toLowerCase())) return false;
    if (reportTypeFilter !== 'All' && r.type !== reportTypeFilter) return false;
    return true;
  });

  const handleDownloadBrief = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      { metric: 'Deployed v2.4 Core Refactor', category: 'Accomplishments', value: 'Merged to Master (0 Incidents)', period: 'Week 42' },
      { metric: 'QA Staging Instability', category: 'Blockers & Risks', value: 'High Severity', period: 'Ongoing' }
    ];

    const fileName = `Pulse_Performance_Report_${startDate}_${endDate}`;
    if (docFormat === 'pdf') {
      exportToPDF(fileName, 'Weekly Executive Performance Brief', data, columns);
    } else if (docFormat === 'csv') {
      exportToCSV(fileName, data, columns);
    } else {
      exportToExcel(fileName, data, columns);
    }

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

            <button
              onClick={() => setShowExportDrawer(true)}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate New Report
            </button>
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
                  {filteredReports.map(rep => (
                    <tr key={rep.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 cursor-pointer" onClick={() => setViewMode('brief')}>
                      <td className="py-3.5 font-semibold text-neutral-900 dark:text-neutral-100">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-neutral-400" />
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
                            : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                        }`}>
                          {rep.status === 'Ready' ? '• Ready' : '○ Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {rep.status === 'Ready' ? (
                            <button onClick={() => setShowExportDrawer(true)} className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white">
                              <Download className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => setViewMode('brief')} className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
              <span>Showing 1 to 5 of 42 entries</span>
              <div className="flex items-center gap-1 font-bold">
                <button className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400">&lt;</button>
                <button className="px-2.5 py-1 rounded bg-black text-white dark:bg-white dark:text-black">1</button>
                <button className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">2</button>
                <button className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">3</button>
                <span>...</span>
                <button className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">9</button>
                <button className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">&gt;</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERATED BRIEF VIEW matching Screenshot 2 */}
      {viewMode === 'brief' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <button onClick={() => setViewMode('library')} className="text-xs text-neutral-500 hover:text-black dark:hover:text-white block mb-1">
                ← Back to Report Library
              </button>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                Weekly Performance Brief
              </h1>
              <p className="text-xs text-neutral-500 font-mono">Week 42 • Oct 16 - Oct 22, 2023</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => alert('Share link copied to clipboard.')} className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-neutral-500" /> Share
              </button>
              <button onClick={() => setShowExportDrawer(true)} className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
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
                Overall velocity remained stable through Week 42 despite unexpected infrastructure downtime mid-week. Core engineering teams successfully deployed the v2.4 refactor, resulting in a 14% reduction in API latency. Focus remains on stabilizing the CI/CD pipeline ahead of the Q4 feature freeze. Resource allocation needs minor adjustment to address mounting QA bottlenecks.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Effort</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">842h</div>
                  <span className="text-[10px] text-neutral-500">📈 +5.2% vs W41</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Story Points</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">112</div>
                  <span className="text-[10px] text-neutral-400">→ 0.0% vs W41</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Bug Triage</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">24</div>
                  <span className="text-[10px] text-neutral-500">📉 -12% vs W41</span>
                </div>
              </div>
            </div>

            {/* Next Week Focus Black Card */}
            <div className="p-6 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md space-y-4 font-mono">
              <h3 className="font-bold text-base flex items-center gap-2 font-sans">
                🎯 Next Week Focus
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-black shrink-0" />
                    <span>Finalize Auth Migration</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 dark:text-neutral-700 pl-5 leading-relaxed font-sans">
                    Complete transition to new OAuth2 provider before Friday cut-off.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-black shrink-0" />
                    <span>QA Pipeline Refactor</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 dark:text-neutral-700 pl-5 leading-relaxed font-sans">
                    Address the latency issues in e2e testing suite.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-black shrink-0" />
                    <span>Q4 Planning Sync</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 dark:text-neutral-700 pl-5 leading-relaxed font-sans">
                    Cross-functional review of Q4 OKRs and resource allocation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Velocity & Throughput Chart matching Screenshot 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Velocity & Throughput</h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-black dark:bg-white" /> Throughput</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-neutral-300" /> Capacity</span>
              </div>
            </div>

            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DAILY_THROUGHPUT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.3} />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} />
                  <YAxis domain={[0, 150]} stroke="#9CA3AF" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                  <Bar dataKey="throughput" fill="#14161F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section: Key Accomplishments & Blockers matching Screenshot 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
            {/* Key Accomplishments Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" /> Key Accomplishments
              </h3>

              <div className="space-y-3 font-sans">
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" /> Deployed v2.4 Core Refactor
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Successfully merged to master with zero rollback incidents. API latency reduced by 14%.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" /> Closed 18 Critical Legacy Bugs
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    QA team validated fixes across staging. Technical debt backlog reduced by 5%.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" /> Design System Audit Completed
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Documented 42 inconsistencies and created tracking epics for resolution in Q4.
                  </p>
                </div>
              </div>
            </div>

            {/* Blockers & Risks Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-neutral-800 dark:text-neutral-200" /> Blockers & Risks
              </h3>

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
                    <tr>
                      <td className="py-3">•</td>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">QA Staging Environment Instability</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">HIGH</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3">•</td>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Delay in 3rd Party API Documentation</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">MED</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3">•</td>
                      <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">Resource Constraint on Mobile Team</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">LOW</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                  onClick={handleDownloadBrief}
                  className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Brief
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
