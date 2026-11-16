// FESTORA API - Registration Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createRegistrationSchema, cancelRegistrationSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { RegistrationStatus, EventStatus } from '@festora/shared';

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

// GET /api/v1/registrations - List registrations
router.get('/', requirePermission('registration:read'), validateQuery(paginationSchema.extend({
  eventId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  status: z.nativeEnum(RegistrationStatus).optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'registeredAt', sortOrder = 'desc', eventId, userId, status } = req.query as any;

  const where: any = {};

  // Role-based filtering
  if (req.user!.role === 'PARTICIPANT') {
    where.userId = req.user!.id;
  } else if (req.user!.role === 'VOLUNTEER') {
    // Volunteers can see registrations for events they're assigned to
    const volunteerEvents = await prisma.task.findMany({
      where: { assigneeId: req.user!.id },
      select: { eventId: true },
      distinct: ['eventId'],
    });
    where.eventId = { in: volunteerEvents.map(t => t.eventId) };
  } else if (eventId) {
    where.eventId = eventId;
  }

  if (userId && req.user!.role !== 'PARTICIPANT') where.userId = userId;
  if (status) where.status = status;

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        event: { select: { id: true, title: true, startDate: true, endDate: true, venueName: true } },
        user: { select: { id: true, name: true, email: true, studentId: true, department: true } },
        ticket: { select: { id: true, token: true, status: true, qrCodeUrl: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.registration.count({ where }),
  ]);

  res.json({
    success: true,
    data: { items: registrations, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}));

// GET /api/v1/registrations/:id - Get registration
router.get('/:id', requirePermission('registration:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const registration = await prisma.registration.findUnique({
    where: { id: req.params.id },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true, studentId: true, department: true, phone: true } },
      ticket: true,
      attendance: true,
    },
  });

  if (!registration) {
    throw new AppError('NOT_FOUND', 'Registration not found', 404);
  }

  // Check access
  if (req.user!.role === 'PARTICIPANT' && registration.userId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  res.json({ success: true, data: { registration } });
}));

// POST /api/v1/registrations - Create registration
router.post('/', requirePermission('registration:create'), validate(createRegistrationSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.body;
  const userId = req.user!.id;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } } } },
  });

  if (!event) {
    throw new AppError('NOT_FOUND', 'Event not found', 404);
  }

  // Check event status
  if (event.status !== EventStatus.PUBLISHED) {
    throw new AppError('INVALID_STATE', 'Registration only open for published events', 400);
  }

  // Check registration window
  const now = new Date();
  if (event.registrationStartDate && now < event.registrationStartDate) {
    throw new AppError('INVALID_STATE', 'Registration has not started yet', 400);
  }
  if (event.registrationEndDate && now > event.registrationEndDate) {
    throw new AppError('INVALID_STATE', 'Registration has ended', 400);
  }

  // Check capacity
  if (event.capacity && event._count.registrations >= event.capacity) {
    // Create waitlisted registration
    const waitlistCount = await prisma.registration.count({
      where: { eventId, status: RegistrationStatus.WAITLISTED },
    });

    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId,
        status: RegistrationStatus.WAITLISTED,
        waitlistPosition: waitlistCount + 1,
      },
      include: { event: true, user: { select: { id: true, name: true, email: true } } },
    });

    return res.status(201).json({
      success: true,
      data: { registration },
      message: 'Added to waitlist',
    });
  }

  // Check for existing registration
  const existing = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) {
    throw new AppError('DUPLICATE_REGISTRATION', 'Already registered for this event', 409);
  }

  // Create confirmed registration
  const registration = await prisma.registration.create({
    data: {
      eventId,
      userId,
      status: RegistrationStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
    include: { event: true, user: { select: { id: true, name: true, email: true } } },
  });

  // Generate ticket
  const crypto = await import('crypto');
  const token = `FES-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  await prisma.ticket.create({
    data: {
      registrationId: registration.id,
      token,
      status: 'VALID',
      issuedAt: new Date(),
      expiresAt: new Date(event.endDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'REGISTRATION_CREATED',
      entityType: 'Registration',
      entityId: registration.id,
      newData: { eventId, status: RegistrationStatus.CONFIRMED },
    },
  });

  res.status(201).json({ success: true, data: { registration }, message: 'Registration confirmed' });
}));

// POST /api/v1/registrations/cancel - Cancel registration
router.post('/cancel', requirePermission('registration:update'), validate(cancelRegistrationSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { registrationId, reason } = req.body;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { event: true, ticket: true },
  });

  if (!registration) {
    throw new AppError('NOT_FOUND', 'Registration not found', 404);
  }

  // Check ownership
  if (req.user!.role === 'PARTICIPANT' && registration.userId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Cannot cancel another user\'s registration', 403);
  }

  if (registration.status === RegistrationStatus.CANCELLED) {
    throw new AppError('INVALID_STATE', 'Registration already cancelled', 400);
  }

  // Check if event has started
  if (registration.event.startDate <= new Date()) {
    throw new AppError('INVALID_STATE', 'Cannot cancel after event has started', 400);
  }

  // Cancel registration
  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: RegistrationStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  // Cancel ticket
  if (registration.ticket) {
    await prisma.ticket.update({
      where: { id: registration.ticket.id },
      data: { status: 'CANCELLED' },
    });
  }

  // Handle waitlist promotion
  const nextWaitlisted = await prisma.registration.findFirst({
    where: { eventId: registration.eventId, status: RegistrationStatus.WAITLISTED },
    orderBy: { waitlistPosition: 'asc' },
  });

  if (nextWaitlisted) {
    await prisma.registration.update({
      where: { id: nextWaitlisted.id },
      data: { status: RegistrationStatus.CONFIRMED, confirmedAt: new Date(), waitlistPosition: null },
    });

    // Generate ticket for promoted user
    const crypto = await import('crypto');
    const token = `FES-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    await prisma.ticket.create({
      data: {
        registrationId: nextWaitlisted.id,
        token,
        status: 'VALID',
        issuedAt: new Date(),
        expiresAt: new Date(registration.event.endDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Update remaining waitlist positions
    await prisma.registration.updateMany({
      where: { eventId: registration.eventId, status: RegistrationStatus.WAITLISTED, waitlistPosition: { gt: nextWaitlisted.waitlistPosition } },
      data: { waitlistPosition: { decrement: 1 } },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'REGISTRATION_CANCELLED',
      entityType: 'Registration',
      entityId: registrationId,
      oldData: { status: registration.status },
      newData: { status: RegistrationStatus.CANCELLED, reason },
    },
  });

  res.json({ success: true, data: { registration: updated }, message: 'Registration cancelled' });
}));

export default router;