import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createFeedbackSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(["GENERAL", "SPEAKER", "VENUE", "CONTENT", "ORGANIZATION"]).default("GENERAL"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

const updateFeedbackSchema = createFeedbackSchema.partial();

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", eventId, type, userId } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      const organizedEvents = await prisma.event.findMany({
        where: { organizerId: req.user.id },
        select: { id: true },
      });
      where.eventId = { in: organizedEvents.map(e => e.id) };
    }

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: feedback,
        meta: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/event/:eventId/stats", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true },
    });

    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view feedback stats");
    }

    const stats = await prisma.feedback.groupBy({
      by: ["type"],
      where: { eventId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const overall = await prisma.feedback.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingDistribution = await prisma.feedback.groupBy({
      by: ["rating"],
      where: { eventId },
      _count: { rating: true },
    });

    res.json({
      success: true,
      data: {
        overall: {
          averageRating: overall._avg.rating ? Math.round(overall._avg.rating * 10) / 10 : 0,
          totalResponses: overall._count.rating,
        },
        byType: stats.map(s => ({
          type: s.type,
          averageRating: s._avg.rating ? Math.round(s._avg.rating * 10) / 10 : 0,
          count: s._count.rating,
        })),
        distribution: ratingDistribution.map(d => ({
          rating: d.rating,
          count: d._count.rating,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createFeedbackSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: data.eventId, userId: req.user.id } },
    });

    if (!registration || registration.status !== "ATTENDED") {
      throw new AppError(403, "NOT_ELIGIBLE", "Only attendees can submit feedback");
    }

    const existing = await prisma.feedback.findUnique({
      where: { eventId_userId: { eventId: data.eventId, userId: req.user.id } },
    });

    if (existing) throw new AppError(409, "FEEDBACK_EXISTS", "You have already submitted feedback for this event");

    const feedback = await prisma.feedback.create({
      data: {
        ...data,
        userId: req.user.id,
      },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id } });
    if (!feedback) throw new AppError(404, "FEEDBACK_NOT_FOUND", "Feedback not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && feedback.userId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You can only update your own feedback");
    }

    const data = updateFeedbackSchema.parse(req.body);

    const updated = await prisma.feedback.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: { feedback: updated } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id } });
    if (!feedback) throw new AppError(404, "FEEDBACK_NOT_FOUND", "Feedback not found");

    await prisma.feedback.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Feedback deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;