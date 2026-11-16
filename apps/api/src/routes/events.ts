// FESTORA API - Event Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../middleware/auth.js';
import { createEventSchema, updateEventSchema, submitEventForApprovalSchema, approveEventSchema, rejectEventSchema, publishEventSchema, cancelEventSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { EventStatus, EVENT_STATUS_TRANSITIONS } from '@festora/shared';

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

// Helper: Check if user can access event
async function checkEventAccess(req: AuthenticatedRequest, eventId: string, permission: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true, status: true },
  });

  if (!event) {
    throw new AppError('NOT_FOUND', 'Event not found', 404);
  }

  // Check permission
  const { hasPermission } = await import('@festora/shared');
  if (hasPermission(req.user!.role, permission as any)) {
    return event;
  }

  // Check ownership for organizers
  if (req.user!.role === 'ORGANIZER' && event.organizerId === req.user!.id) {
    return event;
  }

  // Participants can view published events
  if (req.user!.role === 'PARTICIPANT' && event.status === 'PUBLISHED') {
    return event;
  }

  // Volunteers can view published/in_progress events
  if (req.user!.role === 'VOLUNTEER' && ['PUBLISHED', 'IN_PROGRESS'].includes(event.status)) {
    return event;
  }

  // Sponsors can view events they sponsor
  if (req.user!.role === 'SPONSOR') {
    const sponsorship = await prisma.sponsorship.findFirst({
      where: { eventId, sponsor: { contactEmail: req.user!.email } },
    });
    if (sponsorship) return event;
  }

  throw new AppError('FORBIDDEN', 'Access denied to this event', 403);
}

// GET /api/v1/events - List events
router.get('/', validateQuery(paginationSchema.extend({
  status: z.nativeEnum(EventStatus).optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  upcoming: z.string().optional(),
  past: z.string().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'startDate', sortOrder = 'asc', status, type, category, upcoming, past } = req.query as any;

  const where: any = {};

  // Role-based filtering
  if (req.user!.role === 'PARTICIPANT') {
    where.status = 'PUBLISHED';
  } else if (req.user!.role === 'VOLUNTEER') {
    where.status = { in: ['PUBLISHED', 'IN_PROGRESS'] };
  } else if (req.user!.role === 'ORGANIZER') {
    where.organizerId = req.user!.id;
  } else if (req.user!.role === 'SPONSOR') {
    const sponsorships = await prisma.sponsorship.findMany({
      where: { sponsor: { contactEmail: req.user!.email } },
      select: { eventId: true },
    });
    where.id = { in: sponsorships.map(s => s.eventId) };
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (category) where.category = category;

  const now = new Date();
  if (upcoming === 'true') where.startDate = { gte: now };
  if (past === 'true') where.endDate = { lte: now };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        venue: { select: { id: true, name: true, location: true, capacity: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/v1/events/:id - Get event by ID
router.get('/:id', validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const event = await checkEventAccess(req, req.params.id, 'event:read');

  const fullEvent = await prisma.event.findUnique({
    where: { id: event.id },
    include: {
      organizer: { select: { id: true, name: true, email: true, department: true } },
      approver: { select: { id: true, name: true, email: true } },
      venue: true,
      approvals: {
        include: { reviewer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { registrations: true, tasks: true, attendances: true } },
    },
  });

  // Add registration info for participants
  let userRegistration = null;
  if (req.user!.role === 'PARTICIPANT') {
    userRegistration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.id } },
      include: { ticket: true },
    });
  }

  res.json({
    success: true,
    data: { event: { ...fullEvent, userRegistration } },
  });
}));

// POST /api/v1/events - Create event
router.post('/', requirePermission('event:create'), validate(createEventSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Generate slug from title
  const slug = req.body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);

  // Check venue availability if venueId provided
  if (req.body.venueId) {
    const conflictingEvent = await prisma.event.findFirst({
      where: {
        venueId: req.body.venueId,
        status: { in: ['PUBLISHED', 'IN_PROGRESS', 'APPROVED', 'PENDING_APPROVAL'] },
        OR: [
          { startDate: { lte: req.body.endDate }, endDate: { gte: req.body.startDate } },
        ],
        NOT: { id: '' }, // Exclude self when updating
      },
    });

    if (conflictingEvent) {
      throw new AppError('VENUE_CONFLICT', 'Venue is already booked for the selected time', 409);
    }
  }

  const event = await prisma.event.create({
    data: {
      ...req.body,
      slug,
      organizerId: req.user!.id,
      status: EventStatus.DRAFT,
    },
    include: {
      organizer: { select: { id: true, name: true } },
      venue: { select: { id: true, name: true } },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: event.id,
      newData: { title: event.title, status: event.status },
    },
  });

  res.status(201).json({ success: true, data: { event }, message: 'Event created successfully' });
}));

