import { Router } from "express";
import prisma from "../config/prisma";
import env from "../config/env";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: "0.1.0",
        database: "connected",
        ai: {
          configured: !!process.env.GEMINI_API_KEY,
          provider: process.env.GEMINI_API_KEY ? "gemini" : "fallback",
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: "UNHEALTHY",
        message: "Service unavailable",
      },
    });
  }
});

router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { ready: true } });
  } catch {
    res.status(503).json({ success: false, data: { ready: false } });
  }
});

router.get("/live", (_req, res) => {
  res.json({ success: true, data: { alive: true } });
});

export default router;