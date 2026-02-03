"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GeometricBackground, NdebeleBorder, CornerAccent } from "@/components/ui/GeometricBackground";
import {
  DataRandLogo,
  TaskIcon,
  WorkIcon,
  EarningsIcon,
  NotificationIcon,
  UserIcon,
  PowerIcon,
  ComputeIcon,
  EducationIcon,
} from "@/components/icons/DataRandIcons";
import { LogOut, Settings, Menu, X, Plus, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const workerNavItems: NavItem[] = [
  { label: "Tasks", href: "/tasks", icon: TaskIcon },
  { label: "My Work", href: "/my-work", icon: WorkIcon },
  { label: "Create Task", href: "/client/create", icon: Plus },
  { label: "ComputeShare", href: "/compute", icon: ComputeIcon },
  { label: "Earnings", href: "/earnings", icon: EarningsIcon },
];

const clientNavItems: NavItem[] = [
  { label: "Dashboard", href: "/client", icon: PowerIcon },
  { label: "Create Task", href: "/client/create", icon: Plus },
  { label: "My Tasks", href: "/client/tasks", icon: WorkIcon },
  { label: "Available Tasks", href: "/tasks", icon: TaskIcon },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navItems = workerNavItems; // Default to worker navigation

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    // A short delay to show loading state and prevent UI flicker
    setTimeout(() => {
      setIsSigningOut(false);
      setShowSignOutModal(false);
      router.push("/auth");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background pattern */}
      <GeometricBackground variant="ndebele" opacity={0.02} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <NdebeleBorder />
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow transition-transform group-hover:scale-105">
              <DataRandLogo size={28} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold text-gradient-primary">
                DataRand
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                African Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "gap-2 relative",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative group">
                <NotificationIcon size={22} className="group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative h-11 w-11 rounded-full p-0 ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer">
                  <ProfileAvatar
                    src={profile?.avatar_url}
                    name={profile?.full_name}
                    email={profile?.email}
                    size="md"
                    className="ring-2 ring-primary/20"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-transparent">
                  <ProfileAvatar
                    src={profile?.avatar_url}
                    name={profile?.full_name}
                    email={profile?.email}
                    size="md"
                    className="ring-2 ring-primary/30"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {profile?.full_name || profile?.email?.split("@")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {profile?.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-3 cursor-pointer">
                    <UserIcon size={18} />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-3 cursor-pointer">
                    <Settings size={18} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowSignOutModal(true)}
                  className="text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut size={18} className="mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card/95 backdrop-blur p-4 animate-slide-up">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-3 sm:py-6 px-4 sm:px-6 lg:px-8 relative">
        <CornerAccent position="top-right" className="opacity-10" />
        {children}
      </main>

      {/* Sign Out Modal */}
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle>Are you sure you want to sign out?</DialogTitle>
              <DialogDescription>
                You will be returned to the sign-in page.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowSignOutModal(false)}
                disabled={isSigningOut}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign Out
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
