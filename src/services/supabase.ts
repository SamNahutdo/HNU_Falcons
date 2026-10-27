import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  BorrowingItem,
  UserRole
} from '../types/database';

// ─────────────────────────────────────────────────────────────────────────────
// Supabase credentials (set in .env)
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_IDS: Record<UserRole, string> = {
  admin: '00000000-0000-0000-0000-000000000001',
  staff: '00000000-0000-0000-0000-000000000002',
  coach: '00000000-0000-0000-0000-000000000003',
  student: '00000000-0000-0000-0000-000000000004'
};

export function getSupabaseCredentials(): { url: string; anonKey: string; isLiveConfigured: boolean } {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://ulaqsayqqkfebsavaisc.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bzKmpGAYVBxAmokpcJYaCw_PK1hFJCG';
  const isLiveConfigured = Boolean(url && anonKey && url.startsWith('http'));
  return { url, anonKey, isLiveConfigured };
}

let cachedIsolatedClient: SupabaseClient | null = null;
export function getIsolatedSupabaseClient(): SupabaseClient {
  if (cachedIsolatedClient) return cachedIsolatedClient;
  const { url, anonKey } = getSupabaseCredentials();
  cachedIsolatedClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return cachedIsolatedClient;
}

export const getAdminSupabaseClient = getIsolatedSupabaseClient;

// ─────────────────────────────────────────────────────────────────────────────
// Singleton client
// ─────────────────────────────────────────────────────────────────────────────
export let supabaseClient: SupabaseClient | null = null;

