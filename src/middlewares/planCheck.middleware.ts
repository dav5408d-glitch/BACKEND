import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  plan: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET;

export const checkPaidPlan = (req: any, res: any, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET || 'development-secret-key') as DecodedToken;

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
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const checkBasicOrHigher = (req: any, res: any, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET || 'development-secret-key') as DecodedToken;

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
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const checkProOrHigher = (req: any, res: any, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET || 'development-secret-key') as DecodedToken;

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
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
