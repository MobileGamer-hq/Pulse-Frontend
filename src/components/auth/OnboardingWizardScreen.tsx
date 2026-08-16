import React, { useState } from 'react';
import { Check, Code, Compass, TrendingUp, LayoutGrid } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WorkflowTemplate } from '../../types';

interface OnboardingWizardScreenProps {
  onComplete?: () => void;
}

export const OnboardingWizardScreen: React.FC<OnboardingWizardScreenProps> = ({ onComplete }) => {
  const { setActiveScreen } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Organization State
  const [orgName, setOrgName] = useState('Acme Corp');
  const [industry, setIndustry] = useState('Technology & Software');
  const [companySize, setCompanySize] = useState('51 - 200');

  // Step 2 Team & Template State
  const [teamName, setTeamName] = useState('Core Engineering');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate>('SoftwareSprint');

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else {
      setActiveScreen('dashboard');
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
      <div className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-sm">
          ◇
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight block leading-tight">Pulse</span>
          <span className="text-[10px] text-neutral-400 font-mono block">by Epicordia</span>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              1
            </span>
            <span className="font-semibold">Organization</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              2
            </span>
            <span className="font-semibold">Team</span>
          </div>

          <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1 mx-4" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-500'
            }`}>
              3
            </span>
            <span className="font-semibold">Finalize</span>
          </div>
        </div>
      </div>

      {/* Step 1: Organization Profile */}
      {step === 1 && (
        <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Organization Profile</h2>
            <p className="text-xs text-neutral-500 mt-1">Configure the core details of your enterprise workspace.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-900"
              />
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
                <option value="Technology & Software">Software & Technology</option>
                <option value="Marketing & Agency">Marketing & Digital Agency</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
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

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Team Configuration */}
      {step === 2 && (
        <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-1">Step 2 of 4</span>
            <h2 className="text-xl font-bold tracking-tight">Team Configuration</h2>
            <p className="text-xs text-neutral-500 mt-1">Define your first working group and select a foundational workflow template.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Engineering, Product, Marketing"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block font-mono">This will be the primary workspace for your initial users.</span>
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
              onClick={() => setStep(1)}
              className="font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="py-2.5 px-5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Finalize */}
      {step === 3 && (
        <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Workspace Ready!</h2>
            <p className="text-xs text-neutral-500 mt-1">
              {orgName} is configured with the {selectedTemplate} template for team {teamName}.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-left text-xs font-mono space-y-1">
            <div>• Organization: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{orgName}</span></div>
            <div>• Size: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{companySize}</span></div>
            <div>• Default Team: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{teamName}</span></div>
            <div>• Workflow: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedTemplate}</span></div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Launch Pulse Workspace →
          </button>
        </div>
      )}
    </div>
  );
};
