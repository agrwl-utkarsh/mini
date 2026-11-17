import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

const createBudgetSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(100),
  allocatedAmount: z.number().nonnegative(),
  currency: z.string().length(3).default("INR"),
});

const updateBudgetSchema = createBudgetSchema.partial();

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = "1", limit = "20", eventId } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM") {
      const organizedEvents = await prisma.event.findMany({
        where: { organizerId: req.user.id },
        select: { id: true },
      });
      where.eventId = { in: organizedEvents.map(e => e.id) };
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          expenses: { select: { id: true, amount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.budget.count({ where }),
    ]);

    const budgetsWithStats = budgets.map(b => ({
      ...b,
      totalExpenses: b.expenses.reduce((sum, e) => sum + e.amount, 0),
      pendingExpenses: b.expenses.filter(e => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0),
      approvedExpenses: b.expenses.filter(e => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0),
    }));

    res.json({
      success: true,
      data: {
        items: budgetsWithStats,
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
    const budget = await prisma.budget.findUnique({
      where: { id: req.params.id },
      include: {
        event: { select: { id: true, title: true, organizerId: true } },
        expenses: {
          include: {
            approvedBy: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!budget) throw new AppError(404, "BUDGET_NOT_FOUND", "Budget not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM" &&
        budget.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to view this budget");
    }

    res.json({ success: true, data: { budget } });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN", "FACULTY", "ORGANIZER", "FINANCE_TEAM"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createBudgetSchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM" && event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to create budgets for this event");
    }

    const budget = await prisma.budget.create({ data });

    res.status(201).json({ success: true, data: { budget } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireRole("ADMIN", "FACULTY", "ORGANIZER", "FINANCE_TEAM"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!budget) throw new AppError(404, "BUDGET_NOT_FOUND", "Budget not found");

    if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY" && req.user.role !== "FINANCE_TEAM" && budget.event.organizerId !== req.user.id) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to update this budget");
    }

    const data = updateBudgetSchema.parse(req.body);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: { budget: updated } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRole("ADMIN", "FACULTY", "FINANCE_TEAM"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError(404, "BUDGET_NOT_FOUND", "Budget not found");

    const expenseCount = await prisma.expense.count({ where: { budgetId: req.params.id } });
    if (expenseCount > 0) {
      throw new AppError(400, "BUDGET_HAS_EXPENSES", "Cannot delete budget with existing expenses");
    }

    await prisma.budget.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Budget deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;