"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface GlobalMetrics {
  // Daily Impact
  tasksCompletedToday: number;
  dataProcessedToday: number; // GB
  earnedToday: number;
  
  // Overall Stats
  totalEarnings: number;
  totalTasksCompleted: number;
  totalComputeSessions: number;
  totalComputeMinutes: number;
  
  // Education Impact
  educationFundContribution: number;
  studentsImpacted: number;
  
  // Live Stats
  currentCpuUsage: number;
  activeComputeSession: boolean;
  
  // Update functions
  incrementTasksCompleted: () => void;
  addEarnings: (amount: number) => void;
  addDataProcessed: (gb: number) => void;
  addComputeSession: (minutes: number, earnings: number) => void;
  updateCpuUsage: (usage: number) => void;
  setActiveSession: (active: boolean) => void;
}

const GlobalMetricsContext = createContext<GlobalMetrics | undefined>(undefined);

export function GlobalMetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Omit<GlobalMetrics, 'incrementTasksCompleted' | 'addEarnings' | 'addDataProcessed' | 'addComputeSession' | 'updateCpuUsage' | 'setActiveSession'>>({
    // Daily Impact (resets daily)
    tasksCompletedToday: 5,
    dataProcessedToday: 1.2,
    earnedToday: 3.45,
    
    // Overall Stats
    totalEarnings: 24.67,
    totalTasksCompleted: 47,
    totalComputeSessions: 12,
    totalComputeMinutes: 340,
    
    // Education Impact (15% of total earnings)
    educationFundContribution: 3.70,
    studentsImpacted: 2,
    
    // Live Stats
    currentCpuUsage: 0,
    activeComputeSession: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('datarand-metrics');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMetrics(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved metrics:', e);
      }
    }
  }, []);

  // Save to localStorage when metrics change
  useEffect(() => {
    localStorage.setItem('datarand-metrics', JSON.stringify(metrics));
  }, [metrics]);

  const incrementTasksCompleted = () => {
    setMetrics(prev => ({
      ...prev,
      tasksCompletedToday: prev.tasksCompletedToday + 1,
      totalTasksCompleted: prev.totalTasksCompleted + 1,
    }));
  };

  const addEarnings = (amount: number) => {
    setMetrics(prev => ({
      ...prev,
      earnedToday: prev.earnedToday + amount,
      totalEarnings: prev.totalEarnings + amount,
      educationFundContribution: prev.educationFundContribution + (amount * 0.15),
      studentsImpacted: Math.floor((prev.educationFundContribution + (amount * 0.15)) / 1.85), // $1.85 per student impact
    }));
  };

  const addDataProcessed = (gb: number) => {
    setMetrics(prev => ({
      ...prev,
      dataProcessedToday: prev.dataProcessedToday + gb,
    }));
  };

  const addComputeSession = (minutes: number, earnings: number) => {
    setMetrics(prev => ({
      ...prev,
      totalComputeSessions: prev.totalComputeSessions + 1,
      totalComputeMinutes: prev.totalComputeMinutes + minutes,
    }));
    addEarnings(earnings);
  };

  const updateCpuUsage = (usage: number) => {
    setMetrics(prev => ({
      ...prev,
      currentCpuUsage: usage,
    }));
  };

  const setActiveSession = (active: boolean) => {
    setMetrics(prev => ({
      ...prev,
      activeComputeSession: active,
    }));
  };

  const value: GlobalMetrics = {
    ...metrics,
    incrementTasksCompleted,
    addEarnings,
    addDataProcessed,
    addComputeSession,
    updateCpuUsage,
    setActiveSession,
  };

  return (
    <GlobalMetricsContext.Provider value={value}>
      {children}
    </GlobalMetricsContext.Provider>
  );
}

export function useGlobalMetrics() {
  const context = useContext(GlobalMetricsContext);
  if (context === undefined) {
    throw new Error('useGlobalMetrics must be used within a GlobalMetricsProvider');
  }
  return context;
}
