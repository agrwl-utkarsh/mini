import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createSponsorSchema = z.object({
  name: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  tier: z.string().optional(),
});

const updateSponsorSchema = createSponsorSchema.partial();

const createSponsorshipSchema = z.object({
  eventId: z.string().uuid(),
  sponsorId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default("INR"),
  benefits: z.array(z.string()).default([]),
  contractUrl: z.string().url().optional(),
});

const updateSponsorshipSchema = createSponsorshipSchema.partial().extend({
  status: z.enum(["PROSPECT", "NEGOTIATING", "COMMITTED", "RECEIVED", "COMPLETED"]).optional(),
  committedAt: z.string().datetime().optional(),
  receivedAt: z.string().datetime().optional(),
});

router.get("/sponsors", async (req, res, next) => {
  try {
    const { page = "1", limit = "20", isActive, tier } = req.query;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (tier) where.tier = tier;

    const [sponsors, total] = await Promise.all([
      prisma.sponsor.findMany({
        where,
        include: {
          sponsorships: {
            include: { event: { select: { id: true, title: true } } },
          },
        },
        orderBy: { name: "asc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.sponsor.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: sponsors,
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

router.get("/sponsors/:id", async (req, res, next) => {
  try {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: req.params.id },
      include: {
        sponsorships: {
          include: { event: { select: { id: true, title: true, status: true, startDate: true } } },
        },
      },
    });

    if (!sponsor) throw new AppError(404, "SPONSOR_NOT_FOUND", "Sponsor not found");

    res.json({ success: true, data: { sponsor } });
  } catch (error) {
    next(error);
  }
});

router.post("/sponsors", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createSponsorSchema.parse(req.body);

    const sponsor = await prisma.sponsor.create({ data });

    res.status(201).json({ success: true, data: { sponsor } });
  } catch (error) {
    next(error);
  }
});

router.patch("/sponsors/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const sponsor = await prisma.sponsor.findUnique({ where: { id: req.params.id } });
    if (!sponsor) throw new AppError(404, "SPONSOR_NOT_FOUND", "Sponsor not found");

    const data = updateSponsorSchema.parse(req.body);

    const updated = await prisma.sponsor.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: { sponsor: updated } });
  } catch (error) {
    next(error);
  }
});

router.get("/sponsorships", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", status, eventId, sponsorId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
    if (sponsorId) where.sponsorId = sponsorId;

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      const organizedEvents = await prisma.event.findMany({
        where: { organizerId: req.user.id },
        select: { id: true },
      });
      where.eventId = { in: organizedEvents.map(e => e.id) };
    }

    const [sponsorships, total] = await Promise.all([
      prisma.sponsorship.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          sponsor: { select: { id: true, name: true, logoUrl: true, tier: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.sponsorship.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: sponsorships,
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

router.post("/sponsorships", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createSponsorshipSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "Only the event organizer can create sponsorships");
    }

    const sponsor = await prisma.sponsor.findUnique({ where: { id: data.sponsorId } });
    if (!sponsor) throw new AppError(404, "SPONSOR_NOT_FOUND", "Sponsor not found");

    const sponsorship = await prisma.sponsorship.create({ data });

    res.status(201).json({ success: true, data: { sponsorship } });
  } catch (error) {
    next(error);
  }
});

router.patch("/sponsorships/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const sponsorship = await prisma.sponsorship.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!sponsorship) throw new AppError(404, "SPONSORSHIP_NOT_FOUND", "Sponsorship not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && sponsorship.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to update this sponsorship");
    }

    const data = updateSponsorshipSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.committedAt) updateData.committedAt = new Date(data.committedAt);
    if (data.receivedAt) updateData.receivedAt = new Date(data.receivedAt);

    const updated = await prisma.sponsorship.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        event: { select: { id: true, title: true } },
        sponsor: { select: { id: true, name: true, tier: true } },
      },
    });

    res.json({ success: true, data: { sponsorship: updated } });
  } catch (error) {
    next(error);
  }
});

export default router;