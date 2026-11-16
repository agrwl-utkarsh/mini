// FESTORA API - Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { UserRole, AppError } from '../middleware/errorHandler.js';
import { hasPermission, Permission } from '@festora/shared';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  };
  token?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.festora_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
      role: UserRole;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      isActive: true, // Will be verified below
    };
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('TOKEN_EXPIRED', 'Token has expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('INVALID_TOKEN', 'Invalid token', 401);
    }
    throw new AppError('UNAUTHORIZED', 'Authentication failed', 401);
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.festora_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
      role: UserRole;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      isActive: true,
    };
    req.token = token;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new AppError('FORBIDDEN', `Permission denied: ${permission}`, 403);
    }

    next();
  };
}

export function requireOwnershipOrPermission(
  getResourceUserId: (req: AuthenticatedRequest) => Promise<string | null> | string | null,
  permission: Permission
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Check if user has the permission
    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    // Check ownership
    const resourceUserId = await getResourceUserId(req);
    if (resourceUserId && resourceUserId === req.user.id) {
      return next();
    }

    throw new AppError('FORBIDDEN', 'Access denied: not owner and insufficient permissions', 403);
  };
}

export function generateTokens(user: { id: string; email: string; name: string; role: UserRole }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; type: string };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  res.cookie('festora_token', accessToken, cookieOptions);
  res.cookie('festora_refresh_token', refreshToken, refreshCookieOptions);
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('festora_token');
  res.clearCookie('festora_refresh_token');
}