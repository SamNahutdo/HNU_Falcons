// =============================================================================
// Transaction Service — Prisma Data Access Layer
// The checkout and return operations call the PostgreSQL STORED PROCEDURES
// (checkout_equipment, return_borrowed_items) via Prisma.$queryRaw with
// parameterized inputs — ensuring ACID guarantees at the DB engine level.
// =============================================================================

import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export interface CheckoutItemDto {
  equipment_id: string;
  quantity: number;
  condition?: string;
}

export interface ReturnItemDto {
  item_id: string;
  returned_quantity: number;
  condition_after?: string;
}

export const transactionService = {
  // ── GET ALL (role-filtered in controller) ──
  async findAll(filters: {
    status?: string;
    athlete_id?: string;
    page: number;
    limit: number;
  }) {
    const { status, athlete_id, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(athlete_id ? { athlete_id } : {})
    };

    const [data, total] = await prisma.$transaction([
      prisma.borrowing_transactions.findMany({
        where,
        include: {
          athlete: { include: { user: true } },
          approver: true,
          items: { include: { equipment: true } }
        },
        orderBy: { borrow_date: 'desc' },
        skip,
        take: limit
      }),
      prisma.borrowing_transactions.count({ where })
    ]);

    return { data, total, page, limit };
  },

  // ── GET ONE ──
  async findById(id: string) {
    const tx = await prisma.borrowing_transactions.findUnique({
      where: { id },
      include: {
        athlete: { include: { user: true } },
        approver: true,
        items: { include: { equipment: { include: { sport: true } } } }
      }
    });
    if (!tx) throw new AppError(`Transaction ${id} not found.`, 404);
    return tx;
  },

  // ── CHECKOUT ── Calls the stored procedure for ACID + row-level locking
  async checkout(dto: {
    athlete_id: string;
    items: CheckoutItemDto[];
    expected_return_date: string;
    approved_by?: string;
    remarks?: string;
  }) {
    // The stored procedure checkout_equipment handles:
    //   - Role check (admin/staff only — enforced redundantly here and in DB)
    //   - Date validation
    //   - SELECT ... FOR UPDATE pessimistic locking
    //   - Stock decrement + status update
    //   - Atomic INSERT into borrowing_transactions + borrowing_items
    const result = await prisma.$queryRaw<{ success: boolean; transaction_id: string; message: string; items_processed: number }[]>`
      SELECT * FROM checkout_equipment(
        ${dto.athlete_id}::UUID,
        ${JSON.stringify(dto.items)}::JSONB,
        ${dto.expected_return_date}::DATE,
        ${dto.approved_by ?? null}::UUID,
        ${dto.remarks ?? null}::TEXT
      )
    `;

    if (!result[0]?.success) {
      throw new AppError('Checkout stored procedure returned no result.', 500);
    }

    return result[0];
  },

  // ── RETURN ── Calls the stored procedure (triggers stock replenishment)
  async processReturn(dto: {
    transaction_id: string;
    items: ReturnItemDto[];
    received_by?: string;
  }) {
    // The stored procedure return_borrowed_items handles:
    //   - Role check (admin/staff only)
    //   - Update returned_quantity + condition_after per item
    //   - trg_auto_update_stock_on_return trigger fires automatically
    //   - Updates transaction status (returned | partially_returned)
    const result = await prisma.$queryRaw<{ success: boolean; transaction_id: string; status: string; message: string }[]>`
      SELECT * FROM return_borrowed_items(
        ${dto.transaction_id}::UUID,
        ${JSON.stringify(dto.items)}::JSONB,
        ${dto.received_by ?? null}::UUID
      )
    `;

    if (!result[0]?.success) {
      throw new AppError('Return stored procedure returned no result.', 500);
    }

    return result[0];
  },

  // ── OVERDUE VIEW ──
  async getOverdueLoans() {
    return prisma.$queryRaw`
      SELECT * FROM vw_active_loans_summary
      WHERE loan_urgency = 'OVERDUE'
      ORDER BY overdue_days DESC
    `;
  }
};
