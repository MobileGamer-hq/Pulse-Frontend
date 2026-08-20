import React, { useState } from 'react';
import { UserAvatar } from '../common/UserAvatar';
import { ExportDropdown } from '../common/ExportDropdown';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Calendar, Download, RefreshCw, CheckCircle2, 
  TrendingUp, Clock, AlertTriangle, Filter, MoreHorizontal 
} from 'lucide-react';

// Data Mock Sets
const VELOCITY_30DAY_DATA = [
  { day: 1, points: 18 },
  { day: 5, points: 26 },
  { day: 10, points: 22 },
  { day: 15, points: 34 },
  { day: 20, points: 30 },
  { day: 23, points: 42 },
  { day: 26, points: 38 },
  { day: 28, points: 44 },
  { day: 30, points: 48 }
];

const ENERGY_VS_EXECUTION_DATA = [
  { energy: 2, hours: 1.2 },
  { energy: 3, hours: 1.8 },
  { energy: 4, hours: 2.5 },
  { energy: 5, hours: 3.2 },
  { energy: 6, hours: 4.1 },
  { energy: 7, hours: 3.9 },
  { energy: 8, hours: 4.8 },
  { energy: 9, hours: 5.5 },
  { energy: 10, hours: 5.9 }
];

const TEAM_VELOCITY_SPRINTS = [
  { sprint: 'Sprint 42', points: 62, active: false },
  { sprint: 'Sprint 43', points: 78, active: false },
  { sprint: 'Sprint 44', points: 68, active: false },
  { sprint: 'Sprint 45', points: 90, active: false },
  { sprint: 'Sprint 46', points: 72, active: false },
  { sprint: 'Sprint 47', points: 94, active: true }
];

const COMPLETION_DONUT_DATA = [
  { name: 'Completed', value: 211 },
  { name: 'Remaining', value: 29 }
];
const DONUT_COLORS = ['#14161F', '#E2E4E9'];

const BURNDOWN_TRAJECTORY_DATA = [
  { day: 'Day 1', ideal: 120, actual: 120 },
  { day: 'Day 2', ideal: 110, actual: 118 },
  { day: 'Day 3', ideal: 100, actual: 116 },
  { day: 'Day 4', ideal: 90, actual: 98 },
  { day: 'Day 5', ideal: 80, actual: 92 },
  { day: 'Day 6', ideal: 70, actual: 76 },
  { day: 'Day 7', ideal: 60, actual: 76 },
  { day: 'Day 8', ideal: 50, actual: 72 },
  { day: 'Day 9', ideal: 40, actual: 48 },
  { day: 'Day 10', ideal: 30, actual: 44 },
  { day: 'Day 11', ideal: 20, actual: 38 },
  { day: 'Day 12', ideal: 10, actual: null },
  { day: 'Day 13', ideal: 5, actual: null },
  { day: 'Day 14', ideal: 0, actual: null }
];

const VELOCITY_PLANNED_VS_ACTUAL = [
  { sprint: 'Sprint 37', planned: 110, actual: 105 },
  { sprint: 'Sprint 38', planned: 115, actual: 118 },
  { sprint: 'Sprint 39', planned: 104, actual: 96 },
  { sprint: 'Sprint 40', planned: 120, actual: 116 },
  { sprint: 'Sprint 41', planned: 118, actual: 119 }
];

const BLOCKED_TIME_TREND_7D = [
  { day: 'MON', hours: 42, active: false },
  { day: 'TUE', hours: 54, active: false },
  { day: 'WED', hours: 28, active: false },
  { day: 'THU', hours: 70, active: false },
  { day: 'FRI', hours: 48, active: false },
  { day: 'SAT', hours: 92, active: true },
  { day: 'SUN', hours: 62, active: false }
];

