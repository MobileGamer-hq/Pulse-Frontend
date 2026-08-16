import React, { useState } from 'react';
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
import { SlideOverDrawer } from './components/common/SlideOverDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SupportModal } from './components/common/SupportModal';
import { InAppNotificationToast } from './components/common/InAppNotificationToast';

const MainLayout: React.FC = () => {
  const { activeScreen, setActiveScreen, isDarkMode } = useApp();

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

  const isAuthScreen = ['signin', 'wizard', 'invite'].includes(activeScreen);

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Top Persistent Role Switcher Toolbar */}
      <RoleSwitcherBar
        onOpenPrivileges={() => setIsPrivilegesOpen(true)}
        onOpenCreateItem={handleOpenCreateItem}
      />

      {isAuthScreen ? (
        <div className="flex-1 overflow-y-auto">
          {activeScreen === 'signin' && (
            <SignInScreen
              onSuccess={() => setActiveScreen('dashboard')}
              onNavigateToSetup={() => setActiveScreen('wizard')}
              onNavigateToInvite={() => setActiveScreen('invite')}
            />
          )}
          {activeScreen === 'wizard' && (
            <OnboardingWizardScreen
              onComplete={() => setActiveScreen('dashboard')}
            />
          )}
          {activeScreen === 'invite' && (
            <InviteAcceptanceScreen
              onComplete={() => setActiveScreen('dashboard')}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* App Shell Left Sidebar */}
          <Sidebar />

          {/* Main Content Viewport */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-7xl w-full mx-auto">
              {activeScreen === 'dashboard' && <DashboardScreen />}
              {activeScreen === 'relationships' && <RelationshipsScreen />}
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
      )}

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
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
