"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type Task, type TaskType } from "@/lib/supabase";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { GeometricBackground } from "@/components/ui/GeometricBackground";
import {
  RefreshIcon,
  PowerIcon,
  SearchIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";

export default function Tasks() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");




  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch task types
      const { data: types } = await supabase.from("task_types").select("*");
      if (types) setTaskTypes(types as TaskType[]);

      // Fetch available tasks
      let query = supabase
        .from("tasks")
        .select("*, task_type:task_types(*)")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (selectedType) {
        query = query.eq("task_type_id", selectedType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        });
      } else {
        setTasks((data as Task[]) || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchTasks();
    }
  }, [profile, selectedType]);

  // Real-time subscription for new tasks
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: "status=eq.available",
        },
        (payload) => {
          toast({
            title: "🦁 New Task Available!",
            description: `"${(payload.new as Task).title}" just posted.`,
          });
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleAcceptTask = async (taskId: string) => {
    if (!profile) return;

    try {
      // Create assignment
      const { error: assignError } = await supabase
        .from("task_assignments")
        .insert({
          task_id: taskId,
          worker_id: profile.id,
          status: "accepted",
        });

      if (assignError) {
        if (assignError.code === "23505") {
          toast({
            title: "Already Accepted",
            description: "You've already accepted this task.",
            variant: "destructive",
          });
        } else {
          throw assignError;
        }
        return;
      }

      // Update task status
      await supabase
        .from("tasks")
        .update({ status: "assigned" })
        .eq("id", taskId);

      toast({
        title: "Challenge Accepted! 🦁",
        description: "Head to My Work to complete it.",
      });

      router.push("/my-work");
    } catch (err) {
      console.error("Error accepting task:", err);
      toast({
        title: "Error",
        description: "Failed to accept task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <PowerIcon size={22} className="text-primary" />
              </div>
              Available Challenges
            </h1>
            <p className="text-muted-foreground mt-1">
              Accept tasks to prove your worth and earn rewards
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchTasks}
            disabled={loading}
            className="w-fit gap-2"
          >
            <RefreshIcon size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <TaskFilters
            taskTypes={taskTypes}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
            <GeometricBackground variant="ndebele" opacity={0.03} />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-5">
              <TaskIcon size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No challenges available</h3>
            <p className="text-muted-foreground max-w-sm">
              The hunting grounds are quiet. Check back soon — new tasks are posted regularly.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onAccept={() => handleAcceptTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