export function initClient(): SupabaseClient | null {
  const { url, anonKey, isLiveConfigured } = getSupabaseCredentials();
  if (isLiveConfigured) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.sessionStorage
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
// Helper: throw in live mode
// ─────────────────────────────────────────────────────────────────────────────
function liveError(context: string, err: { message: string }): never {
  throw new Error(`[Live DB error — ${context}]: ${err.message}`);
}

export function requireSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    initClient();
  }
  if (!supabaseClient) {
    throw new Error('Supabase is not configured. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
}

function isUserRole(role: unknown): role is UserRole {
  return role === 'admin' || role === 'staff' || role === 'coach' || role === 'student';
}

async function getActiveProfile(authUid: string, userEmail?: string) {
  const client = requireSupabaseClient();
  let { data, error } = await client
    .from('users')
    .select('id, full_name, email, school_id, status, role:roles(name)')
    .eq('user_auth_id', authUid)
    .maybeSingle();

  // If user_auth_id is not yet linked, link by email automatically
  if (!data && userEmail) {
    const { data: matchedUser } = await client
      .from('users')
      .select('id, full_name, email, school_id, status, role:roles(name)')
      .ilike('email', userEmail.trim())
      .maybeSingle();

    if (matchedUser) {
      await client
        .from('users')
        .update({ user_auth_id: authUid })
        .eq('id', matchedUser.id);
      data = matchedUser;
    } else {
      // Auto-create missing public.users profile directly so user is never blocked
      const defaultRoleId = '00000000-0000-0000-0000-000000000004'; // student
      const schoolId = 'ID-' + authUid.replace(/-/g, '').slice(0, 10);
      const { data: createdUser } = await client
        .from('users')
        .insert({
          user_auth_id: authUid,
          email: userEmail.trim().toLowerCase(),
          full_name: userEmail.split('@')[0],
          school_id: schoolId,
          role_id: defaultRoleId,
          status: 'active'
        })
        .select('id, full_name, email, school_id, status, role:roles(name)')
        .maybeSingle();

      if (createdUser) {
        data = createdUser;
      }
    }
  }

  if (error || !data) {
    throw new Error('Your account does not have an active application profile in the database. Contact an administrator.');
  }

  const profile = data as {
    id: string;
    full_name: string;
    email: string;
    school_id: string | null;
    status: string;
    role: { name: string } | { name: string }[] | null;
  };
  const role = Array.isArray(profile.role) ? profile.role[0]?.name : profile.role?.name;

  if (profile.status !== 'active') {
    throw new Error('Your account is pending administrator verification. Please wait for an administrator to verify your account before logging in.');
  }
  if (!isUserRole(role)) {
    throw new Error('Your account has an invalid role. Contact an administrator.');
  }

  return {
    userId: profile.id,
    authUid,
    fullName: profile.full_name,
    email: profile.email,
    role,
    schoolId: profile.school_id
  };
}

/** Resolves an ID, username, or email to the Supabase Auth registered email */
export async function resolveIdentifierToEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('@')) return trimmed;

  const client = requireSupabaseClient();

  try {
    // 1. Check users table by school_id (e.g. 'ADMIN-001', '2023-10892')
    const { data: bySchool } = await client
      .from('users')
      .select('email')
      .ilike('school_id', trimmed)
      .limit(1);
    if (bySchool && bySchool.length > 0 && bySchool[0].email) {
      return bySchool[0].email;
    }

    // 2. Check coaches by employee_number (e.g. 'EMP-2018-091')
    const { data: byCoach } = await client
      .from('coaches')
      .select('user:users(email)')
      .ilike('employee_number', trimmed)
      .limit(1);
    if (byCoach && byCoach.length > 0) {
      const coachUser = byCoach[0].user as { email?: string } | { email?: string }[] | null;
      const email = Array.isArray(coachUser) ? coachUser[0]?.email : coachUser?.email;
      if (email) return email;
    }

    // 3. Check athletes by student_number
    const { data: byAthlete } = await client
      .from('athletes')
      .select('user:users(email)')
      .ilike('student_number', trimmed)
      .limit(1);
    if (byAthlete && byAthlete.length > 0) {
      const athleteUser = byAthlete[0].user as { email?: string } | { email?: string }[] | null;
      const email = Array.isArray(athleteUser) ? athleteUser[0]?.email : athleteUser?.email;
      if (email) return email;
    }

    // 4. Check users table by full_name
    const { data: byName } = await client
      .from('users')
      .select('email')
      .ilike('full_name', trimmed)
      .limit(1);
    if (byName && byName.length > 0 && byName[0].email) {
      return byName[0].email;
    }

    // 5. Check users where email prefix equals username (e.g. 'admin' -> 'admin@gmail.com')
    const { data: byPrefix } = await client
      .from('users')
      .select('email')
      .ilike('email', `${trimmed}@%`)
      .limit(1);
    if (byPrefix && byPrefix.length > 0 && byPrefix[0].email) {
      return byPrefix[0].email;
    }
  } catch (err) {
    console.warn('[FARE-ERP] Could not resolve identifier via Supabase:', err);
  }

  return trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION SERVICE  (Supabase Auth)
