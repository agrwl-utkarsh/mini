import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import env from "../config/env";
import { AppError } from "./errorHandler";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        req.headers.authorization = authHeader;
      } else {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
      }
    }

    let token = accessToken;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, "UNAUTHORIZED", "User not found or inactive");
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, "INVALID_TOKEN", "Invalid authentication token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "TOKEN_EXPIRED", "Authentication token has expired"));
    } else {
      next(error);
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const accessToken = req.cookies?.accessToken;
  const authHeader = req.headers.authorization;

  let token = accessToken;
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    (req as AuthenticatedRequest).user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}