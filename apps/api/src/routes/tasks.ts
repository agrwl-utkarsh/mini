import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createTaskSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", status, priority, eventId, assigneeId } = req.query;

    const where: any = {};
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY") {
      where.OR = [{ assigneeId: req.user.id }, { reporterId: req.user.id }];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (eventId) where.eventId = eventId;
    if (assigneeId) where.assigneeId = assigneeId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: tasks,
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
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        event: { select: { id: true, title: true, organizerId: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" &&
        task.assigneeId !== req.user.id && task.reporterId !== req.user.id &&
        task.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view this task");
    }

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "Only the event organizer can create tasks");
    }

    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!assignee) throw new AppError(404, "ASSIGNEE_NOT_FOUND", "Assignee not found");
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        reporterId: req.user.id,
      },
      include: {
        event: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task not found");

    const canManage = req.user.role === "ADMIN" || req.user.role === "FACULTY" ||
      task.event.organizerId === req.user.id || task.reporterId === req.user.id;
    const canUpdate = canManage || task.assigneeId === req.user.id;

    if (!canUpdate) throw new AppError(403, "FORBIDDEN", "You don't have permission to update this task");

    const data = updateTaskSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status === "DONE" && !task.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        event: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: { task: updated } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!task) throw new AppError(404, "TASK_NOT_FOUND", "Task not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && task.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "Only the event organizer can delete tasks");
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;