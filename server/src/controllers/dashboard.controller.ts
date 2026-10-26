import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  void handler(req, res).catch(next);
};

const BookingSchema = z.object({
  coach_id: z.string().uuid(),
  sport: z.string().trim().min(1).max(100),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().trim().min(1).max(80),
  purpose: z.string().trim().min(1).max(1000)
}).strict();

const LoanSchema = z.object({
  borrower_school_id: z.string().trim().min(1).max(15).optional(),
  equipment_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(500),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  remarks: z.string().trim().max(1000).optional()
}).strict();

const EquipmentCreateSchema = z.object({
  sport_id: z.string().uuid(),
  equipment_code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(50),
  total_quantity: z.number().int().min(0).max(100000),
  condition: z.enum(['new', 'good', 'fair', 'needs_maintenance', 'damaged']),
  available_days: z.array(z.string().trim().min(1).max(20)).max(7).default([])
}).strict();

const EquipmentUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  equipment_code: z.string().trim().min(1).max(50).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  total_quantity: z.number().int().min(0).max(100000).optional(),
  condition: z.enum(['new', 'good', 'fair', 'needs_maintenance', 'damaged']).optional(),
  condition_notes: z.string().trim().max(2000).nullable().optional(),
  available_days: z.array(z.string().trim().min(1).max(20)).max(7).optional()
}).strict();

const ReportSchema = z.object({
  report_type: z.enum(['damaged_equipment', 'overdue_return']),
  borrower_school_id: z.string().trim().min(1).max(15),
  item_id: z.string().uuid().optional(),
  description: z.string().trim().min(1).max(2000),
  severity: z.enum(['low', 'medium', 'high', 'critical'])
}).strict();

const reportStatusSchema = z.object({
  status: z.enum(['reviewed', 'resolved'])
}).strict();

const bookingStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
  coach_notes: z.string().trim().max(1000).optional()
}).strict();

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Not authenticated.', 401);
  return req.user;
}

function requireDateInFuture(date: string, field: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
    throw new AppError(`${field} must be a valid future date.`, 400);
  }
  return parsed;
}

async function findBorrowerBySchoolId(schoolId: string) {
  const borrower = await prisma.users.findUnique({
    where: { school_id: schoolId },
    include: { role: true, athlete: true, coach: true }
  });
  if (!borrower || borrower.status !== 'active' || !['student', 'coach'].includes(borrower.role.name)) {
    throw new AppError('An active student or coach with that school ID was not found.', 404);
  }
  if (borrower.role.name === 'student' && !borrower.athlete) {
    throw new AppError('The student profile is incomplete.', 409);
  }
  if (borrower.role.name === 'coach' && !borrower.coach) {
    throw new AppError('The coach profile is incomplete.', 409);
  }
  return borrower;
}

function toRegisteredAccount(user: {
  id: string;
  school_id: string | null;
  full_name: string;
  email: string;
  status: string;
  created_at: Date;
  is_online: boolean;
  role: { name: string };
  athlete: { department: string } | null;
  coach: { specialization: string } | null;
}) {
  const role = user.role.name as 'admin' | 'staff' | 'coach' | 'student';
  return {
    id: user.id,
    school_id: user.school_id ?? '',
    full_name: user.full_name,
    username: user.email.split('@')[0],
    role,
    department: user.athlete?.department,
    specialization: user.coach?.specialization,
    is_online: user.is_online,
    status: user.status === 'suspended' ? 'suspended' as const : 'active' as const,
    is_verified: user.status !== 'inactive',
    created_at: user.created_at.toISOString()
  };
}

