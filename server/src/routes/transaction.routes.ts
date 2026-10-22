// =============================================================================
// Transaction Routes
// =============================================================================
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { transactionController } from '../controllers/transaction.controller';

export const transactionRouter = Router();
transactionRouter.use(authenticate);

// Any authenticated user can read transactions (service layer filters by role)
transactionRouter.get('/',         transactionController.getAll);
transactionRouter.get('/overdue',  transactionController.getOverdue);
transactionRouter.get('/:id',      transactionController.getOne);

// Mutations are admin/staff only
transactionRouter.post('/checkout', requireRole('admin', 'staff'), transactionController.checkout);
transactionRouter.post('/return',   requireRole('admin', 'staff'), transactionController.processReturn);