// PUT /api/v1/events/:id - Update event
router.put('/:id', requirePermission('event:update'), validateParams(z.object({ id: uuidSchema })), validate(updateEventSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const event = await checkEventAccess(req, id, 'event:update');

  // Only allow updates if event is in DRAFT or PENDING_APPROVAL
  if (!['DRAFT', 'PENDING_APPROVAL'].includes(event.status)) {
    throw new AppError('INVALID_STATE', 'Cannot update event in current status', 400);
  }

  // Check venue conflict if venue or dates changed
  if (req.body.venueId || req.body.startDate || req.body.endDate) {
    const venueId = req.body.venueId || event.venueId;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : event.startDate;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : event.endDate;

    if (venueId) {
      const conflictingEvent = await prisma.event.findFirst({
        where: {
          venueId,
          status: { in: ['PUBLISHED', 'IN_PROGRESS', 'APPROVED', 'PENDING_APPROVAL'] },
          OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
          NOT: { id },
        },
      });

      if (conflictingEvent) {
        throw new AppError('VENUE_CONFLICT', 'Venue is already booked for the selected time', 409);
      }
    }
  }

  const updated = await prisma.event.update({
    where: { id },
    data: req.body,
    include: {
      organizer: { select: { id: true, name: true } },
      venue: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_UPDATED',
      entityType: 'Event',
      entityId: id,
      newData: req.body,
    },
  });

  res.json({ success: true, data: { event: updated }, message: 'Event updated successfully' });
}));

// POST /api/v1/events/submit-approval - Submit for approval
router.post('/submit-approval', requirePermission('event:submit-approval'), validate(submitEventForApprovalSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.body;
  const event = await checkEventAccess(req, eventId, 'event:submit-approval');

  if (event.status !== EventStatus.DRAFT) {
    throw new AppError('INVALID_STATE', 'Only draft events can be submitted for approval', 400);
  }

  // Validate required fields for approval
  if (!event.venueId && !event.location) {
    throw new AppError('VALIDATION_ERROR', 'Venue or location is required for approval', 400);
  }
  if (!event.startDate || !event.endDate) {
    throw new AppError('VALIDATION_ERROR', 'Start and end dates are required', 400);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.PENDING_APPROVAL },
  });

  await prisma.eventApproval.create({
    data: {
      eventId,
      reviewerId: req.user!.id,
      status: EventStatus.PENDING_APPROVAL,
      comments: 'Submitted for approval by organizer',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_SUBMITTED_APPROVAL',
      entityType: 'Event',
      entityId: eventId,
      oldData: { status: EventStatus.DRAFT },
      newData: { status: EventStatus.PENDING_APPROVAL },
    },
  });

  res.json({ success: true, data: { event: updated }, message: 'Event submitted for approval' });
}));

// POST /api/v1/events/approve - Approve event (faculty/admin)
router.post('/approve', requirePermission('event:approve'), validate(approveEventSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, comments } = req.body;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new AppError('NOT_FOUND', 'Event not found', 404);
  }

  if (event.status !== EventStatus.PENDING_APPROVAL) {
    throw new AppError('INVALID_STATE', 'Only pending approval events can be approved', 400);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.APPROVED,
      approvedBy: req.user!.id,
      approvedAt: new Date(),
    },
  });

  await prisma.eventApproval.create({
    data: { eventId, reviewerId: req.user!.id, status: EventStatus.APPROVED, comments },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_APPROVED',
      entityType: 'Event',
      entityId: eventId,
      oldData: { status: EventStatus.PENDING_APPROVAL },
      newData: { status: EventStatus.APPROVED },
    },
  });

  res.json({ success: true, data: { event: updated }, message: 'Event approved successfully' });
}));

