"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
// import { supabase } from "@/lib/supabase"; // Commented out Supabase import
import { useToast } from "./use-toast";

export interface DeviceState {
  isActive: boolean;
  isInstalled: boolean;
  sessionId: string | null;
  sessionMinutes: number;
  demandStatus: 'none' | 'waiting' | 'connected';
}

export function useComputeDevices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [phoneState, setPhoneState] = useState<DeviceState>({
    isActive: false,
    isInstalled: true, // Hardcoded to true
    sessionId: null,
    sessionMinutes: 0,
    demandStatus: 'none'
  });
  
  const [laptopState, setLaptopState] = useState<DeviceState>({
    isActive: false,
    isInstalled: true, // Hardcoded to true
    sessionId: null,
    sessionMinutes: 0,
    demandStatus: 'none'
  });
  
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<'phone' | 'laptop' | null>(null);
  
  const phoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const laptopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phoneStartRef = useRef<Date | null>(null);
  const laptopStartRef = useRef<Date | null>(null);

  // Initialize device states (hardcoded simulation)
  useEffect(() => {
    if (!profile) return;
    
    const initializeDevices = async () => {
      setLoading(true);
      try {
        // Simulate fetching profile data
        // const { data: profileData } = await supabase... // Commented out Supabase call
        
        // Hardcode installed status
        setPhoneState(prev => ({
          ...prev,
          isInstalled: true,
          isActive: localStorage.getItem('phoneComputeActive') === 'true' // Load from local storage
        }));
        
        setLaptopState(prev => ({
          ...prev,
          isInstalled: true,
          isActive: localStorage.getItem('laptopComputeActive') === 'true' // Load from local storage
        }));

        // Simulate active sessions
        if (localStorage.getItem('phoneComputeActive') === 'true') {
          const startTime = new Date(localStorage.getItem('phoneComputeStartTime') || Date.now());
          const minutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
          setPhoneState(prev => ({
            ...prev,
            isActive: true,
            sessionId: 'simulated-phone-session',
            sessionMinutes: minutes,
            demandStatus: Math.random() > 0.5 ? 'connected' : 'waiting' // Simulate demand
          }));
          phoneStartRef.current = startTime;
        }

        if (localStorage.getItem('laptopComputeActive') === 'true') {
          const startTime = new Date(localStorage.getItem('laptopComputeStartTime') || Date.now());
          const minutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
          setLaptopState(prev => ({
            ...prev,
            isActive: true,
            sessionId: 'simulated-laptop-session',
            sessionMinutes: minutes,
            demandStatus: Math.random() > 0.5 ? 'connected' : 'waiting' // Simulate demand
          }));
          laptopStartRef.current = startTime;
        }

      } catch (error) {
        console.error("Error initializing devices (simulated):", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeDevices();
  }, [profile]);

  // Phone timer
  useEffect(() => {
    if (phoneState.isActive && phoneStartRef.current) {
      phoneIntervalRef.current = setInterval(() => {
        const minutes = Math.floor((Date.now() - phoneStartRef.current!.getTime()) / 60000);
        setPhoneState(prev => ({ ...prev, sessionMinutes: minutes }));
      }, 1000);
    } else {
      if (phoneIntervalRef.current) {
        clearInterval(phoneIntervalRef.current);
      }
    }
    return () => {
      if (phoneIntervalRef.current) clearInterval(phoneIntervalRef.current);
    };
  }, [phoneState.isActive]);

  // Laptop timer
  useEffect(() => {
    if (laptopState.isActive && laptopStartRef.current) {
      laptopIntervalRef.current = setInterval(() => {
        const minutes = Math.floor((Date.now() - laptopStartRef.current!.getTime()) / 60000);
        setLaptopState(prev => ({ ...prev, sessionMinutes: minutes }));
      }, 1000);
    } else {
      if (laptopIntervalRef.current) {
        clearInterval(laptopIntervalRef.current);
      }
    }
    return () => {
      if (laptopIntervalRef.current) clearInterval(laptopIntervalRef.current);
    };
  }, [laptopState.isActive]);

  const toggleDevice = async (device: 'phone' | 'laptop') => {
    if (!profile) return;
    
    const isPhone = device === 'phone';
    const currentState = isPhone ? phoneState : laptopState;
    const setState = isPhone ? setPhoneState : setLaptopState;
    
    setToggling(device);
    
    try {
      // Add delay for futuristic loading effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!currentState.isActive) {
        // Simulate Start session
        const startTime = new Date();
        localStorage.setItem(`${device}ComputeActive`, 'true');
        localStorage.setItem(`${device}ComputeStartTime`, startTime.toISOString());

        if (isPhone) {
          phoneStartRef.current = startTime;
        } else {
          laptopStartRef.current = startTime;
        }
        
        setState(prev => ({
          ...prev,
          isActive: true,
          sessionId: `simulated-${device}-session`,
          sessionMinutes: 0,
          demandStatus: 'waiting'
        }));
        
        // Simulate connecting to workload after 2-5 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, demandStatus: 'connected' }));
        }, Math.random() * 3000 + 2000);
        
        toast({
          title: `${isPhone ? 'Phone' : 'Laptop'} Compute Started! 🚀`,
          description: "You're now earning from your idle resources. 15% goes to education."
        });
      } else {
        // Simulate End session
        localStorage.setItem(`${device}ComputeActive`, 'false');
        localStorage.removeItem(`${device}ComputeStartTime`);

        const sessionEarnings = currentState.sessionMinutes * 0.001;
        
        toast({
          title: `${isPhone ? 'Phone' : 'Laptop'} Compute Stopped`,
          description: `You earned $${sessionEarnings.toFixed(4)} this session.`
        });
        
        setState(prev => ({
          ...prev,
          isActive: false,
          sessionId: null,
          sessionMinutes: 0,
          demandStatus: 'none'
        }));
        
        if (isPhone) {
          phoneStartRef.current = null;
        } else {
          laptopStartRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error toggling compute (simulated):", error);
      toast({
        title: "Simulated Error",
        description: "Failed to toggle compute sharing (simulated).",
        variant: "destructive"
      });
    } finally {
      setToggling(null);
    }
  };

  return {
    phoneState,
    laptopState,
    loading,
    toggling,
    toggleDevice
  };
}
