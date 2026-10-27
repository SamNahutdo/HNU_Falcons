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

const REPORTS_CACHE_KEY = 'falcon_staff_reports_cache';
const BOOKINGS_CACHE_KEY = 'falcon_coach_bookings_cache';
const ALERTS_CACHE_KEY = 'falcon_return_alerts_cache';

function getLocalReports(): StaffReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: StaffReport[]) {
  try {
    localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(reports));
  } catch {}
}

function getLocalBookings(): CoachBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings: CoachBooking[]) {
  try {
    localStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify(bookings));
  } catch {}
}

function getLocalAlerts(): ReturnAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAlerts(alerts: ReturnAlert[]) {
  try {
    localStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(alerts));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('falcon_alerts_updated', { detail: alerts }));
    }
  } catch {}
}

export const dashboardApi = {
  async getData(): Promise<DashboardData> {
    const client = requireSupabaseClient();

    const [eqRes, spRes, coRes, txRes, bkRes, usRes, repRes] = await Promise.all([
      client.from('equipment').select('*, sport:sports(*)').neq('status', 'retired').order('name'),
      client.from('sports').select('*').order('name'),
      client.from('coaches').select('*, user:users(id, full_name, school_id, status)'),
      client.from('borrowing_transactions').select(`
        *,
        athlete:athletes(*, user:users(id, full_name, school_id, email, role:roles(name))),
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
      `).order('created_at', { ascending: false }),
      client.from('staff_reports').select(`
        *,
        borrower:users!borrower_user_id(full_name, school_id),
        reporter:users!reported_by(full_name),
        item:equipment(name)
      `).order('created_at', { ascending: false })
    ]);

    if (eqRes.error) console.warn('[dashboardApi] Equipment fetch error:', eqRes.error);
    if (spRes.error) console.warn('[dashboardApi] Sports fetch error:', spRes.error);
    if (coRes.error) console.warn('[dashboardApi] Coaches fetch error:', coRes.error);
    if (txRes.error) console.warn('[dashboardApi] Transactions fetch error:', txRes.error);

    // Fetch and merge return alerts
    const localAlerts = getLocalAlerts();
    let remoteAlerts: ReturnAlert[] = [];
    try {
      const altRes = await client.from('return_alerts').select(`
        *,
        recipient:users(full_name, school_id, role:roles(name)),
        transaction:borrowing_transactions(*, items:borrowing_items(*, equipment:equipment(*)))
      `).order('sent_at', { ascending: false });

      if (altRes.data && !altRes.error) {
        remoteAlerts = (altRes.data as any[]).map(a => ({
          id: a.id,
          transaction_id: a.transaction_id,
          recipient_name: a.recipient?.full_name || 'Borrower',
          recipient_school_id: a.recipient?.school_id || '',
          recipient_role: (a.recipient?.role?.name as 'student' | 'coach') || 'student',
          equipment_name: a.transaction?.items?.map((i: any) => i.equipment?.name).filter(Boolean).join(', ') || 'Sports Equipment',
          expected_return_date: a.transaction?.expected_return_date || '',
          message: a.message,
          sent_at: a.sent_at,
          is_read: Boolean(a.is_read)
        }));
      }
    } catch {
      // Remote return_alerts table not available in Supabase schema cache
    }

    const alertMap = new Map<string, ReturnAlert>();
    for (const a of localAlerts) alertMap.set(a.id, a);
    for (const a of remoteAlerts) alertMap.set(a.id, a);
    const alerts: ReturnAlert[] = Array.from(alertMap.values())
      .sort((a, b) => b.sent_at.localeCompare(a.sent_at));

    const alertsByTx = new Map<string, ReturnAlert>();
    for (const a of alerts) {
      if (!alertsByTx.has(a.transaction_id)) {
        alertsByTx.set(a.transaction_id, a);
      }
    }

    const rawTransactions = (txRes.data || []) as any[];
    const transactions: BorrowingTransaction[] = rawTransactions.map(t => {
      const athleteUser = Array.isArray(t.athlete?.user) ? t.athlete?.user[0] : t.athlete?.user;
      const borrowerRole = (Array.isArray(athleteUser?.role) ? athleteUser?.role[0]?.name : athleteUser?.role?.name) || 'student';
      const borrowerName = athleteUser?.full_name || 'Borrower';
      const borrowerSchoolId = athleteUser?.school_id || t.athlete?.student_number || '';
      const existingAlert = alertsByTx.get(t.id);

      return {
        ...t,
        borrower_name: borrowerName,
        borrower_school_id: borrowerSchoolId,
        borrower_role: borrowerRole,
        alert_sent: Boolean(existingAlert),
        last_alert_sent: existingAlert?.sent_at
      };
    });

    const rawBookings = (bkRes.data || []) as any[];
    const remoteBookings: CoachBooking[] = rawBookings.map(b => {
      const studentUser = Array.isArray(b.student?.user) ? b.student?.user[0] : b.student?.user;
      const coachUser = Array.isArray(b.coach?.user) ? b.coach?.user[0] : b.coach?.user;

      return {
        ...b,
        student_name: studentUser?.full_name || b.student_name || 'Student',
        student_school_id: studentUser?.school_id || b.student_school_id || '',
        coach_name: coachUser?.full_name || b.coach_name || 'Coach',
        coach_school_id: coachUser?.school_id || b.coach_school_id || ''
      };
    });

    // Merge remoteBookings with localBookings
    const localBookings = getLocalBookings();
    const bookingMap = new Map<string, CoachBooking>();
    for (const b of localBookings) {
      bookingMap.set(b.id, b);
    }
    for (const b of remoteBookings) {
      bookingMap.set(b.id, b);
    }
    const bookings: CoachBooking[] = Array.from(bookingMap.values())
      .sort((a, b) => (b.created_at || b.booking_date).localeCompare(a.created_at || a.booking_date));

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
        is_online: Boolean(u.is_online),
        status: u.status === 'inactive' ? 'inactive' : u.status === 'suspended' ? 'suspended' : 'active',
        is_verified: u.status === 'active',
        created_at: u.created_at
      };
    });

    const rawReports = (repRes.data || []) as any[];
    const remoteReports: StaffReport[] = rawReports.map(r => {
      const bRole: 'student' | 'coach' = r.borrower?.role?.name === 'coach' ? 'coach' : 'student';
      return {
        id: r.id,
        report_type: r.report_type,
        item_id: r.item_id,
        item_name: r.item?.name || 'Sports Equipment',
        borrower_name: r.borrower?.full_name || 'Borrower',
        borrower_role: bRole,
        borrower_school_id: r.borrower?.school_id || '',
        reported_by: r.reporter?.full_name || 'Staff Custodian',
        description: r.description,
        severity: r.severity || 'medium',
        status: r.status || 'submitted',
        created_at: r.created_at
      };
    });

    const localReports = getLocalReports();
    const reportMap = new Map<string, StaffReport>();
    for (const r of localReports) {
      reportMap.set(r.id, r);
    }
    for (const r of remoteReports) {
      reportMap.set(r.id, r);
    }
    const reports: StaffReport[] = Array.from(reportMap.values())
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

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
    let { data: athlete } = await client
      .from('athletes')
      .select('id')
      .eq('user_id', profile.userId)
      .maybeSingle();

    if (!athlete) {
      // Auto-create athlete profile if missing so foreign key constraint never fails
      const { data: createdAthlete } = await client
        .from('athletes')
        .insert({
          user_id: profile.userId,
          student_number: profile.schoolId || 'STU-' + profile.userId.slice(0, 8),
          department: 'Athletics Department',
          year_level: 1,
          emergency_contact: 'None'
        })
        .select('id')
        .maybeSingle();
      athlete = createdAthlete;
    }

    // Resolve coach profile to get proper coach_id, coach_name, and school_id
    let coachId = data.coach_id;
    let coachName = 'Varsity Coach';
    let coachSchoolId = '';
    const { data: coachRecord } = await client
      .from('coaches')
      .select('id, specialization, user:users(id, full_name, school_id)')
      .or(`id.eq.${coachId},user_id.eq.${coachId}`)
      .maybeSingle();

    if (coachRecord) {
      coachId = coachRecord.id;
      const u = Array.isArray(coachRecord.user) ? coachRecord.user[0] : coachRecord.user;
      if (u?.full_name) coachName = u.full_name;
      if (u?.school_id) coachSchoolId = u.school_id;
    }

    const bookingId = crypto.randomUUID();
    const newBooking: CoachBooking = {
      id: bookingId,
      student_id: athlete?.id || profile.userId,
      student_name: profile.fullName,
      student_school_id: profile.schoolId || '',
      coach_id: coachId,
      coach_name: coachName,
      coach_school_id: coachSchoolId,
      sport: data.sport,
      booking_date: data.booking_date,
      time_slot: data.time_slot,
      purpose: data.purpose,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Save to local cache first so coach and student see it immediately
    const local = getLocalBookings();
    saveLocalBookings([newBooking, ...local.filter(b => b.id !== bookingId)]);

    // Try saving to Supabase coach_bookings table
    if (athlete?.id) {
      try {
        const payload = {
          id: bookingId,
          student_id: athlete.id,
          coach_id: coachId,
          sport: data.sport || 'Varsity Athletics',
          booking_date: data.booking_date,
          time_slot: data.time_slot,
          purpose: data.purpose || 'Varsity Training Session',
          status: 'pending'
        };
        const { error: bError } = await client
          .from('coach_bookings')
          .insert([payload]);

        if (bError) {
          console.warn('[dashboardApi] coach_bookings insert error:', bError.message);
        }
      } catch (err) {
        console.warn('[dashboardApi] coach_bookings insert exception:', err);
      }
    }

    return newBooking;
  },

  async updateBookingStatus(id: string, status: 'approved' | 'rejected' | 'completed', coach_notes?: string) {
    const client = requireSupabaseClient();
    try {
      await client
        .from('coach_bookings')
        .update({ status, ...(coach_notes ? { coach_notes } : {}) })
        .eq('id', id);
    } catch (err) {
      console.warn('[dashboardApi] updateBookingStatus error:', err);
    }

    const local = getLocalBookings();
    const updated = local.map(b => b.id === id ? { ...b, status, coach_notes: coach_notes || b.coach_notes } : b);
    saveLocalBookings(updated);

    return { success: true };
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

    // 2. Identify the target borrower user
    let targetIdentifier = data.borrower_school_id?.trim();
    if (!targetIdentifier && profile) {
      targetIdentifier = profile.schoolId || profile.email || profile.fullName;
    }

    let borrowerUser: any = null;

    if (targetIdentifier) {
      // Look up by school_id
      const { data: uBySchool } = await client
        .from('users')
        .select('id, full_name, school_id, email, role:roles(name)')
        .ilike('school_id', targetIdentifier)
        .maybeSingle();

      if (uBySchool) borrowerUser = uBySchool;

      // Look up by email if not found
      if (!borrowerUser) {
        const { data: uByEmail } = await client
          .from('users')
          .select('id, full_name, school_id, email, role:roles(name)')
          .ilike('email', targetIdentifier)
          .maybeSingle();
        if (uByEmail) borrowerUser = uByEmail;
      }

      // Look up by user id if targetIdentifier is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetIdentifier);
      if (!borrowerUser && isUuid) {
        const { data: uById } = await client
          .from('users')
          .select('id, full_name, school_id, email, role:roles(name)')
          .eq('id', targetIdentifier)
          .maybeSingle();
        if (uById) borrowerUser = uById;
      }

      // Look up by full_name if still not found
      if (!borrowerUser) {
        const { data: uByName } = await client
          .from('users')
          .select('id, full_name, school_id, email, role:roles(name)')
          .ilike('full_name', targetIdentifier)
          .maybeSingle();
        if (uByName) borrowerUser = uByName;
      }
    }

    // Fall back to currently authenticated profile user if still not found
    if (!borrowerUser && profile?.userId) {
      const { data: uProfile } = await client
        .from('users')
        .select('id, full_name, school_id, email, role:roles(name)')
        .eq('id', profile.userId)
        .maybeSingle();
      if (uProfile) borrowerUser = uProfile;
    }

    if (!borrowerUser) {
      throw new Error(`Please select or specify a valid registered borrower (${targetIdentifier || 'unknown'}).`);
    }

    // 3. Ensure borrower has an athlete record in the database
    let athleteId: string | null = null;
    const { data: existingAth } = await client
      .from('athletes')
      .select('id')
      .eq('user_id', borrowerUser.id)
      .maybeSingle();

    if (existingAth?.id) {
      athleteId = existingAth.id;
    } else {
      // Auto-create borrower row in athletes table
      const rName = (Array.isArray(borrowerUser.role) ? borrowerUser.role[0]?.name : borrowerUser.role?.name) || 'student';
      const studentNum = borrowerUser.school_id || `${rName.toUpperCase()}-${borrowerUser.id.slice(0, 8)}`;
      const department = rName === 'coach' ? 'Athletics Coaching Staff' : 'Athletics Department';

      const { data: newAth, error: athErr } = await client
        .from('athletes')
        .insert({
          user_id: borrowerUser.id,
          student_number: studentNum,
          department,
          year_level: 1,
          emergency_contact: 'Athletics Office'
        })
        .select('id')
        .single();

      if (!athErr && newAth) {
        athleteId = newAth.id;
      } else {
        const { data: retryAth } = await client
          .from('athletes')
          .select('id')
          .eq('user_id', borrowerUser.id)
          .maybeSingle();
        if (retryAth?.id) athleteId = retryAth.id;
      }
    }

    if (!athleteId) {
      throw new Error(`Could not link or create borrower record for ${borrowerUser.full_name}.`);
    }

    // 4. Create borrowing transaction
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

    // 5. Create borrowing item line
    await client.from('borrowing_items').insert([{
      transaction_id: tx.id,
      equipment_id: data.equipment_id,
      quantity: data.quantity,
      return_status: 'borrowed'
    }]);

    // 6. Update equipment quantity
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

  async sendReturnAlert(
    transaction_id: string,
    message?: string,
    details?: {
      recipient_name?: string;
      recipient_school_id?: string;
      recipient_role?: 'student' | 'coach';
      equipment_name?: string;
      expected_return_date?: string;
    }
  ) {
    const client = requireSupabaseClient();

    // Look up transaction to fetch borrower details
    let recipientName = details?.recipient_name || 'Borrower';
    let recipientSchoolId = details?.recipient_school_id || '';
    let recipientRole: 'student' | 'coach' = details?.recipient_role || 'student';
    let equipmentName = details?.equipment_name || 'Borrowed sports equipment';
    let expectedReturnDate = details?.expected_return_date || new Date().toISOString().slice(0, 10);
    let recipientUserId = '';

    try {
      const { data: tx } = await client
        .from('borrowing_transactions')
        .select(`
          *,
          athlete:athletes(*, user:users(id, full_name, school_id, email, role:roles(name))),
          items:borrowing_items(*, equipment:equipment(*))
        `)
        .eq('id', transaction_id)
        .maybeSingle();

      if (tx) {
        const u = Array.isArray(tx.athlete?.user) ? tx.athlete?.user[0] : tx.athlete?.user;
        if (u?.full_name) recipientName = u.full_name;
        if (u?.school_id) recipientSchoolId = u.school_id;
        if (u?.id) recipientUserId = u.id;
        if (u?.role?.name === 'coach') recipientRole = 'coach';
        if (tx.expected_return_date) expectedReturnDate = tx.expected_return_date;

        const eqNames = tx.items?.map((item: any) => item.equipment?.name).filter(Boolean);
        if (eqNames && eqNames.length > 0) {
          equipmentName = eqNames.join(', ');
        } else if (tx.remarks) {
          equipmentName = tx.remarks;
        }
      }
    } catch (err) {
      console.warn('[dashboardApi] Error fetching transaction for alert:', err);
    }

    if (details?.recipient_name && (recipientName === 'Borrower' || !recipientName)) {
      recipientName = details.recipient_name;
    }
    if (details?.recipient_school_id && !recipientSchoolId) {
      recipientSchoolId = details.recipient_school_id;
    }
    if (details?.equipment_name && equipmentName === 'Borrowed sports equipment') {
      equipmentName = details.equipment_name;
    }
    if (details?.expected_return_date && !expectedReturnDate) {
      expectedReturnDate = details.expected_return_date;
    }

    const alertMessage = message || `Please return ${equipmentName} by ${expectedReturnDate}.`;
    const alertId = crypto.randomUUID();
    const newAlert: ReturnAlert = {
      id: alertId,
      transaction_id,
      recipient_name: recipientName,
      recipient_school_id: recipientSchoolId,
      recipient_role: recipientRole,
      equipment_name: equipmentName,
      expected_return_date: expectedReturnDate,
      message: alertMessage,
      sent_at: new Date().toISOString(),
      is_read: false
    };

    const currentAlerts = getLocalAlerts();
    saveLocalAlerts([newAlert, ...currentAlerts.filter(a => a.id !== alertId)]);

    // Try inserting into Supabase return_alerts table if present
    try {
      if (recipientUserId) {
        await client.from('return_alerts').insert([{
          id: alertId,
          transaction_id,
          recipient_user_id: recipientUserId,
          message: alertMessage,
          sent_at: newAlert.sent_at,
          is_read: false
        }]);
      }
    } catch {
      // Table may not exist remotely; local storage cache ensures functional alert dispatch
    }

    return newAlert;
  },

  async markAlertAsRead(alertId: string) {
    const currentAlerts = getLocalAlerts();
    const updated = currentAlerts.map(a => a.id === alertId ? { ...a, is_read: true } : a);
    saveLocalAlerts(updated);

    try {
      const client = requireSupabaseClient();
      await client.from('return_alerts').update({ is_read: true }).eq('id', alertId);
    } catch {}

    return { success: true };
  },

  async createReport(data: {
    report_type: StaffReport['report_type'];
    borrower_school_id: string;
    item_id?: string;
    description: string;
    severity: StaffReport['severity'];
  }) {
    const client = requireSupabaseClient();
    const profile = await authService.getCurrentProfile();

    const { data: borrowerUser } = await client
      .from('users')
      .select('id, full_name, school_id, role:roles(name)')
      .eq('school_id', data.borrower_school_id)
      .maybeSingle();

    let itemName = 'Sports Equipment';
    if (data.item_id) {
      const { data: eq } = await client
        .from('equipment')
        .select('name')
        .eq('id', data.item_id)
        .maybeSingle();
      if (eq?.name) itemName = eq.name;
    }

    const borrowerId = borrowerUser?.id || profile?.userId || '00000000-0000-0000-0000-000000000002';
    const reportedBy = profile?.userId || '00000000-0000-0000-0000-000000000002';
    const reportId = crypto.randomUUID();

    const roleData = (borrowerUser as any)?.role;
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
    const bRole: 'student' | 'coach' = roleName === 'coach' ? 'coach' : 'student';
    const newReport: StaffReport = {
      id: reportId,
      report_type: data.report_type,
      item_id: data.item_id,
      item_name: itemName,
      borrower_name: borrowerUser?.full_name || 'Borrower',
      borrower_role: bRole,
      borrower_school_id: data.borrower_school_id,
      reported_by: profile?.fullName || 'Staff Custodian',
      description: data.description,
      severity: data.severity,
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    const local = getLocalReports();
    saveLocalReports([newReport, ...local.filter(r => r.id !== reportId)]);

    try {
      const { error: repError } = await client.from('staff_reports').insert([{
        id: reportId,
        report_type: data.report_type,
        item_id: data.item_id || null,
        borrower_user_id: borrowerId,
        reported_by: reportedBy,
        description: data.description,
        severity: data.severity,
        status: 'submitted'
      }]);

      if (repError) {
        console.warn('[dashboardApi] staff_reports insert error in Supabase:', repError.message);
      }
    } catch (err) {
      console.warn('[dashboardApi] staff_reports insert exception:', err);
    }

    return newReport;
  },

  async updateReportStatus(id: string, status: 'reviewed' | 'resolved') {
    const client = requireSupabaseClient();
    try {
      await client
        .from('staff_reports')
        .update({ status })
        .eq('id', id);
    } catch (err) {
      console.warn('[dashboardApi] updateReportStatus error:', err);
    }

    const local = getLocalReports();
    const updated = local.map(r => r.id === id ? { ...r, status } : r);
    saveLocalReports(updated);

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
    if (action === 'toggle_presence') {
      const { data: currentUser } = await client.from('users').select('is_online').eq('id', id).maybeSingle();
      const nextOnline = currentUser ? !currentUser.is_online : true;
      const { data, error } = await client
        .from('users')
        .update({ is_online: nextOnline })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

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
