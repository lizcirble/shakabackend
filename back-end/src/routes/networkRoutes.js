import express from 'express';
import {
    getNetworkStats,
    registerDevice,
    sendHeartbeat,
    deactivateDevice,
    getUserDevices
} from '../controllers/networkController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoint - no auth required for enterprise consumers
router.get('/stats', getNetworkStats);

// Protected endpoints - require authentication
router.post('/devices/register', authMiddleware, registerDevice);
router.post('/devices/:deviceId/heartbeat', authMiddleware, sendHeartbeat);
router.post('/devices/:deviceId/deactivate', authMiddleware, deactivateDevice);
router.get('/devices', authMiddleware, getUserDevices);

export default router;
