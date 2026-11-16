// FESTORA API - Authentication Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { hashPassword } from '../utils/password.js';
import { generateTokens, setAuthCookies, clearAuthCookies, verifyRefreshToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { loginSchema, createUserSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '@festora/shared';
import { z } from 'zod';

const router = Router();

// Validation middleware
const validate = (schema: z.ZodSchema) => (req: Request, _res: Response, next: Function) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  req.body = result.data;
  next();
};

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const bcrypt = await import('bcryptjs');
  const isValid = await bcrypt.default.compare(password, user.passwordHash);

  if (!isValid) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  setAuthCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
    message: 'Login successful',
  });
}));

// POST /api/v1/auth/register
router.post('/register', validate(createUserSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, role, department, studentId, employeeId, phone } = req.body;

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    throw new AppError('EMAIL_EXISTS', 'An account with this email already exists', 409);
  }

  // Only allow participant registration by default
  // Other roles require admin creation
  const allowedSelfRegisterRoles = ['PARTICIPANT'];
  const finalRole = allowedSelfRegisterRoles.includes(role) ? role : 'PARTICIPANT';

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: finalRole as any,
      department,
      studentId,
      employeeId,
      phone,
      isActive: true,
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
    message: 'Registration successful',
  });
}));

// POST /api/v1/auth/refresh
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.festora_refresh_token || req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError('TOKEN_MISSING', 'Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
  }

  if (decoded.type !== 'refresh') {
    throw new AppError('INVALID_TOKEN', 'Invalid token type', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('USER_NOT_FOUND', 'User not found or inactive', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  setAuthCookies(res, accessToken, newRefreshToken);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    },
    message: 'Token refreshed',
  });
}));

// POST /api/v1/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      department: true,
      studentId: true,
      employeeId: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  res.json({ success: true, data: { user } });
}));

// POST /api/v1/auth/change-password
router.post('/change-password', validate(changePasswordSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  const bcrypt = await import('bcryptjs');
  const isValid = await bcrypt.default.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: newPasswordHash },
  });

  res.json({ success: true, message: 'Password changed successfully' });
}));

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  }

  // TODO: Generate reset token, send email
  // For now, just log it
  console.log(`Password reset requested for ${email}`);

  res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
}));

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  // TODO: Verify reset token from database
  // For now, just return success
  console.log('Password reset with token:', token);

  res.json({ success: true, message: 'Password has been reset' });
}));

export default router;