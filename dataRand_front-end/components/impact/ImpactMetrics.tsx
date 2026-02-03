"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Briefcase, Rocket, Users, DollarSign } from "lucide-react";

interface Scholarship {
  id: string;
  recipient_name: string;
  school_name: string;
  program: string | null;
  amount: number;
  region: string;
  country: string | null;
  status: string;
}

interface BusinessGrant {
  id: string;
  business_name: string;
  owner_name: string | null;
  sector: string | null;
  amount: number;
  region: string;
  country: string | null;
  jobs_created: number;
}

interface IncubatorSponsorship {
  id: string;
  incubator_name: string;
  location: string | null;
  amount: number;
  startups_supported: number;
}

export function ImpactMetrics() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [grants, setGrants] = useState<BusinessGrant[]>([]);
  const [incubators, setIncubators] = useState<IncubatorSponsorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scholarshipRes, grantRes, incubatorRes] = await Promise.all([
          supabase.from("scholarships").select("*").order("created_at", { ascending: false }),
          supabase.from("business_grants").select("*").order("created_at", { ascending: false }),
          supabase.from("incubator_sponsorships").select("*").order("created_at", { ascending: false }),
        ]);

        setScholarships((scholarshipRes.data as Scholarship[]) || []);
        setGrants((grantRes.data as BusinessGrant[]) || []);
        setIncubators((incubatorRes.data as IncubatorSponsorship[]) || []);
      } catch (err) {
        console.error("Error fetching impact data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalScholarshipAmount = scholarships.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalGrantAmount = grants.reduce((sum, g) => sum + Number(g.amount), 0);
  const totalIncubatorAmount = incubators.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalJobsCreated = grants.reduce((sum, g) => sum + (g.jobs_created || 0), 0);
  const totalStartupsSupported = incubators.reduce((sum, i) => sum + (i.startups_supported || 0), 0);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-display font-bold text-purple-500">
              {scholarships.length}
            </p>
            <p className="text-sm text-muted-foreground">Scholarships Awarded</p>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalScholarshipAmount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-display font-bold text-blue-500">{grants.length}</p>
            <p className="text-sm text-muted-foreground">Businesses Funded</p>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalGrantAmount.toLocaleString()} invested
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <Rocket className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-3xl font-display font-bold text-orange-500">
              {incubators.length}
            </p>
            <p className="text-sm text-muted-foreground">Incubators Sponsored</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalStartupsSupported} startups supported
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-display font-bold text-green-500">{totalJobsCreated}</p>
            <p className="text-sm text-muted-foreground">Jobs Created</p>
            <p className="text-xs text-muted-foreground mt-1">Through business grants</p>
          </CardContent>
        </Card>
      </div>

      {/* Scholarships */}
      {scholarships.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-purple-500" />
              Tertiary Education Scholarships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {scholarships.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-lg border border-border/50 bg-muted/30"
                >
                  <p className="font-medium">{s.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{s.school_name}</p>
                  {s.program && (
                    <p className="text-xs text-muted-foreground">{s.program}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded">
                      {s.country || s.region}
                    </span>
                    <span className="text-sm font-medium text-purple-500">
                      ${Number(s.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Grants */}
      {grants.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Business Grants & Funding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {grants.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-lg border border-border/50 bg-muted/30"
                >
                  <p className="font-medium">{g.business_name}</p>
                  {g.owner_name && (
                    <p className="text-sm text-muted-foreground">by {g.owner_name}</p>
                  )}
                  {g.sector && (
                    <p className="text-xs text-muted-foreground">{g.sector}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
                      {g.jobs_created} jobs created
                    </span>
                    <span className="text-sm font-medium text-blue-500">
                      ${Number(g.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incubators */}
      {incubators.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-orange-500" />
              Startup Incubator Sponsorships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {incubators.map((i) => (
                <div
                  key={i.id}
                  className="p-4 rounded-lg border border-border/50 bg-muted/30"
                >
                  <p className="font-medium">{i.incubator_name}</p>
                  {i.location && (
                    <p className="text-sm text-muted-foreground">{i.location}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded">
                      {i.startups_supported} startups
                    </span>
                    <span className="text-sm font-medium text-orange-500">
                      ${Number(i.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
