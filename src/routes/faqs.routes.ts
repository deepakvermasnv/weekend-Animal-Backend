import { Router } from 'express';
import {
  getPublicFaqs,
  getAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faqs.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/public/faqs', getPublicFaqs);
router.get('/admin/faqs', authMiddleware, getAdminFaqs);
router.post('/admin/faqs', authMiddleware, createFaq);
router.put('/admin/faqs/:id', authMiddleware, updateFaq);
router.delete('/admin/faqs/:id', authMiddleware, deleteFaq);

export default router;
