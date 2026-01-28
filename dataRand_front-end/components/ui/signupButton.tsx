"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";
import { ArrowRightIcon } from "../icons/DataRandIcons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SignUpButton() {
  const { user, profile, signIn, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Error",
        description: "There was an error signing in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile && !loading) {
      router.push("/tasks");
    }
  }, [user, profile, loading, router]);

  return (
    <Button
      onClick={handleSignUp}
      disabled={isLoading || loading}
      className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base group"
    >
      {isLoading || loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Setting up...
        </>
      ) : (
        <>
          Enter the Arena
          <ArrowRightIcon
            size={20}
            className="ml-2 group-hover:translate-x-1 transition-transform"
          />
        </>
      )}
    </Button>
  );
}