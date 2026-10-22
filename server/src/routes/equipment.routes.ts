// =============================================================================
// Equipment Routes — all require authentication; mutations require staff/admin
// =============================================================================
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { equipmentController } from '../controllers/equipment.controller';

export const equipmentRouter = Router();

// All equipment routes require a valid JWT
equipmentRouter.use(authenticate);

equipmentRouter.get('/',           equipmentController.getAll);
equipmentRouter.get('/inventory',  equipmentController.getInventoryView);
equipmentRouter.get('/:id',        equipmentController.getOne);

// Mutations: staff and admin only
equipmentRouter.post(  '/',    requireRole('admin', 'staff'), equipmentController.create);
equipmentRouter.put(   '/:id', requireRole('admin', 'staff'), equipmentController.update);
equipmentRouter.patch( '/:id', requireRole('admin', 'staff'), equipmentController.update);
equipmentRouter.delete('/:id', requireRole('admin'),          equipmentController.remove);
