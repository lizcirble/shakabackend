"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePrivy, User } from "@privy-io/react-auth";
import { useUser } from "@/hooks/useUser";
import { type Profile } from "@/lib/supabase";

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
  const { login, logout } = usePrivy();
  const { currentUser, privyUser, isLoading, updateProfile } = useUser();

  const signIn = () => {
    login();
  };

  const signOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user: privyUser,
        profile: currentUser,
        loading: isLoading,
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
