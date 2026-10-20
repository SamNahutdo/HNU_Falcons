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
  EquipmentInventoryStatusView
} from '../types/database';

export const initialRoles: Role[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'admin', description: 'Full athletic department administrative control', created_at: '2025-01-01T00:00:00Z' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'staff', description: 'Equipment custodian and checkout manager', created_at: '2025-01-01T00:00:00Z' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'student', description: 'Varsity student athlete', created_at: '2025-01-01T00:00:00Z' }
];

export const initialUsers: User[] = [
  { id: '10000000-0000-0000-0000-000000000001', email: 'arbe@falcon.edu', full_name: "Ma'am Arbe", role_id: '00000000-0000-0000-0000-000000000001', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: '10000000-0000-0000-0000-000000000002', email: 'staff1@falcon.edu', full_name: 'Custodian John', role_id: '00000000-0000-0000-0000-000000000002', status: 'active', created_at: '2025-01-02T00:00:00Z' },
  { id: '10000000-0000-0000-0000-000000000004', email: 'm.reyes@falcon.edu', full_name: 'Coach Michael Reyes', role_id: '00000000-0000-0000-0000-000000000001', status: 'active', created_at: '2025-01-05T00:00:00Z' },
  { id: '10000000-0000-0000-0000-000000000006', email: 'juan.delacruz@falcon.edu', full_name: 'Juan Dela Cruz', role_id: '00000000-0000-0000-0000-000000000003', status: 'active', created_at: '2025-01-10T00:00:00Z' },
  { id: '10000000-0000-0000-0000-000000000007', email: 'mark.bautista@falcon.edu', full_name: 'Mark Bautista', role_id: '00000000-0000-0000-0000-000000000003', status: 'active', created_at: '2025-01-10T00:00:00Z' }
];

export const initialAthletes: Athlete[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    user_id: '10000000-0000-0000-0000-000000000006',
    student_number: '2024-00101',
    department: 'College of Computer Studies',
    year_level: 3,
    emergency_contact: 'Maria Dela Cruz (Mother) - 0917-000-1122',
    created_at: '2025-01-10T00:00:00Z'
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    user_id: '10000000-0000-0000-0000-000000000007',
    student_number: '2023-00452',
    department: 'College of Engineering',
    year_level: 4,
    emergency_contact: 'Roberto Bautista (Father) - 0918-555-8899',
    created_at: '2025-01-10T00:00:00Z'
  }
];

export const initialCoaches: Coach[] = [
  { id: '20000000-0000-0000-0000-000000000001', user_id: '10000000-0000-0000-0000-000000000004', employee_number: 'EMP-2021-088', specialization: 'Baseball & Conditioning', license_level: 'Head Coach Level 2', created_at: '2025-01-05T00:00:00Z' }
];

export const initialSports: Sport[] = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'Baseball', category: 'Team', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: '40000000-0000-0000-0000-000000000002', name: 'Table Tennis', category: 'Individual', status: 'active', created_at: '2025-01-01T00:00:00Z' },
  { id: '40000000-0000-0000-0000-000000000003', name: 'Basketball', category: 'Team', status: 'active', created_at: '2025-01-01T00:00:00Z' }
];

export const initialTeams: Team[] = [
  { id: '50000000-0000-0000-0000-000000000001', sport_id: '40000000-0000-0000-0000-000000000001', coach_id: '20000000-0000-0000-0000-000000000001', team_name: 'Falcons Men Varsity Baseball', school_year: '2025-2026', status: 'active', created_at: '2025-01-05T00:00:00Z' },
  { id: '50000000-0000-0000-0000-000000000002', sport_id: '40000000-0000-0000-0000-000000000002', coach_id: '20000000-0000-0000-0000-000000000001', team_name: 'Falcons Table Tennis Team', school_year: '2025-2026', status: 'active', created_at: '2025-01-05T00:00:00Z' }
];

export const initialTeamMembers: TeamMember[] = [
  { id: '60000000-0000-0000-0000-000000000001', team_id: '50000000-0000-0000-0000-000000000001', athlete_id: '30000000-0000-0000-0000-000000000001', position: 'Outfielder', jersey_number: 14, joined_at: '2024-08-15', status: 'active', created_at: '2025-01-10T00:00:00Z' },
  { id: '60000000-0000-0000-0000-000000000002', team_id: '50000000-0000-0000-0000-000000000002', athlete_id: '30000000-0000-0000-0000-000000000001', position: 'Singles Player', jersey_number: 7, joined_at: '2024-09-01', status: 'active', created_at: '2025-01-10T00:00:00Z' }
];

