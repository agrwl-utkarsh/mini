// FESTORA API - Venue Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createVenueSchema, updateVenueSchema, paginationSchema, uuidSchema } from '@festora/shared';
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

// GET /api/v1/venues - List venues
router.get('/', validateQuery(paginationSchema.extend({
  isActive: z.string().optional(),
  search: z.string().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', isActive, search } = req.query as any;

  const where: any = {};

  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      include: { _count: { select: { events: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.venue.count({ where }),
  ]);

  res.json({
    success: true,
    data: { items: venues, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}));

// GET /api/v1/venues/:id - Get venue
router.get('/:id', validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const venue = await prisma.venue.findUnique({
    where: { id: req.params.id },
    include: {
      events: {
        where: { status: { in: ['PUBLISHED', 'IN_PROGRESS', 'APPROVED', 'PENDING_APPROVAL'] } },
        select: { id: true, title: true, startDate: true, endDate: true, status: true },
        orderBy: { startDate: 'asc' },
      },
    },
  });

  if (!venue) {
    throw new AppError('NOT_FOUND', 'Venue not found', 404);
  }

  res.json({ success: true, data: { venue } });
}));

// GET /api/v1/venues/:id/availability - Check venue availability
router.get('/:id/availability', validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, excludeEventId } = req.query as any;

  if (!startDate || !endDate) {
    throw new AppError('VALIDATION_ERROR', 'startDate and endDate are required', 400);
  }

  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) {
    throw new AppError('NOT_FOUND', 'Venue not found', 404);
  }

  const where: any = {
    venueId: req.params.id,
    status: { in: ['PUBLISHED', 'IN_PROGRESS', 'APPROVED', 'PENDING_APPROVAL'] },
    OR: [{ startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } }],
  };

  if (excludeEventId) where.NOT = { id: excludeEventId };

  const conflicts = await prisma.event.findMany({
    where,
    select: { id: true, title: true, startDate: true, endDate: true, status: true },
  });

  res.json({
    success: true,
    data: {
      available: conflicts.length === 0,
      conflicts,
      venue: { id: venue.id, name: venue.name, capacity: venue.capacity },
    },
  });
}));

// POST /api/v1/venues - Create venue
router.post('/', requirePermission('venue:create'), validate(createVenueSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const venue = await prisma.venue.create({ data: req.body });
  res.status(201).json({ success: true, data: { venue }, message: 'Venue created successfully' });
}));

// PUT /api/v1/venues/:id - Update venue
router.put('/:id', requirePermission('venue:update'), validateParams(z.object({ id: uuidSchema })), validate(updateVenueSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const venue = await prisma.venue.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: { venue }, message: 'Venue updated successfully' });
}));

// DELETE /api/v1/venues/:id - Delete venue (admin only)
router.delete('/:id', requirePermission('venue:delete'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Check if venue has active events
  const activeEvents = await prisma.event.count({
    where: {
      venueId: req.params.id,
      status: { in: ['PUBLISHED', 'IN_PROGRESS', 'APPROVED', 'PENDING_APPROVAL'] },
    },
  });

  if (activeEvents > 0) {
    throw new AppError('CONFLICT', 'Cannot delete venue with active events', 409);
  }

  await prisma.venue.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Venue deleted successfully' });
}));

export default router;