// POST /api/v1/events/reject - Reject event (faculty/admin)
router.post('/reject', requirePermission('event:reject'), validate(rejectEventSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, reason } = req.body;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new AppError('NOT_FOUND', 'Event not found', 404);
  }

  if (event.status !== EventStatus.PENDING_APPROVAL) {
    throw new AppError('INVALID_STATE', 'Only pending approval events can be rejected', 400);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.REJECTED,
      rejectionReason: reason,
    },
  });

  await prisma.eventApproval.create({
    data: { eventId, reviewerId: req.user!.id, status: EventStatus.REJECTED, comments: reason },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_REJECTED',
      entityType: 'Event',
      entityId: eventId,
      oldData: { status: EventStatus.PENDING_APPROVAL },
      newData: { status: EventStatus.REJECTED, rejectionReason: reason },
    },
  });

  res.json({ success: true, data: { event: updated }, message: 'Event rejected' });
}));

// POST /api/v1/events/publish - Publish event (organizer/admin)
router.post('/publish', requirePermission('event:publish'), validate(publishEventSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.body;
  const event = await checkEventAccess(req, eventId, 'event:publish');

  if (event.status !== EventStatus.APPROVED) {
    throw new AppError('INVALID_STATE', 'Only approved events can be published', 400);
  }

  // Validate publish requirements
  if (!event.venueId && !event.location) {
    throw new AppError('VALIDATION_ERROR', 'Venue or location is required', 400);
  }
  if (!event.registrationStartDate || !event.registrationEndDate) {
    throw new AppError('VALIDATION_ERROR', 'Registration dates are required', 400);
  }
  if (event.registrationEndDate >= event.startDate) {
    throw new AppError('VALIDATION_ERROR', 'Registration must end before event starts', 400);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_PUBLISHED',
      entityType: 'Event',
      entityId: eventId,
      oldData: { status: EventStatus.APPROVED },
      newData: { status: EventStatus.PUBLISHED },
    },
  });

  res.json({ success: true, data: { event: updated }, message: 'Event published successfully' });
}));

// POST /api/v1/events/cancel - Cancel event
router.post('/cancel', requirePermission('event:cancel'), validate(cancelEventSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, reason } = req.body;
  const event = await checkEventAccess(req, eventId, 'event:cancel');

  const validCancelStatuses = [EventStatus.DRAFT, EventStatus.PENDING_APPROVAL, EventStatus.APPROVED, EventStatus.PUBLISHED, EventStatus.IN_PROGRESS];
  if (!validCancelStatuses.includes(event.status)) {
    throw new AppError('INVALID_STATE', 'Event cannot be cancelled in current status', 400);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  // Cancel all registrations
  await prisma.registration.updateMany({
    where: { eventId, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: { status: RegistrationStatus.CANCELLED, cancellationReason: reason, cancelledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EVENT_CANCELLED',
      entityType: 'Event',
      entityId: eventId,
      oldData: { status: event.status },
      newData: { status: EventStatus.CANCELLED, cancellationReason: reason },
    },
  });

  res.json({ success: true, data: { event: updated }, message: 'Event cancelled' });
}));

// DELETE /api/v1/events/:id - Delete event (admin/organizer, only draft)
router.delete('/:id', requirePermission('event:delete'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const event = await checkEventAccess(req, id, 'event:delete');

  if (event.status !== EventStatus.DRAFT) {
    throw new AppError('INVALID_STATE', 'Only draft events can be deleted', 400);
  }

  await prisma.event.delete({ where: { id } });

  res.json({ success: true, message: 'Event deleted successfully' });
}));

export default router;