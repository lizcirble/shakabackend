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
import { ArrowLeft, Loader2, Image, Headphones, Brain, Plus, DollarSign, Users, Globe, Upload, X, Video, Info, FileText, Clock } from "lucide-react";
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

  const uploadMediaToSupabase = async (file: File): Promise<{ url: string; type: string } | null> => {
    if (!profile) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload media.", variant: "destructive" });
      return null;
    }
  
    setUploadingMedia(true);
  
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExtension}`;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
  
      const { data, error } = await supabase.storage
        .from('task_media')
        .upload(fileName, file);
  
      if (error) {
        throw error;
      }
  
      const { data: publicUrlData } = supabase.storage
        .from('task_media')
        .getPublicUrl(data.path);
  
      toast({
        title: "Media Uploaded Successfully",
        description: "Your file has been stored in Supabase.",
      });
  
      return { url: publicUrlData.publicUrl, type: mediaType };
    } catch (error: any) {
      console.error("Supabase upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload media to Supabase.",
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
      let mediaData: { url: string; type: string } | null = null;
      if (mediaFile) {
        mediaData = await uploadMediaToSupabase(mediaFile);
        if (!mediaData) {
          setLoading(false);
          return; // Stop if media upload fails
        }
      }
  
      const newTask = {
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
      };
  
      const { error } = await supabase.from("tasks").insert([newTask]);
  
      if (error) {
        throw error;
      }
  
      toast({
        title: "Task Created Successfully",
        description: "Your task has been posted and is now available to workers.",
      });
  
      router.push("/client/tasks");
    } catch (err: any) {
      console.error("Error creating task:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create task. Please try again.",
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
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

              {/* Review Section */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Review Your Task
                  </CardTitle>
                  <CardDescription>
                    Please review the details below before creating the task.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Payout per worker
                      </p>
                      <p className="text-sm font-bold">
                        ${parseFloat(formData.payout_amount || "0").toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Number of workers
                      </p>
                      <p className="text-sm font-bold">
                        {parseInt(formData.worker_count || "1")}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Estimated time per task
                      </p>
                      <p className="text-sm font-bold">
                        {formData.estimated_time_minutes} minutes
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-lg border">
                     <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p className="text-muted-foreground">
                          ${(parseFloat(formData.payout_amount || "0") * parseInt(formData.worker_count || "1")).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Platform Fee (15%)</p>
                        <p className="text-muted-foreground">
                          ${((parseFloat(formData.payout_amount || "0") * parseInt(formData.worker_count || "1")) * 0.15).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center font-bold text-base">
                        <p>Total Cost</p>
                        <p>
                          ${((parseFloat(formData.payout_amount || "0") * parseInt(formData.worker_count || "1")) * 1.15).toFixed(2)}
                        </p>
                      </div>
                  </div>
                  <p className="text-xs text-muted-foreground px-3">
                    The platform fee supports our operations and ensures we can connect you with quality workers. Workers receive 100% of the payout amount shown per worker.
                  </p>
                </CardContent>
              </Card>

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
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Task...
                    </>
                  ) : uploadingMedia ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading Media...
                    </>
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