
import { Router } from 'express';
import { createRequest, getRequests, approveRequest, rejectRequest, getResellerRequests, respondToRequest, getQuotePdf } from '../controllers/request.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Child/Client: Create a renewal request
router.post('/', authenticateToken, createRequest);

// Reseller: View requests from managed clients
router.get('/reseller', authenticateToken, getResellerRequests);

// Reseller: Respond to request (Send Quote)
router.post('/:id/respond', authenticateToken, respondToRequest);

// Parent/Child: Download Quote PDF
router.get('/:id/quote', authenticateToken, getQuotePdf);

// Parent: View all requests from children
router.get('/', authenticateToken, getRequests);

// Parent: Approve & Pay (Renew)
router.post('/:id/approve', authenticateToken, approveRequest);

// Parent: Reject
router.post('/:id/reject', authenticateToken, rejectRequest);

export default router;
