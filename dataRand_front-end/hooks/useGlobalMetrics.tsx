"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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
  addComputeSession: (minutes: number, earnings: number, deviceType?: 'phone' | 'laptop') => void;
  updateCpuUsage: (usage: number) => void;
  setActiveSession: (active: boolean) => void;
  refreshMetrics: () => void;
}

const GlobalMetricsContext = createContext<GlobalMetrics | undefined>(undefined);

export function GlobalMetricsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<Omit<GlobalMetrics, 'incrementTasksCompleted' | 'addEarnings' | 'addDataProcessed' | 'addComputeSession' | 'updateCpuUsage' | 'setActiveSession' | 'refreshMetrics'>>({
    // Daily Impact (resets daily)
    tasksCompletedToday: 0,
    dataProcessedToday: 0,
    earnedToday: 0,
    
    // Overall Stats
    totalEarnings: 0,
    totalTasksCompleted: 0,
    totalComputeSessions: 0,
    totalComputeMinutes: 0,
    
    // Education Impact (15% of total earnings)
    educationFundContribution: 0,
    studentsImpacted: 0,
    
    // Live Stats
    currentCpuUsage: 0,
    activeComputeSession: false,
  });

  const loadMetricsFromDatabase = useCallback(async () => {
    if (!profile) return;

    try {
      // Get user profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('compute_earnings, tasks_completed, total_earnings')
        .eq('id', profile.id)
        .single();

      // Get compute sessions data
      const { data: sessionsData } = await supabase
        .from('compute_sessions')
        .select('*')
        .eq('worker_id', profile.id);

      if (profileData && sessionsData) {
        const totalSessions = sessionsData.length;
        const totalMinutes = sessionsData.reduce((sum, session) => {
          if (session.ended_at && session.started_at) {
            const duration = (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60);
            return sum + duration;
          }
          return sum;
        }, 0);

        const totalEarnings = profileData.total_earnings || 0;
        const educationContribution = totalEarnings * 0.15;

        setMetrics(prev => ({
          ...prev,
          totalEarnings,
          totalTasksCompleted: profileData.tasks_completed || 0,
          totalComputeSessions: totalSessions,
          totalComputeMinutes: Math.floor(totalMinutes),
          educationFundContribution: educationContribution,
          studentsImpacted: Math.floor(educationContribution / 1.85), // $1.85 per student impact
        }));
      }
    } catch (error) {
      console.error('Error loading metrics from database:', error);
      // Fallback to localStorage if database fails
      const saved = localStorage.getItem('datarand-metrics');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMetrics(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse saved metrics:', e);
        }
      }
    }
  }, [profile]);

  // Load from database on mount and when profile changes
  useEffect(() => {
    loadMetricsFromDatabase();
  }, [profile, loadMetricsFromDatabase]);

  // Load from localStorage on mount (fallback)
  useEffect(() => {
    const saved = localStorage.getItem('datarand-metrics');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const refreshMetrics = () => {
    loadMetricsFromDatabase();
  };

  const addComputeSession = async (minutes: number, earnings: number, deviceType?: 'phone' | 'laptop') => {
    if (!profile) return;

    try {
      // Insert new compute session into database
      await supabase
        .from('compute_sessions')
        .insert({
          worker_id: profile.id,
          started_at: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
          ended_at: new Date().toISOString(),
          total_earned: earnings,
          earnings_rate: earnings / Math.max(minutes, 1),
          device_type: deviceType || null,
          is_active: false,
        });

      // Update profile earnings with current persisted totals.
      const { data: profileData } = await supabase
        .from('profiles')
        .select('compute_earnings, total_earnings')
        .eq('id', profile.id)
        .single();

      const currentComputeEarnings = Number(profileData?.compute_earnings || 0);
      const currentTotalEarnings = Number(profileData?.total_earnings || 0);

      await supabase
        .from('profiles')
        .update({
          compute_earnings: currentComputeEarnings + earnings,
          total_earnings: currentTotalEarnings + earnings,
        })
        .eq('id', profile.id);

      // Refresh metrics from database
      loadMetricsFromDatabase();
    } catch (error) {
      console.error('Error adding compute session:', error);
      // Fallback to local state update
      setMetrics(prev => ({
        ...prev,
        totalComputeSessions: prev.totalComputeSessions + 1,
        totalComputeMinutes: prev.totalComputeMinutes + minutes,
      }));
    }
    
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
    refreshMetrics,
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
    // Return default values if provider is not available (for pages directory)
    return {
      tasksCompletedToday: 0,
      dataProcessedToday: 0,
      earnedToday: 0,
      totalEarnings: 0,
      totalTasksCompleted: 0,
      totalComputeSessions: 0,
      totalComputeMinutes: 0,
      educationFundContribution: 0,
      studentsImpacted: 0,
      currentCpuUsage: 0,
      activeComputeSession: false,
      incrementTasksCompleted: () => {},
      addEarnings: () => {},
      addDataProcessed: () => {},
      addComputeSession: () => {},
      updateCpuUsage: () => {},
      setActiveSession: () => {},
      refreshMetrics: () => {},
    };
  }
  return context;
}
