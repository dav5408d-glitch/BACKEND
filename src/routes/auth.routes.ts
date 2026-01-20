import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { conversationsController } from '../controllers/conversations.controller';
import { usageController } from '../controllers/usage.controller';

const router = Router();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/update-plan', authMiddleware, authController.updatePlan);

// Conversations routes
router.get('/conversations', authMiddleware, conversationsController.getAll);
router.get('/conversations/:id', authMiddleware, conversationsController.getOne);
router.post('/conversations', authMiddleware, conversationsController.create);
router.delete('/conversations/:id', authMiddleware, conversationsController.delete);

// Usage routes
router.get('/usage', authMiddleware, usageController.getDaily);
router.get('/usage/monthly', authMiddleware, usageController.getMonthly);

export default router;
