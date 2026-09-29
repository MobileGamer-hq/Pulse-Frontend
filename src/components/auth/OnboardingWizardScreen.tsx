import React, { useState } from 'react';
import { Check, Code, Compass, TrendingUp, LayoutGrid, User, Mail, Lock, Building2, Users, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PulseLogo } from '../common/PulseLogo';
import { organizationService } from '../../services/organizationService';
import { teamService } from '../../services/teamService';
import { supabase } from '../../services/supabaseClient';
import { emailService } from '../../services/emailService';
import type { WorkflowTemplate } from '../../types';

interface OnboardingWizardScreenProps {
  onComplete?: () => void;
}

export const OnboardingWizardScreen: React.FC<OnboardingWizardScreenProps> = ({ onComplete }) => {
  const { setActiveScreen } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  const existingEmail = localStorage.getItem('pulse_user_email');
  const existingName = localStorage.getItem('pulse_user_name');

  // Step 1: User Account Credentials State
  const [fullName, setFullName] = useState(existingName || '');
  const [email, setEmail] = useState(existingEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Organization State
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [companySize, setCompanySize] = useState('11 - 50');

  // Step 3: Team & Template State
  const [teamName, setTeamName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate>('SoftwareSprint');

  // Auto-skip Step 1 if user is already authenticated with Supabase
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setStep(2);
      }
    });
  }, []);

  // Handle Step 1: Create Account
  const handleStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data: authCheck } = await supabase.auth.getUser();
    if (authCheck?.user) {
      setStep(2);
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanFullName = fullName.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanFullName,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        localStorage.setItem('pulse_auth_token', data.session?.access_token || data.user.id);
        localStorage.setItem('pulse_user_id', data.user.id);
        localStorage.setItem('pulse_user_email', cleanEmail);
        localStorage.setItem('pulse_user_name', cleanFullName);

        // Dispatch welcome email asynchronously
        emailService.sendWelcomeEmail({
          toEmail: cleanEmail,
          toName: cleanFullName,
        }).catch((emailErr) => {
          console.warn('[OnboardingWizard] Welcome email failed to send:', emailErr);
        });
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Create Organization
  const handleStep2Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!orgName.trim()) {
      setError('Please enter an organization name.');
      return;
    }
    const slug = orgSlug.trim() ? orgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : orgName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      setError('Please enter a valid workspace slug.');
      return;
    }

    setLoading(true);
    try {
      const check = await organizationService.checkSlugAvailable(slug);
      if (!check.available) {
        setError(check.reason || `The workspace slug "${slug}" is already taken. Please choose another.`);
        setLoading(false);
        return;
      }

      setOrgSlug(slug);
      localStorage.setItem('pulse_tenant_slug', slug);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to set organization.');
    } finally {
      setLoading(false);
    }
  };


  // Handle Step 3 Validation & Team Creation
  const handleStep3Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError('Please enter your team name.');
      return;
    }
    setStep(4);
  };

  // Handle Final Launch & Activation
  const handleFinish = async () => {
    setError(null);
    setLoading(true);
    const finalSlug = orgSlug || orgName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'epicordia';

    try {
      localStorage.setItem('pulse_tenant_slug', finalSlug);
      localStorage.setItem(`pulse_org_status_${finalSlug}`, 'APPROVED');
      localStorage.setItem(`pulse_user_role_${finalSlug}`, 'Admin');
      localStorage.setItem('pulse_is_new_user', 'false');

      // 1. Create Organization in Supabase and Local Store
      await organizationService.createOrganization({
        name: orgName.trim(),
        slug: finalSlug,
      });

      // 2. Create Primary Team in Supabase and Local Store
      if (teamName.trim()) {
        try {
          await teamService.createTeam(finalSlug, {
            name: teamName.trim(),
            workflowTemplate: selectedTemplate || 'SoftwareSprint',
          });
        } catch (teamErr) {
          console.warn('[OnboardingWizard] Team creation error:', teamErr);
        }
      }

      if (onComplete) {
        onComplete();
      } else {
        window.location.href = `/${finalSlug}/dashboard`;
      }
    } catch (err: any) {
      setError(err.message || 'Workspace launch failed.');
    } finally {
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
      {/* Header Logo */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button
          onClick={() => setActiveScreen('welcome')}
          className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer"
        >
          ← Welcome Screen
        </button>

        <div className="flex items-center gap-2">
          <PulseLogo size="sm" />
          <div>
            <span className="font-bold text-lg tracking-tight block leading-tight">Pulse</span>
            <span className="text-[10px] text-neutral-400 font-mono block">by Epicordia</span>
          </div>
        </div>

        <div className="w-20 text-right">
          <button
            onClick={() => setActiveScreen('signin')}
            className="font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              1
            </span>
            <span className="font-semibold hidden sm:inline">Account</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-2 sm:mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              2
            </span>
            <span className="font-semibold hidden sm:inline">Organization</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-2 sm:mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              3
            </span>
            <span className="font-semibold hidden sm:inline">Team</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-2 sm:mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 4 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              4
            </span>
            <span className="font-semibold hidden sm:inline">Finalize</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="w-full max-w-2xl mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: User Account Credentials */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 1 of 4</span>
            <h2 className="text-xl font-bold tracking-tight">Create Administrator Account</h2>
            <p className="text-xs text-neutral-500 mt-1">Enter your login credentials to set up your personal workspace account.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setError(null); }}
                  placeholder="e.g. Somto Analyst"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    placeholder="At least 6 chars"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Continue to Organization →
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Organization Profile */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 2 of 4</span>
            <h2 className="text-xl font-bold tracking-tight">Organization Profile</h2>
            <p className="text-xs text-neutral-500 mt-1">Configure the core details of your enterprise workspace.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => {
                    setOrgName(e.target.value);
                    setError(null);
                    setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }}
                  placeholder="e.g. Epicordia Corp"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Workspace URL Route (Slug)
              </label>
              <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden focus-within:border-neutral-900 dark:focus-within:border-white transition-colors">
                <span className="pl-3 pr-0.5 font-mono text-neutral-400 text-xs select-none">
                  pulse.epicordia.com/
                </span>
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="epicordia"
                  className="flex-1 py-2.5 pr-3 pl-0.5 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                Your workspace URL: pulse.epicordia.com/{orgSlug || 'workspace-slug'}
              </span>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Industry
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
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
                    className={`py-2.5 px-3 rounded-lg border font-mono text-xs font-semibold text-center transition-all ${
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

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white font-medium cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Continue to Team →
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Team Configuration */}
      {step === 3 && (
        <form onSubmit={handleStep3Next} className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 3 of 4</span>
            <h2 className="text-xl font-bold tracking-tight">Team Configuration</h2>
            <p className="text-xs text-neutral-500 mt-1">Define your first working group and select a foundational workflow template.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Primary Team Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={e => { setTeamName(e.target.value); setError(null); }}
                  placeholder="e.g. Core Engineering, Product Strategy"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase">
                Select Workflow Template
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
                        <div className="p-2 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
                          <Icon className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full border border-black dark:border-white flex items-center justify-center">
                            <Check className="w-3 h-3 text-black dark:text-white" />
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
              onClick={() => setStep(2)}
              className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white font-medium cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Review Details →
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Finalize & Launch */}
      {step === 4 && (
        <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 4 of 4</span>
            <h2 className="text-xl font-bold tracking-tight">Confirm &amp; Launch Workspace</h2>
            <p className="text-xs text-neutral-500 mt-1">Review your registration information before launching Pulse.</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-left text-xs font-mono space-y-2 border border-neutral-200 dark:border-neutral-700">
            <div>• Admin User: <span className="font-bold text-neutral-900 dark:text-neutral-100">{fullName} ({email})</span></div>
            <div>• Organization: <span className="font-bold text-neutral-900 dark:text-neutral-100">{orgName} (pulse.epicordia.com/{orgSlug})</span></div>
            <div>• Size &amp; Industry: <span className="font-bold text-neutral-900 dark:text-neutral-100">{companySize} • {industry}</span></div>
            <div>• Initial Team: <span className="font-bold text-neutral-900 dark:text-neutral-100">{teamName}</span></div>
            <div>• Workflow Template: <span className="font-bold text-neutral-900 dark:text-neutral-100">{selectedTemplate}</span></div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="py-3 px-5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="flex-1 py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Workspace...
                </>
              ) : (
                'Complete Setup & Launch Pulse →'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
