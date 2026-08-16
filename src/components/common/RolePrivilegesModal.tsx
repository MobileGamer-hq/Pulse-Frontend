import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Check, Info, Users, Briefcase, Target, Tag, FileText, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Role } from '../../types';

interface RolePrivilegeInfo {
  role: Role;
  title: string;
  badgeColor: string;
  description: string;
  userExample: string;
  permissions: {
    createProjects: boolean;
    createTasks: boolean;
    createGoals: boolean;
    createTags: boolean;
    manageUsers: boolean;
    viewReports: boolean;
    systemSettings: boolean;
  };
  keyResponsibilities: string[];
}

const ROLE_DETAILS: RolePrivilegeInfo[] = [
  {
    role: 'Admin',
    title: 'System Administrator & CTO',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300',
    description: 'Full organizational authority over workspace configurations, integrations, team provisioning, and RBAC roles.',
    userExample: 'David Kim (Chief Technology Officer)',
    permissions: {
      createProjects: true,
      createTasks: true,
      createGoals: true,
      createTags: true,
      manageUsers: true,
      viewReports: true,
      systemSettings: true,
    },
    keyResponsibilities: [
      'Manage global organization settings, API tokens, and SSO',
      'Create and archive projects, teams, tags, and users',
      'Override permissions and edit/delete any workspace item',
      'Access full system activity audit logs and security briefs'
    ]
  },
  {
    role: 'Executive',
    title: 'Executive Leadership (C-Suite / VP)',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300',
    description: 'Strategic oversight role focused on high-level enterprise OKRs, portfolio reporting, and risk mitigation.',
    userExample: 'Sarah Jenkins (VP of Product)',
    permissions: {
      createProjects: true,
      createTasks: false,
      createGoals: true,
      createTags: false,
      manageUsers: false,
      viewReports: true,
      systemSettings: false,
    },
    keyResponsibilities: [
      'Set and monitor company-wide strategic Goals and Key Results',
      'Generate monthly & weekly executive operational briefs',
      'Monitor cross-team velocity and strategic blocker escalations',
      'View company-wide workload metrics without changing lower-level tasks'
    ]
  },
  {
    role: 'Manager',
    title: 'Project & Engineering Manager',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300',
    description: 'Operational manager leading project delivery, resource allocation, task dispatching, and daily blocker resolution.',
    userExample: 'Amaka Okafor (Engineering Manager)',
    permissions: {
      createProjects: true,
      createTasks: true,
      createGoals: true,
      createTags: true,
      manageUsers: true,
      viewReports: true,
      systemSettings: false,
    },
    keyResponsibilities: [
      'Create and manage projects, tasks, and sprint timelines',
      'Assign team members and balance weekly workload capacity',
      'Create organizational tags and link tasks to strategic goals',
      'Review daily EOD check-ins and unblock team bottlenecks'
    ]
  },
  {
    role: 'HR',
    title: 'People & Culture Operations',
    badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300',
    description: 'Focuses on team structure, employee onboarding, capacity planning, and organizational health.',
    userExample: 'Grace Vance (People & Culture Director)',
    permissions: {
      createProjects: false,
      createTasks: false,
      createGoals: false,
      createTags: false,
      manageUsers: true,
      viewReports: true,
      systemSettings: false,
    },
    keyResponsibilities: [
      'Invite new team members and assign initial roles & teams',
      'Track individual capacity hours per week and team sentiment',
      'Manage team rosters and department organizational structure',
      'Access team health summaries and sentiment analytics'
    ]
  },
  {
    role: 'TeamLead',
    title: 'Team Lead & Sprint Captain',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300',
    description: 'Hands-on sprint leader guiding day-to-day execution, task assignments, and technical reviews.',
    userExample: 'Elena Rostova (Lead Product Designer)',
    permissions: {
      createProjects: false,
      createTasks: true,
      createGoals: false,
      createTags: true,
      manageUsers: false,
      viewReports: true,
      systemSettings: false,
    },
    keyResponsibilities: [
      'Create tasks and assign them to team members',
      'Break down tasks into subtasks and set priority levels',
      'Tag tasks and verify completion criteria',
      'Submit daily EOD check-ins and highlight team blockers'
    ]
  },
  {
    role: 'Member',
    title: 'Standard Team Member / Engineer / Designer',
    badgeColor: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-300',
    description: 'Core contributor focusing on task execution, subtask updates, and daily status logging.',
    userExample: 'Alex Chen (Senior Backend Engineer)',
    permissions: {
      createProjects: false,
      createTasks: true,
      createGoals: false,
      createTags: false,
      manageUsers: false,
      viewReports: false,
      systemSettings: false,
    },
    keyResponsibilities: [
      'Create tasks within assigned projects',
      'Update status of assigned tasks (To Do -> In Progress -> Done)',
      'Toggle subtask check items and add comments/discussion',
      'Submit mandatory daily EOD check-ins with energy index'
    ]
  },
  {
    role: 'Contractor',
    title: 'External Contractor / Specialist',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300',
    description: 'External partner with scoped access restricted strictly to assigned tasks and daily check-ins.',
    userExample: 'Jordan Smith (Growth Specialist Contractor)',
    permissions: {
      createProjects: false,
      createTasks: false,
      createGoals: false,
      createTags: false,
      manageUsers: false,
      viewReports: false,
      systemSettings: false,
    },
    keyResponsibilities: [
      'View and update explicitly assigned tasks only',
      'Submit daily EOD check-ins for logged hours',
      'Restricted from viewing company goals, executive reports, or admin settings',
      'Restricted from creating top-level projects or organization tags'
    ]
  }
];

