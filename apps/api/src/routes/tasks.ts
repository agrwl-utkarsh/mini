// FESTORA API - Task Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createTaskSchema, updateTaskSchema, createTaskCommentSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@festora/shared';

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

// GET /api/v1/tasks - List tasks
router.get('/', requirePermission('task:read'), validateQuery(paginationSchema.extend({
  eventId: uuidSchema.optional(),
  assigneeId: uuidSchema.optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  overdue: z.string().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', eventId, assigneeId, status, priority, overdue } = req.query as any;

  const where: any = {};

  if (req.user!.role === 'VOLUNTEER') {
    where.assigneeId = req.user!.id;
  } else {
    if (eventId) where.eventId = eventId;
    if (assigneeId) where.assigneeId = assigneeId;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: ['COMPLETED'] };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        event: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  res.json({ success: true, data: { items: tasks, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/v1/tasks/:id - Get task
router.get('/:id', requirePermission('task:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      event: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);

  // Check access
  if (req.user!.role === 'VOLUNTEER' && task.assigneeId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  res.json({ success: true, data: { task } });
}));

// POST /api/v1/tasks - Create task
router.post('/', requirePermission('task:create'), validate(createTaskSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, ...data } = req.body;

  // Verify event access
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Cannot create tasks for other organizers\' events', 403);
  }

  const task = await prisma.task.create({
    data: { ...data, eventId, reporterId: req.user!.id },
    include: { assignee: { select: { id: true, name: true } }, event: { select: { id: true, title: true } } },
  });

  res.status(201).json({ success: true, data: { task }, message: 'Task created successfully' });
}));

// PUT /api/v1/tasks/:id - Update task
router.put('/:id', requirePermission('task:update'), validateParams(z.object({ id: uuidSchema })), validate(updateTaskSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);

  // Check access
  if (req.user!.role === 'VOLUNTEER' && task.assigneeId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Cannot update tasks assigned to others', 403);
  }

  // Volunteers can only update status and actualHours
  if (req.user!.role === 'VOLUNTEER') {
    const allowedFields = ['status', 'actualHours', 'startedAt', 'completedAt'];
    Object.keys(data).forEach(key => {
      if (!allowedFields.includes(key)) delete data[key];
    });
  }

  // Auto-set timestamps
  if (data.status === TaskStatus.IN_PROGRESS && !task.startedAt) data.startedAt = new Date();
  if (data.status === TaskStatus.COMPLETED && !task.completedAt) data.completedAt = new Date();

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: { assignee: { select: { id: true, name: true } } },
  });

  res.json({ success: true, data: { task: updated }, message: 'Task updated successfully' });
}));

// POST /api/v1/tasks/:id/comments - Add comment
router.post('/:id/comments', requirePermission('task:read'), validateParams(z.object({ id: uuidSchema })), validate(createTaskCommentSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);

  const comment = await prisma.taskComment.create({
    data: { taskId: id, userId: req.user!.id, content: req.body.content },
    include: { user: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: { comment }, message: 'Comment added' });
}));

// DELETE /api/v1/tasks/:id - Delete task
router.delete('/:id', requirePermission('task:delete'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);

  if (req.user!.role === 'ORGANIZER') {
    const event = await prisma.event.findUnique({ where: { id: task.eventId } });
    if (event?.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Task deleted successfully' });
}));

export default router;