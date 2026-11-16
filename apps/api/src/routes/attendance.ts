// FESTORA API - Attendance Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { checkInSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { TicketStatus } from '@festora/shared';

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

// POST /api/v1/attendance/check-in - Check in attendee
router.post('/check-in', requirePermission('attendance:create'), validate(checkInSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { token, eventId, isManualEntry, notes } = req.body;

  // Find ticket by token
  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: {
      registration: {
        include: { event: true, user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: { code: 'INVALID_TICKET', message: 'Invalid ticket' },
    });
  }

  // Verify event matches
  if (ticket.registration.eventId !== eventId) {
    return res.status(400).json({
      success: false,
      error: { code: 'WRONG_EVENT', message: 'Ticket is for a different event' },
    });
  }

  // Check ticket status
  if (ticket.status !== TicketStatus.VALID) {
    let message = 'Ticket is invalid';
    if (ticket.status === TicketStatus.USED) message = 'Ticket already used';
    else if (ticket.status === TicketStatus.EXPIRED) message = 'Ticket has expired';
    else if (ticket.status === TicketStatus.CANCELLED) message = 'Ticket has been cancelled';

    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TICKET', message, details: { ticketStatus: ticket.status } },
    });
  }

  // Check if already checked in
  const existingAttendance = await prisma.attendance.findUnique({
    where: { ticketId: ticket.id },
  });

  if (existingAttendance) {
    return res.status(409).json({
      success: false,
      error: { code: 'ALREADY_CHECKED_IN', message: 'Already checked in', details: { checkedInAt: existingAttendance.scannedAt } },
    });
  }

  // Check event status
  const event = ticket.registration.event;
  if (event.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      error: { code: 'EVENT_CANCELLED', message: 'Event has been cancelled' },
    });
  }

  // Create attendance record
  const attendance = await prisma.attendance.create({
    data: {
      eventId,
      registrationId: ticket.registrationId,
      ticketId: ticket.id,
      scannedBy: req.user!.id,
      isManualEntry: isManualEntry || false,
      notes,
    },
    include: {
      event: { select: { id: true, title: true } },
      registration: { include: { user: { select: { id: true, name: true, email: true } } } },
      scanner: { select: { id: true, name: true } },
    },
  });

  // Update ticket status
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: TicketStatus.USED, usedAt: new Date(), usedBy: req.user!.id },
  });

  // Update registration attendance
  await prisma.registration.update({
    where: { id: ticket.registrationId },
    data: { attendedAt: new Date(), status: 'CONFIRMED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'ATTENDANCE_CHECK_IN',
      entityType: 'Attendance',
      entityId: attendance.id,
      newData: { eventId, registrationId: ticket.registrationId, ticketId: ticket.id, isManualEntry },
    },
  });

  res.status(201).json({
    success: true,
    data: { attendance },
    message: 'Check-in successful',
  });
}));

// GET /api/v1/attendance - List attendance records
router.get('/', requirePermission('attendance:read'), validateQuery(paginationSchema.extend({
  eventId: uuidSchema.optional(),
  registrationId: uuidSchema.optional(),
  scannedBy: uuidSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'scannedAt', sortOrder = 'desc', eventId, registrationId, scannedBy, startDate, endDate } = req.query as any;

  const where: any = {};

  if (req.user!.role === 'PARTICIPANT') {
    const userRegistrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    where.registrationId = { in: userRegistrations.map(r => r.id) };
  } else if (req.user!.role === 'VOLUNTEER') {
    where.scannedBy = req.user!.id;
  } else {
    if (eventId) where.eventId = eventId;
    if (registrationId) where.registrationId = registrationId;
    if (scannedBy) where.scannedBy = scannedBy;
  }

  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = new Date(startDate);
    if (endDate) where.scannedAt.lte = new Date(endDate);
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        event: { select: { id: true, title: true } },
        registration: { include: { user: { select: { id: true, name: true, email: true } } } },
        scanner: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({ success: true, data: { items: attendance, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/v1/attendance/stats/:eventId - Get attendance stats for event
router.get('/stats/:eventId', requirePermission('attendance:read'), validateParams(z.object({ eventId: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.params;

  // Check access
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  const [totalRegistrations, checkedIn, waitlisted] = await Promise.all([
    prisma.registration.count({ where: { eventId, status: { in: ['CONFIRMED', 'WAITLISTED'] } } }),
    prisma.attendance.count({ where: { eventId } }),
    prisma.registration.count({ where: { eventId, status: 'WAITLISTED' } }),
  ]);

  const confirmedRegistrations = await prisma.registration.count({ where: { eventId, status: 'CONFIRMED' } });

  res.json({
    success: true,
    data: {
      eventId,
      totalRegistrations,
      confirmedRegistrations,
      checkedIn,
      waitlisted,
      attendanceRate: confirmedRegistrations > 0 ? (checkedIn / confirmedRegistrations * 100).toFixed(1) : 0,
      noShows: confirmedRegistrations - checkedIn,
    },
  });
}));

export default router;