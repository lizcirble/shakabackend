import { asyncHandler } from '../utils/asyncHandler.js';
import { networkService } from '../services/networkService.js';

/**
 * GET /network/stats
 * Get aggregated network compute statistics
 */
const getNetworkStats = asyncHandler(async (req, res) => {
    const stats = await networkService.getNetworkStats();
    
    res.status(200).json({
        success: true,
        data: stats
    });
});

/**
 * POST /network/devices/register
 * Register or update a compute device
 */
const registerDevice = asyncHandler(async (req, res) => {
    const userId = req.user.profileId;
    const device = await networkService.registerDevice(userId, req.body);
    
    res.status(200).json({
        success: true,
        data: device
    });
});

/**
 * POST /network/devices/:deviceId/heartbeat
 * Send heartbeat to keep device active
 */
const sendHeartbeat = asyncHandler(async (req, res) => {
    const userId = req.user.profileId;
    const { deviceId } = req.params;
    
    const device = await networkService.sendHeartbeat(userId, deviceId);
    
    res.status(200).json({
        success: true,
        data: device
    });
});

/**
 * POST /network/devices/:deviceId/deactivate
 * Deactivate a device
 */
const deactivateDevice = asyncHandler(async (req, res) => {
    const userId = req.user.profileId;
    const { deviceId } = req.params;
    
    const device = await networkService.deactivateDevice(userId, deviceId);
    
    res.status(200).json({
        success: true,
        data: device
    });
});

/**
 * GET /network/devices
 * Get user's devices
 */
const getUserDevices = asyncHandler(async (req, res) => {
    const userId = req.user.profileId;
    const devices = await networkService.getUserDevices(userId);
    
    res.status(200).json({
        success: true,
        data: devices
    });
});

export {
    getNetworkStats,
    registerDevice,
    sendHeartbeat,
    deactivateDevice,
    getUserDevices
};
