import React, { useState } from 'react';
import { 
  ArrowRight, Shield, Activity, Layers, 
  LogIn, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WelcomeScreenProps {
  onStartSetup?: () => void;
  onSignIn?: () => void;
  onInvite?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartSetup,
  onSignIn,
  onInvite
}) => {
  const { setActiveScreen } = useApp();
  const [quickName, setQuickName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleStartSetup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onStartSetup) {
      onStartSetup();
    } else {
      setActiveScreen('wizard');
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      setActiveScreen('signin');
    }
  };

  const handleInvite = () => {
    if (onInvite) {
      onInvite();
    } else {
      setActiveScreen('invite');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveScreen('welcome')}>
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shadow-xs">
            ◇
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-none font-mono">PULSE</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono tracking-wider block mt-0.5">by Epicordia</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-neutral-700 dark:text-neutral-300 font-semibold">
          <button onClick={() => scrollToSection('features')} className="hover:text-black dark:hover:text-white transition-colors">
            Capabilities
          </button>
          <button onClick={() => scrollToSection('setup')} className="hover:text-black dark:hover:text-white transition-colors">
            Workspace Setup
          </button>
          <button onClick={handleInvite} className="hover:text-black dark:hover:text-white transition-colors">
            Team Invite
          </button>
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />
          <button
            onClick={handleSignIn}
            className="px-3.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => handleStartSetup()}
            className="px-3.5 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="text-2xl sm:text-3xl font-light text-neutral-500 dark:text-neutral-400 tracking-tight font-serif italic mb-1">
            Welcome to
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-neutral-900 dark:text-white leading-[0.95]">
            Pulse.
          </h1>

          <p className="text-lg sm:text-xl font-medium text-neutral-800 dark:text-neutral-200 max-w-2xl leading-relaxed">
            Engineering & operations hub for production teams.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 font-mono text-xs font-bold">
            <button
              onClick={() => handleStartSetup()}
              className="py-3 px-6 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs flex items-center gap-2"
            >
              <span>Set Up Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="py-3 px-5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-900 dark:text-white transition-colors"
            >
              Explore Capabilities
            </button>
          </div>
        </div>

        {/* Structured Product Metric Preview Card */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Active Telemetry Snapshot</span>
              </div>
              <span className="text-[11px] text-neutral-500">Live Workspace</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-neutral-500">Team Energy Index</div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">4.8 / 5.0</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Optimal
                </span>
              </div>

              <div className="p-3 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-neutral-500">Daily EOD Submissions</div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">18 of 20 Members</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  90% Active
                </span>
              </div>

              <div className="p-3 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-neutral-500">Active Blockers Flagged</div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">1 Item Pending</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Attention
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Core Capabilities */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Core capabilities built for production teams
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
            Eliminate status meeting overhead while providing clear visibility into work status, blockers, and strategic goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="w-9 h-9 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">Daily Check-Ins</h3>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Automated end-of-day progress reports, energy tracking, and blocker flags delivered directly to team lead dashboards.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="w-9 h-9 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">Role Governance</h3>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              7 privilege tiers (Admin, Executive, HR, Manager, Team Lead, Member, Contractor) with scoped data access.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="w-9 h-9 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">Multi-Dimensional Workflows</h3>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Single workspace accommodating software sprint boards, client project deliverables, and high-level OKR goals.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Workspace Setup */}
      <section id="setup" className="w-full bg-neutral-50 dark:bg-neutral-900/50 py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Quick workspace setup
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Configure your organization profile, choose workflow templates, and invite your team in under three minutes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 font-sans text-xs">
              <div className="space-y-1.5 p-4 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="font-bold text-neutral-900 dark:text-white">1. Organization Profile</div>
                <div className="text-neutral-600 dark:text-neutral-400">Set company size, industry context, and primary team structure.</div>
              </div>

              <div className="space-y-1.5 p-4 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="font-bold text-neutral-900 dark:text-white">2. Select Template</div>
                <div className="text-neutral-600 dark:text-neutral-400">Choose between Software Development, Agency Work, or General Ops setups.</div>
              </div>

              <div className="space-y-1.5 p-4 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="font-bold text-neutral-900 dark:text-white">3. Role Assignment</div>
                <div className="text-neutral-600 dark:text-neutral-400">Define access privileges for managers, leads, and contractors.</div>
              </div>

              <div className="space-y-1.5 p-4 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="font-bold text-neutral-900 dark:text-white">4. Launch Dashboard</div>
                <div className="text-neutral-600 dark:text-neutral-400">Immediate access to tasks, projects, goals, and daily telemetry.</div>
              </div>
            </div>
          </div>

          {/* Quick Setup Launcher Widget */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white dark:bg-neutral-950 p-6 sm:p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <div className="space-y-1">
                <div className="font-bold text-base text-neutral-900 dark:text-white">Initialize New Workspace</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Enter your basic details to start the onboarding wizard.</div>
              </div>

              <form onSubmit={handleStartSetup} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={quickEmail}
                    onChange={e => setQuickEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white font-sans text-xs"
                  />
                </div>

                <div className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 font-sans">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 dark:border-neutral-700"
                  />
                  <span>I agree to workspace terms and privacy guidelines.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Wizard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-10 border-t border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-600 dark:text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>© 2026 Pulse by Epicordia. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => handleStartSetup()} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Wizard
          </button>
          <button onClick={handleSignIn} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Sign In
          </button>
          <button onClick={handleInvite} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Invite Link
          </button>
        </div>
      </footer>
    </div>
  );
};
