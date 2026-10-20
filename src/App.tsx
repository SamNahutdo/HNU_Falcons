import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BottomNav } from './components/BottomNav';
import { SupabaseModal } from './components/SupabaseModal';
import { IntroAnimation } from './components/IntroAnimation';

import { LoginView } from './pages/LoginView';
import { AdminDashboardView } from './pages/AdminDashboardView';
import { StaffDashboardView } from './pages/StaffDashboardView';
import { CoachDashboardView } from './pages/CoachDashboardView';
import { StudentDashboardView } from './pages/StudentDashboardView';

import { databaseService } from './services/supabase';
import { mockDb } from './services/mockData';
import { UserRole } from './types/database';

export const App: React.FC = () => {
  // Intro animation state: Plays before login page
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Auth state - starts not logged in so intro and login show first
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [userDisplayName, setUserDisplayName] = useState<string>("Ma'am Arbe");
  const [username, setUsername] = useState<string>('arbe');
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Connection mode state
  const [isLiveMode, setIsLiveMode] = useState<boolean>(databaseService.isLive());

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setSearchTerm('');
  };

  const loadAllData = useCallback(async () => {
    try {
      setIsLiveMode(databaseService.isLive());
    } catch (err) {
      console.error('Database mode error:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const unsubscribe = mockDb.subscribe(() => {
      loadAllData();
    });
    return unsubscribe;
  }, [loadAllData]);

  const handleLogin = (role: UserRole, displayName: string, uname: string) => {
    setCurrentRole(role);
    setUserDisplayName(displayName);
    setUsername(uname);
    setIsLoggedIn(true);
    setJustLoggedOut(false);
    if (role === 'staff' || role === 'student') {
      setCurrentTab('equipment');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setJustLoggedOut(true);
  };

  // 1 & 2: Render LoginView always underneath; IntroAnimation sits on top as a fixed overlay.
  // This prevents the white flash — login page is already painted when intro fades out.
  if (!isLoggedIn) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Login page always rendered beneath */}
        <LoginView onLogin={handleLogin} loggedOutNotice={justLoggedOut} />
        {/* Intro overlay sits on top; removed from DOM after complete */}
        {showIntro && (
          <IntroAnimation onComplete={() => setShowIntro(false)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
      {/* SIDEBAR (Role-specific streamlined navigation) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        currentRole={currentRole}
        userDisplayName={userDisplayName}
        username={username}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onLogout={handleLogout}
      />

      {/* MOBILE BACKDROP */}
      {isMobileNavOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setIsMobileNavOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* MAIN WRAPPER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TOPBAR */}
        <Topbar
          onOpenConfig={() => setIsConfigOpen(true)}
          isLive={isLiveMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          userDisplayName={userDisplayName}
          currentRole={currentRole}
          currentTab={currentTab}
        />

        {/* MAIN BODY CONTENT (Role-Tailored Portals driven by Sidebar) */}
        <main className="main-content">
          {/* ADMIN: DASHBOARD AND SEARCHABLE MANAGEMENT PAGES */}
          {currentRole === 'admin' && (
            <AdminDashboardView
              currentTab={currentTab}
              searchTerm={searchTerm}
              onNavigate={handleNavigate}
            />
          )}

          {/* STAFF: CRUD, AVAILABLE DAYS, ALERTS, CONDITION, REPORTS */}
          {currentRole === 'staff' && (
            <StaffDashboardView
              currentRole={currentRole}
              userDisplayName={userDisplayName}
              currentTab={currentTab}
              onNavigate={handleNavigate}
            />
          )}

          {/* COACH: DASHBOARD, STUDENT BOOKINGS, BORROW EQUIPMENT */}
          {currentRole === 'coach' && (
            <CoachDashboardView
              userDisplayName={userDisplayName}
              username={username}
              currentTab={currentTab}
              onNavigate={handleNavigate}
            />
          )}

          {/* STUDENT: AVAILABLE EQUIPMENT, BOOK COACH, WAIT FOR APPROVAL */}
          {currentRole === 'student' && (
            <StudentDashboardView
              userDisplayName={userDisplayName}
              username={username}
              currentTab={currentTab}
              onNavigate={handleNavigate}
            />
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <BottomNav
          currentTab={currentTab}
          setCurrentTab={handleNavigate}
          onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
          currentRole={currentRole}
        />
      </div>

      {/* Supabase Connection Modal */}
      <SupabaseModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigUpdated={loadAllData}
      />
    </div>
  );
};
