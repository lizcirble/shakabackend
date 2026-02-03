"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalMetrics } from '@/hooks/useGlobalMetrics';
import { useToast } from '@/hooks/use-toast';

export function DataSeeder() {
  const { profile } = useAuth();
  const { refreshMetrics } = useGlobalMetrics();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const seedComputeData = async () => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Sample compute sessions
      const sampleSessions = [
        {
          worker_id: profile.id,
          device_type: 'laptop',
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          total_earned: 0.06,
          earnings_rate: 0.001,
          is_active: false,
        },
        {
          worker_id: profile.id,
          device_type: 'phone',
          started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
          total_earned: 0.03,
          earnings_rate: 0.001,
          is_active: false,
        },
        {
          worker_id: profile.id,
          device_type: 'laptop',
          started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          total_earned: 0.12,
          earnings_rate: 0.001,
          is_active: false,
        },
      ];

      // Insert sessions
      const { error: sessionsError } = await supabase
        .from('compute_sessions')
        .insert(sampleSessions);

      if (sessionsError) throw sessionsError;

      // Update profile
      const totalEarnings = sampleSessions.reduce((sum, session) => sum + session.total_earned, 0);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          compute_earnings: totalEarnings,
          total_earnings: totalEarnings,
          tasks_completed: 15,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Refresh metrics
      refreshMetrics();

      toast({
        title: "Success! 🎉",
        description: `Created ${sampleSessions.length} compute sessions with $${totalEarnings.toFixed(4)} total earnings`
      });

    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: "Error",
        description: "Failed to seed compute data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Delete sessions
      await supabase
        .from('compute_sessions')
        .delete()
        .eq('worker_id', profile.id);

      // Reset profile
      await supabase
        .from('profiles')
        .update({
          compute_earnings: 0,
          total_earnings: 0,
          tasks_completed: 0,
        })
        .eq('id', profile.id);

      refreshMetrics();

      toast({
        title: "Data Cleared",
        description: "All compute data has been reset"
      });

    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-600">🧪 Data Seeder (Development)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use these buttons to test the real data integration:
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={seedComputeData} 
            disabled={loading}
            variant="outline"
          >
            {loading ? "Seeding..." : "Seed Sample Data"}
          </Button>
          <Button 
            onClick={clearData} 
            disabled={loading}
            variant="outline"
          >
            {loading ? "Clearing..." : "Clear Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
