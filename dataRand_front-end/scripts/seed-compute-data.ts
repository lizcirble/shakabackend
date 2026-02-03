// Script to seed sample compute session data for testing
import { supabase } from '../integrations/supabase/client';

async function seedComputeData() {
  try {
    // Get the first user profile
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found. Please create a user first.');
      return;
    }

    const userId = profiles[0].id;

    // Sample compute sessions
    const sampleSessions = [
      {
        worker_id: userId,
        device_type: 'laptop',
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        ended_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        total_earned: 0.06,
        earnings_rate: 0.001,
        is_active: false,
      },
      {
        worker_id: userId,
        device_type: 'phone',
        started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        ended_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours ago
        total_earned: 0.03,
        earnings_rate: 0.001,
        is_active: false,
      },
      {
        worker_id: userId,
        device_type: 'laptop',
        started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        ended_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
        total_earned: 0.12,
        earnings_rate: 0.001,
        is_active: false,
      },
    ];

    // Insert sample sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('compute_sessions')
      .insert(sampleSessions)
      .select();

    if (sessionsError) {
      console.error('Error inserting sessions:', sessionsError);
      return;
    }

    // Update user profile with total earnings
    const totalEarnings = sampleSessions.reduce((sum, session) => sum + session.total_earned, 0);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        compute_earnings: totalEarnings,
        total_earnings: totalEarnings,
        tasks_completed: 15, // Sample task count
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return;
    }

    console.log('✅ Sample compute data seeded successfully!');
    console.log(`📊 Created ${sessions?.length} sessions with total earnings: $${totalEarnings.toFixed(4)}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedComputeData();
}

export { seedComputeData };
