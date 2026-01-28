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