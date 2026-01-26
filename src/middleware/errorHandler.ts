import { Request, Response, NextFunction } from 'express';
import { logger } from '../util/logger';

/**
 * Middleware global para el manejo de errores
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`${req.method} ${req.url} failed: ${err.message}`, 'GlobalErrorHandler', err);

  // Determinar el código de estado (por defecto 500)
  const statusCode = err.status || err.statusCode || 500;

  // Responder al cliente
  res.status(statusCode).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: statusCode,
      path: req.path,
      timestamp: new Date().toISOString(),
    },
  });
};
