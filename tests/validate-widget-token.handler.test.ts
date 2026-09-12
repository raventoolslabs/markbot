import jwt from 'jsonwebtoken';
import { ValidateWidgetTokenHandler } from '../src/app/use-cases/widget/queries/validate-widget-token.handler';
import { chatAuthenticationMiddleware } from '../src/api/http/middlewares/chat-authentication.middleware';

const secret = process.env.JWT_SECRET || 'default_secret_change_me';
const handler = new ValidateWidgetTokenHandler();

const sign = (payload: object, expiresIn = '1h') =>
  jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

describe('ValidateWidgetTokenHandler', () => {
  it('devuelve un token de sesión con el que el chat puede firmar mensajes', async () => {
    const bootstrap = sign({ userId: 'u1', widgetId: 'w1', allowedOrigin: 'https://x.test', type: 'widget_token' }, '300s');

    const result = await handler.execute({ token: bootstrap });

    expect(result.valid).toBe(true);
    expect(result.sessionToken).toBeDefined();

    // El token de sesión dura más que el de arranque y sigue siendo de widget.
    const decoded = jwt.verify(result.sessionToken as string, secret) as jwt.JwtPayload;
    expect(decoded.type).toBe('widget_token');
    expect(decoded.userId).toBe('u1');
    expect(decoded.widgetId).toBe('w1');
    expect((decoded.exp as number) - (decoded.iat as number)).toBeGreaterThan(300);
  });

  it('rechaza un token que no es de widget', async () => {
    const result = await handler.execute({ token: sign({ userId: 'u1' }) });

    expect(result.valid).toBe(false);
    expect(result.sessionToken).toBeUndefined();
  });

  it('rechaza un token caducado', async () => {
    const expired = jwt.sign({ userId: 'u1', type: 'widget_token' }, secret, { expiresIn: '-1s' });

    const result = await handler.execute({ token: expired });

    expect(result.valid).toBe(false);
  });

  it('el token de sesión que emite es aceptado por el middleware del chat', async () => {
    const bootstrap = sign({ userId: 'u1', widgetId: 'w1', type: 'widget_token' }, '300s');
    const { sessionToken } = await handler.execute({ token: bootstrap });

    const req = { headers: { authorization: `Bearer ${sessionToken}` } } as never;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as never;
    const next = jest.fn();

    chatAuthenticationMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
