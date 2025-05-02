"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Loader2, Lock, Unlock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { createClient } from "@/utils/supabase/client";

interface CreateStudyGroupFormProps {
  universityId: string;
}

export default function CreateStudyGroupForm({
  universityId,
}: CreateStudyGroupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    courseCode: "",
    isPrivate: false,
    maxMembers: "10",
  });

  // Character limits for each field
  const charLimits = {
    name: 25,
    description: 100,
    courseCode: 10,
  };
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
    courseCode?: string;
  }>({});

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Check if the value exceeds the character limit
    const fieldName = name as keyof typeof charLimits;
    if (charLimits[fieldName] && value.length > charLimits[fieldName]) {
      return; // Don't update if exceeding the limit
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Always check for bad words when a field changes
    if (value.trim()) {
      const { containsBadWords } = await import('@/utils/badWords');
      const hasBadWords = await containsBadWords(value);

      if (hasBadWords) {
        // Has bad words
        setFormErrors(prev => ({
          ...prev,
          [name]: `${name === 'name' ? 'Group name' : name === 'description' ? 'Description' : 'Course code'} contains inappropriate language`
        }));
      } else {
        // No bad words, clear the error
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as keyof typeof formErrors];
          return newErrors;
        });
      }
    } else {
      // Field is empty, clear the error
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof formErrors];
        return newErrors;
      });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPrivate: checked }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, maxMembers: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Clear previous errors
    setFormErrors({});
    let hasErrors = false;
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Group name is required";
      hasErrors = true;
    }

    // Import the bad words utility
    const { containsBadWords } = await import('@/utils/badWords');

    // Check for bad words in name
    if (formData.name && await containsBadWords(formData.name)) {
      errors.name = "Group name contains inappropriate language";
      hasErrors = true;
    }

    // Check for bad words in description
    if (formData.description && await containsBadWords(formData.description)) {
      errors.description = "Description contains inappropriate language";
      hasErrors = true;
    }

    // Check for bad words in course code
    if (formData.courseCode && await containsBadWords(formData.courseCode)) {
      errors.courseCode = "Course code contains inappropriate language";
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare the data for the API
      const apiData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        course_code: formData.courseCode.trim() || null,
        is_private: formData.isPrivate,
        max_members: parseInt(formData.maxMembers) || 0,
        university_id: universityId,
      };

      console.log('Creating study group with data:', apiData);

      // Call the API to create the study group
      const response = await fetch('/api/study-groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error creating study group:', data.error);
        throw new Error(data.error || 'Failed to create study group');
      }

      console.log('Study group created successfully:', data.studyGroup);

      // No need to join the study group - the stored procedure already handles that

      // Add a small delay before redirecting to ensure database operations complete
      setTimeout(() => {
        // Redirect to the new study group page using URL parameters
        router.push(`/dashboard/study-groups?view=${data.studyGroup.id}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to create study group:", err.message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="name">Group Name *</Label>
          <span className="text-xs text-muted-foreground">{formData.name.length}/{charLimits.name}</span>
        </div>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Calculus Study Group"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={charLimits.name}
          className={formErrors.name ? "border-red-500" : ""}
        />
        {formErrors.name && (
          <p className="text-xs text-red-500">{formErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="description">Description</Label>
          <span className="text-xs text-muted-foreground">{formData.description.length}/{charLimits.description}</span>
        </div>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the purpose and goals of your study group..."
          value={formData.description}
          onChange={handleChange}
          rows={4}
          maxLength={charLimits.description}
          className={formErrors.description ? "border-red-500" : ""}
        />
        {formErrors.description && (
          <p className="text-xs text-red-500">{formErrors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="courseCode">Course Code (Optional)</Label>
          <span className="text-xs text-muted-foreground">{formData.courseCode.length}/{charLimits.courseCode}</span>
        </div>
        <Input
          id="courseCode"
          name="courseCode"
          placeholder="e.g., MATH101"
          value={formData.courseCode}
          onChange={handleChange}
          maxLength={charLimits.courseCode}
          className={formErrors.courseCode ? "border-red-500" : ""}
        />
        {formErrors.courseCode && (
          <p className="text-xs text-red-500">{formErrors.courseCode}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="isPrivate">Private Group</Label>
          <p className="text-sm text-muted-foreground">
            {formData.isPrivate ? (
              <span className="flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Only invited members can join
              </span>
            ) : (
              <span className="flex items-center">
                <Unlock className="h-3 w-3 mr-1" />
                Anyone from your university can join
              </span>
            )}
          </p>
        </div>
        <Switch
          id="isPrivate"
          checked={formData.isPrivate}
          onCheckedChange={handleSwitchChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxMembers">Maximum Members</Label>
        <Select
          value={formData.maxMembers}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="maxMembers">
            <SelectValue placeholder="Select maximum members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 members</SelectItem>
            <SelectItem value="10">10 members</SelectItem>
            <SelectItem value="20">20 members</SelectItem>
            <SelectItem value="50">50 members</SelectItem>
            <SelectItem value="100">100 members</SelectItem>
            <SelectItem value="0">Unlimited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          {Object.keys(formErrors).length > 0 && (
            <div className="text-red-500 text-sm">
              Please fix the errors above before submitting.
            </div>
          )}
        </div>
        <div className="flex space-x-2 ml-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/dashboard/study-groups">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || Object.keys(formErrors).length > 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Study Group"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