interface RolePrivilegesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolePrivilegesModal: React.FC<RolePrivilegesModalProps> = ({ isOpen, onClose }) => {
  const { activeRole, setActiveRole } = useApp();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-xs"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  User Role Privileges &amp; Access Matrix
                </h2>
                <p className="text-xs text-neutral-500 font-mono">
                  Compare permissions across all 7 user access levels in Pulse.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Active Role Switcher Header Notice */}
          <div className="px-6 py-3 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Current Simulation Privilege:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                {activeRole}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">
              Click any role card below to test the app as that user level!
            </span>
          </div>

          {/* Body Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Feature Permission Comparison Matrix Table */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" /> Privilege Overview Matrix
              </h3>
              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="p-2.5">Feature Privilege</th>
                      <th className="p-2.5 text-center">Admin</th>
                      <th className="p-2.5 text-center">Executive</th>
                      <th className="p-2.5 text-center">Manager</th>
                      <th className="p-2.5 text-center">HR</th>
                      <th className="p-2.5 text-center">TeamLead</th>
                      <th className="p-2.5 text-center">Member</th>
                      <th className="p-2.5 text-center">Contractor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-900 dark:text-neutral-100">
                    <tr>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-neutral-400" /> Create Projects</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-neutral-400" /> Create Tasks</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-neutral-400" /> Manage Goals &amp; OKRs</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-neutral-400" /> Create System Tags</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-neutral-400" /> Manage Team Members</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-neutral-400" /> Admin &amp; Security Controls</td>
                      <td className="p-2.5 text-center text-green-600 font-bold">✓</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                      <td className="p-2.5 text-center text-neutral-300 dark:text-neutral-700">✕</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Cards for Each Role */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Detailed Role Breakdown &amp; Responsibilities
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLE_DETAILS.map(r => {
                  const isActive = activeRole === r.role;
                  return (
                    <div
                      key={r.role}
                      onClick={() => setActiveRole(r.role)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-lg ring-2 ring-neutral-400'
                          : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${r.badgeColor}`}>
                            {r.role}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-green-500 text-white text-[9px] font-bold uppercase font-mono">
                              Active Mode
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono opacity-60">Click to switch</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{r.title}</h4>
                        <p className={`text-xs mt-1 ${isActive ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
                          {r.description}
                        </p>
                      </div>

                      <div className={`p-2 rounded-lg text-[11px] font-mono ${
                        isActive ? 'bg-neutral-800 dark:bg-neutral-100 text-neutral-200 dark:text-neutral-800' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
                      }`}>
                        <strong>Mock User:</strong> {r.userExample}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">
                          Key Capabilities:
                        </span>
                        <ul className="space-y-1 text-[11px]">
                          {r.keyResponsibilities.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-lg hover:opacity-90 transition-opacity text-xs"
            >
              Close Privileges Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
