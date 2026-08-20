import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { RoleSwitcherBar } from './components/common/RoleSwitcherBar';
import { RolePrivilegesModal } from './components/common/RolePrivilegesModal';
import { CreateItemModal, type ItemType } from './components/common/CreateItemModal';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { TasksScreen } from './components/tasks/TasksScreen';
import { DailyPulseScreen } from './components/pulse/DailyPulseScreen';
import { ProjectsScreen } from './components/projects/ProjectsScreen';
import { GoalsScreen } from './components/goals/GoalsScreen';
import { AnalyticsScreen } from './components/analytics/AnalyticsScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { TeamScreen } from './components/team/TeamScreen';
import { AdminSettingsScreen } from './components/admin/AdminSettingsScreen';
import { NotificationsScreen } from './components/notifications/NotificationsScreen';
import { RelationshipsScreen } from './components/relationships/RelationshipsScreen';
import { SignInScreen } from './components/auth/SignInScreen';
import { OnboardingWizardScreen } from './components/auth/OnboardingWizardScreen';
import { InviteAcceptanceScreen } from './components/auth/InviteAcceptanceScreen';
import { OrgSwitcherScreen } from './components/auth/OrgSwitcherScreen';
import { TenantGuard } from './components/auth/TenantGuard';
import { SlideOverDrawer } from './components/common/SlideOverDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SupportModal } from './components/common/SupportModal';
import { InAppNotificationToast } from './components/common/InAppNotificationToast';

const OrgRouteSync: React.FC = () => {
  const { orgSlug, screen, taskId, projectId } = useParams<{ orgSlug?: string; screen?: string; taskId?: string; projectId?: string }>();
  const { activeScreen, setActiveScreen, currentOrgSlug, setCurrentOrgSlug, pushPanel, panelStack } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync route params into AppContext
  useEffect(() => {
    if (orgSlug && orgSlug.toLowerCase() !== currentOrgSlug) {
      setCurrentOrgSlug(orgSlug.toLowerCase());
    }
    
    // Determine current screen from route segment or pathname
    let targetScreen = screen || 'dashboard';
    if (location.pathname.includes('/tasks')) targetScreen = 'tasks';
    else if (location.pathname.includes('/projects')) targetScreen = 'projects';
    else if (location.pathname.includes('/pulse')) targetScreen = 'pulse';
    else if (location.pathname.includes('/relationships')) targetScreen = 'relationships';
    else if (location.pathname.includes('/goals')) targetScreen = 'goals';
    else if (location.pathname.includes('/analytics')) targetScreen = 'analytics';
    else if (location.pathname.includes('/reports')) targetScreen = 'reports';
    else if (location.pathname.includes('/team')) targetScreen = 'team';
    else if (location.pathname.includes('/admin')) targetScreen = 'admin';

    if (targetScreen !== activeScreen) {
      setActiveScreen(targetScreen);
    }

    // Handle nested entity drawers (e.g. /tasks/:taskId or /projects/:projectId)
    if (taskId && !panelStack.some(p => p.type === 'task' && p.id === taskId)) {
      pushPanel({ type: 'task', id: taskId });
    } else if (projectId && !panelStack.some(p => p.type === 'project' && p.id === projectId)) {
      pushPanel({ type: 'project', id: projectId });
    }
  }, [orgSlug, screen, taskId, projectId]);

  // Sync activeScreen state changes back into URL if changed programmatically
  useEffect(() => {
    const currentBase = `/${currentOrgSlug || 'epicordia'}`;
    if (location.pathname.startsWith(currentBase)) {
      const targetPath = `${currentBase}/${activeScreen}`;
      if (location.pathname !== targetPath && !taskId && !projectId) {
        navigate(targetPath, { replace: false });
      }
    }
  }, [activeScreen, currentOrgSlug]);

  return null;
};

