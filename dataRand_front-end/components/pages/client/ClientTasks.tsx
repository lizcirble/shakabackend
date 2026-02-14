"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type Task, type TaskAssignment } from "@/lib/supabase";
import { api } from "@/lib/datarand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Play,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TaskWithAssignments = Task & {
  task_assignments: (TaskAssignment & {
    worker: { full_name: string | null; email: string | null; reputation_score: number };
  })[];
};

export default function ClientTasks() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [tasks, setTasks] = useState<TaskWithAssignments[]>([]);
  const [backendTasks, setBackendTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    assignment: TaskAssignment | null;
    task: Task | null;
  }>({ open: false, assignment: null, task: null });
  const [feedback, setFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Handle tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["active", "pending", "completed"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
      return;
    }
    if (!authLoading && profile) {
      // Remove role check - allow all authenticated users
    }
  }, [authLoading, profile, router]);

  const fetchTasks = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Fetch from backend API
      try {
        const result = await api.getMyTasks();
        setBackendTasks(result.tasks || []);
      } catch (e) {
        console.log("Backend API not available, using Supabase only");
      }

      // Also fetch from Supabase for additional data
      const { data } = await supabase
        .from("tasks")
        .select(
          "*, task_assignments(*, worker:profiles(full_name, email, reputation_score))"
        )
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      setTasks((data as any) || []);
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
  }, [profile]);

  const handleReview = async (approved: boolean) => {
    if (!reviewDialog.assignment || !reviewDialog.task) return;

    setReviewLoading(true);
    try {
      // Use secure server-side function to process payment
      const { error } = await supabase.rpc('process_task_payment', {
        p_assignment_id: reviewDialog.assignment.id,
        p_approved: approved,
        p_feedback: feedback || undefined,
      });

      if (error) {
        throw error;
      }

      toast({
        title: approved ? "Work Approved" : "Work Rejected",
        description: approved
          ? "Payment has been released to the worker."
          : "The worker has been notified.",
      });

      setReviewDialog({ open: false, assignment: null, task: null });
      setFeedback("");
      fetchTasks();
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    available: "bg-blue-500/10 text-blue-500",
    assigned: "bg-yellow-500/10 text-yellow-500",
    in_progress: "bg-yellow-500/10 text-yellow-500",
    submitted: "bg-purple-500/10 text-purple-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    cancelled: "bg-muted text-muted-foreground",
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "active")
      return ["available", "assigned", "in_progress"].includes(task.status);
    if (activeTab === "pending")
      return task.status === "submitted";
    if (activeTab === "completed")
      return ["approved", "rejected"].includes(task.status);
    return true;
  });

  const activeTasksCount = tasks.filter(t => ["available", "assigned", "in_progress"].includes(t.status)).length;
  const pendingTasksCount = tasks.filter(t => t.status === "submitted").length;
  const completedTasksCount = tasks.filter(t => ["approved", "rejected"].includes(t.status)).length;

  if (authLoading || !profile) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your posted tasks
            </p>
          </div>
          <Link href="/client/create">
            <Button className="gradient-primary text-primary-foreground font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </Link>
        </div>

        {/* Mobile Filter Dropdown */}
        {isMobile ? (
          <div className="space-y-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Active ({activeTasksCount})
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pending Review ({pendingTasksCount})
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed ({completedTasksCount})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
                    <AlertCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No tasks found in this category.
                  </p>
                  <Link href="/client/create">
                    <Button className="gradient-primary text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const submittedAssignment = task.task_assignments?.find(
                    (a) => a.status === "submitted"
                  );

                  return (
                    <Card key={task.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
                      <CardContent className="py-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold truncate">
                                {task.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${statusColors[task.status]} border-current`}
                              >
                                {task.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  ${task.payout_amount.toFixed(2)}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDistanceToNow(new Date(task.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>

                          {submittedAssignment && (
                            <Button
                              onClick={() =>
                                setReviewDialog({
                                  open: true,
                                  assignment: submittedAssignment,
                                  task,
                                })
                              }
                              className="gradient-primary text-primary-foreground"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Submission
                            </Button>
                          )}
                        </div>

                        {submittedAssignment && (
                          <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                            <p className="text-sm text-purple-400">
                              <strong>Submitted by:</strong>{" "}
                              {submittedAssignment.worker?.full_name ||
                                submittedAssignment.worker?.email ||
                                "Worker"}
                              {" • "}
                              Reputation:{" "}
                              {submittedAssignment.worker?.reputation_score || 0}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
              <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Play className="h-4 w-4" />
                Active
                {activeTasksCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 bg-primary-foreground text-primary">
                    {activeTasksCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <AlertCircle className="h-4 w-4" />
                Pending Review
                {pendingTasksCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 bg-primary-foreground text-primary">
                    {pendingTasksCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CheckCircle className="h-4 w-4" />
                Completed
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
                    <AlertCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No tasks found in this category.
                  </p>
                  <Link href="/client/create">
                    <Button className="gradient-primary text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const submittedAssignment = task.task_assignments?.find(
                    (a) => a.status === "submitted"
                  );

                  return (
                    <Card key={task.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
                      <CardContent className="py-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold truncate">
                                {task.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${statusColors[task.status]} border-current`}
                              >
                                {task.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  ${task.payout_amount.toFixed(2)}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDistanceToNow(new Date(task.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>

                          {submittedAssignment && (
                            <Button
                              onClick={() =>
                                setReviewDialog({
                                  open: true,
                                  assignment: submittedAssignment,
                                  task,
                                })
                              }
                              className="gradient-primary text-primary-foreground"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Submission
                            </Button>
                          )}
                        </div>

                        {submittedAssignment && (
                          <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                            <p className="text-sm text-purple-400">
                              <strong>Submitted by:</strong>{" "}
                              {submittedAssignment.worker?.full_name ||
                                submittedAssignment.worker?.email ||
                                "Worker"}
                              {" • "}
                              Reputation:{" "}
                              {submittedAssignment.worker?.reputation_score || 0}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </Tabs>
        )}
        

        {/* Review Dialog */}
        <Dialog
          open={reviewDialog.open}
          onOpenChange={(open) =>
            setReviewDialog({ open, assignment: null, task: null })
          }
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Submission</DialogTitle>
              <DialogDescription>
                Review the worker's submission for "{reviewDialog.task?.title}"
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable content area */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {/* Task Question */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Task Question:</p>
                <p className="font-medium">{reviewDialog.task?.title}</p>
                {reviewDialog.task?.instructions && (
                  <p className="text-sm text-muted-foreground mt-2">{reviewDialog.task.instructions}</p>
                )}
              </div>

              {/* Worker's Answer */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-primary mb-2">Worker's Answer:</p>
                <p className="text-sm whitespace-pre-wrap">
                  {(reviewDialog.assignment?.submission_data as { answer?: string })?.answer 
                    || "No answer provided"}
                </p>
              </div>

              {/* Payment Breakdown */}
              {reviewDialog.task && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Payment Breakdown:</p>
                  <div className="flex justify-between text-sm">
                    <span>Worker Payment</span>
                    <span className="font-medium">${reviewDialog.task.payout_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee (15%)</span>
                    <span>${(reviewDialog.task.payout_amount * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Education Fund (15%)</span>
                    <span>${(reviewDialog.task.payout_amount * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex justify-between font-medium">
                    <span>Total Cost</span>
                    <span>${(reviewDialog.task.payout_amount * 1.30).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Feedback (optional)
                </label>
                <Textarea
                  placeholder="Provide feedback for the worker..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Always visible footer with proper button layout */}
            <DialogFooter className="flex-row gap-3 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => handleReview(false)}
                disabled={reviewLoading}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleReview(true)}
                disabled={reviewLoading}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve & Pay
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
    
  );
}
