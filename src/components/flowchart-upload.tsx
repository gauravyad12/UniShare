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
          if (prev >= 85 && !isAnalyzing) {
            // Start analysis display when we reach 85%
            setIsAnalyzing(true);
            setAnalysisStep('Preparing analysis...');
          }
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to server
      const formData = new FormData();
      formData.append('flowchart', file);
      formData.append('userCourses', JSON.stringify(userCourses));

      // Create an AbortController with a longer timeout for AI analysis
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      const response = await fetch('/api/flowchart/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(100);
      clearInterval(progressInterval);
      
      // Continue with analysis if not already started
      if (!isAnalyzing) {
        setIsAnalyzing(true);
      }
      
      await analyzeFlowchart(response);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Check if this is a timeout error and the analysis might still be processing
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
        toast({
          title: "Analysis Taking Longer Than Expected",
          description: "The analysis is still processing. Please check the Previous Analyses section in a few moments.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload flowchart. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
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

  const analyzeFlowchart = async (uploadResponse: Response) => {
    // Don't set isAnalyzing here since it might already be true from the progress handler
    
    try {
      const analysisSteps = [
        'Extracting text from flowchart...',
        'Identifying course codes and names...',
        'Matching with your completed courses...',
        'Analyzing prerequisite relationships...',
        'Generating optimal pathways...',
        'Finalizing recommendations...'
      ];

      // Start from the appropriate step if we already started analysis
      const startStep = analysisStep === 'Preparing analysis...' ? 0 : 1;
      
      // Simulate analysis steps for better UX
      for (let i = startStep; i < analysisSteps.length; i++) {
        setAnalysisStep(analysisSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Get the real analysis result from the API
      const result = await uploadResponse.json();
      
      if (result.success && result.analysis) {
        onAnalysisComplete(result.analysis);
        toast({
          title: "Success",
          description: "Flowchart analysis completed successfully!",
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      
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
      
      toast({
        title: "Error",
        description: "Failed to analyze flowchart. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Don't set isAnalyzing to false here since it's handled in processFile
      setAnalysisStep('');
    }
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
        {isUploading && !isAnalyzing && (
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
            <div className="bg-blue-600/10 border border-blue-300 rounded-lg p-4">
              <p className="text-sm text-foreground">{analysisStep}</p>
            </div>
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