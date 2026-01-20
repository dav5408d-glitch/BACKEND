"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const plan_middleware_1 = require("../middlewares/plan.middleware");
const quota_middleware_1 = require("../middlewares/quota.middleware");
const planCheck_middleware_1 = require("../middlewares/planCheck.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authMiddleware, planCheck_middleware_1.checkPaidPlan, // Vérifier que l'utilisateur a un plan payant
plan_middleware_1.planMiddleware, quota_middleware_1.quotaMiddleware, chat_controller_1.chatController);
exports.default = router;
