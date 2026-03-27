import { Request, Response } from 'express';
import { apiKeyRepository } from '@/infrastructure/db/repositories/ApiKeyRepository';
import { GetWidgetTokenHandler } from '@/app/use-cases/widget/queries/get-widget-token.handler';
import { ValidateWidgetTokenHandler } from '@/app/use-cases/widget/queries/validate-widget-token.handler';

const getWidgetTokenHandler = new GetWidgetTokenHandler(apiKeyRepository);
const validateWidgetTokenHandler = new ValidateWidgetTokenHandler();

export const getWidgetToken = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: Missing API Key' });
            return;
        }

        const apiKey = authHeader.split(' ')[1];
        const { widgetId, allowedOrigin } = req.body;

        const result = await getWidgetTokenHandler.execute({ apiKey, widgetId, allowedOrigin });

        res.json(result);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message.startsWith('Unauthorized')) {
            res.status(401).json({ error: error.message });
            return;
        }
        if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
            return;
        }
        console.error('Error generating widget token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const validateWidgetToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ valid: false, error: 'Token required' });
            return;
        }

        const result = await validateWidgetTokenHandler.execute({ token });

        if (!result.valid) {
            res.status(401).json({ valid: false, error: result.error });
            return;
        }

        res.json({ valid: true, decoded: result.decoded });

    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
