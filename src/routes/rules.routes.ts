import { Router } from 'express';
import {
  getPublicRules,
  getAdminRules,
  createRule,
  updateRule,
  deleteRule,
} from '../controllers/rules.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/public/rules', getPublicRules);
router.get('/admin/rules', authMiddleware, getAdminRules);
router.post('/admin/rules', authMiddleware, createRule);
router.put('/admin/rules/:id', authMiddleware, updateRule);
router.delete('/admin/rules/:id', authMiddleware, deleteRule);

export default router;