// ─────────────────────────────────────────────────────────────────────────────
export const authService = {
  /** Sign in using ID, username, or email */
  async signIn(identifier: string, password: string): Promise<{
    userId: string;
    authUid: string;
    fullName: string;
    email: string;
    role: UserRole;
    schoolId: string | null;
  }> {
    const client = requireSupabaseClient();
    const resolvedEmail = await resolveIdentifierToEmail(identifier);

    const { data, error } = await client.auth.signInWithPassword({
      email: resolvedEmail,
      password
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid credentials. Please verify your ID, username, or email and password.');
    }

    try {
      return await getActiveProfile(data.user.id, data.user.email);
    } catch (profileError) {
      await client.auth.signOut({ scope: 'local' });
      throw profileError;
    }
  },

  async getCurrentProfile() {
    if (!supabaseClient) initClient();
    if (!supabaseClient) return null;

    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw new Error('Could not read the saved sign-in session.');
    if (!sessionData.session) return null;

    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data.user) {
      await supabaseClient.auth.signOut({ scope: 'local' });
      throw new Error('The saved sign-in could not be verified. Please sign in again.');
    }
    try {
      return await getActiveProfile(data.user.id, data.user.email);
    } catch (profileError) {
      await supabaseClient.auth.signOut({ scope: 'local' });
      throw profileError;
    }
  },

  /** Register a student; the auth trigger creates the inactive profile for admin review. */
  async registerUser({
    email,
    password,
    fullName,
    schoolId,
    role = 'student'
  }: {
    email: string;
    password: string;
    fullName: string;
    schoolId: string;
    role?: 'student' | 'coach' | 'staff';
  }) {
    if (role !== 'student') {
      throw new Error('Public registration is limited to student accounts. Contact an administrator for coach or staff access.');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const trimmedId = schoolId.trim();
    if (!/^\d{7,15}$/.test(trimmedId)) {
      throw new Error('Student ID must contain 7 to 15 digits.');
    }

    const client = getIsolatedSupabaseClient();

    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
          school_id: trimmedId,
          role: 'student'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        throw new Error('This account is already registered. Please go to the Log In tab to sign in.');
      }
      throw new Error(signUpError.message || 'Registration failed.');
    }

    if (!signUpData.user) {
      throw new Error('Registration could not be completed. Please try again.');
    }

    return {
      success: true,
      authUid: signUpData.user.id,
      email: trimmedEmail,
      fullName: trimmedName,
      role: 'student' as const
    };
  },

  async registerStudent(email: string, password: string, fullName: string, schoolId: string) {
    return this.registerUser({ email, password, fullName, schoolId, role: 'student' });
  },

  async signOut(): Promise<void> {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Could not end the Supabase session.');
    }
  },

  async getSession() {
    if (!supabaseClient) initClient();
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED DATABASE SERVICE (Direct to Supabase Cloud)
// ─────────────────────────────────────────────────────────────────────────────
export const databaseService = {
  isLive(): boolean {
    const { isLiveConfigured } = getSupabaseCredentials();
    return isLiveConfigured && supabaseClient !== null;
  },

  // ── 1. SPORTS ───────────────────────────────────────────────────────────
  async getSports(): Promise<Sport[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client.from('sports').select('*').order('name');
    if (error) liveError('getSports', error);
    return data as Sport[];
  },

  // ── 2. TEAMS ────────────────────────────────────────────────────────────
  async getTeams(): Promise<Team[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('teams')
      .select(`*, sport:sports(*), coach:coaches(*, user:users(*))`)
      .order('team_name');
    if (error) liveError('getTeams', error);
    return data as Team[];
  },

  // ── 3. TEAM MEMBERS ─────────────────────────────────────────────────────
  async getTeamMembers(): Promise<TeamMember[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('team_members')
      .select(`*, team:teams(*), athlete:athletes(*, user:users(*))`);
    if (error) liveError('getTeamMembers', error);
    return data as TeamMember[];
  },

  async addTeamMember(teamId: string, athleteId: string, position: string, jerseyNumber?: number): Promise<TeamMember> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('team_members')
      .insert([{ team_id: teamId, athlete_id: athleteId, position, jersey_number: jerseyNumber }])
      .select()
      .single();
    if (error) liveError('addTeamMember', error);
    return data as TeamMember;
  },

  // ── 4. ATHLETES ─────────────────────────────────────────────────────────
  async getAthletes(): Promise<Athlete[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('athletes')
      .select(`*, user:users(*)`);
    if (error) liveError('getAthletes', error);
    return data as Athlete[];
  },

  // ── 5. EQUIPMENT ────────────────────────────────────────────────────────
  async getEquipment(): Promise<Equipment[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('equipment')
      .select(`*, sport:sports(*)`)
      .order('name');
    if (error) liveError('getEquipment', error);
    return data as Equipment[];
  },

  async addEquipment(eq: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('equipment')
      .insert([eq])
      .select()
      .single();
    if (error) liveError('addEquipment', error);
    return data as Equipment;
  },

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) liveError('updateEquipment', error);
    return data as Equipment;
  },

  async deleteEquipment(id: string): Promise<void> {
    const client = requireSupabaseClient();
    const { error } = await client.from('equipment').delete().eq('id', id);
    if (error) liveError('deleteEquipment', error);
  },

  // ── 6. BORROWING TRANSACTIONS & ITEMS ───────────────────────────────────
  async getTransactions(): Promise<BorrowingTransaction[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('borrowing_transactions')
      .select(`
        *,
        athlete:athletes(*, user:users(*)),
        coach:coaches(*, user:users(*)),
        approver:users(*),
        items:borrowing_items(*, equipment:equipment(*))
      `)
      .order('borrow_date', { ascending: false });
    if (error) liveError('getTransactions', error);
    return data as BorrowingTransaction[];
  },

  async getBorrowingItems(): Promise<BorrowingItem[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('borrowing_items')
      .select(`*, equipment:equipment(*)`);
    if (error) liveError('getBorrowingItems', error);
    return data as BorrowingItem[];
  },

  // ── 7. RPC: checkout_equipment ──────────────────────────────────────────
  async checkoutEquipment(
    athleteId: string,
    items: { equipment_id: string; quantity: number; condition?: string }[],
    expectedReturnDate: string,
    approvedBy?: string,
    remarks?: string
  ): Promise<{ success: boolean; transaction_id: string; message: string }> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('checkout_equipment', {
      p_athlete_id: athleteId,
      p_items: items,
      p_expected_return: expectedReturnDate,
      p_approved_by: approvedBy || null,
      p_remarks: remarks || null
    });
    if (error) liveError('checkoutEquipment RPC', error);
    return data as { success: boolean; transaction_id: string; message: string };
  },

  // ── 8. RPC: return_borrowed_items ───────────────────────────────────────
  async returnBorrowedItems(
    transactionId: string,
    items: { item_id: string; returned_quantity: number; condition_after?: string }[],
    receivedBy?: string
  ): Promise<{ success: boolean; message: string }> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('return_borrowed_items', {
      p_transaction_id: transactionId,
      p_items: items,
      p_received_by: receivedBy || null
    });
    if (error) liveError('returnBorrowedItems RPC', error);
    return data as { success: boolean; message: string };
  },

  // ── 9. MAINTENANCE ──────────────────────────────────────────────────────
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('maintenance_records')
      .select(`*, equipment:equipment(*), reporter:users(*)`)
      .order('created_at', { ascending: false });
    if (error) liveError('getMaintenanceRecords', error);
    return data as MaintenanceRecord[];
  },

  async addMaintenanceRecord(
    equipmentId: string,
    reportedBy: string,
    issue: string,
    scheduledDate: string,
    cost: number
  ): Promise<MaintenanceRecord> {
    const client = requireSupabaseClient();
    const { data, error } = await client
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
  },

  // ── 10. AUDIT LOGS ──────────────────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLog[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('audit_logs')
      .select(`*, performer:users(*)`)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) liveError('getAuditLogs', error);
    return data as AuditLog[];
  },

  // ── 11. DATABASE VIEWS ──────────────────────────────────────────────────
  async getActiveLoansView(): Promise<ActiveLoansSummaryView[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client.from('vw_active_loans_summary').select('*');
    if (error) liveError('getActiveLoansView', error);
    return data as ActiveLoansSummaryView[];
  },

  async getEquipmentInventoryView(): Promise<EquipmentInventoryStatusView[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client.from('vw_equipment_inventory_status').select('*');
    if (error) liveError('getEquipmentInventoryView', error);
    return data as EquipmentInventoryStatusView[];
  },

  // ── 12. USERS ───────────────────────────────────────────────────────────
  async getUsers(): Promise<User[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client.from('users').select('*, role:roles(*)');
    if (error) liveError('getUsers', error);
    return data as User[];
  }
};
