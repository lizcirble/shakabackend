"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type Task } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ClientDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalSpent: 0,
    pendingReview: 0,
  });

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
      return;
    }
    if (!authLoading && profile && profile.role !== "client") {
      router.push("/tasks");
    }
  }, [authLoading, profile, router]);

  useEffect(() => {
    if (!profile || profile.role !== "client") return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("client_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10);

        const allTasks = (data as Task[]) || [];
        setTasks(allTasks);

        // Calculate stats from all client tasks
        const { data: allClientTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("client_id", profile.id);

        const all = (allClientTasks as Task[]) || [];
        setStats({
          active: all.filter((t) =>
            ["available", "assigned", "in_progress"].includes(t.status)
          ).length,
          completed: all.filter((t) => t.status === "approved").length,
          totalSpent: all
            .filter((t) => t.status === "approved")
            .reduce((sum, t) => sum + Number(t.payout_amount), 0),
          pendingReview: all.filter((t) => t.status === "submitted").length,
        });
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (authLoading || !profile) {
    return null;
  }

  const statusColors: Record<string, string> = {
    available: "bg-blue-500/10 text-blue-500",
    assigned: "bg-yellow-500/10 text-yellow-500",
    in_progress: "bg-yellow-500/10 text-yellow-500",
    submitted: "bg-purple-500/10 text-purple-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Client Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your tasks and track progress
            </p>
          </div>
          <Link href="/client/create">
            <Button className="gradient-primary text-primary-foreground font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Active Tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold">{stats.active}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-transparent">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pending Review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold">{stats.pendingReview}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold">{stats.completed}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Spent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Tasks */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <Link href="/client/tasks">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <Briefcase className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No tasks yet. Create your first task!
                </p>
                <Link href="/client/create">
                  <Button className="gradient-primary text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${task.payout_amount.toFixed(2)} • Created{" "}
                        {formatDistanceToNow(new Date(task.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColors[task.status]}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
