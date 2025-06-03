import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileImage, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AnalyzedCourse {
  code: string;
  name: string;
  credits: number;
  semester: string;
  status: 'completed' | 'missing' | 'suggested';
  confidence: number;
  prerequisites?: string[];
}

interface AnalysisResult {
  courses: AnalyzedCourse[];
  suggestedPaths: {
    name: string;
    description: string;
    courses: string[];
    duration: string;
    totalCredits?: number;
  }[];
  insights: {
    totalCoursesFound: number;
    completedCourses: number;
    remainingCourses: number;
    estimatedGraduationDate: string;
    recommendations: string[];
  };
  error?: string;
}

interface FlowchartUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  userCourses: any[];
}

const FlowchartUpload: React.FC<FlowchartUploadProps> = ({ onAnalysisComplete, userCourses }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return false;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to server
      const formData = new FormData();
      formData.append('flowchart', file);
      formData.append('userCourses', JSON.stringify(userCourses));

      const response = await fetch('/api/flowchart/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      setUploadProgress(100);
      clearInterval(progressInterval);
      
      // Get job ID from response
      const result = await response.json();
      if (!result.success || !result.jobId) {
        throw new Error('Failed to start analysis');
      }

      // Upload is complete, now start analysis phase
      setIsUploading(false);
      setUploadProgress(0);
      
      // Start polling for job completion
      await pollJobStatus(result.jobId);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle different types of errors with specific messaging
      if (error instanceof Error) {
        if (error.message.includes('File too large')) {
          toast({
            title: "File Too Large",
            description: "Please compress your image or use a smaller file (max 10MB).",
            variant: "destructive",
          });
        } else if (error.message.includes('Invalid file type')) {
          toast({
            title: "Invalid File Type",
            description: "Please upload a PNG or JPG image file.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Upload Error",
            description: error.message || "Failed to upload flowchart. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
      
      // Clear uploaded image on error so user can try again
      setUploadedImage(null);
      
      // Reset all states on error
      setIsAnalyzing(false);
      setAnalysisStep('');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    setIsAnalyzing(true);
    
    const analysisSteps = [
      'Starting AI analysis...',
      'Extracting text from flowchart...',
      'Identifying course codes and names...',
      'Matching with your completed courses...',
      'Analyzing prerequisite relationships...',
      'Generating optimal pathways...',
      'Finalizing recommendations...'
    ];

    let stepIndex = 0;
    let pollCount = 0;
    const maxPolls = 60; // Maximum 5 minutes (5 second intervals)

    // Set initial step
    setAnalysisStep(analysisSteps[0]);

    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        
        // Update analysis step for better UX - advance every 1 poll (5 seconds)
        if (stepIndex < analysisSteps.length - 1 && pollCount % 1 === 0) {
          stepIndex++;
          setAnalysisStep(analysisSteps[stepIndex]);
        }

        const statusResponse = await fetch(`/api/flowchart/status/${jobId}`);
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check analysis status');
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed' && statusData.analysis) {
          clearInterval(pollInterval);
          setAnalysisStep('Analysis complete!');
          
          // Show completion message briefly before clearing
          setTimeout(async () => {
            // Clean up the job after successful completion
            try {
              await cleanupJob(jobId);
            } catch (cleanupError) {
              console.warn('Failed to cleanup job:', cleanupError);
              // Don't fail the entire process if cleanup fails
            }

            onAnalysisComplete(statusData.analysis);
            toast({
              title: "Success",
              description: "Flowchart analysis completed successfully!",
              variant: "default",
            });
            
            setIsAnalyzing(false);
            setAnalysisStep('');
          }, 1000);
          return;
        }

        if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          
          // Clean up failed job as well
          try {
            await cleanupJob(jobId);
          } catch (cleanupError) {
            console.warn('Failed to cleanup failed job:', cleanupError);
          }
          
          throw new Error(statusData.error || 'Analysis failed');
        }

        // Check for timeout
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          
          // Clean up timed out job
          try {
            await cleanupJob(jobId);
          } catch (cleanupError) {
            console.warn('Failed to cleanup timed out job:', cleanupError);
          }
          
          throw new Error('Analysis timeout - please try again with a clearer image');
        }

      } catch (error) {
        clearInterval(pollInterval);
        console.error('Polling error:', error);
        
        if (error instanceof Error) {
          toast({
            title: "Analysis Error",
            description: error.message || "Failed to analyze flowchart. Please try again.",
            variant: "destructive",
          });
        }

        // Create error result
        const errorResult: AnalysisResult = {
          courses: [],
          suggestedPaths: [],
          insights: {
            totalCoursesFound: 0,
            completedCourses: 0,
            remainingCourses: 0,
            estimatedGraduationDate: 'Unable to determine',
            recommendations: ['Please try uploading a clearer image of your flowchart']
          },
          error: error instanceof Error ? error.message : 'Failed to analyze flowchart'
        };
        
        onAnalysisComplete(errorResult);
        setIsAnalyzing(false);
        setAnalysisStep('');
      }
    }, 5000); // Poll every 5 seconds
  };

  // Helper function to clean up completed/failed jobs
  const cleanupJob = async (jobId: string) => {
    try {
      console.log(`Attempting to cleanup job: ${jobId}`);
      
      const response = await fetch(`/api/flowchart/status/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`Job cleanup failed for ${jobId}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: response.url
        });
        throw new Error(errorMessage);
      }

      const result = await response.json().catch(() => ({}));
      console.log(`Job cleaned up successfully: ${jobId}`, result);
    } catch (error) {
      console.error(`Job cleanup error for ${jobId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        jobId,
        timestamp: new Date().toISOString()
      });
      
      // Log additional context for debugging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error during job cleanup - possible connectivity issue');
      } else if (error instanceof Error && error.message.includes('401')) {
        console.error('Authentication error during job cleanup - user may be logged out');
      } else if (error instanceof Error && error.message.includes('404')) {
        console.error('Job not found during cleanup - may have been already deleted or never existed');
      }
      
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="space-y-4">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : isUploading 
                ? 'border-blue-300 bg-gray-500/10' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileUpload}
        >
          {uploadedImage ? (
            <div className="space-y-4">
              <img 
                src={uploadedImage} 
                alt="Uploaded flowchart" 
                className="max-h-48 mx-auto rounded-lg shadow-md"
              />
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Flowchart uploaded successfully</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileImage className={`h-12 w-12 mx-auto transition-colors ${
                isDragOver ? 'text-primary' : 'text-gray-400'
              }`} />
              <div>
                <p className="text-lg font-medium">
                  {isDragOver ? 'Drop your flowchart here' : 'Upload your degree flowchart'}
                </p>
                <p className="text-sm text-gray-500">
                  {isDragOver 
                    ? 'Release to upload' 
                    : 'Drag and drop or click to browse • PNG or JPG up to 10MB'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  💡 Tip: For faster analysis, use clear, high-contrast images under 2MB
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileUpload();
                }}
                disabled={isUploading || isAnalyzing}
                className="mt-4"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading flowchart...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Analyzing flowchart with AI...</span>
            </div>
            {analysisStep && (
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <p className="text-sm font-medium">{analysisStep}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium">Course Matching</h4>
            <p className="text-sm opacity-70">Automatically identifies completed courses</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Brain className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium">Smart Pathways</h4>
            <p className="text-sm opacity-70">Suggests optimal course sequences</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium">Prerequisite Analysis</h4>
            <p className="text-sm opacity-70">Identifies course dependencies</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <FileImage className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium">Visual Recognition</h4>
            <p className="text-sm opacity-70">Extracts data from flowchart images</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default FlowchartUpload; 