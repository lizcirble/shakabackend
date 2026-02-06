import { supabase } from "@/integrations/supabase/client";

// Enhanced debugging utility for Supabase operations
export class SupabaseDebugger {
  private static logPrefix = "[SUPABASE DEBUG]";

  static log(message: string, data?: unknown) {
    console.log(`${this.logPrefix} ${message}`, data || "");
  }

  static error(message: string, error?: unknown) {
    console.error(`${this.logPrefix} ERROR: ${message}`, error || "");
  }

  static warn(message: string, data?: unknown) {
    console.warn(`${this.logPrefix} WARNING: ${message}`, data || "");
  }

  // Check environment variables
  static checkEnvironment() {
    this.log("=== ENVIRONMENT CHECK ===");
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    this.log("Supabase URL:", supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING");
    this.log("Supabase Key:", supabaseKey ? `${supabaseKey.substring(0, 30)}...` : "MISSING");
    
    if (!supabaseUrl || !supabaseKey) {
      this.error("Missing required environment variables!");
      return false;
    }
    
    this.log("Environment variables are present ✓");
    return true;
  }

  // Test basic connection
  static async testConnection() {
    this.log("=== CONNECTION TEST ===");
    
    try {
      // Test with a simple query that doesn't require auth
      const { data, error } = await supabase
        .from("task_types")
        .select("count")
        .limit(1);
      
      if (error) {
        this.error("Connection test failed:", error);
        return { success: false, error: error.message };
      }
      
      this.log("Connection test successful ✓");
      return { success: true, data };
    } catch (err) {
      this.error("Connection test exception:", err);
      return { success: false, error: "Network error" };
    }
  }

  // Test tasks table specifically
  static async testTasksTable() {
    this.log("=== TASKS TABLE TEST ===");
    
    try {
      // First check if table exists
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status")
        .limit(5);
      
      if (error) {
        this.error("Tasks table test failed:", error);
        this.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { success: false, error: error.message };
      }
      
      this.log("Tasks table accessible ✓");
      this.log("Sample tasks found:", data?.length || 0);
      
      if (data && data.length > 0) {
        this.log("Sample task data:", data[0]);
      }
      
      return { success: true, data };
    } catch (err) {
      this.error("Tasks table test exception:", err);
      return { success: false, error: "Network error" };
    }
  }

  // Test task types table
  static async testTaskTypesTable() {
    this.log("=== TASK TYPES TABLE TEST ===");
    
    try {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .limit(5);
      
      if (error) {
        this.error("Task types table test failed:", error);
        return { success: false, error: error.message };
      }
      
      this.log("Task types table accessible ✓");
      this.log("Task types found:", data?.length || 0);
      
      return { success: true, data };
    } catch (err) {
      this.error("Task types table test exception:", err);
      return { success: false, error: "Network error" };
    }
  }

  // Comprehensive diagnostic
  static async runFullDiagnostic() {
    this.log("=== STARTING FULL DIAGNOSTIC ===");
    
    const results = {
      environment: false,
      connection: false,
      tasksTable: false,
      taskTypesTable: false
    };

    // Check environment
    results.environment = this.checkEnvironment();
    
    if (!results.environment) {
      this.error("Diagnostic failed at environment check");
      return results;
    }

    // Test connection
    const connectionTest = await this.testConnection();
    results.connection = connectionTest.success;
    
    if (!results.connection) {
      this.error("Diagnostic failed at connection test");
      return results;
    }

    // Test tasks table
    const tasksTest = await this.testTasksTable();
    results.tasksTable = tasksTest.success;

    // Test task types table
    const taskTypesTest = await this.testTaskTypesTable();
    results.taskTypesTable = taskTypesTest.success;

    this.log("=== DIAGNOSTIC COMPLETE ===");
    this.log("Results:", results);
    
    return results;
  }
}

// Enhanced task loading with debugging
export async function loadTasksWithDebug() {
  SupabaseDebugger.log("=== LOADING TASKS ===");
  
  try {
    // Run diagnostic first
    const diagnostic = await SupabaseDebugger.runFullDiagnostic();
    
    if (!diagnostic.tasksTable) {
      throw new Error("Tasks table is not accessible");
    }

    // Load tasks with detailed logging
    SupabaseDebugger.log("Fetching available tasks...");
    
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        *,
        task_type:task_types(*)
      `)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (tasksError) {
      SupabaseDebugger.error("Failed to load tasks:", tasksError);
      throw tasksError;
    }

    SupabaseDebugger.log("Tasks loaded successfully ✓");
    SupabaseDebugger.log("Number of tasks:", tasks?.length || 0);
    
    if (tasks && tasks.length > 0) {
      SupabaseDebugger.log("First task sample:", tasks[0]);
    }

    return { success: true, data: tasks || [] };
    
  } catch (error) {
    SupabaseDebugger.error("Task loading failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
