// FESTORA API - Feedback Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { createFeedbackQuestionSchema, createFeedbackResponseSchema, paginationSchema, uuidSchema } from '@festora/shared';
import { z } from 'zod';
import { FeedbackType, EventStatus } from '@festora/shared';

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

// GET /api/v1/feedback/questions - List feedback questions
router.get('/questions', requirePermission('feedback-question:read'), validateQuery(paginationSchema.extend({ eventId: uuidSchema.optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, eventId } = req.query as any;

  const where: any = {};
  if (eventId) where.eventId = eventId;

  const [questions, total] = await Promise.all([
    prisma.feedbackQuestion.findMany({ where, include: { _count: { select: { responses: true } } }, orderBy: { order: 'asc' }, skip: (page - 1) * limit, take: limit }),
    prisma.feedbackQuestion.count({ where }),
  ]);

  res.json({ success: true, data: { items: questions, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// POST /api/v1/feedback/questions - Create feedback question
router.post('/questions', requirePermission('feedback-question:create'), validate(createFeedbackQuestionSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, ...data } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);
  if (req.user!.role === 'ORGANIZER' && event.organizerId !== req.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

  const question = await prisma.feedbackQuestion.create({ data: { ...data, eventId } });
  res.status(201).json({ success: true, data: { question }, message: 'Question created' });
}));

// GET /api/v1/feedback/responses - List feedback responses
router.get('/responses', requirePermission('feedback:read'), validateQuery(paginationSchema.extend({ eventId: uuidSchema.optional(), userId: uuidSchema.optional(), questionId: uuidSchema.optional() })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20, eventId, userId, questionId } = req.query as any;

  const where: any = {};
  if (eventId) where.eventId = eventId;
  if (questionId) where.questionId = questionId;

  if (req.user!.role === 'PARTICIPANT') where.userId = req.user!.id;
  else if (userId) where.userId = userId;

  const [responses, total] = await Promise.all([
    prisma.feedbackResponse.findMany({ where, include: { event: { select: { id: true, title: true } }, user: { select: { id: true, name: true } }, question: { select: { id: true, question: true, type: true } } }, orderBy: { submittedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.feedbackResponse.count({ where }),
  ]);

  res.json({ success: true, data: { items: responses, total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

// POST /api/v1/feedback/responses - Submit feedback
router.post('/responses', requirePermission('feedback:create'), validate(createFeedbackResponseSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, answers } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  // Check if event is completed
  if (event.status !== EventStatus.COMPLETED) throw new AppError('INVALID_STATE', 'Feedback only available for completed events', 400);

  // Check if user attended
  const registration = await prisma.registration.findFirst({ where: { eventId, userId: req.user!.id, status: 'CONFIRMED', attendedAt: { not: null } } });
  if (!registration) throw new AppError('INELIGIBLE', 'Only attendees can submit feedback', 403);

  // Get questions for validation
  const questions = await prisma.feedbackQuestion.findMany({ where: { eventId } });
  const requiredQuestions = questions.filter(q => q.isRequired);

  // Validate required answers
  for (const q of requiredQuestions) {
    if (!(q.id in answers)) throw new AppError('VALIDATION_ERROR', `Required question "${q.question}" not answered`, 400);
  }

  // Create responses
  const responses = await Promise.all(Object.entries(answers).map(async ([questionId, answer]) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return null;

    return prisma.feedbackResponse.upsert({
      where: { eventId_userId_questionId: { eventId, userId: req.user!.id, questionId } },
      update: { answer, submittedAt: new Date() },
      create: { eventId, userId: req.user!.id, questionId, answer, registrationId: registration?.id },
    });
  }));

  res.status(201).json({ success: true, data: { responses: responses.filter(Boolean) }, message: 'Feedback submitted' });
}));

// GET /api/v1/feedback/summary/:eventId - Get feedback summary
router.get('/summary/:eventId', requirePermission('feedback:read'), validateParams(z.object({ eventId: uuidSchema })), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.params;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);

  const questions = await prisma.feedbackQuestion.findMany({ where: { eventId } });
  const responses = await prisma.feedbackResponse.findMany({ where: { eventId }, include: { question: true } });

  const summary = questions.map(q => {
    const qResponses = responses.filter(r => r.questionId === q.id);
    const count = qResponses.length;

    let analysis: any = { count };
    if (q.type === FeedbackType.RATING) {
      const ratings = qResponses.map(r => r.answer?.rating).filter(Boolean) as number[];
      if (ratings.length > 0) {
        analysis.average = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        analysis.distribution = ratings.reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {} as Record<number, number>);
      }
    } else if (q.type === FeedbackType.MULTIPLE_CHOICE) {
      analysis.distribution = qResponses.reduce((acc, r) => { const choice = r.answer?.choice; if (choice) acc[choice] = (acc[choice] || 0) + 1; return acc; }, {} as Record<string, number>);
    }

    return { questionId: q.id, question: q.question, type: q.type, ...analysis };
  });

  res.json({ success: true, data: { eventId, totalResponses: new Set(responses.map(r => r.userId)).size, summary } });
}));

export default router;