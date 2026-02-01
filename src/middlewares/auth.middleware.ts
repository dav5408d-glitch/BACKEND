import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const BETA_MODE = process.env.BETA_MODE === 'true';

if (!JWT_SECRET && !BETA_MODE) {
  console.warn('⚠️ WARNING: JWT_SECRET not set in environment! Using development default. NEVER use this in production!');
}

export function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;

  // If no token, allow as guest
  if (!header || !header.startsWith('Bearer ')) {
    if (BETA_MODE) {
      req.user = { userId: 'beta-user', plan: 'FREE', role: 'beta' };
    } else {
      req.user = { role: 'guest' };
    }
    return next();
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET || 'development-secret-key'
    );

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    // If token is invalid but present, we might want to still allow guest mode 
    // but it's safer to return 401 if they tried to authenticate and failed.
    return res.status(401).json({ error: 'Invalid token' });
  }
}
