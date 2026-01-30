"use client";

import { TaskDetail } from "@/pages/client/TaskDetail";

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return <TaskDetail taskId={params.id} />;
}
