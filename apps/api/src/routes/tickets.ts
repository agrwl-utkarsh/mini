// FESTORA API - Ticket Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import QRCode from 'qrcode';

const router = Router();

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

// GET /api/v1/tickets - List tickets
router.get('/', requirePermission('ticket:read'), validateQuery(paginationSchema.extend({
  eventId: uuidSchema.optional(),
  registrationId: uuidSchema.optional(),
  status: z.string().optional(),
})), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'issuedAt', sortOrder = 'desc', eventId, registrationId, status } = req.query as any;

  const where: any = {};

  if (req.user!.role === 'PARTICIPANT') {
    const userRegistrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    where.registrationId = { in: userRegistrations.map(r => r.id) };
  } else if (eventId) {
    const eventRegistrations = await prisma.registration.findMany({
      where: { eventId },
      select: { id: true },
    });
    where.registrationId = { in: eventRegistrations.map(r => r.id) };
  }

  if (registrationId) where.registrationId = registrationId;
  if (status) where.status = status;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        registration: {
          include: {
            event: { select: { id: true, title: true, startDate: true, endDate: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ success: true, data: { items: tickets, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/v1/tickets/:id - Get ticket
router.get('/:id', requirePermission('ticket:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: {
      registration: {
        include: {
          event: true,
          user: { select: { id: true, name: true, email: true, studentId: true } },
        },
      },
      attendance: true,
    },
  });

  if (!ticket) {
    throw new AppError('NOT_FOUND', 'Ticket not found', 404);
  }

  // Check access
  if (req.user!.role === 'PARTICIPANT' && ticket.registration.userId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  // Generate QR code if not exists
  let qrCodeUrl = ticket.qrCodeUrl;
  if (!qrCodeUrl) {
    const qrData = JSON.stringify({
      token: ticket.token,
      eventId: ticket.registration.eventId,
      registrationId: ticket.registrationId,
    });
    qrCodeUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrCodeUrl },
    });
  }

  res.json({ success: true, data: { ticket: { ...ticket, qrCodeUrl } } });
}));

// GET /api/v1/tickets/registration/:registrationId - Get ticket by registration
router.get('/registration/:registrationId', requirePermission('ticket:read'), validateParams(z.object({ registrationId: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await prisma.ticket.findUnique({
    where: { registrationId: req.params.registrationId },
    include: {
      registration: {
        include: {
          event: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!ticket) {
    throw new AppError('NOT_FOUND', 'Ticket not found for this registration', 404);
  }

  if (req.user!.role === 'PARTICIPANT' && ticket.registration.userId !== req.user!.id) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  let qrCodeUrl = ticket.qrCodeUrl;
  if (!qrCodeUrl) {
    const qrData = JSON.stringify({ token: ticket.token, eventId: ticket.registration.eventId, registrationId: ticket.registrationId });
    qrCodeUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    await prisma.ticket.update({ where: { id: ticket.id }, data: { qrCodeUrl } });
  }

  res.json({ success: true, data: { ticket: { ...ticket, qrCodeUrl } } });
}));

export default router;