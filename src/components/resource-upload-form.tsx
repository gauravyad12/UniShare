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

  // Fetch bad words on component mount
  useEffect(() => {
    const fetchBadWords = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("bad_words").select("word");

      if (!error && data) {
        setBadWords(data.map((item) => item.word.toLowerCase()));
      }
    };

    fetchBadWords();
  }, []);

  // Check for bad words in text
  const containsBadWords = (text: string): boolean => {
    if (!text || badWords.length === 0) return false;

    const lowerText = text.toLowerCase();
    return badWords.some((word) => lowerText.includes(word));
  };

  const validateForm = (): boolean => {
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
    if (containsBadWords(title)) {
      setError("Title contains inappropriate language");
      return false;
    }

    if (containsBadWords(description)) {
      setError("Description contains inappropriate language");
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
    if (!validateForm()) {
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
      setSelectedFile(e.target.files[0]);
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
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Resource title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe this resource"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
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
          <Label htmlFor="course_code">Course Code</Label>
          <Input
            id="course_code"
            name="course_code"
            placeholder="e.g. CS101"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            required
          />
        </div>
      </div>

      {resourceType === "link" ? (
        <div className="space-y-2">
          <Label htmlFor="external_link">External URL</Label>
          <Input
            id="external_link"
            placeholder="https://example.com"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-4">
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
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop or click to upload
                </p>
                <Input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
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
