"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type Task, type TaskType } from "@/lib/supabase";
import { api } from "@/lib/datarand";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { GeometricBackground } from "@/components/ui/GeometricBackground";
import withAuth from "@/components/withAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";



import {
  RefreshIcon,
  PowerIcon,
  SearchIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";



function Tasks() {
  const { profile, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isPrivyOnlyProfile = Boolean(profile?.id?.startsWith("did:privy:"));
  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message
    if (err && typeof err === "object") {
      const maybeError = err as { message?: string; error?: string; details?: string }
      return maybeError.message || maybeError.error || maybeError.details || JSON.stringify(maybeError)
    }
    return "Unknown error"
  }

  const fetchTasks = useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    
    try {
      // Load task types
      const { data: types, error: typesError } = await supabase
        .from("task_types")
        .select("*");
        
      if (typesError) {
        throw typesError;
      }
      
      const loadedTaskTypes = types as TaskType[] || [];
      setTaskTypes(loadedTaskTypes);

      // Try to fetch from backend API
      try {
        const result = await api.getAvailableTasks();
        if (result.tasks && result.tasks.length > 0) {
          console.log(`Loaded ${result.tasks.length} tasks from backend API`);
        }
      } catch {
        console.log("Backend not available, using Supabase");
      }

      // Load tasks from Supabase
      let query = supabase
        .from("tasks")
        .select(`
          *,
          task_type:task_types(*)
        `)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (selectedType) {
        query = query.eq('task_type_id', selectedType);
      }
      
      const { data: tasks, error: tasksError } = await query;

      if (tasksError) {
        throw tasksError;
      }

      setTasks((tasks || []) as Task[]);
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      
      toast({
        title: "Failed to load tasks",
        description: errorMessage,
        variant: "destructive",
      });
      
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [profile, selectedType, toast]);

  useEffect(() => {
    if (profile) {
      fetchTasks();
    }
  }, [profile, selectedType, fetchTasks]);

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
      (payload: RealtimePostgresChangesPayload<Task>) => {
        const newTask = payload.new as Task; // ⬅️ force type

        toast({
          title: "🦁 New Task Available!",
          description: `"${newTask.title}" just posted.`,
        });

        fetchTasks();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile, fetchTasks, toast]);



  const handleAcceptTask = async (taskId: string) => {
    if (!profile) return;
    if (isPrivyOnlyProfile) {
      toast({
        title: "Profile sync required",
        description: "Your account is authenticated, but profile sync is still pending. Please retry in a moment.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Accepting task:", taskId, "for profile:", profile.id); // Debug log
      
      // Create assignment
      const { data: assignData, error: assignError } = await supabase
        .from("task_assignments")
        .insert({
          task_id: taskId,
          worker_id: profile.id,
          status: "accepted",
        })
        .select(); // Select the inserted data to log it

      if (assignError) {
        console.error("Assignment error:", assignError); // Debug log
        if (assignError.code === "23505") {
          // If it's a duplicate key error, it means the task was already accepted.
          // Treat this as a success and redirect to my-work.
          toast({
            title: "Challenge Already Accepted",
            description: "You've already accepted this task. Heading to My Work.",
          });
          router.push("/my-work");
          return;
        } else {
          // For any other error, show a destructive toast.
          toast({
            title: "Failed to Accept Challenge",
            description: assignError.message || "Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      console.log("Assignment created successfully:", assignData); // Debug log

      // Update task status
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: "assigned" })
        .eq("id", taskId);

      if (updateError) {
        console.error("Task update error:", updateError); // Debug log
        toast({
          title: "Challenge Accepted (with issues)",
          description: "Task accepted, but there was an issue updating its status.",
          variant: "destructive",
        });
        return;
      }

      console.log("Task status updated successfully"); // Debug log

      toast({
        title: "Challenge Accepted! 🦁",
        description: "Head to My Work to complete it.",
      });

      router.push("/my-work");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Accept task error:", err); // Debug log
      
      toast({
        title: "Error",
        description: `Failed to accept task: ${errorMessage}.`,
        variant: "destructive",
      });
    }
  };


  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!profile) {
    const authenticatedDisplayName =
      user?.google?.name ||
      user?.twitter?.name ||
      user?.github?.name ||
      user?.email?.address ||
      user?.id;

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {authLoading ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : user ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Signed in as <span className="font-medium">{authenticatedDisplayName}</span>.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                User profile API URL: <code>/api/v1/auth/profile</code>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No profile found. Please sign in.</p>
          )}
          {!authLoading && !user && (
            <Button onClick={() => router.push("/auth")}>Go to Sign In</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">


        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10">
                <PowerIcon size={18} className="sm:w-[22px] sm:h-[22px] text-primary" />
              </div>
              Available Challenges
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Accept tasks to prove your worth and earn rewards
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchTasks}
              disabled={loading}
              className="w-full sm:w-fit gap-2 h-9 sm:h-10"
            >
              <RefreshIcon size={16} className={`sm:w-[18px] sm:h-[18px] ${loading ? "animate-spin" : ""}`} />
              <span className="text-sm sm:text-base">Refresh</span>
            </Button>
          </div>
        </div>



        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="w-full sm:w-auto">
            <TaskFilters
              taskTypes={taskTypes}
              selectedType={selectedType}
              onSelectType={setSelectedType}
            />
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 sm:h-56 rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-12 sm:py-20 text-center rounded-2xl border border-dashed border-border">
            <GeometricBackground variant="ndebele" opacity={0.03} />
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-muted mb-4 sm:mb-5">
              <TaskIcon size={32} className="sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No challenges available</h3>
            <p className="text-muted-foreground max-w-sm text-sm sm:text-base px-4">
              The hunting grounds are quiet. Check back soon — new tasks are posted regularly.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

export default withAuth(Tasks);
