import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createTemplateSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  templateHtml: z.string(),
  templateCss: z.string().optional(),
  qrCodePosition: z.object({
    x: z.number(),
    y: z.number(),
    size: z.number(),
  }).optional(),
  isDefault: z.boolean().default(false),
});

const updateTemplateSchema = createTemplateSchema.partial();

const generateCertificateSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
});

router.get("/templates", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", eventId } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      const organizedEvents = await prisma.event.findMany({
        where: { organizerId: req.user.id },
        select: { id: true },
      });
      where.eventId = { in: organizedEvents.map(e => e.id) };
    }

    const [templates, total] = await Promise.all([
      prisma.certificateTemplate.findMany({
        where,
        include: { event: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.certificateTemplate.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: templates,
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

router.post("/templates", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createTemplateSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "Only the event organizer can create templates");
    }

    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { eventId: data.eventId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.certificateTemplate.create({ data });

    res.status(201).json({ success: true, data: { template } });
  } catch (error) {
    next(error);
  }
});

router.patch("/templates/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!template) throw new AppError(404, "TEMPLATE_NOT_FOUND", "Template not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && template.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to update this template");
    }

    const data = updateTemplateSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { eventId: template.eventId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.certificateTemplate.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: { template: updated } });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", status, eventId, userId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
    if (userId) where.userId = userId;
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      where.userId = req.user.id;
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true } },
          template: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.certificate.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: certificates,
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
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        event: { select: { id: true, title: true, startDate: true, endDate: true } },
        user: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, name: true, templateHtml: true, templateCss: true } },
      },
    });

    if (!certificate) throw new AppError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" &&
        certificate.userId !== req.user.id &&
        certificate.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view this certificate");
    }

    res.json({ success: true, data: { certificate } });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:certificateNumber", async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber: req.params.certificateNumber },
      include: {
        event: { select: { id: true, title: true, startDate: true, endDate: true } },
        user: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    if (!certificate) {
      return res.json({ success: true, data: { valid: false } });
    }

    res.json({
      success: true,
      data: {
        valid: certificate.status === "ISSUED" || certificate.status === "VERIFIED",
        certificate: {
          certificateNumber: certificate.certificateNumber,
          status: certificate.status,
          recipientName: certificate.user.name,
          eventTitle: certificate.event.title,
          eventDate: certificate.event.startDate,
          issuedAt: certificate.issuedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/generate", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = generateCertificateSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "Only the event organizer can generate certificates");
    }

    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: data.eventId, userId: data.userId } },
    });

    if (!registration || registration.status !== "ATTENDED") {
      throw new AppError(400, "NOT_ELIGIBLE", "User must have attended the event to receive a certificate");
    }

    const existing = await prisma.certificate.findUnique({
      where: { eventId_userId: { eventId: data.eventId, userId: data.userId } },
    });

    if (existing) throw new AppError(409, "CERTIFICATE_EXISTS", "Certificate already exists for this user");

    let template = data.templateId
      ? await prisma.certificateTemplate.findUnique({ where: { id: data.templateId } })
      : await prisma.certificateTemplate.findFirst({ where: { eventId: data.eventId, isDefault: true } });

    if (!template) {
      template = await prisma.certificateTemplate.findFirst({ where: { eventId: data.eventId } });
    }

    if (!template) throw new AppError(400, "NO_TEMPLATE", "No certificate template found for this event");

    const certificateNumber = `CERT-${event.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const certificate = await prisma.certificate.create({
      data: {
        eventId: data.eventId,
        userId: data.userId,
        templateId: template.id,
        certificateNumber,
        status: "GENERATED",
        issuedAt: new Date(),
      },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: { certificate } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/issue", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!certificate) throw new AppError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && certificate.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to issue this certificate");
    }

    if (certificate.status !== "GENERATED" && certificate.status !== "PENDING") {
      throw new AppError(400, "INVALID_STATUS", "Certificate cannot be issued");
    }

    const updated = await prisma.certificate.update({
      where: { id: req.params.id },
      data: { status: "ISSUED", issuedAt: new Date() },
    });

    res.json({ success: true, data: { certificate: updated } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/revoke", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!certificate) throw new AppError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && certificate.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to revoke this certificate");
    }

    if (certificate.status === "REVOKED") {
      throw new AppError(400, "ALREADY_REVOKED", "Certificate is already revoked");
    }

    const updated = await prisma.certificate.update({
      where: { id: req.params.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    res.json({ success: true, data: { certificate: updated } });
  } catch (error) {
    next(error);
  }
});

export default router;