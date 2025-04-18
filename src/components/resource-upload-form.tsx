"use client";

import { useEffect, useState } from "react";
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
import { Upload, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
// Import badWords dynamically to use the async version

export default function ResourceUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<string>("notes");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [badWords, setBadWords] = useState<string[]>([]);

  // Character limits for each field
  const charLimits = {
    title: 100,
    description: 500,
    courseCode: 20,
    externalLink: 500
  };

  // We'll use the dynamic import of badWords utility instead of maintaining our own list

  const validateForm = async (): Promise<boolean> => {
    setError(null);

    // Check title
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }

    // Check description
    if (!description.trim()) {
      setError("Description is required");
      return false;
    }

    // Check course code
    if (!courseCode.trim()) {
      setError("Course code is required");
      return false;
    }

    // Check for bad words in title and description
    const { containsBadWords } = await import('@/utils/badWords');

    if (await containsBadWords(title)) {
      setError("Title contains inappropriate language");
      return false;
    }

    if (await containsBadWords(description)) {
      setError("Description contains inappropriate language");
      return false;
    }

    if (courseCode && await containsBadWords(courseCode)) {
      setError("Course code contains inappropriate language");
      return false;
    }

    // Check resource type specific requirements
    if (resourceType === "link" && !externalLink) {
      setError("URL is required for link resources");
      return false;
    }

    if (resourceType !== "link" && !selectedFile) {
      setError("File is required for non-link resources");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate form
    const isValid = await validateForm();
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", resourceType);
    formData.append("course_code", courseCode);

    // Add file to form data if selected
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    // Add external URL if resource type is link
    if (resourceType === "link") {
      formData.append("external_link", externalLink);
    }

    try {
      const response = await fetch("/api/resources/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload resource");
      }

      // Success - refresh the page and navigate back to resources
      router.refresh();

      // Navigate back to resources list, preserving other query params
      const params = new URLSearchParams(searchParams.toString());
      params.delete("upload");
      router.push(`/dashboard/resources?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while uploading the resource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are accepted');
        setSelectedFile(null);
        return;
      }

      setError(null);
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleTypeChange = (value: string) => {
    setResourceType(value);
    // Clear file or URL based on type
    if (value === "link") {
      setSelectedFile(null);
    } else {
      setExternalLink("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Global error messages for non-file errors */}
      {error && !error.includes("PDF") && (
        <div className="bg-red-100 text-red-600 font-medium px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="title">Title</Label>
          <span className="text-xs text-muted-foreground">{title.length}/{charLimits.title}</span>
        </div>
        <Input
          id="title"
          name="title"
          placeholder="Resource title"
          value={title}
          onChange={(e) => {
            if (e.target.value.length <= charLimits.title) {
              setTitle(e.target.value);
            }
          }}
          maxLength={charLimits.title}
          required
          className={error && error.includes("Title") ? "border-red-500" : ""}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="description">Description</Label>
          <span className="text-xs text-muted-foreground">{description.length}/{charLimits.description}</span>
        </div>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe this resource"
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= charLimits.description) {
              setDescription(e.target.value);
            }
          }}
          maxLength={charLimits.description}
          rows={3}
          required
          className={error && error.includes("Description") ? "border-red-500" : ""}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Resource Type</Label>
          <Select
            name="type"
            value={resourceType}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger>
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
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="course_code">Course Code</Label>
            <span className="text-xs text-muted-foreground">{courseCode.length}/{charLimits.courseCode}</span>
          </div>
          <Input
            id="course_code"
            name="course_code"
            placeholder="e.g. CS101"
            value={courseCode}
            onChange={(e) => {
              if (e.target.value.length <= charLimits.courseCode) {
                setCourseCode(e.target.value);
              }
            }}
            maxLength={charLimits.courseCode}
            required
            className={error && error.includes("Course code") ? "border-red-500" : ""}
          />
        </div>
      </div>

      {resourceType === "link" ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="external_link">External URL</Label>
            <span className="text-xs text-muted-foreground">{externalLink.length}/{charLimits.externalLink}</span>
          </div>
          <Input
            id="external_link"
            placeholder="https://example.com"
            value={externalLink}
            onChange={(e) => {
              if (e.target.value.length <= charLimits.externalLink) {
                setExternalLink(e.target.value);
              }
            }}
            maxLength={charLimits.externalLink}
            required
            className={error && error.includes("URL") ? "border-red-500" : ""}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <div className={`border-2 border-dashed ${error && error.includes("PDF") ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-md p-4 transition-colors`}>
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <span className="text-sm truncate max-w-[80%]">
                  {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className={`mx-auto h-8 w-8 ${error && error.includes("PDF") ? "text-destructive" : "text-gray-400"} mb-2 transition-colors`} />
                {error && error.includes("PDF") ? (
                  <div className="mb-2">
                    <p className="text-sm text-destructive font-medium">
                      Only PDF files are accepted
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please select a PDF document to continue
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop or click to upload (PDF only)
                  </p>
                )}
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant={error && error.includes("PDF") ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("upload");
            router.push(`/dashboard/resources?${params.toString()}`);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Uploading..." : "Upload Resource"}
        </Button>
      </div>
    </form>
  );
}
