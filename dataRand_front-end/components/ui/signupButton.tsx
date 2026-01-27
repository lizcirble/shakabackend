"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";
import { ArrowRightIcon } from "../icons/DataRandIcons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function SignUpButton() {
  const { user, profile, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // prevents duplicate profile creation
  const hasCreatedProfile = useRef(false);

  const handleSignUp = () => {
    signIn(); // open Privy modal
  };

  useEffect(() => {
    if (!user) return;

    // If profile already exists → redirect
    if (profile) {
      // For existing users, redirect based on their established role
      if (profile.role === "client") {
        router.push("/client/tasks");
      } else {
        router.push("/tasks");
      }
      return;
    }

    // Prevent double firing for new user profile creation
    if (hasCreatedProfile.current) return;
    hasCreatedProfile.current = true;

    const createProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_id: user.id,
            role: "worker", // Default role for all new users
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to create profile");
        }

        // Redirect all new users to the main tasks page
        router.push("/tasks");

      } catch (err) {
        console.error("Profile creation failed:", err);
        toast({
          title: "Error",
          description: (err as Error).message || "Failed to create your profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    createProfile();
  }, [user, profile, router, toast]);

  return (
    <Button
      onClick={handleSignUp}
      className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base group"
    >
      Enter the Arena
      <ArrowRightIcon
        size={20}
        className="ml-2 group-hover:translate-x-1 transition-transform"
      />
    </Button>
  );
}
