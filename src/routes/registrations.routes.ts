import { Router } from 'express';
import {
  getRegistrations,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  clearAllRegistrations,
} from '../controllers/registrations.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/admin/registrations', authMiddleware, getRegistrations);
router.post('/admin/registrations', authMiddleware, createRegistration);
router.put('/admin/registrations/:id', authMiddleware, updateRegistration);
router.delete('/admin/registrations/:id', authMiddleware, deleteRegistration);
router.delete('/admin/registrations', authMiddleware, clearAllRegistrations);

export default router;
