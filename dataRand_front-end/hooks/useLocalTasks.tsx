"use client";

import { useState, useEffect } from "react";

export interface LocalTask {
  id: string;
  client_id: string;
  title: string;
  description: string;
  instructions: string;
  payout_amount: number;
  estimated_time_minutes: number;
  task_type_id: string;
  worker_count: number;
  target_countries: string[];
  media_url: string | null;
  media_type: string | null;
  status: string;
  created_at: string;
}

export function useLocalTasks() {
  const [tasks, setTasks] = useState<LocalTask[]>([]);

  const loadTasks = () => {
    const stored = localStorage.getItem('localTasks');
    if (stored) {
      setTasks(JSON.parse(stored));
    }
  };

  const getTasksByClientId = (clientId: string): LocalTask[] => {
    return tasks.filter(task => task.client_id === clientId);
  };

  const getTaskById = (taskId: string): LocalTask | null => {
    return tasks.find(task => task.id === taskId) || null;
  };

  useEffect(() => {
    loadTasks();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadTasks();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    tasks,
    getTasksByClientId,
    getTaskById,
    refreshTasks: loadTasks
  };
}
