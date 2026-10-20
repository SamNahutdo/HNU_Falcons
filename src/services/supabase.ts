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

export function getSupabaseCredentials(): { url: string; anonKey: string; isLiveConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const url = envUrl;
  const anonKey = envKey;
  const isLiveConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return {
    url,
    anonKey,
    isLiveConfigured
  };
}

let supabaseClient: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  const { url, anonKey, isLiveConfigured } = getSupabaseCredentials();
  if (isLiveConfigured) {
    try {
      supabaseClient = createClient(url, anonKey);
      return supabaseClient;
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return null;
}

// Initial setup
initClient();

// Unified Database Service
export const databaseService = {
  isLive(): boolean {
    const { isLiveConfigured } = getSupabaseCredentials();
    return isLiveConfigured && supabaseClient !== null;
  },

  // 1. SPORTS
  async getSports(): Promise<Sport[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('sports').select('*').order('name');
      if (!error && data) return data as Sport[];
    }
    return mockDb.sports;
  },

  // 2. TEAMS
  async getTeams(): Promise<Team[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('teams')
        .select(`
          *,
          sport:sports(*),
          coach:coaches(
            *,
            user:users(*)
          )
        `)
        .order('team_name');
      if (!error && data) return data as Team[];
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

  // 3. TEAM MEMBERS (Junction 1)
  async getTeamMembers(): Promise<TeamMember[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('team_members')
        .select(`
          *,
          team:teams(*),
          athlete:athletes(
            *,
            user:users(*)
          )
        `);
      if (!error && data) return data as TeamMember[];
    }
    return mockDb.teamMembers.map(tm => {
      const athlete = mockDb.athletes.find(a => a.id === tm.athlete_id);
      return {
        ...tm,
        team: mockDb.teams.find(t => t.id === tm.team_id),
        athlete: athlete
          ? {
              ...athlete,
              user: mockDb.users.find(u => u.id === athlete.user_id)
            }
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
      if (error) throw new Error(error.message);
      return data as TeamMember;
    }
    return mockDb.addTeamMember(teamId, athleteId, position, jerseyNumber);
  },

  // 4. ATHLETES
  async getAthletes(): Promise<Athlete[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('athletes')
        .select(`
          *,
          user:users(*)
        `);
      if (!error && data) return data as Athlete[];
    }
    return mockDb.athletes.map(a => ({
      ...a,
      user: mockDb.users.find(u => u.id === a.user_id)
    }));
  },

  // 5. EQUIPMENT
  async getEquipment(): Promise<Equipment[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('equipment')
        .select(`
          *,
          sport:sports(*)
        `)
        .order('name');
      if (!error && data) return data as Equipment[];
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
      if (error) throw new Error(error.message);
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
      if (error) throw new Error(error.message);
      return data as Equipment;
    }
    return mockDb.updateEquipment(id, updates, performedBy);
  },

  async deleteEquipment(id: string, performedBy?: string): Promise<void> {
    if (this.isLive() && supabaseClient) {
      const { error } = await supabaseClient.from('equipment').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    mockDb.deleteEquipment(id, performedBy);
  },

  // 6. BORROWING TRANSACTIONS & ITEMS (Junction 2)
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
      if (!error && data) return data as BorrowingTransaction[];
    }
    return mockDb.borrowingTransactions.map(tx => {
      const athlete = mockDb.athletes.find(a => a.id === tx.athlete_id);
      return {
        ...tx,
        athlete: athlete
          ? {
              ...athlete,
              user: mockDb.users.find(u => u.id === athlete.user_id)
            }
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
        .select(`
          *,
          equipment:equipment(*)
        `);
      if (!error && data) return data as BorrowingItem[];
    }
    return mockDb.borrowingItems.map(item => ({
      ...item,
      equipment: mockDb.equipment.find(e => e.id === item.equipment_id)
    }));
  },

  // 7. STORED PROCEDURE / RPC: checkout_equipment
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
      if (error) throw new Error(error.message);
      return data as { success: boolean; transaction_id: string; message: string };
    }
    return mockDb.checkoutEquipment(athleteId, items, expectedReturnDate, approvedBy, remarks);
  },

  // 8. STORED PROCEDURE / RPC: return_borrowed_items
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
      if (error) throw new Error(error.message);
      return data as { success: boolean; message: string };
    }
    return mockDb.returnBorrowedItems(transactionId, items, receivedBy);
  },

  // 9. MAINTENANCE
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('maintenance_records')
        .select(`
          *,
          equipment:equipment(*),
          reporter:users(*)
        `)
        .order('created_at', { ascending: false });
      if (!error && data) return data as MaintenanceRecord[];
    }
    return mockDb.maintenanceRecords.map(m => ({
      ...m,
      equipment: mockDb.equipment.find(e => e.id === m.equipment_id),
      reporter: mockDb.users.find(u => u.id === m.reported_by)
    }));
  },

  async addMaintenanceRecord(equipmentId: string, reportedBy: string, issue: string, scheduledDate: string, cost: number): Promise<MaintenanceRecord> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('maintenance_records')
        .insert([{ equipment_id: equipmentId, reported_by: reportedBy, issue_description: issue, scheduled_date: scheduledDate, cost }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as MaintenanceRecord;
    }
    return mockDb.addMaintenanceRecord(equipmentId, reportedBy, issue, scheduledDate, cost);
  },

  // 10. AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('audit_logs')
        .select(`
          *,
          performer:users(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) return data as AuditLog[];
    }
    return mockDb.auditLogs.map(l => ({
      ...l,
      performer: l.performed_by ? mockDb.users.find(u => u.id === l.performed_by) : undefined
    }));
  },

  // 11. DATABASE VIEWS
  async getActiveLoansView(): Promise<ActiveLoansSummaryView[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('vw_active_loans_summary').select('*');
      if (!error && data) return data as ActiveLoansSummaryView[];
    }
    return mockDb.getActiveLoansView();
  },

  async getEquipmentInventoryView(): Promise<EquipmentInventoryStatusView[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('vw_equipment_inventory_status').select('*');
      if (!error && data) return data as EquipmentInventoryStatusView[];
    }
    return mockDb.getEquipmentInventoryView();
  },

  // 12. USERS
  async getUsers(): Promise<User[]> {
    if (this.isLive() && supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('*, role:roles(*)');
      if (!error && data) return data as User[];
    }
    return mockDb.users.map(u => ({
      ...u,
      role: mockDb.roles.find(r => r.id === u.role_id)
    }));
  }
};
