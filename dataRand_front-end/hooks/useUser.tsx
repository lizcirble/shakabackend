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
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle()

      if (existingProfile) {
        setProfile(existingProfile as Profile)
        setIsLoading(false)
        return
      }

      const emailAddress = privyUser?.email?.address || null
      const fullName = privyUser?.google?.name || privyUser?.twitter?.name || privyUser?.github?.name || emailAddress?.split("@")[0] || null

      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({
          auth_id: userId,
          email: emailAddress,
          full_name: fullName,
          role: "worker",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
      } else {
        setProfile(newProfile as Profile);
      }
    } catch (error) {
      console.error("Profile error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!privyUser || !profile) return { error: new Error("Not authenticated") }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("auth_id", privyUser.id)

    if (!error) {
      setProfile({ ...profile, ...updates })
    }

    return { error }
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
