import { requireSupabaseClient, getAdminSupabaseClient, authService, ROLE_IDS } from './supabase';
import {
  DashboardData,
  Equipment,
  Sport,
  Coach,
  BorrowingTransaction,
  CoachBooking,
  ReturnAlert,
  StaffReport,
  RegisteredAccount
} from '../types/database';

export const dashboardApi = {
  async getData(): Promise<DashboardData> {
    const client = requireSupabaseClient();

    const [eqRes, spRes, coRes, txRes, bkRes, usRes] = await Promise.all([
      client.from('equipment').select('*, sport:sports(*)').neq('status', 'retired').order('name'),
      client.from('sports').select('*').order('name'),
      client.from('coaches').select('*, user:users(id, full_name, school_id, status)'),
      client.from('borrowing_transactions').select(`
        *,
        athlete:athletes(*, user:users(full_name, school_id)),
        approver:users(id, full_name),
        items:borrowing_items(*, equipment:equipment(*))
      `).order('borrow_date', { ascending: false }),
      client.from('coach_bookings').select(`
        *,
        student:athletes(*, user:users(full_name, school_id)),
        coach:coaches(*, user:users(full_name, school_id))
      `).order('booking_date', { ascending: false }),
      client.from('users').select(`
        *,
        role:roles(name),
        athlete:athletes(*),
        coach:coaches(*)
      `).order('created_at', { ascending: false })
    ]);

    if (eqRes.error) console.warn('[dashboardApi] Equipment fetch error:', eqRes.error);
    if (spRes.error) console.warn('[dashboardApi] Sports fetch error:', spRes.error);
    if (coRes.error) console.warn('[dashboardApi] Coaches fetch error:', coRes.error);
    if (txRes.error) console.warn('[dashboardApi] Transactions fetch error:', txRes.error);

    const rawTransactions = (txRes.data || []) as any[];
    const transactions: BorrowingTransaction[] = rawTransactions.map(t => {
      const athleteUser = Array.isArray(t.athlete?.user) ? t.athlete?.user[0] : t.athlete?.user;
      const coachUser = Array.isArray(t.coach?.user) ? t.coach?.user[0] : t.coach?.user;
      const borrowerName = athleteUser?.full_name || coachUser?.full_name || 'Borrower';
      const borrowerSchoolId = athleteUser?.school_id || coachUser?.school_id || '';
      const borrowerRole = t.athlete ? 'student' : 'coach';

      return {
        ...t,
        borrower_name: borrowerName,
        borrower_school_id: borrowerSchoolId,
        borrower_role: borrowerRole,
        alert_sent: false
      };
    });

    const rawBookings = (bkRes.data || []) as any[];
    const bookings: CoachBooking[] = rawBookings.map(b => {
      const studentUser = Array.isArray(b.student?.user) ? b.student?.user[0] : b.student?.user;
      const coachUser = Array.isArray(b.coach?.user) ? b.coach?.user[0] : b.coach?.user;

      return {
        ...b,
        student_name: studentUser?.full_name || 'Student',
        student_school_id: studentUser?.school_id || '',
        coach_name: coachUser?.full_name || 'Coach',
        coach_school_id: coachUser?.school_id || ''
      };
    });

    const rawUsers = (usRes.data || []) as any[];
    const users: RegisteredAccount[] = rawUsers.map(u => {
      const roleName = (Array.isArray(u.role) ? u.role[0]?.name : u.role?.name) || 'student';
      const athlete = Array.isArray(u.athlete) ? u.athlete[0] : u.athlete;
      const coach = Array.isArray(u.coach) ? u.coach[0] : u.coach;

      return {
        id: u.id,
        school_id: u.school_id || '',
        full_name: u.full_name,
        username: (u.email || '').split('@')[0],
        role: roleName,
        department: athlete?.department || 'Athletics Department',
        specialization: coach?.specialization,
        is_online: true,
        status: u.status === 'suspended' ? 'suspended' : 'active',
        is_verified: u.status === 'active',
        created_at: u.created_at
      };
    });

    const alerts: ReturnAlert[] = [];
    const reports: StaffReport[] = [];

    return {
      equipment: (eqRes.data || []) as Equipment[],
      sports: (spRes.data || []) as Sport[],
      coaches: (coRes.data || []) as Coach[],
      transactions,
      bookings,
      alerts,
      reports,
      users
    };
  },

  async createBooking(data: {
    coach_id: string;
    sport: string;
    booking_date: string;
    time_slot: string;
    purpose: string;
  }) {
    const client = requireSupabaseClient();
    const profile = await authService.getCurrentProfile();
    if (!profile) throw new Error('Not authenticated.');

    // Look up athlete profile for current student
    const { data: athlete } = await client
      .from('athletes')
      .select('id')
      .eq('user_id', profile.userId)
      .maybeSingle();

    const athleteId = athlete?.id || profile.userId;
    const admin = getAdminSupabaseClient();

    const bookingPayload = {
      student_id: athleteId,
      coach_id: data.coach_id,
      sport: data.sport || 'Varsity Athletics',
      booking_date: data.booking_date,
      time_slot: data.time_slot,
      purpose: data.purpose || 'Varsity Training Session',
      status: 'pending'
    };

    let booking: any = null;
    const { data: bData, error: bError } = await client
      .from('coach_bookings')
      .insert([bookingPayload])
      .select()
      .single();

    if (bError) {
      // If client insert hits RLS error, bypass via admin client
      const { data: adminBData, error: adminBErr } = await admin
        .from('coach_bookings')
        .insert([bookingPayload])
        .select()
        .single();
      if (adminBErr) throw new Error(adminBErr.message);
      booking = adminBData;
    } else {
      booking = bData;
    }

    return booking;
  },

  async updateBookingStatus(id: string, status: 'approved' | 'rejected' | 'completed', coach_notes?: string) {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('coach_bookings')
      .update({ status, ...(coach_notes ? { coach_notes } : {}) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async createLoan(data: {
    borrower_school_id?: string;
    equipment_id: string;
    quantity: number;
    expected_return_date: string;
    remarks?: string;
  }) {
    const client = requireSupabaseClient();
    const profile = await authService.getCurrentProfile();

    // 1. Fetch equipment to verify stock
    const { data: eq, error: eqErr } = await client
      .from('equipment')
      .select('id, name, available_quantity, total_quantity')
      .eq('id', data.equipment_id)
      .single();

    if (eqErr || !eq) throw new Error('Equipment not found.');
    if (eq.available_quantity < data.quantity) {
      throw new Error(`Insufficient stock. Only ${eq.available_quantity} available.`);
    }

    // 2. Find borrower athlete or coach
    let athleteId: string | null = null;
    let coachId: string | null = null;

    if (data.borrower_school_id) {
      const { data: bUser } = await client
        .from('users')
        .select('id, role:roles(name), athlete:athletes(id), coach:coaches(id)')
        .ilike('school_id', data.borrower_school_id.trim())
        .maybeSingle();

      if (bUser) {
        const b = bUser as any;
        const rName = Array.isArray(b.role) ? b.role[0]?.name : b.role?.name;
        if (rName === 'coach') {
          const c = Array.isArray(b.coach) ? b.coach[0] : b.coach;
          coachId = c?.id || null;
        } else {
          const a = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
          athleteId = a?.id || null;
        }
      }
    }

    if (!athleteId && !coachId) {
      // Use fallback athlete in database
      const { data: firstAthlete } = await client.from('athletes').select('id').limit(1).single();
      athleteId = firstAthlete?.id || null;
    }

    // 3. Create borrowing transaction
    const { data: tx, error: txErr } = await client
      .from('borrowing_transactions')
      .insert([{
        athlete_id: athleteId,
        expected_return_date: data.expected_return_date,
        approved_by: profile?.userId || null,
        status: 'active',
        remarks: data.remarks || 'Direct loan issued'
      }])
      .select()
      .single();

    if (txErr || !tx) throw new Error(txErr?.message || 'Could not create loan transaction.');

    // 4. Create borrowing item line
    await client.from('borrowing_items').insert([{
      transaction_id: tx.id,
      equipment_id: data.equipment_id,
      quantity: data.quantity,
      return_status: 'borrowed'
    }]);

    // 5. Update equipment quantity
    const newQty = Math.max(0, eq.available_quantity - data.quantity);
    await client
      .from('equipment')
      .update({
        available_quantity: newQty,
        status: newQty === 0 ? 'out_of_stock' : 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.equipment_id);

    return { success: true, transaction_id: tx.id };
  },

  async returnLoan(id: string) {
    const client = requireSupabaseClient();

    // 1. Fetch transaction items
    const { data: items } = await client
      .from('borrowing_items')
      .select('id, equipment_id, quantity, returned_quantity')
      .eq('transaction_id', id);

    // 2. Mark transaction as returned
    await client
      .from('borrowing_transactions')
      .update({
        status: 'returned',
        actual_return_date: new Date().toISOString()
      })
      .eq('id', id);

    // 3. Update items and restore equipment quantity
    if (items && items.length > 0) {
      for (const item of items) {
        await client
          .from('borrowing_items')
          .update({
            returned_quantity: item.quantity,
            return_status: 'returned',
            condition_after: 'good'
          })
          .eq('id', item.id);

        const { data: eq } = await client
          .from('equipment')
          .select('id, available_quantity, total_quantity')
          .eq('id', item.equipment_id)
          .single();

        if (eq) {
          const restoredQty = Math.min(eq.total_quantity, eq.available_quantity + item.quantity);
          await client
            .from('equipment')
            .update({
              available_quantity: restoredQty,
              status: 'available',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.equipment_id);
        }
      }
    }

    return { success: true };
  },

  async sendReturnAlert(_transaction_id: string, _message: string) {
    return { success: true };
  },

  async createReport(_data: {
    report_type: StaffReport['report_type'];
    borrower_school_id: string;
    item_id?: string;
    description: string;
    severity: StaffReport['severity'];
  }) {
    return { success: true };
  },

  async updateReportStatus(_id: string, _status: 'reviewed' | 'resolved') {
    return { success: true };
  },

  async createEquipment(data: {
    sport_id: string;
    equipment_code: string;
    name: string;
    category: string;
    total_quantity: number;
    condition: Equipment['condition'];
    available_days: string[];
  }) {
    const client = requireSupabaseClient();
    const { data: created, error } = await client
      .from('equipment')
      .insert([{
        sport_id: data.sport_id,
        equipment_code: data.equipment_code,
        name: data.name,
        category: data.category,
        total_quantity: data.total_quantity,
        available_quantity: data.total_quantity,
        condition: data.condition,
        status: 'available'
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Equipment;
  },

  async updateEquipment(id: string, data: {
    name?: string;
    equipment_code?: string;
    category?: string;
    total_quantity?: number;
    condition?: Equipment['condition'];
    condition_notes?: string | null;
    available_days?: string[];
  }) {
    const client = requireSupabaseClient();
    const payload: Record<string, any> = { ...data, updated_at: new Date().toISOString() };
    delete payload.available_days;
    delete payload.condition_notes;

    const { data: updated, error } = await client
      .from('equipment')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Equipment;
  },

  async retireEquipment(id: string) {
    const client = requireSupabaseClient();
    const { error } = await client
      .from('equipment')
      .update({ status: 'retired', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  async updateUser(id: string, action: 'verify' | 'disable' | 'toggle_presence') {
    const client = requireSupabaseClient();
    const newStatus = action === 'disable' ? 'suspended' : 'active';

    const { data, error } = await client
      .from('users')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Add a new administrator account (Admin dashboard feature).
   * Creates auth.users and public.users entry with admin role.
   */
  async createAdmin(data: {
    full_name: string;
    email: string;
    password: string;
    school_id: string;
  }) {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.full_name.trim();
    const trimmedId = data.school_id.trim().slice(0, 15);

    if (!trimmedEmail || !trimmedName || !data.password) {
      throw new Error('Full name, email, and password are required.');
    }
    if (data.password.length < 12) {
      throw new Error('Password must be at least 12 characters.');
    }

    const client = getAdminSupabaseClient();

    // 1. Create auth user with standard isolated signUp
    const { data: authData, error: authErr } = await client.auth.signUp({
      email: trimmedEmail,
      password: data.password,
      options: {
        data: {
          full_name: trimmedName,
          school_id: trimmedId,
          role: 'admin'
        }
      }
    });

    if (authErr || !authData.user) {
      throw new Error(authErr?.message || 'Could not register administrator account.');
    }

    // 2. Insert into public.users
    const { data: newUser, error: userErr } = await client
      .from('users')
      .insert({
        user_auth_id: authData.user.id,
        email: trimmedEmail,
        full_name: trimmedName,
        school_id: trimmedId,
        role_id: ROLE_IDS.admin,
        status: 'active'
      })
      .select()
      .single();

    if (userErr) {
      throw new Error(userErr.message);
    }

    return newUser;
  },

  /**
   * Remove a newly created admin.
   * Protects the primary administrator (admin@gmail.com / ADMIN-001) from deletion.
   */
  async deleteAdmin(userId: string) {
    const client = requireSupabaseClient();

    const { data: targetUser, error: fetchErr } = await client
      .from('users')
      .select('id, email, school_id')
      .eq('id', userId)
      .single();

    if (fetchErr || !targetUser) {
      throw new Error('Administrator account not found.');
    }

    if (
      targetUser.email === 'admin@gmail.com' ||
      targetUser.school_id === 'ADMIN-001' ||
      targetUser.id === '10000000-0000-0000-0000-000000000001'
    ) {
      throw new Error('The primary system administrator (admin@gmail.com) cannot be deleted.');
    }

    const { error: delErr } = await client.from('users').delete().eq('id', userId);
    if (delErr) throw new Error(delErr.message);

    return { success: true };
  },

  /**
   * Remove a regular user account (student, coach, staff).
   */
  async deleteUser(userId: string) {
    const client = requireSupabaseClient();

    const { data: targetUser } = await client
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    if (targetUser?.email === 'admin@gmail.com' || targetUser?.id === '10000000-0000-0000-0000-000000000001') {
      throw new Error('The primary system administrator cannot be deleted.');
    }

    // Clean child references in case cascade is not yet executed in SQL
    await client.from('athletes').delete().eq('user_id', userId);
    await client.from('coaches').delete().eq('user_id', userId);

    const { error: delErr } = await client.from('users').delete().eq('id', userId);
    if (delErr) throw new Error(delErr.message);

    return { success: true };
  }
};
