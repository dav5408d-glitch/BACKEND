"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProOrHigher = exports.checkBasicOrHigher = exports.checkPaidPlan = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const checkPaidPlan = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET || 'development-secret-key');
        // Vérifier que le plan n'est pas FREE
        if (decoded.plan === 'FREE') {
            return res.status(403).json({
                error: 'Subscription required',
                message: 'You must subscribe to a paid plan to use the AI. Please upgrade your plan.'
            });
        }
        // Attacher les informations de l'utilisateur à la requête
        req.user = decoded;
        req.userPlan = decoded.plan;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.checkPaidPlan = checkPaidPlan;
const checkBasicOrHigher = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET || 'development-secret-key');
        // Vérifier que l'utilisateur a un plan basique ou payant (Basic, Pro ou Elite)
        const allowedPlans = ['BAS', 'PRO', 'ELITE'];
        if (!allowedPlans.includes(decoded.plan)) {
            return res.status(403).json({
                error: 'Subscription required',
                message: 'You must subscribe to a paid plan to use this feature.'
            });
        }
        req.user = decoded;
        req.userPlan = decoded.plan;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.checkBasicOrHigher = checkBasicOrHigher;
const checkProOrHigher = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET || 'development-secret-key');
        // Vérifier que le plan est au moins PRO
        const allowedPlans = ['PRO', 'ELITE'];
        if (!allowedPlans.includes(decoded.plan)) {
            return res.status(403).json({
                error: 'Premium subscription required',
                message: 'This feature requires a Pro or Elite plan.'
            });
        }
        req.user = decoded;
        req.userPlan = decoded.plan;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.checkProOrHigher = checkProOrHigher;