export const AnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'insights' | 'habits' | 'team' | 'bottlenecks'>('insights');
  const [dateRange] = useState('Last 30 Days');

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top 4-Tab View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 font-mono overflow-x-auto max-w-full scrollbar-none pb-1">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs whitespace-nowrap ${
              activeTab === 'insights' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Performance Insights
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs whitespace-nowrap ${
              activeTab === 'habits' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Consistency & Habits
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs whitespace-nowrap ${
              activeTab === 'team' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Team & Sprint Details
          </button>
          <button
            onClick={() => setActiveTab('bottlenecks')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs whitespace-nowrap ${
              activeTab === 'bottlenecks' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Bottleneck Analysis
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <ExportDropdown
            filename="pulse_analytics_export"
            title="Pulse Performance Analytics Report"
            data={[
              { Metric: '30-Day Output Velocity', Value: '48 pts/sprint', Change: '+14%' },
              { Metric: 'Average Energy Index', Value: '4.2 / 5.0', Change: '+0.4' },
              { Metric: 'Triage Turnaround Time', Value: '1.4 Days', Change: '-22%' },
              { Metric: 'EOD Check-in Consistency', Value: '94%', Change: '+6%' }
            ]}
          />
        </div>
      </div>

      {/* VIEW MODE 1: PERFORMANCE INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Performance Insights</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Historical cadence analysis.</p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button onClick={handleExport} className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold">
                Export Report
              </button>
              <button 
                onClick={() => alert('Analytics refreshed.')}
                className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                <span>Velocity</span>
                <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">42</span>
                <span className="text-xs text-neutral-500">pts/sprint</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                <span>Completion Rate</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">94.2</span>
                <span className="text-xs text-neutral-500">%</span>
              </div>
              <span className="text-[10px] text-neutral-400 block">Steady trend</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                <span>Avg. Daily Focus</span>
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">5.8</span>
                <span className="text-xs text-neutral-500">hrs</span>
              </div>
              <span className="text-[10px] text-neutral-500 block">↓ -0.2h vs avg</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                <span>Consistency Score</span>
                <span className="text-xs text-neutral-400">☆</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">88</span>
                <span className="text-xs text-neutral-400">/ 100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mt-1">
                <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center font-mono">
                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">30-Day Velocity Trend</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                  Points
                </span>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={VELOCITY_30DAY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.4} />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} />
                    <YAxis domain={[0, 60]} stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                    <Line type="monotone" dataKey="points" stroke="#000" strokeWidth={2.5} dot={{ r: 3.5, fill: '#000' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">EOD Consistency</h3>
                <p className="text-[11px] text-neutral-400">Pulse frequency (Last 3 Mo)</p>
              </div>

              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-12 gap-1.5">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const opacities = [0.1, 0.3, 0.6, 0.9, 0.2, 0.8, 1.0, 0.4, 0.7, 0.15, 0.85, 0.95];
                    const op = opacities[idx % opacities.length];
                    return (
                      <div
                        key={idx}
                        className="w-full aspect-square rounded-sm bg-neutral-900 dark:bg-white transition-opacity"
                        style={{ opacity: op }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-4">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-xs bg-neutral-900 dark:bg-white opacity-20" />
                    <div className="w-2.5 h-2.5 rounded-xs bg-neutral-900 dark:bg-white opacity-40" />
                    <div className="w-2.5 h-2.5 rounded-xs bg-neutral-900 dark:bg-white opacity-70" />
                    <div className="w-2.5 h-2.5 rounded-xs bg-neutral-900 dark:bg-white opacity-100" />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CONSISTENCY & HABITS */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">INDIVIDUAL ANALYTICS • Q3 2023</span>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5">Consistency & Habits</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Deep dive into Daily Pulse data, examining correlation between energy score and execution.</p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {dateRange}
              </button>
              <button onClick={handleExport} className="px-3.5 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Energy vs. Execution</h3>
                  <p className="text-[11px] text-neutral-400 font-mono">Correlation between morning energy score (1-10) and deep work hours completed.</p>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  ⚡ Strong Positive Correlation (r=0.78)
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.4} />
                    <XAxis type="number" dataKey="energy" name="Energy Score" domain={[1, 10]} stroke="#9CA3AF" fontSize={10} />
                    <YAxis type="number" dataKey="hours" name="Deep Work (hrs)" domain={[0, 6]} stroke="#9CA3AF" fontSize={10} />
                    <ZAxis type="number" range={[50, 50]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                    <Scatter name="Days" data={ENERGY_VS_EXECUTION_DATA} fill="#000" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2 font-mono">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Consistency Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">84%</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
                    ↑ 3%
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-neutral-600" /> Top Blockers
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">Context Switching</span>
                      <span className="text-neutral-400">12 occurrences</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">Unclear Requirements</span>
                      <span className="text-neutral-400">8 occurrences</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-neutral-500 rounded-full" style={{ width: '55%' }} />
                    </div>
                  </div>
                </div>

                <button className="w-full py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  View Full Blocker Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TEAM & SPRINT TRAJECTORY */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Team Analytics</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">High-level performance metrics and sprint tracking for engineering squads.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Team Velocity</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                  Last 6 Sprints
                </span>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TEAM_VELOCITY_SPRINTS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.3} />
                    <XAxis dataKey="sprint" stroke="#9CA3AF" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                    <Bar dataKey="points">
                      {TEAM_VELOCITY_SPRINTS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.active ? '#000000' : '#D1D5DB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans block">Completion Rate</span>
              
              <div className="relative h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={COMPLETION_DONUT_DATA}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {COMPLETION_DONUT_DATA.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute text-center">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 block leading-tight">88%</span>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Aggregate</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3 text-[11px]">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Committed</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">240 pts</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">Completed</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">211 pts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Active Sprints</span>
                <MoreHorizontal className="w-4 h-4 text-neutral-400 cursor-pointer" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Frontend Core - Sprint 47</span>
                    <span>75%</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Ends in 3 days</span>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Data Pipeline - Sprint 12</span>
                    <span>92%</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Ends tomorrow</span>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>API Gateway V2</span>
                    <span>30%</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">Ends in 7 days</span>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-neutral-500 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button className="text-[11px] font-semibold text-neutral-500 hover:text-black dark:hover:text-white">
                  View All Sprints
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-start gap-3">
                <UserAvatar name="Sarah Jenkins" size="lg" />
                <div className="space-y-1 font-sans">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Sarah Jenkins</h4>
                  <span className="text-[9px] font-mono uppercase text-neutral-400 block">LEAD ENGINEER, PLATFORM</span>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 italic leading-relaxed">
                    "Team is tracking well against Q3 OKRs. Minor friction identified in CI/CD pipeline deployments."
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-neutral-700 dark:text-neutral-300" /> Active Bottlenecks
                </span>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                      <span>QA Review Queue</span>
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">14 Tickets</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-neutral-400" />
                      <span>Design Sign-off</span>
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">5 Tickets</span>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('bottlenecks')}
                  className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[11px] font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200"
                >
                  Analyze Flow
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
            <div className="flex justify-between items-center font-mono">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase">Analytics &gt; Sprint Details</span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                  Sprint 42: Backend Overhaul
                </h2>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">Detailed burndown analysis and velocity metrics for the current cycle.</p>
              </div>

              <button className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
              <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Burndown Trajectory</span>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-neutral-400" /> IDEAL</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white" /> ACTUAL</span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={BURNDOWN_TRAJECTORY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.4} />
                      <XAxis dataKey="day" stroke="#9CA3AF" fontSize={9} />
                      <YAxis domain={[0, 130]} stroke="#9CA3AF" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                      <Line type="monotone" dataKey="ideal" stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="actual" stroke="#000" strokeWidth={2.5} dot={{ r: 3.5, fill: '#000' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 font-mono">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans block pb-1 border-b border-neutral-100 dark:border-neutral-800">
                  Sprint Meta
                </span>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Status</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Start Date</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">Oct 12, 2023</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">End Date</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">Oct 26, 2023</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Total Points</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">124 pt</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Completed</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">86 pt</span>
                  </div>

                  <div className="flex justify-between items-center text-red-600 font-bold">
                    <span>Spillover ⚠️</span>
                    <span>12 pt</span>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span>Completion</span>
                      <span>69%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '69%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Velocity History (Last 5 Sprints)</span>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-neutral-300" /> PLANNED</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-black dark:bg-white" /> ACTUAL</span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={VELOCITY_PLANNED_VS_ACTUAL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.3} />
                    <XAxis dataKey="sprint" stroke="#9CA3AF" fontSize={10} />
                    <YAxis domain={[0, 140]} stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                    <Bar dataKey="planned" fill="#D1D5DB" />
                    <Bar dataKey="actual" fill="#14161F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: BOTTLENECK ANALYSIS */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Bottleneck Analysis</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Systemic friction point identification across active workflows.</p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
              <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Download className="w-3.5 h-3.5" /> Export Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 font-sans">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Critical Blockers
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 border border-red-300 font-bold">
                  Action Required
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                    <tr>
                      <th className="pb-2">Task ID / Description</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Duration</th>
                      <th className="pb-2 text-right">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="py-3">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block">PRJ-892: API Gateway Integration</span>
                        <span className="text-[11px] text-neutral-500 font-sans">Blocked on third-party security audit clearance.</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          • Engineering
                        </span>
                      </td>
                      <td className="py-3 font-bold text-red-600">14 Days</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-[10px]">
                          JD J. Doe
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block">DSN-104: Design System V3 Migration</span>
                        <span className="text-[11px] text-neutral-500 font-sans">Pending approval from core product team.</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          • Design
                        </span>
                      </td>
                      <td className="py-3 font-bold text-neutral-900 dark:text-neutral-100">8 Days</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-[10px]">
                          SM S. Miller
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block">OPS-44: Q3 Compliance Documentation</span>
                        <span className="text-[11px] text-neutral-500 font-sans">Legal review delayed due to staffing.</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          • Operations
                        </span>
                      </td>
                      <td className="py-3 font-bold text-neutral-900 dark:text-neutral-100">5 Days</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-[10px]">
                          AK A. Kim
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6 font-mono">
              <div className="p-5 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider block">Total Blocked Time</span>
                <div className="text-3xl font-bold tracking-tight">342 hrs</div>
                <div className="flex items-center gap-1 text-[11px] text-neutral-300 dark:text-neutral-700 pt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  <span>+12% from last week</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Friction Map</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Engineering</span>
                      <span>72%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-neutral-600">
                      <span>Design</span>
                      <span>40%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-neutral-500 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Blocked Time Trend</span>
              <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
                <button className="px-2.5 py-1 rounded bg-black text-white dark:bg-white dark:text-black font-bold">7D</button>
                <button className="px-2.5 py-1 rounded text-neutral-500 font-semibold">30D</button>
                <button className="px-2.5 py-1 rounded text-neutral-500 font-semibold">90D</button>
              </div>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BLOCKED_TIME_TREND_7D}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" opacity={0.3} />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} unit="h" />
                  <Tooltip contentStyle={{ backgroundColor: '#14161F', borderRadius: '8px', color: '#FFF' }} />
                  <Bar dataKey="hours">
                    {BLOCKED_TIME_TREND_7D.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.active ? '#000000' : '#E5E7EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
