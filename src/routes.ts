import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { googleRouter } from './modules/google/routes';
import { chatRouter } from './modules/chat/routes';

const router = Router();

router.get('/version', (req, res) => {
    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    res.json({ version: pkg.version });
});

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/google', googleRouter);
router.use('/chat', chatRouter);

export const baseRouter = router;
