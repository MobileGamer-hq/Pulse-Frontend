import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { RoleSwitcherBar } from './components/common/RoleSwitcherBar';
import { RolePrivilegesModal } from './components/common/RolePrivilegesModal';
import { CreateItemModal, type ItemType } from './components/common/CreateItemModal';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { TasksScreen } from './components/tasks/TasksScreen';
import { ScheduleScreen } from './components/schedule/ScheduleScreen';
import { DailyPulseScreen } from './components/pulse/DailyPulseScreen';
import { ProjectsScreen } from './components/projects/ProjectsScreen';
import { GoalsScreen } from './components/goals/GoalsScreen';
import { AnalyticsScreen } from './components/analytics/AnalyticsScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { TeamScreen } from './components/team/TeamScreen';
import { AdminSettingsScreen } from './components/admin/AdminSettingsScreen';
import { ArchiveScreen } from './components/common/ArchiveScreen';
import { NotificationsScreen } from './components/notifications/NotificationsScreen';
import { RelationshipsScreen } from './components/relationships/RelationshipsScreen';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { SignInScreen } from './components/auth/SignInScreen';
import { SignUpScreen } from './components/auth/SignUpScreen';
import { CreateOrgScreen } from './components/auth/CreateOrgScreen';
import { JoinOrgScreen } from './components/auth/JoinOrgScreen';
import { InviteAcceptanceScreen } from './components/auth/InviteAcceptanceScreen';
import { OrgSwitcherScreen } from './components/auth/OrgSwitcherScreen';
import { WaitingRoomScreen } from './components/auth/WaitingRoomScreen';
import { TenantGuard } from './components/auth/TenantGuard';
import { AnimatePresence } from 'framer-motion';
import { WorkspaceGlassLoader } from './components/common/WorkspaceGlassLoader';
import { SlideOverDrawer } from './components/common/SlideOverDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SupportModal } from './components/common/SupportModal';
import { InAppNotificationToast } from './components/common/InAppNotificationToast';
import { OpsDrawer } from './components/common/OpsDrawer';
import { supabase } from './services/supabaseClient';

const OrgRouteSync: React.FC = () => {
  const { orgSlug, screen, taskId, projectId } = useParams<{ orgSlug?: string; screen?: string; taskId?: string; projectId?: string }>();
  const { setActiveScreen, currentOrgSlug, setCurrentOrgSlug, pushPanel, panelStack } = useApp();
  const location = useLocation();

  // Sync route params into AppContext
  useEffect(() => {
    if (orgSlug && orgSlug.toLowerCase() !== currentOrgSlug) {
      setCurrentOrgSlug(orgSlug.toLowerCase());
    }
    
    // Determine current screen from route segment or pathname
    let targetScreen = screen || 'dashboard';
    const path = location.pathname.toLowerCase();
    if (path.includes('/tasks')) targetScreen = 'tasks';
    else if (path.includes('/schedule')) targetScreen = 'schedule';
    else if (path.includes('/projects')) targetScreen = 'projects';
    else if (path.includes('/pulse')) targetScreen = 'pulse';
    else if (path.includes('/relationships') || path.includes('/spiderweb-relationships') || path.includes('/lab-relationships')) targetScreen = 'relationships';
    else if (path.includes('/goals')) targetScreen = 'goals';
    else if (path.includes('/analytics')) targetScreen = 'analytics';
    else if (path.includes('/reports')) targetScreen = 'reports';
    else if (path.includes('/team')) targetScreen = 'team';
    else if (path.includes('/admin')) targetScreen = 'admin';
    else if (path.includes('/archive')) targetScreen = 'archive';
    else if (path.includes('/notifications')) targetScreen = 'notifications';

    setActiveScreen(targetScreen);

    // Handle nested entity drawers (e.g. /tasks/:taskId or /projects/:projectId)
    if (taskId && !panelStack.some(p => p.type === 'task' && p.id === taskId)) {
      pushPanel({ type: 'task', id: taskId });
    } else if (projectId && !panelStack.some(p => p.type === 'project' && p.id === projectId)) {
      pushPanel({ type: 'project', id: projectId });
    }
  }, [orgSlug, screen, taskId, projectId, location.pathname, currentOrgSlug]);

  return null;
};

