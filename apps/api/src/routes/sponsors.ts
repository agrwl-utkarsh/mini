// FESTORA API - Sponsor Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createSponsorSchema, createSponsorshipSchema, createSponsorContributionSchema, createSponsorBenefitSchema, createBudgetAllocationSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { SponsorshipStatus, BenefitStatus } from '@festora/shared';

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

// ============================================
// SPONSORS
// ============================================

router.get('/sponsors', requirePermission('sponsor:read'), validateQuery(paginationSchema.extend({ search: z.string().optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, search } = req.query as any;

  const where: any = {};
  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { contactEmail: { contains: search, mode: 'insensitive' } }];
  }

  // Sponsors can only see their own profile
  if (req.user!.role === 'SPONSOR') {
    where.contactEmail = req.user!.email;
  }

  const [sponsors, total] = await Promise.all([
    prisma.sponsor.findMany({
      where,
      include: { _count: { select: { sponsorships: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sponsor.count({ where }),
  ]);

  res.json({ success: true, data: { items: sponsors, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.get('/sponsors/:id', requirePermission('sponsor:read'), validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: req.params.id },
    include: {
      sponsorships: {
        include: { event: { select: { id: true, title: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!sponsor) throw new AppError('NOT_FOUND', 'Sponsor not found', 404);

  // Sponsors can only view their own
  if (req.user!.role === 'SPONSOR' && sponsor.contactEmail !== req.user!.email) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  res.json({ success: true, data: { sponsor } });
}));

router.post('/sponsors', requirePermission('sponsor:create'), validate(createSponsorSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sponsor = await prisma.sponsor.create({ data: req.body });
  res.status(201).json({ success: true, data: { sponsor }, message: 'Sponsor created' });
}));

// ============================================
// SPONSORSHIPS
// ============================================

router.get('/sponsorships', requirePermission('sponsorship:read'), validateQuery(paginationSchema.extend({ eventId: uuidSchema.optional(), sponsorId: uuidSchema.optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, eventId, sponsorId } = req.query as any;

  const where: any = {};
  if (eventId) where.eventId = eventId;
  if (sponsorId) where.sponsorId = sponsorId;

  if (req.user!.role === 'SPONSOR') {
    where.sponsor = { contactEmail: req.user!.email };
  } else if (req.user!.role === 'ORGANIZER') {
    const events = await prisma.event.findMany({ where: { organizerId: req.user!.id }, select: { id: true } });
    where.eventId = { in: events.map(e => e.id) };
  }

  const [sponsorships, total] = await Promise.all([
    prisma.sponsorship.findMany({
      where,
      include: { sponsor: { select: { id: true, name: true, logoUrl: true } }, event: { select: { id: true, title: true } }, _count: { select: { benefits: true, contributions: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sponsorship.count({ where }),
  ]);

  // Add financial summary
  const sponsorshipsWithSummary = await Promise.all(sponsorships.map(async (s) => {
    const contributions = await prisma.sponsorContribution.aggregate({ where: { sponsorshipId: s.id }, _sum: { amount: true } });
    const allocations = await prisma.budgetAllocation.aggregate({ where: { sponsorshipId: s.id }, _sum: { allocatedAmount: true, spentAmount: true } });
    return {
      ...s,
      totalReceived: contributions._sum.amount || 0,
      totalAllocated: allocations._sum.allocatedAmount || 0,
      totalSpent: allocations._sum.spentAmount || 0,
      remainingAllocated: Number(allocations._sum.allocatedAmount || 0) - Number(allocations._sum.spentAmount || 0),
      notAllocated: Number(s.promisedAmount) - Number(allocations._sum.allocatedAmount || 0),
    };
  }));

  res.json({ success: true, data: { items: sponsorshipsWithSummary, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.post('/sponsorships', requirePermission('sponsorship:create'), validate(createSponsorshipSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, sponsorId, ...data } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

  const sponsorship = await prisma.sponsorship.create({ data: { ...data, eventId, sponsorId }, include: { sponsor: true, event: { select: { id: true, title: true } } } });
  res.status(201).json({ success: true, data: { sponsorship }, message: 'Sponsorship created' });
}));

// ============================================
// CONTRIBUTIONS
// ============================================

router.post('/contributions', requirePermission('contribution:create'), validate(createSponsorContributionSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { sponsorshipId, ...data } = req.body;

  const sponsorship = await prisma.sponsorship.findUnique({ where: { id: sponsorshipId } });
  if (!sponsorship) throw new AppError('NOT_FOUND', 'Sponsorship not found', 404);

  const contribution = await prisma.sponsorContribution.create({ data: { ...data, sponsorshipId, recordedBy: req.user!.id } });

  // Update sponsorship received amount
  await prisma.sponsorship.update({
    where: { id: sponsorshipId },
    data: { receivedAmount: { increment: data.amount } },
  });

  res.status(201).json({ success: true, data: { contribution }, message: 'Contribution recorded' });
}));

// ============================================
// BENEFITS
// ============================================

router.get('/benefits', requirePermission('benefit:read'), validateQuery(paginationSchema.extend({ sponsorshipId: uuidSchema.optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, sponsorshipId } = req.query as any;

  const where: any = {};
  if (sponsorshipId) where.sponsorshipId = sponsorshipId;

  if (req.user!.role === 'SPONSOR') {
    const sponsorships = await prisma.sponsorship.findMany({ where: { sponsor: { contactEmail: req.user!.email } }, select: { id: true } });
    where.sponsorshipId = { in: sponsorships.map(s => s.id) };
  }

  const [benefits, total] = await Promise.all([
    prisma.sponsorBenefit.findMany({ where, include: { sponsorship: { include: { sponsor: { select: { id: true, name: true } }, event: { select: { id: true, title: true } } } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.sponsorBenefit.count({ where }),
  ]);

  res.json({ success: true, data: { items: benefits, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.post('/benefits', requirePermission('benefit:create'), validate(createSponsorBenefitSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const benefit = await prisma.sponsorBenefit.create({ data: req.body, include: { sponsorship: { include: { sponsor: true } } } });
  res.status(201).json({ success: true, data: { benefit }, message: 'Benefit created' });
}));

router.put('/benefits/:id', requirePermission('benefit:update'), validateParams(z.object({ id: uuidSchema })), validate(z.object({ status: z.nativeEnum(BenefitStatus), fulfillmentNotes: z.string().optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, fulfillmentNotes } = req.body;

  const data: any = { status };
  if (fulfillmentNotes) data.fulfillmentNotes = fulfillmentNotes;
  if (status === BenefitStatus.FULFILLED) data.fulfilledAt = new Date();

  const benefit = await prisma.sponsorBenefit.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: { benefit }, message: 'Benefit updated' });
}));

// ============================================
// ALLOCATIONS
// ============================================

router.post('/allocations', requirePermission('allocation:create'), validate(createBudgetAllocationSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { sponsorshipId, expenseCategoryId, allocatedAmount } = req.body;

  const sponsorship = await prisma.sponsorship.findUnique({ where: { id: sponsorshipId } });
  if (!sponsorship) throw new AppError('NOT_FOUND', 'Sponsorship not found', 404);

  const allocation = await prisma.budgetAllocation.create({ data: { sponsorshipId, expenseCategoryId, allocatedAmount } });
  res.status(201).json({ success: true, data: { allocation }, message: 'Allocation created' });
}));

export default router;