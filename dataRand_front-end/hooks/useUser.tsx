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

    if (!authenticated) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    if (!privyUser || !privyUser.id) {
      setIsLoading(true)
      return
    }

    if (authenticated && privyUser) {
      fetchOrCreateProfile(privyUser.id)
    }
  }, [ready, authenticated, privyUser])

  const fetchOrCreateProfile = async (userId: string) => {
    setIsLoading(true)
    
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle()

      if (fetchError) {
        console.error("Error fetching profile:", fetchError)
        setProfile(null)
        setIsLoading(false)
        return
      }

      if (existingProfile) {
        setProfile(existingProfile as Profile)
        setIsLoading(false)
        return
      }

      const emailAddress = privyUser?.email?.address || null
      const fullName = privyUser?.google?.name || privyUser?.twitter?.name || privyUser?.github?.name || emailAddress?.split("@")[0] || null

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_id: userId,
          email: emailAddress,
          full_name: fullName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create profile")
      }

      const result = await response.json()
      setProfile(result.data as Profile)
      
    } catch (error) {
      console.error("Error in fetchOrCreateProfile:", error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!privyUser || !profile) return { error: new Error("Not authenticated or no profile") }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("auth_id", privyUser.id)

      if (!error) {
        setProfile({ ...profile, ...updates })
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
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