export const dashboardController = {
  getData: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    const user = await prisma.users.findUnique({
      where: { id: caller.userId },
      include: { athlete: true, coach: true }
    });
    if (!user) throw new AppError('Application profile no longer exists.', 403);
    if (caller.role === 'student' && !user.athlete) throw new AppError('Student profile is incomplete.', 403);
    if (caller.role === 'coach' && !user.coach) throw new AppError('Coach profile is incomplete.', 403);

    const transactionWhere = caller.role === 'admin' || caller.role === 'staff'
      ? {}
      : caller.role === 'student'
        ? { athlete_id: user.athlete!.id }
        : { coach_id: user.coach!.id };
    const bookingWhere = caller.role === 'admin' || caller.role === 'staff'
      ? {}
      : caller.role === 'student'
        ? { student_id: user.athlete!.id }
        : { coach_id: user.coach!.id };
    const userWhere = caller.role === 'admin'
      ? {}
      : caller.role === 'staff'
        ? { role: { name: { in: ['student', 'coach'] } } }
        : { id: caller.userId };
    const canSeeUsers = caller.role === 'admin' || caller.role === 'staff';
    const canSeeReports = caller.role === 'admin' || caller.role === 'staff';
    const [equipment, coaches, sports, transactions, bookings, alerts, reports, users] = await Promise.all([
      prisma.equipment.findMany({
        where: { status: { not: 'retired' } },
        include: { sport: true },
        orderBy: { name: 'asc' }
      }),
      prisma.coaches.findMany({
        where: { user: { status: 'active' } },
        include: {
          user: {
            select: { id: true, full_name: true, school_id: true, status: true }
          }
        },
        orderBy: { user: { full_name: 'asc' } }
      }),
      prisma.sports.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } }),
      prisma.borrowing_transactions.findMany({
        where: transactionWhere,
        include: {
          athlete: {
            select: { id: true, user: { select: { full_name: true, school_id: true } } }
          },
          coach: {
            select: { id: true, user: { select: { full_name: true, school_id: true } } }
          },
          approver: { select: { id: true, full_name: true } },
          items: { include: { equipment: true } }
        },
        orderBy: { borrow_date: 'desc' }
      }),
      prisma.coach_bookings.findMany({
        where: bookingWhere,
        include: {
          student: {
            select: { id: true, user: { select: { full_name: true, school_id: true } } }
          },
          coach: {
            select: { id: true, user: { select: { full_name: true, school_id: true } } }
          }
        },
        orderBy: { booking_date: 'desc' }
      }),
      prisma.return_alerts.findMany({
        where: caller.role === 'admin' || caller.role === 'staff'
          ? {}
          : { recipient_user_id: caller.userId },
        include: {
          recipient: {
            select: {
              full_name: true,
              school_id: true,
              role: { select: { name: true } }
            }
          },
          transaction: {
            include: { items: { include: { equipment: true } } }
          }
        },
        orderBy: { sent_at: 'desc' }
      }),
      canSeeReports
        ? prisma.staff_reports.findMany({
            include: {
              borrower: {
                select: { full_name: true, school_id: true, role: { select: { name: true } } }
              },
              reporter: { select: { full_name: true } },
              item: { select: { name: true } }
            },
            orderBy: { created_at: 'desc' }
          })
        : Promise.resolve([]),
      canSeeUsers
        ? prisma.users.findMany({
            where: userWhere,
            include: { role: true, athlete: true, coach: true },
            orderBy: { created_at: 'desc' }
          })
        : Promise.resolve([])
    ]);

    const alertsByTransaction = new Map<string, Date>();
    for (const alert of alerts) {
      const previous = alertsByTransaction.get(alert.transaction_id);
      if (!previous || alert.sent_at > previous) alertsByTransaction.set(alert.transaction_id, alert.sent_at);
    }

    res.json({
      equipment,
      sports,
      coaches,
      transactions: transactions.map(transaction => {
        const borrower = transaction.athlete?.user ?? transaction.coach?.user;
        const borrowerRole = transaction.athlete ? 'student' : 'coach';
        return {
          ...transaction,
          borrower_name: borrower?.full_name ?? 'Unknown borrower',
          borrower_role: borrowerRole,
          borrower_school_id: borrower?.school_id ?? '',
          alert_sent: alertsByTransaction.has(transaction.id),
          last_alert_sent: alertsByTransaction.get(transaction.id)?.toISOString(),
          athlete: transaction.athlete,
          coach: transaction.coach
        };
      }),
      bookings: bookings.map(booking => ({
        ...booking,
        booking_date: booking.booking_date.toISOString().slice(0, 10),
        student_name: booking.student.user.full_name,
        student_school_id: booking.student.user.school_id ?? '',
        coach_name: booking.coach.user.full_name,
        coach_school_id: booking.coach.user.school_id ?? ''
      })),
      alerts: alerts.map(alert => ({
        ...alert,
        recipient_name: alert.recipient.full_name,
        recipient_school_id: alert.recipient.school_id ?? '',
        recipient_role: alert.recipient.role.name,
        equipment_name: alert.transaction.items.map(item => item.equipment.name).join(', '),
        expected_return_date: alert.transaction.expected_return_date.toISOString().slice(0, 10)
      })),
      reports: reports.map(report => ({
        ...report,
        item_name: report.item?.name,
        borrower_name: report.borrower.full_name,
        borrower_school_id: report.borrower.school_id ?? '',
        borrower_role: report.borrower.role.name as 'student' | 'coach',
        reported_by: report.reporter.full_name,
        reported_by_name: report.reporter.full_name
      })),
      users: users.map(toRegisteredAccount)
    });
  }),

  createBooking: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (caller.role !== 'student') throw new AppError('Only students can create coach bookings.', 403);
    const data = BookingSchema.parse(req.body);
    const student = await prisma.athletes.findUnique({ where: { user_id: caller.userId } });
    if (!student) throw new AppError('Student profile is incomplete.', 403);
    const bookingDate = requireDateInFuture(data.booking_date, 'booking_date');
    const coach = await prisma.coaches.findUnique({
      where: { id: data.coach_id },
      include: { user: true }
    });
    if (!coach || coach.user.status !== 'active') throw new AppError('Coach not found.', 404);

    const booking = await prisma.coach_bookings.create({
      data: {
        student_id: student.id,
        coach_id: coach.id,
        sport: data.sport,
        booking_date: bookingDate,
        time_slot: data.time_slot,
        purpose: data.purpose
      },
      include: {
        student: { select: { id: true, user: { select: { full_name: true, school_id: true } } } },
        coach: { select: { id: true, user: { select: { full_name: true, school_id: true } } } }
      }
    });
    res.status(201).json({
      ...booking,
      student_name: booking.student.user.full_name,
      student_school_id: booking.student.user.school_id ?? '',
      coach_name: booking.coach.user.full_name,
      coach_school_id: booking.coach.user.school_id ?? ''
    });
  }),

  updateBookingStatus: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (!['admin', 'staff', 'coach'].includes(caller.role)) {
      throw new AppError('This action is not allowed for your role.', 403);
    }
    const data = bookingStatusSchema.parse(req.body);
    const booking = await prisma.coach_bookings.findUnique({
      where: { id: req.params.id },
      include: { coach: true }
    });
    if (!booking) throw new AppError('Booking not found.', 404);
    if (caller.role === 'coach' && booking.coach.user_id !== caller.userId) {
      throw new AppError('You can only update your own bookings.', 403);
    }
    if (booking.status !== 'pending' && data.status !== 'completed') {
      throw new AppError('Only pending bookings can be approved or rejected.', 409);
    }
    if (data.status === 'completed' && booking.status !== 'approved') {
      throw new AppError('Only approved bookings can be marked completed.', 409);
    }
    const updated = await prisma.coach_bookings.update({
      where: { id: booking.id },
      data: { status: data.status, ...(data.coach_notes ? { coach_notes: data.coach_notes } : {}) }
    });
    res.json(updated);
  }),

  createLoan: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (!['admin', 'staff', 'coach', 'student'].includes(caller.role)) {
      throw new AppError('This action is not allowed for your role.', 403);
    }
    const data = LoanSchema.parse(req.body);
    const expectedReturnDate = requireDateInFuture(data.expected_return_date, 'expected_return_date');
    const borrower = caller.role === 'student' || caller.role === 'coach'
      ? await prisma.users.findUnique({
          where: { id: caller.userId },
          include: { role: true, athlete: true, coach: true }
        })
      : data.borrower_school_id
        ? await findBorrowerBySchoolId(data.borrower_school_id)
        : null;
    if (!borrower || borrower.status !== 'active') {
      throw new AppError('Select an active student or coach to borrow equipment.', 400);
    }
    if (borrower.role.name === 'student' && !borrower.athlete) {
      throw new AppError('Student profile is incomplete.', 409);
    }
    if (borrower.role.name === 'coach' && !borrower.coach) {
      throw new AppError('Coach profile is incomplete.', 409);
    }
    if (!['student', 'coach'].includes(borrower.role.name)) {
      throw new AppError('Only students and coaches can borrow equipment.', 400);
    }

    const transaction = await prisma.$transaction(async tx => {
      const changed = await tx.$executeRaw`
        UPDATE equipment
        SET available_quantity = available_quantity - ${data.quantity},
            status = CASE
              WHEN available_quantity - ${data.quantity} = 0 THEN 'out_of_stock'
              WHEN available_quantity - ${data.quantity} <= 2 THEN 'low_stock'
              ELSE 'available'
            END,
            updated_at = NOW()
        WHERE id = ${data.equipment_id}::uuid
          AND available_quantity >= ${data.quantity}
          AND status NOT IN ('retired', 'under_maintenance')
      `;
      if (changed !== 1) throw new AppError('Equipment is unavailable or stock is insufficient.', 409);

      const created = await tx.borrowing_transactions.create({
        data: {
          athlete_id: borrower.athlete?.id ?? null,
          coach_id: borrower.coach?.id ?? null,
          approved_by: caller.role === 'staff' || caller.role === 'admin' ? caller.userId : null,
          expected_return_date: expectedReturnDate,
          status: 'active',
          remarks: data.remarks ?? `${borrower.role.name.toUpperCase()} equipment loan`
        }
      });
      await tx.borrowing_items.create({
        data: {
          transaction_id: created.id,
          equipment_id: data.equipment_id,
          quantity: data.quantity
        }
      });
      return created;
    });
    res.status(201).json({ success: true, transaction_id: transaction.id });
  }),

  returnLoan: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (caller.role !== 'admin' && caller.role !== 'staff') {
      throw new AppError('Only staff can process equipment returns.', 403);
    }
    const returned = await prisma.$transaction(async tx => {
      const transaction = await tx.borrowing_transactions.findUnique({
        where: { id: req.params.id },
        include: { items: true }
      });
      if (!transaction) throw new AppError('Loan not found.', 404);
      if (!['active', 'overdue', 'partially_returned'].includes(transaction.status)) {
        throw new AppError('This loan cannot be returned in its current status.', 409);
      }
      for (const item of transaction.items) {
        const outstanding = item.quantity - item.returned_quantity;
        if (outstanding <= 0) continue;
        const changed = await tx.$executeRaw`
          UPDATE equipment
          SET available_quantity = available_quantity + ${outstanding},
              status = CASE
                WHEN condition IN ('damaged', 'needs_maintenance') THEN 'under_maintenance'
                WHEN available_quantity + ${outstanding} >= total_quantity THEN 'available'
                WHEN available_quantity + ${outstanding} <= 2 THEN 'low_stock'
                ELSE 'available'
              END,
              updated_at = NOW()
          WHERE id = ${item.equipment_id}::uuid
            AND available_quantity + ${outstanding} <= total_quantity
        `;
        if (changed !== 1) throw new AppError('Inventory changed unexpectedly; return was not recorded.', 409);
        await tx.borrowing_items.update({
          where: { id: item.id },
          data: {
            returned_quantity: item.quantity,
            return_status: 'returned',
            condition_after: 'good'
          }
        });
      }
      return tx.borrowing_transactions.update({
        where: { id: transaction.id },
        data: { status: 'returned', actual_return_date: new Date() }
      });
    });
    res.json({ success: true, transaction_id: returned.id, status: returned.status });
  }),

  sendReturnAlert: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (caller.role !== 'admin' && caller.role !== 'staff') {
      throw new AppError('Only staff can send return alerts.', 403);
    }
    const schema = z.object({ transaction_id: z.string().uuid(), message: z.string().trim().min(1).max(1000) }).strict();
    const data = schema.parse(req.body);
    const transaction = await prisma.borrowing_transactions.findUnique({
      where: { id: data.transaction_id },
      include: {
        athlete: { include: { user: true } },
        coach: { include: { user: true } }
      }
    });
    if (!transaction) throw new AppError('Loan not found.', 404);
    if (!['pending', 'approved', 'active', 'partially_returned', 'overdue'].includes(transaction.status)) {
      throw new AppError('Return alerts can only be sent for open loans.', 409);
    }
    const recipientUserId = transaction.athlete
      ? transaction.athlete.user_id
      : transaction.coach?.user_id;
    if (!recipientUserId) throw new AppError('Loan borrower profile is unavailable.', 409);
    const alert = await prisma.return_alerts.create({
      data: {
        transaction_id: transaction.id,
        recipient_user_id: recipientUserId,
        message: data.message
      }
    });
    res.status(201).json(alert);
  }),

  createReport: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (caller.role !== 'staff' && caller.role !== 'admin') {
      throw new AppError('Only staff can submit reports.', 403);
    }
    const data = ReportSchema.parse(req.body);
    const borrower = await findBorrowerBySchoolId(data.borrower_school_id);
    const report = await prisma.staff_reports.create({
      data: {
        report_type: data.report_type,
        item_id: data.item_id,
        borrower_user_id: borrower.id,
        reported_by: caller.userId,
        description: data.description,
        severity: data.severity
      }
    });
    res.status(201).json(report);
  }),

  updateReportStatus: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    if (caller.role !== 'admin') throw new AppError('Only administrators can update reports.', 403);
    const data = reportStatusSchema.parse(req.body);
    const report = await prisma.staff_reports.update({
      where: { id: req.params.id },
      data: { status: data.status }
    });
    res.json(report);
  }),

  createEquipment: asyncRoute(async (req, res) => {
    const data = EquipmentCreateSchema.parse(req.body);
    const equipment = await prisma.equipment.create({
      data: {
        ...data,
        available_quantity: data.total_quantity,
        status: data.condition === 'damaged' || data.condition === 'needs_maintenance'
          ? 'under_maintenance'
          : data.total_quantity > 0 ? 'available' : 'out_of_stock'
      },
      include: { sport: true }
    });
    res.status(201).json(equipment);
  }),

  updateEquipment: asyncRoute(async (req, res) => {
    const data = EquipmentUpdateSchema.parse(req.body);
    const equipment = await prisma.$transaction(async tx => {
      const current = await tx.equipment.findUnique({ where: { id: req.params.id } });
      if (!current) throw new AppError('Equipment not found.', 404);
      const outstanding = current.total_quantity - current.available_quantity;
      const total = data.total_quantity ?? current.total_quantity;
      if (total < outstanding) throw new AppError('Total quantity cannot be lower than the number currently borrowed.', 409);
      const available = total - outstanding;
      const condition = data.condition ?? current.condition;
      const status = condition === 'damaged' || condition === 'needs_maintenance'
        ? 'under_maintenance'
        : available === 0 ? 'out_of_stock' : available <= 2 ? 'low_stock' : 'available';
      return tx.equipment.update({
        where: { id: current.id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.equipment_code !== undefined ? { equipment_code: data.equipment_code } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          total_quantity: total,
          available_quantity: available,
          condition,
          status,
          ...(data.condition_notes !== undefined ? { condition_notes: data.condition_notes } : {}),
          ...(data.available_days !== undefined ? { available_days: data.available_days } : {}),
          ...(data.condition !== undefined ? { last_inspected: new Date() } : {}),
          updated_at: new Date()
        },
        include: { sport: true }
      });
    });
    res.json(equipment);
  }),

  retireEquipment: asyncRoute(async (req, res) => {
    const equipment = await prisma.equipment.update({
      where: { id: req.params.id },
      data: { status: 'retired', updated_at: new Date() }
    });
    res.json(equipment);
  }),

  updateUser: asyncRoute(async (req, res) => {
    const caller = requireUser(req);
    const schema = z.object({
      action: z.enum(['verify', 'disable', 'toggle_presence'])
    }).strict();
    const { action } = schema.parse(req.body);
    if (action === 'verify' || action === 'disable') {
      if (caller.role !== 'admin') throw new AppError('Only administrators can manage accounts.', 403);
    } else if (caller.role !== 'staff' && caller.role !== 'admin') {
      throw new AppError('Only staff can update account presence.', 403);
    }
    const user = await prisma.users.findUnique({
      where: { id: req.params.id },
      include: { role: true, athlete: true, coach: true }
    });
    if (!user) throw new AppError('Account not found.', 404);
    if (action === 'disable' && user.role.name === 'admin') {
      throw new AppError('Administrator accounts cannot be disabled here.', 409);
    }
    if (action === 'toggle_presence' && caller.role === 'staff' && !['student', 'coach'].includes(user.role.name)) {
      throw new AppError('Staff may only update student or coach presence.', 403);
    }
    if (action === 'disable') {
      const borrowerConditions = [
        ...(user.athlete ? [{ athlete_id: user.athlete.id }] : []),
        ...(user.coach ? [{ coach_id: user.coach.id }] : [])
      ];
      if (borrowerConditions.length > 0) {
        const activeLoan = await prisma.borrowing_transactions.findFirst({
          where: {
            status: { in: ['pending', 'approved', 'active', 'partially_returned', 'overdue'] },
            OR: borrowerConditions
          },
          select: { id: true }
        });
        if (activeLoan) {
          throw new AppError('This account has an outstanding loan. Resolve or cancel the loan before disabling it.', 409);
        }
      }
    }
    const updated = await prisma.users.update({
      where: { id: user.id },
      data: action === 'verify'
        ? { status: 'active' }
        : action === 'disable'
          ? { status: 'suspended' }
          : { is_online: !user.is_online }
    });
    res.json({ id: updated.id, status: updated.status, is_online: updated.is_online });
  })
};
