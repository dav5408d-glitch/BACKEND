"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planMiddleware = planMiddleware;
function planMiddleware(req, res, next) {
    // Vérifier que req.user a un plan (peut être 'plan' ou 'planType')
    const plan = req.user?.plan || req.user?.planType;
    if (!plan) {
        console.warn('⚠️ No plan found in req.user:', req.user);
        return res.status(403).json({ error: 'No plan' });
    }
    console.log('✅ Plan middleware passed. User plan:', plan);
    next();
}
