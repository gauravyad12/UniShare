"use client";

import { useState } from "react";
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
import { Upload, X, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkUrlSafety } from "@/utils/urlSafety";
import { useToast } from "./ui/use-toast";
import ProfessorSearch from "./professor-search";
import { Professor } from "@/utils/rateMyProfessor";
// Import badWords dynamically to use the async version

export default function ResourceUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    courseCode: "",
    externalLink: "",
    file: "",
    professor: ""
  });
  const [resourceType, setResourceType] = useState<string>("notes");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [externalLink, setExternalLink] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [urlSafetyStatus, setUrlSafetyStatus] = useState<'unknown' | 'checking' | 'safe' | 'unsafe'>('unknown');

  // Character limits for each field
  const charLimits = {
    title: 25,
    description: 100,
    courseCode: 10,
    externalLink: 100
  };

  // We'll use the dynamic import of badWords utility instead of maintaining our own list

  const validateForm = async (): Promise<boolean> => {
    setGlobalError(null);
    // Reset all errors
    const newErrors = {
      title: "",
      description: "",
      courseCode: "",
      externalLink: "",
      file: "",
      professor: ""
    };

    let isValid = true;

    // Check title
    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }

    // Check description
    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    // Check course code
    if (!courseCode.trim()) {
      newErrors.courseCode = "Course code is required";
      isValid = false;
    } else {
      // Validate course code format
      const courseCodeRegex = /^[A-Z]{2,4}\d{3,4}$/;
      if (!courseCodeRegex.test(courseCode)) {
        newErrors.courseCode = "Please enter a valid course code (e.g., CS101, MATH200)";
        isValid = false;
      }
    }

    // Check for bad words in title and description
    const { containsBadWords } = await import('@/utils/badWords');

    if (await containsBadWords(title)) {
      newErrors.title = "Title contains inappropriate language";
      isValid = false;
    }

    if (await containsBadWords(description)) {
      newErrors.description = "Description contains inappropriate language";
      isValid = false;
    }

    if (courseCode && await containsBadWords(courseCode)) {
      newErrors.courseCode = "Course code contains inappropriate language";
      isValid = false;
    }

    // Check resource type specific requirements
    if (resourceType === "link") {
      if (!externalLink) {
        newErrors.externalLink = "URL is required for link resources";
        isValid = false;
      } else {
        // Validate URL format
        try {
          const url = new URL(externalLink);
          // Check if protocol is http or https
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            newErrors.externalLink = "URL must start with http:// or https://";
            isValid = false;
          }

          // Check URL safety if it's a valid URL
          if (isValid && urlSafetyStatus === 'unknown') {
            // If we haven't checked the URL safety yet, do it now
            await checkUrlSafetyStatus(externalLink);
          }

          // If the URL is unsafe, show an error and prevent submission
          if (urlSafetyStatus === 'unsafe') {
            newErrors.externalLink = "This link has been flagged as potentially unsafe and cannot be submitted.";
            isValid = false;
            toast({
              title: "Unsafe Link Detected",
              description: "This link has been flagged as potentially unsafe and cannot be submitted. Please provide a different URL.",
              variant: "destructive",
            });
          }
        } catch (e) {
          newErrors.externalLink = "Please enter a valid URL (e.g., https://example.com)";
          isValid = false;
        }
      }
    }

    if (resourceType !== "link" && !selectedFile) {
      newErrors.file = "File is required for non-link resources";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setGlobalError(null);

    // Double-check URL safety for link resources
    if (resourceType === "link" && urlSafetyStatus === 'unsafe') {
      setErrors(prev => ({
        ...prev,
        externalLink: "This link has been flagged as potentially unsafe and cannot be submitted."
      }));
      setIsLoading(false);
      toast({
        title: "Unsafe Link Detected",
        description: "This link has been flagged as potentially unsafe and cannot be submitted. Please provide a different URL.",
        variant: "destructive",
      });
      return;
    }

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

    // Add professor information if selected
    if (professor) {
      formData.append("professor", `${professor.firstName} ${professor.lastName}`);
      // You can also include additional professor data if needed
      formData.append("professor_data", JSON.stringify({
        id: professor.id,
        firstName: professor.firstName,
        lastName: professor.lastName,
        department: professor.department || '',
        school: professor.school ? professor.school.name : '',
        rating: professor.rating || 0,
        numRatings: professor.numRatings || 0
      }));
    }

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
      setGlobalError(err.message || "An error occurred while uploading the resource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, file: 'Only PDF files are accepted' }));
        setSelectedFile(null);
        return;
      }

      setErrors(prev => ({ ...prev, file: '' }));
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle drag and drop functionality
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, file: 'Only PDF files are accepted' }));
        setSelectedFile(null);
        return;
      }

      setErrors(prev => ({ ...prev, file: '' }));
      setSelectedFile(file);
    }
  };

  const handleTypeChange = (value: string) => {
    setResourceType(value);
    // Clear file or URL based on type
    if (value === "link") {
      setSelectedFile(null);
    } else {
      setExternalLink("");
      setUrlSafetyStatus('unknown');
    }
  };

  // Check URL safety
  const checkUrlSafetyStatus = async (url: string) => {
    if (!url || url.trim() === '') {
      setUrlSafetyStatus('unknown');
      return;
    }

    // Validate URL format first
    try {
      new URL(url);
    } catch (e) {
      // Not a valid URL yet, don't check
      setUrlSafetyStatus('unknown');
      return;
    }

    setIsCheckingUrl(true);
    setUrlSafetyStatus('checking');

    try {
      console.log('Checking URL safety for:', url);
      const result = await checkUrlSafety(url);
      console.log('URL safety check result:', result);

      if (!result.isSafe) {
        setUrlSafetyStatus('unsafe');
        toast({
          title: "Warning: Potentially Unsafe Link",
          description: `This link has been flagged as potentially unsafe (${result.threatType || 'Unknown threat'}).`,
          variant: "destructive",
        });
      } else {
        setUrlSafetyStatus('safe');
      }
    } catch (error) {
      console.error('Error checking URL safety:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }

      // Set status to unknown but don't block submission
      setUrlSafetyStatus('unknown');

      // Show a toast with the error
      toast({
        title: "URL Safety Check Failed",
        description: "Could not verify the safety of this URL. You can still submit, but please ensure it's from a trusted source.",
        variant: "warning",
      });
    } finally {
      setIsCheckingUrl(false);
    }
  };

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
              if (errors.title) {
                setErrors(prev => ({ ...prev, title: "" }));
              }
            }
          }}
          maxLength={charLimits.title}
          required
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
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
              if (errors.description) {
                setErrors(prev => ({ ...prev, description: "" }));
              }
            }
          }}
          maxLength={charLimits.description}
          rows={3}
          required
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description}</p>
        )}
      </div>

      {/* Professor Search */}
      <ProfessorSearch
        value={professor}
        onChange={(newProfessor) => {
          setProfessor(newProfessor);
          if (errors.professor) {
            setErrors(prev => ({ ...prev, professor: "" }));
          }
        }}
        error={errors.professor}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between pb-[1.5px]">
            <Label htmlFor="type">Resource Type</Label>
          </div>
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
            placeholder="e.g., CS101, MATH200"
            value={courseCode}
            onChange={(e) => {
              // Convert to uppercase
              const value = e.target.value.toUpperCase();

              if (value.length <= charLimits.courseCode) {
                setCourseCode(value);
                if (errors.courseCode) {
                  setErrors(prev => ({ ...prev, courseCode: "" }));
                }
              }
            }}
            maxLength={charLimits.courseCode}
            required
            className={errors.courseCode ? "border-red-500" : ""}
          />
          {errors.courseCode && (
            <p className="text-sm text-red-500 mt-1">{errors.courseCode}</p>
          )}
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
                if (errors.externalLink) {
                  setErrors(prev => ({ ...prev, externalLink: "" }));
                }
              }
            }}
            onBlur={() => checkUrlSafetyStatus(externalLink)}
            type="url"
            maxLength={charLimits.externalLink}
            required
            className={errors.externalLink ? "border-red-500" : ""}
          />
          {errors.externalLink && (
            <p className="text-sm text-red-500 mt-1">{errors.externalLink}</p>
          )}

          {/* URL Safety Status */}
          {resourceType === "link" && urlSafetyStatus !== 'unknown' && (
            <div className="mt-2">
              <span className={`inline-flex items-center text-sm rounded-md px-3 py-1 ${
                urlSafetyStatus === 'checking'
                  ? 'bg-muted text-muted-foreground'
                  : urlSafetyStatus === 'safe'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {urlSafetyStatus === 'checking' && (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Checking link safety...
                  </>
                )}
                {urlSafetyStatus === 'safe' && (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                    This link appears to be safe
                  </>
                )}
                {urlSafetyStatus === 'unsafe' && (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1.5" />
                    Warning: This link is unsafe and cannot be submitted
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <div
            className={`border-2 border-dashed ${errors.file ? "border-red-500" : isDragging ? "border-primary" : "border-gray-300 dark:border-gray-700"} rounded-md p-4 transition-colors ${isDragging ? "bg-primary/5" : ""}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
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
                <Upload className={`mx-auto h-8 w-8 ${errors.file ? "text-destructive" : "text-gray-400"} mb-2 transition-colors`} />
                {errors.file && errors.file.includes("PDF") ? (
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
                  variant={errors.file ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>
          {errors.file && !errors.file.includes("PDF") && (
            <p className="text-sm text-red-500 mt-1">{errors.file}</p>
          )}
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
