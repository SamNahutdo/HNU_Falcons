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

const PORTAL_SESSION_KEY = 'falcon_portal_session';

interface PortalSession {
  role: UserRole;
  displayName: string;
  username: string;
  currentTab: string;
}

const isUserRole = (role: unknown): role is UserRole =>
  role === 'admin' || role === 'staff' || role === 'coach' || role === 'student';

const getPortalSession = (): PortalSession | null => {
  const savedSession = sessionStorage.getItem(PORTAL_SESSION_KEY);
  if (!savedSession) return null;

  try {
    const session: unknown = JSON.parse(savedSession);
    if (
      typeof session === 'object' &&
      session !== null &&
      'role' in session &&
      isUserRole(session.role) &&
      'displayName' in session &&
      typeof session.displayName === 'string' &&
      'username' in session &&
      typeof session.username === 'string' &&
      'currentTab' in session &&
      typeof session.currentTab === 'string'
    ) {
      return {
        role: session.role,
        displayName: session.displayName,
        username: session.username,
        currentTab: session.currentTab
      };
    }
  } catch {
    sessionStorage.removeItem(PORTAL_SESSION_KEY);
  }

  return null;
};

export const App: React.FC = () => {
  const [initialSession] = useState(getPortalSession);
  const [showIntro, setShowIntro] = useState<boolean>(() => !initialSession);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(initialSession));
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => initialSession?.role || 'admin');
  const [userDisplayName, setUserDisplayName] = useState<string>(() => initialSession?.displayName || "Ma'am Arbe");
  const [username, setUsername] = useState<string>(() => initialSession?.username || 'arbe');
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>(() => initialSession?.currentTab || 'dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isDashboardLoading) return;

    const timer = window.setTimeout(() => setIsDashboardLoading(false), 1500);
    return () => window.clearTimeout(timer);
  }, [isDashboardLoading]);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setSearchTerm('');
    if (isLoggedIn) {
      sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({
        role: currentRole,
        displayName: userDisplayName,
        username,
        currentTab: tab
      }));
    }
  };

  const handleLogin = (role: UserRole, displayName: string, uname: string) => {
    setIsDashboardLoading(true);
    setCurrentRole(role);
    setUserDisplayName(displayName);
    setUsername(uname);
    setIsLoggedIn(true);
    setJustLoggedOut(false);
    const tab = role === 'staff' || role === 'student' ? 'equipment' : 'dashboard';
    setCurrentTab(tab);
    sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({
      role,
      displayName,
      username: uname,
      currentTab: tab
    }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PORTAL_SESSION_KEY);
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
