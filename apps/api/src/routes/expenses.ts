import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createExpenseSchema = z.object({
  budgetId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("INR"),
  category: z.string().optional(),
  vendor: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial().extend({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID", "REIMBURSED"]).optional(),
  approvedById: z.string().uuid().optional(),
  paidAt: z.string().datetime().optional(),
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", status, budgetId, category } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (budgetId) where.budgetId = budgetId;
    if (category) where.category = category;
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM") {
      const organizedEvents = await prisma.event.findMany({
        where: { organizerId: req.user.id },
        select: { id: true },
      });
      const budgetIds = await prisma.budget.findMany({
        where: { eventId: { in: organizedEvents.map(e => e.id) } },
        select: { id: true },
      });
      where.budgetId = { in: budgetIds.map(b => b.id) };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          budget: { select: { id: true, name: true, event: { select: { id: true, title: true } } } },
          approvedBy: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: expenses,
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
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: {
        budget: { select: { id: true, name: true, event: { select: { id: true, title: true, organizerId: true } } } },
        approvedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!expense) throw new AppError(404, "EXPENSE_NOT_FOUND", "Expense not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM" &&
        expense.budget.event.organizerId !== req.user.id &&
        expense.createdById !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view this expense");
    }

    res.json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN", "FACULTY", "ORGANIZER", "FINANCE_TEAM"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createExpenseSchema.parse(req.body);

    const budget = await prisma.budget.findUnique({
      where: { id: data.budgetId },
      include: { event: true },
    });

    if (!budget) throw new AppError(404, "BUDGET_NOT_FOUND", "Budget not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM" && budget.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to add expenses to this budget");
    }

    const expense = await prisma.expense.create({
      data: {
        ...data,
        createdById: req.user.id,
      },
      include: {
        budget: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { budget: { include: { event: true } } },
    });

    if (!expense) throw new AppError(404, "EXPENSE_NOT_FOUND", "Expense not found");

    const canManage = req.user.role === "ADMIN" || req.user.role === "FACULTY" || req.user.role === "FINANCE_TEAM" ||
      expense.budget.event.organizerId === req.user.id;
    const canUpdate = canManage || expense.createdById === req.user.id;

    if (!canUpdate) throw new AppError(403, "FORBIDDEN", "You don't have permission to update this expense");

    const data = updateExpenseSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.status === "APPROVED" && !expense.approvedAt) {
      updateData.approvedById = req.user.id;
      updateData.approvedAt = new Date();
    }
    if (data.status === "PAID" && !expense.paidAt) {
      updateData.paidAt = new Date();
    }
    if (data.approvedAt) updateData.approvedAt = new Date(data.approvedAt);
    if (data.paidAt) updateData.paidAt = new Date(data.paidAt);

    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        budget: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: { expense: updated } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN", "FACULTY", "FINANCE_TEAM"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) throw new AppError(404, "EXPENSE_NOT_FOUND", "Expense not found");

    if (expense.status === "PAID" || expense.status === "REIMBURSED") {
      throw new AppError(400, "CANNOT_DELETE", "Cannot delete paid or reimbursed expenses");
    }

    await prisma.expense.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;