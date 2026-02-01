
import { Router } from 'express';
import { getStats, getDevices, getResellerClients } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticateToken, getStats);
router.get('/devices', authenticateToken, getDevices);
router.get('/clients', authenticateToken, getResellerClients);

export default router;
