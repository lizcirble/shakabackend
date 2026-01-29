"use client";

import { useEffect, useState, useCallback } from "react";
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
import withAuth from "@/components/withAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { TaskSeeder } from "@/components/dev/TaskSeeder";

import {
  RefreshIcon,
  PowerIcon,
  SearchIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";
import { testSupabaseConnection, checkTasksTable } from "@/lib/supabase-test";

function Tasks() {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { data: types, error: typesError } = await supabase
        .from("task_types")
        .select("*");
        
      if (!typesError) {
        setTaskTypes(types as TaskType[] || []);
      }

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (selectedType) {
        query = query.eq("task_type_id", selectedType);
      }

      const { data: tasksData, error: tasksError } = await query;

      if (tasksError) {
        toast({
          title: "Failed to fetch tasks",
          description: "Please check your Supabase configuration and try again.",
          variant: "destructive",
        });
        setTasks([]);
      } else {
        setTasks((tasksData as Task[]) || []);
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to database. Check your environment variables.",
        variant: "destructive",
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [profile, selectedType, toast]);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        toast({
          title: "Connection Issue",
          description: `Database connection failed: ${connectionTest.error}`,
          variant: "destructive",
        });
      }
      
      const tasksTableTest = await checkTasksTable();
      if (!tasksTableTest.success) {
        toast({
          title: "Database Issue",
          description: `Tasks table not accessible: ${tasksTableTest.error}`,
          variant: "destructive",
        });
      }
    };
    
    testConnection();
  }, [toast]);

  // Fetch tasks only once when profile loads or selectedType changes
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
        {process.env.NODE_ENV === 'development' && <TaskSeeder />}

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