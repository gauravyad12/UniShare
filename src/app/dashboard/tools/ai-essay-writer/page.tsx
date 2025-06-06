"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Brain, 
  Sparkles, 
  Download, 
  Save, 
  RefreshCw, 
  BookOpen, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Clock,
  FileCheck,
  Wand2,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Pause
} from 'lucide-react';
import DynamicPageTitle from '@/components/dynamic-page-title';
import { createClient } from '@/utils/supabase/client';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogHeaderNoBorder, DialogFooterNoBorder, DialogTitle } from '@/components/ui/dialog';

// Types
interface EssayPrompt {
  id: string;
  title: string;
  description: string;
  type: 'argumentative' | 'analytical' | 'narrative' | 'descriptive' | 'expository' | 'persuasive';
  wordCount: number;
  requirements: string[];
  rubric?: RubricCriteria[];
}

interface RubricCriteria {
  name: string;
  description: string;
  weight: number;
  levels: {
    level: string;
    points: number;
    description: string;
  }[];
}

interface EssayDraft {
  id: string;
  title: string;
  content: string;
  prompt_data?: EssayPrompt;
  word_count: number;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'completed' | 'reviewed';
  essay_type?: string;
  target_word_count?: number;
  citation_style?: string;
  academic_level?: string;
  ai_feedback?: AIFeedback;
  custom_rubric?: string;
}

