export type UserRole = 'admin' | 'staff' | 'coach' | 'student';

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  role?: Role;
}

export interface Athlete {
  id: string;
  user_id: string;
  student_number: string;
  department: string;
  year_level: number;
  emergency_contact: string;
  created_at: string;
  user?: User;
}

export interface Coach {
  id: string;
  user_id: string;
  employee_number: string;
  specialization: string;
  license_level: string;
  created_at: string;
  user?: User;
}

export interface Sport {
  id: string;
  name: string;
  category: 'Team' | 'Individual' | 'Dual' | 'Martial Arts' | 'Aquatics';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Team {
  id: string;
  sport_id: string;
  coach_id: string;
  team_name: string;
  school_year: string;
  status: 'active' | 'inactive';
  created_at: string;
  sport?: Sport;
  coach?: Coach;
}

export interface TeamMember {
  id: string;
  team_id: string;
  athlete_id: string;
  position: string;
  jersey_number?: number;
  joined_at: string;
  status: 'active' | 'injured' | 'inactive' | 'graduated';
  created_at: string;
  team?: Team;
  athlete?: Athlete;
}

export interface Equipment {
  id: string;
  sport_id: string;
  equipment_code: string;
  name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  condition: 'new' | 'good' | 'fair' | 'needs_maintenance' | 'damaged';
  status: 'available' | 'low_stock' | 'out_of_stock' | 'under_maintenance' | 'retired';
  created_at: string;
  updated_at: string;
  sport?: Sport;
}

export interface BorrowingTransaction {
  id: string;
  athlete_id: string;
  approved_by: string | null;
  borrow_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  status: 'pending' | 'approved' | 'active' | 'partially_returned' | 'returned' | 'overdue' | 'cancelled';
  remarks: string | null;
  created_at: string;
  athlete?: Athlete;
  approver?: User;
  items?: BorrowingItem[];
}

export interface BorrowingItem {
  id: string;
  transaction_id: string;
  equipment_id: string;
  quantity: number;
  returned_quantity: number;
  condition_before: string;
  condition_after: string | null;
  return_status: 'borrowed' | 'returned' | 'damaged' | 'lost' | 'partial';
  created_at: string;
  equipment?: Equipment;
}

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  reported_by: string;
  issue_description: string;
  scheduled_date: string;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  equipment?: Equipment;
  reporter?: User;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string | null;
  created_at: string;
  performer?: User;
}

// Database Views
export interface ActiveLoansSummaryView {
  transaction_id: string;
  borrow_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  transaction_status: string;
  remarks: string | null;
  athlete_id: string;
  student_number: string;
  athlete_name: string;
  department: string;
  athlete_email: string;
  approved_by_name: string | null;
  overdue_days: number;
  loan_urgency: 'OVERDUE' | 'Returned on Time' | 'Active / On Schedule';
  total_equipment_lines: number;
  total_units_borrowed: number;
  total_units_returned: number;
  outstanding_units: number;
}

export interface EquipmentInventoryStatusView {
  equipment_id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  sport_name: string;
  total_quantity: number;
  available_quantity: number;
  currently_borrowed: number;
  utilization_rate_pct: number;
  condition: string;
  status: string;
  stock_health_status: 'OPTIMAL' | 'LOW_STOCK_ALERT' | 'OUT_OF_STOCK' | 'MAINTENANCE_REQUIRED';
  active_maintenance_jobs: number;
  last_updated: string;
}
