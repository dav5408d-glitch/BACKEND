"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
router.post('/', 
// authMiddleware,  // TODO: re-enable after testing
// checkPaidPlan,  // Vérifier que l'utilisateur a un plan payant
// planMiddleware,
// quotaMiddleware,
chat_controller_1.chatController);
exports.default = router;
