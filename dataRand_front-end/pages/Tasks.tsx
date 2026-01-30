"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLocalTasks } from "@/hooks/useLocalTasks";
import { supabase, type Task, type TaskType } from "@/lib/supabase";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { GeometricBackground } from "@/components/ui/GeometricBackground";
import withAuth from "@/components/withAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { TaskSeeder } from "@/components/dev/TaskSeeder";
import { SupabaseTestPanel } from "@/components/dev/SupabaseTestPanel";

import {
  RefreshIcon,
  PowerIcon,
  SearchIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";
import { testSupabaseConnection, checkTasksTable } from "@/lib/supabase-test";
import { setupSampleData } from "@/lib/setup-data";
import { SupabaseDebugger, loadTasksWithDebug } from "@/lib/supabase-debug";


function Tasks() {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Import local tasks hook
  const { tasks: localTasks } = useLocalTasks();

  const fetchTasks = useCallback(async () => {
    if (!profile) {
      SupabaseDebugger.warn("No profile found, skipping task fetch");
      return;
    }
    
    SupabaseDebugger.log("Starting task fetch for profile:", profile.id);
    setLoading(true);
    
    try {
      // Run full diagnostic first
      const diagnostic = await SupabaseDebugger.runFullDiagnostic();
      
      if (!diagnostic.environment) {
        throw new Error("Environment variables not configured properly");
      }
      
      if (!diagnostic.connection) {
        throw new Error("Cannot connect to Supabase");
      }

      // Load task types with debugging
      SupabaseDebugger.log("Loading task types...");
      const { data: types, error: typesError } = await supabase
        .from("task_types")
        .select("*");
        
      if (typesError) {
        SupabaseDebugger.error("Failed to load task types:", typesError);
      } else {
        SupabaseDebugger.log("Task types loaded:", types?.length || 0);
        setTaskTypes(types as TaskType[] || []);
      }

      // Load tasks with enhanced debugging
      const taskResult = await loadTasksWithDebug();
      
      if (!taskResult.success) {
        throw new Error(taskResult.error);
      }

      // Filter by selected type if needed
      let filteredTasks = taskResult.data || [];
      
      // Add local tasks to the mix
      const localTasksFormatted = localTasks.map(localTask => ({
        ...localTask,
        // Convert local task format to match expected Task format
        task_type: { name: 'Local Task' }, // You might want to map this properly
      }));
      
      // Combine server tasks with local tasks
      const allTasks = [...filteredTasks, ...localTasksFormatted];
      
      if (selectedType && allTasks) {
        SupabaseDebugger.log("Filtering tasks by type:", selectedType);
        filteredTasks = allTasks.filter(task => task.task_type_id === selectedType);
        SupabaseDebugger.log("Filtered tasks count:", filteredTasks.length);
      } else {
        filteredTasks = allTasks;
      }

      setTasks(filteredTasks as Task[]);
      SupabaseDebugger.log("Tasks successfully set in state:", filteredTasks.length);
      
    } catch (err) {
      SupabaseDebugger.error("Task fetch failed:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      toast({
        title: "Failed to load tasks",
        description: `Error: ${errorMessage}. Check console for details.`,
        variant: "destructive",
      });
      
      setTasks([]);
    } finally {
      setLoading(false);
      SupabaseDebugger.log("Task fetch completed");
    }
  }, [profile, selectedType, toast]);

  // Enhanced connection test on mount
  useEffect(() => {
    const testConnection = async () => {
      SupabaseDebugger.log("=== COMPONENT MOUNT DIAGNOSTICS ===");
      
      // Run comprehensive diagnostic
      const diagnostic = await SupabaseDebugger.runFullDiagnostic();
      
      if (!diagnostic.environment) {
        toast({
          title: "Configuration Error",
          description: "Supabase environment variables are missing. Check your .env file.",
          variant: "destructive",
        });
        return;
      }
      
      if (!diagnostic.connection) {
        toast({
          title: "Connection Issue", 
          description: "Cannot connect to Supabase. Check your configuration.",
          variant: "destructive",
        });
        return;
      }
      
      if (!diagnostic.tasksTable) {
        toast({
          title: "Database Issue",
          description: "Tasks table is not accessible. Check your database setup.",
          variant: "destructive",
        });
        return;
      }
      
      SupabaseDebugger.log("All diagnostics passed ✓");
    };
    
    testConnection();
  }, [toast]);

  // Fetch tasks only once when profile loads or selectedType changes
  useEffect(() => {
    if (profile) {
      fetchTasks();
    }
  }, [profile, selectedType, fetchTasks, localTasks]);

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
    if (!profile) {
      SupabaseDebugger.warn("No profile found for task acceptance");
      return;
    }

    SupabaseDebugger.log("Accepting task:", { taskId, workerId: profile.id });

    try {
      // Create assignment
      SupabaseDebugger.log("Creating task assignment...");
      const { error: assignError } = await supabase
        .from("task_assignments")
        .insert({
          task_id: taskId,
          worker_id: profile.id,
          status: "accepted",
        });

      if (assignError) {
        SupabaseDebugger.error("Assignment creation failed:", assignError);
        
        let userMessage = "Failed to accept task. Please try again.";
        if (assignError.code === "23505") {
          userMessage = "You've already accepted this task.";
        } else if (assignError.message.includes("violates foreign key constraint")) {
          userMessage = "Task or worker not found. Please refresh and try again.";
        } else {
          userMessage = assignError.message; // Use Supabase error message if available
        }

        toast({
          title: "Failed to Accept Challenge",
          description: userMessage,
          variant: "destructive",
        });
        return; // Stop execution if assignment fails
      }

      SupabaseDebugger.log("Assignment created successfully ✓");

      // Update task status
      SupabaseDebugger.log("Updating task status to assigned...");
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: "assigned" })
        .eq("id", taskId);

      if (updateError) {
        SupabaseDebugger.error("Task status update failed:", updateError);
        // Even if task status update fails, the assignment was created.
        // We might want to log this for admin but still tell user it was accepted.
        // For now, we'll treat it as a failure to accept.
        toast({
          title: "Challenge Accepted (with issues)",
          description: "Task accepted, but there was an issue updating its status. Please check 'My Work'.",
          variant: "destructive",
        });
        return;
      }

      SupabaseDebugger.log("Task status updated successfully ✓");

      toast({
        title: "Challenge Accepted! 🦁",
        description: "Head to My Work to complete it.",
      });

      router.push("/my-work");
    } catch (err) {
      SupabaseDebugger.error("Task acceptance failed:", err);
      
      const errorMessage = err instanceof Error ? err.message : String(err); // Convert any error to string
      
      toast({
        title: "Error",
        description: `Failed to accept task: ${errorMessage}.`,
        variant: "destructive",
      });
    }
  };

  const handleSetupData = async () => {
    const result = await setupSampleData();
    if (result.success) {
      toast({
        title: "Success",
        description: "Sample data created successfully!",
      });
      fetchTasks();
    } else {
      toast({
        title: "Setup Failed", 
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">No profile found. Please sign in.</p>
          <Button onClick={() => router.push("/auth")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-4">
            <SupabaseTestPanel />
            <TaskSeeder />
          </div>
        )}

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
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="secondary"
                onClick={handleSetupData}
                className="w-full sm:w-fit gap-2 h-9 sm:h-10"
              >
                Setup Data
              </Button>
            )}
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
            <p><strong>Debug Info:</strong></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
              <p>Profile ID: {profile?.id}</p>
              <p>Tasks loaded: {tasks.length}</p>
              <p>Task types loaded: {taskTypes.length}</p>
              <p>Selected type: {selectedType || 'All'}</p>
              <p>Search query: "{searchQuery}"</p>
              <p>Filtered tasks: {filteredTasks.length}</p>
            </div>
          </div>
        )}

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