"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { supabase, type Profile } from "@/lib/supabase"

export function useUser() {
  const {
    user: privyUser,
    authenticated,
    ready,
    getAccessToken,
  } = usePrivy()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ================================
  // Effects
  // ================================

  // This effect syncs the Privy auth token with Supabase
  useEffect(() => {
    const setAuthToken = async () => {
      if (authenticated && privyUser) {
        const accessToken = await getAccessToken()
        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: accessToken,
          })
        }
      } else {
        await supabase.auth.signOut()
      }
    }

    if (ready) {
      setAuthToken()
    }
  }, [ready, authenticated, privyUser, getAccessToken])

  // This effect fetches or creates the user profile
  useEffect(() => {
    console.log("=== ACTIVE USER DEBUG ===")
    console.log("Privy ready:", ready)
    console.log("Authenticated:", authenticated)
    console.log("Privy user:", privyUser)
    console.log("Privy user ID:", privyUser?.id)
    console.log("========================")

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

  // ================================
  // Fetch Or Create Profile
  // ================================
  const fetchOrCreateProfile = async (userId: string) => {
    try {
      setIsLoading(true)

      // 1️⃣ Try fetch
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle()

      if (fetchError) {
        console.error("Fetch profile error:", fetchError)
      }

      if (existingProfile) {
        console.log("Found existing profile:", existingProfile)
        setProfile(existingProfile as Profile)
        return
      }

      // 2️⃣ Create if not found
      const profileData = {
        auth_id: userId,
        email: privyUser?.email?.address || null,
        full_name:
          privyUser?.google?.name ||
          privyUser?.twitter?.name ||
          privyUser?.github?.name ||
          null,
        avatar_url:
          privyUser?.google?.picture ||
          privyUser?.twitter?.profile_image_url_https ||
          privyUser?.github?.avatar_url ||
          null,
        created_at: new Date().toISOString(),
      }

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single()

      if (insertError) {
        console.error("Error creating profile:", insertError)
        setProfile(null)
        return
      }

      console.log("Created new profile:", newProfile)
      setProfile(newProfile as Profile)

    } catch (err) {
      console.error("Profile error:", err)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  // ================================
  // Update Profile
  // ================================
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!privyUser || !profile) {
      return { error: new Error("Not authenticated") }
    }

    try {
      
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

  // ================================
  // Return
  // ================================
  return {
    currentUser: profile,
    privyUser,
    isLoading,
    updateProfile,
    authenticated,
    ready,
  }
}
