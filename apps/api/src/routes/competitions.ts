// FESTORA API - Competition Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createCompetitionSchema, createCompetitionEntrySchema, createCompetitionScoreSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { CompetitionStatus, CompetitionEntryStatus } from '@festora/shared';

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
// COMPETITIONS
// ============================================

router.get('/', validateQuery(paginationSchema.extend({ eventId: uuidSchema.optional(), status: z.nativeEnum(CompetitionStatus).optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, eventId, status } = req.query as any;

  const where: any = {};
  if (eventId) where.eventId = eventId;
  if (status) where.status = status;

  if (req.user!.role === 'PARTICIPANT') {
    where.status = { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED'] };
  }

  const [competitions, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      include: { event: { select: { id: true, title: true } }, _count: { select: { entries: true, scores: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.competition.count({ where }),
  ]);

  res.json({ success: true, data: { items: competitions, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.get('/:id', validateParams(z.object({ id: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const competition = await prisma.competition.findUnique({
    where: { id: req.params.id },
    include: { event: { select: { id: true, title: true } } },
  });

  if (!competition) throw new AppError('NOT_FOUND', 'Competition not found', 404);
  res.json({ success: true, data: { competition } });
}));

router.post('/', requirePermission('competition:create'), validate(createCompetitionSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, ...data } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);
  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

  const competition = await prisma.competition.create({ data: { ...data, eventId } });
  res.status(201).json({ success: true, data: { competition }, message: 'Competition created' });
}));

// ============================================
// ENTRIES
// ============================================

router.get('/:competitionId/entries', requirePermission('competition-entry:read'), validateParams(z.object({ competitionId: uuidSchema })), validateQuery(paginationSchema.extend({ status: z.nativeEnum(CompetitionEntryStatus).optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { competitionId } = req.params;
  const { page = 1, limit = 20, status } = req.query as any;

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new AppError('NOT_FOUND', 'Competition not found', 404);

  const where: any = { competitionId };
  if (status) where.status = status;

  if (req.user!.role === 'PARTICIPANT') where.leaderId = req.user!.id;

  const [entries, total] = await Promise.all([
    prisma.competitionEntry.findMany({
      where,
      include: { leader: { select: { id: true, name: true, email: true } }, scores: { include: { judge: { select: { id: true, name: true } } } } },
      orderBy: { registeredAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.competitionEntry.count({ where }),
  ]);

  res.json({ success: true, data: { items: entries, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

router.post('/:competitionId/entries', requirePermission('competition-entry:create'), validateParams(z.object({ competitionId: uuidSchema })), validate(createCompetitionEntrySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { competitionId } = req.params;
  const { teamName, memberIds } = req.body;

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new AppError('NOT_FOUND', 'Competition not found', 404);

  if (competition.status !== CompetitionStatus.REGISTRATION_OPEN) throw new AppError('INVALID_STATE', 'Registration is not open', 400);

  const now = new Date();
  if (competition.registrationStartDate && now < competition.registrationStartDate) throw new AppError('INVALID_STATE', 'Registration has not started', 400);
  if (competition.registrationEndDate && now > competition.registrationEndDate) throw new AppError('INVALID_STATE', 'Registration has ended', 400);

  // Check team size
  const totalMembers = 1 + (memberIds?.length || 0);
  if (totalMembers < competition.minTeamSize || totalMembers > competition.maxTeamSize) throw new AppError('VALIDATION_ERROR', `Team size must be between ${competition.minTeamSize} and ${competition.maxTeamSize}`, 400);

  // Check for duplicate registration
  const existing = await prisma.competitionEntry.findFirst({ where: { competitionId, leaderId: req.user!.id } });
  if (existing) throw new AppError('DUPLICATE_ENTRY', 'Already registered for this competition', 409);

  const entry = await prisma.competitionEntry.create({ data: { competitionId, teamName, leaderId: req.user!.id, memberIds: memberIds || [], status: CompetitionEntryStatus.PENDING } });
  res.status(201).json({ success: true, data: { entry }, message: 'Entry submitted' });
}));

// ============================================
// SCORES
// ============================================

router.post('/:competitionId/scores', requirePermission('competition-score:create'), validateParams(z.object({ competitionId: uuidSchema })), validate(createCompetitionScoreSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { competitionId } = req.params;
  const { entryId, criteriaScores, notes } = req.body;

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new AppError('NOT_FOUND', 'Competition not found', 404);

  const entry = await prisma.competitionEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.competitionId !== competitionId) throw new AppError('NOT_FOUND', 'Entry not found', 404);

  // Calculate total score
  const totalScore = Object.values(criteriaScores).reduce((sum: number, v: any) => sum + Number(v), 0);

  const score = await prisma.competitionScore.upsert({
    where: { competitionId_entryId_judgeId: { competitionId, entryId, judgeId: req.user!.id } },
    update: { criteriaScores, totalScore, notes },
    create: { competitionId, entryId, judgeId: req.user!.id, criteriaScores, totalScore, notes },
  });

  res.json({ success: true, data: { score }, message: 'Score submitted' });
}));

// ============================================
// LEADERBOARD
// ============================================

router.get('/:competitionId/leaderboard', validateParams(z.object({ competitionId: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { competitionId } = req.params;

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new AppError('NOT_FOUND', 'Competition not found', 404);

  const entries = await prisma.competitionEntry.findMany({
    where: { competitionId, status: { in: [CompetitionEntryStatus.APPROVED, CompetitionEntryStatus.PENDING] } },
    include: { leader: { select: { id: true, name: true } }, scores: true },
  });

  // Calculate best score per entry
  const leaderboard = entries.map(entry => {
    const bestScore = entry.scores.reduce((best, s) => s.totalScore > best ? s.totalScore : best, 0);
    return { entryId: entry.id, teamName: entry.teamName, leader: entry.leader, bestScore, scoreCount: entry.scores.length };
  }).sort((a, b) => b.bestScore - a.bestScore);

  res.json({ success: true, data: { competitionId, leaderboard } });
}));

export default router;