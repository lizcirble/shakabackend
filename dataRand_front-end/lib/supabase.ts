import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export { supabase };
export type { User, Session };

export type Profile = {
  id: string;
  privy_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  reputation_score: number;
  total_earnings: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
};

export type TaskType = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

export type Transaction = {
  id: string;
  profile_id: string;
  amount: number;
  type: string;
  description: string | null;
  status: string;
  task_assignment_id: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  client_id: string;
  task_type_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  payout_amount: number;
  estimated_time_minutes: number | null;
  status: "available" | "assigned" | "in_progress" | "submitted" | "approved" | "rejected" | "cancelled";
  priority: number;
  data: Record<string, unknown> | null;
  created_at: string;
  expires_at: string | null;
  worker_count: number;
  target_countries: string[];
  media_url: string | null;
  media_type: string | null;
  task_type?: TaskType;
  client?: Profile;
};

export type TaskAssignment = {
  id: string;
  task_id: string;
  worker_email: string | null;
  status: "accepted" | "in_progress" | "submitted" | "approved" | "rejected" | "abandoned";
  submission_data: Record<string, unknown> | null;
  started_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  task?: Task;
};

export type Notification = {
  id: string;
  user_email: string;
  type: "task_available" | "task_approved" | "task_rejected" | "payment" | "system";
  title: string;
  message: string | null;
  task_id: string | null;
  read: boolean;
  created_at: string;
};