// Matching 133 Total Equipment, 113 Available, 12 On Loan, 1 Maintenance
export const initialEquipment: Equipment[] = [
  { id: '70000000-0000-0000-0000-000000000001', sport_id: '40000000-0000-0000-0000-000000000001', equipment_code: 'EQ-BS-001', name: 'Rawlings Alloy Baseball Bat 33-inch', category: 'Bat', total_quantity: 45, available_quantity: 38, condition: 'good', status: 'available', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: '70000000-0000-0000-0000-000000000002', sport_id: '40000000-0000-0000-0000-000000000001', equipment_code: 'EQ-BS-002', name: 'Loan Verification Glove', category: 'Glove', total_quantity: 35, available_quantity: 30, condition: 'good', status: 'available', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: '70000000-0000-0000-0000-000000000003', sport_id: '40000000-0000-0000-0000-000000000001', equipment_code: 'EQ-BS-003', name: 'Last Remaining Helmet', category: 'Protective Gear', total_quantity: 25, available_quantity: 20, condition: 'good', status: 'available', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: '70000000-0000-0000-0000-000000000004', sport_id: '40000000-0000-0000-0000-000000000001', equipment_code: 'EQ-BS-004', name: 'Return Test Bat', category: 'Bat', total_quantity: 18, available_quantity: 16, condition: 'fair', status: 'available', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: '70000000-0000-0000-0000-000000000005', sport_id: '40000000-0000-0000-0000-000000000002', equipment_code: 'EQ-TT-001', name: 'Butterfly Timo Boll Racket Set', category: 'Racket', total_quantity: 10, available_quantity: 9, condition: 'needs_maintenance', status: 'under_maintenance', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
];

export const initialBorrowingTransactions: BorrowingTransaction[] = [
  {
    id: '80000000-0000-0000-0000-000000000013',
    athlete_id: '30000000-0000-0000-0000-000000000001',
    approved_by: '10000000-0000-0000-0000-000000000002',
    borrow_date: '2026-10-14T09:00:00Z',
    expected_return_date: '2026-10-21',
    actual_return_date: null,
    status: 'active',
    remarks: 'Field practice scrimmage helmet',
    created_at: '2026-10-14T09:00:00Z'
  },
  {
    id: '80000000-0000-0000-0000-000000000012',
    athlete_id: '30000000-0000-0000-0000-000000000001',
    approved_by: '10000000-0000-0000-0000-000000000002',
    borrow_date: '2026-10-15T10:30:00Z',
    expected_return_date: '2026-10-22',
    actual_return_date: null,
    status: 'active',
    remarks: 'Cage batting practice',
    created_at: '2026-10-15T10:30:00Z'
  },
  {
    id: '80000000-0000-0000-0000-000000000001',
    athlete_id: '30000000-0000-0000-0000-000000000001',
    approved_by: '10000000-0000-0000-0000-000000000002',
    borrow_date: '2026-09-25T08:00:00Z',
    expected_return_date: '2026-09-30',
    actual_return_date: null,
    status: 'overdue',
    remarks: 'Varsity tournament weekend',
    created_at: '2026-09-25T08:00:00Z'
  },
  {
    id: '80000000-0000-0000-0000-000000000003',
    athlete_id: '30000000-0000-0000-0000-000000000001',
    approved_by: '10000000-0000-0000-0000-000000000002',
    borrow_date: '2026-09-27T08:00:00Z',
    expected_return_date: '2026-09-29',
    actual_return_date: null,
    status: 'overdue',
    remarks: 'Glove training session',
    created_at: '2026-09-27T08:00:00Z'
  },
  {
    id: '80000000-0000-0000-0000-000000000004',
    athlete_id: '30000000-0000-0000-0000-000000000001',
    approved_by: '10000000-0000-0000-0000-000000000002',
    borrow_date: '2026-09-27T14:00:00Z',
    expected_return_date: '2026-09-30',
    actual_return_date: null,
    status: 'overdue',
    remarks: 'Field trial',
    created_at: '2026-09-27T14:00:00Z'
  }
];

export const initialBorrowingItems: BorrowingItem[] = [
  { id: '90000000-0000-0000-0000-000000000013', transaction_id: '80000000-0000-0000-0000-000000000013', equipment_id: '70000000-0000-0000-0000-000000000003', quantity: 1, returned_quantity: 0, condition_before: 'good', condition_after: null, return_status: 'borrowed', created_at: '2026-10-14T09:00:00Z' },
  { id: '90000000-0000-0000-0000-000000000012', transaction_id: '80000000-0000-0000-0000-000000000012', equipment_id: '70000000-0000-0000-0000-000000000004', quantity: 2, returned_quantity: 0, condition_before: 'good', condition_after: null, return_status: 'borrowed', created_at: '2026-10-15T10:30:00Z' },
  { id: '90000000-0000-0000-0000-000000000001', transaction_id: '80000000-0000-0000-0000-000000000001', equipment_id: '70000000-0000-0000-0000-000000000001', quantity: 2, returned_quantity: 0, condition_before: 'good', condition_after: null, return_status: 'borrowed', created_at: '2026-09-25T08:00:00Z' },
  { id: '90000000-0000-0000-0000-000000000003', transaction_id: '80000000-0000-0000-0000-000000000003', equipment_id: '70000000-0000-0000-0000-000000000002', quantity: 2, returned_quantity: 0, condition_before: 'good', condition_after: null, return_status: 'borrowed', created_at: '2026-09-27T08:00:00Z' },
  { id: '90000000-0000-0000-0000-000000000004', transaction_id: '80000000-0000-0000-0000-000000000004', equipment_id: '70000000-0000-0000-0000-000000000001', quantity: 1, returned_quantity: 0, condition_before: 'good', condition_after: null, return_status: 'borrowed', created_at: '2026-09-27T14:00:00Z' }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    equipment_id: '70000000-0000-0000-0000-000000000005',
    reported_by: '10000000-0000-0000-0000-000000000002',
    issue_description: 'Re-glue peeling rubber surface on paddle B',
    scheduled_date: '2026-10-25',
    cost: 350.00,
    status: 'in_progress',
    created_at: '2026-10-10T00:00:00Z'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    table_name: 'equipment',
    record_id: '70000000-0000-0000-0000-000000000001',
    action_type: 'INSERT',
    old_data: null,
    new_data: { name: 'Rawlings Alloy Baseball Bat 33-inch', total_quantity: 45, available_quantity: 45 },
    performed_by: '10000000-0000-0000-0000-000000000001',
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    table_name: 'equipment',
    record_id: '70000000-0000-0000-0000-000000000003',
    action_type: 'UPDATE',
    old_data: { available_quantity: 21, status: 'available' },
    new_data: { available_quantity: 20, status: 'available' },
    performed_by: '10000000-0000-0000-0000-000000000002',
    created_at: '2026-10-14T09:00:00Z'
  }
];

