// FESTORA API - User Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../middleware/auth.js';
import { updateUserSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';

const router = Router();

const validate = (schema: z.ZodSchema) => (req: Request, _res: Response, next: Function) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};

const validateQuery = (schema: z.ZodSchema) => (req: Request, _res: Response, next: Function) => {
  const result = schema.safeParse(req.query);
  if (!result.success) return next(result.error);
  req.query = result.data as any;
  next();
};

const validateParams = (schema: z.ZodSchema) => (req: Request, _res: Response, next: Function) => {
  const result = schema.safeParse(req.params);
  if (!result.success) return next(result.error);
  req.params = result.data as any;
  next();
};

// GET /api/v1/users - List users (admin, faculty, organizer)
router.get('/', requirePermission('user:read'), validateQuery(paginationSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, role, isActive } = req.query as any;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { studentId: { contains: search, mode: 'insensitive' } },
      { employeeId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  // Non-admin users can only see limited fields
  const select = req.user?.role === 'ADMIN' ? {
    id: true, email: true, name: true, avatarUrl: true, role: true,
    department: true, studentId: true, employeeId: true, phone: true,
    isActive: true, emailVerified: true, lastLoginAt: true,
    createdAt: true, updatedAt: true,
  } : {
    id: true, email: true, name: true, avatarUrl: true, role: true,
    department: true, isActive: true, createdAt: true,
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', requirePermission('user:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Users can only view their own profile unless they have admin/faculty/organizer role
  const canViewAll = ['ADMIN', 'FACULTY', 'ORGANIZER'].includes(req.user!.role);
  if (!canViewAll && req.user!.id !== id) {
    throw new AppError('FORBIDDEN', 'Cannot view other user profiles', 403);
  }

  const select = req.user?.role === 'ADMIN' ? {
    id: true, email: true, name: true, avatarUrl: true, role: true,
    department: true, studentId: true, employeeId: true, phone: true,
    isActive: true, emailVerified: true, lastLoginAt: true,
    createdAt: true, updatedAt: true,
  } : {
    id: true, email: true, name: true, avatarUrl: true, role: true,
    department: true, isActive: true, createdAt: true,
  };

  const user = await prisma.user.findUnique({
    where: { id },
    select,
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  res.json({ success: true, data: { user } });
}));

// PUT /api/v1/users/:id - Update user
router.put('/:id', requirePermission('user:update'), validateParams(z.object({ id: uuidSchema })), validate(updateUserSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  // Users can only update their own profile unless admin
  const isAdmin = req.user!.role === 'ADMIN';
  if (!isAdmin && req.user!.id !== id) {
    throw new AppError('FORBIDDEN', 'Cannot update other user profiles', 403);
  }

  // Non-admins cannot change role or isActive
  if (!isAdmin) {
    delete data.role;
    delete data.isActive;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, email: true, name: true, avatarUrl: true, role: true,
      department: true, studentId: true, employeeId: true, phone: true,
      isActive: true, emailVerified: true, lastLoginAt: true,
      createdAt: true, updatedAt: true,
    },
  });

  res.json({ success: true, data: { user }, message: 'User updated successfully' });
}));

// DELETE /api/v1/users/:id - Delete user (admin only)
router.delete('/:id', requireRole('ADMIN'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    throw new AppError('FORBIDDEN', 'Cannot delete your own account', 403);
  }

  await prisma.user.delete({ where: { id } });

  res.json({ success: true, message: 'User deleted successfully' });
}));

// PUT /api/v1/users/:id/role - Assign role (admin only)
router.put('/:id/role', requireRole('ADMIN'), validateParams(z.object({ id: uuidSchema })), validate(z.object({ role: z.enum(['ADMIN', 'FACULTY', 'ORGANIZER', 'VOLUNTEER', 'PARTICIPANT', 'SPONSOR', 'FINANCE_TEAM']) })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (id === req.user!.id) {
    throw new AppError('FORBIDDEN', 'Cannot change your own role', 403);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });

  res.json({ success: true, data: { user }, message: 'Role updated successfully' });
}));

export default router;