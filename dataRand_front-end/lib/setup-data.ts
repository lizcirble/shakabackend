import { supabase } from "@/integrations/supabase/client";

export async function setupSampleData() {
  try {
    console.log("Setting up sample data...");

    // First, insert task types
    const { error: taskTypesError } = await supabase
      .from("task_types")
      .upsert([
        { id: "tt1", name: "image_labeling", description: "Label and categorize images" },
        { id: "tt2", name: "audio_transcription", description: "Transcribe audio to text" },
        { id: "tt3", name: "ai_evaluation", description: "Evaluate AI model outputs" }
      ]);

    if (taskTypesError) {
      console.error("Error inserting task types:", taskTypesError);
      return { success: false, error: taskTypesError.message };
    }

    // Then insert sample tasks
    const { error: tasksError } = await supabase
      .from("tasks")
      .upsert([
        {
          id: "task1",
          client_id: "sample-client",
          task_type_id: "tt1",
          title: "Label African Wildlife Images",
          description: "Help improve AI recognition of African wildlife",
          instructions: "Look at each image and select the correct animal",
          payout_amount: 2.50,
          estimated_time_minutes: 5,
          status: "available",
          priority: 1,
          worker_count: 10,
          target_countries: ["KE", "TZ", "ZA"]
        },
        {
          id: "task2", 
          client_id: "sample-client",
          task_type_id: "tt2",
          title: "Transcribe Audio Clips",
          description: "Transcribe short audio clips",
          instructions: "Listen and type exactly what you hear",
          payout_amount: 3.00,
          estimated_time_minutes: 8,
          status: "available", 
          priority: 1,
          worker_count: 5,
          target_countries: ["KE", "TZ", "UG"]
        }
      ]);

    if (tasksError) {
      console.error("Error inserting tasks:", tasksError);
      return { success: false, error: tasksError.message };
    }

    // Insert education fund stats
    const { error: eduStatsError } = await supabase
      .from("education_fund_stats")
      .upsert([
        {
          region: "global",
          total_raised: 125000.75,
          children_enrolled: 9615,
          last_updated: new Date().toISOString()
        },
        {
          region: "africa",
          total_raised: 87500.50,
          children_enrolled: 6730,
          last_updated: new Date().toISOString()
        },
        {
          region: "india",
          total_raised: 37500.25,
          children_enrolled: 2885,
          last_updated: new Date().toISOString()
        }
      ]);

    if (eduStatsError) {
      console.error("Error inserting education stats:", eduStatsError);
      return { success: false, error: eduStatsError.message };
    }

    console.log("Sample data setup complete!");
    return { success: true };

  } catch (error: any) {
    console.error("Setup error:", error);
    return { success: false, error: error.message };
  }
}
