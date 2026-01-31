
import { Router } from 'express';
import { createRequest, getRequests, approveRequest, rejectRequest } from '../controllers/request.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Child: Create a renewal request
router.post('/', authenticateToken, createRequest);

// Parent: View all requests
router.get('/', authenticateToken, getRequests);

// Parent: Approve & Pay (Renew)
router.post('/:id/approve', authenticateToken, approveRequest);

// Parent: Reject
router.post('/:id/reject', authenticateToken, rejectRequest);

export default router;
