"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  className,
}: ProfileAvatarProps) {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [avatarSrc, setAvatarSrc] = useState(src);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedAvatar = localStorage.getItem("avatar");
    if (storedAvatar !== null) { // Explicitly check for null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatarSrc(storedAvatar);
    }
  }, []);

  const getInitials = (
    name: string | null | undefined,
    email: string | null | undefined
  ) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        localStorage.setItem("avatar", base64String);
        setAvatarSrc(base64String);

        // Update profile in backend
        const { error } = await updateProfile({ avatar_url: base64String });

        if (error) {
          toast({
            title: "Error",
            description: `Failed to update profile picture: ${error.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Profile picture updated successfully!",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={avatarSrc || undefined} />
        <AvatarFallback
          className={cn(
            "bg-primary/10 text-primary font-bold",
            fallbackSizeClasses[size]
          )}
        >
          {getInitials(name, email)}
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100"
          onClick={handleUploadClick}
        >
          <Edit className="h-5 w-5 text-white" />
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
}
