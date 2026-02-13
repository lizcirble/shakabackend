import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FuturisticLoading } from "@/components/ui/FuturisticLoading";
import { Smartphone, Laptop, Clock, Cpu, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import CONFIG from "@/lib/datarand";

interface DeviceToggleCardProps {
  deviceType: 'phone' | 'laptop';
  isEnabled: boolean;
  onToggle: () => void;
  isLoading: boolean;
  sessionMinutes?: number;
  demandStatus?: 'connected' | 'waiting' | 'none';
  currentDevice?: {
    name: string;
    type: 'phone' | 'laptop';
    os: string;
    browser: string;
  } | null;
  otherDeviceActive?: boolean;
}

export function DeviceToggleCard({
  deviceType,
  isEnabled,
  onToggle,
  isLoading,
  sessionMinutes = 0,
  demandStatus = 'none',
  currentDevice,
  otherDeviceActive = false
}: DeviceToggleCardProps) {
  const Icon = deviceType === 'phone' ? Smartphone : Laptop;
  const label = deviceType === 'phone' ? 'Phone' : 'Laptop';
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);

  // Check if this card represents the current device
  const isCurrentDevice = currentDevice?.type === deviceType;
  const isDisabled = !isCurrentDevice || (otherDeviceActive && !isEnabled);
  const displayedCpuUsage = isEnabled ? cpuUsage : 0;
  const displayedMemoryUsage = isEnabled ? memoryUsage : 0;
  const showMetricsUnavailable = isEnabled && metricsUnavailable;

  // Poll backend for live resource telemetry while active.
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let mounted = true;

    const parseMetrics = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return null;
      const obj = payload as Record<string, unknown>;
      const source =
        (obj.metrics as Record<string, unknown> | undefined) ||
        (obj.data as Record<string, unknown> | undefined) ||
        obj;

      const cpuRaw = source.cpuUsage ?? source.cpu_usage ?? source.cpuPercent ?? source.cpu_percent;
      const memoryRaw =
        source.memoryUsage ?? source.memory_usage ?? source.memoryPercent ?? source.memory_percent;

      const cpu = Number(cpuRaw);
      const memory = Number(memoryRaw);
      if (!Number.isFinite(cpu) || !Number.isFinite(memory)) return null;

      return {
        cpu: Math.max(0, Math.min(100, Math.round(cpu))),
        memory: Math.max(0, Math.min(100, Math.round(memory))),
      };
    };

    const fetchMetrics = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("datarand_token") : null;
      if (!token) {
        if (mounted) setMetricsUnavailable(true);
        return;
      }

      const baseUrl = CONFIG.API_BASE_URL;
      const candidates = [
        `${baseUrl}/compute/metrics?deviceType=${deviceType}`,
        `${baseUrl}/compute/metrics/${deviceType}`,
        `${baseUrl}/compute/status?deviceType=${deviceType}`,
      ];

      for (const url of candidates) {
        try {
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) continue;

          const payload = await response.json();
          const parsed = parseMetrics(payload);
          if (!parsed) continue;

          if (mounted) {
            setCpuUsage(parsed.cpu);
            setMemoryUsage(parsed.memory);
            setMetricsUnavailable(false);
          }
          return;
        } catch {
          // Try next candidate.
        }
      }

      if (mounted) setMetricsUnavailable(true);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isEnabled, deviceType]);

  const getDemandStatusText = () => {
    if (!isEnabled) return null;
    if (demandStatus === 'connected') return 'Connected to workload';
    if (demandStatus === 'waiting') return 'Waiting for demand...';
    return null;
  };

  const getDeviceStatusText = () => {
    if (!isCurrentDevice) {
      return `Not available (Current: ${currentDevice?.name || 'Unknown'})`;
    }
    if (otherDeviceActive && !isEnabled) {
      return 'Disabled (Other device active)';
    }
    if (isEnabled) {
      return 'Active and running';
    }
    return 'Ready to start';
  };

  const cardContent = (
    <Card 
      className={`border transition-all duration-300 ${
        isEnabled 
          ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent shadow-md shadow-primary/10' 
          : isDisabled
          ? 'border-border/30 bg-muted/30 opacity-60'
          : 'border-border/50 hover:border-primary/30' 
      }`}
    >
      <CardContent className="p-4">
        {isLoading ? (
          <FuturisticLoading message={`${isEnabled ? 'Stopping' : 'Starting'} ${label} compute...`} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  isEnabled 
                    ? 'bg-primary/20' 
                    : 'bg-muted'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isEnabled 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {isCurrentDevice ? currentDevice?.name || label : label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getDeviceStatusText()}
                  </span>
                  {isEnabled && sessionMinutes > 0 ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {sessionMinutes} min active
                    </span>
                  ) : getDemandStatusText() ? (
                    <span className={`text-xs mt-1 ${demandStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {getDemandStatusText()}
                    </span>
                  ) : null}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Switch 
                  checked={isEnabled}
                  onCheckedChange={onToggle}
                  disabled={isLoading || isDisabled}
                />
                <Badge 
                  variant={isEnabled ? "default" : "secondary"}
                  className="text-xs min-w-[60px] justify-center"
                >
                  {isEnabled ? "ACTIVE" : "OFF"}
                </Badge>
              </div>
            </div>

            {/* Live Resource Transparency */}
            {isEnabled && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Live Resource Transparency
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">CPU Usage</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{displayedCpuUsage}%</span>
                    </div>
                    <Progress value={displayedCpuUsage} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">Memory Usage</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{displayedMemoryUsage}%</span>
                    </div>
                    <Progress value={displayedMemoryUsage} className="h-1.5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {showMetricsUnavailable
                    ? "Live backend metrics unavailable right now."
                    : "Real-time backend metrics for your active device."}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return cardContent;
}
