"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLocalTasks } from "@/hooks/useLocalTasks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, DollarSign, Users, Globe, Calendar, FileText } from "lucide-react";
import type { LocalTask } from "@/hooks/useLocalTasks";

interface TaskDetailProps {
  taskId: string;
}

export default function TaskDetail({ taskId }: TaskDetailProps) {
  const { profile } = useAuth();
  const { getTaskById } = useLocalTasks();
  const router = useRouter();
  const [task, setTask] = useState<LocalTask | null>(null);

  useEffect(() => {
    const foundTask = getTaskById(taskId);
    setTask(foundTask);
  }, [taskId, getTaskById]);

  if (!task) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
            <p className="text-muted-foreground mb-4">The task you're looking for doesn't exist.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Task Details</h1>
            <p className="text-muted-foreground">View and manage your created task</p>
          </div>
        </div>

        {/* Task Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{task.title}</CardTitle>
                <CardDescription className="mt-2">{task.description}</CardDescription>
              </div>
              <Badge variant={task.status === 'available' ? 'default' : 'secondary'}>
                {task.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Payout</p>
                  <p className="font-semibold">${task.payout_amount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Est. Time</p>
                  <p className="font-semibold">{task.estimated_time_minutes} min</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Workers</p>
                  <p className="font-semibold">{task.worker_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold text-xs">{formatDate(task.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{task.instructions}</p>
            </div>
          </CardContent>
        </Card>

        {/* Target Countries */}
        {task.target_countries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Target Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {task.target_countries.map((country) => (
                  <Badge key={country} variant="outline">
                    {country}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media */}
        {task.media_url && (
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              {task.media_type?.startsWith('image/') ? (
                <img 
                  src={task.media_url} 
                  alt="Task media" 
                  className="max-w-full h-auto rounded-lg border"
                />
              ) : task.media_type?.startsWith('video/') ? (
                <video 
                  src={task.media_url} 
                  controls 
                  className="max-w-full h-auto rounded-lg border"
                />
              ) : (
                <a 
                  href={task.media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Media File
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">
                Edit Task
              </Button>
              <Button variant="outline">
                View Applications
              </Button>
              {task.status === 'available' && (
                <Button variant="destructive">
                  Cancel Task
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
