import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationStartDate: z.string().datetime().optional(),
  registrationEndDate: z.string().datetime().optional(),
  maxAttendees: z.number().int().positive().optional(),
  venueId: z.string().uuid().optional(),
  requiresApproval: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

const updateEventSchema = createEventSchema.partial();

const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  organizerId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

function canManageEvent(user: AuthenticatedRequest["user"], event: any): boolean {
  if (user.role === "ADMIN" || user.role === "FACULTY") return true;
  if (event.organizerId === user.id) return true;
  return false;
}

function canViewEvent(user: AuthenticatedRequest["user"], event: any): boolean {
  if (event.isPublic) return true;
  if (user.role === "ADMIN" || user.role === "FACULTY") return true;
  if (event.organizerId === user.id) return true;
  return false;
}

router.get("/", async (req, res, next) => {
  try {
    const query = eventQuerySchema.parse(req.query);
    const { page, limit, status, organizerId, venueId, tag, search, startDate, endDate, sortBy, sortOrder } = query;

    const where: any = {};

    if (status) where.status = status;
    if (organizerId) where.organizerId = organizerId;
    if (venueId) where.venueId = venueId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          venue: { select: { id: true, name: true, capacity: true } },
          organizer: { select: { id: true, name: true, email: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: events,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, email: true, department: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        registrations: {
          where: { status: { in: ["CONFIRMED", "ATTENDED"] } },
          select: { id: true },
        },
        tasks: { select: { id: true, status: true } },
        budgets: { select: { id: true, allocatedAmount: true, spentAmount: true } },
        sponsors: { include: { sponsor: true } },
        feedback: { select: { rating: true } },
        certificates: { select: { id: true, status: true } },
      },
    });

    if (!event) {
      throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");
    }

    const authReq = req as AuthenticatedRequest;
    if (authReq.user && !canViewEvent(authReq.user, event)) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view this event");
    }

    const registrationCount = event.registrations.length;
    const taskStats = event.tasks.reduce((acc: any, t: any) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    const totalBudget = event.budgets.reduce((sum: number, b: any) => sum + b.allocatedAmount, 0);
    const totalSpent = event.budgets.reduce((sum: number, b: any) => sum + b.spentAmount, 0);
    const avgRating = event.feedback.length > 0
      ? event.feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / event.feedback.length
      : 0;

    res.json({
      success: true,
      data: {
        ...event,
        registrationCount,
        taskStats,
        totalBudget,
        totalSpent,
        avgRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createEventSchema.parse(req.body);

    if (data.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
      if (!venue || !venue.isActive) {
        throw new AppError(400, "INVALID_VENUE", "Venue not found or inactive");
      }
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationStartDate: data.registrationStartDate ? new Date(data.registrationStartDate) : null,
        registrationEndDate: data.registrationEndDate ? new Date(data.registrationEndDate) : null,
        organizerId: req.user.id,
        status: data.requiresApproval ? "PENDING_APPROVAL" : "DRAFT",
      },
      include: {
        venue: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "CREATE",
        entity: "Event",
        entityId: event.id,
        newData: event,
      },
    });

    res.status(201).json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (!canManageEvent(req.user, event)) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to update this event");
    }

    const data = updateEventSchema.parse(req.body);

    if (data.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
      if (!venue || !venue.isActive) {
        throw new AppError(400, "INVALID_VENUE", "Venue not found or inactive");
      }
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.registrationStartDate) updateData.registrationStartDate = new Date(data.registrationStartDate);
    if (data.registrationEndDate) updateData.registrationEndDate = new Date(data.registrationEndDate);

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        venue: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "UPDATE",
        entity: "Event",
        entityId: event.id,
        oldData: event,
        newData: updatedEvent,
      },
    });

    res.json({ success: true, data: { event: updatedEvent } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/submit-for-approval", requireRole("ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "Only the organizer can submit for approval");
    }

    if (event.status !== "DRAFT") {
      throw new AppError(400, "INVALID_STATUS", "Only draft events can be submitted for approval");
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: { status: "PENDING_APPROVAL" },
    });

    res.json({ success: true, data: { event: updatedEvent } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/approve", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (event.status !== "PENDING_APPROVAL") {
      throw new AppError(400, "INVALID_STATUS", "Event is not pending approval");
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        status: "APPROVED",
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
    });

    res.json({ success: true, data: { event: updatedEvent } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reject", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (event.status !== "PENDING_APPROVAL") {
      throw new AppError(400, "INVALID_STATUS", "Event is not pending approval");
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        status: "REJECTED",
        approvedById: req.user.id,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });

    res.json({ success: true, data: { event: updatedEvent } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/publish", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (!canManageEvent(req.user, event)) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to publish this event");
    }

    if (event.status !== "APPROVED" && req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      throw new AppError(400, "INVALID_STATUS", "Only approved events can be published");
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: { status: "PUBLISHED" },
    });

    res.json({ success: true, data: { event: updatedEvent } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (!canManageEvent(req.user, event)) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to delete this event");
    }

    await prisma.event.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;