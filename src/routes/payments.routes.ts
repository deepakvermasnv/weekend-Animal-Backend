import { Router } from 'express';
import { getPayments, updatePayment } from '../controllers/payments.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/admin/payments', authMiddleware, getPayments);
router.put('/admin/payments', authMiddleware, updatePayment);

export default router;