const MainLayout: React.FC = () => {
  const { activeScreen, isDarkMode } = useApp();

  const [isPrivilegesOpen, setIsPrivilegesOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [createItemType, setCreateItemType] = useState<ItemType>('task');

  // Listen for custom trigger events from sub-screens
  React.useEffect(() => {
    const handleOpenCreateModal = (e: CustomEvent<{ type?: ItemType }>) => {
      setCreateItemType(e.detail?.type || 'task');
      setIsCreateItemOpen(true);
    };

    window.addEventListener('pulse:open-create-item' as any, handleOpenCreateModal);
    return () => window.removeEventListener('pulse:open-create-item' as any, handleOpenCreateModal);
  }, []);

  // Sync dark mode class on document element
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleOpenCreateItem = (type?: ItemType) => {
    setCreateItemType(type || 'task');
    setIsCreateItemOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <OrgRouteSync />

      {/* Top Persistent Role Switcher Toolbar */}
      <RoleSwitcherBar
        onOpenPrivileges={() => setIsPrivilegesOpen(true)}
        onOpenCreateItem={handleOpenCreateItem}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* App Shell Left Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-7xl w-full mx-auto">
            {activeScreen === 'dashboard' && <DashboardScreen />}
            {(activeScreen === 'relationships' || activeScreen === 'lab-relationships' || activeScreen === 'spiderweb-relationships') && <RelationshipsScreen />}
            {activeScreen === 'tasks' && <TasksScreen />}
            {activeScreen === 'pulse' && <DailyPulseScreen />}
            {activeScreen === 'projects' && <ProjectsScreen />}
            {activeScreen === 'goals' && <GoalsScreen />}
            {activeScreen === 'analytics' && <AnalyticsScreen />}
            {activeScreen === 'reports' && <ReportsScreen />}
            {activeScreen === 'team' && <TeamScreen />}
            {activeScreen === 'admin' && <AdminSettingsScreen />}
            {activeScreen === 'notifications' && <NotificationsScreen />}
          </main>
        </div>
      </div>

      {/* Slide-over Drawer for Entity Details & Stacked Panels */}
      <SlideOverDrawer />

      {/* Omni Global Search Modal */}
      <GlobalSearchModal />

      {/* Support Help Desk Modal */}
      <SupportModal />

      {/* Interactive In-App Notification Toast */}
      <InAppNotificationToast />

      {/* Role Privileges & Access Matrix Guide Modal */}
      <RolePrivilegesModal
        isOpen={isPrivilegesOpen}
        onClose={() => setIsPrivilegesOpen(false)}
      />

      {/* Interactive Item Creation Modal */}
      <CreateItemModal
        isOpen={isCreateItemOpen}
        initialType={createItemType}
        onClose={() => setIsCreateItemOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Public & Global Auth Routes */}
          <Route path="/" element={<Navigate to="/epicordia/dashboard" replace />} />
          <Route path="/login" element={
            <SignInScreen
              onSuccess={() => window.location.href = '/epicordia/dashboard'}
              onNavigateToSetup={() => window.location.href = '/register'}
              onNavigateToInvite={() => window.location.href = '/invite/demo'}
            />
          } />
          <Route path="/register" element={
            <OnboardingWizardScreen onComplete={() => window.location.href = '/epicordia/dashboard'} />
          } />
          <Route path="/invite/:token" element={
            <InviteAcceptanceScreen onComplete={() => window.location.href = '/epicordia/dashboard'} />
          } />
          <Route path="/select-org" element={<OrgSwitcherScreen />} />

          {/* Tenant Guarded Routes (/:orgSlug/...) */}
          <Route path="/:orgSlug" element={<TenantGuard><Outlet /></TenantGuard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MainLayout />} />
            <Route path="tasks" element={<MainLayout />} />
            <Route path="tasks/:taskId" element={<MainLayout />} />
            <Route path="pulse" element={<MainLayout />} />
            <Route path="relationships" element={<MainLayout />} />
            <Route path="projects" element={<MainLayout />} />
            <Route path="projects/:projectId" element={<MainLayout />} />
            <Route path="goals" element={<MainLayout />} />
            <Route path="analytics" element={<MainLayout />} />
            <Route path="reports" element={<MainLayout />} />
            <Route path="team" element={<MainLayout />} />
            <Route path="admin" element={<MainLayout />} />
            <Route path="notifications" element={<MainLayout />} />
            <Route path=":screen" element={<MainLayout />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/epicordia/dashboard" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
