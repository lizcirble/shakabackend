import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

/**
 * Register or update a compute device with system specs
 */
const registerDevice = async (userId, deviceData) => {
    const { device_name, device_type, ram_gb, cpu_cores, storage_gb } = deviceData;

    // Check if device already exists for this user
    const { data: existing } = await supabase
        .from('compute_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_name', device_name)
        .maybeSingle();

    if (existing) {
        // Update existing device
        const { data, error } = await supabase
            .from('compute_devices')
            .update({
                ram_gb,
                cpu_cores,
                storage_gb,
                device_type,
                last_seen: new Date().toISOString(),
                is_active: true
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw new ApiError(500, 'Failed to update device');
        return data;
    }

    // Insert new device
    const { data, error } = await supabase
        .from('compute_devices')
        .insert({
            user_id: userId,
            device_name,
            device_type,
            ram_gb,
            cpu_cores,
            storage_gb,
            is_active: true,
            last_seen: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw new ApiError(500, 'Failed to register device');
    return data;
};

/**
 * Send heartbeat to keep device active
 */
const sendHeartbeat = async (userId, deviceId) => {
    const { data, error } = await supabase
        .from('compute_devices')
        .update({
            last_seen: new Date().toISOString(),
            is_active: true
        })
        .eq('id', deviceId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new ApiError(500, 'Failed to send heartbeat');
    return data;
};

/**
 * Deactivate a device
 */
const deactivateDevice = async (userId, deviceId) => {
    const { data, error } = await supabase
        .from('compute_devices')
        .update({ is_active: false })
        .eq('id', deviceId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new ApiError(500, 'Failed to deactivate device');
    return data;
};

/**
 * Get network-wide compute statistics (enterprise aggregation)
 */
const getNetworkStats = async () => {
    const { data, error } = await supabase.rpc('get_network_stats');

    if (error) {
        logger.error('Failed to get network stats:', error);
        throw new ApiError(500, 'Failed to retrieve network statistics');
    }

    // Return first row (function returns single row)
    const stats = data?.[0] || {
        active_nodes: 0,
        total_ram_gb: 0,
        total_cpu_cores: 0,
        total_storage_gb: 0,
        total_compute_score: 0
    };

    logger.info('Network stats retrieved:', stats);
    return stats;
};

/**
 * Get user's devices
 */
const getUserDevices = async (userId) => {
    const { data, error } = await supabase
        .from('compute_devices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, 'Failed to get user devices');
    return data || [];
};

export const networkService = {
    registerDevice,
    sendHeartbeat,
    deactivateDevice,
    getNetworkStats,
    getUserDevices
};
