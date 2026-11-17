import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createVenueSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  capacity: z.number().int().positive(),
  location: z.string().optional(),
  amenities: z.array(z.string()).default([]),
});

const updateVenueSchema = createVenueSchema.partial();

router.get("/", async (req, res, next) => {
  try {
    const { page = "1", limit = "20", isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === "true";

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        include: { _count: { select: { events: true } } },
        orderBy: { name: "asc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.venue.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: venues,
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

router.get("/:id", async (req, res, next) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: req.params.id },
      include: {
        events: {
          select: { id: true, title: true, status: true, startDate: true, endDate: true },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!venue) throw new AppError(404, "VENUE_NOT_FOUND", "Venue not found");

    res.json({ success: true, data: { venue } });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createVenueSchema.parse(req.body);

    const venue = await prisma.venue.create({ data });

    res.status(201).json({ success: true, data: { venue } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
    if (!venue) throw new AppError(404, "VENUE_NOT_FOUND", "Venue not found");

    const data = updateVenueSchema.parse(req.body);

    const updated = await prisma.venue.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: { venue: updated } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
    if (!venue) throw new AppError(404, "VENUE_NOT_FOUND", "Venue not found");

    const eventCount = await prisma.event.count({ where: { venueId: req.params.id } });
    if (eventCount > 0) {
      throw new AppError(400, "VENUE_IN_USE", "Cannot delete venue with associated events");
    }

    await prisma.venue.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Venue deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;