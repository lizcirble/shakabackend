import { supabase } from "@/integrations/supabase/client";

export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...");
    
    // Test basic connection with task_types table
    const { data, error } = await supabase
      .from("task_types")
      .select("count")
      .limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Supabase connection test successful");
    return { success: true, data };
  } catch (err) {
    console.error("Supabase connection test error:", err);
    return { success: false, error: "Network error" };
  }
}

export async function checkTasksTable() {
  try {
    console.log("Checking tasks table...");
    
    const { data, error } = await supabase
      .from("tasks")
      .select("count")
      .limit(1);
    
    if (error) {
      console.error("Tasks table check failed:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Tasks table accessible");
    return { success: true };
  } catch (err) {
    console.error("Tasks table check error:", err);
    return { success: false, error: "Network error" };
  }
}
