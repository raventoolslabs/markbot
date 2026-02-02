import { Request, Response, NextFunction } from "express";
import { logger } from "@/infrastructure/logging/logger";
import { ApplicationError } from "@/api/http/types/errors/ApplicationError";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApplicationError) {
    logger.warn(
      `${req.method} ${req.url} failed: ${err.message}`,
      "ApplicationError",
      err
    );

    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        status: err.statusCode,
        path: req.path,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error inesperado (bug, infra, etc.)
  logger.error(
    `${req.method} ${req.url} failed`,
    "UnhandledError",
    err
  );

  return res.status(500).json({
    error: {
      message: "Internal server error",
      status: 500,
      path: req.path,
      timestamp: new Date().toISOString()
    }
  });
};