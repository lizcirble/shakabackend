"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type TaskAssignment, type Task } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      const { data, error } = await supabase
        .from("task_assignments")
        .select("*, task:tasks(*, task_type:task_types(*))")
        .eq("worker_id", profile.id)
        .order("started_at", { ascending: false });

      if (error) {
        console.error("Error fetching assignments:", error);
      } else {
        setAssignments((data as AssignmentWithTask[]) || []);
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
      await supabase
        .from("task_assignments")
        .update({ status: "in_progress" })
        .eq("id", assignmentId);

      toast({
        title: "Work Started",
        description: "Good luck! Submit when you're done.",
      });

      fetchAssignments();
    } catch (err) {
      console.error("Error:", err);
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
      await supabase
        .from("task_assignments")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          submission_data: { 
            answer: answer.trim(),
            submitted_at: new Date().toISOString(),
          },
        })
        .eq("id", answerDialog.assignment.id);

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
        <div>
          <h1 className="text-2xl font-display font-bold">My Work</h1>
          <p className="text-muted-foreground">
            Track and complete your accepted tasks
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="gap-2">
              Active
              {activeAssignments.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {activeAssignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending Review
              {pendingAssignments.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {pendingAssignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="active">
                <AssignmentGrid
                  assignments={activeAssignments}
                  onStart={handleStartWork}
                  onOpenAnswer={openAnswerDialog}
                  emptyMessage="No active tasks. Go accept some tasks!"
                />
              </TabsContent>

              <TabsContent value="pending">
                <AssignmentGrid
                  assignments={pendingAssignments}
                  emptyMessage="No tasks pending review."
                  showSubmittedAnswer
                />
              </TabsContent>

              <TabsContent value="completed">
                <AssignmentGrid
                  assignments={completedAssignments}
                  emptyMessage="No completed tasks yet."
                  showSubmittedAnswer
                />
              </TabsContent>
            </>
          )}
        </Tabs>

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
                      />
                    ) : (
                      <img 
                        src={answerDialog.assignment.task.media_url} 
                        alt="Task media" 
                        className="w-full max-h-64 object-contain"
                        loading="lazy"
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
                    You'll earn <strong className="text-primary">${answerDialog.assignment.task.payout_amount.toFixed(2)}</strong> when approved
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assignments.filter(a => a.task).map((assignment) => {
        const status = statusConfig[assignment.status];
        const StatusIcon = status.icon;
        const taskTypeName = assignment.task?.task_type?.name || "unknown";
        const TaskIcon = taskTypeIcons[taskTypeName] || Brain;
        const submissionData = assignment.submission_data as { answer?: string } | null;

        return (
          <Card key={assignment.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(assignment.started_at), {
                    addSuffix: true,
                  })}
                </span>
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
                    />
                  ) : (
                    <img 
                      src={assignment.task?.media_url} 
                      alt="Task media" 
                      className="w-full h-32 object-cover"
                      loading="lazy"
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

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    ${(assignment.task?.payout_amount ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
                  <span>Payment of ${(assignment.task?.payout_amount ?? 0).toFixed(2)} added to earnings</span>
                </div>
              )}

              {assignment.status === "rejected" && assignment.client_feedback && (
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
                  <p className="font-medium mb-1">Feedback:</p>
                  <p>{assignment.client_feedback}</p>
                </div>
              )}
            </CardContent>

            {(assignment.status === "accepted" || assignment.status === "in_progress") && (
              <CardFooter className="gap-2">
                {assignment.status === "accepted" && onStart && (
                  <Button
                    onClick={() => onStart(assignment.id)}
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
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default withAuth(MyWork);
