import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  specialRequests: z.string().optional(),
});

const bulkRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1).max(100),
});

const updateRegistrationSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "WAITLISTED", "ATTENDED", "NO_SHOW"]).optional(),
  checkedInAt: z.string().datetime().optional(),
});

const checkInSchema = z.object({
  ticketCode: z.string().min(1),
  eventId: z.string().uuid(),
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", status, eventId } = req.query;

    const where: any = {};
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      where.userId = req.user.id;
    }
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          event: {
            select: { id: true, title: true, startDate: true, endDate: true, venue: { select: { name: true } } },
          },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.registration.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: registrations,
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

router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: {
        event: { include: { venue: true, organizer: { select: { name: true, email: true } } } },
        user: { select: { id: true, name: true, email: true, department: true, phone: true } },
        checkedInByUser: { select: { id: true, name: true } },
      },
    });

    if (!registration) throw new AppError(404, "REGISTRATION_NOT_FOUND", "Registration not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" &&
        registration.userId !== req.user.id &&
        registration.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view this registration");
    }

    res.json({ success: true, data: { registration } });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createRegistrationSchema.parse(req.body);

    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      include: { _count: { select: { registrations: { where: { status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] } } } } } },
    });

    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (event.status !== "PUBLISHED" && event.status !== "APPROVED") {
      throw new AppError(400, "EVENT_NOT_OPEN", "Event is not open for registration");
    }

    const now = new Date();
    if (event.registrationStartDate && now < event.registrationStartDate) {
      throw new AppError(400, "REGISTRATION_NOT_STARTED", "Registration has not started yet");
    }
    if (event.registrationEndDate && now > event.registrationEndDate) {
      throw new AppError(400, "REGISTRATION_ENDED", "Registration has ended");
    }

    const existing = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: data.eventId, userId: req.user.id } },
    });

    if (existing) {
      throw new AppError(409, "ALREADY_REGISTERED", "You are already registered for this event");
    }

    let status = "CONFIRMED";
    let waitlistPosition: number | null = null;

    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      status = "WAITLISTED";
      const lastWaitlist = await prisma.registration.findFirst({
        where: { eventId: data.eventId, status: "WAITLISTED" },
        orderBy: { waitlistPosition: "desc" },
      });
      waitlistPosition = (lastWaitlist?.waitlistPosition || 0) + 1;
    }

    const ticketCode = `FST-${event.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const registration = await prisma.registration.create({
      data: {
        eventId: data.eventId,
        userId: req.user.id,
        status,
        ticketCode,
        waitlistPosition,
        specialRequests: data.specialRequests,
      },
      include: {
        event: { select: { id: true, title: true, startDate: true, venue: { select: { name: true } } } },
      },
    });

    res.status(201).json({ success: true, data: { registration } });
  } catch (error) {
    next(error);
  }
});

router.post("/bulk", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = bulkRegistrationSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (event.organizerId !== req.user.id && req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      throw new AppError(403, "FORBIDDEN", "Only the organizer can bulk register");
    }

    const results = await Promise.all(
      data.userIds.map(async (userId) => {
        const existing = await prisma.registration.findUnique({
          where: { eventId_userId: { eventId: data.eventId, userId } },
        });
        if (existing) return { userId, success: false, error: "Already registered" };

        const registration = await prisma.registration.create({
          data: {
            eventId: data.eventId,
            userId,
            status: "CONFIRMED",
            ticketCode: `FST-${event.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          },
        });
        return { userId, success: true, registration };
      })
    );

    res.json({ success: true, data: { results } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!registration) throw new AppError(404, "REGISTRATION_NOT_FOUND", "Registration not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && registration.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to update this registration");
    }

    const data = updateRegistrationSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.checkedInAt) updateData.checkedInAt = new Date(data.checkedInAt);
    if (data.status === "ATTENDED" && !registration.checkedInAt) {
      updateData.checkedInAt = new Date();
      updateData.checkedInBy = req.user.id;
    }

    const updated = await prisma.registration.update({
      where: { id: req.params.id },
      data: updateData,
      include: { event: { select: { title: true } }, user: { select: { name: true, email: true } } },
    });

    res.json({ success: true, data: { registration: updated } });
  } catch (error) {
    next(error);
  }
});

router.post("/check-in", requireRole("ADMIN", "FACULTY", "ORGANIZER", "VOLUNTEER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = checkInSchema.parse(req.body);

    const registration = await prisma.registration.findFirst({
      where: { ticketCode: data.ticketCode, eventId: data.eventId },
      include: { event: true, user: { select: { name: true, email: true } } },
    });

    if (!registration) throw new AppError(404, "TICKET_NOT_FOUND", "Invalid ticket code");

    if (registration.status === "ATTENDED") {
      throw new AppError(400, "ALREADY_CHECKED_IN", "This ticket has already been used");
    }

    if (registration.status === "CANCELLED") {
      throw new AppError(400, "TICKET_CANCELLED", "This ticket has been cancelled");
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: "ATTENDED",
        checkedInAt: new Date(),
        checkedInBy: req.user.id,
      },
    });

    res.json({
      success: true,
      data: {
        registration: updated,
        attendee: { name: registration.user.name, email: registration.user.email },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!registration) throw new AppError(404, "REGISTRATION_NOT_FOUND", "Registration not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" &&
        registration.userId !== req.user.id &&
        registration.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to cancel this registration");
    }

    if (registration.status === "ATTENDED") {
      throw new AppError(400, "CANNOT_CANCEL", "Cannot cancel an attended registration");
    }

    await prisma.registration.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    res.json({ success: true, message: "Registration cancelled" });
  } catch (error) {
    next(error);
  }
});

export default router;