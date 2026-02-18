"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getPrivyWalletAddress } from "@/lib/datarand";
import { 
  User, Bell, Palette, Globe, Smartphone, Shield, 
  Save, AlertTriangle, Wallet, Plus, Loader2
} from "lucide-react";

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { user: privyUser, createWallet } = usePrivy();
  const { wallets } = useWallets();
  
  const [loading, setLoading] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingStep, setDeletingStep] = useState(0);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    avatar_url: profile?.avatar_url || "",
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailNotifications: true,
    taskReminders: true,
    darkMode: false,
    language: "en",
    timezone: "UTC",
    autoAcceptTasks: false,
    showEarnings: true,
  });

  useEffect(() => {
    const address = getPrivyWalletAddress(privyUser);
    setWalletAddress(address);
  }, [privyUser, wallets]);

  const handleCreateWallet = async () => {
    setCreatingWallet(true);
    try {
      await createWallet();
      toast({
        title: "Success",
        description: "Embedded wallet created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create wallet",
        variant: "destructive",
      });
    } finally {
      setCreatingWallet(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    
    setDeleteLoading(true);
    setDeletingStep(0);
    
    const steps = [
      "Deleting notifications...",
      "Removing transactions...",
      "Clearing task history...",
      "Deleting compute sessions...",
      "Removing profile data...",
      "Finalizing deletion..."
    ];

    try {
      // Animate through deletion steps
      for (let i = 0; i < steps.length; i++) {
        setDeletingStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Delete all user data from database
      const { error } = await supabase.rpc('delete_user_account', {
        p_profile_id: profile.id
      });

      if (error) {
        console.error('RPC error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to delete account');
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error instanceof Error ? error.message : JSON.stringify(error));
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setDeletingStep(0);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <ProfileAvatar
                src={formData.avatar_url}
                name={formData.full_name}
                email={formData.email}
                size="lg"
                className="mx-auto sm:mx-0"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Badge variant="secondary">User</Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">Account Type</span>
            </div>

            <Button onClick={handleProfileUpdate} disabled={loading} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <Label>Push Notifications</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Receive notifications in the app</p>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, notifications: checked })}
              />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <Label>Email Notifications</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
              />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <Label>Task Reminders</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Get reminded about pending tasks</p>
              </div>
              <Switch
                checked={preferences.taskReminders}
                onCheckedChange={(checked) => setPreferences({ ...preferences, taskReminders: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <Label>Dark Mode</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Toggle dark theme</p>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="sw">Kiswahili</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                    <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Johannesburg (SAST)</SelectItem>
                    <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Smartphone className="h-5 w-5" />
              Work Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <Label>Show Earnings Publicly</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Display earnings on your profile</p>
              </div>
              <Switch
                checked={preferences.showEarnings}
                onCheckedChange={(checked) => setPreferences({ ...preferences, showEarnings: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Button variant="outline" className="w-full">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full">
              Download My Data
            </Button>
            <Separator />
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Wallet Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Wallet className="h-5 w-5" />
              Embedded Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {walletAddress ? (
              <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/10">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Wallet Active</p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {walletAddress}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">No Wallet Found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create an embedded wallet to fund tasks and receive payments
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateWallet} 
                  disabled={creatingWallet}
                  className="w-full"
                >
                  {creatingWallet ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Wallet...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Embedded Wallet
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                  {!deleteLoading ? (
                    <>
                      <p className="font-semibold">This action cannot be undone.</p>
                      <p>Deleting your account will permanently remove:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Your profile and personal information</li>
                        <li>All task history and assignments</li>
                        <li>Your earnings and transaction records</li>
                        <li>All notifications and messages</li>
                        <li>Compute session history</li>
                      </ul>
                      <p className="text-sm font-medium pt-2">
                        Any pending withdrawals will be cancelled. Make sure to withdraw your funds before deleting your account.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4 py-4">
                      {[
                        { step: 1, label: "Deleting notifications", icon: "🔔" },
                        { step: 2, label: "Removing transactions", icon: "💰" },
                        { step: 3, label: "Clearing task history", icon: "📋" },
                        { step: 4, label: "Deleting compute sessions", icon: "💻" },
                        { step: 5, label: "Removing profile data", icon: "👤" },
                        { step: 6, label: "Finalizing deletion", icon: "🗑️" }
                      ].map(({ step, label, icon }) => (
                        <div
                          key={step}
                          className={`flex items-center gap-3 transition-all duration-300 ${
                            deletingStep >= step
                              ? "opacity-100 translate-x-0"
                              : "opacity-30 translate-x-2"
                          }`}
                        >
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              deletingStep === step ? "text-destructive" : ""
                            }`}>
                              {label}
                            </p>
                            {deletingStep > step && (
                              <p className="text-xs text-muted-foreground">✓ Completed</p>
                            )}
                            {deletingStep === step && (
                              <div className="h-1 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-destructive animate-pulse w-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            {!deleteLoading && (
              <DialogFooter className="flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleteLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1"
                >
                  Delete Account
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
