"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const conversations_controller_1 = require("../controllers/conversations.controller");
const usage_controller_1 = require("../controllers/usage.controller");
const router = (0, express_1.Router)();
// Auth routes
router.post('/register', auth_controller_1.authController.register);
router.post('/login', auth_controller_1.authController.login);
router.get('/profile', auth_middleware_1.authMiddleware, auth_controller_1.authController.getProfile);
router.post('/update-plan', auth_middleware_1.authMiddleware, auth_controller_1.authController.updatePlan);
// Conversations routes
router.get('/conversations', auth_middleware_1.authMiddleware, conversations_controller_1.conversationsController.getAll);
router.get('/conversations/:id', auth_middleware_1.authMiddleware, conversations_controller_1.conversationsController.getOne);
router.post('/conversations', auth_middleware_1.authMiddleware, conversations_controller_1.conversationsController.create);
router.delete('/conversations/:id', auth_middleware_1.authMiddleware, conversations_controller_1.conversationsController.delete);
// Usage routes
router.get('/usage', auth_middleware_1.authMiddleware, usage_controller_1.usageController.getDaily);
router.get('/usage/monthly', auth_middleware_1.authMiddleware, usage_controller_1.usageController.getMonthly);
exports.default = router;