interface AIFeedback {
  overallScore: number;
  criteriaScores: {
    [key: string]: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
  };
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

export default function AIEssayWriterPage() {
  const [activeTab, setActiveTab] = useState("write");
  const [selectedPrompt, setSelectedPrompt] = useState<EssayPrompt | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [essayTitle, setEssayTitle] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [savedDrafts, setSavedDrafts] = useState<EssayDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<EssayDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [targetWordCount, setTargetWordCount] = useState(500);
  const [essayType, setEssayType] = useState<string>("argumentative");
  const [citationStyle, setCitationStyle] = useState("APA");
  const [academicLevel, setAcademicLevel] = useState("undergraduate");
  const [analysisStep, setAnalysisStep] = useState('');
  const [isDraftModified, setIsDraftModified] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [customRubric, setCustomRubric] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useMobileDetection();
  const supabase = createClient();

  // Function to convert markdown-style formatting to HTML
  const formatEssayContent = (content: string) => {
    if (!content) return '';
    
    return content
      // Convert **bold text** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic text* to <em> (but not if it's already part of **)
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>');
  };

  // Sample prompts
  const samplePrompts: EssayPrompt[] = [
    {
      id: "1",
      title: "Climate Change Impact",
      description: "Analyze the impact of climate change on global food security",
      type: "analytical",
      wordCount: 1000,
      requirements: [
        "Include at least 3 scholarly sources",
        "Discuss both causes and effects",
        "Propose potential solutions",
        "Use proper APA citation format"
      ],
      rubric: [
        {
          name: "Thesis Statement",
          description: "Clear, arguable thesis that addresses the prompt",
          weight: 20,
          levels: [
            { level: "Excellent", points: 18, description: "Clear, specific, and arguable thesis" },
            { level: "Good", points: 15, description: "Clear thesis with minor issues" },
            { level: "Satisfactory", points: 12, description: "Adequate thesis statement" },
            { level: "Needs Improvement", points: 8, description: "Unclear or weak thesis" }
          ]
        },
        {
          name: "Evidence & Analysis",
          description: "Use of credible sources and quality of analysis",
          weight: 30,
          levels: [
            { level: "Excellent", points: 27, description: "Strong evidence with insightful analysis" },
            { level: "Good", points: 24, description: "Good evidence with solid analysis" },
            { level: "Satisfactory", points: 18, description: "Adequate evidence and analysis" },
            { level: "Needs Improvement", points: 12, description: "Weak evidence or analysis" }
          ]
        }
      ]
    },
    {
      id: "2",
      title: "Technology in Education",
      description: "Argue for or against the increased use of AI in classroom learning",
      type: "argumentative",
      wordCount: 750,
      requirements: [
        "Take a clear position",
        "Address counterarguments",
        "Include current examples",
        "Maintain formal academic tone"
      ]
    },
    {
      id: "3",
      title: "Personal Growth Experience",
      description: "Reflect on a significant experience that shaped your worldview",
      type: "narrative",
      wordCount: 600,
      requirements: [
        "Use first-person perspective",
        "Include specific details and examples",
        "Show personal growth or change",
        "Maintain engaging narrative flow"
      ]
    }
  ];

  // Update word count when content changes
  useEffect(() => {
    const words = essayContent.trim().split(/\s+/).filter(word => word.length > 0);
    const newWordCount = essayContent.trim() === '' ? 0 : words.length;
    setWordCount(newWordCount);
  }, [essayContent]);

  // Track modifications to the current draft
  useEffect(() => {
    if (currentDraft) {
      const hasChanged = 
        essayTitle !== currentDraft.title || 
        essayContent !== currentDraft.content ||
        customRubric !== (currentDraft.custom_rubric || '');
      setIsDraftModified(hasChanged);
    } else {
      setIsDraftModified(false);
    }
  }, [essayTitle, essayContent, customRubric, currentDraft]);

  // Load saved drafts
  useEffect(() => {
    loadSavedDrafts();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !currentDraft || !isDraftModified) return;

    const autoSaveTimer = setTimeout(async () => {
      if (essayTitle.trim() && essayContent.trim()) {
        try {
          await saveDraft();
          setLastAutoSave(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [essayTitle, essayContent, customRubric, currentDraft, isDraftModified, autoSaveEnabled]);

  const loadSavedDrafts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('essay_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading drafts:', error);
        return;
      }

      setSavedDrafts(data || []);
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  const saveDraft = async () => {
    if (!essayTitle.trim() || !essayContent.trim()) {
      toast({
        title: "Cannot Save",
        description: "Please add a title and content before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your draft.",
          variant: "destructive",
        });
        return;
      }

      // Determine which prompt to save
      const currentPromptData = selectedPrompt || (customPrompt.trim() ? {
        id: 'custom',
        title: 'Custom Prompt',
        description: customPrompt.trim(),
        type: essayType as any,
        wordCount: targetWordCount,
        requirements: []
      } : null);

      const draftData = {
        title: essayTitle,
        content: essayContent,
        prompt_data: currentPromptData,
        word_count: wordCount,
        essay_type: essayType,
        target_word_count: targetWordCount,
        citation_style: citationStyle,
        academic_level: academicLevel,
        ai_feedback: aiFeedback,
        custom_rubric: customRubric.trim() || null,
        status: 'draft' as const,
        updated_at: new Date().toISOString()
      };

      let error;
      let data;

      if (currentDraft) {
        // Update existing draft
        const result = await supabase
          .from('essay_drafts')
          .update(draftData)
          .eq('id', currentDraft.id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        error = result.error;
        data = result.data;
      } else {
        // Create new draft
        const result = await supabase
          .from('essay_drafts')
          .insert({
            user_id: user.id,
            ...draftData
          })
          .select()
          .single();
        
        error = result.error;
        data = result.data;
      }

      if (error) {
        console.error('Error saving draft:', error);
        toast({
          title: "Save Failed",
          description: "Failed to save your draft. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update current draft reference
      if (data) {
        setCurrentDraft(data);
        setIsDraftModified(false);
      }

      toast({
        title: currentDraft ? "Draft Updated" : "Draft Saved",
        description: currentDraft 
          ? "Your changes have been saved to the existing draft."
          : "Your essay draft has been saved successfully.",
      });

      loadSavedDrafts();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const deleteDraft = async (draftId: string, draftTitle: string) => {
    setDraftToDelete({ id: draftId, title: draftTitle });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!draftToDelete) return;

    setIsDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to delete drafts.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('essay_drafts')
        .delete()
        .eq('id', draftToDelete.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting draft:', error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete the draft. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If the deleted draft was currently loaded, clear the editor
      if (currentDraft?.id === draftToDelete.id) {
        setCurrentDraft(null);
        setEssayTitle("");
        setEssayContent("");
        setSelectedPrompt(null);
        setCustomPrompt("");
        setIsDraftModified(false);
      }

      toast({
        title: "Draft Deleted",
        description: `"${draftToDelete.title}" has been deleted successfully.`,
      });

      loadSavedDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDraftToDelete(null);
    }
  };

  const createNewDraft = () => {
    setCurrentDraft(null);
    setEssayTitle("");
    setEssayContent("");
    setSelectedPrompt(null);
    setCustomPrompt("");
    setCustomRubric("");
    setIsDraftModified(false);
    setAiFeedback(null); // Clear feedback when creating new draft
    setActiveTab("write");
    
    toast({
      title: "New Draft",
      description: "Started a new essay draft.",
    });
  };

  const duplicateDraft = async (draft: EssayDraft) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to duplicate drafts.",
          variant: "destructive",
        });
        return;
      }

      const duplicateData = {
        user_id: user.id,
        title: `${draft.title} (Copy)`,
        content: draft.content,
        prompt_data: draft.prompt_data,
        word_count: draft.word_count,
        essay_type: draft.essay_type || 'argumentative',
        target_word_count: draft.target_word_count || 500,
        citation_style: draft.citation_style || 'APA',
        academic_level: draft.academic_level || 'undergraduate',
        ai_feedback: draft.ai_feedback,
        custom_rubric: draft.custom_rubric,
        status: 'draft' as const
      };

      const { error } = await supabase
        .from('essay_drafts')
        .insert(duplicateData);

      if (error) {
        console.error('Error duplicating draft:', error);
        toast({
          title: "Duplicate Failed",
          description: "Failed to duplicate the draft. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Draft Duplicated",
        description: "A copy of the draft has been created.",
      });

      loadSavedDrafts();
    } catch (error) {
      console.error('Error duplicating draft:', error);
      toast({
        title: "Duplicate Failed",
        description: "An unexpected error occurred while duplicating.",
        variant: "destructive",
      });
    }
  };

  const loadDraft = (draft: EssayDraft) => {
    setCurrentDraft(draft);
    setEssayTitle(draft.title);
    setEssayContent(draft.content);
    setIsDraftModified(false);
    setAiFeedback(draft.ai_feedback || null); // Load saved feedback if available
    
    if (draft.prompt_data) {
      // Check if it's a custom prompt
      if (draft.prompt_data.id === 'custom') {
        setSelectedPrompt(null);
        setCustomPrompt(draft.prompt_data.description || '');
      } else {
        // It's a predefined prompt
        setSelectedPrompt(draft.prompt_data);
        setCustomPrompt('');
      }
    } else {
      setSelectedPrompt(null);
      setCustomPrompt('');
    }
    
    // Load additional metadata if available
    if (draft.essay_type) setEssayType(draft.essay_type);
    if (draft.target_word_count) setTargetWordCount(draft.target_word_count);
    if (draft.citation_style) setCitationStyle(draft.citation_style);
    if (draft.academic_level) setAcademicLevel(draft.academic_level);
    if (draft.custom_rubric) setCustomRubric(draft.custom_rubric);
    
    setActiveTab("write");
    
    toast({
      title: "Draft Loaded",
      description: `Loaded "${draft.title}" into the editor.${draft.ai_feedback ? ' Previous analysis available in Feedback tab.' : ''}`,
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(essayContent);
      toast({
        title: "Copied",
        description: "Essay content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadEssay = () => {
    const content = `${essayTitle}\n\n${essayContent}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${essayTitle || 'essay'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Essay downloaded as text file.",
    });
  };

  const pollJobStatus = async (jobId: string, operationType: 'outline' | 'content' | 'analyze') => {
    const steps = {
      outline: [
        'Starting AI outline generation...',
        'Analyzing essay prompt...',
        'Structuring main arguments...',
        'Creating detailed outline...',
        'Finalizing structure...'
      ],
      content: [
        'Starting AI content generation...',
        'Expanding outline sections...',
        'Developing arguments...',
        'Adding supporting details...',
        'Polishing content...'
      ],
      analyze: [
        'Starting AI essay analysis...',
        'Evaluating thesis and arguments...',
        'Checking organization and flow...',
        'Assessing evidence and support...',
        'Generating feedback...'
      ]
    };

    let stepIndex = 0;
    let pollCount = 0;
    const maxPolls = 60; // Maximum 5 minutes (5 second intervals)

    // Set initial step
    setAnalysisStep(steps[operationType][0]);

    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        
        // Update analysis step for better UX - advance every 2 polls (10 seconds)
        if (stepIndex < steps[operationType].length - 1 && pollCount % 2 === 0) {
          stepIndex++;
          setAnalysisStep(steps[operationType][stepIndex]);
        }

        const statusResponse = await fetch(`/api/essay/status/${jobId}`);
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check analysis status');
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed' && statusData.result) {
          clearInterval(pollInterval);
          setAnalysisStep('Analysis complete!');
          
          // Show completion message briefly before processing result
          setTimeout(async () => {
            // Clean up the job after successful completion
            try {
              await cleanupJob(jobId);
            } catch (cleanupError) {
              console.warn('Failed to cleanup job:', cleanupError);
            }

            // Process the result based on operation type
            if (operationType === 'outline') {
              setEssayContent(statusData.result.outline);
              if (!essayTitle.trim() && statusData.result.title) {
                setEssayTitle(statusData.result.title);
              }
              toast({
                title: "Outline Generated",
                description: "AI has generated an essay outline for you to expand upon.",
              });
            } else if (operationType === 'content') {
              setEssayContent(statusData.result.content);
              toast({
                title: "Content Generated",
                description: "AI has expanded your outline into a full essay draft.",
              });
            } else if (operationType === 'analyze') {
              setAiFeedback(statusData.result.feedback);
              setActiveTab("feedback");
              // Scroll to top when feedback is displayed
              window.scrollTo({ top: 0, behavior: 'smooth' });
              toast({
                title: "Analysis Complete",
                description: "AI has analyzed your essay and provided detailed feedback.",
              });
            }
            
            setIsGenerating(false);
            setIsAnalyzing(false);
            setGenerationProgress(0);
            setAnalysisStep('');
          }, 1000);
          return;
        }

        if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          
          // Clean up failed job
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
          
          throw new Error('Analysis timeout - please try again');
        }

      } catch (error) {
        clearInterval(pollInterval);
        console.error('Polling error:', error);
        
        toast({
          title: "Analysis Error",
          description: error instanceof Error ? error.message : "Failed to complete operation. Please try again.",
          variant: "destructive",
        });
        
        setIsGenerating(false);
        setIsAnalyzing(false);
        setGenerationProgress(0);
        setAnalysisStep('');
      }
    }, 5000); // Poll every 5 seconds
  };

  const cleanupJob = async (jobId: string) => {
    try {
      await fetch(`/api/essay/status/${jobId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Failed to cleanup job:', error);
    }
  };

  const generateEssayOutline = async () => {
    if (!selectedPrompt && !customPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please select a prompt or enter a custom prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const prompt = selectedPrompt?.description || customPrompt;
      
      const response = await fetch('/api/essay/generate-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          essayType,
          wordCount: targetWordCount,
          academicLevel,
          citationStyle,
          requirements: selectedPrompt?.requirements || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start outline generation');
      }

      const result = await response.json();
      
      if (result.success && result.jobId) {
        // Start polling for job status
        await pollJobStatus(result.jobId, 'outline');
      } else {
        throw new Error('Failed to start outline generation');
      }

    } catch (error) {
      console.error('Error generating outline:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate outline. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setAnalysisStep('');
    }
  };

  const generateEssayContent = async () => {
    if (!essayContent.trim()) {
      toast({
        title: "Outline Required",
        description: "Please generate an outline first or add some content to expand upon.",
        variant: "destructive",
      });
      return;
    }

    const currentPrompt = selectedPrompt?.description || customPrompt;
    if (!currentPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please select a prompt or enter a custom prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const response = await fetch('/api/essay/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          outline: essayContent,
          essayType,
          wordCount: targetWordCount,
          academicLevel,
          citationStyle,
          requirements: selectedPrompt?.requirements || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start content generation');
      }

      const result = await response.json();
      
      if (result.success && result.jobId) {
        // Start polling for job status
        await pollJobStatus(result.jobId, 'content');
      } else {
        throw new Error('Failed to start content generation');
      }

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setAnalysisStep('');
    }
  };

  const analyzeEssay = async () => {
    if (!essayContent.trim()) {
      toast({
        title: "No Content",
        description: "Please write some content before requesting analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/essay/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: essayContent,
          title: essayTitle,
          prompt: selectedPrompt?.description || customPrompt,
          rubric: selectedPrompt?.rubric,
          customRubric: customRubric.trim() || null,
          essayType,
          targetWordCount,
          academicLevel
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start essay analysis');
      }

      const result = await response.json();
      
      if (result.success && result.jobId) {
        // Start polling for job status
        await pollJobStatus(result.jobId, 'analyze');
      } else {
        throw new Error('Failed to start essay analysis');
      }

    } catch (error) {
      console.error('Error analyzing essay:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze essay. Please try again.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 pb-15 md:pb-8">
      <DynamicPageTitle title="UniShare | AI Essay Writer" />
      
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">AI Essay Writer</h1>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Get AI assistance with essay writing, from brainstorming to final draft
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="prompts" className="text-xs sm:text-sm py-2">Context</TabsTrigger>
          <TabsTrigger value="write" className="text-xs sm:text-sm py-2">Write</TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs sm:text-sm py-2">Feedback</TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2">Drafts</TabsTrigger>
        </TabsList>

        {/* Context Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Essay Context
              </CardTitle>
              <CardDescription className="mt-2">
                Set up your essay prompt, requirements, and grading rubric for AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sample Prompts */}
              <div className="space-y-4">
                <h3 className="font-medium">Sample Prompts</h3>
                <div className="grid gap-4">
                  {samplePrompts.map((prompt) => (
                    <Card 
                      key={prompt.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedPrompt?.id === prompt.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{prompt.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">{prompt.type}</Badge>
                            <Badge variant="secondary">{prompt.wordCount} words</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {prompt.description}
                        </p>
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium">Requirements:</h5>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {prompt.requirements.map((req, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Prompt */}
              <div className="space-y-4">
                <h3 className="font-medium">Custom Prompt</h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your custom essay prompt or assignment instructions..."
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value);
                      // Clear selected prompt when typing custom prompt
                      if (e.target.value.trim()) {
                        setSelectedPrompt(null);
                      }
                    }}
                    rows={4}
                  />
                  {customPrompt.trim() && !selectedPrompt && (
                    <div className="p-3 bg-blue-500/10 border border-blue-200/50 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Current Prompt:</strong> Custom prompt entered
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="essay-type">Essay Type</Label>
                      <Select value={essayType} onValueChange={setEssayType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="argumentative">Argumentative</SelectItem>
                          <SelectItem value="analytical">Analytical</SelectItem>
                          <SelectItem value="narrative">Narrative</SelectItem>
                          <SelectItem value="descriptive">Descriptive</SelectItem>
                          <SelectItem value="expository">Expository</SelectItem>
                          <SelectItem value="persuasive">Persuasive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="word-count">Target Word Count</Label>
                      <Input
                        id="word-count"
                        type="number"
                        value={targetWordCount}
                        onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 500)}
                        min={100}
                        max={5000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citation-style">Citation Style</Label>
                      <Select value={citationStyle} onValueChange={setCitationStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APA">APA</SelectItem>
                          <SelectItem value="MLA">MLA</SelectItem>
                          <SelectItem value="Chicago">Chicago</SelectItem>
                          <SelectItem value="Harvard">Harvard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="academic-level">Academic Level</Label>
                      <Select value={academicLevel} onValueChange={setAcademicLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high-school">High School</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="doctoral">Doctoral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Rubric */}
              <div className="space-y-4">
                <h3 className="font-medium">Grading Rubric (Optional)</h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste your grading rubric here to help the AI provide more targeted feedback and analysis. Include criteria, point values, and performance levels..."
                    value={customRubric}
                    onChange={(e) => setCustomRubric(e.target.value)}
                    rows={6}
                  />
                  {customRubric.trim() && (
                    <div className="p-3 bg-green-500/10 border border-green-200/50 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Rubric Added:</strong> AI will use this rubric for analysis and feedback
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Tip:</strong> Include specific criteria like thesis strength, evidence quality, organization, grammar, etc. with point values or performance levels (e.g., Excellent, Good, Needs Improvement).</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setActiveTab("write")}
                  disabled={!selectedPrompt && !customPrompt.trim()}
                >
                  Start Writing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Write Tab */}
        <TabsContent value="write" className="space-y-6">
          {/* Draft Status Bar */}
          {currentDraft && (
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm sm:text-base truncate">
                        Editing: {currentDraft.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDraftModified && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                          Unsaved Changes
                        </Badge>
                      )}
                      {!isDraftModified && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          Saved
                        </Badge>
                      )}
                      {autoSaveEnabled && lastAutoSave && (
                        <span className="text-xs text-muted-foreground">
                          Auto-saved {lastAutoSave.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                      title={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
                      className="flex-shrink-0"
                    >
                      {autoSaveEnabled ? (
                        <RefreshCw className="h-3 w-3 sm:mr-1" />
                      ) : (
                        <Pause className="h-3 w-3 sm:mr-1" />
                      )}
                      <span className="hidden sm:inline">Auto-save</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={createNewDraft}
                      className="flex-shrink-0"
                    >
                      <span className="hidden sm:inline">New Draft</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveDraft}
                      disabled={!isDraftModified}
                      className="flex-shrink-0"
                    >
                      <Save className="h-3 w-3" />
                      <span className="hidden sm:inline ml-1">{isDraftModified ? 'Save Changes' : 'Saved'}</span>
                      <span className="sm:hidden ml-1">Save</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          <span>Essay Editor</span>
                        </div>
                        {!currentDraft && (
                          <Badge variant="secondary" className="text-xs w-fit">New Draft</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Write your essay with AI assistance
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full sm:w-auto"
                      >
                        {showPreview ? <EyeOff className="h-4 w-4 sm:mr-2" /> : <Eye className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Essay Title */}
                  <div className="space-y-2">
                    <Label htmlFor="essay-title">Essay Title</Label>
                    <Input
                      id="essay-title"
                      placeholder="Enter your essay title..."
                      value={essayTitle}
                      onChange={(e) => setEssayTitle(e.target.value)}
                    />
                  </div>

                  {/* Word Count Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Word Count: {wordCount}</span>
                      <span>Target: {targetWordCount}</span>
                    </div>
                    <Progress 
                      value={Math.min(Math.max((wordCount / targetWordCount) * 100, 0), 100)} 
                      className="h-2"
                    />
                  </div>

                  {/* Essay Content */}
                  {showPreview ? (
                    <ScrollArea className="h-96 w-full border rounded-md p-4">
                      <div className="prose prose-sm max-w-none">
                        <h1 className="font-bold mb-6">{essayTitle || 'Untitled Essay'}</h1>
                        <div 
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatEssayContent(essayContent) }}
                        />
                      </div>
                    </ScrollArea>
                  ) : (
                    <Textarea
                      placeholder="Start writing your essay here, or use AI to generate an outline..."
                      value={essayContent}
                      onChange={(e) => setEssayContent(e.target.value)}
                      rows={20}
                      className="min-h-96"
                    />
                  )}

                  {/* Generation Progress */}
                  {(isGenerating || isAnalyzing) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{analysisStep || 'Processing...'}</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* AI Actions - Primary row on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        onClick={generateEssayOutline}
                        disabled={isGenerating || (!selectedPrompt && !customPrompt.trim())}
                        variant="outline"
                        className="w-full"
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Generate Outline</span>
                        <span className="sm:hidden ml-2">Outline</span>
                      </Button>
                      <Button
                        onClick={generateEssayContent}
                        disabled={isGenerating || !essayContent.trim()}
                        variant="outline"
                        className="w-full"
                      >
                        <Wand2 className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Expand Content</span>
                        <span className="sm:hidden ml-2">Expand</span>
                      </Button>
                      <Button
                        onClick={analyzeEssay}
                        disabled={isAnalyzing || !essayContent.trim()}
                        variant="outline"
                        className="w-full"
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileCheck className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline ml-2">Analyze Essay</span>
                        <span className="sm:hidden ml-2">Analyze</span>
                      </Button>
                    </div>
                    
                    {/* Save Action - Full width on mobile, prominent */}
                    <Button 
                      onClick={saveDraft} 
                      variant={currentDraft && isDraftModified ? "default" : "outline"}
                      disabled={!essayTitle.trim() || !essayContent.trim()}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {currentDraft ? (isDraftModified ? 'Save Changes' : 'Saved') : 'Save as New Draft'}
                    </Button>
                    
                    {/* Export Actions - Secondary row on mobile */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={copyToClipboard} variant="outline" className="w-full">
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Copy</span>
                        <span className="sm:hidden ml-2">Copy</span>
                      </Button>
                      <Button onClick={downloadEssay} variant="outline" className="w-full">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Download</span>
                        <span className="sm:hidden ml-2">Download</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Prompt */}
              {(selectedPrompt || customPrompt) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPrompt ? (
                        <>
                          <div>
                            <h4 className="font-medium text-sm">{selectedPrompt.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedPrompt.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {selectedPrompt.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {selectedPrompt.wordCount} words
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {customPrompt.substring(0, 150)}
                          {customPrompt.length > 150 && '...'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Writing Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Writing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-2 text-muted-foreground">
                    <li>• Start with a strong thesis statement</li>
                    <li>• Use topic sentences for each paragraph</li>
                    <li>• Support arguments with evidence</li>
                    <li>• Address counterarguments</li>
                    <li>• Conclude with impact and implications</li>
                    <li>• Proofread for grammar and clarity</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Essay Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Essay Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Introduction (10-15%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Body Paragraphs (70-80%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Conclusion (10-15%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {aiFeedback ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Overall Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-bold text-primary">
                      {aiFeedback.overallScore}/100
                    </div>
                    <div className="flex-1">
                      <Progress value={aiFeedback.overallScore} className="h-3" />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {aiFeedback.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {aiFeedback.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Criteria Feedback */}
              {Object.keys(aiFeedback.criteriaScores).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(aiFeedback.criteriaScores).map(([criteria, feedback]) => (
                        <div key={criteria} className="border-l-4 border-primary/20 pl-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{criteria}</h4>
                            <Badge variant="outline">{feedback.score}/100</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {feedback.feedback}
                          </p>
                          {feedback.suggestions.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium mb-1">Suggestions:</h5>
                              <ul className="text-xs space-y-1">
                                {feedback.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {aiFeedback.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {aiFeedback.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Write your essay and click "Analyze Essay" to get AI feedback
                </p>
                <Button onClick={() => setActiveTab("write")}>
                  Go to Editor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    Saved Drafts
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Access and manage your essay drafts
                  </CardDescription>
                </div>
                <Button onClick={createNewDraft} size="sm" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  New Draft
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {savedDrafts.length > 0 ? (
                <div className="space-y-4">
                  {savedDrafts.map((draft) => (
                    <Card 
                      key={draft.id} 
                      className={`transition-colors ${
                        currentDraft?.id === draft.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h4 className="font-medium text-base sm:text-sm">{draft.title}</h4>
                            {currentDraft?.id === draft.id && (
                              <Badge variant="default" className="text-xs w-fit">
                                Currently Editing
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge variant="outline" className="text-xs">{draft.word_count} words</Badge>
                            <Badge variant="secondary" className="text-xs">{draft.status}</Badge>
                            {draft.essay_type && (
                              <Badge variant="outline" className="text-xs">
                                {draft.essay_type}
                              </Badge>
                            )}
                            {draft.ai_feedback && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900">
                                <FileCheck className="h-3 w-3 mr-1" />
                                Analyzed
                              </Badge>
                            )}
                            {draft.custom_rubric && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900">
                                <Target className="h-3 w-3 mr-1" />
                                Rubric
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Content Preview */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 sm:line-clamp-1">
                          {draft.content.substring(0, 120)}
                          {draft.content.length > 120 && '...'}
                        </p>

                        {/* Metadata and Actions */}
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
                          {/* Metadata */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                Updated {new Date(draft.updated_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {draft.target_word_count && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3 flex-shrink-0" />
                                <span>Target: {draft.target_word_count} words</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            {/* Mobile: Stack buttons vertically */}
                            <div className="flex sm:hidden flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => loadDraft(draft)}
                                disabled={currentDraft?.id === draft.id}
                                className="w-full"
                              >
                                <FileText className="h-3 w-3 mr-2" />
                                {currentDraft?.id === draft.id ? 'Currently Loaded' : 'Load Draft'}
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => duplicateDraft(draft)}
                                  className="flex-1"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Duplicate
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => deleteDraft(draft.id, draft.title)}
                                  variant="outline"
                                  className="flex-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>

                            {/* Desktop: Horizontal layout */}
                            <div className="hidden sm:flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => duplicateDraft(draft)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="hidden lg:inline">Duplicate</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => loadDraft(draft)}
                                disabled={currentDraft?.id === draft.id}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                <span className="hidden lg:inline">
                                  {currentDraft?.id === draft.id ? 'Loaded' : 'Load'}
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deleteDraft(draft.id, draft.title)}
                                variant="outline"
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span className="hidden lg:inline">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Save className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Saved Drafts</h3>
                  <p className="text-muted-foreground mb-4 px-4">
                    Your saved essay drafts will appear here. Start writing to create your first draft.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={createNewDraft} className="w-full sm:w-auto">
                      <FileText className="h-4 w-4 mr-2" />
                      Start New Draft
                    </Button>
                    <Button onClick={() => setActiveTab("write")} variant="outline" className="w-full sm:w-auto">
                      Go to Editor
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeaderNoBorder>
            <DialogTitle>Delete Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{draftToDelete?.title}"? This action cannot be undone and will permanently remove the draft.
            </DialogDescription>
          </DialogHeaderNoBorder>
          <DialogFooterNoBorder>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDraftToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
            >
              {isDeleting ? "Deleting..." : "Delete Draft"}
            </Button>
          </DialogFooterNoBorder>
        </DialogContent>
      </Dialog>
    </div>
  );
} 