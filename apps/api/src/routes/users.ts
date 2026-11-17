import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";
import env from "../config/env";

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "FACULTY", "ORGANIZER", "VOLUNTEER", "PARTICIPANT", "SPONSOR", "FINANCE_TEAM"]).optional(),
  department: z.string().optional(),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

router.get("/", requireRole("ADMIN", "FACULTY"), async (req, res, next) => {
  try {
    const { page = "1", limit = "20", role, isActive, search } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { department: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          studentId: true,
          employeeId: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: users,
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

router.get("/:id", requireRole("ADMIN", "FACULTY"), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        studentId: true,
        employeeId: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            organizedEvents: true,
            registrations: true,
            assignedTasks: true,
            feedback: true,
            certificates: true,
          },
        },
      },
    });

    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

    if (req.user.id === req.params.id && req.user.role !== "ADMIN") {
      throw new AppError(403, "FORBIDDEN", "You cannot modify your own role or status");
    }

    const data = updateUserSchema.parse(req.body);

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError(409, "EMAIL_EXISTS", "Email already in use");
    }

    if (data.studentId && data.studentId !== user.studentId) {
      const existing = await prisma.user.findUnique({ where: { studentId: data.studentId } });
      if (existing) throw new AppError(409, "STUDENT_ID_EXISTS", "Student ID already in use");
    }

    if (data.employeeId && data.employeeId !== user.employeeId) {
      const existing = await prisma.user.findUnique({ where: { employeeId: data.employeeId } });
      if (existing) throw new AppError(409, "EMPLOYEE_ID_EXISTS", "Employee ID already in use");
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        studentId: true,
        employeeId: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { user: updated } });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/change-password", requireRole("ADMIN", "FACULTY"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) throw new AppError(401, "INVALID_PASSWORD", "Current password is incorrect");

    const passwordHash = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN"), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      throw new AppError(400, "CANNOT_DELETE_SELF", "You cannot delete your own account");
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

    await prisma.user.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/stats/overview", requireRole("ADMIN", "FACULTY"), async (_req, res, next) => {
  try {
    const [totalUsers, byRole, activeUsers, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        recentUsers,
        byRole: byRole.map(r => ({ role: r.role, count: r._count.role })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;