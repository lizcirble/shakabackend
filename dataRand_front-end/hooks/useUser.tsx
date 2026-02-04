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

    fetchOrCreateProfile(privyUser.id)
  }, [ready, authenticated, privyUser])

  const fetchOrCreateProfile = async (userId: string) => {
    try {
      // First try to fetch existing profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle();

      if (existingProfile) {
        console.log("Found existing profile:", existingProfile);
        setProfile(existingProfile as Profile);
      } else {
        // Create profile in database
        const profileData = {
          auth_id: userId, // Use auth_id to match TypeScript interface
          email: privyUser?.email?.address || null,
          full_name: privyUser?.google?.name || privyUser?.twitter?.name || privyUser?.github?.name || null,
          created_at: new Date().toISOString(),
        };

        const { data: newProfile, error } = await supabase
          .from("profiles")
          .insert(profileData)
          .select()
          .single();

        if (error) {
          console.error("Error creating profile:", error);
          setProfile(null);
        } else {
          console.log("Created new profile:", newProfile);
          setProfile(newProfile as Profile);
        }
      }
    } catch (error) {
      console.error("Profile error:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

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