const MainLayout: React.FC = () => {
  const { activeScreen, isDarkMode, isWorkspaceLoading, isOpsOpen, setIsOpsOpen } = useApp();

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
    <div className="flex flex-col h-screen bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800 relative">
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
            {activeScreen === 'schedule' && <ScheduleScreen />}
            {activeScreen === 'pulse' && <DailyPulseScreen />}
            {activeScreen === 'projects' && <ProjectsScreen />}
            {activeScreen === 'goals' && <GoalsScreen />}
            {activeScreen === 'analytics' && <AnalyticsScreen />}
            {activeScreen === 'reports' && <ReportsScreen />}
            {activeScreen === 'team' && <TeamScreen />}
            {activeScreen === 'admin' && <AdminSettingsScreen />}
            {activeScreen === 'archive' && <ArchiveScreen />}
            {activeScreen === 'notifications' && <NotificationsScreen />}
          </main>
        </div>
      </div>

      {/* Floating Glass Background Blur Loading Screen */}
      <AnimatePresence>
        {isWorkspaceLoading && <WorkspaceGlassLoader />}
      </AnimatePresence>

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

      {/* Ops AI Operational Manager Drawer */}
      <OpsDrawer
        isOpen={isOpsOpen}
        onClose={() => setIsOpsOpen(false)}
      />
    </div>
  );
};

const RootRedirector: React.FC = () => {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [targetRedirect, setTargetRedirect] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session?.user) {
        setTargetRedirect('/welcome');
        setSessionChecked(true);
        return;
      }

      // Stop taking user to an organization by default when opening the app; take to select-org
      setTargetRedirect('/select-org');
      setSessionChecked(true);
    });
  }, []);

  if (!sessionChecked) {
    return <WorkspaceGlassLoader />;
  }

  return <Navigate to={targetRedirect || '/welcome'} replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Public & Global Auth Routes */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/login" element={
            <SignInScreen
              onSuccess={() => {
                window.location.href = '/select-org';
              }}
              onNavigateToSetup={() => window.location.href = '/register'}
              onNavigateToInvite={() => window.location.href = '/invite/demo'}
            />
          } />
          <Route path="/signin" element={
            <SignInScreen
              onSuccess={() => {
                window.location.href = '/select-org';
              }}
              onNavigateToSetup={() => window.location.href = '/register'}
              onNavigateToInvite={() => window.location.href = '/invite/demo'}
            />
          } />
          <Route path="/register" element={<SignUpScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/select-org" element={<OrgSwitcherScreen />} />
          <Route path="/create-org" element={<CreateOrgScreen />} />
          <Route path="/join-org" element={<JoinOrgScreen />} />
          <Route path="/invite/:token" element={
            <InviteAcceptanceScreen onComplete={() => {
              const slug = localStorage.getItem('pulse_tenant_slug') || 'epicordia';
              window.location.href = `/${slug}/dashboard`;
            }} />
          } />

          {/* Tenant Guarded Routes (/:orgSlug/...) */}
          <Route path="/:orgSlug" element={<TenantGuard><Outlet /></TenantGuard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="waiting-room" element={<WaitingRoomScreen />} />
            <Route element={<MainLayout />}>
              <Route path="dashboard" element={null} />
              <Route path="tasks" element={null} />
              <Route path="tasks/:taskId" element={null} />
              <Route path="schedule" element={null} />
              <Route path="pulse" element={null} />
              <Route path="relationships" element={null} />
              <Route path="spiderweb-relationships" element={null} />
              <Route path="lab-relationships" element={null} />
              <Route path="projects" element={null} />
              <Route path="projects/:projectId" element={null} />
              <Route path="goals" element={null} />
              <Route path="analytics" element={null} />
              <Route path="reports" element={null} />
              <Route path="team" element={null} />
              <Route path="admin" element={null} />
              <Route path="archive" element={null} />
              <Route path="notifications" element={null} />
              <Route path=":screen" element={null} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirector />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
