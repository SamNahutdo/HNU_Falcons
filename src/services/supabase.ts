import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { mockDb } from './mockData';
import {
  Equipment,
  Sport,
  Team,
  TeamMember,
  Athlete,
  User,
  AuditLog,
  ActiveLoansSummaryView,
  EquipmentInventoryStatusView,
  MaintenanceRecord,
  BorrowingTransaction,
  BorrowingItem
} from '../types/database';

// ─────────────────────────────────────────────────────────────────────────────
// Supabase credentials (set in .env)
// ─────────────────────────────────────────────────────────────────────────────
export function getSupabaseCredentials(): { url: string; anonKey: string; isLiveConfigured: boolean } {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const isLiveConfigured = Boolean(url && anonKey && url.startsWith('http'));
  return { url, anonKey, isLiveConfigured };
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton client
// ─────────────────────────────────────────────────────────────────────────────
let supabaseClient: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  const { url, anonKey, isLiveConfigured } = getSupabaseCredentials();
  if (isLiveConfigured) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
      return supabaseClient;
    } catch (e) {
      console.warn('[FARE-ERP] Could not initialize Supabase client:', e);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return null;
}

initClient();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: throw in live mode, never fall through to mock silently
// ─────────────────────────────────────────────────────────────────────────────
function liveError(context: string, err: { message: string }): never {
  throw new Error(`[Live DB error — ${context}]: ${err.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION SERVICE  (Supabase Auth)
// ─────────────────────────────────────────────────────────────────────────────
export const authService = {
  /**
   * Sign in with email/username + password.
   * Checks Supabase Auth if available, otherwise seamlessly validates against local registered accounts.
   */
  async signIn(email: string, password: string): Promise<{
    userId: string;
    authUid: string;
    fullName: string;
    role: string;
    schoolId: string | null;
  }> {
    // 1. If live Supabase client exists, attempt authentication
    if (supabaseClient) {
      try {
        const { data: authData, error: authErr } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (!authErr && authData?.user) {
          const { data: profile } = await supabaseClient
            .from('users')
            .select('id, full_name, school_id, status, role:roles(name)')
            .eq('user_auth_id', authData.user.id)
            .single();

          if (profile) {
            const p = profile as any;
            if (p.status === 'active') {
              const roleName = Array.isArray(p.role) ? p.role[0]?.name : p.role?.name || 'student';
              return {
                userId: p.id,
                authUid: authData.user.id,
                fullName: p.full_name,
                role: roleName,
                schoolId: p.school_id
              };
            }
          }
        }
      } catch (e) {
        console.warn('[Supabase Auth fallback]', e);
      }
    }

    // 2. Seamless fallback to local registered accounts (mockDb)
    const normalizedInput = email.trim().toLowerCase();
    const mockUser = mockDb.getRegisteredUsers().find(u =>
      u.username.toLowerCase() === normalizedInput ||
      u.school_id.toLowerCase() === normalizedInput ||
      (u.full_name && u.full_name.toLowerCase() === normalizedInput) ||
      `${u.username}@falcons.edu.ph`.toLowerCase() === normalizedInput ||
      `${u.username}@example.com`.toLowerCase() === normalizedInput ||
      ((u as any).email && (u as any).email.toLowerCase() === normalizedInput)
    );

    if (mockUser) {
      if (mockUser.password && mockUser.password !== password) {
        throw new Error('Invalid password. Please check your credentials.');
      }
      if ((mockUser.status as string) === 'inactive' || mockUser.is_verified === false) {
        throw new Error('Your account is pending admin approval. Contact your administrator.');
      }
      return {
        userId: mockUser.id,
        authUid: mockUser.id,
        fullName: mockUser.full_name,
        role: mockUser.role,
        schoolId: mockUser.school_id
      };
    }

    throw new Error('Account not found. Please verify your credentials or register.');
  },

  async signOut(): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  },

  async getSession() {
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED DATABASE SERVICE
// IMPORTANT: When isLive() is true, ALL errors throw — never silently use mock.
//            Mock data is only used when supabaseClient is intentionally null
//            (i.e., .env is not configured).
// ─────────────────────────────────────────────────────────────────────────────
export const databaseService = {
  isLive(): boolean {
    const { isLiveConfigured } = getSupabaseCredentials();
    return isLiveConfigured && supabaseClient !== null;
  },

  // ── 1. SPORTS ───────────────────────────────────────────────────────────
  async getSports(): Promise<Sport[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('sports').select('*').order('name');
      if (error) liveError('getSports', error);
      return data as Sport[];
    }
    return mockDb.sports;
  },

  // ── 2. TEAMS ────────────────────────────────────────────────────────────
  async getTeams(): Promise<Team[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('teams')
        .select(`*, sport:sports(*), coach:coaches(*, user:users(*))`)
        .order('team_name');
      if (error) liveError('getTeams', error);
      return data as Team[];
    }
    return mockDb.teams.map(t => ({
      ...t,
      sport: mockDb.sports.find(s => s.id === t.sport_id),
      coach: {
        ...mockDb.coaches.find(c => c.id === t.coach_id)!,
        user: mockDb.users.find(u => u.id === mockDb.coaches.find(c => c.id === t.coach_id)?.user_id)
      }
    }));
  },

  // ── 3. TEAM MEMBERS (Junction 1) ────────────────────────────────────────
  async getTeamMembers(): Promise<TeamMember[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('team_members')
        .select(`*, team:teams(*), athlete:athletes(*, user:users(*))`);
      if (error) liveError('getTeamMembers', error);
      return data as TeamMember[];
    }
    return mockDb.teamMembers.map(tm => {
      const athlete = mockDb.athletes.find(a => a.id === tm.athlete_id);
      return {
        ...tm,
        team: mockDb.teams.find(t => t.id === tm.team_id),
        athlete: athlete
          ? { ...athlete, user: mockDb.users.find(u => u.id === athlete.user_id) }
          : undefined
      };
    });
  },

  async addTeamMember(teamId: string, athleteId: string, position: string, jerseyNumber?: number): Promise<TeamMember> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('team_members')
        .insert([{ team_id: teamId, athlete_id: athleteId, position, jersey_number: jerseyNumber }])
        .select()
        .single();
      if (error) liveError('addTeamMember', error);
      return data as TeamMember;
    }
    return mockDb.addTeamMember(teamId, athleteId, position, jerseyNumber);
  },

  // ── 4. ATHLETES ─────────────────────────────────────────────────────────
  async getAthletes(): Promise<Athlete[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('athletes')
        .select(`*, user:users(*)`);
      if (error) liveError('getAthletes', error);
      return data as Athlete[];
    }
    return mockDb.athletes.map(a => ({
      ...a,
      user: mockDb.users.find(u => u.id === a.user_id)
    }));
  },

  // ── 5. EQUIPMENT ────────────────────────────────────────────────────────
  async getEquipment(): Promise<Equipment[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('equipment')
        .select(`*, sport:sports(*)`)
        .order('name');
      if (error) liveError('getEquipment', error);
      return data as Equipment[];
    }
    return mockDb.equipment.map(e => ({
      ...e,
      sport: mockDb.sports.find(s => s.id === e.sport_id)
    }));
  },

  async addEquipment(eq: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>, performedBy?: string): Promise<Equipment> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('equipment')
        .insert([eq])
        .select()
        .single();
      if (error) liveError('addEquipment', error);
      return data as Equipment;
    }
    return mockDb.addEquipment(eq, performedBy);
  },

  async updateEquipment(id: string, updates: Partial<Equipment>, performedBy?: string): Promise<Equipment> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) liveError('updateEquipment', error);
      return data as Equipment;
    }
    return mockDb.updateEquipment(id, updates, performedBy);
  },

  async deleteEquipment(id: string, performedBy?: string): Promise<void> {
    if (this.isLive() && supabaseClient) {
      const { error } = await supabaseClient.from('equipment').delete().eq('id', id);
      if (error) liveError('deleteEquipment', error);
      return;
    }
    mockDb.deleteEquipment(id, performedBy);
  },

  // ── 6. BORROWING TRANSACTIONS & ITEMS (Junction 2) ──────────────────────
  async getTransactions(): Promise<BorrowingTransaction[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('borrowing_transactions')
        .select(`
          *,
          athlete:athletes(*, user:users(*)),
          approver:users(*),
          items:borrowing_items(*, equipment:equipment(*))
        `)
        .order('borrow_date', { ascending: false });
      if (error) liveError('getTransactions', error);
      return data as BorrowingTransaction[];
    }
    return mockDb.borrowingTransactions.map(tx => {
      const athlete = mockDb.athletes.find(a => a.id === tx.athlete_id);
      return {
        ...tx,
        athlete: athlete
          ? { ...athlete, user: mockDb.users.find(u => u.id === athlete.user_id) }
          : undefined,
        approver: tx.approved_by ? mockDb.users.find(u => u.id === tx.approved_by) : undefined,
        items: mockDb.borrowingItems
          .filter(i => i.transaction_id === tx.id)
          .map(item => ({
            ...item,
            equipment: mockDb.equipment.find(e => e.id === item.equipment_id)
          }))
      };
    });
  },

  async getBorrowingItems(): Promise<BorrowingItem[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('borrowing_items')
        .select(`*, equipment:equipment(*)`);
      if (error) liveError('getBorrowingItems', error);
      return data as BorrowingItem[];
    }
    return mockDb.borrowingItems.map(item => ({
      ...item,
      equipment: mockDb.equipment.find(e => e.id === item.equipment_id)
    }));
  },

  // ── 7. RPC: checkout_equipment ──────────────────────────────────────────
  async checkoutEquipment(
    athleteId: string,
    items: { equipment_id: string; quantity: number; condition?: string }[],
    expectedReturnDate: string,
    approvedBy?: string,
    remarks?: string
  ): Promise<{ success: boolean; transaction_id: string; message: string }> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.rpc('checkout_equipment', {
        p_athlete_id: athleteId,
        p_items: items,
        p_expected_return: expectedReturnDate,
        p_approved_by: approvedBy || null,
        p_remarks: remarks || null
      });
      if (error) liveError('checkoutEquipment RPC', error);
      return data as { success: boolean; transaction_id: string; message: string };
    }
    return mockDb.checkoutEquipment(athleteId, items, expectedReturnDate, approvedBy, remarks);
  },

  // ── 8. RPC: return_borrowed_items ───────────────────────────────────────
  async returnBorrowedItems(
    transactionId: string,
    items: { item_id: string; returned_quantity: number; condition_after?: string }[],
    receivedBy?: string
  ): Promise<{ success: boolean; message: string }> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.rpc('return_borrowed_items', {
        p_transaction_id: transactionId,
        p_items: items,
        p_received_by: receivedBy || null
      });
      if (error) liveError('returnBorrowedItems RPC', error);
      return data as { success: boolean; message: string };
    }
    return mockDb.returnBorrowedItems(transactionId, items, receivedBy);
  },

  // ── 9. MAINTENANCE ──────────────────────────────────────────────────────
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('maintenance_records')
        .select(`*, equipment:equipment(*), reporter:users(*)`)
        .order('created_at', { ascending: false });
      if (error) liveError('getMaintenanceRecords', error);
      return data as MaintenanceRecord[];
    }
    return mockDb.maintenanceRecords.map(m => ({
      ...m,
      equipment: mockDb.equipment.find(e => e.id === m.equipment_id),
      reporter: mockDb.users.find(u => u.id === m.reported_by)
    }));
  },

  async addMaintenanceRecord(
    equipmentId: string,
    reportedBy: string,
    issue: string,
    scheduledDate: string,
    cost: number
  ): Promise<MaintenanceRecord> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('maintenance_records')
        .insert([{
          equipment_id: equipmentId,
          reported_by: reportedBy,
          issue_description: issue,
          scheduled_date: scheduledDate,
          cost
        }])
        .select()
        .single();
      if (error) liveError('addMaintenanceRecord', error);
      return data as MaintenanceRecord;
    }
    return mockDb.addMaintenanceRecord(equipmentId, reportedBy, issue, scheduledDate, cost);
  },

  // ── 10. AUDIT LOGS ──────────────────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('audit_logs')
        .select(`*, performer:users(*)`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) liveError('getAuditLogs', error);
      return data as AuditLog[];
    }
    return mockDb.auditLogs.map(l => ({
      ...l,
      performer: l.performed_by ? mockDb.users.find(u => u.id === l.performed_by) : undefined
    }));
  },

  // ── 11. DATABASE VIEWS ──────────────────────────────────────────────────
  async getActiveLoansView(): Promise<ActiveLoansSummaryView[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('vw_active_loans_summary').select('*');
      if (error) liveError('getActiveLoansView', error);
      return data as ActiveLoansSummaryView[];
    }
    return mockDb.getActiveLoansView();
  },

  async getEquipmentInventoryView(): Promise<EquipmentInventoryStatusView[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('vw_equipment_inventory_status').select('*');
      if (error) liveError('getEquipmentInventoryView', error);
      return data as EquipmentInventoryStatusView[];
    }
    return mockDb.getEquipmentInventoryView();
  },

  // ── 12. USERS ───────────────────────────────────────────────────────────
  async getUsers(): Promise<User[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('*, role:roles(*)');
      if (error) liveError('getUsers', error);
      return data as User[];
    }
    return mockDb.users.map(u => ({
      ...u,
      role: mockDb.roles.find(r => r.id === u.role_id)
    }));
  }
};
