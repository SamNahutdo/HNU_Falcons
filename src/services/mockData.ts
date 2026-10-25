import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supaUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient | null = (supaUrl && supaKey && supaUrl.startsWith('http'))
  ? createClient(supaUrl, supaKey)
  : null;

import {
  Role,
  User,
  Athlete,
  Coach,
  Sport,
  Team,
  TeamMember,
  Equipment,
  BorrowingTransaction,
  BorrowingItem,
  MaintenanceRecord,
  AuditLog,
  ActiveLoansSummaryView,
  EquipmentInventoryStatusView,
  RegisteredAccount,
  CoachBooking,
  StaffReport,
  ReturnAlert,
  UserRole
} from '../types/database';

export const initialRoles: Role[] = [
  { id: 'role-1', name: 'admin', description: 'Institutional Athletic Director', created_at: '2025-01-01T00:00:00Z' },
  { id: 'role-2', name: 'staff', description: 'Equipment Desk & Custodian', created_at: '2025-01-01T00:00:00Z' },
  { id: 'role-3', name: 'coach', description: 'Varsity Head & Assistant Coach', created_at: '2025-01-01T00:00:00Z' },
  { id: 'role-4', name: 'student', description: 'Collegiate Student Athlete', created_at: '2025-01-01T00:00:00Z' }
];

export const initialRegisteredAccounts: RegisteredAccount[] = [
  {
    id: 'user-adm-1',
    school_id: '06000000',
    full_name: "Ma'am Arbe",
    username: 'arbe',
    password: 'password123',
    role: 'admin',
    department: 'Athletic Department Head Office',
    is_online: true,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: 'user-stf-1',
    school_id: '20230014',
    full_name: 'Samuel Angelo Udtohan',
    username: 'samuel',
    password: 'password123',
    role: 'staff',
    department: 'Sports Equipment Operations',
    is_online: true,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-02T08:00:00Z'
  },
  {
    id: 'user-stf-2',
    school_id: '20230028',
    full_name: 'Carla Reyes',
    username: 'carla',
    password: 'password123',
    role: 'staff',
    department: 'Field House Equipment Custodian',
    is_online: false,
    status: 'active',
    is_verified: true,
    created_at: '2025-02-01T08:00:00Z'
  },
  {
    id: 'user-cch-1',
    school_id: '20210088',
    full_name: 'Ace Arcamo',
    username: 'ace',
    password: 'password123',
    role: 'coach',
    specialization: 'Baseball & Conditioning',
    department: 'Varsity Baseball Division',
    is_online: true,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-05T08:00:00Z'
  },
  {
    id: 'user-cch-2',
    school_id: '20220045',
    full_name: 'Maria Santos',
    username: 'maria',
    password: 'password123',
    role: 'coach',
    specialization: 'Volleyball & Tactical Defense',
    department: 'Varsity Volleyball Division',
    is_online: false,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    id: 'user-stu-1',
    school_id: '202400101',
    full_name: 'Riza Velasco',
    username: 'riza',
    password: 'password123',
    role: 'student',
    department: 'College of Computer Studies',
    is_online: true,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    id: 'user-stu-2',
    school_id: '202300452',
    full_name: 'Mark Bautista',
    username: 'mark',
    password: 'password123',
    role: 'student',
    department: 'College of Engineering',
    is_online: true,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    id: 'user-stu-3',
    school_id: '202400789',
    full_name: 'Janine Cruz',
    username: 'janine',
    password: 'password123',
    role: 'student',
    department: 'College of Education',
    is_online: false,
    status: 'active',
    is_verified: true,
    created_at: '2025-01-15T08:00:00Z'
  },
  {
    id: 'user-stu-4',
    school_id: '202400332',
    full_name: 'Carlos Dizon',
    username: 'carlos',
    password: 'password123',
    role: 'student',
    department: 'School of Business & Management',
    is_online: false,
    status: 'active',
    is_verified: true,
    created_at: '2025-02-01T08:00:00Z'
  }
];

export const initialUsers: User[] = initialRegisteredAccounts.map(a => ({
  id: a.id,
  email: `${a.username}@falcon.edu`,
  full_name: a.full_name,
  role_id: a.role === 'admin' ? 'role-1' : a.role === 'staff' ? 'role-2' : a.role === 'coach' ? 'role-3' : 'role-4',
  school_id: a.school_id,
  status: a.status,
  is_online: a.is_online,
  created_at: a.created_at
}));

export const initialAthletes: Athlete[] = [
  {
    id: 'ath-1',
    user_id: 'user-stu-1',
    student_number: '202400101',
    department: 'College of Computer Studies',
    year_level: 3,
    emergency_contact: '0917-123-4567',
    created_at: '2025-01-10T00:00:00Z'
  },
  {
    id: 'ath-2',
    user_id: 'user-stu-2',
    student_number: '202300452',
    department: 'College of Engineering',
    year_level: 4,
    emergency_contact: '0918-555-8899',
    created_at: '2025-01-10T00:00:00Z'
  },
  {
    id: 'ath-3',
    user_id: 'user-stu-3',
    student_number: '202400789',
    department: 'College of Education',
    year_level: 2,
    emergency_contact: '0920-333-4411',
    created_at: '2025-01-15T00:00:00Z'
  },
  {
    id: 'ath-4',
    user_id: 'user-stu-4',
    student_number: '202400332',
    department: 'School of Business & Management',
    year_level: 1,
    emergency_contact: '0919-888-2233',
    created_at: '2025-02-01T00:00:00Z'
  }
];

