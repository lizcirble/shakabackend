"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { 
  User, Bell, Palette, Globe, Smartphone, Shield, 
  Upload, Save 
} from "lucide-react";

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${profile.auth_id}/${Date.now()}.${fileExt}`;

      // Check if bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!bucketExists) {
        await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData({ ...formData, avatar_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully!",
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload failed",
        description: `Failed to upload profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <div className="text-center sm:text-left">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Badge variant="secondary">{profile?.role}</Badge>
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
                <Label>Auto-Accept Tasks</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Automatically accept suitable tasks</p>
              </div>
              <Switch
                checked={preferences.autoAcceptTasks}
                onCheckedChange={(checked) => setPreferences({ ...preferences, autoAcceptTasks: checked })}
              />
            </div>
            <Separator />
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
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full">
              Download My Data
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
