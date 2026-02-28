// DataRand Integration for Next.js Frontend
// Uses Privy embedded wallet for all transactions

import { useState, useEffect, createContext, useContext } from 'react';

// ============================================
// CONFIGURATION
// ============================================

export const CONFIG = {
  // Backend API
  API_BASE_URL: 'https://datarand.onrender.com/api/v1',
  
  // Smart Contract
  CONTRACT_ADDRESS: '0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34',
  
  // Network: Arbitrum Sepolia Testnet
  CHAIN_ID: '0x66eed', // 421614
  CHAIN_NAME: 'Arbitrum Sepolia',
  RPC_URL: 'https://arb-sep.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
  BLOCK_EXPLORER: 'https://sepolia.arbiscan.io',
  
  // Platform Fee
  PLATFORM_FEE_PERCENTAGE: 15,
};

// ============================================
// CONTEXT
// ============================================

const DataRandContext = createContext(null);

// ============================================
// API SERVICE
// ============================================

class DataRandAPI {
  baseUrl: string;
  constructor(baseUrl: string = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('datarand_token');
    }
    return null;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      const message = error.message || `HTTP ${response.status}`;
      
      // Clear invalid token on 401
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('datarand_token');
      }
      
      // Suppress auth errors - backend may not be ready
      if (endpoint === '/auth/login' && response.status === 401) {
        throw new Error('Backend authentication unavailable');
      }
      
      throw new Error(`${message} (${endpoint})`);
    }

    return response.json();
  }

  // Auth
  async login(privyAccessToken: string, deviceFingerprint: string): Promise<any> {
    // TEMP: Skip backend auth until Privy verification is fixed
    console.log('Skipping backend auth (dev mode)');
    return { token: 'dev_token', user: { id: 'dev_user' } };
    
    /* Disabled until backend Privy verification is fixed
    console.log(JSON.stringify({ privyAccessToken, deviceFingerprint }));
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ privyAccessToken, deviceFingerprint }),
    });
    */
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Tasks
  async createTask(taskData: any): Promise<any> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async fundTask(taskId: string): Promise<any> {
    return this.request(`/tasks/${taskId}/fund`, {
      method: 'POST',
    });
  }

  async confirmTaskFunding(taskId: string, txHash: string): Promise<any> {
    return this.request(`/tasks/${taskId}/confirm-funding`, {
      method: 'POST',
      body: JSON.stringify({ txHash }),
    });
  }

  async getMyTasks() {
    return this.request('/tasks');
  }

  async getTask(taskId: string): Promise<any> {
    return this.request(`/tasks/${taskId}`);
  }

  async getAvailableTasks() {
    return this.request('/tasks/available');
  }

  // Submissions
  async submitWork(submissionData: any): Promise<any> {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getTaskSubmissions(taskId: string): Promise<any> {
    return this.request(`/submissions/task/${taskId}`);
  }

  async reviewSubmission(submissionId: string, approved: boolean): Promise<any> {
    return this.request(`/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  }

  // Worker
  async requestTask() {
    return this.request('/tasks/request', { method: 'POST' });
  }

  async getMyAssignedTasks() {
    return this.request('/tasks/my-assignments');
  }

  // Network & Compute Devices
  async getNetworkStats(): Promise<any> {
    return this.request('/network/stats');
  }

  async registerDevice(deviceData: any): Promise<any> {
    return this.request('/network/devices/register', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async sendHeartbeat(deviceId: string): Promise<any> {
    return this.request(`/network/devices/${deviceId}/heartbeat`, {
      method: 'POST',
    });
  }

  async deactivateDevice(deviceId: string): Promise<any> {
    return this.request(`/network/devices/${deviceId}/deactivate`, {
      method: 'POST',
    });
  }

  async getUserDevices(): Promise<any> {
    return this.request('/network/devices');
  }
}

export const api = new DataRandAPI();

// ============================================
// DEVICE FINGERPRINT
// ============================================

export function getDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server';
  
  let fingerprint = localStorage.getItem('datarand_fingerprint');
  if (fingerprint) return fingerprint;

  const fp = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('datarand_fingerprint', fp);
  return fp;
}

// ============================================
// PRIVY WALLET HELPER
// ============================================

// Get wallet address from Privy user object
export function getPrivyWalletAddress(privyUser: any): string | null {
  if (!privyUser) {
    return null;
  }

  // Check for smart wallet first (Coinbase Smart Wallet)
  if (privyUser.smartWallet?.address) {
    return privyUser.smartWallet.address;
  }

  // Check for regular wallet
  if (privyUser.wallet?.address) {
    return privyUser.wallet.address;
  }

  // Fallback to linked_accounts
  if (privyUser.linked_accounts) {
    const embeddedWallet = privyUser.linked_accounts.find(
      (acc: any) => acc.type === 'wallet' && acc.wallet_type === 'embedded'
    );
    if (embeddedWallet) {
      return embeddedWallet.address;
    }

    const anyWallet = privyUser.linked_accounts.find(
      (acc: any) => acc.type === 'wallet'
    );
    if (anyWallet) {
      return anyWallet.address;
    }
  }

  return null;
}

// Check if Privy wallet is ready
export function isPrivyWalletReady(privyUser: any): boolean {
  return !!getPrivyWalletAddress(privyUser);
}

// Get ethers provider from Privy embedded wallet
export async function getPrivyEthersProvider(privyWallet: any) {
  if (!privyWallet) return null;
  return await privyWallet.getEthersProvider();
}

export default CONFIG;
