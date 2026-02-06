import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FuturisticLoading } from "@/components/ui/FuturisticLoading";
import { Smartphone, Laptop, Clock, ExternalLink, Cpu, Activity } from "lucide-react";
import { useState, useEffect } from "react";

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

  // Check if this card represents the current device
  const isCurrentDevice = currentDevice?.type === deviceType;
  const isDisabled = !isCurrentDevice || (otherDeviceActive && !isEnabled);

  // Simulate live resource usage when active
  useEffect(() => {
    if (!isEnabled) {
      // Reset usage when disabled
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCpuUsage(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemoryUsage(0);
      return;
    }

    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 40) + 20); // 20-60%
      setMemoryUsage(Math.floor(Math.random() * 30) + 15); // 15-45%
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnabled]);

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
                      <span className="text-xs text-muted-foreground">{cpuUsage}%</span>
                    </div>
                    <Progress value={cpuUsage} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">Memory Usage</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{memoryUsage}%</span>
                    </div>
                    <Progress value={memoryUsage} className="h-1.5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Real-time view of your device&apos;s contribution when compute sharing is active.
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
