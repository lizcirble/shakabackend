"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type TaskAssignment, type Task } from "@/lib/supabase";
import { formatPayoutAmount } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Textarea } from "@/components/ui/textarea";
import withAuth from "@/components/withAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  DollarSign,
  Image,
  Headphones,
  Brain,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

type AssignmentWithTask = TaskAssignment & {
  task: Task & { task_type: { name: string; description: string } };
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Play }> = {
  accepted: { label: "Ready to Start", color: "bg-blue-500/10 text-blue-500", icon: Play },
  in_progress: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
  submitted: { label: "Submitted", color: "bg-purple-500/10 text-purple-500", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500", icon: XCircle },
  abandoned: { label: "Abandoned", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const taskTypeIcons: Record<string, typeof Image> = {
  image_labeling: Image,
  audio_transcription: Headphones,
  ai_evaluation: Brain,
};

// Validation schema for answer
const answerSchema = z.object({
  answer: z.string().trim().min(1, "Answer is required").max(5000, "Answer must be less than 5000 characters"),
});

function MyWork() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<AssignmentWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const isMobile = useIsMobile();
  
  // Handle tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["active", "pending", "completed"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);
  
  // Answer dialog state
  const [answerDialog, setAnswerDialog] = useState<{
    open: boolean;
    assignment: AssignmentWithTask | null;
  }>({ open: false, assignment: null });
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

useEffect(() => {
  if (!authLoading && !profile) {
    router.push("/auth");
  }
}, [authLoading, profile, router]);


  const fetchAssignments = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      console.log("Fetching assignments for profile:", profile.id); // Debug log
      
      const { data, error } = await supabase
        .from("task_assignments")
        .select("*, task:tasks(*, task_type:task_types(*))")
        .eq("worker_id", profile.id);

      if (error) {
        console.error("Error fetching assignments:", error);
      } else {
        console.log("Fetched assignments:", data); // Debug log
        console.log("Assignment count:", data?.length || 0); // Debug log
        // Log media URLs for debugging
        data?.forEach((assignment: any) => {
          if (assignment.task?.media_url) {
            console.log("Task media URL:", assignment.task.media_url);
          }
        });
        setAssignments((data as any) || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchAssignments();
    }
  }, [profile]);

  const handleStartWork = async (assignmentId: string) => {
    try {
      console.log("Attempting to start work for assignmentId:", assignmentId); // Debug log
      const { data, error } = await supabase
        .from("task_assignments")
        .update({ status: "in_progress" })
        .eq("id", assignmentId)
        .select(); // Select the updated data to log it

      if (error) {
        console.error("Error updating assignment status:", error); // Debug log
        toast({
          title: "Error",
          description: "Failed to start work. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Assignment status updated successfully:", data); // Debug log

      toast({
        title: "Work Started",
        description: "Good luck! Submit when you're done.",
      });

      fetchAssignments();
    } catch (err) {
      console.error("Error in handleStartWork:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while starting work.",
        variant: "destructive",
      });
    }
  };

  const openAnswerDialog = (assignment: AssignmentWithTask) => {
    setAnswerDialog({ open: true, assignment });
    setAnswer("");
    setAnswerError("");
  };

  const handleSubmitWork = async () => {
    if (!answerDialog.assignment) return;

    // Validate answer
    const validation = answerSchema.safeParse({ answer });
    if (!validation.success) {
      setAnswerError(validation.error.errors[0]?.message || "Invalid answer");
      return;
    }

    setSubmitting(true);
    setAnswerError("");

    try {
      const currentAssignment = answerDialog.assignment;
      const isRetry = currentAssignment.status === "rejected";
      
      const { error: updateError } = await supabase
        .from("task_assignments")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          submission_data: { 
            answer: answer.trim(),
            submitted_at: new Date().toISOString(),
          },
          retry_count: isRetry ? currentAssignment.retry_count + 1 : currentAssignment.retry_count,
        })
        .eq("id", answerDialog.assignment.id);

      if (updateError) throw updateError;

      // Update task status to submitted
      const task = answerDialog.assignment.task;
      if (task?.id) {
        await supabase
          .from("tasks")
          .update({ status: "submitted" })
          .eq("id", task.id);

        // Notify client about pending review
        await supabase.from("notifications").insert({
          user_id: task.client_id,
          type: "pending_review",
          title: "New Submission to Review",
          message: `A worker has submitted their work for "${task.title}".`,
          task_id: task.id,
        });
      }

      toast({
        title: "Work Submitted! 🎉",
        description: "Your answer has been sent for client review.",
      });

      setAnswerDialog({ open: false, assignment: null });
      setAnswer("");
      fetchAssignments();
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to submit work. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const activeAssignments = assignments.filter((a) =>
    ["accepted", "in_progress"].includes(a.status)
  );
  const pendingAssignments = assignments.filter((a) => a.status === "submitted");
  const completedAssignments = assignments.filter((a) =>
    ["approved", "rejected"].includes(a.status)
  );

  if (authLoading) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Work
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and complete your accepted tasks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/client/tasks')}
              className="gradient-primary text-primary-foreground"
            >
              View My Tasks
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{assignments.length}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{completedAssignments.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
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
                    Active ({activeAssignments.length})
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pending Review ({pendingAssignments.length})
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed ({completedAssignments.length})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Status Banner */}
            {activeTab === "active" && activeAssignments.length > 0 && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Play className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  You have {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''} to complete
                </span>
              </div>
            )}
            {activeTab === "pending" && pendingAssignments.length > 0 && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  {pendingAssignments.length} task{pendingAssignments.length !== 1 ? 's' : ''} awaiting client review
                </span>
              </div>
            )}
            {activeTab === "completed" && completedAssignments.length > 0 && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {completedAssignments.length} task{completedAssignments.length !== 1 ? 's' : ''} completed
                </span>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === "active" && (
                  <AssignmentGrid
                    assignments={activeAssignments}
                    onStart={handleStartWork}
                    onOpenAnswer={openAnswerDialog}
                    emptyMessage="No active tasks. Go accept some tasks!"
                  />
                )}
                {activeTab === "pending" && (
                  <AssignmentGrid
                    assignments={pendingAssignments}
                    emptyMessage="No tasks pending review."
                    showSubmittedAnswer
                  />
                )}
                {activeTab === "completed" && (
                  <AssignmentGrid
                    assignments={completedAssignments}
                    emptyMessage="No completed tasks yet."
                    showSubmittedAnswer
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
              <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Play className="h-4 w-4" />
                Active
                {activeAssignments.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 bg-primary-foreground text-primary">
                    {activeAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <AlertCircle className="h-4 w-4" />
                Pending Review
                {pendingAssignments.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 bg-primary-foreground text-primary">
                    {pendingAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CheckCircle className="h-4 w-4" />
                Completed
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="active" className="space-y-4">
                  {activeAssignments.length > 0 && (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Play className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        You have {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''} to complete
                      </span>
                    </div>
                  )}
                  <AssignmentGrid
                    assignments={activeAssignments}
                    onStart={handleStartWork}
                    onOpenAnswer={openAnswerDialog}
                    emptyMessage="No active tasks. Go accept some tasks!"
                  />
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  {pendingAssignments.length > 0 && (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        {pendingAssignments.length} task{pendingAssignments.length !== 1 ? 's' : ''} awaiting client review
                      </span>
                    </div>
                  )}
                  <AssignmentGrid
                    assignments={pendingAssignments}
                    emptyMessage="No tasks pending review."
                    showSubmittedAnswer
                  />
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {completedAssignments.length > 0 && (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        {completedAssignments.length} task{completedAssignments.length !== 1 ? 's' : ''} completed
                      </span>
                    </div>
                  )}
                  <AssignmentGrid
                    assignments={completedAssignments}
                    emptyMessage="No completed tasks yet."
                    showSubmittedAnswer
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        )}

        {/* Answer Dialog */}
        <Dialog
          open={answerDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setAnswerDialog({ open: false, assignment: null });
              setAnswer("");
              setAnswerError("");
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Complete Task
              </DialogTitle>
              <DialogDescription>
                Answer the task question below. Your response will be reviewed by the client.
              </DialogDescription>
            </DialogHeader>

            {answerDialog.assignment && (
              <div className="space-y-4">
                {/* Media Preview */}
                {answerDialog.assignment.task.media_url && (
                  <div className="rounded-lg overflow-hidden border border-border bg-muted/50">
                    {answerDialog.assignment.task.media_type === 'video' ? (
                      <video 
                        src={answerDialog.assignment.task.media_url} 
                        controls 
                        className="w-full max-h-64 object-contain"
                        onError={(e) => {
                          console.error('Video failed to load:', answerDialog.assignment?.task.media_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <img 
                        src={answerDialog.assignment.task.media_url} 
                        alt="Task media" 
                        className="w-full max-h-64 object-contain"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Image failed to load:', answerDialog.assignment?.task.media_url);
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="p-4 text-center text-sm text-muted-foreground">
                              <p>Image failed to load</p>
                              <a href="${answerDialog.assignment?.task.media_url}" target="_blank" class="text-primary underline">Open in new tab</a>
                            </div>`;
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Task Question/Instructions */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Task:</p>
                  <h3 className="font-semibold text-lg mb-2">
                    {answerDialog.assignment.task.title}
                  </h3>
                  {answerDialog.assignment.task.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {answerDialog.assignment.task.description}
                    </p>
                  )}
                  {answerDialog.assignment.task.instructions && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Instructions:</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {answerDialog.assignment.task.instructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Answer Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    Your Answer
                  </label>
                  <Textarea
                    placeholder="Type your answer here... Be thorough and accurate."
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      if (answerError) setAnswerError("");
                    }}
                    rows={6}
                    className={answerError ? "border-destructive" : ""}
                    maxLength={5000}
                  />
                  <div className="flex justify-between text-xs">
                    {answerError ? (
                      <span className="text-destructive">{answerError}</span>
                    ) : (
                      <span className="text-muted-foreground">Enter your answer</span>
                    )}
                    <span className="text-muted-foreground">
                      {answer.length}/5000
                    </span>
                  </div>
                </div>

                {/* Payout info */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm">
                    You'll earn <strong className="text-primary">${formatPayoutAmount(answerDialog.assignment.task.payout_amount)}</strong> when approved
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAnswerDialog({ open: false, assignment: null })}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitWork}
                disabled={submitting || answer.trim().length < 1}
                className="gradient-primary text-primary-foreground"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function AssignmentGrid({
  assignments,
  onStart,
  onOpenAnswer,
  emptyMessage,
  showSubmittedAnswer,
}: {
  assignments: AssignmentWithTask[];
  onStart?: (id: string) => void;
  onOpenAnswer?: (assignment: AssignmentWithTask) => void;
  emptyMessage: string;
  showSubmittedAnswer?: boolean;
}) {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
          <AlertCircle className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
        {emptyMessage.includes("accept") && (
          <Button className="mt-4 gradient-primary text-primary-foreground" onClick={() => window.location.href = '/tasks'}>
            Browse Available Tasks
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
      {assignments.filter(a => a.task).map((assignment) => {
        const status = statusConfig[assignment.status];
        const StatusIcon = status.icon;
        const taskTypeName = assignment.task?.task_type?.name || "unknown";
        const TaskIcon = taskTypeIcons[taskTypeName] || Brain;
        const submissionData = assignment.submission_data as { answer?: string } | null;

        return (
          <Card key={assignment.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Badge variant="outline" className={`${status.color} border-current w-fit`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  <span className="text-xs">{status.label}</span>
                </Badge>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {assignment.task?.task_type?.name || "Unknown"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {assignment.started_at
                      ? formatDistanceToNow(new Date(assignment.started_at), {
                          addSuffix: true,
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Media thumbnail */}
              {assignment.task?.media_url && (
                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                  {assignment.task?.media_type === 'video' ? (
                    <video 
                      src={assignment.task?.media_url} 
                      className="w-full h-32 object-cover"
                      muted
                      onError={(e) => {
                        console.error('Video thumbnail failed:', assignment.task?.media_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img 
                      src={assignment.task?.media_url} 
                      alt="Task media" 
                      className="w-full h-32 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Image thumbnail failed:', assignment.task?.media_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <TaskIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold line-clamp-1">
                    {assignment.task?.title || "Unknown Task"}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {assignment.task?.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    ${formatPayoutAmount(assignment.task?.payout_amount ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>~{assignment.task?.estimated_time_minutes ?? 5} min</span>
                </div>
              </div>

              {/* Show submitted answer */}
              {showSubmittedAnswer && submissionData?.answer && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                  <p className="text-sm line-clamp-3">{submissionData.answer}</p>
                </div>
              )}

              {assignment.status === "approved" && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-500 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Payment of ${formatPayoutAmount(assignment.task?.payout_amount ?? 0)} added to earnings</span>
                </div>
              )}

              {assignment.status === "rejected" && (assignment as any).client_feedback && (
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
                  <p className="font-medium mb-1">Feedback:</p>
                  <p>{(assignment as any).client_feedback}</p>
                </div>
              )}
            </CardContent>

            {(assignment.status === "accepted" || assignment.status === "in_progress" || (assignment.status === "rejected" && assignment.retry_count < 1)) && (
              <CardFooter className="gap-2">
                {assignment.status === "accepted" && onStart && (
                  <Button
                    onClick={() => {
                      console.log("Assignment ID for Start Working:", assignment.id);
                      onStart(assignment.id);
                    }}
                    className="flex-1 gradient-primary text-primary-foreground"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Working
                  </Button>
                )}
                {assignment.status === "in_progress" && onOpenAnswer && (
                  <Button
                    onClick={() => onOpenAnswer(assignment)}
                    className="flex-1 gradient-primary text-primary-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Answer & Submit
                  </Button>
                )}
                {assignment.status === "rejected" && assignment.retry_count < 1 && onOpenAnswer && (
                  <Button
                    onClick={() => onOpenAnswer(assignment)}
                    variant="outline"
                    className="flex-1 border-primary text-primary hover:bg-primary/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry (1 attempt left)
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default withAuth(MyWork);


