import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import env from "./config/env";
import prisma from "./config/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { requestLogger } from "./middleware/requestLogger";

import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import registrationRoutes from "./routes/registrations";
import venueRoutes from "./routes/venues";
import taskRoutes from "./routes/tasks";
import budgetRoutes from "./routes/budgets";
import expenseRoutes from "./routes/expenses";
import sponsorRoutes from "./routes/sponsors";
import feedbackRoutes from "./routes/feedback";
import certificateRoutes from "./routes/certificates";
import userRoutes from "./routes/users";
import healthRoutes from "./routes/health";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/registrations", authMiddleware, registrationRoutes);
app.use("/api/venues", authMiddleware, venueRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/budgets", authMiddleware, budgetRoutes);
app.use("/api/expenses", authMiddleware, expenseRoutes);
app.use("/api/sponsors", authMiddleware, sponsorRoutes);
app.use("/api/feedback", authMiddleware, feedbackRoutes);
app.use("/api/certificates", authMiddleware, certificateRoutes);
app.use("/api/users", authMiddleware, userRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;