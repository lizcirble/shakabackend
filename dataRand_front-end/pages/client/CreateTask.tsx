"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type TaskType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Image, Headphones, Brain, Plus, DollarSign, Users, Globe, Upload, X, Video } from "lucide-react";
import { z } from "zod";

const AFRICAN_COUNTRIES = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Senegal", "Morocco", "Egypt", "Tunisia",
  "Cameroon", "Ivory Coast", "Zimbabwe", "Zambia", "Mozambique", "Angola"
];

const TARGET_REGIONS = [
  { value: "all", label: "All Countries" },
  { value: "africa", label: "African Countries" },
  { value: "india", label: "India" },
  { value: "custom", label: "Select Specific Countries" },
];

const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  payout_amount: z.number().min(0.01, "Payout must be at least $0.01"),
  estimated_time_minutes: z.number().min(1, "Estimated time must be at least 1 minute"),
  task_type_id: z.string().uuid("Please select a task type"),
  worker_count: z.number().min(1, "At least 1 worker required").max(1000, "Maximum 1000 workers"),
});

const taskTypeIcons: Record<string, typeof Image> = {
  image_labeling: Image,
  audio_transcription: Headphones,
  ai_evaluation: Brain,
};

export default function CreateTask() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    payout_amount: "",
    estimated_time_minutes: "5",
    task_type_id: "",
    worker_count: "1",
  });

  useEffect(() => {
    if (!authLoading && !profile) {
      console.log("No profile found, redirecting to auth");
      router.push("/auth");
      return;
    }
    // Remove client role restriction - allow all users to create tasks
  }, [authLoading, profile, router]);

  useEffect(() => {
    const fetchTaskTypes = async () => {
      const { data } = await supabase.from("task_types").select("*");
      if (data) setTaskTypes(data as TaskType[]);
    };
    fetchTaskTypes();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadMedia = async (): Promise<{ url: string; type: string } | null> => {
    if (!mediaFile || !profile) return null;

    setUploadingMedia(true);
    try {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${profile.auth_id}/${Date.now()}.${fileExt}`;

      // Check if bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'task-media');
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket('task-media', {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB
        });
        if (createError) {
          console.error("Bucket creation failed:", createError);
          throw new Error(`Failed to create storage bucket: ${createError.message}`);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('task-media')
        .upload(fileName, mediaFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task-media')
        .getPublicUrl(fileName);

      const mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      
      return { url: publicUrl, type: mediaType };
    } catch (err) {
      console.error("Upload error:", err);
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      toast({
        title: "Upload failed", 
        description: `Failed to upload media: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingMedia(false);
    }
  };

  const getTargetCountries = (): string[] => {
    switch (selectedRegion) {
      case "all":
        return ["all"];
      case "africa":
        return AFRICAN_COUNTRIES;
      case "india":
        return ["India"];
      case "custom":
        return selectedCountries.length > 0 ? selectedCountries : ["all"];
      default:
        return ["all"];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    const parsed = taskSchema.safeParse({
      ...formData,
      payout_amount: parseFloat(formData.payout_amount),
      estimated_time_minutes: parseInt(formData.estimated_time_minutes),
      worker_count: parseInt(formData.worker_count),
    });

    if (!parsed.success) {
      toast({
        title: "Validation Error",
        description: parsed.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload media if present
      let mediaData: { url: string; type: string } | null = null;
      if (mediaFile) {
        mediaData = await uploadMedia();
        if (mediaFile && !mediaData) {
          setLoading(false);
          return; // Upload failed, error already shown
        }
      }

      const { error } = await supabase.from("tasks").insert({
        client_id: profile.id,
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        payout_amount: parseFloat(formData.payout_amount),
        estimated_time_minutes: parseInt(formData.estimated_time_minutes),
        task_type_id: formData.task_type_id,
        worker_count: parseInt(formData.worker_count),
        target_countries: getTargetCountries(),
        media_url: mediaData?.url || null,
        media_type: mediaData?.type || null,
        status: "available",
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Task Created!",
        description: "Workers can now see and accept your task.",
      });

      router.push("/client/tasks");
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  if (authLoading || !profile) {
    return null;
  }

  const isVideo = mediaFile?.type.startsWith('video/');

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">Create New Task</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Post a task for workers to complete
            </p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Task Details</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Provide clear instructions for the best results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Task Type */}
              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type</Label>
                <Select
                  value={formData.task_type_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, task_type_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => {
                      const Icon = taskTypeIcons[type.name] || Brain;
                      return (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.description}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Label 100 product images"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what this task involves..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Media (Image or Video)</Label>
                <p className="text-sm text-muted-foreground">
                  Upload an image or video for workers to review and label
                </p>
                
                {mediaPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50">
                    {isVideo ? (
                      <video 
                        src={mediaPreview} 
                        controls 
                        className="w-full max-h-64 object-contain"
                      />
                    ) : (
                      <img 
                        src={mediaPreview} 
                        alt="Preview" 
                        className="w-full max-h-64 object-contain"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-2">
                        <Image className="h-8 w-8 text-muted-foreground" />
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click to upload image or video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, GIF, WebP, MP4, WebM, MOV (max 50MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Detailed Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Step-by-step instructions for completing the task..."
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  rows={5}
                  required
                />
              </div>

              {/* Worker Count */}
              <div className="space-y-2">
                <Label htmlFor="worker_count" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Workers
                </Label>
                <p className="text-sm text-muted-foreground">
                  How many workers should complete this task?
                </p>
                <Input
                  id="worker_count"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="1"
                  value={formData.worker_count}
                  onChange={(e) =>
                    setFormData({ ...formData, worker_count: e.target.value })
                  }
                  required
                />
              </div>

              {/* Target Region */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Target Region
                </Label>
                <p className="text-sm text-muted-foreground">
                  Which regions should this task be available in?
                </p>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target region" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom country selection */}
                {selectedRegion === "custom" && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm font-medium mb-2">Select African Countries:</p>
                    <div className="flex flex-wrap gap-2">
                      {AFRICAN_COUNTRIES.map((country) => (
                        <Button
                          key={country}
                          type="button"
                          variant={selectedCountries.includes(country) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCountry(country)}
                          className="transition-all duration-150"
                        >
                          {country}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => toggleCountry("India")}
                    >
                      {selectedCountries.includes("India") ? "✓ " : "+ "}India
                    </Button>
                  </div>
                )}
              </div>

              {/* Payout & Time */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payout">Payout Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="payout"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={formData.payout_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, payout_amount: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Estimated Time (minutes)</Label>
                  <Input
                    id="time"
                    type="number"
                    min="1"
                    placeholder="5"
                    value={formData.estimated_time_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_time_minutes: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Cost Summary */}
              {formData.payout_amount && formData.worker_count && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium">
                    Total Cost: <span className="text-primary font-bold">
                      ${(parseFloat(formData.payout_amount || "0") * parseInt(formData.worker_count || "1")).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      (${formData.payout_amount} × {formData.worker_count} workers)
                    </span>
                  </p>
                </div>
              )}

              {/* Platform Fee Notice */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>15% Platform Fee:</strong> A service fee applies to task payouts
                  to support platform operations. Workers receive 85% of the payout amount.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-primary-foreground font-semibold order-1 sm:order-2"
                  disabled={loading || uploadingMedia}
                >
                  {loading || uploadingMedia ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}