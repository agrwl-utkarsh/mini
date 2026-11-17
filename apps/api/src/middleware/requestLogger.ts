import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  (req as any).requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (res.statusCode >= 400) {
      console.warn("⚠️ Request:", logData);
    } else if (process.env.NODE_ENV === "development") {
      console.log("📥 Request:", logData);
    }
  });

  next();
}