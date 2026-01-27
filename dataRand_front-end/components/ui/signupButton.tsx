"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { ArrowRightIcon } from "../icons/DataRandIcons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SignUpButton() {
  const { user, profile, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Prevents duplicate profile creation
  const hasCreatedProfile = useRef(false);

  const handleSignUp = () => {
    console.log("SignUp button clicked");
    signIn(); // Open Privy modal
  };

  useEffect(() => {
    console.log("SignUpButton useEffect - user:", !!user, "profile:", !!profile);
    
    if (!user) {
      console.log("No user, returning");
      return;
    }

    // If profile already exists → redirect to tasks
    if (profile) {
      console.log("Profile exists, redirecting to /tasks");
      router.push("/tasks");
      return;
    }

    // Prevent double firing for new user profile creation
    if (hasCreatedProfile.current) {
      console.log("Already attempted profile creation, returning");
      return;
    }
    
    hasCreatedProfile.current = true;
    setIsCreatingProfile(true);

    const createProfile = async () => {
      try {
        console.log("Starting profile creation for user:", user.id);
        
        const email = user.email?.address;
        const fullName = user.google?.name || user.twitter?.name || email?.split("@")[0];

        console.log("Profile data:", { auth_id: user.id, email, fullName });

        const res = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_id: user.id,
            email: email,
            full_name: fullName,
          }),
        });

        console.log("Profile API response status:", res.status);

        if (!res.ok) {
          const err = await res.json();
          console.error("Profile creation error:", err);
          
          // Check for environment variable error
          if (err.error?.includes("URL and Key are required")) {
            throw new Error(
              "Server configuration error. Please contact support. (Missing Supabase credentials)"
            );
          }
          
          throw new Error(err.message || "Failed to create profile");
        }

        const result = await res.json();
        console.log("Profile created successfully:", result);

        toast({
          title: "Welcome to DataRand!",
          description: "Your profile has been created successfully.",
        });

        // Small delay to ensure profile is propagated
        setTimeout(() => {
          console.log("Redirecting to /tasks");
          router.push("/tasks");
        }, 500);

      } catch (err) {
        console.error("Profile creation failed:", err);
        setIsCreatingProfile(false);
        hasCreatedProfile.current = false; // Allow retry
        
        toast({
          title: "Error",
          description: (err as Error).message || "Failed to create your profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    createProfile();
  }, [user, profile, router, toast]);

  if (isCreatingProfile) {
    return (
      <Button
        disabled
        className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base"
      >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Setting up your account...
      </Button>
    );
  }

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