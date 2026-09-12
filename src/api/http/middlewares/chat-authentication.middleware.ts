import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';

// El chat lo consumen dos clientes distintos: la app (JWT de usuario) y el
// widget embebido en webs de terceros (widget_token). Middleware aparte para no
// abrir el resto de rutas a los tokens de widget.
export const chatAuthenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, config.jwtSecret || 'default_secret_change_me') as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
    };

    if (decoded.type === 'widget_token') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).widget = { widgetId: decoded.widgetId };
    }

    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