export function calculateOverdueDays(expectedDateStr: string, actualDateStr: string | null): number {
  const refDate = actualDateStr ? new Date(actualDateStr) : new Date();
  const expectedDate = new Date(expectedDateStr);
  const diffTime = refDate.getTime() - expectedDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

class MockDatabaseStore {
  roles = [...initialRoles];
  users = [...initialUsers];
  athletes = [...initialAthletes];
  coaches = [...initialCoaches];
  sports = [...initialSports];
  teams = [...initialTeams];
  teamMembers = [...initialTeamMembers];
  equipment = [...initialEquipment];
  borrowingTransactions = [...initialBorrowingTransactions];
  borrowingItems = [...initialBorrowingItems];
  maintenanceRecords = [...initialMaintenanceRecords];
  auditLogs = [...initialAuditLogs];

  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  private triggerLogEquipmentAudit(actionType: 'INSERT' | 'UPDATE' | 'DELETE', oldData: unknown, newData: unknown, recordId: string, performedBy?: string) {
    const log: AuditLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'log-' + Date.now(),
      table_name: 'equipment',
      record_id: recordId,
      action_type: actionType,
      old_data: oldData as Record<string, unknown> | null,
      new_data: newData as Record<string, unknown> | null,
      performed_by: performedBy || '10000000-0000-0000-0000-000000000002',
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
  }

  addEquipment(eq: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>, performedBy?: string): Equipment {
    const newEq: Equipment = {
      ...eq,
      id: crypto.randomUUID ? crypto.randomUUID() : 'eq-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.equipment.push(newEq);
    this.triggerLogEquipmentAudit('INSERT', null, newEq, newEq.id, performedBy);
    this.notify();
    return newEq;
  }

  updateEquipment(id: string, updates: Partial<Equipment>, performedBy?: string): Equipment {
    const index = this.equipment.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Equipment with id ${id} not found.`);
    const oldEq = { ...this.equipment[index] };
    const newEq = { ...oldEq, ...updates, updated_at: new Date().toISOString() };
    this.equipment[index] = newEq;
    this.triggerLogEquipmentAudit('UPDATE', oldEq, newEq, id, performedBy);
    this.notify();
    return newEq;
  }

  deleteEquipment(id: string, performedBy?: string): void {
    const inBorrowing = this.borrowingItems.some(bi => bi.equipment_id === id);
    if (inBorrowing) {
      throw new Error('Cannot delete equipment: Referenced by existing borrowing records (ON DELETE RESTRICT violation).');
    }
    const index = this.equipment.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Equipment with id ${id} not found.`);
    const oldEq = { ...this.equipment[index] };
    this.equipment.splice(index, 1);
    this.triggerLogEquipmentAudit('DELETE', oldEq, null, id, performedBy);
    this.notify();
  }

  checkoutEquipment(
    athleteId: string,
    items: { equipment_id: string; quantity: number; condition?: string }[],
    expectedReturnDate: string,
    approvedBy?: string,
    remarks?: string
  ): { success: boolean; transaction_id: string; message: string } {
    const today = new Date().toISOString().split('T')[0];
    if (expectedReturnDate < today) {
      throw new Error(`Expected return date (${expectedReturnDate}) cannot be in the past.`);
    }

    const athlete = this.athletes.find(a => a.id === athleteId);
    if (!athlete) throw new Error(`Athlete ID (${athleteId}) does not exist.`);

    if (!items || items.length === 0) throw new Error('Checkout must contain at least one item.');

    for (const item of items) {
      const eq = this.equipment.find(e => e.id === item.equipment_id);
      if (!eq) throw new Error(`Equipment ID ${item.equipment_id} not found.`);
      if (eq.available_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${eq.name}": requested ${item.quantity}, available ${eq.available_quantity}.`);
      }
    }

    const txId = crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now();
    const newTx: BorrowingTransaction = {
      id: txId,
      athlete_id: athleteId,
      approved_by: approvedBy || '10000000-0000-0000-0000-000000000002',
      borrow_date: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
      actual_return_date: null,
      status: 'active',
      remarks: remarks || null,
      created_at: new Date().toISOString()
    };
    this.borrowingTransactions.unshift(newTx);

    for (const item of items) {
      const eqIndex = this.equipment.findIndex(e => e.id === item.equipment_id);
      const oldEq = { ...this.equipment[eqIndex] };
      const newAvail = oldEq.available_quantity - item.quantity;
      let newStatus: Equipment['status'] = 'available';
      if (newAvail === 0) newStatus = 'out_of_stock';
      else if (newAvail <= 2) newStatus = 'low_stock';

      this.equipment[eqIndex] = {
        ...oldEq,
        available_quantity: newAvail,
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      this.triggerLogEquipmentAudit('UPDATE', oldEq, this.equipment[eqIndex], oldEq.id, approvedBy);

      const bi: BorrowingItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'bi-' + Date.now() + Math.random(),
        transaction_id: txId,
        equipment_id: item.equipment_id,
        quantity: item.quantity,
        returned_quantity: 0,
        condition_before: item.condition || oldEq.condition,
        condition_after: null,
        return_status: 'borrowed',
        created_at: new Date().toISOString()
      };
      this.borrowingItems.push(bi);
    }

    this.notify();
    return {
      success: true,
      transaction_id: txId,
      message: 'Equipment checkout successfully executed with ACID transaction safety.'
    };
  }

  returnBorrowedItems(
    transactionId: string,
    items: { item_id: string; returned_quantity: number; condition_after?: string }[],
    receivedBy?: string
  ): { success: boolean; message: string } {
    const tx = this.borrowingTransactions.find(t => t.id === transactionId);
    if (!tx) throw new Error(`Borrowing transaction ${transactionId} not found.`);

    for (const item of items) {
      const biIndex = this.borrowingItems.findIndex(i => i.id === item.item_id);
      if (biIndex !== -1) {
        const oldItem = { ...this.borrowingItems[biIndex] };
        const delta = item.returned_quantity - oldItem.returned_quantity;

        if (delta > 0) {
          const eqIndex = this.equipment.findIndex(e => e.id === oldItem.equipment_id);
          if (eqIndex !== -1) {
            const eq = { ...this.equipment[eqIndex] };
            const newAvail = Math.min(eq.total_quantity, eq.available_quantity + delta);
            let newStatus: Equipment['status'] = 'available';
            if (newAvail === 0) newStatus = 'out_of_stock';
            else if (newAvail <= 2) newStatus = 'low_stock';

            this.equipment[eqIndex] = {
              ...eq,
              available_quantity: newAvail,
              status: newStatus,
              updated_at: new Date().toISOString()
            };
            this.triggerLogEquipmentAudit('UPDATE', eq, this.equipment[eqIndex], eq.id, receivedBy);
          }
        }

        const newReturnStatus: BorrowingItem['return_status'] =
          item.returned_quantity >= oldItem.quantity ? 'returned' : item.returned_quantity > 0 ? 'partial' : 'borrowed';

        this.borrowingItems[biIndex] = {
          ...oldItem,
          returned_quantity: item.returned_quantity,
          condition_after: item.condition_after || oldItem.condition_before,
          return_status: newReturnStatus
        };
      }
    }

    const txItems = this.borrowingItems.filter(i => i.transaction_id === transactionId);
    const unreturned = txItems.filter(i => i.returned_quantity < i.quantity).length;

    const txIndex = this.borrowingTransactions.findIndex(t => t.id === transactionId);
    if (unreturned === 0) {
      this.borrowingTransactions[txIndex] = {
        ...this.borrowingTransactions[txIndex],
        status: 'returned',
        actual_return_date: new Date().toISOString()
      };
    } else {
      this.borrowingTransactions[txIndex] = {
        ...this.borrowingTransactions[txIndex],
        status: 'partially_returned'
      };
    }

    this.notify();
    return { success: true, message: 'Items returned and stock replenished.' };
  }

  addTeamMember(teamId: string, athleteId: string, position: string, jerseyNumber?: number): TeamMember {
    const exists = this.teamMembers.some(tm => tm.team_id === teamId && tm.athlete_id === athleteId);
    if (exists) throw new Error('Athlete is already a member of this team (Composite Unique constraint violation).');

    const newTm: TeamMember = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'tm-' + Date.now(),
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
      id: crypto.randomUUID ? crypto.randomUUID() : 'mr-' + Date.now(),
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

  getActiveLoansView(): ActiveLoansSummaryView[] {
    return this.borrowingTransactions.map(tx => {
      const athlete = this.athletes.find(a => a.id === tx.athlete_id);
      const user = athlete ? this.users.find(u => u.id === athlete.user_id) : null;
      const staff = tx.approved_by ? this.users.find(u => u.id === tx.approved_by) : null;
      const items = this.borrowingItems.filter(i => i.transaction_id === tx.id);

      const totalBorrowed = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalReturned = items.reduce((sum, i) => sum + i.returned_quantity, 0);
      const overdue = calculateOverdueDays(tx.expected_return_date, tx.actual_return_date);

      let urgency: ActiveLoansSummaryView['loan_urgency'] = 'Active / On Schedule';
      if (tx.status === 'returned') urgency = 'Returned on Time';
      else if (overdue > 0) urgency = 'OVERDUE';

      return {
        transaction_id: tx.id,
        borrow_date: tx.borrow_date,
        expected_return_date: tx.expected_return_date,
        actual_return_date: tx.actual_return_date,
        transaction_status: tx.status,
        remarks: tx.remarks,
        athlete_id: tx.athlete_id,
        student_number: athlete?.student_number || 'N/A',
        athlete_name: user?.full_name || 'Unknown Athlete',
        department: athlete?.department || 'N/A',
        athlete_email: user?.email || '',
        approved_by_name: staff?.full_name || null,
        overdue_days: overdue,
        loan_urgency: urgency,
        total_equipment_lines: items.length,
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
      const activeMaintenance = this.maintenanceRecords.filter(m => m.equipment_id === eq.id && (m.status === 'pending' || m.status === 'in_progress')).length;

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
        active_maintenance_jobs: activeMaintenance,
        last_updated: eq.updated_at
      };
    });
  }
}

export const mockDb = new MockDatabaseStore();
