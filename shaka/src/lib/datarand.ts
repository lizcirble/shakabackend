// DataRand Integration for Shaka Frontend
// Uses Privy for auth and connects to backend API

import { useState, useEffect, createContext, useContext } from 'react';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
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
// CONTRACT ABI (Simplified for funding)
// ============================================

const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "fundTask",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "payable"
  }
];

// ============================================
// CONTEXT
// ============================================

const DataRandContext = createContext(null);

// ============================================
// API SERVICE
// ============================================

class DataRandAPI {
  constructor(baseUrl = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  getToken() {
    return localStorage.getItem('datarand_token');
  }

  async request(endpoint, options = {}) {
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
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(privyAccessToken, deviceFingerprint) {
    console.log(JSON.stringify({ privyAccessToken, deviceFingerprint }));
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ privyAccessToken, deviceFingerprint }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Tasks
  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async fundTask(taskId) {
    return this.request(`/tasks/${taskId}/fund`, {
      method: 'POST',
    });
  }

  async confirmTaskFunding(taskId, txHash) {
    return this.request(`/tasks/${taskId}/confirm-funding`, {
      method: 'POST',
      body: JSON.stringify({ txHash }),
    });
  }

  async getMyTasks() {
    return this.request('/tasks');
  }

  async getTask(taskId) {
    return this.request(`/tasks/${taskId}`);
  }

  async getAvailableTasks() {
    return this.request('/tasks/available');
  }

  // Submissions
  async submitWork(submissionData) {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getTaskSubmissions(taskId) {
    return this.request(`/submissions/task/${taskId}`);
  }

  async reviewSubmission(submissionId, approved) {
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
}

export const api = new DataRandAPI();

// ============================================
// DEVICE FINGERPRINT
// ============================================

export function getDeviceFingerprint() {
  let fingerprint = localStorage.getItem('datarand_fingerprint');
  if (fingerprint) return fingerprint;

  const fp = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('datarand_fingerprint', fp);
  return fp;
}

// ============================================
// HOOKS
// ============================================

export function useDataRand() {
  return useContext(DataRandContext);
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export function DataRandProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0');
  const [walletConnected, setWalletConnected] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('datarand_token');
    const savedUser = localStorage.getItem('datarand_user');
    
    if (savedToken && savedUser) {
      api.setToken(savedToken);
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (privyAccessToken, wallet) => {
    try {
      // Initialize wallet if provided
      if (wallet) {
        const provider = await wallet.getEthersProvider();
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        
        const balance = await provider.getBalance(address);
        setWalletBalance(balance.toString());
        setWalletConnected(true);
      }

      // Login to API
      const deviceFingerprint = getDeviceFingerprint();
      const result = await api.login(privyAccessToken, deviceFingerprint);

      localStorage.setItem('datarand_token', result.token);
      localStorage.setItem('datarand_user', JSON.stringify(result.user));
      
      setToken(result.token);
      setUser(result.user);

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWalletConnected(false);
    setWalletAddress(null);
    localStorage.removeItem('datarand_token');
    localStorage.removeItem('datarand_user');
  };

  const refreshBalance = async () => {
    if (walletAddress) {
      // Would need provider here - simplified
      setWalletBalance('0');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    walletAddress,
    walletBalance,
    walletConnected,
    refreshBalance,
  };

  return (
    <DataRandContext.Provider value={value}>
      {children}
    </DataRandContext.Provider>
  );
}

export default CONFIG;
