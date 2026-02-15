"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useGlobalMetrics } from "./useGlobalMetrics";
import { api } from "@/lib/datarand";

export interface DeviceState {
  isActive: boolean;
  isInstalled: boolean;
  sessionId: string | null;
  sessionMinutes: number;
  demandStatus: 'none' | 'waiting' | 'connected';
  deviceId?: string | null;
}

export function useComputeDevices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { addComputeSession } = useGlobalMetrics();
  
  const [phoneState, setPhoneState] = useState<DeviceState>({
    isActive: false,
    isInstalled: true, // Hardcoded to true
    sessionId: null,
    sessionMinutes: 0,
    demandStatus: 'none',
    deviceId: null
  });
  
  const [laptopState, setLaptopState] = useState<DeviceState>({
    isActive: false,
    isInstalled: true, // Hardcoded to true
    sessionId: null,
    sessionMinutes: 0,
    demandStatus: 'none',
    deviceId: null
  });
  
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<'phone' | 'laptop' | null>(null);
  const [currentDevice, setCurrentDevice] = useState<{
    name: string;
    type: 'phone' | 'laptop';
    os: string;
    browser: string;
  } | null>(null);
  
  const phoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const laptopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phoneStartRef = useRef<Date | null>(null);
  const laptopStartRef = useRef<Date | null>(null);
  const phoneHeartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const laptopHeartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Detect device specs
  const detectDeviceSpecs = async () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    let os = 'Unknown';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
    
    const deviceType = isMobile ? 'phone' : 'laptop';
    const deviceName = `${os} ${deviceType === 'phone' ? 'Phone' : 'Computer'}`;
    
    const ram_gb = (navigator as any).deviceMemory || (isMobile ? 4 : 8);
    const cpu_cores = navigator.hardwareConcurrency || (isMobile ? 4 : 8);
    let storage_gb = 128;
    
    if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
      try {
        const estimate = await (navigator as any).storage.estimate();
        storage_gb = Math.round((estimate.quota || 0) / (1024 ** 3));
      } catch (e) {
        console.log('Storage estimate not available');
      }
    }
    
    return { device_name: deviceName, device_type: deviceType, ram_gb, cpu_cores, storage_gb };
  };

  // Helper: Start heartbeat
  const startHeartbeat = async (device: 'phone' | 'laptop', deviceId: string) => {
    const heartbeatRef = device === 'phone' ? phoneHeartbeatRef : laptopHeartbeatRef;
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    heartbeatRef.current = setInterval(async () => {
      try {
        await api.sendHeartbeat(deviceId);
        console.log(`Heartbeat sent for ${device}`);
      } catch (error) {
        console.error(`Heartbeat failed for ${device}:`, error);
      }
    }, 90000); // 90 seconds
  };

  // Helper: Stop heartbeat
  const stopHeartbeat = async (device: 'phone' | 'laptop', deviceId: string | null) => {
    const heartbeatRef = device === 'phone' ? phoneHeartbeatRef : laptopHeartbeatRef;
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (deviceId) {
      try {
        await api.deactivateDevice(deviceId);
        console.log(`Device deactivated: ${device}`);
      } catch (error) {
        console.error(`Failed to deactivate ${device}:`, error);
      }
    }
  };

  // Detect current device
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      
      // Detect device type
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const deviceType = isMobile ? 'phone' : 'laptop';
      
      // Detect OS
      let os = 'Unknown';
      if (/Windows/i.test(userAgent)) os = 'Windows';
      else if (/Mac/i.test(userAgent)) os = 'macOS';
      else if (/Linux/i.test(userAgent)) os = 'Linux';
      else if (/Android/i.test(userAgent)) os = 'Android';
      else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
      
      // Detect browser
      let browser = 'Unknown';
      if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';
      else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
      else if (/Edge/i.test(userAgent)) browser = 'Edge';
      
      // Generate device name
      const deviceName = `${os} ${deviceType === 'phone' ? 'Phone' : 'Computer'}`;
      
      setCurrentDevice({
        name: deviceName,
        type: deviceType,
        os,
        browser
      });
    };
    
    detectDevice();
  }, []);

  // Initialize device states
  useEffect(() => {
    if (!profile || !currentDevice) return;
    
    const initializeDevices = async () => {
      setLoading(true);
      try {
        // Load from local storage
        const phoneActive = localStorage.getItem('phoneComputeActive') === 'true';
        const laptopActive = localStorage.getItem('laptopComputeActive') === 'true';
        
        // Ensure only one device can be active at a time
        if (phoneActive && laptopActive) {
          localStorage.setItem('phoneComputeActive', 'false');
          localStorage.setItem('laptopComputeActive', 'false');
        }
        
        setPhoneState(prev => ({
          ...prev,
          isActive: phoneActive && !laptopActive
        }));
        
        setLaptopState(prev => ({
          ...prev,
          isActive: laptopActive && !phoneActive
        }));

        // Restore active sessions
        if (phoneActive && !laptopActive) {
          const startTime = new Date(localStorage.getItem('phoneComputeStartTime') || Date.now());
          const minutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
          setPhoneState(prev => ({
            ...prev,
            isActive: true,
            sessionId: 'phone-session',
            sessionMinutes: minutes,
            demandStatus: 'connected'
          }));
          phoneStartRef.current = startTime;
        }

        if (laptopActive && !phoneActive) {
          const startTime = new Date(localStorage.getItem('laptopComputeStartTime') || Date.now());
          const minutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
          setLaptopState(prev => ({
            ...prev,
            isActive: true,
            sessionId: 'laptop-session',
            sessionMinutes: minutes,
            demandStatus: 'connected'
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
  }, [profile, currentDevice]);

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
    const otherState = isPhone ? laptopState : phoneState;
    const setState = isPhone ? setPhoneState : setLaptopState;
    const setOtherState = isPhone ? setLaptopState : setPhoneState;
    
    // Prevent toggling if other device is active
    if (!currentState.isActive && otherState.isActive) {
      toast({
        title: "Only One Device Allowed",
        description: `Please stop ${isPhone ? 'laptop' : 'phone'} compute sharing first.`,
        variant: "destructive"
      });
      return;
    }
    
    setToggling(device);
    
    try {
      // Add delay for futuristic loading effect (longer animation)
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      if (!currentState.isActive) {
        // Stop other device if somehow active
        if (otherState.isActive) {
          const otherDevice = isPhone ? 'laptop' : 'phone';
          const otherDeviceId = isPhone ? laptopState.deviceId : phoneState.deviceId;
          await stopHeartbeat(otherDevice, otherDeviceId || null);
          localStorage.setItem(`${otherDevice}ComputeActive`, 'false');
          localStorage.removeItem(`${otherDevice}ComputeStartTime`);
          setOtherState(prev => ({
            ...prev,
            isActive: false,
            sessionId: null,
            sessionMinutes: 0,
            demandStatus: 'none',
            deviceId: null
          }));
        }
        
        // Register device and start heartbeat
        let registeredDeviceId = null;
        try {
          const specs = await detectDeviceSpecs();
          const response = await api.registerDevice(specs);
          registeredDeviceId = response.data.id;
          await startHeartbeat(device, registeredDeviceId);
        } catch (error) {
          console.error('Failed to register device:', error);
        }
        
        // Start current device
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
          demandStatus: 'waiting',
          deviceId: registeredDeviceId
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
        // Stop heartbeat
        await stopHeartbeat(device, currentState.deviceId || null);
        
        // End session and save to database
        localStorage.setItem(`${device}ComputeActive`, 'false');
        localStorage.removeItem(`${device}ComputeStartTime`);

        const startTime = isPhone ? phoneStartRef.current : laptopStartRef.current;
        const sessionMinutes = startTime
          ? Math.max(1, Math.floor((Date.now() - startTime.getTime()) / 60000))
          : Math.max(1, currentState.sessionMinutes);
        const sessionEarnings = sessionMinutes * 0.001;
        
        // Save session to database
        try {
          await addComputeSession(sessionMinutes, sessionEarnings, device);
        } catch (error) {
          console.error('Error saving compute session:', error);
        }
        
        toast({
          title: `${isPhone ? 'Phone' : 'Laptop'} Compute Stopped`,
          description: `You earned $${sessionEarnings.toFixed(4)} this session.`
        });
        
        setState(prev => ({
          ...prev,
          isActive: false,
          sessionId: null,
          sessionMinutes: 0,
          demandStatus: 'none',
          deviceId: null
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (phoneHeartbeatRef.current) clearInterval(phoneHeartbeatRef.current);
      if (laptopHeartbeatRef.current) clearInterval(laptopHeartbeatRef.current);
    };
  }, []);

  return {
    phoneState,
    laptopState,
    loading,
    toggling,
    toggleDevice,
    currentDevice
  };
}
