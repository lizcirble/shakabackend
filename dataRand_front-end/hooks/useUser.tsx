"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { supabase, type Profile } from "@/lib/supabase"

export function useUser() {
  const { user: privyUser, authenticated, ready } = usePrivy()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("=== ACTIVE USER DEBUG ===");
    console.log("Privy ready:", ready);
    console.log("Authenticated:", authenticated);
    console.log("Privy user:", privyUser);
    console.log("Privy user ID:", privyUser?.id);
    console.log("========================");

    if (!ready) {
      setIsLoading(true)
      return
    }

    if (!authenticated || !privyUser) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    // Create profile from Privy user data directly
    const privyProfile: Profile = {
      id: privyUser.id,
      auth_id: privyUser.id,
      email: privyUser.email?.address || null,
      full_name: privyUser.google?.name || privyUser.twitter?.name || privyUser.github?.name || null,
      avatar_url: null,
      reputation_score: 0,
      total_earnings: 0,
      tasks_completed: 0,
      compute_active: false,
      compute_earnings: 0,
      created_at: privyUser.createdAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Created profile from Privy data:", privyProfile);
    setProfile(privyProfile);
    setIsLoading(false);
  }, [ready, authenticated, privyUser])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!privyUser || !profile) return { error: new Error("Not authenticated") }

    try {
      // Update existing profile
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("auth_id", privyUser.id)

      if (!error) {
        setProfile({ ...profile, ...updates })
      }

      return { error }
    } catch (err) {
      console.error("Profile update error:", err)
      return { error: err as Error }
    }
  }

  return {
    currentUser: profile,
    privyUser,
    isLoading,
    updateProfile,
    authenticated,
    ready
  }
}
