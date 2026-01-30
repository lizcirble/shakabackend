import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FuturisticLoading } from "@/components/ui/FuturisticLoading";
import { Smartphone, Laptop, Clock, ExternalLink } from "lucide-react";

interface DeviceToggleCardProps {
  deviceType: 'phone' | 'laptop';
  isEnabled: boolean;
  onToggle: () => void;
  isLoading: boolean;
  sessionMinutes?: number;
  demandStatus?: 'connected' | 'waiting' | 'none';
}

export function DeviceToggleCard({
  deviceType,
  isEnabled,
  onToggle,
  isLoading,
  sessionMinutes = 0,
  demandStatus = 'none'
}: DeviceToggleCardProps) {
  const Icon = deviceType === 'phone' ? Smartphone : Laptop;
  const label = deviceType === 'phone' ? 'Phone' : 'Laptop';

  const getDemandStatusText = () => {
    if (!isEnabled) return null;
    if (demandStatus === 'connected') return 'Connected to workload';
    if (demandStatus === 'waiting') return 'Waiting for demand...';
    return null;
  };

  const cardContent = (
    <Card 
      className={`border transition-all duration-300 ${
        isEnabled 
          ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent shadow-md shadow-primary/10' 
          : 'border-border/50 hover:border-primary/30' 
      }`}
    >
      <CardContent className="p-4">
        {isLoading ? (
          <FuturisticLoading message={`${isEnabled ? 'Stopping' : 'Starting'} ${label} compute...`} />
        ) : (
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
                <span className="font-medium text-sm">{label}</span>
                {isEnabled && sessionMinutes > 0 ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {sessionMinutes} min
                  </span>
                ) : getDemandStatusText() ? (
                  <span className={`text-xs ${demandStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {getDemandStatusText()}
                  </span>
                ) : null}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch 
                checked={isEnabled}
                onCheckedChange={onToggle}
                disabled={isLoading}
              />
              <Badge 
                variant={isEnabled ? "default" : "secondary"}
                className="text-xs min-w-[60px] justify-center"
              >
                {isEnabled ? "ACTIVE" : "OFF"}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return cardContent;
}
