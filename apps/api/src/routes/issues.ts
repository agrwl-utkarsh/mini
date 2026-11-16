// FESTORA API - Issue Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createIssueSchema, updateIssueSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { IssueSeverity, IssueStatus } from '@festora/shared';

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

// GET /api/v1/issues - List issues
router.get('/', requirePermission('issue:read'), validateQuery(paginationSchema.extend({
  eventId: uuidSchema.optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  severity: z.nativeEnum(IssueSeverity).optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', eventId, status, severity } = req.query as any;

  const where: any = {};

  if (req.user!.role === 'VOLUNTEER') {
    const volunteerEvents = await prisma.task.findMany({
      where: { assigneeId: req.user!.id },
      select: { eventId: true },
      distinct: ['eventId'],
    });
    where.eventId = { in: volunteerEvents.map(t => t.eventId) };
  } else if (eventId) {
    where.eventId = eventId;
  }

  if (status) where.status = status;
  if (severity) where.severity = severity;

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        event: { select: { id: true, title: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.issue.count({ where }),
  ]);

  res.json({ success: true, data: { items: issues, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/v1/issues/:id - Get issue
router.get('/:id', requirePermission('issue:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.id },
    include: {
      event: { select: { id: true, title: true } },
      reporter: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  if (!issue) throw new AppError('NOT_FOUND', 'Issue not found', 404);
  res.json({ success: true, data: { issue } });
}));

// POST /api/v1/issues - Create issue
router.post('/', requirePermission('issue:create'), validate(createIssueSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, ...data } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  const issue = await prisma.issue.create({
    data: { ...data, eventId, reportedBy: req.user!.id },
    include: { event: { select: { id: true, title: true } }, reporter: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: { issue }, message: 'Issue reported successfully' });
}));

// PUT /api/v1/issues/:id - Update issue
router.put('/:id', requirePermission('issue:update'), validateParams(z.object({ id: uuidSchema })), validate(updateIssueSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) throw new AppError('NOT_FOUND', 'Issue not found', 404);

  if (data.status === IssueStatus.RESOLVED && !issue.resolvedAt) data.resolvedAt = new Date();

  const updated = await prisma.issue.update({
    where: { id },
    data,
    include: { assignee: { select: { id: true, name: true } } },
  });

  res.json({ success: true, data: { issue: updated }, message: 'Issue updated successfully' });
}));

export default router;