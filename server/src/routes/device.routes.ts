import { Router } from 'express';
import { bulkRenew, coTerm, issueGraceToken } from '../controllers/device.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Parent only actions
router.post('/bulk-renew', authenticateToken, bulkRenew);
router.post('/co-term', authenticateToken, coTerm);
router.post('/:id/grace-token', authenticateToken, issueGraceToken);

export default router;
