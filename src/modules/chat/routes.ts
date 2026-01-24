import { Router, Request, Response } from 'express';

const router = Router();

router.post('/message', (req: Request, res: Response) => {
    const { message } = req.body;
    // Echo response
    res.json({ response: message });
});

export const chatRouter = router;
