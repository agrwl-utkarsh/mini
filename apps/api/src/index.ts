// FESTORA API - Main Entry Point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import venueRoutes from './routes/venues.js';
import registrationRoutes from './routes/registrations.js';
import ticketRoutes from './routes/tickets.js';
import attendanceRoutes from './routes/attendance.js';
import taskRoutes from './routes/tasks.js';
import issueRoutes from './routes/issues.js';
import financeRoutes from './routes/finance.js';
import sponsorRoutes from './routes/sponsors.js';
import competitionRoutes from './routes/competitions.js';
import certificateRoutes from './routes/certificates.js';
import feedbackRoutes from './routes/feedback.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const app = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = '/api/v1';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable for development
}));

// CORS configuration
const corsOrigin = process.env.APP_URL || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later' } },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookies
app.use(cookieParser());

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Health check (no auth required)
app.use(`${API_PREFIX}/health`, healthRoutes);

// Public routes (no auth required)
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);

// Protected routes (auth required)
app.use(`${API_PREFIX}/users`, authMiddleware, userRoutes);
app.use(`${API_PREFIX}/events`, authMiddleware, eventRoutes);
app.use(`${API_PREFIX}/venues`, authMiddleware, venueRoutes);
app.use(`${API_PREFIX}/registrations`, authMiddleware, registrationRoutes);
app.use(`${API_PREFIX}/tickets`, authMiddleware, ticketRoutes);
app.use(`${API_PREFIX}/attendance`, authMiddleware, attendanceRoutes);
app.use(`${API_PREFIX}/tasks`, authMiddleware, taskRoutes);
app.use(`${API_PREFIX}/issues`, authMiddleware, issueRoutes);
app.use(`${API_PREFIX}/finance`, authMiddleware, financeRoutes);
app.use(`${API_PREFIX}/sponsors`, authMiddleware, sponsorRoutes);
app.use(`${API_PREFIX}/competitions`, authMiddleware, competitionRoutes);
app.use(`${API_PREFIX}/certificates`, authMiddleware, certificateRoutes);
app.use(`${API_PREFIX}/feedback`, authMiddleware, feedbackRoutes);
app.use(`${API_PREFIX}/analytics`, authMiddleware, analyticsRoutes);
app.use(`${API_PREFIX}/admin`, authMiddleware, adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 FESTORA API running on http://localhost:${PORT}`);
  console.log(`📚 API docs available at http://localhost:${PORT}${API_PREFIX}/health`);
});

export default app;