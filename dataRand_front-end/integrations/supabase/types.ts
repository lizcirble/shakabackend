export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      business_grants: {
        Row: {
          amount: number
          business_name: string
          country: string | null
          created_at: string | null
          id: string
          jobs_created: number | null
          owner_name: string | null
          region: string
          sector: string | null
          status: string | null
        }
        Insert: {
          amount: number
          business_name: string
          country?: string | null
          created_at?: string | null
          id?: string
          jobs_created?: number | null
          owner_name?: string | null
          region: string
          sector?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          business_name?: string
          country?: string | null
          created_at?: string | null
          id?: string
          jobs_created?: number | null
          owner_name?: string | null
          region?: string
          sector?: string | null
          status?: string | null
        }
        Relationships: []
      }
      compute_packages: {
        Row: {
          created_at: string | null
          description: string | null
          hours: number
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hours: number
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hours?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      compute_purchases: {
        Row: {
          amount_paid_cents: number
          client_id: string
          created_at: string | null
          hours_purchased: number
          hours_used: number | null
          id: string
          package_id: string | null
          status: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount_paid_cents: number
          client_id: string
          created_at?: string | null
          hours_purchased: number
          hours_used?: number | null
          id?: string
          package_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount_paid_cents?: number
          client_id?: string
          created_at?: string | null
          hours_purchased?: number
          hours_used?: number | null
          id?: string
          package_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compute_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "compute_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      compute_sessions: {
        Row: {
          device_type: string | null
          earnings_rate: number
          ended_at: string | null
          id: string
          is_active: boolean
          started_at: string
          total_earned: number
          worker_id: string
        }
        Insert: {
          device_type?: string | null
          earnings_rate?: number
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          total_earned?: number
          worker_id: string
        }
        Update: {
          device_type?: string | null
          earnings_rate?: number
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          total_earned?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compute_sessions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_cents: number
          children_funded: number
          created_at: string | null
          donor_email: string | null
          donor_name: string | null
          id: string
          status: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount_cents: number
          children_funded: number
          created_at?: string | null
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          status?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount_cents?: number
          children_funded?: number
          created_at?: string | null
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          status?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: []
      }
      education_fund_stats: {
        Row: {
          children_enrolled: number
          id: string
          last_updated: string
          region: string
          total_raised: number
        }
        Insert: {
          children_enrolled?: number
          id?: string
          last_updated?: string
          region?: string
          total_raised?: number
        }
        Update: {
          children_enrolled?: number
          id?: string
          last_updated?: string
          region?: string
          total_raised?: number
        }
        Relationships: []
      }
      incubator_sponsorships: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          incubator_name: string
          location: string | null
          startups_supported: number | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          incubator_name: string
          location?: string | null
          startups_supported?: number | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          incubator_name?: string
          location?: string | null
          startups_supported?: number | null
          status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_id: string
          avatar_url: string | null
          compute_active: boolean | null
          compute_earnings: number | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          laptop_compute_enabled: boolean | null
          laptop_software_installed: boolean | null
          phone_app_installed: boolean | null
          phone_compute_enabled: boolean | null
          reputation_score: number | null
          role: string
          tasks_completed: number | null
          total_earnings: number | null
          updated_at: string
        }
        Insert: {
          auth_id: string
          avatar_url?: string | null
          compute_active?: boolean | null
          compute_earnings?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          laptop_compute_enabled?: boolean | null
          laptop_software_installed?: boolean | null
          phone_app_installed?: boolean | null
          phone_compute_enabled?: boolean | null
          reputation_score?: number | null
          role?: string
          tasks_completed?: number | null
          total_earnings?: number | null
          updated_at?: string
        }
        Update: {
          auth_id?: string
          avatar_url?: string | null
          compute_active?: boolean | null
          compute_earnings?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          laptop_compute_enabled?: boolean | null
          laptop_software_installed?: boolean | null
          phone_app_installed?: boolean | null
          phone_compute_enabled?: boolean | null
          reputation_score?: number | null
          role?: string
          tasks_completed?: number | null
          total_earnings?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount: number
          country: string | null
          created_at: string | null
          id: string
          program: string | null
          recipient_name: string
          region: string
          school_name: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          amount: number
          country?: string | null
          created_at?: string | null
          id?: string
          program?: string | null
          recipient_name: string
          region: string
          school_name: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          country?: string | null
          created_at?: string | null
          id?: string
          program?: string | null
          recipient_name?: string
          region?: string
          school_name?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          client_feedback: string | null
          id: string
          quality_rating: number | null
          reviewed_at: string | null
          started_at: string
          status: string
          submission_data: Json | null
          submitted_at: string | null
          task_id: string
          worker_id: string
        }
        Insert: {
          client_feedback?: string | null
          id?: string
          quality_rating?: number | null
          reviewed_at?: string | null
          started_at?: string
          status?: string
          submission_data?: Json | null
          submitted_at?: string | null
          task_id: string
          worker_id: string
        }
        Update: {
          client_feedback?: string | null
          id?: string
          quality_rating?: number | null
          reviewed_at?: string | null
          started_at?: string
          status?: string
          submission_data?: Json | null
          submitted_at?: string | null
          task_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string
          created_at: string
          data: Json | null
          description: string | null
          estimated_time_minutes: number | null
          expires_at: string | null
          id: string
          instructions: string | null
          media_type: string | null
          media_url: string | null
          payout_amount: number
          priority: number | null
          status: string
          target_countries: string[] | null
          task_type_id: string
          title: string
          worker_count: number
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: Json | null
          description?: string | null
          estimated_time_minutes?: number | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          media_type?: string | null
          media_url?: string | null
          payout_amount: number
          priority?: number | null
          status?: string
          target_countries?: string[] | null
          task_type_id: string
          title: string
          worker_count?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: Json | null
          description?: string | null
          estimated_time_minutes?: number | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          media_type?: string | null
          media_url?: string | null
          payout_amount?: number
          priority?: number | null
          status?: string
          target_countries?: string[] | null
          task_type_id?: string
          title?: string
          worker_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          profile_id: string
          status: string
          task_assignment_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          profile_id: string
          status?: string
          task_assignment_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string
          status?: string
          task_assignment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_task_assignment_id_fkey"
            columns: ["task_assignment_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          bank_details: Json | null
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          phone_number: string | null
          processed_at: string | null
          profile_id: string
          status: string | null
        }
        Insert: {
          amount: number
          bank_details?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          phone_number?: string | null
          processed_at?: string | null
          profile_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          bank_details?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          phone_number?: string | null
          processed_at?: string | null
          profile_id?: string
          status?: string | null
        }
        Relationships: []
      }
      worker_skills: {
        Row: {
          id: string
          proficiency_level: number | null
          task_type_id: string
          worker_id: string
        }
        Insert: {
          id?: string
          proficiency_level?: number | null
          task_type_id: string
          worker_id: string
        }
        Update: {
          id?: string
          proficiency_level?: number | null
          task_type_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_task_payment: {
        Args: {
          p_approved: boolean
          p_assignment_id: string
          p_feedback?: string
        }
        Returns: undefined
      }
      user_has_task_assignment: {
        Args: { p_task_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
