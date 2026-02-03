"use client";

import React, { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { DataRandLogo } from "@/components/icons/DataRandIcons";

const LoadingScreen = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto"
          >
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-primary border-r-primary"></div>
          </motion.div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <DataRandLogo size={24} className="text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
      </motion.div>
    </div>
  );
};

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAuth = (props: P) => {
    const { ready, authenticated } = usePrivy();
    const { currentUser, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!ready) return;

      if (!authenticated) {
        router.replace("/auth");
        return;
      }
    }, [ready, authenticated, router]);

    if (!ready || isLoading) {
      return <LoadingScreen message="Loading..." />;
    }

    if (!authenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withAuth;
