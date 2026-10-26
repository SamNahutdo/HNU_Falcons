import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { IntroAnimation } from './components/IntroAnimation';

import { LoginView } from './pages/LoginView';
import { AdminDashboardView } from './pages/AdminDashboardView';
import { StaffDashboardView } from './pages/StaffDashboardView';
import { CoachDashboardView } from './pages/CoachDashboardView';
import { StudentDashboardView } from './pages/StudentDashboardView';

import { UserRole } from './types/database';
import { authService } from './services/supabase';

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    sessionStorage.removeItem('falcon_portal_session');
    authService.getCurrentProfile()
      .then(profile => {
        if (!active || !profile) return;
        setCurrentRole(profile.role);
        setUserDisplayName(profile.fullName);
        setUsername(profile.email);
        setCurrentTab(profile.role === 'staff' || profile.role === 'student' ? 'equipment' : 'dashboard');
        setIsLoggedIn(true);
        setShowIntro(false);
      })
      .catch((error: unknown) => {
        if (active) {
          setAuthError(error instanceof Error
            ? error.message
            : 'Could not verify the saved sign-in. Please sign in again.');
        }
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isDashboardLoading) return;

    const timer = window.setTimeout(() => setIsDashboardLoading(false), 1500);
    return () => window.clearTimeout(timer);
  }, [isDashboardLoading]);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setSearchTerm('');
  };

  const handleLogin = (role: UserRole, displayName: string, uname: string) => {
    setIsDashboardLoading(true);
    setAuthError(null);
    setCurrentRole(role);
    setUserDisplayName(displayName);
    setUsername(uname);
    setIsLoggedIn(true);
    setJustLoggedOut(false);
    const tab = role === 'staff' || role === 'student' ? 'equipment' : 'dashboard';
    setCurrentTab(tab);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setJustLoggedOut(true);
    setShowIntro(false);
    authService.signOut().catch((error: unknown) => {
      setAuthError(error instanceof Error ? error.message : 'Could not sign out.');
    });
  };

  if (isAuthLoading) {
    return <div className="login-page-wrapper" role="status">Verifying your sign-in…</div>;
  }

  // 1 & 2: Render LoginView always underneath; IntroAnimation sits on top as a fixed overlay.
  // This prevents the white flash — login page is already painted when intro fades out.
  if (!isLoggedIn) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Login page always rendered beneath */}
        <LoginView
          onLogin={handleLogin}
          loggedOutNotice={justLoggedOut}
          initialError={authError}
        />
        {/* Intro overlay sits on top; removed from DOM after complete */}
        {showIntro && (
          <IntroAnimation onComplete={() => setShowIntro(false)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
      {isDashboardLoading && (
        <div className="dashboard-loading-overlay" role="status" aria-live="polite">
          <div className="dashboard-loading-mark">
            <img src={`${import.meta.env.BASE_URL}images/Logo.png`} alt="" />
          </div>
          <p>Preparing your dashboard</p>
        </div>
      )}

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
        {/* MAIN BODY CONTENT (Role-Tailored Portals driven by Sidebar) */}
        <main className="main-content">
          {/* ADMIN: DASHBOARD AND SEARCHABLE MANAGEMENT PAGES */}
          {currentRole === 'admin' && (
            <AdminDashboardView
              currentTab={currentTab}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
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

    </div>
  );
};
