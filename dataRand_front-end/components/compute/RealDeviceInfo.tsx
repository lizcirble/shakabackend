"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, Activity, Monitor, CheckCircle, XCircle } from "lucide-react";

interface DeviceInfo {
  ram_gb: number;
  cpu_cores: number;
  storage_gb: number;
  platform: string;
  userAgent: string;
  hasMemoryAPI: boolean;
  hasStorageAPI: boolean;
}

export function RealDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const detectDevice = async () => {
      // Real RAM from browser (Chrome/Edge only)
      const ram_gb = (navigator as any).deviceMemory || 0;
      
      // Real CPU cores
      const cpu_cores = navigator.hardwareConcurrency || 0;
      
      // Real storage estimate
      let storage_gb = 0;
      let hasStorageAPI = false;
      if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
        try {
          const estimate = await (navigator as any).storage.estimate();
          storage_gb = Math.round((estimate.quota || 0) / (1024 ** 3));
          hasStorageAPI = true;
        } catch (e) {
          console.log('Storage API not available');
        }
      }

      // Check if memory API is available
      const hasMemoryAPI = 'memory' in performance;

      setDeviceInfo({
        ram_gb,
        cpu_cores,
        storage_gb,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        hasMemoryAPI,
        hasStorageAPI
      });
    };

    detectDevice();
  }, []);

  if (!deviceInfo) return null;

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-500" />
          Your Device Specs (Real Data)
        </CardTitle>
        <CardDescription>
          Detected from browser APIs - this is what we share with the network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {deviceInfo.ram_gb > 0 ? `${deviceInfo.ram_gb} GB` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">RAM</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Cpu className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {deviceInfo.cpu_cores > 0 ? deviceInfo.cpu_cores : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">CPU Cores</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {deviceInfo.storage_gb > 0 ? `${deviceInfo.storage_gb} GB` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">Storage Quota</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-sm font-medium">Browser API Support:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={deviceInfo.ram_gb > 0 ? "default" : "secondary"} className="text-xs">
              {deviceInfo.ram_gb > 0 ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Device Memory API
            </Badge>
            <Badge variant={deviceInfo.cpu_cores > 0 ? "default" : "secondary"} className="text-xs">
              {deviceInfo.cpu_cores > 0 ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Hardware Concurrency
            </Badge>
            <Badge variant={deviceInfo.hasStorageAPI ? "default" : "secondary"} className="text-xs">
              {deviceInfo.hasStorageAPI ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Storage API
            </Badge>
            <Badge variant={deviceInfo.hasMemoryAPI ? "default" : "secondary"} className="text-xs">
              {deviceInfo.hasMemoryAPI ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Memory API
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Platform: {deviceInfo.platform}
          </p>
          {deviceInfo.ram_gb === 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
              ⚠️ Use Chrome or Edge browser for full device detection. Firefox/Safari have limited APIs.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
