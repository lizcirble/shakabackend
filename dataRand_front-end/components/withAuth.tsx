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
          
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full opacity-20"
          ></motion.div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <DataRandLogo size={24} className="text-primary" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
        </motion.div>
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
      if (!ready || isLoading) return;

      if (!authenticated) {
        router.push("/auth");
        return;
      }
    }, [ready, authenticated, isLoading, router]);

    if (!ready) {
      return <LoadingScreen message="Initializing..." />;
    }

    if (!authenticated) {
      return <LoadingScreen message="Redirecting to login..." />;
    }

    if (isLoading) {
      return <LoadingScreen message="Loading your profile..." />;
    }

    if (authenticated && currentUser) {
      return <WrappedComponent {...props} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            We couldn't load your account. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  };

  return ComponentWithAuth;
};

export default withAuth;
