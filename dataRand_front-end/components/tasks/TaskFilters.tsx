import { TaskType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ImageLabelIcon,
  AudioIcon,
  AIIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { Camera, Mic, Brain, Grid3X3 } from "lucide-react";

const taskTypeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  image_labeling: Camera,
  audio_transcription: Mic,
  ai_evaluation: Brain,
  data_entry: Grid3X3,
  content_moderation: ImageLabelIcon,
  translation: AIIcon,
  survey: TaskIcon,
};

type TaskFiltersProps = {
  taskTypes: TaskType[];
  selectedType: string | null;
  onSelectType: (typeId: string | null) => void;
};

export function TaskFilters({
  taskTypes,
  selectedType,
  onSelectType,
}: TaskFiltersProps) {
  const isMobile = useIsMobile();

  const getSelectedLabel = () => {
    if (!selectedType) return "All Tasks";
    const type = taskTypes.find(t => t.id === selectedType);
    return type ? type.name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "All Tasks";
  };

  if (isMobile) {
    return (
      <Select value={selectedType || "all"} onValueChange={(value) => onSelectType(value === "all" ? null : value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getSelectedLabel()} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <TaskIcon size={16} />
              All Tasks
            </div>
          </SelectItem>
          {taskTypes.map((type) => {
            const Icon = taskTypeIcons[type.name] || TaskIcon;
            return (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  {type.name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <Button
        variant={selectedType === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectType(null)}
        className={`${selectedType === null ? "gradient-primary text-primary-foreground" : ""} flex-shrink-0`}
      >
        <TaskIcon size={16} className="mr-1.5" />
        All Tasks
      </Button>

      {taskTypes.map((type) => {
        const Icon = taskTypeIcons[type.name] || TaskIcon;
        const isSelected = selectedType === type.id;

        return (
          <Button
            key={type.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectType(type.id)}
            className={`${isSelected ? "gradient-primary text-primary-foreground" : ""} flex-shrink-0`}
          >
            <Icon size={16} className="mr-1.5" />
            <span className="hidden sm:inline">
              {type.name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
            <span className="sm:hidden">
              {type.name.split("_")[0].replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
