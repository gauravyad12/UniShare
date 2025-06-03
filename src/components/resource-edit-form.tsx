"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useRouter } from "next/navigation";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  course_code?: string;
  external_link?: string;
  file_url?: string;
}

interface ResourceEditFormProps {
  resource: Resource;
  onSubmit?: (isLoading: boolean) => void;
  onCancel?: () => void;
}

export interface ResourceEditFormRef {
  handleSubmit: () => void;
}

const ResourceEditForm = forwardRef<ResourceEditFormRef, ResourceEditFormProps>(
  ({ resource, onSubmit, onCancel }, ref) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [errors, setErrors] = useState({
      title: "",
      description: "",
      resource_type: "",
      course_code: "",
      external_link: ""
    });
    const [formData, setFormData] = useState({
      title: resource.title,
      description: resource.description || "",
      resource_type: resource.resource_type,
      course_code: resource.course_code || "",
      external_link: resource.external_link || "",
    });

    // Character limits for each field
    const charLimits = {
      title: 25,
      description: 100,
      course_code: 10,
      external_link: 100
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const { name, value } = e.target;

      // Check if the value exceeds the character limit
      const fieldName = name as keyof typeof charLimits;
      if (charLimits[fieldName] && value.length > charLimits[fieldName]) {
        return; // Don't update if exceeding the limit
      }

      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error for this field when user starts typing
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: "" }));
      }
    };

    const handleSelectChange = (name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error for this field when user changes selection
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: "" }));
      }
    };

    const validateForm = async (): Promise<boolean> => {
      setGlobalError(null);
      // Reset all errors
      const newErrors = {
        title: "",
        description: "",
        resource_type: "",
        course_code: "",
        external_link: ""
      };

      let isValid = true;

      // Check title
      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
        isValid = false;
      }

      // Check for bad words in title and description
      const { containsBadWords } = await import('@/utils/badWords');

      if (await containsBadWords(formData.title)) {
        newErrors.title = "Title contains inappropriate language";
        isValid = false;
      }

      if (formData.description && await containsBadWords(formData.description)) {
        newErrors.description = "Description contains inappropriate language";
        isValid = false;
      }

      if (formData.course_code && await containsBadWords(formData.course_code)) {
        newErrors.course_code = "Course code contains inappropriate language";
        isValid = false;
      }

      // Validate course code format if provided
      if (formData.course_code) {
        const courseCodeRegex = /^[A-Z]{2,4}\d{3,4}$/;
        if (!courseCodeRegex.test(formData.course_code)) {
          newErrors.course_code = "Please enter a valid course code (e.g., CS101, MATH200)";
          isValid = false;
        }
      }

      // Check resource type specific requirements
      if (formData.resource_type === "link") {
        if (!formData.external_link) {
          newErrors.external_link = "URL is required for link resources";
          isValid = false;
        } else {
          // Validate URL format
          try {
            const url = new URL(formData.external_link);
            // Check if protocol is http or https
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              newErrors.external_link = "URL must start with http:// or https://";
              isValid = false;
            }
          } catch (e) {
            newErrors.external_link = "Please enter a valid URL (e.g., https://example.com)";
            isValid = false;
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();
      setIsLoading(true);
      setGlobalError(null);
      onSubmit?.(true);

      // Validate form
      const isValid = await validateForm();
      if (!isValid) {
        setIsLoading(false);
        onSubmit?.(false);
        return;
      }

      try {
        const response = await fetch(`/api/resources/${resource.id}/edit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update resource");
        }

        // Success - refresh the page
        router.refresh();

        // Close the dialog by dispatching a custom event
        const closeEvent = new CustomEvent("resource-edit-complete");
        document.dispatchEvent(closeEvent);
      } catch (err: any) {
        setGlobalError(err.message || "An error occurred while updating the resource");
      } finally {
        setIsLoading(false);
        onSubmit?.(false);
      }
    };

    // Expose the submit function via ref
    useImperativeHandle(ref, () => ({
      handleSubmit: () => handleSubmit()
    }));

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global error message */}
        {globalError && (
          <div className="bg-red-100 text-red-600 font-medium px-4 py-2 rounded-md text-sm">
            {globalError}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="title">Title</Label>
            <span className="text-xs text-muted-foreground">{formData.title.length}/{charLimits.title}</span>
          </div>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Resource title"
            required
            maxLength={charLimits.title}
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
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
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe this resource"
            rows={3}
            maxLength={charLimits.description}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between pb-[1.5px]">
              <Label htmlFor="resource_type">Resource Type</Label>
            </div>
            <Select
              name="resource_type"
              value={formData.resource_type}
              onValueChange={(value) =>
                handleSelectChange("resource_type", value)
              }
            >
              <SelectTrigger className={errors.resource_type ? "border-red-500" : ""}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="textbook">Textbook</SelectItem>
                <SelectItem value="solution">Solution</SelectItem>
                <SelectItem value="study guide">Study Guide</SelectItem>
                <SelectItem value="practice exam">Practice Exam</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
              </SelectContent>
            </Select>
            {errors.resource_type && (
              <p className="text-sm text-red-500 mt-1">{errors.resource_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="course_code">Course Code</Label>
              <span className="text-xs text-muted-foreground">{formData.course_code.length}/{charLimits.course_code}</span>
            </div>
            <Input
              id="course_code"
              name="course_code"
              value={formData.course_code}
              onChange={(e) => {
                // Convert to uppercase
                const value = e.target.value.toUpperCase();

                // Check if the value exceeds the character limit
                if (value.length <= charLimits.course_code) {
                  setFormData((prev) => ({ ...prev, course_code: value }));

                  // Clear error for this field
                  if (errors.course_code) {
                    setErrors(prev => ({ ...prev, course_code: "" }));
                  }
                }
              }}
              placeholder="e.g., CS101, MATH200"
              maxLength={charLimits.course_code}
              className={errors.course_code ? "border-red-500" : ""}
            />
            {errors.course_code && (
              <p className="text-sm text-red-500 mt-1">{errors.course_code}</p>
            )}
          </div>
        </div>

        {formData.resource_type === "link" && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="external_link">External URL</Label>
              <span className="text-xs text-muted-foreground">{formData.external_link.length}/{charLimits.external_link}</span>
            </div>
            <Input
              id="external_link"
              name="external_link"
              value={formData.external_link}
              onChange={handleChange}
              placeholder="https://example.com"
              required={formData.resource_type === "link"}
              maxLength={charLimits.external_link}
              type="url"
              className={errors.external_link ? "border-red-500" : ""}
            />
            {errors.external_link && (
              <p className="text-sm text-red-500 mt-1">{errors.external_link}</p>
            )}
          </div>
        )}
      </form>
    );
  }
);

ResourceEditForm.displayName = "ResourceEditForm";

export default ResourceEditForm;
