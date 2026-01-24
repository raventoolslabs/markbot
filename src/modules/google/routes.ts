import { Router, Request, Response } from 'express';
import { verifyGoogleChatToken } from './auth';

const router = Router();

router.post('/', verifyGoogleChatToken, (req: Request, res: Response) => {
    const event = req.body;

    if (event.type === 'MESSAGE' && event.message) {
        const text = event.message.text;
        // Echo response
        res.json({
            text: `Echo: ${text}`,
        });
    } else {
        // Other event types (ADDED_TO_SPACE, etc.)
        res.json({});
    }
});

export const googleRouter = router;
