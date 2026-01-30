"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";
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
    isInstalled: false,
    sessionId: null,
    sessionMinutes: 0,
    demandStatus: 'none'
  });
  
  const [laptopState, setLaptopState] = useState<DeviceState>({
    isActive: false,
    isInstalled: false,
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

  // Initialize device states
  useEffect(() => {
    if (!profile) return;
    
    const initializeDevices = async () => {
      setLoading(true);
      try {
        // Fetch user profile with device info
        const { data: profileData } = await supabase
          .from("profiles")
          .select("phone_app_installed, laptop_software_installed, phone_compute_enabled, laptop_compute_enabled")
          .eq("id", profile.id)
          .maybeSingle();
          
        if (profileData) {
          // Auto-detect desktop and mark as installed
          const isDesktop = !/Mobi|Android/i.test(navigator.userAgent);
          const laptopInstalled = profileData.laptop_software_installed || isDesktop;
          
          setPhoneState(prev => ({
            ...prev,
            isInstalled: profileData.phone_app_installed || false
          }));
          
          setLaptopState(prev => ({
            ...prev,
            isInstalled: laptopInstalled
          }));
          
          // Update DB if desktop detected
          if (isDesktop && !profileData.laptop_software_installed) {
            await supabase
              .from("profiles")
              .update({ laptop_software_installed: true })
              .eq("id", profile.id);
          }
        }

        // Check for active sessions
        const { data: sessions } = await supabase
          .from("compute_sessions")
          .select("*")
          .eq("worker_id", profile.id)
          .eq("is_active", true);
          
        sessions?.forEach(session => {
          const startTime = new Date(session.started_at);
          const minutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
          
          if (session.device_type === 'mobile') {
            setPhoneState(prev => ({
              ...prev,
              isActive: true,
              sessionId: session.id,
              sessionMinutes: minutes,
              demandStatus: Math.random() > 0.5 ? 'connected' : 'waiting' // Simulate demand
            }));
            phoneStartRef.current = startTime;
          } else {
            setLaptopState(prev => ({
              ...prev,
              isActive: true,
              sessionId: session.id,
              sessionMinutes: minutes,
              demandStatus: Math.random() > 0.5 ? 'connected' : 'waiting' // Simulate demand
            }));
            laptopStartRef.current = startTime;
          }
        });
      } catch (error) {
        console.error("Error initializing devices:", error);
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
    const deviceType = isPhone ? 'mobile' : 'desktop';
    
    setToggling(device);
    
    try {
      if (!currentState.isActive) {
        // Start session
        const { data: session, error } = await supabase
          .from("compute_sessions")
          .insert({
            worker_id: profile.id,
            device_type: deviceType,
            is_active: true
          })
          .select()
          .single();
          
        if (error) throw error;
        
        const startTime = new Date();
        if (isPhone) {
          phoneStartRef.current = startTime;
        } else {
          laptopStartRef.current = startTime;
        }
        
        setState(prev => ({
          ...prev,
          isActive: true,
          sessionId: session.id,
          sessionMinutes: 0,
          demandStatus: 'waiting'
        }));
        
        // Simulate connecting to workload after 2-5 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, demandStatus: 'connected' }));
        }, Math.random() * 3000 + 2000);
        
        await supabase
          .from("profiles")
          .update({ [isPhone ? 'phone_compute_enabled' : 'laptop_compute_enabled']: true })
          .eq("id", profile.id);
        
        toast({
          title: `${isPhone ? 'Phone' : 'Laptop'} Compute Started! 🚀`,
          description: "You're now earning from your idle resources. 15% goes to education."
        });
      } else {
        // End session
        if (currentState.sessionId) {
          const sessionEarnings = currentState.sessionMinutes * 0.001;
          const eduAmount = sessionEarnings * 0.15;
          const workerAmount = sessionEarnings * 0.85;
          
          await supabase
            .from("compute_sessions")
            .update({
              is_active: false,
              ended_at: new Date().toISOString(),
              total_earned: sessionEarnings
            })
            .eq("id", currentState.sessionId);

          if (workerAmount > 0) {
            await supabase.from("transactions").insert([
              {
                profile_id: profile.id,
                amount: workerAmount,
                type: "earning",
                status: "completed",
                description: `ComputeShare ${isPhone ? 'phone' : 'laptop'} earnings (${currentState.sessionMinutes} min)`
              },
              {
                profile_id: profile.id,
                amount: eduAmount,
                type: "education_fund",
                status: "completed",
                description: `ComputeShare education contribution (15%)`
              }
            ]);
          }

          await supabase
            .from("profiles")
            .update({ [isPhone ? 'phone_compute_enabled' : 'laptop_compute_enabled']: false })
            .eq("id", profile.id);
          
          toast({
            title: `${isPhone ? 'Phone' : 'Laptop'} Compute Stopped`,
            description: `You earned $${sessionEarnings.toFixed(4)} this session.`
          });
        }
        
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
      console.error("Error toggling compute:", error);
      toast({
        title: "Error",
        description: "Failed to toggle compute sharing. Please try again.",
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
