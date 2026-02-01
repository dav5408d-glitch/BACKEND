import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { planMiddleware } from '../middlewares/plan.middleware';
import { quotaMiddleware } from '../middlewares/quota.middleware';
import { checkPaidPlan } from '../middlewares/planCheck.middleware';

const router = Router();

router.post(
  '/',
  // authMiddleware,  // TODO: re-enable after testing
  // checkPaidPlan,  // Vérifier que l'utilisateur a un plan payant
  // planMiddleware,
  // quotaMiddleware,
  chatController
);

export default router;