export const initialCoaches: Coach[] = [
  {
    id: 'cch-1',
    user_id: 'user-cch-1',
    employee_number: '20210088',
    specialization: 'Baseball & Conditioning',
    license_level: 'Head Coach Level 2',
    available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    available_hours: '08:00 AM - 11:30 AM & 02:00 PM - 05:00 PM',
    created_at: '2025-01-05T00:00:00Z'
  },
  {
    id: 'cch-2',
    user_id: 'user-cch-2',
    employee_number: '20220045',
    specialization: 'Volleyball & Tactical Defense',
    license_level: 'Head Coach Level 1',
    available_days: ['Tuesday', 'Thursday', 'Saturday'],
    available_hours: '09:00 AM - 12:00 PM & 03:00 PM - 06:00 PM',
    created_at: '2025-01-10T00:00:00Z'
  }
];

export const initialSports: Sport[] = [
  { id: 'spt-1', name: 'Baseball', category: 'Team', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: 'spt-2', name: 'Volleyball', category: 'Team', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: 'spt-3', name: 'Basketball', category: 'Team', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: 'spt-4', name: 'Table Tennis', category: 'Individual', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: 'spt-5', name: 'Badminton', category: 'Dual', status: 'active', created_at: '2025-01-01T00:00:00Z' }
];

export const initialTeams: Team[] = [
  { id: 'team-1', sport_id: 'spt-1', coach_id: 'cch-1', team_name: 'Falcons Men Varsity Baseball', school_year: '2025-2026', status: 'active', created_at: '2025-01-05T00:00:00Z' },
  { id: 'team-2', sport_id: 'spt-2', coach_id: 'cch-2', team_name: 'Falcons Women Varsity Volleyball', school_year: '2025-2026', status: 'active', created_at: '2025-01-10T00:00:00Z' },
  { id: 'team-3', sport_id: 'spt-4', coach_id: 'cch-1', team_name: 'Falcons Table Tennis Squad', school_year: '2025-2026', status: 'active', created_at: '2025-01-12T00:00:00Z' }
];

export const initialTeamMembers: TeamMember[] = [
  { id: 'tm-1', team_id: 'team-1', athlete_id: 'ath-2', position: 'Pitcher', jersey_number: 18, joined_at: '2024-08-15', status: 'active', created_at: '2025-01-10T00:00:00Z' },
  { id: 'tm-2', team_id: 'team-2', athlete_id: 'ath-3', position: 'Open Hitter', jersey_number: 9, joined_at: '2024-09-01', status: 'active', created_at: '2025-01-15T00:00:00Z' },
  { id: 'tm-3', team_id: 'team-3', athlete_id: 'ath-1', position: 'Singles Player', jersey_number: 7, joined_at: '2024-09-01', status: 'active', created_at: '2025-01-10T00:00:00Z' }
];

// Realistic athletics equipment with realistic available days & stock
export const initialEquipment: Equipment[] = [
  {
    id: 'eq-1',
    sport_id: 'spt-1',
    equipment_code: 'EQ-BS-001',
    name: 'Easton Alpha ALX (-3) Alloy Baseball Bat 33"',
    category: 'Bat',
    total_quantity: 24,
    available_quantity: 19,
    condition: 'good',
    status: 'available',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    condition_notes: 'All bats inspected; grip tapes in good condition.',
    last_inspected: '2026-10-15',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z'
  },
  {
    id: 'eq-2',
    sport_id: 'spt-1',
    equipment_code: 'EQ-BS-002',
    name: 'Rawlings Heart of the Hide Fielding Glove 11.5"',
    category: 'Glove',
    total_quantity: 30,
    available_quantity: 26,
    condition: 'good',
    status: 'available',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    condition_notes: 'Oiled and conditioned monthly.',
    last_inspected: '2026-10-16',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z'
  },
  {
    id: 'eq-3',
    sport_id: 'spt-1',
    equipment_code: 'EQ-BS-003',
    name: 'Schutt Vengeance Pro Field Scrimmage Helmet',
    category: 'Protective Gear',
    total_quantity: 20,
    available_quantity: 16,
    condition: 'good',
    status: 'available',
    available_days: ['Monday', 'Wednesday', 'Friday'],
    condition_notes: 'Jaw pads sanitized regularly.',
    last_inspected: '2026-10-14',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-10-14T00:00:00Z'
  },
  {
    id: 'eq-4',
    sport_id: 'spt-2',
    equipment_code: 'EQ-VB-001',
    name: 'Mikasa V200W Official FIVB Competition Volleyball',
    category: 'Ball',
    total_quantity: 35,
    available_quantity: 31,
    condition: 'good',
    status: 'available',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    condition_notes: 'Air pressure checked at 4.3 psi.',
    last_inspected: '2026-10-18',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2026-10-18T00:00:00Z'
  },
  {
    id: 'eq-5',
    sport_id: 'spt-3',
    equipment_code: 'EQ-BB-001',
    name: 'Wilson NCAA Evo Indoor Official Match Basketball Size 7',
    category: 'Ball',
    total_quantity: 28,
    available_quantity: 24,
    condition: 'good',
    status: 'available',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    condition_notes: 'Microfiber composite surface in excellent shape.',
    last_inspected: '2026-10-17',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2026-10-17T00:00:00Z'
  },
  {
    id: 'eq-6',
    sport_id: 'spt-4',
    equipment_code: 'EQ-TT-001',
    name: 'Butterfly Viscaria Table Tennis Carbon Paddle',
    category: 'Racket',
    total_quantity: 16,
    available_quantity: 14,
    condition: 'fair',
    status: 'available',
    available_days: ['Tuesday', 'Thursday', 'Saturday'],
    condition_notes: 'Edge tape slightly worn on unit 3, rubber still high friction.',
    last_inspected: '2026-10-10',
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z'
  },
  {
    id: 'eq-7',
    sport_id: 'spt-5',
    equipment_code: 'EQ-BD-001',
    name: 'Yonex Astrox 88D Pro Graphite Badminton Racket',
    category: 'Racket',
    total_quantity: 18,
    available_quantity: 15,
    condition: 'good',
    status: 'available',
    available_days: ['Monday', 'Wednesday', 'Friday'],
    condition_notes: 'String tension set to 26 lbs.',
    last_inspected: '2026-10-12',
    created_at: '2025-01-04T00:00:00Z',
    updated_at: '2026-10-12T00:00:00Z'
  }
];

