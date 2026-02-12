import { Task } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  ClockIcon,
  EarningsIcon,
  ImageLabelIcon,
  AudioIcon,
  AIIcon,
  ArrowRightIcon,
} from "@/components/icons/DataRandIcons";
import { CornerAccent } from "@/components/ui/GeometricBackground";

const taskTypeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  image_labeling: ImageLabelIcon,
  audio_transcription: AudioIcon,
  ai_evaluation: AIIcon,
};

const taskTypeColors: Record<string, string> = {
  image_labeling: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  audio_transcription: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ai_evaluation: "bg-green-500/10 text-green-400 border-green-500/20",
};

type TaskCardProps = {
  task: Task;
  onAccept?: () => void;
  showAccept?: boolean;
};

export function TaskCard({ task, onAccept, showAccept = true }: TaskCardProps) {
  const { profile } = useAuth();
  const isOwnTask = profile?.id === task.client_id;

  const taskTypeName = task.task_type?.name || "unknown";
  const Icon = taskTypeIcons[taskTypeName] || AIIcon;
  const colorClass = taskTypeColors[taskTypeName] || "bg-muted text-muted-foreground";

  const acceptButton = (
    <Button
      onClick={onAccept}
      disabled={isOwnTask}
      className="w-full h-10 gradient-primary text-primary-foreground font-semibold group/btn hover:shadow-md transition-all duration-300 group-hover:scale-105"
    >
      <span className="hidden sm:inline">Accept Challenge</span>
      <span className="sm:hidden">Accept</span>
      <ArrowRightIcon size={16} className="ml-2 group-hover/btn:translate-x-2 transition-transform duration-300" />
    </Button>
  );

  return (
    <Card className="group relative overflow-hidden border border-border/50 bg-card hover:border-primary/50 hover:shadow-sm transition-all duration-500 h-full flex flex-col hover:scale-[1.02] hover:-translate-y-1">
      {/* Futuristic scanning line effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-transparent via-primary to-transparent animate-pulse" style={{ animationDelay: '0.3s' }} />
      </div>

      <div className="absolute top-0 left-0 w-8 h-8 opacity-0 group-hover:opacity-30 transition-all duration-500 transform group-hover:scale-110">
        <div className="absolute top-2 left-2 w-4 h-0.5 bg-primary" />
        <div className="absolute top-2 left-2 w-0.5 h-4 bg-primary" />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-30 transition-all duration-500 transform group-hover:scale-110">
        <div className="absolute bottom-2 right-2 w-4 h-0.5 bg-primary" />
        <div className="absolute bottom-2 right-2 w-0.5 h-4 bg-primary" />
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Priority indicator */}
      {task.priority > 1 && (
        <div className="absolute top-3 right-3 flex gap-0.5 z-10">
          <div className="w-0.5 h-4 bg-primary rounded-full transform -rotate-12 group-hover:animate-pulse" />
          <div className="w-0.5 h-4 bg-primary rounded-full group-hover:animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="w-0.5 h-4 bg-primary rounded-full transform rotate-12 group-hover:animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      )}

      <CardHeader className="pb-3 p-4 sm:p-6 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className={`${colorClass} font-medium gap-1.5 text-xs group-hover:border-primary/40 group-hover:shadow-sm transition-all duration-300`}>
            <Icon size={12} className="group-hover:animate-pulse" />
            <span className="hidden sm:inline">{task.task_type?.description || taskTypeName.replace("_", " ")}</span>
            <span className="sm:hidden">{(task.task_type?.description || taskTypeName.replace("_", " ")).split(" ")[0]}</span>
          </Badge>
          <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors duration-300">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-6 pt-0 flex-1 relative z-10">
        <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {task.title}
        </h3>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors duration-300">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:shadow-sm transition-all duration-300">
              <EarningsIcon size={14} className="text-primary group-hover:animate-pulse" />
            </div>
            <span className="font-bold text-lg text-primary group-hover:text-primary/90 transition-colors duration-300">
              ${task.payout_amount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">
            <ClockIcon size={14} className="group-hover:animate-pulse" />
            <span>~{task.estimated_time_minutes}m</span>
          </div>
        </div>
      </CardContent>

      {showAccept && onAccept && (
        <CardFooter className="pt-0 p-4 sm:p-6 relative z-10">
          {isOwnTask ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  {acceptButton}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You cannot accept a task you created.</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            acceptButton
          )}
        </CardFooter>
      )}
    </Card>
  );
}
