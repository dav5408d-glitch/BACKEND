import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET not set in environment! Using development default. NEVER use this in production!');
}

export function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - missing token' });
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
    return res.status(401).json({ error: 'Invalid token' });
  }
}
