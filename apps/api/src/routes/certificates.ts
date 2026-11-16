// FESTORA API - Certificate Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createCertificateSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { CertificateStatus } from '@festora/shared';
import { v4 as uuidv4 } from 'crypto';

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

// GET /api/v1/certificates - List certificates
router.get('/', requirePermission('certificate:read'), validateQuery(paginationSchema.extend({ eventId: uuidSchema.optional(), userId: uuidSchema.optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, eventId, userId } = req.query as any;

  const where: any = {};
  if (eventId) where.eventId = eventId;

  if (req.user!.role === 'PARTICIPANT') where.userId = req.user!.id;
  else if (userId) where.userId = userId;

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      include: { event: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } }, issuer: { select: { id: true, name: true } } },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.certificate.count({ where }),
  ]);

  res.json({ success: true, data: { items: certificates, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/v1/certificates/:id - Get certificate
router.get('/:id', requirePermission('certificate:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id: req.params.id },
    include: { event: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } }, issuer: { select: { id: true, name: true } } },
  });

  if (!certificate) throw new AppError('NOT_FOUND', 'Certificate not found', 404);

  if (req.user!.role === 'PARTICIPANT' && certificate.userId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

  res.json({ success: true, data: { certificate } });
}));

// POST /api/v1/certificates - Issue certificate
router.post('/', requirePermission('certificate:create'), validate(createCertificateSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, userId, type, title, description, templateId } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

  // Check if user attended or is eligible
  const registration = await prisma.registration.findUnique({ where: { eventId_userId: { eventId, userId } } });
  if (!registration || registration.status !== 'CONFIRMED') throw new AppError('INELIGIBLE', 'User not registered for this event', 400);

  // Check for existing certificate of same type
  const existing = await prisma.certificate.findUnique({ where: { eventId_userId_type: { eventId, userId, type } } });
  if (existing) throw new AppError('DUPLICATE_CERTIFICATE', 'Certificate already issued', 409);

  // Generate certificate number
  const certificateNumber = `CERT-${eventId.slice(0, 8).toUpperCase()}-${type}-${Date.now().toString(36).toUpperCase()}`;

  const certificate = await prisma.certificate.create({
    data: { eventId, userId, type, title, description, templateId, certificateNumber, issuedBy: req.user!.id, status: CertificateStatus.ISSUED },
    include: { event: { select: { id: true, title: true } }, user: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: { certificate }, message: 'Certificate issued' });
}));

// POST /api/v1/certificates/bulk - Bulk issue certificates
router.post('/bulk', requirePermission('certificate:create'), validate(z.object({ eventId: uuidSchema, type: z.string(), title: z.string(), description: z.string().optional(), userIds: z.array(uuidSchema).min(1) })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, type, title, description, userIds } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

  // Verify all users attended
  const registrations = await prisma.registration.findMany({ where: { eventId, userId: { in: userIds }, status: 'CONFIRMED' } });
  if (registrations.length !== userIds.length) throw new AppError('INELIGIBLE', 'Some users not registered or confirmed', 400);

  const certificates = await Promise.all(userIds.map(async (userId) => {
    const certificateNumber = `CERT-${eventId.slice(0, 8).toUpperCase()}-${type}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return prisma.certificate.create({ data: { eventId, userId, type, title, description, certificateNumber, issuedBy: req.user!.id, status: CertificateStatus.ISSUED } });
  }));

  res.status(201).json({ success: true, data: { certificates }, message: `${certificates.length} certificates issued` });
}));

// PUT /api/v1/certificates/:id/revoke - Revoke certificate
router.put('/:id/revoke', requirePermission('certificate:revoke'), validateParams(z.object({ id: uuidSchema })), validate(z.object({ reason: z.string().min(1) })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const certificate = await prisma.certificate.findUnique({ where: { id: req.params.id } });
  if (!certificate) throw new AppError('NOT_FOUND', 'Certificate not found', 404);

  if (certificate.status === CertificateStatus.REVOKED) throw new AppError('INVALID_STATE', 'Certificate already revoked', 400);

  const updated = await prisma.certificate.update({
    where: { id: req.params.id },
    data: { status: CertificateStatus.REVOKED, revokedAt: new Date(), revokedBy: req.user!.id, revocationReason: req.body.reason },
  });

  res.json({ success: true, data: { certificate: updated }, message: 'Certificate revoked' });
}));

export default router;