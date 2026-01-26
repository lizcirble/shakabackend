"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";
import { ArrowRightIcon } from "../icons/DataRandIcons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SignUpButtonProps {
  selectedRole: "worker" | "client" | null;
}

export default function SignUpButton({ selectedRole }: SignUpButtonProps) {
  const { user, profile, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // prevents duplicate profile creation
  const hasCreatedProfile = useRef(false);

  const handleSignUp = () => {
    if (!selectedRole) return;
    signIn(); // open Privy modal
  };

  useEffect(() => {
    if (!user || !selectedRole) return;

    // If profile already exists → redirect
    if (profile) {
      if (profile.role === "worker") {
        router.push("/tasks");
      } else {
        router.push("/client/tasks");
      }
      return;
    }

    // Prevent double firing
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
            role: selectedRole,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to create profile");
        }

        if (selectedRole === "worker") {
          router.push("/tasks");
        } else {
          router.push("/client/tasks");
        }
      } catch (err) {
        console.error("Profile creation failed:", err);
        toast({
          title: "Error",
          description: "Failed to create your profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    createProfile();
  }, [user, selectedRole, profile, router, toast]);

  return (
    <Button
      onClick={handleSignUp}
      disabled={!selectedRole}
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
