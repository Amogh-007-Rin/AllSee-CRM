
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    orgId: string;
    orgType: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};

export const generateToken = (user: { id: string; role: string; organizationId: string; organization: { type: string } }) => {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role, 
      orgId: user.organizationId,
      orgType: user.organization.type 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};
