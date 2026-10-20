import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { SupabaseModal } from './components/SupabaseModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ReturnModal } from './components/ReturnModal';

import { LoginView } from './pages/LoginView';
import { DashboardView } from './pages/DashboardView';
import { TeamsView } from './pages/TeamsView';
import { EquipmentView } from './pages/EquipmentView';
import { BorrowingView } from './pages/BorrowingView';
import { AthletesView } from './pages/AthletesView';
import { AuditLogsView } from './pages/AuditLogsView';
import { DefenseHubView } from './pages/DefenseHubView';

import { databaseService } from './services/supabase';
import { mockDb } from './services/mockData';
import {
  Sport,
  Team,
  TeamMember,
  Athlete,
  Equipment,
  BorrowingTransaction,
  AuditLog,
  UserRole
} from './types/database';

export const App: React.FC = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [userDisplayName, setUserDisplayName] = useState<string>("Ma'am Arbe");
  const [username, setUsername] = useState<string>('arbe');
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Database Data States
  const [sports, setSports] = useState<Sport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [transactions, setTransactions] = useState<BorrowingTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [returnTx, setReturnTx] = useState<BorrowingTransaction | null>(null);

  // Connection mode state
  const [isLiveMode, setIsLiveMode] = useState<boolean>(databaseService.isLive());

  const loadAllData = useCallback(async () => {
    try {
      setIsLiveMode(databaseService.isLive());
      const [
        sportsData,
        teamsData,
        tmData,
        athData,
        eqData,
        txData,
        auditData
      ] = await Promise.all([
        databaseService.getSports(),
        databaseService.getTeams(),
        databaseService.getTeamMembers(),
        databaseService.getAthletes(),
        databaseService.getEquipment(),
        databaseService.getTransactions(),
        databaseService.getAuditLogs()
      ]);

      setSports(sportsData);
      setTeams(teamsData);
      setTeamMembers(tmData);
      setAthletes(athData);
      setEquipmentList(eqData);
      setTransactions(txData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Error loading database telemetry:', err);
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
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setJustLoggedOut(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'admin') {
      setUserDisplayName("Ma'am Arbe");
      setUsername('arbe');
    } else if (newRole === 'staff') {
      setUserDisplayName('Custodian John');
      setUsername('staff1');
    } else {
      setUserDisplayName('Juan Dela Cruz');
      setUsername('student');
    }
  };

  // If not logged in, render Screenshot 1 Portal Access Login View!
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} loggedOutNotice={justLoggedOut} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
      {/* SIDEBAR (Screenshots 2, 3, 4) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
        userDisplayName={userDisplayName}
        username={username}
      />

      {/* MAIN WRAPPER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TOPBAR (Search bar and Log Out button) */}
        <Topbar
          onLogout={handleLogout}
          onOpenConfig={() => setIsConfigOpen(true)}
          isLive={isLiveMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* MAIN BODY CONTENT */}
        <main className="main-content">
          {currentTab === 'dashboard' && (
            <DashboardView
              currentRole={currentRole}
              equipmentList={equipmentList}
              transactions={transactions}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
              onOpenReturn={(tx) => setReturnTx(tx)}
              onNavigate={setCurrentTab}
            />
          )}

          {(currentTab === 'equipment' || currentTab === 'checkout' || currentTab === 'request_loan') && (
            <EquipmentView
              equipmentList={equipmentList}
              sports={sports}
              currentRole={currentRole}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'borrowing' && (
            <BorrowingView
              transactions={transactions}
              currentRole={currentRole}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
              onOpenReturn={(tx) => setReturnTx(tx)}
            />
          )}

          {currentTab === 'athletes' && (
            <AthletesView
              athletes={athletes}
              teamMembers={teamMembers}
              teams={teams}
              transactions={transactions}
            />
          )}

          {(currentTab === 'teams' || currentTab === 'coaches') && (
            <TeamsView
              sports={sports}
              teams={teams}
              teamMembers={teamMembers}
              athletes={athletes}
              currentRole={currentRole}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'maintenance' && (
            <EquipmentView
              equipmentList={equipmentList}
              sports={sports}
              currentRole={currentRole}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogsView logs={auditLogs} />
          )}

          {(currentTab === 'defense' || currentTab === 'users') && (
            <DefenseHubView />
          )}
        </main>
      </div>

      {/* Supabase Cloud Connection & Configuration Modal */}
      <SupabaseModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigUpdated={loadAllData}
      />

      {/* Checkout Transaction Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        athletes={athletes}
        equipmentList={equipmentList}
        onSuccess={loadAllData}
      />

      {/* Process Return Modal */}
      <ReturnModal
        isOpen={returnTx !== null}
        onClose={() => setReturnTx(null)}
        transaction={returnTx}
        onSuccess={loadAllData}
      />
    </div>
  );
};
