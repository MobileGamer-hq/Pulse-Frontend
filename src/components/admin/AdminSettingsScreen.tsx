import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Building2, Shield, Plug, CreditCard, Tag as TagIcon, 
  Upload, Check, Search, Plus, Edit2, Eye, Slash, 
  ChevronDown, FileText,
  ShieldCheck, Sliders, Sun, Moon, Monitor, 
  User, Bell, Smartphone, Laptop, Clock, GripVertical,
  CheckCircle2, Lock, Zap
} from 'lucide-react';
import { webhooksService } from '../../services/webhooksService';

const getDetectedTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
};

const COMMON_TIMEZONES = [
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Seoul',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'UTC',
];

export const AdminSettingsScreen: React.FC = () => {
  const { 
    isDarkMode, setIsDarkMode, pushPanel, tags, reorderTags, addTag, updateTag, deleteTag,
    currentUser, currentOrgSlug, currentOrgName, activeRole, users 
  } = useApp();

  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [newTagDesc, setNewTagDesc] = useState('');

  // Editing Tag state
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('#3B82F6');
  const [editTagDesc, setEditTagDesc] = useState('');

  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  const initialEmail = localStorage.getItem('pulse_user_email') || currentUser?.email || 'admin@pulse.app';
  const initialName = localStorage.getItem('pulse_user_name') || currentUser?.name || 'Workspace Admin';
  const initialSlug = currentOrgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia';

  // Dynamic Audit Logs State
  const [auditLogs, setAuditLogs] = useState<{ id: string; timestamp: string; actor: string; action: string; target: string; status: string }[]>(() => {
    try {
      const saved = localStorage.getItem(`pulse_audit_logs_${initialSlug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recordAuditLog = (action: string, target: string, status: string = '200 OK') => {
    const newEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: initialName,
      action,
      target,
      status
    };
    setAuditLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(`pulse_audit_logs_${initialSlug}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist audit log', e);
      }
      return updated;
    });
  };

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

  // Settings Tab & SubTab
  const isCompanyAdmin = ['Admin', 'Executive', 'Manager'].includes(activeRole);
  const isBillingAllowed = ['Admin', 'Executive'].includes(activeRole);
  const isRBACAllowed = ['Admin', 'Executive', 'HR'].includes(activeRole);

  const [activeTab, setActiveTab] = useState<'user_profile' | 'appearance' | 'notif_controls' | 'profile' | 'rbac' | 'integrations' | 'billing' | 'tags'>(() => {
    return isCompanyAdmin ? 'profile' : 'user_profile';
  });
  const [companySubTab, setCompanySubTab] = useState<'profile' | 'security' | 'billing' | 'integrations' | 'audit'>('profile');

  React.useEffect(() => {
    if (!isCompanyAdmin && ['profile', 'rbac', 'integrations', 'billing', 'tags'].includes(activeTab)) {
      setActiveTab('user_profile');
    }
  }, [activeRole, isCompanyAdmin, activeTab]);

  // Appearance Settings State
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('pulse_theme');
    if (savedTheme === 'dark') return 'dark';
    if (savedTheme === 'light') return 'light';
    return isDarkMode ? 'dark' : 'light';
  });

  React.useEffect(() => {
    setThemeMode(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [fontSize, setFontSize] = useState('14px');
  const [contrastMode, setContrastMode] = useState(false);

  // Notification Controls State

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

  // Profile & Preferences State - Dynamic logged in user defaults
  const detectedTz = getDetectedTimeZone();
  const [fullName, setFullName] = useState(initialName);
  const [emailAddr, setEmailAddr] = useState(initialEmail);
  const [jobTitle, setJobTitle] = useState(currentUser?.title || 'Workspace Administrator');
  const [department, setDepartment] = useState(currentUser?.teamName || 'Engineering');
  const [deepWorkMode, setDeepWorkMode] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [region, setRegion] = useState('North America');
  const [userTimeZone, setUserTimeZone] = useState<string>(() => {
    const saved = localStorage.getItem('pulse_user_timezone');
    if (saved) return saved;
    return detectedTz;
  });
  const [startOfWeek, setStartOfWeek] = useState<'sunday' | 'monday'>('monday');

  // Sync profile when currentUser or localStorage updates
  React.useEffect(() => {
    const savedName = localStorage.getItem('pulse_user_name');
    const savedEmail = localStorage.getItem('pulse_user_email');
    if (savedName) setFullName(savedName);
    else if (currentUser?.name) setFullName(currentUser.name);

    if (savedEmail) setEmailAddr(savedEmail);
    else if (currentUser?.email) setEmailAddr(currentUser.email);

    if (currentUser?.title) setJobTitle(currentUser.title);
    if (currentUser?.teamName) setDepartment(currentUser.teamName);
  }, [currentUser]);

  // Tenant Company Profile State - default timezone to user's detected location timezone if not set
  const [companyName, setCompanyName] = useState(currentOrgName || (initialSlug.charAt(0).toUpperCase() + initialSlug.slice(1)));
  const [tenantDomain, setTenantDomain] = useState(initialSlug);

  React.useEffect(() => {
    if (currentOrgName) {
      setCompanyName(currentOrgName);
    }
    if (currentOrgSlug) {
      setTenantDomain(currentOrgSlug);
    }
  }, [currentOrgName, currentOrgSlug]);

  const [timeZone, setTimeZone] = useState<string>(() => {
    const saved = localStorage.getItem(`pulse_org_timezone_${initialSlug}`);
    if (saved) return saved;
    return detectedTz;
  });
  const [currency, setCurrency] = useState('USD ($)');
  const [nomenclature, setNomenclature] = useState<'depts' | 'tribes'>('depts');
  const [publicProfile, setPublicProfile] = useState(true);
  const [patternPreset, setPatternPreset] = useState<'minimal' | 'stipple' | 'hatch'>('minimal');

  // Security Subtab State
  const [require2FA, setRequire2FA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('24 hours');
  const [enforceIpAllowlist, setEnforceIpAllowlist] = useState(false);

  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'dark') {
      setIsDarkMode(true);
    } else if (mode === 'light') {
      setIsDarkMode(false);
    } else if (mode === 'system') {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDark);
    }
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

          {isCompanyAdmin && <span className="text-neutral-300 dark:text-neutral-700">|</span>}

          {/* Tenant Admin Settings - Visible only to authorized roles */}
          {isCompanyAdmin && (
            <button
              onClick={() => { setActiveTab('profile'); setCompanySubTab('profile'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'profile' && companySubTab === 'profile'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Company Profile
            </button>
          )}

          {isRBACAllowed && (
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
          )}

          {isCompanyAdmin && (
            <button
              onClick={() => { setActiveTab('profile'); setCompanySubTab('integrations'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                (activeTab === 'profile' && companySubTab === 'integrations') || activeTab === 'integrations'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Plug className="w-3.5 h-3.5" /> Integrations
            </button>
          )}

          {isBillingAllowed && (
            <button
              onClick={() => { setActiveTab('profile'); setCompanySubTab('billing'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                (activeTab === 'profile' && companySubTab === 'billing') || activeTab === 'billing'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Billing
            </button>
          )}

          {isCompanyAdmin && (
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
          )}
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
              <button
                type="button"
                onClick={() => setActiveTab('user_profile')}
                className="w-full text-left p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer"
              >
                Profile &amp; Account
              </button>
              <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100">
                Appearance
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('notif_controls')}
                className="w-full text-left p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer"
              >
                Notifications
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('profile'); setCompanySubTab('security'); }}
                className="w-full text-left p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer"
              >
                Security &amp; Access
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('profile'); setCompanySubTab('integrations'); }}
                className="w-full text-left p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer"
              >
                Integrations
              </button>
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
                    {themeMode === 'light' && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
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
                    {themeMode === 'dark' && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
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
                    {themeMode === 'system' && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
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
                <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">
                  Pro Tip
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
                      <select 
                        value={userTimeZone} 
                        onChange={e => {
                          setUserTimeZone(e.target.value);
                          localStorage.setItem('pulse_user_timezone', e.target.value);
                        }} 
                        className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                      >
                        {Array.from(new Set([detectedTz, userTimeZone, ...COMMON_TIMEZONES])).sort().map(tz => (
                          <option key={tz} value={tz}>
                            {tz} {tz === detectedTz ? '(Your Local Time)' : ''}
                          </option>
                        ))}
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
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                        {typeof navigator !== 'undefined' && navigator.platform.includes('Win') ? 'Windows PC - Web Browser' : 'Current Device - Web Browser'}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        • Current Active Session
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TENANT COMPANY & WORKSPACE ADMIN VIEW (with interactive sub-navigation) */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">ORGANIZATION SETTINGS</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 uppercase">
                  pulse.epicordia.com/{tenantDomain}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans mt-0.5">
                {companySubTab === 'profile' && 'Company Profile'}
                {companySubTab === 'security' && 'Security & Authentication'}
                {companySubTab === 'billing' && 'Billing & Subscription'}
                {companySubTab === 'integrations' && 'Integrations & API Keys'}
                {companySubTab === 'audit' && 'Audit Logs & Compliance'}
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                {companySubTab === 'profile' && 'Manage organization identity, domain slug, and regional localization.'}
                {companySubTab === 'security' && 'Manage authentication policies, 2FA enforcement, and SSO integrations.'}
                {companySubTab === 'billing' && 'Pulse Early Access Beta — All features 100% free with unlimited seats.'}
                {companySubTab === 'integrations' && 'Manage custom webhooks, REST API keys, and third-party integrations.'}
                {companySubTab === 'audit' && 'Real-time security audit trails and organization administrative events.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {companySubTab === 'profile' && (
                <>
                  <button 
                    onClick={() => {
                      setCompanyName(currentOrgName || (initialSlug.charAt(0).toUpperCase() + initialSlug.slice(1)));
                      setTenantDomain(currentOrgSlug || initialSlug);
                    }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.setItem(`pulse_org_timezone_${initialSlug}`, timeZone);
                      recordAuditLog('Organization settings saved', `Timezone: ${timeZone}`);
                      alert('Company profile & timezone configuration saved successfully!');
                    }} 
                    className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm hover:opacity-90 cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </>
              )}

              {companySubTab === 'security' && (
                <button 
                  onClick={() => {
                    recordAuditLog('Security policies updated', `2FA: ${require2FA ? 'Enforced' : 'Optional'}, Session: ${sessionTimeout}`);
                    alert('Security governance policies saved!');
                  }}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm hover:opacity-90 cursor-pointer"
                >
                  Save Security Policies
                </button>
              )}

              {companySubTab === 'integrations' && (
                <>
                  <button 
                    onClick={() => setShowCreateWebhookModal(true)}
                    className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Webhook
                  </button>
                  <button 
                    onClick={() => setShowCreateApiKeyModal(true)}
                    className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Generate API Key
                  </button>
                </>
              )}

              {companySubTab === 'billing' && (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Beta License Active
                </span>
              )}

              {companySubTab === 'audit' && (
                <button 
                  onClick={() => alert('Exporting audit trail format (CSV/JSON)... Coming Soon in Production!')}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Export Audit Log
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Subnav */}
            <div className="space-y-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setCompanySubTab('profile')}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  companySubTab === 'profile'
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Company Profile
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCompanySubTab('security')}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  companySubTab === 'security'
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Security &amp; Auth
                </span>
              </button>

              {isBillingAllowed && (
                <button
                  type="button"
                  onClick={() => setCompanySubTab('billing')}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    companySubTab === 'billing'
                      ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> Billing &amp; Invoices
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Beta</span>
                </button>
              )}


              <button
                type="button"
                onClick={() => setCompanySubTab('integrations')}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  companySubTab === 'integrations'
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Plug className="w-3.5 h-3.5" /> Integrations
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCompanySubTab('audit')}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  companySubTab === 'audit'
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Audit Logs
                </span>
              </button>
            </div>

            {/* Right Form Cards (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* SUBTAB 1: COMPANY PROFILE */}
              {companySubTab === 'profile' && (
                <>
                  {/* General Information Box */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">General Information</h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage the primary identity and workspace domain slug for this organization.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Workspace Slug</label>
                        <div className="flex items-center">
                          <span className="px-3 py-2.5 rounded-l-xl bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs select-none">
                            pulse.epicordia.com/
                          </span>
                          <input
                            type="text"
                            value={tenantDomain}
                            onChange={e => setTenantDomain(e.target.value)}
                            className="flex-1 p-2.5 rounded-r-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono pt-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Organization Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-lg text-neutral-600 dark:text-neutral-300">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer">
                              <Upload className="w-3.5 h-3.5" /> Upload New
                            </button>
                            <button className="text-xs text-neutral-400 hover:text-red-600 cursor-pointer">Remove</button>
                          </div>
                          <p className="text-[10px] text-neutral-400">Recommended: 256x256px SVG or PNG. Max 2MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Localization & Structure Box with Auto-detected Timezone */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Localization &amp; Structure</h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">Define regional defaults, organizational terminology, and timezones.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Primary Time Zone</label>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-detected
                          </span>
                        </div>
                        <div className="relative">
                          <select
                            value={timeZone}
                            onChange={e => {
                              setTimeZone(e.target.value);
                              localStorage.setItem(`pulse_org_timezone_${initialSlug}`, e.target.value);
                            }}
                            className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
                          >
                            {Array.from(new Set([detectedTz, timeZone, ...COMMON_TIMEZONES])).sort().map(tz => (
                              <option key={tz} value={tz}>
                                {tz} {tz === detectedTz ? '(Your Local Time)' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                          Defaulted to user location: <strong className="text-neutral-700 dark:text-neutral-300 font-mono">{detectedTz}</strong>
                        </p>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Default Currency</label>
                        <div className="relative">
                          <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="w-full appearance-none p-2.5 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
                          >
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                            <option>GBP (£)</option>
                            <option>CAD ($)</option>
                            <option>AUD ($)</option>
                            <option>JPY (¥)</option>
                            <option>NGN (₦)</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono pt-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Organizational Nomenclature</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div 
                          onClick={() => setNomenclature('depts')}
                          className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 font-sans transition-all ${
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
                          className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 font-sans transition-all ${
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

                  {/* Public Profile & Branding Box */}
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
                          className={`p-3.5 rounded-xl border cursor-pointer space-y-2 transition-all ${
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
                          className={`p-3.5 rounded-xl border cursor-pointer space-y-2 transition-all ${
                            patternPreset === 'stipple' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          <div className="w-full h-12 bg-[radial-gradient(#9ca3af_1px,transparent_1px)] [background-size:8px_8px] rounded-lg border" />
                          <div className="flex justify-between items-center font-bold text-xs">
                            <span>Stipple Grid</span>
                            {patternPreset === 'stipple' && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <div 
                          onClick={() => setPatternPreset('hatch')}
                          className={`p-3.5 rounded-xl border cursor-pointer space-y-2 transition-all ${
                            patternPreset === 'hatch' ? 'border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          <div className="w-full h-12 bg-repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb_5px,transparent_5px,transparent_10px) rounded-lg border" />
                          <div className="flex justify-between items-center font-bold text-xs">
                            <span>Diagonal Hatch</span>
                            {patternPreset === 'hatch' && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deactivate Tenant Red Box */}
                  <div className="p-6 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-red-600 dark:text-red-400 font-sans">Deactivate Workspace</h4>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">Permanently pause access to this organization and halt all background triggers.</p>
                    </div>

                    <button onClick={() => alert('Initiating workspace deactivation protocol...')} className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 font-bold text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer">
                      Initiate Deactivation
                    </button>
                  </div>
                </>
              )}

              {/* SUBTAB 2: SECURITY & AUTHENTICATION */}
              {companySubTab === 'security' && (
                <>
                  {/* Single Sign-On (SSO / SAML 2.0) Box */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Single Sign-On (SSO &amp; SAML 2.0)</h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase">
                            Coming Soon in Production
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">Enforce enterprise identity providers for all workspace members.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Google Workspace</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Preview</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans">OAuth2 &amp; Google Cloud Directory sync.</p>
                        <button onClick={() => alert('Google SSO integration will be enabled in Pulse 1.0 Production release.')} className="w-full py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          Configure SSO (Soon)
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Okta SAML 2.0</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Preview</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans">Enterprise Okta single sign-on &amp; SCIM.</p>
                        <button onClick={() => alert('Okta SAML 2.0 integration will be enabled in Pulse 1.0 Production release.')} className="w-full py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          Configure SAML (Soon)
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Microsoft Entra ID</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Preview</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans">Azure AD SSO and conditional access.</p>
                        <button onClick={() => alert('Microsoft Entra ID integration will be enabled in Pulse 1.0 Production release.')} className="w-full py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          Configure Entra (Soon)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Governance Policies Box */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Workspace Security Policies</h3>
                    
                    <div className="space-y-4 divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Require Two-Factor Auth (2FA)</div>
                          <p className="text-[10px] text-neutral-400 font-sans">Mandate TOTP authenticator setup for all workspace members upon next login.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setRequire2FA(prev => !prev)}
                          className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${require2FA ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${require2FA ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Session Idle Expiration</div>
                          <p className="text-[10px] text-neutral-400 font-sans">Automatically sign out users after a specified period of inactivity.</p>
                        </div>
                        <div className="relative w-36">
                          <select
                            value={sessionTimeout}
                            onChange={e => setSessionTimeout(e.target.value)}
                            className="w-full appearance-none p-2 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono focus:outline-none cursor-pointer"
                          >
                            <option>1 hour</option>
                            <option>8 hours</option>
                            <option>24 hours</option>
                            <option>7 days</option>
                            <option>30 days</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">IP Allowlisting / CIDR Blocks</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700 uppercase">Coming Soon</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-sans">Restrict workspace access strictly to designated corporate VPN or office IP ranges.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setEnforceIpAllowlist(prev => !prev)}
                          className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${enforceIpAllowlist ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${enforceIpAllowlist ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Domain SSL/TLS Verification Status */}
                  <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3 font-mono">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">Domain Encryption &amp; Verification</div>
                        <div className="text-[10px] text-neutral-500 font-mono">pulse.epicordia.com/{tenantDomain} • TLS 1.3 Active</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Verified
                    </span>
                  </div>
                </>
              )}

              {/* SUBTAB 3: BILLING & INVOICES (Pulse Early Access Beta Tier) */}
              {companySubTab === 'billing' && (
                isBillingAllowed ? (
                  <>
                    {/* Hero Beta Free Tier Card */}

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white dark:from-neutral-800 dark:to-neutral-900 dark:border dark:border-neutral-700 shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-neutral-950 uppercase tracking-wider">
                            Early Access Beta
                          </span>
                          <span className="text-xs text-neutral-300 font-mono">Full Access Free Tier</span>
                        </div>
                        <h2 className="text-2xl font-bold font-sans tracking-tight">Pulse Beta • All-Access Pass</h2>
                      </div>
                      <div className="text-right sm:text-right font-mono">
                        <div className="text-3xl font-bold text-emerald-400">$0<span className="text-sm text-neutral-400 font-normal"> / month</span></div>
                        <div className="text-[10px] text-neutral-300">100% Free during Beta Preview</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-sans leading-relaxed text-neutral-200">
                      <p>
                        You are currently using the <strong>Pulse Early Access Beta</strong>. We are giving your organization <strong>100% full access for free</strong> with all enterprise-grade features unlocked so you can plan, track, and execute seamlessly. Paid subscription plans and self-serve billing will be introduced with tiered pricing in future production versions.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Unlimited Workspace Members &amp; Teams</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Real-time Tasks, Blockers &amp; Subtasks</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Strategic OKRs &amp; Goal Progress Tracking</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Executive Summaries &amp; Daily Standups</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Custom Webhooks &amp; REST API Access</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Role-Based Permissions &amp; Global Tags</span>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Production Pricing Preview */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Upcoming Production Plans</h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">Preview of billing tiers launching in future general availability releases.</p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono border border-neutral-200 dark:border-neutral-700">
                        No credit card required
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Community Free</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">Planned</span>
                        </div>
                        <div className="text-xl font-bold font-sans text-neutral-900 dark:text-neutral-100">$0<span className="text-xs text-neutral-400 font-normal"> / mo</span></div>
                        <p className="text-[10px] text-neutral-500 font-sans">For small teams up to 10 members with essential task boards.</p>
                      </div>

                      <div className="p-4 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-neutral-900 space-y-3 relative shadow-sm">
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[8px] font-bold bg-black text-white dark:bg-white dark:text-black uppercase tracking-wider">
                          Coming Soon
                        </span>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Pro Team</span>
                        </div>
                        <div className="text-xl font-bold font-sans text-neutral-900 dark:text-neutral-100">$19<span className="text-xs text-neutral-400 font-normal"> / seat / mo</span></div>
                        <p className="text-[10px] text-neutral-500 font-sans">Unlimited projects, advanced OKR tracking, executive summaries &amp; webhooks.</p>
                      </div>

                      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Enterprise</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">Custom</span>
                        </div>
                        <div className="text-xl font-bold font-sans text-neutral-900 dark:text-neutral-100">Contact Us</div>
                        <p className="text-[10px] text-neutral-500 font-sans">Custom SSO, dedicated audit logs, SIEM export, and SLA guarantees.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold">Access Restricted</h2>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">Only Organization Administrators and Executives have permission to view billing, invoices, and subscription plans.</p>
                </div>
              ))}


              {/* SUBTAB 4: INTEGRATIONS & API KEYS */}
              {companySubTab === 'integrations' && (
                <>
                  {/* Webhook Modal */}
                  {showCreateWebhookModal && (
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-4 shadow-sm">
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Register New Webhook Endpoint</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Webhook Name (e.g. CI/CD Deploy Alert)"
                          value={newWebhookName}
                          onChange={e => setNewWebhookName(e.target.value)}
                          className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                        />
                        <input
                          type="url"
                          placeholder="Target URL (https://example.com/webhook)"
                          value={newWebhookUrl}
                          onChange={e => setNewWebhookUrl(e.target.value)}
                          className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowCreateWebhookModal(false)}
                          className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!newWebhookName || !newWebhookUrl) return alert('Please enter name and URL');
                            try {
                              await webhooksService.createWebhook(currentOrgSlug, {
                                name: newWebhookName,
                                targetUrl: newWebhookUrl,
                                eventTriggers: ['task.created', 'task.blocked'],
                              });
                              recordAuditLog('Webhook registered', newWebhookName);
                              alert(`Webhook "${newWebhookName}" registered successfully!`);
                              setShowCreateWebhookModal(false);
                              setNewWebhookName('');
                              setNewWebhookUrl('');
                            } catch (err: any) {
                              alert(err.message || 'Failed to create webhook');
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer"
                        >
                          Save Webhook
                        </button>
                      </div>
                    </div>
                  )}

                  {/* API Key Modal */}
                  {showCreateApiKeyModal && (
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-4 shadow-sm">
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Generate Organization API Key</h3>
                      <input
                        type="text"
                        placeholder="API Key Name (e.g. Production Service Role)"
                        value={newApiKeyName}
                        onChange={e => setNewApiKeyName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                      />
                      {generatedApiKey && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs break-all">
                          <div className="font-bold mb-1">Generated Key (copy now, it will not be shown again):</div>
                          <code>{generatedApiKey}</code>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setShowCreateApiKeyModal(false); setGeneratedApiKey(null); }}
                          className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                        >
                          Close
                        </button>
                        {!generatedApiKey && (
                          <button
                            onClick={async () => {
                              if (!newApiKeyName) return alert('Please enter key name');
                              try {
                                const res = await webhooksService.createApiKey(currentOrgSlug, {
                                  name: newApiKeyName,
                                  scopes: ['read', 'write'],
                                });
                                recordAuditLog('API key generated', newApiKeyName);
                                setGeneratedApiKey(res.secretKey || 'Key Created');
                                setNewApiKeyName('');
                              } catch (err: any) {
                                alert(err.message || 'Failed to create API Key');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer"
                          >
                            Generate Key
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Native Connectors Card (Coming Soon in Production) */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Third-Party Connectors</h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase">
                            Coming Soon in Production
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">Native 1-click connectors are in active development. Use Webhooks and API Keys below for custom workflows.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Slack</div>
                            <p className="text-[10px] text-neutral-400 font-sans">Notifications &amp; /pulse slash commands</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Soon</span>
                        </div>
                        <button onClick={() => alert('Slack connector is in active development for the Pulse 1.0 Production release.')} className="w-full py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          Connect Slack (Coming Soon)
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">GitHub</div>
                            <p className="text-[10px] text-neutral-400 font-sans">Auto-link PRs &amp; commits to tasks</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Soon</span>
                        </div>
                        <button onClick={() => alert('GitHub connector is in active development for the Pulse 1.0 Production release.')} className="w-full py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          Connect GitHub (Coming Soon)
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-xs font-sans text-neutral-900 dark:text-neutral-100">Jira &amp; Linear</div>
                            <p className="text-[10px] text-neutral-400 font-sans">Bidirectional sprint &amp; issue sync</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Soon</span>
                        </div>
                        <button onClick={() => alert('Jira & Linear sync connectors are in active development for the Pulse 1.0 Production release.')} className="w-full py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          Connect Jira/Linear (Coming Soon)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Custom Webhooks & API Integration Box */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Programmatic Webhooks &amp; REST API</h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">Listen for real-time task lifecycle events or query the organization REST API.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" /> Webhook Events Supported
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          <code>task.created</code>, <code>task.blocked</code>, <code>task.completed</code>, <code>goal.updated</code>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowCreateWebhookModal(true)} 
                        className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm hover:opacity-90 cursor-pointer whitespace-nowrap"
                      >
                        Add Webhook Endpoint
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SUBTAB 5: AUDIT LOGS & COMPLIANCE */}
              {companySubTab === 'audit' && (
                <>
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Audit Trail &amp; Activity Stream</h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Live Recording</span>
                        </div>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">Immutable audit record of administrative events, role changes, and security updates.</p>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-neutral-400">SIEM Stream:</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                          Coming Soon in Production
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="text-[10px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 uppercase">
                          <tr>
                            <th className="pb-2">Timestamp</th>
                            <th className="pb-2">Actor</th>
                            <th className="pb-2">Event Action</th>
                            <th className="pb-2">Target</th>
                            <th className="pb-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-sans">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-neutral-400 font-mono text-xs">
                                No administrative audit logs recorded yet in this workspace.
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map(log => (
                              <tr key={log.id}>
                                <td className="py-3 font-mono text-[11px] text-neutral-400">{log.timestamp}</td>
                                <td className="py-3 font-bold text-xs">{log.actor}</td>
                                <td className="py-3 text-xs">{log.action}</td>
                                <td className="py-3 font-mono text-xs text-neutral-500">{log.target}</td>
                                <td className="py-3 text-right">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">{log.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
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
              <button 
                onClick={() => { setActiveTab('profile'); setCompanySubTab('audit'); }}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Audit Log
              </button>
              <button onClick={() => alert('Creating new RBAC role...')} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
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
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans">User Assignments</h3>
                  <span className="text-[10px] text-neutral-400">{users.length} {users.length === 1 ? 'member' : 'members'}</span>
                </div>
                <div className="space-y-3 font-sans max-h-80 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{fullName}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">{activeRole || 'ADMIN'}</span>
                    </div>
                  ) : (
                    users.map(u => (
                      <div key={u.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                          <div>
                            <span className="font-bold block">{u.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">
                          {u.role || 'MEMBER'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. INTEGRATIONS VIEW (Redirects to unified company subtab or renders standalone) */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">Integrations &amp; API Keys</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage webhooks, API tokens, and connected services.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowCreateWebhookModal(true)}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Webhook
              </button>
              <button 
                onClick={() => setShowCreateApiKeyModal(true)}
                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Generate API Key
              </button>
            </div>
          </div>

          {/* Webhook Modal */}
          {showCreateWebhookModal && (
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Register New Webhook Endpoint</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Webhook Name (e.g. CI/CD Deploy Alert)"
                  value={newWebhookName}
                  onChange={e => setNewWebhookName(e.target.value)}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="Target URL (https://example.com/webhook)"
                  value={newWebhookUrl}
                  onChange={e => setNewWebhookUrl(e.target.value)}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateWebhookModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newWebhookName || !newWebhookUrl) return alert('Please enter name and URL');
                    try {
                      await webhooksService.createWebhook(currentOrgSlug, {
                        name: newWebhookName,
                        targetUrl: newWebhookUrl,
                        eventTriggers: ['task.created', 'task.blocked'],
                      });
                      alert(`Webhook "${newWebhookName}" registered successfully!`);
                      setShowCreateWebhookModal(false);
                      setNewWebhookName('');
                      setNewWebhookUrl('');
                    } catch (err: any) {
                      alert(err.message || 'Failed to create webhook');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Webhook
                </button>
              </div>
            </div>
          )}

          {/* API Key Modal */}
          {showCreateApiKeyModal && (
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Generate Organization API Key</h3>
              <input
                type="text"
                placeholder="API Key Name (e.g. Production Service Role)"
                value={newApiKeyName}
                onChange={e => setNewApiKeyName(e.target.value)}
                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
              />
              {generatedApiKey && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs break-all">
                  <div className="font-bold mb-1">Generated Key (copy now, it will not be shown again):</div>
                  <code>{generatedApiKey}</code>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowCreateApiKeyModal(false); setGeneratedApiKey(null); }}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                {!generatedApiKey && (
                  <button
                    onClick={async () => {
                      if (!newApiKeyName) return alert('Please enter key name');
                      try {
                        const res = await webhooksService.createApiKey(currentOrgSlug, {
                          name: newApiKeyName,
                          scopes: ['read', 'write'],
                        });
                        setGeneratedApiKey(res.secretKey || 'Key Created');
                        setNewApiKeyName('');
                      } catch (err: any) {
                        alert(err.message || 'Failed to create API Key');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Generate Key
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans">Third-Party Connectors</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase">
                Coming Soon in Production
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono">Native third-party integrations are currently in active development for the production release.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm font-sans">Slack</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Soon</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans">Messaging &amp; Alerts</p>
                <button onClick={() => alert('Slack connector is coming soon in the production release.')} className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Configure (Soon)
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm font-sans">GitHub</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Soon</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans">Version Control</p>
                <button onClick={() => alert('GitHub connector is coming soon in the production release.')} className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Configure (Soon)
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm font-sans">Jira &amp; Linear</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">Soon</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans">Issue Tracking</p>
                <button onClick={() => alert('Jira & Linear connectors are coming soon in the production release.')} className="w-full py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs cursor-pointer hover:opacity-90">
                  Connect (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. BILLING VIEW (Standalone Top Tab) */}
      {activeTab === 'billing' && (
        isBillingAllowed ? (
          <div className="space-y-6 font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">Billing &amp; Subscription</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                    Beta Free Tier
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">Pulse Early Access Beta — All features 100% free with unlimited seats.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white dark:from-neutral-800 dark:to-neutral-900 dark:border dark:border-neutral-700 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-neutral-950 uppercase tracking-wider">
                      Early Access Beta
                    </span>
                    <span className="text-xs text-neutral-300 font-mono">Full Access Free Tier</span>
                  </div>
                  <h2 className="text-2xl font-bold font-sans tracking-tight">Pulse Beta • All-Access Pass</h2>
                </div>
                <div className="text-right sm:text-right font-mono">
                  <div className="text-3xl font-bold text-emerald-400">$0<span className="text-sm text-neutral-400 font-normal"> / month</span></div>
                  <div className="text-[10px] text-neutral-300">100% Free during Beta Preview</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-sans leading-relaxed text-neutral-200">
                <p>
                  You are currently using the <strong>Pulse Early Access Beta</strong>. We are giving your organization <strong>100% full access for free</strong> with all enterprise-grade features unlocked so you can plan, track, and execute seamlessly. Paid subscription plans and self-serve billing will be introduced with tiered pricing in future production versions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-neutral-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Workspace Members &amp; Teams</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time Tasks, Blockers &amp; Subtasks</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Strategic OKRs &amp; Goal Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Executive Summaries &amp; Daily Standups</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Webhooks &amp; REST API Access</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Role-Based Permissions &amp; Global Tags</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-4 font-sans">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Access Restricted</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-mono">Only Organization Administrators and Executives have permission to view billing, invoices, and subscription plans.</p>
          </div>
        )
      )}


      {/* 8. TAGS VIEW */}
      {activeTab === 'tags' && (
        <div className="space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">Tag Management</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Define cross-cutting tags for tasks, projects, goals, and team members.</p>
            </div>
            <button 
              onClick={() => setShowCreateTagModal(prev => !prev)}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> {showCreateTagModal ? 'Close Form' : 'Create New Global Tag'}
            </button>
          </div>

          {/* Inline Create Tag Form */}
          {showCreateTagModal && (
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Create New Organization Tag</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Tag Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Security, Backend, HighPriority"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Color Theme</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={e => setNewTagColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={newTagColor}
                      onChange={e => setNewTagColor(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief scope of this tag..."
                    value={newTagDesc}
                    onChange={e => setNewTagDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateTagModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newTagName.trim()) return alert('Tag name is required');
                    const color = newTagColor || '#3B82F6';
                    await addTag({
                      orgId: currentOrgSlug,
                      name: newTagName.trim(),
                      colorHex: color,
                      bgHex: `${color}1A`,
                      textHex: color,
                      description: newTagDesc,
                      createdBy: currentUser.id,
                      appliesTo: ['task', 'project', 'person', 'goal'],
                    });
                    recordAuditLog('Global tag created', `#${newTagName.trim()}`);
                    setNewTagName('');
                    setNewTagDesc('');
                    setShowCreateTagModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm"
                >
                  Save &amp; Persist Tag
                </button>
              </div>
            </div>
          )}

          {/* Inline Edit Tag Form */}
          {editingTagId && (
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans">Edit Tag</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Tag Name</label>
                  <input
                    type="text"
                    value={editTagName}
                    onChange={e => setEditTagName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Color Theme</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editTagColor}
                      onChange={e => setEditTagColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editTagColor}
                      onChange={e => setEditTagColor(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={editTagDesc}
                    onChange={e => setEditTagDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingTagId(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editTagName.trim()) return alert('Tag name is required');
                    const color = editTagColor || '#3B82F6';
                    await updateTag(editingTagId, {
                      name: editTagName.trim(),
                      colorHex: color,
                      bgHex: `${color}1A`,
                      textHex: color,
                      description: editTagDesc
                    });
                    recordAuditLog('Global tag updated', `#${editTagName.trim()}`);
                    setEditingTagId(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            {tags.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs">
                No tags created yet. Click "Create New Global Tag" above to define organization tags.
              </div>
            ) : (
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
                          <span className="px-2 py-0.5 rounded text-xs border" style={{ backgroundColor: t.bgHex || '#3B82F61A', color: t.textHex || t.colorHex, borderColor: 'transparent' }}>
                            #{t.name}
                          </span>
                        </td>
                        <td className="py-3.5 text-neutral-500 capitalize">{t.appliesTo?.join(', ') || 'All Entities'}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: t.colorHex }} />
                            <span className="font-mono text-[10px] text-neutral-400">{t.colorHex}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingTagId(t.id);
                              setEditTagName(t.name);
                              setEditTagColor(t.colorHex);
                              setEditTagDesc(t.description || '');
                            }}
                            className="px-2.5 py-1 rounded text-[10px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              deleteTag(t.id);
                              recordAuditLog('Global tag deleted', `#${t.name}`);
                            }}
                            className="px-2.5 py-1 rounded text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
