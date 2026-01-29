"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-11 w-11", 
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg", 
  xl: "text-3xl",
};

export function ProfileAvatar({ 
  src, 
  name, 
  email, 
  size = "md", 
  className 
}: ProfileAvatarProps) {
  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src || undefined} />
      <AvatarFallback className={cn(
        "bg-primary/10 text-primary font-bold",
        fallbackSizeClasses[size]
      )}>
        {getInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  );
}
