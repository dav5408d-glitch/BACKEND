import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { role: string };
    }
  }
}

export const guestMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        req.user = { role: 'guest' }; // Assign a guest role
    }
    next();
};