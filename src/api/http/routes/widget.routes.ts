import { Router } from 'express';
import { getWidgetToken, validateWidgetToken } from '@/api/http/controllers/widget.controller';

const router = Router();

router.post('/token', getWidgetToken);
router.post('/validate', validateWidgetToken);

export const widgetRouter = router;
