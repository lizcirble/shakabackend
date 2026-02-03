"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function TaskSeeder() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const seedData = async () => {
    if (!profile) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      // First, seed task types
      const { error: typesError } = await supabase
        .from("task_types")
        .upsert([
          { id: 'tt1', name: 'image_labeling', description: 'Label and categorize images', icon: 'image' },
          { id: 'tt2', name: 'audio_transcription', description: 'Transcribe audio to text', icon: 'audio' },
          { id: 'tt3', name: 'ai_evaluation', description: 'Evaluate AI model outputs', icon: 'ai' }
        ]);

      if (typesError) throw typesError;

      // Then seed tasks using the current profile as client
      const { error: tasksError } = await supabase
        .from("tasks")
        .upsert([
          {
            id: 'task1',
            client_id: profile.id,
            task_type_id: 'tt1',
            title: 'Label African Wildlife Images',
            description: 'Help improve AI recognition of African wildlife by labeling images of animals in their natural habitat.',
            instructions: 'Look at each image and select the correct animal from the dropdown menu. Focus on identifying lions, elephants, giraffes, and zebras.',
            payout_amount: 2.50,
            estimated_time_minutes: 5,
            status: 'available',
            priority: 1,
            worker_count: 10,
            target_countries: ['KE', 'TZ', 'ZA', 'BW'],
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'task2',
            client_id: profile.id,
            task_type_id: 'tt2',
            title: 'Transcribe Swahili Audio Clips',
            description: 'Transcribe short audio clips in Swahili to help train speech recognition models.',
            instructions: 'Listen to the audio clip and type exactly what you hear. Pay attention to proper spelling and punctuation.',
            payout_amount: 3.00,
            estimated_time_minutes: 8,
            status: 'available',
            priority: 2,
            worker_count: 5,
            target_countries: ['KE', 'TZ', 'UG'],
            expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'task3',
            client_id: profile.id,
            task_type_id: 'tt3',
            title: 'Evaluate AI Translations',
            description: 'Review AI-generated translations from English to local African languages.',
            instructions: 'Rate the quality of translations on accuracy, fluency, and cultural appropriateness. Provide brief feedback.',
            payout_amount: 4.00,
            estimated_time_minutes: 10,
            status: 'available',
            priority: 1,
            worker_count: 8,
            target_countries: ['NG', 'GH', 'KE', 'ZA'],
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);

      if (tasksError) throw tasksError;

      toast.success("Sample tasks created successfully!");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Failed to create sample tasks");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Development Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={seedData} disabled={loading}>
          {loading ? "Creating..." : "Create Sample Tasks"}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          This will create sample tasks for testing. Only visible in development.
        </p>
      </CardContent>
    </Card>
  );
}
