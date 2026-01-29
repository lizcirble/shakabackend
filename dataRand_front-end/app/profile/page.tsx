"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, DollarSign, CheckCircle, Star, Zap, Activity } from "lucide-react";

function ProfilePage() {
  const { profile } = useAuth();

  const getInitials = (name: string | null, email: string | null) => {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
          </CardHeader>
          <CardContent className="p-6 flex items-start gap-6 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                {getInitials(profile?.full_name, profile?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="pt-12">
              <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${profile?.total_earnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.tasks_completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.reputation_score}</div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Progression */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5" /> Skill Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Your current skill tier is:</p>
            <Badge className="text-lg" variant="secondary">Beginner</Badge>
            <p className="text-sm text-muted-foreground mt-4">Complete more tasks accurately to advance to 'Verified' and 'Expert' tiers, unlocking higher-value work.</p>
          </CardContent>
        </Card>

        {/* Daily Impact Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Daily Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">A summary of your daily contributions. (Coming soon)</p>
          </CardContent>
        </Card>

        {/* Live Resource Transparency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Live Resource Transparency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Real-time view of your device's contribution. (Coming soon)</p>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

export default withAuth(ProfilePage);
