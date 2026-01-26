import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global para el manejo de errores
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Registrar el error en la consola
    console.error('--- Global Error Handler ---');
    console.error(`Error: ${err.message}`);
    if (err.stack) {
        console.error(`Stack: ${err.stack}`);
    }
    console.error(`Path: ${req.path}`);
    console.error(`Method: ${req.method}`);
    console.error('---------------------------');

    // Determinar el código de estado (por defecto 500)
    const statusCode = err.status || err.statusCode || 500;

    // Responder al cliente
    res.status(statusCode).json({
        error: {
            message: err.message || 'Error interno del servidor',
            status: statusCode,
            path: req.path,
            timestamp: new Date().toISOString()
        }
    });
};
