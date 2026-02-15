/**
 * Heartbeat System for Compute Devices
 * 
 * This module manages device registration and heartbeat pings
 * to keep devices active in the network aggregation.
 */

import { api } from '@/lib/datarand';

interface DeviceSpecs {
  device_name: string;
  device_type: 'phone' | 'laptop' | 'desktop' | 'server';
  ram_gb: number;
  cpu_cores: number;
  storage_gb: number;
}

class ComputeHeartbeat {
  private deviceId: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 90000; // 90 seconds (1.5 minutes)

  /**
   * Detect device specifications
   */
  private async detectDeviceSpecs(): Promise<DeviceSpecs> {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Detect device type
    let deviceType: 'phone' | 'laptop' | 'desktop' | 'server' = isMobile ? 'phone' : 'laptop';
    
    // Detect OS for device name
    let os = 'Unknown';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
    
    const deviceName = `${os} ${deviceType === 'phone' ? 'Phone' : 'Computer'}`;
    
    // Estimate specs (in production, use navigator.deviceMemory, navigator.hardwareConcurrency, etc.)
    const ram_gb = (navigator as any).deviceMemory || (isMobile ? 4 : 8);
    const cpu_cores = navigator.hardwareConcurrency || (isMobile ? 4 : 8);
    
    // Estimate storage (rough approximation)
    let storage_gb = 128;
    if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
      const estimate = await (navigator as any).storage.estimate();
      storage_gb = Math.round((estimate.quota || 0) / (1024 ** 3));
    }
    
    return {
      device_name: deviceName,
      device_type: deviceType,
      ram_gb,
      cpu_cores,
      storage_gb
    };
  }

  /**
   * Start heartbeat system
   */
  async start(): Promise<void> {
    if (this.intervalId) {
      console.warn('Heartbeat already running');
      return;
    }

    try {
      // Register device and get device ID
      const specs = await this.detectDeviceSpecs();
      const response = await api.registerDevice(specs);
      this.deviceId = response.data.id;
      
      console.log('Device registered:', this.deviceId);
      
      // Start heartbeat interval
      this.intervalId = setInterval(() => {
        this.sendHeartbeat();
      }, this.HEARTBEAT_INTERVAL);
      
      console.log('Heartbeat started');
    } catch (error) {
      console.error('Failed to start heartbeat:', error);
      throw error;
    }
  }

  /**
   * Send heartbeat ping
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.deviceId) {
      console.error('No device ID - cannot send heartbeat');
      return;
    }

    try {
      await api.sendHeartbeat(this.deviceId);
      console.log('Heartbeat sent');
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  /**
   * Stop heartbeat and deactivate device
   */
  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.deviceId) {
      try {
        await api.deactivateDevice(this.deviceId);
        console.log('Device deactivated');
      } catch (error) {
        console.error('Failed to deactivate device:', error);
      }
      this.deviceId = null;
    }
  }

  /**
   * Check if heartbeat is running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Export singleton instance
export const computeHeartbeat = new ComputeHeartbeat();
