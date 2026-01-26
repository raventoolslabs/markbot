import { Router, Request, Response } from 'express';
import { messageHandler } from './messageHandler';

const router = Router();

/**
 * @openapi
 * /chat/message:
 *   post:
 *     summary: Send a message to Markbot
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               userName:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       500:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 metadata:
 *                   type: object
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, userName, userId } = req.body;

    // Use the centralized message handler
    const response = await messageHandler.handleMessage({
      text: message || '',
      userName,
      userId,
      platform: 'generic',
    });

    res.json({
      response: response.text,
      metadata: response.metadata,
    });
  } catch (error) {
    const errorResponse = messageHandler.formatErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
    );
    res.status(500).json({
      error: errorResponse.text,
      metadata: errorResponse.metadata,
    });
  }
});

export const chatRouter = router;
