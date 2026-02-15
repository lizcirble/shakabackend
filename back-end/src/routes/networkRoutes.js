import express from 'express';
import {
    getNetworkStats,
    registerDevice,
    sendHeartbeat,
    deactivateDevice,
    getUserDevices
} from '../controllers/networkController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoint - no auth required for enterprise consumers
router.get('/stats', getNetworkStats);

// Protected endpoints - require authentication
router.post('/devices/register', authenticate, registerDevice);
router.post('/devices/:deviceId/heartbeat', authenticate, sendHeartbeat);
router.post('/devices/:deviceId/deactivate', authenticate, deactivateDevice);
router.get('/devices', authenticate, getUserDevices);

export default router;
