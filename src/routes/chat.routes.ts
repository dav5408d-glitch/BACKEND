import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { planMiddleware } from '../middlewares/plan.middleware';
import { quotaMiddleware } from '../middlewares/quota.middleware';
import { checkPaidPlan } from '../middlewares/planCheck.middleware';
import { guestMiddleware } from '../../middlewares/guest.middleware';

const router = Router();

router.post(
  '/',
  authMiddleware,  // Reactivé
  // checkPaidPlan,  // Vérifier que l'utilisateur a un plan payant
  // planMiddleware,
  // quotaMiddleware,
  // guestMiddleware, // Désactivé
  chatController
);

export default router;
