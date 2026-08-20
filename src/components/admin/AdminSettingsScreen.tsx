import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Building2, Shield, Plug, CreditCard, Tag as TagIcon, 
  Upload, Check, Search, Plus, Edit2, Eye, Slash, 
  ChevronDown, FileText, MoreVertical,
  ShieldCheck, Sliders, Sun, Moon, Monitor, 
  User, Bell, Smartphone, Laptop, Clock, GripVertical
} from 'lucide-react';

export const AdminSettingsScreen: React.FC = () => {
  const { setIsDarkMode, pushPanel, tags, reorderTags } = useApp();

  // Drag and drop state for Tags tab
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);

  const handleTagDrop = (targetTagId: string) => {
    if (!draggedTagId || draggedTagId === targetTagId) return;
    const fromIdx = tags.findIndex(t => t.id === draggedTagId);
    const toIdx = tags.findIndex(t => t.id === targetTagId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newTags = [...tags];
    const [moved] = newTags.splice(fromIdx, 1);
    newTags.splice(toIdx, 0, moved);
    reorderTags(newTags);
    setDraggedTagId(null);
    setDragOverTagId(null);
  };

  // Settings Tab: 'user_profile' | 'appearance' | 'notif_controls' | 'profile' | 'rbac' | 'integrations' | 'billing' | 'tags'
  const [activeTab, setActiveTab] = useState<'user_profile' | 'appearance' | 'notif_controls' | 'profile' | 'rbac' | 'integrations' | 'billing' | 'tags'>('appearance');

  // Appearance Settings State (Screenshot 1)
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [fontSize, setFontSize] = useState('14px');
  const [contrastMode, setContrastMode] = useState(false);

  // Notification Controls State (Screenshot 2)
  const [pauseNotifs, setPauseNotifs] = useState(false);
  const [quietMode, setQuietMode] = useState(true);
  const [quietStart, setQuietStart] = useState('10:00 PM');
  const [quietEnd, setQuietEnd] = useState('08:00 AM');
  const [channels, setChannels] = useState({
    critical: { email: true, desktop: true, inapp: true },
    digests: { email: true, desktop: false, inapp: true },
    marketing: { email: false, desktop: false, inapp: false }
  });
  const [triggers, setTriggers] = useState({
    taskAssignments: true,
    mentions: true,
    blockerFlags: true,
    reportAlerts: false,
    goalUpdates: true
  });

  // Profile & Preferences State (Screenshot 3)
  const [fullName, setFullName] = useState('Jane Doe');
  const [emailAddr, setEmailAddr] = useState('jane.doe@enterprise.os');
  const [jobTitle, setJobTitle] = useState('Senior Data Analyst');
  const [department, setDepartment] = useState('Analytics & Strategy');
  const [deepWorkMode, setDeepWorkMode] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [region, setRegion] = useState('North America');
  const [userTimeZone, setUserTimeZone] = useState('(GMT-08:00) Pacific Time');
  const [startOfWeek, setStartOfWeek] = useState<'sunday' | 'monday'>('monday');

  // Tenant Company Profile State
  const [companyName, setCompanyName] = useState('Acme Corporation');
  const [tenantDomain, setTenantDomain] = useState('acme');
  const [timeZone, setTimeZone] = useState('PST (Pacific Standard Time)');
  const [currency, setCurrency] = useState('USD ($)');
  const [nomenclature, setNomenclature] = useState<'depts' | 'tribes'>('depts');
  const [publicProfile, setPublicProfile] = useState(true);
  const [patternPreset, setPatternPreset] = useState<'minimal' | 'stipple' | 'hatch'>('minimal');

  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'dark') setIsDarkMode(true);
    if (mode === 'light') setIsDarkMode(false);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top Settings Navigation Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 font-mono">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full pb-1">
          {/* User Settings */}
          <button
            onClick={() => setActiveTab('user_profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'user_profile' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Profile &amp; Account
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'appearance' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Appearance
          </button>

          <button
            onClick={() => setActiveTab('notif_controls')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'notif_controls' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
          </button>

          <span className="text-neutral-300 dark:text-neutral-700">|</span>

          {/* Tenant Admin Settings */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'profile' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Company Profile
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'rbac' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> RBAC &amp; Roles
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'integrations' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Plug className="w-3.5 h-3.5" /> Integrations
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'billing' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Billing
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'tags' 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <TagIcon className="w-3.5 h-3.5" /> Tags
          </button>
        </div>
      </div>

      {/* 1. APPEARANCE SETTINGS VIEW matching Screenshot 1 */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800 font-mono">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">
              Appearance Settings
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Subnav */}
            <div className="space-y-1 font-mono text-xs">
              <div onClick={() => setActiveTab('user_profile')} className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Profile &amp; Account
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100">
                Appearance
              </div>
              <div onClick={() => setActiveTab('notif_controls')} className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Notifications
              </div>
              <div className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Security &amp; Access
              </div>
              <div onClick={() => setActiveTab('integrations')} className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Integrations
              </div>
            </div>

            {/* Right Cards (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Theme Configuration Box matching Screenshot 1 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Theme Configuration</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Select your preferred interface color mode.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  {/* Light Mode Card */}
                  <div 
                    onClick={() => handleSelectTheme('light')}
                    className={`p-4 rounded-2xl border cursor-pointer space-y-3 relative transition-all ${
                      themeMode === 'light' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {themeMode === 'light' && <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[10px] font-bold">✓</span>}
                    <div className="w-full h-16 bg-white rounded-xl border border-neutral-200 p-2 space-y-1.5">
                      <div className="w-12 h-1.5 bg-neutral-200 rounded-full" />
                      <div className="w-full h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-4 bg-white rounded border border-neutral-200" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <Sun className="w-3.5 h-3.5 text-neutral-600" /> Light Mode
                    </div>
                  </div>

                  {/* Dark Mode Card */}
                  <div 
                    onClick={() => handleSelectTheme('dark')}
                    className={`p-4 rounded-2xl border cursor-pointer space-y-3 relative transition-all ${
                      themeMode === 'dark' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {themeMode === 'dark' && <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[10px] font-bold">✓</span>}
                    <div className="w-full h-16 bg-neutral-900 rounded-xl border border-neutral-800 p-2 space-y-1.5">
                      <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
                      <div className="w-full h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-4 bg-neutral-900 rounded border border-neutral-700" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <Moon className="w-3.5 h-3.5 text-neutral-400" /> Dark Mode
                    </div>
                  </div>

                  {/* System Sync Card */}
                  <div 
                    onClick={() => handleSelectTheme('system')}
                    className={`p-4 rounded-2xl border cursor-pointer space-y-3 relative transition-all ${
                      themeMode === 'system' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {themeMode === 'system' && <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[10px] font-bold">✓</span>}
                    <div className="w-full h-16 rounded-xl border border-neutral-300 overflow-hidden flex">
                      <div className="w-1/2 bg-white p-1.5 space-y-1">
                        <div className="w-6 h-1 bg-neutral-200 rounded-full" />
                        <div className="w-full h-8 bg-neutral-100 rounded" />
                      </div>
                      <div className="w-1/2 bg-neutral-900 p-1.5 space-y-1">
                        <div className="w-6 h-1 bg-neutral-700 rounded-full" />
                        <div className="w-full h-8 bg-neutral-800 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <Monitor className="w-3.5 h-3.5 text-neutral-500" /> System Sync
                    </div>
                  </div>
                </div>
              </div>

              {/* Interface Density Box matching Screenshot 1 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Interface Density</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Adjust the spacing and information density of data tables and lists.</p>
                </div>

                <div className="space-y-3 font-mono">
                  <div 
                    onClick={() => setDensity('standard')}
                    className={`p-4 rounded-xl border cursor-pointer space-y-2 ${
                      density === 'standard' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${density === 'standard' ? 'border-black dark:border-white' : 'border-neutral-300'}`}>
                        {density === 'standard' && <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Standard View</div>
                        <p className="text-[10px] text-neutral-400 font-sans">Optimized for readability and touch interaction.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg space-y-2 pl-9">
                      <div className="w-28 h-2 bg-neutral-400 dark:bg-neutral-500 rounded" />
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="w-3/4 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    </div>
                  </div>

                  <div 
                    onClick={() => setDensity('compact')}
                    className={`p-4 rounded-xl border cursor-pointer space-y-2 ${
                      density === 'compact' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${density === 'compact' ? 'border-black dark:border-white' : 'border-neutral-300'}`}>
                        {density === 'compact' && <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Compact View (High Density)</div>
                        <p className="text-[10px] text-neutral-400 font-sans">Maximizes data visibility. Ideal for complex analytics and large tables.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg space-y-1.5 pl-9">
                      <div className="w-28 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded" />
                      <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="w-2/3 h-1 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography & Scaling Box matching Screenshot 1 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Typography &amp; Scaling</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage font sizes and visual contrast modes.</p>
                </div>

                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">Base Font Size</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300">{fontSize} (Default)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-sans">A</span>
                    <input
                      type="range"
                      min="12"
                      max="16"
                      step="1"
                      value={parseInt(fontSize)}
                      onChange={e => setFontSize(`${e.target.value}px`)}
                      className="flex-1 accent-black dark:accent-white"
                    />
                    <span className="text-base font-bold font-sans">A</span>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 flex items-center justify-between font-sans">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Rigorous Contrast Mode</div>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Forces maximum contrast ratios on all text and critical boundaries. Recommended for high-glare environments.</p>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setContrastMode(prev => !prev)}
                      className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${contrastMode ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${contrastMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Buttons matching Screenshot 1 */}
              <div className="flex justify-end gap-3 font-mono pt-2">
                <button className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
                  Discard Changes
                </button>
                <button onClick={() => alert('Appearance preferences saved!')} className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION CONTROLS VIEW matching Screenshot 2 */}
      {activeTab === 'notif_controls' && (
        <div className="space-y-6 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800 font-mono">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">
                Notification Controls
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage how and when you receive alerts from Performance OS.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            {/* Left Main Controls (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Global Controls Box matching Screenshot 2 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Global Controls</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Master settings for all your notifications.</p>
                </div>

                <div className="space-y-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Pause Notifications</div>
                      <p className="text-[10px] text-neutral-400 font-sans">Temporarily mute all non-critical alerts.</p>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setPauseNotifs(prev => !prev)}
                      className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${pauseNotifs ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${pauseNotifs ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Quiet Mode Schedule</div>
                      <p className="text-[10px] text-neutral-400 font-sans">Automatically pause notifications during specific hours.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <input type="text" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="w-16 text-center font-bold focus:outline-none bg-transparent" />
                      </div>
                      <span className="text-neutral-400 text-[10px]">to</span>
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <input type="text" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="w-16 text-center font-bold focus:outline-none bg-transparent" />
                      </div>

                      <button 
                        type="button"
                        onClick={() => setQuietMode(prev => !prev)}
                        className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ml-2 ${quietMode ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${quietMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Preferences Matrix Box matching Screenshot 2 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Channel Preferences</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Choose where you receive different types of alerts.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                      <tr>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-center">Email</th>
                        <th className="pb-2 text-center">Desktop</th>
                        <th className="pb-2 text-center">In-App</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      <tr>
                        <td className="py-3.5 font-bold font-sans text-neutral-900 dark:text-neutral-100">Critical System Alerts</td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.critical.email} onChange={() => setChannels(c => ({ ...c, critical: { ...c.critical, email: !c.critical.email } }))} className="rounded border-neutral-300" />
                        </td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.critical.desktop} onChange={() => setChannels(c => ({ ...c, critical: { ...c.critical, desktop: !c.critical.desktop } }))} className="rounded border-neutral-300" />
                        </td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.critical.inapp} onChange={() => setChannels(c => ({ ...c, critical: { ...c.critical, inapp: !c.critical.inapp } }))} className="rounded border-neutral-300" />
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3.5 font-bold font-sans text-neutral-900 dark:text-neutral-100">Daily Digests</td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.digests.email} onChange={() => setChannels(c => ({ ...c, digests: { ...c.digests, email: !c.digests.email } }))} className="rounded border-neutral-300" />
                        </td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.digests.desktop} onChange={() => setChannels(c => ({ ...c, digests: { ...c.digests, desktop: !c.digests.desktop } }))} className="rounded border-neutral-300" />
                        </td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.digests.inapp} onChange={() => setChannels(c => ({ ...c, digests: { ...c.digests, inapp: !c.digests.inapp } }))} className="rounded border-neutral-300" />
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3.5 font-bold font-sans text-neutral-900 dark:text-neutral-100">Marketing &amp; Updates</td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.marketing.email} onChange={() => setChannels(c => ({ ...c, marketing: { ...c.marketing, email: !c.marketing.email } }))} className="rounded border-neutral-300" />
                        </td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.marketing.desktop} onChange={() => setChannels(c => ({ ...c, marketing: { ...c.marketing, desktop: !c.marketing.desktop } }))} className="rounded border-neutral-300" />
                        </td>
                        <td className="py-3.5 text-center">
                          <input type="checkbox" checked={channels.marketing.inapp} onChange={() => setChannels(c => ({ ...c, marketing: { ...c.marketing, inapp: !c.marketing.inapp } }))} className="rounded border-neutral-300" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Triggers Box matching Screenshot 2 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Event Triggers</h3>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">Granular control over specific actions.</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
                    Reset Defaults
                  </button>
                </div>

                <div className="space-y-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Task Assignments</div>
                      <p className="text-[10px] text-neutral-400 font-sans">When a new task is assigned to you.</p>
                    </div>
                    <button type="button" onClick={() => setTriggers(t => ({ ...t, taskAssignments: !t.taskAssignments }))} className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${triggers.taskAssignments ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${triggers.taskAssignments ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Mentions</div>
                      <p className="text-[10px] text-neutral-400 font-sans">When someone @mentions you in a comment.</p>
                    </div>
                    <button type="button" onClick={() => setTriggers(t => ({ ...t, mentions: !t.mentions }))} className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${triggers.mentions ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${triggers.mentions ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Blocker Flags</div>
                      <p className="text-[10px] text-neutral-400 font-sans">When a dependent task is marked as blocked.</p>
                    </div>
                    <button type="button" onClick={() => setTriggers(t => ({ ...t, blockerFlags: !t.blockerFlags }))} className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${triggers.blockerFlags ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${triggers.blockerFlags ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Report Alerts</div>
                      <p className="text-[10px] text-neutral-400 font-sans">When a scheduled report is ready for viewing.</p>
                    </div>
                    <button type="button" onClick={() => setTriggers(t => ({ ...t, reportAlerts: !t.reportAlerts }))} className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${triggers.reportAlerts ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${triggers.reportAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Goal Updates</div>
                      <p className="text-[10px] text-neutral-400 font-sans">When a monitored goal changes status (e.g., At Risk).</p>
                    </div>
                    <button type="button" onClick={() => setTriggers(t => ({ ...t, goalUpdates: !t.goalUpdates }))} className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${triggers.goalUpdates ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${triggers.goalUpdates ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Cards matching Screenshot 2 */}
            <div className="space-y-4">
              {/* Pro Tip Card */}
              <div className="p-6 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-1.5">
                  💡 Pro Tip
                </h3>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  To maintain focus during deep work sessions, utilize the <strong>Quiet Mode Schedule</strong>. We recommend aligning this with your standard out-of-office hours to prevent burnout and ensure notifications only reach you when actionable.
                </p>
              </div>

              {/* Mobile App Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center space-y-3">
                <Smartphone className="w-8 h-8 text-neutral-800 dark:text-neutral-200 mx-auto" />
                <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Mobile App</h3>
                <p className="text-xs text-neutral-500 font-sans">Manage push notifications on the go.</p>
                <button onClick={() => alert('Redirecting to mobile app download link...')} className="w-full py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold">
                  Download App
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 font-mono">
            <button onClick={() => alert('Notification preferences saved!')} className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm">
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* 3. PROFILE & PREFERENCES VIEW matching Screenshot 3 */}
      {activeTab === 'user_profile' && (
        <div className="space-y-6 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800 font-mono">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">
                Profile &amp; Preferences
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage your personal information, security settings, and app preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            {/* Left Column: Personal Information & Preferences (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Box matching Screenshot 3 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  Personal Information
                </h3>

                <div className="flex flex-col sm:flex-row items-start gap-6 pt-2">
                  <div className="space-y-2 text-center">
                    <UserAvatar name={fullName} size="xl" className="mx-auto" />
                    <button className="px-3 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold">
                      Change Photo
                    </button>
                  </div>

                  <div className="flex-1 space-y-3 font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Full Name</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs" />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Email Address</label>
                        <input type="email" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Job Title</label>
                        <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs" />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Department</label>
                        <div className="relative">
                          <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
                            <option>Analytics &amp; Strategy</option>
                            <option>Core Infrastructure</option>
                            <option>Product Development</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 flex items-center justify-between font-sans">
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Deep Work Mode</div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Mute all non-critical notifications across the OS.</p>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setDeepWorkMode(prev => !prev)}
                        className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${deepWorkMode ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${deepWorkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={() => alert('Personal details saved!')} className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Box matching Screenshot 3 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Language</label>
                    <div className="relative">
                      <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Region</label>
                    <div className="relative">
                      <select value={region} onChange={e => setRegion(e.target.value)} className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
                        <option>North America</option>
                        <option>Europe</option>
                        <option>Asia Pacific</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Timezone</label>
                    <div className="relative">
                      <select value={userTimeZone} onChange={e => setUserTimeZone(e.target.value)} className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs">
                        <option>(GMT-08:00) Pacific Time</option>
                        <option>(GMT-05:00) Eastern Time</option>
                        <option>(GMT+00:00) UTC</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Start of Week</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button" 
                        onClick={() => setStartOfWeek('sunday')}
                        className={`py-2 rounded-xl border text-xs font-bold ${startOfWeek === 'sunday' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'}`}
                      >
                        Sunday
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setStartOfWeek('monday')}
                        className={`py-2 rounded-xl border text-xs font-bold ${startOfWeek === 'monday' ? 'border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'}`}
                      >
                        Monday
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Cards: Account Security & Active Sessions matching Screenshot 3 */}
            <div className="space-y-6 font-mono">
              {/* Account Security Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  Account Security
                </h3>

                <div className="space-y-3 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Change Password</span>
                  <input type="password" placeholder="Current Password" className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs" />
                  <input type="password" placeholder="New Password" className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs" />
                  <input type="password" placeholder="Confirm New Password" className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs" />
                  <button onClick={() => alert('Password updated!')} className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold text-xs text-neutral-800 dark:text-neutral-200">
                    Update Password
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1 font-sans">
                      <ShieldCheck className="w-3.5 h-3.5" /> Two-Factor Auth
                    </div>
                    <p className="text-[10px] text-neutral-400 font-mono">Currently enabled via Authenticator.</p>
                  </div>
                  <button className="font-bold text-xs text-neutral-800 dark:text-neutral-200 hover:underline">Manage</button>
                </div>
              </div>

              {/* Active Sessions Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
                <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider block">Active Sessions</h3>

                <div className="space-y-3 font-sans">
                  <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-neutral-700 dark:text-neutral-300 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">MacBook Pro - Chrome</div>
                      <div className="text-[10px] font-mono text-neutral-400">San Francisco, US • Current Session</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-neutral-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">iPhone 13 - iOS App</div>
                      <div className="text-[10px] font-mono text-neutral-400">San Francisco, US • Last active 2h ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TENANT COMPANY PROFILE VIEW matching Screenshot 3 from earlier */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">
              Company Profile
            </h1>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
                Discard Changes
              </button>
              <button onClick={() => alert('Company profile saved!')} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm">
                Save Configuration
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Subnav */}
            <div className="space-y-1 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100">
                Company Profile
              </div>
              <div className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Security &amp; Authentication
              </div>
              <div className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Billing &amp; Invoices
              </div>
              <div className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Integrations
              </div>
              <div className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer">
                Audit Logs
              </div>
            </div>

            {/* Right Form Cards (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* General Information Box matching Screenshot 3 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">General Information</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage the primary identity and contact details for this tenant.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Tenant Domain</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 rounded-l-xl bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs">https://</span>
                      <input
                        type="text"
                        value={tenantDomain}
                        onChange={e => setTenantDomain(e.target.value)}
                        className="flex-1 p-2.5 rounded-r-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                      />
                      <span className="px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-l-0 border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs">.performanceos.com</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 font-mono pt-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Organization Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-lg">
                      🏢
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> Upload New
                        </button>
                        <button className="text-xs text-neutral-400 hover:text-red-600">Remove</button>
                      </div>
                      <p className="text-[10px] text-neutral-400">Recommended: 256x256px SVG or PNG. Max 2MB.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Localization & Structure Box matching Screenshot 3 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Localization &amp; Structure</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Define structural terminology and regional defaults.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Primary Time Zone</label>
                    <div className="relative">
                      <select
                        value={timeZone}
                        onChange={e => setTimeZone(e.target.value)}
                        className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                      >
                        <option>PST (Pacific Standard Time)</option>
                        <option>EST (Eastern Standard Time)</option>
                        <option>UTC (Coordinated Universal Time)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Default Currency</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
                      >
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 font-mono">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Organizational Nomenclature</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setNomenclature('depts')}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 font-sans ${
                        nomenclature === 'depts' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${nomenclature === 'depts' ? 'border-black dark:border-white' : 'border-neutral-300'}`}>
                        {nomenclature === 'depts' && <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />}
                      </div>
                      <span>Departments / Teams</span>
                    </div>

                    <div 
                      onClick={() => setNomenclature('tribes')}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 font-sans ${
                        nomenclature === 'tribes' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 font-bold' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${nomenclature === 'tribes' ? 'border-black dark:border-white' : 'border-neutral-300'}`}>
                        {nomenclature === 'tribes' && <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />}
                      </div>
                      <span>Tribes / Squads</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Profile & Branding Box matching Screenshot 3 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Public Profile &amp; Branding</h3>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">Control external visibility and structural brand patterns.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setPublicProfile(prev => !prev)}
                    className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${publicProfile ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${publicProfile ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="space-y-2 font-mono">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Visual Pattern Preset</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div 
                      onClick={() => setPatternPreset('minimal')}
                      className={`p-3.5 rounded-xl border cursor-pointer space-y-2 ${
                        patternPreset === 'minimal' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className="w-full h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                      <div className="flex justify-between items-center font-bold text-xs">
                        <span>Minimal (Solid)</span>
                        {patternPreset === 'minimal' && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div 
                      onClick={() => setPatternPreset('stipple')}
                      className={`p-3.5 rounded-xl border cursor-pointer space-y-2 ${
                        patternPreset === 'stipple' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className="w-full h-12 bg-[radial-gradient(#9ca3af_1px,transparent_1px)] [background-size:8px_8px] rounded-lg border" />
                      <div className="font-bold text-xs">Stipple Grid</div>
                    </div>

                    <div 
                      onClick={() => setPatternPreset('hatch')}
                      className={`p-3.5 rounded-xl border cursor-pointer space-y-2 ${
                        patternPreset === 'hatch' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className="w-full h-12 bg-repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb_5px,transparent_5px,transparent_10px) rounded-lg border" />
                      <div className="font-bold text-xs">Diagonal Hatch</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deactivate Tenant Red Box */}
              <div className="p-6 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-red-600 dark:text-red-400 font-sans">Deactivate Tenant</h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Permanently pause access to this organization and halt billing.</p>
                </div>

                <button onClick={() => alert('Initiating tenant deactivation protocol...')} className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 font-bold text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40">
                  Initiate Deactivation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RBAC & ROLES VIEW */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">SETTINGS &gt; ACCESS CONTROL</span>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans mt-0.5">
                RBAC &amp; Roles
              </h1>
              <p className="text-xs text-neutral-500">Manage organizational roles, define granular permissions, and govern access.</p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Audit Log
              </button>
              <button onClick={() => alert('Creating new RBAC role...')} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> New Role
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-neutral-500" /> Permissions Matrix
                </h3>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Filter roles..." className="w-full pl-8 pr-3 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                    <tr>
                      <th className="pb-2">Role Name</th>
                      <th className="pb-2 text-center">Tasks</th>
                      <th className="pb-2 text-center">Projects</th>
                      <th className="pb-2 text-center">OKRs</th>
                      <th className="pb-2 text-center">Analytics</th>
                      <th className="pb-2 text-center">Billing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="py-3.5 font-sans font-bold">System Administrator</td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-sans font-bold">Executive</td>
                      <td className="py-3.5 text-center"><Eye className="w-4 h-4 mx-auto text-neutral-400" /></td>
                      <td className="py-3.5 text-center"><Eye className="w-4 h-4 mx-auto text-neutral-400" /></td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                      <td className="py-3.5 text-center"><Edit2 className="w-4 h-4 mx-auto text-neutral-800 dark:text-neutral-200" /></td>
                      <td className="py-3.5 text-center"><Slash className="w-4 h-4 mx-auto text-neutral-300" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 font-mono">
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">User Assignments</h3>
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">Jane Doe</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">EXECUTIVE</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">John Smith</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">IC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. INTEGRATIONS VIEW */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800 font-mono">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">Integrations &amp; API</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm">Slack</div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[10px] text-neutral-400">Messaging &amp; Alerts</p>
              <button className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold text-xs">Configure</button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm">GitHub</div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[10px] text-neutral-400">Version Control</p>
              <button className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold text-xs">Configure</button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 shadow-sm space-y-4 opacity-90">
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm">Jira</div>
                <span className="w-2 h-2 rounded-full bg-neutral-300" />
              </div>
              <p className="text-[10px] text-neutral-400">Issue Tracking</p>
              <button className="w-full py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs">Connect Integration</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. BILLING VIEW */}
      {activeTab === 'billing' && (
        <div className="space-y-6 font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">Billing Overview</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 uppercase">• Active Subscription</span>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight mt-2">Enterprise Tier</h3>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">$4,999<span className="text-xs text-neutral-400 font-normal">/mo</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Seat Utilization</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">412 / 500 allocated</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '82.4%' }} />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Payment Method</h3>
              <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold">
                **** **** **** 4242
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAGS VIEW */}
      {activeTab === 'tags' && (
        <div className="space-y-6 font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">Tag Management</h1>
            <button className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create New Global Tag</button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                <tr>
                  <th className="pb-2 w-8 text-center" aria-label="Drag handle"></th>
                  <th className="pb-2">Tag Name</th>
                  <th className="pb-2">Applies To</th>
                  <th className="pb-2">Color Swatch</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {tags.map(t => {
                  const isDragging = draggedTagId === t.id;
                  const isDragOver = dragOverTagId === t.id;

                  return (
                    <tr 
                      key={t.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        setDraggedTagId(t.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverTagId !== t.id) setDragOverTagId(t.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverTagId === t.id) setDragOverTagId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleTagDrop(t.id);
                      }}
                      className={`cursor-pointer transition-all ${
                        isDragging ? 'opacity-30 bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      } ${isDragOver ? 'border-t-2 border-t-black dark:border-t-white' : ''}`}
                      onClick={() => pushPanel({ type: 'tag', id: t.id })}
                    >
                      <td className="py-3.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 cursor-grab active:cursor-grabbing mx-auto" />
                      </td>
                      <td className="py-3.5 font-bold font-sans">
                        <span className="px-2 py-0.5 rounded text-xs border" style={{ backgroundColor: t.bgHex, color: t.textHex, borderColor: 'transparent' }}>
                          #{t.name}
                        </span>
                      </td>
                      <td className="py-3.5 text-neutral-500 capitalize">{t.appliesTo.join(', ')}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: t.colorHex }} />
                          <span className="font-mono text-[10px] text-neutral-400">{t.colorHex}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right"><MoreVertical className="w-4 h-4 text-neutral-400 ml-auto" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
