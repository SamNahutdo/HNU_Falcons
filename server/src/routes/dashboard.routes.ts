import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { dashboardController } from '../controllers/dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/', dashboardController.getData);

dashboardRouter.post('/bookings', requireRole('student'), dashboardController.createBooking);
dashboardRouter.patch('/bookings/:id/status', requireRole('admin', 'staff', 'coach'), dashboardController.updateBookingStatus);

dashboardRouter.post('/loans', dashboardController.createLoan);
dashboardRouter.post('/loans/:id/return', requireRole('admin', 'staff'), dashboardController.returnLoan);
dashboardRouter.post('/alerts', requireRole('admin', 'staff'), dashboardController.sendReturnAlert);

dashboardRouter.post('/reports', requireRole('admin', 'staff'), dashboardController.createReport);
dashboardRouter.patch('/reports/:id/status', requireRole('admin'), dashboardController.updateReportStatus);

dashboardRouter.post('/equipment', requireRole('admin', 'staff'), dashboardController.createEquipment);
dashboardRouter.patch('/equipment/:id', requireRole('admin', 'staff'), dashboardController.updateEquipment);
dashboardRouter.delete('/equipment/:id', requireRole('admin', 'staff'), dashboardController.retireEquipment);

dashboardRouter.patch('/users/:id', dashboardController.updateUser);
