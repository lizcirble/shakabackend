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

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } else {
      setProfile(data as Profile | null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleAuthChange = async () => {
      if (ready) {
        if (authenticated && user) {
          setLoading(true);
          const { data: existingProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("auth_id", user.id)
            .maybeSingle();

          if (fetchError) {
            console.error("Error fetching profile:", fetchError);
            setProfile(null);
          } else if (existingProfile) {
            setProfile(existingProfile as Profile);
          } else {
            // No existing profile, create one
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({ auth_id: user.id, email: user.email || null }) // Assuming email is available from Privy user object
              .select("*")
              .single();

            if (createError) {
              console.error("Error creating profile:", createError);
              setProfile(null);
            } else {
              setProfile(newProfile as Profile);
              console.log("New user signed up! Profile data:", newProfile, "User email:", user.email); // Log new user data and email
            }
          }
          setLoading(false);
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