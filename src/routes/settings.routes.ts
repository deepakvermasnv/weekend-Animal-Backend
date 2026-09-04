import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/public/settings', getSettings);
router.get('/admin/settings', authMiddleware, getSettings);
router.post('/admin/settings', authMiddleware, updateSettings);
router.put('/admin/settings', authMiddleware, updateSettings);

export default router;
