"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { supabase, type Profile } from "@/lib/supabase"
import { api, getDeviceFingerprint } from "@/lib/datarand"

export function useUser() {
  const {
    user: privyUser,
    authenticated,
    ready,
    getAccessToken,
  } = usePrivy()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const formatSupabaseError = (error: unknown) => {
    if (!error || typeof error !== "object") return error
    const e = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
      status?: number
      name?: string
    }
    return {
      name: e.name,
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
      status: e.status,
    }
  }

  // ================================
  // Effects
  // ================================

  // This effect syncs the Privy auth token with Supabase
  useEffect(() => {
    const setAuthToken = async () => {
      if (authenticated && privyUser) {
        try {
          // Always get a fresh token - don't rely on cached values
          const accessToken = await getAccessToken()
          console.log("Privy access token obtained:", accessToken?.substring(0, 20) + "...")
          
          if (!accessToken) {
            console.warn("No Privy access token available")
            return
          }

          // Exchange Privy token for DataRand backend JWT.
          const loginResult = await api.login(accessToken, getDeviceFingerprint())
          if (loginResult?.token) {
            localStorage.setItem("datarand_token", loginResult.token)
            console.log("DataRand token stored successfully")
          }
        } catch (error) {
          console.error("Backend auth error:", error)
          localStorage.removeItem("datarand_token")
        }
      } else {
        await supabase.auth.signOut()
        localStorage.removeItem("datarand_token")
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
      const fallbackProfile: Profile = {
        id: userId,
        auth_id: userId,
        email: privyUser?.email?.address || null,
        full_name:
          privyUser?.google?.name ||
          privyUser?.twitter?.name ||
          privyUser?.github?.name ||
          null,
        avatar_url: null,
        reputation_score: 0,
        total_earnings: 0,
        tasks_completed: 0,
        compute_active: false,
        compute_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 1️⃣ Try fetch
      const { data: existingProfiles, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)

      if (fetchError) {
        console.error("Fetch profile error:", formatSupabaseError(fetchError))
        setProfile(fallbackProfile)
        return
      }

      const existingProfile = existingProfiles?.[0]
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
        avatar_url: null, // Profile pictures will be managed in Supabase
        created_at: new Date().toISOString(),
      }

      const { data: newProfiles, error: insertError } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "auth_id" })
        .select()
        .limit(1)

      if (insertError) {
        console.error("Error creating profile:", formatSupabaseError(insertError))
        setProfile(fallbackProfile)
        return
      }

      const newProfile = newProfiles?.[0]
      if (!newProfile) {
        console.error("Profile upsert returned no row for user:", userId)
        setProfile(fallbackProfile)
        return
      }

      console.log("Created new profile:", newProfile)
      setProfile(newProfile as Profile)

    } catch (err) {
      console.error("Profile error:", err)
      setProfile({
        id: userId,
        auth_id: userId,
        email: privyUser?.email?.address || null,
        full_name:
          privyUser?.google?.name ||
          privyUser?.twitter?.name ||
          privyUser?.github?.name ||
          null,
        avatar_url: null,
        reputation_score: 0,
        total_earnings: 0,
        tasks_completed: 0,
        compute_active: false,
        compute_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
