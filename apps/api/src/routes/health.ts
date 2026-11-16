// FESTORA API - Health Check Routes
import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Public health check
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
      },
      message: 'FESTORA API is running',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed',
      },
    });
  }
});

// Detailed health check (requires auth)
router.get('/detailed', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [userCount, eventCount, registrationCount] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.registration.count(),
    ]);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        stats: {
          users: userCount,
          events: eventCount,
          registrations: registrationCount,
        },
        authenticated: !!req.user,
        user: req.user ? { id: req.user.id, role: req.user.role } : null,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Health check failed',
      },
    });
  }
});

// Readiness probe for Kubernetes
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { ready: true } });
  } catch {
    res.status(503).json({ success: false, error: { code: 'NOT_READY', message: 'Service not ready' } });
  }
});

// Liveness probe for Kubernetes
router.get('/live', (_req: Request, res: Response) => {
  res.json({ success: true, data: { alive: true } });
});

export default router;