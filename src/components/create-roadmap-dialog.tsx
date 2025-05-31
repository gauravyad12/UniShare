"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, Calendar, BookOpen, Target } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import UniversitySearch from "./university-search";

interface CreateRoadmapDialogProps {
  onRoadmapCreated?: (roadmap: any) => void;
  trigger?: React.ReactNode;
}

export default function CreateRoadmapDialog({ 
  onRoadmapCreated,
  trigger 
}: CreateRoadmapDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    major: "",
    university_id: "",
    total_credits: 120,
    expected_graduation: "",
    is_public: false,
    description: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const supabase = createClient();

  // Character limits for form fields
  const charLimits = {
    name: 50,
    major: 50,
    description: 100
  };

  // Load universities on component mount
  useEffect(() => {
    async function loadUniversities() {
      const { data } = await supabase
        .from("universities")
        .select("id, name, logo_url")
        .order("name");
      
      if (data) {
        setUniversities(data);
      }
    }
    
    loadUniversities();
  }, [supabase]);

  // Common majors for quick selection
  const commonMajors = [
    "Computer Science",
    "Business Administration",
    "Engineering",
    "Psychology",
    "Biology",
    "Mathematics",
    "English",
    "History",
    "Economics",
    "Political Science",
    "Chemistry",
    "Physics",
    "Nursing",
    "Education",
    "Art",
    "Music",
    "Communications",
    "Criminal Justice",
    "Marketing",
    "Finance"
  ];

  // Generate graduation years (current year + 1 to current year + 8)
  const currentYear = new Date().getFullYear();
  const graduationYears = [];
  for (let i = 1; i <= 8; i++) {
    const year = currentYear + i;
    graduationYears.push(`Spring ${year}`, `Fall ${year}`);
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Roadmap name is required";
    } else if (formData.name.length > charLimits.name) {
      newErrors.name = `Name must be ${charLimits.name} characters or less`;
    }

    if (!formData.major.trim()) {
      newErrors.major = "Major is required";
    } else if (formData.major.length > charLimits.major) {
      newErrors.major = `Major must be ${charLimits.major} characters or less`;
    }

    if (formData.description && formData.description.length > charLimits.description) {
      newErrors.description = `Description must be ${charLimits.description} characters or less`;
    }

    if (formData.total_credits <= 0 || formData.total_credits < 30 || formData.total_credits > 200) {
      newErrors.total_credits = "Total credits must be between 30 and 200";
    }

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check roadmap name for bad words
    if (formData.name && await containsBadWords(formData.name)) {
      newErrors.name = "Roadmap name contains inappropriate language";
    }

    // Check major for bad words
    if (formData.major && await containsBadWords(formData.major)) {
      newErrors.major = "Major contains inappropriate language";
    }

    // Check description for bad words
    if (formData.description && await containsBadWords(formData.description)) {
      newErrors.description = "Description contains inappropriate language";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!await validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/roadmaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create roadmap");
      }

      const { roadmap } = await response.json();
      
      // Reset form
      setFormData({
        name: "",
        major: "",
        university_id: "",
        total_credits: 120,
        expected_graduation: "",
        is_public: false,
        description: ""
      });
      
      setIsOpen(false);
      
      if (onRoadmapCreated) {
        onRoadmapCreated(roadmap);
      }
    } catch (error) {
      console.error("Error creating roadmap:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Failed to create roadmap" });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      New Roadmap
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0 text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Create Degree Roadmap
          </DialogTitle>
          <DialogDescription>
            Plan your academic journey by creating a personalized degree roadmap
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="name">Roadmap Name *</Label>
                    <span className="text-xs text-muted-foreground">{formData.name.length}/{charLimits.name}</span>
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g., Computer Science Degree Plan"
                    value={formData.name}
                    onChange={async (e) => {
                      const value = e.target.value;
                      if (value.length <= charLimits.name) {
                        handleInputChange("name", value);
                        
                        // Check for bad words in real-time
                        if (value.trim()) {
                          const { containsBadWords } = await import('@/utils/badWords');
                          if (await containsBadWords(value)) {
                            setErrors(prev => ({ ...prev, name: "Roadmap name contains inappropriate language" }));
                          }
                        }
                      }
                    }}
                    maxLength={charLimits.name}
                    className={errors.name ? "border-red-500" : ""}
                    autoFocus={false}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="total_credits">Total Credits</Label>
                    <span className="text-xs text-muted-foreground invisible">0/0</span>
                  </div>
                  <Input
                    id="total_credits"
                    type="number"
                    min="30"
                    max="200"
                    value={formData.total_credits === 0 ? "" : formData.total_credits}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numeric input
                      if (value === "" || /^\d+$/.test(value)) {
                        if (value === "") {
                          handleInputChange("total_credits", 0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            handleInputChange("total_credits", numValue);
                          }
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent non-numeric characters except backspace, delete, tab, escape, enter, and arrow keys
                      if (
                        !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
                        !/[0-9]/.test(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className={errors.total_credits ? "border-red-500" : ""}
                    placeholder="120"
                    autoFocus={false}
                  />
                  {errors.total_credits && (
                    <p className="text-sm text-red-500">{errors.total_credits}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="major">Major *</Label>
                  <span className="text-xs text-muted-foreground">{formData.major.length}/{charLimits.major}</span>
                </div>
                <div className="space-y-2">
                  <Input
                    id="major"
                    placeholder="Enter your major"
                    value={formData.major}
                    onChange={async (e) => {
                      const value = e.target.value;
                      if (value.length <= charLimits.major) {
                        handleInputChange("major", value);
                        
                        // Check for bad words in real-time
                        if (value.trim()) {
                          const { containsBadWords } = await import('@/utils/badWords');
                          if (await containsBadWords(value)) {
                            setErrors(prev => ({ ...prev, major: "Major contains inappropriate language" }));
                          }
                        }
                      }
                    }}
                    maxLength={charLimits.major}
                    className={errors.major ? "border-red-500" : ""}
                    autoFocus={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    {commonMajors.slice(0, 10).map((major) => (
                      <Badge
                        key={major}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          if (major.length <= charLimits.major) {
                            handleInputChange("major", major);
                          }
                        }}
                      >
                        {major}
                      </Badge>
                    ))}
                  </div>
                </div>
                {errors.major && (
                  <p className="text-sm text-red-500">{errors.major}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University</Label>
                  <div className="[&_input]:h-9 [&_input]:text-sm [&_input]:py-1">
                    <UniversitySearch
                      onSelect={(id, name) => handleInputChange("university_id", id)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_graduation">Expected Graduation</Label>
                  <Select
                    value={formData.expected_graduation}
                    onValueChange={(value) => handleInputChange("expected_graduation", value)}
                  >
                    <SelectTrigger className="h-9 py-1 text-sm">
                      <SelectValue placeholder="Select graduation term" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {graduationYears.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <span className="text-xs text-muted-foreground">{formData.description.length}/{charLimits.description}</span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Add a description for your roadmap..."
                  value={formData.description}
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (value.length <= charLimits.description) {
                      handleInputChange("description", value);
                      
                      // Check for bad words in real-time
                      if (value.trim()) {
                        const { containsBadWords } = await import('@/utils/badWords');
                        if (await containsBadWords(value)) {
                          setErrors(prev => ({ ...prev, description: "Description contains inappropriate language" }));
                        }
                      }
                    }
                  }}
                  maxLength={charLimits.description}
                  rows={3}
                  className={errors.description ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Privacy Settings</h3>
              
              <div className="flex items-center justify-between gap-8 p-4 border rounded-lg">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="is_public" className="text-sm font-medium">Make roadmap public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other students to view and use your roadmap as a template
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleInputChange("is_public", checked)}
                    className="h-6"
                    style={{ height: '24px', minHeight: '24px', maxHeight: '24px' }}
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Roadmap
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 