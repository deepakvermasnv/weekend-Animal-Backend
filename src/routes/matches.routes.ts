import { Router } from 'express';
import {
  getPublicMatch,
  getAdminMatches,
  getAdminMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
} from '../controllers/matches.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public route
router.get('/public/match', getPublicMatch);

// Admin protected routes
router.get('/admin/matches', authMiddleware, getAdminMatches);
router.get('/admin/matches/:id', authMiddleware, getAdminMatchById);
router.post('/admin/matches', authMiddleware, createMatch);
router.put('/admin/matches/:id', authMiddleware, updateMatch);
router.delete('/admin/matches/:id', authMiddleware, deleteMatch);

export default router;
