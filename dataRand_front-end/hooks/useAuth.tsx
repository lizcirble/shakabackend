"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePrivy, User } from "@privy-io/react-auth";
import { supabase, type Profile } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, login, logout, ready, authenticated } = usePrivy();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (userId: string) => {
    setLoading(true);
    
    try {
      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (existingProfile) {
        // Profile exists, use it
        setProfile(existingProfile as Profile);
        setLoading(false);
        return;
      }

      // No existing profile, create one via API route
      const emailAddress = user?.email?.address || null;
      const fullName = user?.google?.name || user?.twitter?.name || user?.github?.name || emailAddress?.split("@")[0] || null;

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
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create profile via API");
      }

      const result = await response.json();
      setProfile(result.data as Profile);
      console.log("New user signed up! Profile data:", result.data, "User email:", emailAddress);
      
    } catch (apiError) {
      console.error("Error creating profile via API:", apiError);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthChange = async () => {
      if (ready) {
        if (authenticated && user) {
          await fetchOrCreateProfile(user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    };

    handleAuthChange();
  }, [ready, authenticated, user]);

  const signIn = () => {
    login();
  };

  const signOut = async () => {
    await logout();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("auth_id", user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}