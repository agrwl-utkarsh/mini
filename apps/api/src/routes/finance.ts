// FESTORA API - Finance Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createBudgetSchema, createExpenseCategorySchema, createExpenseSchema, updateExpenseSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { ExpenseStatus } from '@festora/shared';

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
});

// ============================================
// EXPENSE CATEGORIES
// ============================================

router.get('/categories', requirePermission('expense-category:read'), asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const categories = await prisma.expenseCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: { items: categories } });
}));

router.post('/categories', requirePermission('expense-category:create'), validate(createExpenseCategorySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await prisma.expenseCategory.create({ data: req.body });
  res.status(201).json({ success: true, data: { category }, message: 'Category created' });
}));

// ============================================
// BUDGETS
// ============================================

router.get('/budgets', requirePermission('budget:read'), validateQuery(paginationSchema.extend({ eventId: uuidSchema.optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, eventId } = req.query as any;

  const where: any = {};
  if (eventId) where.eventId = eventId;
  else if (req.user!.role === 'ORGANIZER') {
    const events = await prisma.event.findMany({ where: { organizerId: req.user!.id }, select: { id: true } });
    where.eventId = { in: events.map(e => e.id) };
  }

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { event: { select: { id: true, title: true } }, approver: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.budget.count({ where }),
  ]);

  // Calculate spent amounts
  const budgetsWithStats = await Promise.all(budgets.map(async (b) => {
    const expenses = await prisma.expense.aggregate({
      where: { eventId: b.eventId, status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] } },
      _sum: { amount: true },
    });
    const spent = expenses._sum.amount || 0;
    return {
      ...b,
      spentAmount: spent,
      remainingAmount: Number(b.approvedAmount) - Number(spent),
      usedPercentage: b.approvedAmount > 0 ? (Number(spent) / Number(b.approvedAmount) * 100).toFixed(1) : 0,
    };
  }));

  res.json({ success: true, data: { items: budgetsWithStats, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.post('/budgets', requirePermission('budget:create'), validate(createBudgetSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, ...data } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  const existing = await prisma.budget.findUnique({ where: { eventId } });
  if (existing) throw new AppError('CONFLICT', 'Budget already exists for this event', 409);

  const budget = await prisma.budget.create({
    data: { ...data, eventId },
    include: { event: { select: { id: true, title: true } } },
  });

  res.status(201).json({ success: true, data: { budget }, message: 'Budget created' });
}));

// ============================================
// EXPENSES
// ============================================

router.get('/expenses', requirePermission('expense:read'), validateQuery(paginationSchema.extend({
  eventId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  status: z.nativeEnum(ExpenseStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'expenseDate', sortOrder = 'desc', eventId, categoryId, status, startDate, endDate } = req.query as any;

  const where: any = {};

  if (req.user!.role === 'ORGANIZER') {
    const events = await prisma.event.findMany({ where: { organizerId: req.user!.id }, select: { id: true } });
    where.eventId = { in: events.map(e => e.id) };
  } else if (eventId) {
    where.eventId = eventId;
  }

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate);
    if (endDate) where.expenseDate.lte = new Date(endDate);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { event: { select: { id: true, title: true } }, category: true, recorder: { select: { id: true, name: true } }, approver: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  res.json({ success: true, data: { items: expenses, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.post('/expenses', requirePermission('expense:create'), validate(createExpenseSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, categoryId, ...data } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  const expense = await prisma.expense.create({
    data: { ...data, eventId, categoryId, recordedBy: req.user!.id },
    include: { category: true, event: { select: { id: true, title: true } } },
  });

  res.status(201).json({ success: true, data: { expense }, message: 'Expense recorded' });
}));

router.put('/expenses/:id', requirePermission('expense:update'), validateParams(z.object({ id: uuidSchema })), validate(updateExpenseSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new AppError('NOT_FOUND', 'Expense not found', 404);

  // Check access
  if (req.user!.role === 'ORGANIZER') {
    const event = await prisma.event.findUnique({ where: { id: expense.eventId } });
    if (event?.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  const updated = await prisma.expense.update({ where: { id: req.params.id }, data: req.body, include: { category: true } });
  res.json({ success: true, data: { expense: updated }, message: 'Expense updated' });
}));

router.post('/expenses/:id/approve', requirePermission('expense:approve'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new AppError('NOT_FOUND', 'Expense not found', 404);

  if (expense.status !== ExpenseStatus.PENDING) throw new AppError('INVALID_STATE', 'Only pending expenses can be approved', 400);

  const updated = await prisma.expense.update({
    where: { id: req.params.id },
    data: { status: ExpenseStatus.APPROVED, approvedBy: req.user!.id, approvedAt: new Date() },
  });

  res.json({ success: true, data: { expense: updated }, message: 'Expense approved' });
}));

export default router;