// Realistic Borrowing Transactions
export const initialBorrowingTransactions: BorrowingTransaction[] = [
  {
    id: 'tx-101',
    athlete_id: 'ath-1',
    borrower_name: 'Riza Velasco',
    borrower_role: 'student',
    borrower_school_id: '202400101',
    approved_by: 'user-stf-1',
    borrow_date: '2026-10-18T09:00:00Z',
    expected_return_date: '2026-10-22',
    actual_return_date: null,
    status: 'active',
    remarks: 'Inter-department training practice',
    created_at: '2026-10-18T09:00:00Z'
  },
  {
    id: 'tx-102',
    athlete_id: 'ath-2',
    borrower_name: 'Mark Bautista',
    borrower_role: 'student',
    borrower_school_id: '202300452',
    approved_by: 'user-stf-1',
    borrow_date: '2026-10-14T10:30:00Z',
    expected_return_date: '2026-10-19', // Past due date!
    actual_return_date: null,
    status: 'overdue',
    remarks: 'Batting cage scrimmage preparation',
    created_at: '2026-10-14T10:30:00Z',
    alert_sent: true,
    last_alert_sent: '2026-10-20T08:15:00Z'
  },
  {
    id: 'tx-103',
    athlete_id: 'cch-1',
    borrower_name: 'Ace Arcamo',
    borrower_role: 'coach',
    borrower_school_id: '20210088',
    approved_by: 'user-stf-1',
    borrow_date: '2026-10-19T08:00:00Z',
    expected_return_date: '2026-10-24',
    actual_return_date: null,
    status: 'active',
    remarks: 'Varsity baseball squad fielding drills',
    created_at: '2026-10-19T08:00:00Z'
  },
  {
    id: 'tx-104',
    athlete_id: 'ath-3',
    borrower_name: 'Janine Cruz',
    borrower_role: 'student',
    borrower_school_id: '202400789',
    approved_by: 'user-stf-1',
    borrow_date: '2026-10-12T14:00:00Z',
    expected_return_date: '2026-10-16',
    actual_return_date: '2026-10-16T16:00:00Z',
    status: 'returned',
    remarks: 'Volleyball jump serve clinic',
    created_at: '2026-10-12T14:00:00Z'
  }
];

export const initialBorrowingItems: BorrowingItem[] = [
  {
    id: 'bi-1',
    transaction_id: 'tx-101',
    equipment_id: 'eq-6',
    quantity: 2,
    returned_quantity: 0,
    condition_before: 'fair',
    condition_after: null,
    return_status: 'borrowed',
    created_at: '2026-10-18T09:00:00Z'
  },
  {
    id: 'bi-2',
    transaction_id: 'tx-102',
    equipment_id: 'eq-1',
    quantity: 2,
    returned_quantity: 0,
    condition_before: 'good',
    condition_after: null,
    return_status: 'borrowed',
    created_at: '2026-10-14T10:30:00Z'
  },
  {
    id: 'bi-3',
    transaction_id: 'tx-103',
    equipment_id: 'eq-2',
    quantity: 4,
    returned_quantity: 0,
    condition_before: 'good',
    condition_after: null,
    return_status: 'borrowed',
    created_at: '2026-10-19T08:00:00Z'
  },
  {
    id: 'bi-4',
    transaction_id: 'tx-104',
    equipment_id: 'eq-4',
    quantity: 4,
    returned_quantity: 4,
    condition_before: 'good',
    condition_after: 'good',
    return_status: 'returned',
    created_at: '2026-10-12T14:00:00Z'
  }
];

// Realistic Coach Bookings (Student booking a coach)
export const initialCoachBookings: CoachBooking[] = [
  {
    id: 'cb-1',
    student_id: 'user-stu-1',
    student_name: 'Riza Velasco',
    student_school_id: '202400101',
    coach_id: 'user-cch-1',
    coach_name: 'Ace Arcamo',
    coach_school_id: '20210088',
    sport: 'Baseball',
    booking_date: '2026-10-24',
    time_slot: '09:00 AM - 10:30 AM',
    purpose: 'Batting mechanics, stance adjustment, and strike zone discipline',
    status: 'approved',
    coach_notes: 'Confirmed. Bring personal batting gloves to Diamond 1.',
    created_at: '2026-10-18T11:00:00Z'
  },
  {
    id: 'cb-2',
    student_id: 'user-stu-2',
    student_name: 'Mark Bautista',
    student_school_id: '202300452',
    coach_id: 'user-cch-1',
    coach_name: 'Ace Arcamo',
    coach_school_id: '20210088',
    sport: 'Baseball',
    booking_date: '2026-10-26',
    time_slot: '02:00 PM - 03:30 PM',
    purpose: 'Bullpen pitch velocity and curveball grip coaching',
    status: 'pending',
    created_at: '2026-10-20T09:30:00Z'
  },
  {
    id: 'cb-3',
    student_id: 'user-stu-3',
    student_name: 'Janine Cruz',
    student_school_id: '202400789',
    coach_id: 'user-cch-2',
    coach_name: 'Maria Santos',
    coach_school_id: '20220045',
    sport: 'Volleyball',
    booking_date: '2026-10-23',
    time_slot: '10:00 AM - 11:30 AM',
    purpose: 'Serve receive footwork and rotational defense positioning',
    status: 'approved',
    coach_notes: 'Approved. Court 2 at the Main Gymnasium.',
    created_at: '2026-10-19T14:15:00Z'
  }
];

