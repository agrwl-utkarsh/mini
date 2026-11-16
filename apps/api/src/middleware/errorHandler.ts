// FESTORA API - Error Handler Middleware
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten().fieldErrors,
      },
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: `${target} already exists` },
        });
      }
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: { code: 'FOREIGN_KEY_CONSTRAINT', message: 'Referenced record does not exist' },
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Record not found' },
        });
      default:
        return res.status(500).json({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'A database error occurred' },
        });
    }
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Authentication token has expired' },
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' },
    });
  }

  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Default error
  const statusCode = err.message.includes('Unauthorized') ? 401 : 500;
  const code = statusCode === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR';

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}