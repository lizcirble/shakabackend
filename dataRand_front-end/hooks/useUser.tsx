"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { supabase, type Profile } from "@/lib/supabase"

export function useUser() {
  const { user: privyUser, authenticated, ready } = usePrivy()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!ready) {
      setIsLoading(true)
      return
    }

    if (!authenticated || !privyUser?.id) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    fetchOrCreateProfile(privyUser.id)
  }, [ready, authenticated, privyUser?.id])

  const fetchOrCreateProfile = async (userId: string) => {
    try {
      console.log("Signed up user data from Privy:", privyUser);

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("privy_id", userId)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile as Profile);
      } else {
        // Create the profile in the database immediately
        const emailAddress = privyUser?.email?.address || null;
        const fullName = privyUser?.google?.name || privyUser?.twitter?.name || privyUser?.github?.name || emailAddress?.split("@")[0] || null;

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            privy_id: userId,
            email: emailAddress,
            full_name: fullName,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          setProfile(null);
        } else {
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
        .eq("privy_id", privyUser.id)

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
