import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Code, Compass, TrendingUp, LayoutGrid, Users, Check, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PulseLogo } from '../common/PulseLogo';
import { organizationService } from '../../services/organizationService';
import type { WorkflowTemplate } from '../../types';

export const CreateOrgScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, addOrg, addTeam } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [companySize, setCompanySize] = useState('11 - 50');

  const [teamName, setTeamName] = useState('Core Team');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate>('SoftwareSprint');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingSlug, setValidatingSlug] = useState(false);

  const handleStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!orgName.trim()) {
      setError('Please enter your organization name.');
      return;
    }
    const slug = orgSlug.trim() ? orgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : orgName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      setError('Please enter a valid workspace slug.');
      return;
    }

    setValidatingSlug(true);
    try {
      const check = await organizationService.checkSlugAvailable(slug);
      if (!check.available) {
        setError(check.reason || `The workspace slug "${slug}" is already taken. Please choose another.`);
        setValidatingSlug(false);
        return;
      }
      setOrgSlug(slug);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error checking workspace slug.');
    } finally {
      setValidatingSlug(false);
    }
  };


  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError('Please enter your primary team name.');
      return;
    }
    setStep(3);
  };

  const handleLaunchOrg = async () => {
    setError(null);
    setLoading(true);

    const slug = orgSlug || orgName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    try {
      // 1. Create Organization in Supabase
      await addOrg({
        name: orgName.trim(),
        slug: slug,
        industry: industry,
        companySize: companySize,
      });

      // 2. Create Initial Primary Team
      if (teamName.trim()) {
        try {
          await addTeam({
            name: teamName.trim(),
            leadId: currentUser.id,
            leadName: currentUser.name,
            memberIds: [currentUser.id],
            workflowTemplate: selectedTemplate || 'SoftwareSprint',
          }, slug);
        } catch (teamErr) {
          console.warn('[CreateOrgScreen] Primary team creation warning:', teamErr);
        }
      }

      setLoading(false);
      navigate(`/${slug}/dashboard`);
    } catch (err: any) {
      console.error('[CreateOrgScreen] Organization creation error:', err);
      setError(err.message || 'Failed to create organization. Please try again.');
      setLoading(false);
    }
  };

  const WORKFLOW_TEMPLATES: { id: WorkflowTemplate; title: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'SoftwareSprint',
      title: 'Software Development',
      desc: 'Optimized for sprints, issue tracking, and code review cycles.',
      icon: Code
    },
    {
      id: 'ClientOnboarding',
      title: 'Agency & Client Work',
      desc: 'Focuses on deliverables, approvals, and time tracking.',
      icon: Compass
    },
    {
      id: 'MarketingCampaign',
      title: 'Sales & Pipeline',
      desc: 'Structured for lead progression, CRM integration, and forecasting.',
      icon: TrendingUp
    },
    {
      id: 'GeneralOps',
      title: 'General Operations',
      desc: 'A flexible, lightweight setup for standard task management.',
      icon: LayoutGrid
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] flex flex-col items-center py-10 px-4 font-sans text-neutral-900 dark:text-neutral-100">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/select-org')}
          className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
        >
          ← Back to Organizations
        </button>

        <div className="flex items-center gap-2">
          <PulseLogo size="sm" />
          <div>
            <span className="font-bold text-lg tracking-tight block leading-tight">Pulse</span>
            <span className="text-[10px] text-neutral-400 font-mono block">by Epicordia</span>
          </div>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          User: <span className="font-bold text-neutral-800 dark:text-neutral-200">{currentUser.name || 'Admin'}</span>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              1
            </span>
            <span className="font-semibold">Org Profile</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              2
            </span>
            <span className="font-semibold">Team &amp; Workflow</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              3
            </span>
            <span className="font-semibold">Launch</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-2xl mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Organization Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 1 of 3</span>
            <h2 className="text-xl font-bold tracking-tight">Organization Registration</h2>
            <p className="text-xs text-neutral-500 mt-1">Configure your company identity and workspace URL route.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => {
                    setOrgName(e.target.value);
                    setError(null);
                    setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }}
                  placeholder="e.g. Epicordia Technologies"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Workspace URL Route (Slug) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden focus-within:border-neutral-900 dark:focus-within:border-white transition-colors">
                <span className="pl-3.5 pr-0.5 font-mono text-neutral-400 text-xs select-none">
                  pulse.epicordia.com/
                </span>
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="epicordia"
                  className="flex-1 py-2.5 pr-3.5 pl-0.5 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                Members will access this workspace at pulse.epicordia.com/{orgSlug || 'workspace-slug'}
              </span>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Industry Category
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
              >
                <option value="Technology & Software">Software &amp; Technology</option>
                <option value="Marketing & Agency">Marketing &amp; Digital Agency</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare & Life Sciences">Healthcare &amp; Life Sciences</option>
              </select>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Company Size
              </label>
              <div className="grid grid-cols-4 gap-3 pt-1">
                {['1 - 50', '51 - 200', '201 - 1000', '1000+'].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setCompanySize(sz)}
                    className={`py-2.5 px-3 rounded-xl border font-mono text-xs font-semibold text-center transition-all cursor-pointer ${
                      companySize === sz
                        ? 'border-black bg-neutral-50 dark:bg-neutral-800 dark:border-white font-bold'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button
              type="submit"
              disabled={validatingSlug}
              className="py-3 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {validatingSlug ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Availability...</span>
                </>
              ) : (
                <>
                  <span>Continue to Team Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      )}

      {/* Step 2: Team & Template */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 2 of 3</span>
            <h2 className="text-xl font-bold tracking-tight">Team &amp; Workflow Template</h2>
            <p className="text-xs text-neutral-500 mt-1">Set up your initial working group and choose how tasks are structured.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Primary Team Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={e => { setTeamName(e.target.value); setError(null); }}
                  placeholder="e.g. Engineering Ops, Product Team"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase">
                Workflow Template
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WORKFLOW_TEMPLATES.map(tmpl => {
                  const Icon = tmpl.icon;
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 relative ${
                        isSelected
                          ? 'border-black bg-neutral-50/80 dark:bg-neutral-800/80 dark:border-white ring-1 ring-black dark:ring-white'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                          <Icon className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full border border-black dark:border-white flex items-center justify-center bg-black dark:bg-white text-white dark:text-black">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{tmpl.title}</h4>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-snug">{tmpl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white font-semibold cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Review &amp; Finalize</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Launch */}
      {step === 3 && (
        <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6 text-center">
          <PulseLogo size="xl" className="mx-auto shadow-md" />
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 3 of 3</span>
            <h2 className="text-2xl font-black tracking-tight">Launch Organization Workspace</h2>
            <p className="text-xs text-neutral-500 mt-1">Your administrator privileges will be automatically assigned upon creation.</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 text-left text-xs font-mono space-y-2 border border-neutral-200 dark:border-neutral-700">
            <div>• Organization: <span className="font-bold text-neutral-900 dark:text-neutral-100">{orgName} (pulse.epicordia.com/{orgSlug})</span></div>
            <div>• Initial Role: <span className="font-bold text-emerald-600 dark:text-emerald-400">Admin (Owner)</span></div>
            <div>• Industry &amp; Size: <span className="font-bold text-neutral-900 dark:text-neutral-100">{industry} • {companySize}</span></div>
            <div>• Initial Team: <span className="font-bold text-neutral-900 dark:text-neutral-100">{teamName}</span></div>
            <div>• Workflow Template: <span className="font-bold text-neutral-900 dark:text-neutral-100">{selectedTemplate}</span></div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3 px-5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer"
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleLaunchOrg}
              className="flex-1 py-3.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  <span>CREATE ORGANIZATION &amp; ENTER DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
