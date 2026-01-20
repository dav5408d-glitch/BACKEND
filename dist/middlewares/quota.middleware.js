"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotaMiddleware = quotaMiddleware;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const REQUEST_LIMITS = {
    'FREE': 5,
    'BAS': 50,
    'PRO': 300,
    'ELITE': 1000
};
async function quotaMiddleware(req, res, next) {
    try {
        const userId = req.user?.userId;
        const plan = req.user?.plan || 'FREE';
        if (!userId) {
            return res.status(401).json({ error: 'No user ID in token' });
        }
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);
        // Get or create usage record for today
        let usage = await prisma.usage.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: todayDate
                }
            }
        });
        if (!usage) {
            usage = await prisma.usage.create({
                data: {
                    userId,
                    date: todayDate,
                    requests: 0,
                    totalTokens: 0,
                    totalCostUSD: 0
                }
            });
        }
        const limit = REQUEST_LIMITS[plan] || 5;
        const remaining = Math.max(0, limit - usage.requests);
        // Store in request for later use
        req.quota = {
            used: usage.requests,
            limit,
            remaining,
            plan
        };
        if (usage.requests >= limit) {
            return res.status(429).json({
                error: 'Quota exceeded',
                message: `You have reached your daily limit of ${limit} requests for your ${plan} plan.`,
                quota: req.quota
            });
        }
        next();
    }
    catch (error) {
        console.error('Quota middleware error:', error);
        // Don't block the request if quota check fails
        req.quota = { used: 0, limit: 999, remaining: 999, plan: 'unknown' };
        next();
    }
}
