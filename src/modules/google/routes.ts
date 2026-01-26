import { Router, Request, Response } from 'express';
import { verifyGoogleChatToken } from './auth';
import { messageHandler } from '../chat/messageHandler';
import { chatService } from './chatService';

const router = Router();

/**
 * @openapi
 * /google/message:
 *   post:
 *     summary: Google Chat Webhook (Only for Google Chat Requests)
 *     tags: [Google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: MESSAGE
 *               message:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   sender:
 *                     type: object
 *                     properties:
 *                       displayName:
 *                         type: string
 *                       name:
 *                         type: string
 *               space:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 */
router.get('/auth', (req, res) => {
    const url = chatService.getAuthUrl();
    res.redirect(url);
});

router.post('/message', verifyGoogleChatToken, async (req: Request, res: Response) => {
    const event = req.body;

    //console.log('Received Google Chat event:', JSON.stringify(event, null, 2));

    // Support both flat event structure (MESSAGE) and nested structure (messagePayload)
    const chatData = event.chat || {};

    console.log('chatData', chatData);

    let eventType = null;

    if (chatData.messagePayload) {
        eventType = 'MESSAGE';
    } else {
        eventType = chatData.type;
    }

    console.log('eventType', eventType);

    if (eventType === 'MESSAGE') {

        try {

            // Extract message data focusing on messagePayload if available
            const message = chatData.messagePayload?.message || event.message;
            const space = chatData.messagePayload?.space || event.space;

            let text = message?.text || '';

            if (text.startsWith('@')) text = text.replace(/^@[^\s]+\s*/, '');

            const userName = message?.sender?.displayName;
            const userId = message?.sender?.name;
            const spaceId = space?.name;

            console.log('text', text);
            console.log('userName', userName);
            console.log('userId', userId);
            console.log('spaceId', spaceId);
            console.log('chatData', chatData.messagePayload);

            if (!text && !chatData.messagePayload) {
                // If it's a message event but no text or payload, it might be a different subtype we don't handle yet
                return res.json({});
            }

            console.log('estoy aqui');

            // Use the centralized message handler
            const response = await messageHandler.handleMessage({
                text,
                userName,
                userId,
                spaceId,
                platform: 'google',
            });

            // Send message back via Google Chat API
            // Note: This requires an authorized OAuth2 client with access token, which is not currently implemented.
            // Since we are replying synchronously via res.json below, this call is redundant and currently causes an error.

            if (spaceId) {
                console.log(`Sending message to space ${spaceId} via ChatService...`);
                try {
                    await chatService.sendMessage(spaceId, response.text);
                    console.log('Message sent successfully via ChatService');
                } catch (sendError) {
                    console.error('Error sending message via ChatService:', sendError);
                }
            }


            res.json({});
        } catch (error) {
            console.error('Error processing Google message:', error);
            // Even if there is an error, we might not want to show it to the user in the chat directly 
            // if we are in async mode, but for now let's keep it simple.
            res.json({});
        }
    } else {
        // Other event types (ADDED_TO_SPACE, REMOVED_FROM_SPACE, etc.)
        console.log(`Unhandled event type: ${eventType}`);
        res.json({});
    }
});

/**
 * @openapi
 * /google/oauth2/callback:
 *   get:
 *     summary: Google OAuth 2.0 Callback
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Authentication failed
 */
router.get('/oauth2/callback', async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing code');
    }

    try {
        await chatService.getToken(code);
        res.send('Authentication successful! You can now close this window.');
    } catch (error) {
        console.error('Error getting token:', error);
        res.status(500).send('Authentication failed');
    }
});

export const googleRouter = router;