// Realistic Staff Reports to Admin (Item broken by student/coach, unreturned on time)
export const initialStaffReports: StaffReport[] = [
  {
    id: 'rep-1',
    report_type: 'damaged_equipment',
    item_id: 'eq-2',
    item_name: 'Rawlings Heart of the Hide Fielding Glove 11.5"',
    borrower_name: 'Mark Bautista',
    borrower_role: 'student',
    borrower_school_id: '202300452',
    reported_by: 'Samuel Angelo Udtohan',
    description: 'Leather lacing broke during aggressive diving drill. Needs professional relacing.',
    severity: 'medium',
    status: 'submitted',
    created_at: '2026-10-19T16:20:00Z'
  },
  {
    id: 'rep-2',
    report_type: 'overdue_return',
    item_id: 'eq-1',
    item_name: 'Easton Alpha ALX (-3) Alloy Baseball Bat 33"',
    borrower_name: 'Mark Bautista',
    borrower_role: 'student',
    borrower_school_id: '202300452',
    reported_by: 'Samuel Angelo Udtohan',
    description: 'Loan deadline expired on 2026-10-19. Borrower has not returned 2 bats despite alert sent.',
    severity: 'high',
    status: 'submitted',
    created_at: '2026-10-20T08:30:00Z'
  }
];

// Return alerts sent to students/coaches
export const initialReturnAlerts: ReturnAlert[] = [
  {
    id: 'alt-1',
    transaction_id: 'tx-102',
    recipient_name: 'Mark Bautista',
    recipient_school_id: '202300452',
    recipient_role: 'student',
    equipment_name: 'Easton Alpha ALX (-3) Alloy Baseball Bat 33"',
    expected_return_date: '2026-10-19',
    message: 'URGENT: Your equipment loan has exceeded its return deadline. Return immediately to the Equipment Desk.',
    sent_at: '2026-10-20T08:15:00Z',
    is_read: false
  }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'mr-1',
    equipment_id: 'eq-2',
    reported_by: 'user-stf-1',
    issue_description: 'Relace webbing and replace torn finger lace on Rawlings glove',
    scheduled_date: '2026-10-25',
    cost: 320.00,
    status: 'pending',
    created_at: '2026-10-19T16:20:00Z'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    table_name: 'equipment',
    record_id: 'eq-1',
    action_type: 'INSERT',
    old_data: null,
    new_data: { name: 'Easton Alpha ALX Baseball Bat 33"', total_quantity: 24, available_quantity: 24 },
    performed_by: 'user-adm-1',
    created_at: '2025-01-01T08:00:00Z'
  }
];

