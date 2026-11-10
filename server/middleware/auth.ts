import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store';
import { User } from '../db/types';

/**
 * Retrieves the cryptographic JWT secret from the environment.
 * In production or development, fails safely if the secret is unconfigured.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET environment variable is missing or empty.');
  }
  return secret;
}

export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Issues a signed JSON Web Token for the authenticated user.
 */
export function generateToken(user: User): string {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Authentication middleware.
 * - In production: Requires a valid, cryptographically signed Bearer JWT token.
 * - In development mode only (NODE_ENV !== 'production'): Permits x-demo-user-id for rapid testing.
 * - Fails safely with HTTP 500 if JWT_SECRET is unconfigured on the server.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Developer rapid identity switching: STRICTLY restricted to development mode.
  if (!isProduction) {
    const demoUserId = req.headers['x-demo-user-id'] as string;
    if (!token && demoUserId) {
      const user = db.getUserById(demoUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token is required.' });
  }

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch (err: any) {
    console.error('Authentication security error:', err.message);
    return res.status(500).json({ error: 'Internal security error: Server authentication is misconfigured.' });
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    const user = db.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User account not found.' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
}

/**
 * Optional authentication middleware.
 * Attaches user if a valid token (or dev demo header) is supplied, but does not block unauthenticated requests.
 */
export function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const authHeader = req.headers.authorization;

  if (!isProduction) {
    const demoUserId = req.headers['x-demo-user-id'] as string;
    if (demoUserId) {
      const user = db.getUserById(demoUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as { id: string };
      const user = db.getUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token verification errors for optional authentication
    }
  }
  next();
}

/**
 * Role-based authorization middleware requiring 'admin' privileges.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }
  next();
}

/**
 * Role-based authorization middleware requiring 'admin' or 'inspector' privileges.
 */
export function requireVerifier(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'inspector') {
    return res.status(403).json({
      error: 'Forbidden: Administrator or certified agricultural inspector privileges required.',
    });
  }
  next();
}


