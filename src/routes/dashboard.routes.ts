import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/admin/dashboard', authMiddleware, getDashboardStats);

export default router;