export function calculateOverdueDays(expectedDateStr: string, actualDateStr: string | null): number {
  const refDate = actualDateStr ? new Date(actualDateStr) : new Date();
  const expectedDate = new Date(expectedDateStr);
  const diffTime = refDate.getTime() - expectedDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

const STORAGE_USERS = 'falcon_registered_accounts';
const STORAGE_EQUIPMENT = 'falcon_equipment_list';
const STORAGE_TRANSACTIONS = 'falcon_transactions';
const STORAGE_BOOKINGS = 'falcon_coach_bookings';
const STORAGE_REPORTS = 'falcon_staff_reports';
const STORAGE_ALERTS = 'falcon_return_alerts';

class MockDatabaseStore {
  registeredAccounts: RegisteredAccount[] = [];
  roles: Role[] = [...initialRoles];
  users: User[] = [...initialUsers];
  athletes: Athlete[] = [...initialAthletes];
  coaches: Coach[] = [...initialCoaches];
  sports: Sport[] = [...initialSports];
  teams: Team[] = [...initialTeams];
  teamMembers: TeamMember[] = [...initialTeamMembers];
  equipment: Equipment[] = [];
  borrowingTransactions: BorrowingTransaction[] = [];
  borrowingItems: BorrowingItem[] = [...initialBorrowingItems];
  coachBookings: CoachBooking[] = [];
  staffReports: StaffReport[] = [];
  returnAlerts: ReturnAlert[] = [];
  maintenanceRecords: MaintenanceRecord[] = [...initialMaintenanceRecords];
  auditLogs: AuditLog[] = [...initialAuditLogs];

  private listeners: (() => void)[] = [];

  constructor() {
    this.initStorage();
    if (supabase) {
      this.syncFromSupabase();
      try {
        supabase
          .channel('public-db-sync')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            this.syncFromSupabase();
          })
          .subscribe();
      } catch (e) {
        console.warn('[Realtime error]', e);
      }
    }
  }

  async syncFromSupabase() {
    if (!supabase) return;
    try {
      const [uRes, cRes, athRes, eRes, txRes, sRes, tRes, mRes, aRes] = await Promise.all([
        supabase.from('users').select('*, role:roles(*)'),
        supabase.from('coaches').select('*, user:users(*)'),
        supabase.from('athletes').select('*, user:users(*)'),
        supabase.from('equipment').select('*, sport:sports(*)'),
        supabase.from('borrowing_transactions').select('*, items:borrowing_items(*, equipment:equipment(*)), athlete:athletes(*, user:users(*))'),
        supabase.from('sports').select('*'),
        supabase.from('teams').select('*, sport:sports(*), coach:coaches(*, user:users(*))'),
        supabase.from('maintenance_records').select('*, equipment:equipment(*), reporter:users(*)'),
        supabase.from('audit_logs').select('*, performer:users(*)')
      ]);

      let hasUpdated = false;

      if (uRes.data && uRes.data.length > 0) {
        const liveUsers = uRes.data.map((u: any) => ({
          id: u.id,
          school_id: u.school_id || u.id.slice(0, 8),
          full_name: u.full_name,
          username: u.email.split('@')[0],
          password: 'password123',
          role: Array.isArray(u.role) ? u.role[0]?.name : (u.role?.name || 'student'),
          department: u.department || 'Falcon Athletics',
          is_online: true,
          status: u.status || 'active',
          is_verified: u.status === 'active',
          created_at: u.created_at
        }));
        this.registeredAccounts = liveUsers;
        this.users = uRes.data.map((u: any) => ({
          id: u.id,
          role_id: u.role_id,
          username: u.email.split('@')[0],
          email: u.email,
          full_name: u.full_name,
          school_id: u.school_id,
          status: u.status,
          created_at: u.created_at
        }));
        hasUpdated = true;
      }

      if (cRes && cRes.data && cRes.data.length > 0) {
        this.coaches = cRes.data.map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          employee_number: c.employee_number,
          specialization: c.specialization,
          license_level: c.license_level,
          available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
          available_hours: '08:00 AM - 11:30 AM & 02:00 PM - 05:00 PM',
          created_at: c.created_at,
          user: c.user
        }));
        hasUpdated = true;
      }

      if (athRes && athRes.data && athRes.data.length > 0) {
        this.athletes = athRes.data.map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          student_number: a.student_number,
          department: a.department,
          year_level: a.year_level,
          emergency_contact: a.emergency_contact,
          created_at: a.created_at,
          user: a.user
        }));
        hasUpdated = true;
      }

      if (eRes.data && eRes.data.length > 0) {
        this.equipment = eRes.data.map((e: any) => ({
          ...e,
          sport: e.sport
        }));
        hasUpdated = true;
      }

      if (txRes.data && txRes.data.length > 0) {
        this.borrowingTransactions = txRes.data.map((tx: any) => ({
          ...tx,
          borrower_name: tx.athlete?.user?.full_name || 'Borrower',
          borrower_role: 'student',
          borrower_school_id: tx.athlete?.student_number || 'N/A',
          items: tx.items || []
        }));
        hasUpdated = true;
      }

      if (sRes.data && sRes.data.length > 0) { this.sports = sRes.data; hasUpdated = true; }
      if (tRes.data && tRes.data.length > 0) { this.teams = tRes.data; hasUpdated = true; }
      if (mRes.data && mRes.data.length > 0) { this.maintenanceRecords = mRes.data; hasUpdated = true; }
      if (aRes.data && aRes.data.length > 0) { this.auditLogs = aRes.data; hasUpdated = true; }

      if (hasUpdated) {
        this.notify();
      }
    } catch (err) {
      console.warn('[SyncFromSupabase Error]', err);
    }
  }

  private initStorage() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_USERS);
      this.registeredAccounts = storedUsers
        ? (JSON.parse(storedUsers) as RegisteredAccount[]).map(account => ({
            ...account,
            is_verified: account.is_verified ?? true
          }))
        : [...initialRegisteredAccounts];

      const storedEq = localStorage.getItem(STORAGE_EQUIPMENT);
      this.equipment = storedEq ? JSON.parse(storedEq) : [...initialEquipment];

      const storedTx = localStorage.getItem(STORAGE_TRANSACTIONS);
      this.borrowingTransactions = storedTx ? JSON.parse(storedTx) : [...initialBorrowingTransactions];

      const storedBookings = localStorage.getItem(STORAGE_BOOKINGS);
      this.coachBookings = storedBookings ? JSON.parse(storedBookings) : [...initialCoachBookings];

      const storedReports = localStorage.getItem(STORAGE_REPORTS);
      this.staffReports = storedReports ? JSON.parse(storedReports) : [...initialStaffReports];

      const storedAlerts = localStorage.getItem(STORAGE_ALERTS);
      this.returnAlerts = storedAlerts ? JSON.parse(storedAlerts) : [...initialReturnAlerts];
    } catch {
      this.registeredAccounts = [...initialRegisteredAccounts];
      this.equipment = [...initialEquipment];
      this.borrowingTransactions = [...initialBorrowingTransactions];
      this.coachBookings = [...initialCoachBookings];
      this.staffReports = [...initialStaffReports];
      this.returnAlerts = [...initialReturnAlerts];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_USERS, JSON.stringify(this.registeredAccounts));
      localStorage.setItem(STORAGE_EQUIPMENT, JSON.stringify(this.equipment));
      localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(this.borrowingTransactions));
      localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(this.coachBookings));
      localStorage.setItem(STORAGE_REPORTS, JSON.stringify(this.staffReports));
      localStorage.setItem(STORAGE_ALERTS, JSON.stringify(this.returnAlerts));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.persist();
    this.listeners.forEach(l => l());
  }

  // User & Registration operations (Requires School ID)
  getRegisteredUsers(role?: UserRole): RegisteredAccount[] {
    if (!role) return this.registeredAccounts;
    return this.registeredAccounts.filter(u => u.role === role);
  }

  registerUser(acc: Omit<RegisteredAccount, 'id' | 'created_at' | 'is_online' | 'status' | 'is_verified'>): RegisteredAccount {
    if (!acc.school_id || !acc.school_id.trim()) {
      throw new Error('School ID is required to register into the system.');
    }
    if (!/^\d{7,15}$/.test(acc.school_id.trim())) {
      throw new Error('School ID must contain 7 to 15 digits only.');
    }
    const cleanSchoolId = acc.school_id.trim();
    const existing = this.registeredAccounts.find(u => u.school_id === cleanSchoolId);
    if (existing) {
      throw new Error(`School ID ${cleanSchoolId} is already registered in the system.`);
    }

    const newAcc: RegisteredAccount = {
      ...acc,
      id: 'usr-' + Date.now(),
      school_id: cleanSchoolId,
      is_online: false,
      status: 'active',
      is_verified: false,
      created_at: new Date().toISOString()
    };
    this.registeredAccounts.unshift(newAcc);

    // Also register in users table
    this.users.push({
      id: newAcc.id,
      email: `${newAcc.username}@falcon.edu`,
      full_name: newAcc.full_name,
      role_id: newAcc.role === 'admin' ? 'role-1' : newAcc.role === 'staff' ? 'role-2' : newAcc.role === 'coach' ? 'role-3' : 'role-4',
      school_id: newAcc.school_id,
      status: 'active',
      is_online: true,
      created_at: newAcc.created_at
    });

    if (newAcc.role === 'student') {
      this.athletes.push({
        id: 'ath-' + Date.now(),
        user_id: newAcc.id,
        student_number: newAcc.school_id,
        department: newAcc.department || 'General Athletics',
        year_level: 1,
        emergency_contact: 'Campus Registry',
        created_at: newAcc.created_at
      });
    } else if (newAcc.role === 'coach') {
      this.coaches.push({
        id: 'cch-' + Date.now(),
        user_id: newAcc.id,
        employee_number: newAcc.school_id,
        specialization: newAcc.specialization || 'Athletic Coaching',
        license_level: 'Certified Coach',
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        available_hours: '08:00 AM - 05:00 PM',
        created_at: newAcc.created_at
      });
    }

    this.notify();
    return newAcc;
  }

  verifyRegisteredUser(accountId: string) {
    const account = this.registeredAccounts.find(user => user.id === accountId);
    if (!account) return;

    account.is_verified = true;
    account.status = 'active';
    this.persist();
    this.notify();
  }

  removeRegisteredUser(accountId: string) {
    const account = this.registeredAccounts.find(user => user.id === accountId);
    if (!account) {
      throw new Error('This account no longer exists.');
    }
    if (account.role === 'admin') {
      throw new Error('Administrator accounts cannot be removed here.');
    }

    const hasActiveLoan = this.borrowingTransactions.some(transaction =>
      transaction.borrower_school_id === account.school_id &&
      ['pending', 'approved', 'active', 'partially_returned', 'overdue'].includes(transaction.status)
    );
    if (hasActiveLoan) {
      throw new Error('This account has an outstanding loan. Resolve or cancel the loan before removing the account.');
    }

    this.registeredAccounts = this.registeredAccounts.filter(user => user.id !== accountId);

    const isUserReferenced = this.borrowingTransactions.some(transaction => transaction.approved_by === accountId);
    if (!isUserReferenced) {
      this.users = this.users.filter(user => user.id !== accountId);
    }

    if (account.role === 'student') {
      const athlete = this.athletes.find(profile => profile.user_id === accountId);
      const athleteIsReferenced = athlete && (
        this.borrowingTransactions.some(transaction => transaction.athlete_id === athlete.id) ||
        this.teamMembers.some(member => member.athlete_id === athlete.id)
      );
      if (athlete && !athleteIsReferenced) {
        this.athletes = this.athletes.filter(profile => profile.id !== athlete.id);
      }
    } else if (account.role === 'coach') {
      const coach = this.coaches.find(profile => profile.user_id === accountId);
      const coachIsReferenced = coach && (
        this.teams.some(team => team.coach_id === coach.id) ||
        this.coachBookings.some(booking =>
          booking.coach_id === accountId || booking.coach_school_id === account.school_id
        )
      );
      if (coach && !coachIsReferenced) {
        this.coaches = this.coaches.filter(profile => profile.id !== coach.id);
      }
    }

    this.notify();
  }

  toggleOnlineStatus(schoolId: string) {
    const user = this.registeredAccounts.find(u => u.school_id.toUpperCase() === schoolId.toUpperCase());
    if (user) {
      user.is_online = !user.is_online;
      this.notify();
    }
  }

  // Equipment CRUD
  addEquipment(eq: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>, _performedBy?: string): Equipment {
    const newEq: Equipment = {
      ...eq,
      id: 'eq-' + Date.now(),
      available_days: eq.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.equipment.unshift(newEq);
    this.notify();
    return newEq;
  }

  updateEquipment(id: string, updates: Partial<Equipment>, _performedBy?: string): Equipment {
    const index = this.equipment.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Equipment with id ${id} not found.`);
    const oldEq = { ...this.equipment[index] };
    const newEq = { ...oldEq, ...updates, updated_at: new Date().toISOString() };
    this.equipment[index] = newEq;
    this.notify();
    return newEq;
  }

  deleteEquipment(id: string, _performedBy?: string): void {
    const inBorrowing = this.borrowingTransactions.some(
      t => t.status === 'active' && t.items?.some(i => i.equipment_id === id)
    );
    if (inBorrowing) {
      throw new Error('Cannot delete equipment: Active borrowing loan exists.');
    }
    const index = this.equipment.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Equipment with id ${id} not found.`);
    this.equipment.splice(index, 1);
    this.notify();
  }

  addTeamMember(teamId: string, athleteId: string, position: string, jerseyNumber?: number): TeamMember {
    const newTm: TeamMember = {
      id: 'tm-' + Date.now(),
      team_id: teamId,
      athlete_id: athleteId,
      position,
      jersey_number: jerseyNumber,
      joined_at: new Date().toISOString().split('T')[0],
      status: 'active',
      created_at: new Date().toISOString()
    };
    this.teamMembers.push(newTm);
    this.notify();
    return newTm;
  }

  addMaintenanceRecord(equipmentId: string, reportedBy: string, issue: string, scheduledDate: string, cost: number): MaintenanceRecord {
    const rec: MaintenanceRecord = {
      id: 'mr-' + Date.now(),
      equipment_id: equipmentId,
      reported_by: reportedBy,
      issue_description: issue,
      scheduled_date: scheduledDate,
      cost,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.maintenanceRecords.unshift(rec);
    this.notify();
    return rec;
  }

  // Student & Coach direct borrowing
  borrowEquipmentDirect(
    borrowerName: string,
    borrowerRole: 'student' | 'coach',
    borrowerSchoolId: string,
    equipmentId: string,
    quantity: number,
    expectedReturnDate: string,
    remarks?: string
  ): BorrowingTransaction {
    const eq = this.equipment.find(e => e.id === equipmentId);
    if (!eq) throw new Error('Equipment not found.');
    if (eq.available_quantity < quantity) {
      throw new Error(`Insufficient stock. Only ${eq.available_quantity} available.`);
    }

    // Decrement stock
    eq.available_quantity -= quantity;
    if (eq.available_quantity === 0) eq.status = 'out_of_stock';
    else if (eq.available_quantity <= 2) eq.status = 'low_stock';
    eq.updated_at = new Date().toISOString();

    const newTx: BorrowingTransaction = {
      id: 'tx-' + Date.now(),
      athlete_id: borrowerSchoolId,
      borrower_name: borrowerName,
      borrower_role: borrowerRole,
      borrower_school_id: borrowerSchoolId,
      approved_by: 'Staff Desk',
      borrow_date: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
      actual_return_date: null,
      status: 'active',
      remarks: remarks || `${borrowerRole.toUpperCase()} practice loan`,
      created_at: new Date().toISOString(),
      items: [
        {
          id: 'bi-' + Date.now(),
          transaction_id: 'tx-' + Date.now(),
          equipment_id: equipmentId,
          quantity: quantity,
          returned_quantity: 0,
          condition_before: eq.condition,
          condition_after: null,
          return_status: 'borrowed',
          created_at: new Date().toISOString(),
          equipment: eq
        }
      ]
    };

    this.borrowingTransactions.unshift(newTx);
    this.notify();
    return newTx;
  }

  checkoutEquipment(
    athleteId: string,
    items: { equipment_id: string; quantity: number; condition?: string }[],
    expectedReturnDate: string,
    _approvedBy?: string,
    remarks?: string
  ): { success: boolean; transaction_id: string; message: string } {
    const user = this.registeredAccounts.find(u => u.school_id === athleteId || u.id === athleteId);
    const borrowerName = user?.full_name || 'Borrower';
    const borrowerRole = (user?.role === 'coach' ? 'coach' : 'student') as 'student' | 'coach';
    const borrowerSchoolId = user?.school_id || athleteId;

    let lastTxId = 'tx-' + Date.now();
    for (const item of items) {
      const tx = this.borrowEquipmentDirect(
        borrowerName,
        borrowerRole,
        borrowerSchoolId,
        item.equipment_id,
        item.quantity,
        expectedReturnDate,
        remarks
      );
      lastTxId = tx.id;
    }
    return { success: true, transaction_id: lastTxId, message: 'Equipment checked out successfully.' };
  }

  // Return equipment
  returnBorrowedItems(
    transactionId: string,
    itemsOrCondition?: unknown,
    _receivedBy?: string
  ): { success: boolean; message: string } {
    const tx = this.borrowingTransactions.find(t => t.id === transactionId);
    if (!tx) throw new Error('Transaction not found.');

    const conditionAfter: Equipment['condition'] = typeof itemsOrCondition === 'string' ? itemsOrCondition as Equipment['condition'] : 'good';

    tx.status = 'returned';
    tx.actual_return_date = new Date().toISOString();

    if (tx.items) {
      for (const item of tx.items) {
        item.returned_quantity = item.quantity;
        item.return_status = 'returned';
        item.condition_after = conditionAfter;

        // Restore equipment stock
        const eq = this.equipment.find(e => e.id === item.equipment_id);
        if (eq) {
          eq.available_quantity = Math.min(eq.total_quantity, eq.available_quantity + item.quantity);
          eq.condition = conditionAfter;
          if (conditionAfter === 'damaged' || conditionAfter === 'needs_maintenance') {
            eq.status = 'under_maintenance';
          } else {
            eq.status = 'available';
          }
          eq.updated_at = new Date().toISOString();
        }
      }
    }

    this.notify();
    return { success: true, message: 'Items returned and stock replenished.' };
  }

  // Staff alerts to student or coach
  sendReturnAlert(
    transactionId: string,
    recipientName: string,
    recipientSchoolId: string,
    recipientRole: 'student' | 'coach',
    equipmentName: string,
    expectedReturnDate: string,
    customMessage?: string
  ): ReturnAlert {
    const tx = this.borrowingTransactions.find(t => t.id === transactionId);
    if (tx) {
      tx.alert_sent = true;
      tx.last_alert_sent = new Date().toISOString();
    }

    const alert: ReturnAlert = {
      id: 'alt-' + Date.now(),
      transaction_id: transactionId,
      recipient_name: recipientName,
      recipient_school_id: recipientSchoolId,
      recipient_role: recipientRole,
      equipment_name: equipmentName,
      expected_return_date: expectedReturnDate,
      message: customMessage || `NOTICE: Equipment loan for "${equipmentName}" due on ${expectedReturnDate}. Please return to the Equipment Desk promptly.`,
      sent_at: new Date().toISOString(),
      is_read: false
    };

    this.returnAlerts.unshift(alert);
    this.notify();
    return alert;
  }

  markAlertRead(alertId: string) {
    const alert = this.returnAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.is_read = true;
      this.notify();
    }
  }

  // Coach booking requests
  createCoachBooking(booking: Omit<CoachBooking, 'id' | 'created_at' | 'status'>): CoachBooking {
    const newBooking: CoachBooking = {
      ...booking,
      id: 'cb-' + Date.now(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.coachBookings.unshift(newBooking);
    this.notify();
    return newBooking;
  }

  updateCoachBookingStatus(bookingId: string, status: CoachBooking['status'], coachNotes?: string): CoachBooking {
    const b = this.coachBookings.find(item => item.id === bookingId);
    if (!b) throw new Error('Booking not found.');
    b.status = status;
    if (coachNotes !== undefined) b.coach_notes = coachNotes;
    this.notify();
    return b;
  }

  // Staff Reports to Admin (Damaged equipment / Overdue returns)
  submitStaffReport(report: Omit<StaffReport, 'id' | 'created_at' | 'status'>): StaffReport {
    const newReport: StaffReport = {
      ...report,
      id: 'rep-' + Date.now(),
      status: 'submitted',
      created_at: new Date().toISOString()
    };
    this.staffReports.unshift(newReport);
    this.notify();
    return newReport;
  }

  updateStaffReportStatus(reportId: string, status: StaffReport['status']): StaffReport {
    const r = this.staffReports.find(item => item.id === reportId);
    if (!r) throw new Error('Report not found.');
    r.status = status;
    this.notify();
    return r;
  }

  // Legacy view calculations for backwards compatibility
  getActiveLoansView(): ActiveLoansSummaryView[] {
    return this.borrowingTransactions.map(tx => {
      const items = tx.items || [];
      const totalBorrowed = items.reduce((sum, i) => sum + i.quantity, 0) || 1;
      const totalReturned = items.reduce((sum, i) => sum + i.returned_quantity, 0);
      const overdue = calculateOverdueDays(tx.expected_return_date, tx.actual_return_date);

      let urgency: ActiveLoansSummaryView['loan_urgency'] = 'Active / On Schedule';
      if (tx.status === 'returned') urgency = 'Returned on Time';
      else if (overdue > 0 || tx.status === 'overdue') urgency = 'OVERDUE';

      return {
        transaction_id: tx.id,
        borrow_date: tx.borrow_date,
        expected_return_date: tx.expected_return_date,
        actual_return_date: tx.actual_return_date,
        transaction_status: tx.status,
        remarks: tx.remarks,
        athlete_id: tx.athlete_id,
        student_number: tx.borrower_school_id || tx.athlete_id,
        athlete_name: tx.borrower_name || 'Borrower',
        department: tx.borrower_role ? tx.borrower_role.toUpperCase() : 'Athletics',
        athlete_email: `${tx.borrower_name?.toLowerCase().replace(/\s+/g, '.') || 'user'}@falcon.edu`,
        approved_by_name: tx.approved_by || 'Staff Desk',
        overdue_days: overdue,
        loan_urgency: urgency,
        total_equipment_lines: items.length || 1,
        total_units_borrowed: totalBorrowed,
        total_units_returned: totalReturned,
        outstanding_units: totalBorrowed - totalReturned
      };
    });
  }

  getEquipmentInventoryView(): EquipmentInventoryStatusView[] {
    return this.equipment.map(eq => {
      const sport = this.sports.find(s => s.id === eq.sport_id);
      const currentlyBorrowed = eq.total_quantity - eq.available_quantity;
      const utilPct = eq.total_quantity > 0 ? Math.round((currentlyBorrowed / eq.total_quantity) * 1000) / 10 : 0;

      let health: EquipmentInventoryStatusView['stock_health_status'] = 'OPTIMAL';
      if (eq.available_quantity === 0) health = 'OUT_OF_STOCK';
      else if (eq.available_quantity <= 2) health = 'LOW_STOCK_ALERT';
      else if (eq.condition === 'needs_maintenance' || eq.condition === 'damaged') health = 'MAINTENANCE_REQUIRED';

      return {
        equipment_id: eq.id,
        equipment_code: eq.equipment_code,
        equipment_name: eq.name,
        category: eq.category,
        sport_name: sport?.name || 'General Athletics',
        total_quantity: eq.total_quantity,
        available_quantity: eq.available_quantity,
        currently_borrowed: currentlyBorrowed,
        utilization_rate_pct: utilPct,
        condition: eq.condition,
        status: eq.status,
        stock_health_status: health,
        active_maintenance_jobs: 0,
        last_updated: eq.updated_at
      };
    });
  }
}

export const mockDb = new MockDatabaseStore();
