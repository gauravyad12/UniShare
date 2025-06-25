"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageSquare, 
  Upload, 
  FileText, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Download,
  Loader2,
  File,
  Image,
  X,
  RefreshCw,
  Brain,
  Sparkles,
  BookOpen,
  Search,
  Quote,
  ArrowUp,
  CreditCard,
  HelpCircle,
  FileDown,
  RotateCcw,
  GraduationCap,
  Target,
  BookOpenCheck
} from 'lucide-react';
import DynamicPageTitle from '@/components/dynamic-page-title';
import { createClient } from '@/utils/supabase/client';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogHeaderNoBorder, DialogFooterNoBorder, DialogTitle } from '@/components/ui/dialog';
import { ClientSubscriptionCheck } from '@/components/client-subscription-check';
import { SubscriptionRequiredNotice } from '@/components/subscription-required-notice';
import MobileTabs from '@/components/mobile-tabs';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  sources?: DocumentSource[];
}

interface DocumentSource {
  page?: number;
  section?: string;
  content: string;
  relevance: number;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
  content?: string;
  pageCount?: number;
  error?: string;
}

interface ChatSession {
  id: string;
  name: string;
  documentIds: string[];
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AIDocumentChatPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<UploadedDocument | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // New feature states
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [notes, setNotes] = useState<any>(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: string}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<string>('medium');
  const [loadingStudyTools, setLoadingStudyTools] = useState<{[key: string]: boolean}>({});
  const [uploadError, setUploadError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useMobileDetection();
  const supabase = createClient();

  // Auto-scroll to bottom of messages within the chat container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isSending]);

  // Load saved data on mount
  useEffect(() => {
    loadDocuments();
    loadChatSessions();
  }, []);

  // Load cached study tools when selected documents change
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      loadCachedStudyTools();
    } else {
      // Clear study tools when no documents are selected
      setFlashcards([]);
      setQuiz(null);
      setSummary(null);
      setNotes(null);
    }
  }, [selectedDocuments, quizDifficulty]);

  // Auto-save messages when they change (with debounce)
  useEffect(() => {
    if (!currentSession || messages.length === 0) return;
    
    const saveTimer = setTimeout(() => {
      saveSessionWithMessages(messages);
    }, 2000); // Save 2 seconds after last message change

    return () => clearTimeout(saveTimer);
  }, [messages, currentSession]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession && messages.length > 0) {
        // Synchronous save attempt on page unload
        navigator.sendBeacon('/api/documents/sessions/save', JSON.stringify({
          sessionId: currentSession.id,
          messages: messages
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSession, messages]);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('document_chat_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        uploadedAt: new Date(doc.created_at),
        status: doc.status,
        content: doc.content,
        pageCount: doc.page_count,
        error: doc.error_message
      })));
    } catch (error) {
      toast({
        title: "Loading Error",
        description: "Failed to load documents. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const loadChatSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('document_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setChatSessions(data.map((session: any) => ({
        id: session.id,
        name: stripQuotes(session.name), // Remove quotes from existing session names
        documentIds: session.document_ids || [],
        messages: (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        })),
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at)
      })));
    } catch (error) {
      toast({
        title: "Loading Error",
        description: "Failed to load chat sessions. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const validateFile = (file: File): boolean => {
    // Clear any previous upload error
    setUploadError('');
    
    // Check file type - Only PDF and DOCX documents supported
    const allowedTypes = ['application/pdf', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    // Check for legacy .doc files which are not supported
    if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Legacy Format Not Supported",
        description: "Legacy .doc files are not supported. Please save your document as .docx format and try again.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.docx')) {
      setUploadError('Only PDF and Word documents (.pdf, .docx) are accepted');
      return false;
    }

    // Check file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 25MB",
        variant: "destructive",
      });
      return false;
    }

    // Special note for document processing
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "PDF Processing",
        description: "PDF processing uses advanced text extraction. Complex layouts or scanned PDFs may require additional processing time.",
        variant: "default",
      });
    } else if (file.type.includes('word') || file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Word Document Upload",
        description: "DOCX document will be automatically converted to PDF format for optimal AI processing.",
        variant: "default",
      });
    }

    return true;
  };

  const convertWordToPDF = async (file: File): Promise<File> => {
    try {
      // Check if it's a Word document
      if (!file.type.includes('word') && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
        return file; // Return as-is if not a Word document
      }

      // Check if it's a legacy .doc file (not supported by mammoth)
      if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
        throw new Error('Legacy .doc files are not supported. Please save as .docx format and try again.');
      }

      toast({
        title: "Converting Word Document",
        description: "Converting Word document to PDF format for processing...",
        variant: "default",
      });

      // Validate file size and type more strictly
      if (file.size === 0) {
        throw new Error('The file appears to be empty or corrupted.');
      }

      // Convert DOCX to HTML using mammoth
      const arrayBuffer = await file.arrayBuffer();
      
      // Additional validation for the ArrayBuffer
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Failed to read the file content. The file may be corrupted.');
      }

      // Check for DOCX file signature (PK at the beginning)
      const uint8Array = new Uint8Array(arrayBuffer);
      if (uint8Array.length < 4 || uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
        throw new Error('Invalid DOCX file format. Please ensure the file is a valid .docx document.');
      }

      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Check if we got valid HTML content
      if (!html || html.trim().length === 0) {
        throw new Error('No content could be extracted from the document. The file may be empty or corrupted.');
      }

      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.maxWidth = '210mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      
      document.body.appendChild(tempDiv);

      // Create PDF using jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Split content into pages
      const pageHeight = pdf.internal.pageSize.height - 40; // Leave margins
      const lines = html.split('\n');
      let yPosition = 20;

      pdf.setFontSize(12);
      
      for (const line of lines) {
        const cleanLine = line.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
        if (cleanLine) {
          const splitText = pdf.splitTextToSize(cleanLine, 170); // Width minus margins
          
          for (const textLine of splitText) {
            if (yPosition > pageHeight) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(textLine, 20, yPosition);
            yPosition += 7;
          }
        }
      }

      // Clean up
      document.body.removeChild(tempDiv);

      // Convert PDF to blob and create a File-like object
      const pdfBlob = pdf.output('blob') as Blob;
      const pdfFileName = file.name.replace(/\.(docx?|doc)$/i, '.pdf');
      
      // Create a File-like object that works with FormData
      const pdfFile = new Blob([pdfBlob], { type: 'application/pdf' }) as File;
      
      // Add File properties manually
      Object.defineProperty(pdfFile, 'name', {
        value: pdfFileName,
        writable: false
      });
      
      Object.defineProperty(pdfFile, 'lastModified', {
        value: Date.now(),
        writable: false
      });
      
      Object.defineProperty(pdfFile, 'webkitRelativePath', {
        value: '',
        writable: false
      });

      toast({
        title: "Conversion Complete",
        description: "Word document successfully converted to PDF.",
        variant: "default",
      });

      return pdfFile;

    } catch (error) {
      console.error('Error converting Word to PDF:', error);
      
      let errorMessage = "Failed to convert DOCX document to PDF.";
      
      if (error instanceof Error) {
        // Use the specific error message we created
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Conversion Error",
        description: errorMessage + " Please try uploading a PDF instead.",
        variant: "destructive",
      });
      throw new Error(`DOCX to PDF conversion failed: ${errorMessage}`);
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (!validateFile(file)) continue;
      
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingStep('Uploading file...');

      try {
        // Convert Word documents to PDF before uploading
        let fileToUpload = file;
        if (file.type.includes('word') || file.name.toLowerCase().endsWith('.docx')) {
          setProcessingStep('Converting DOCX document to PDF...');
          fileToUpload = await convertWordToPDF(file);
          setProcessingStep('Uploading converted PDF...');
        }

        const formData = new FormData();
        formData.append('document', fileToUpload, fileToUpload.name);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        
        if (result.success) {
          // Start processing job
          setIsProcessing(true);
          setProcessingStep('Starting document processing...');
          await startDocumentProcessing(result.documentId);
        } else {
          throw new Error(result.error || 'Upload failed');
        }

      } catch (error) {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to upload document",
          variant: "destructive",
        });
        
        // Only reset processing state if there was an error during upload
        setIsProcessing(false);
        setProcessingStep('');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const startDocumentProcessing = async (documentId: string) => {
    try {
      // Start processing job
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start processing');
      }

      const result = await response.json();
      
      if (result.success && result.jobId) {
        // Start polling for job status
        await pollJobStatus(result.jobId, documentId);
      } else {
        throw new Error('Failed to start document processing');
      }

    } catch (error) {
      setIsProcessing(false);
      setProcessingStep('');
      throw error;
    }
  };

  const pollJobStatus = async (jobId: string, documentId: string) => {
    const steps = [
      'Initializing document processing...',
      'Extracting text content...',
      'Analyzing document structure...',
      'Processing images and charts...',
      'Creating searchable index...',
      'Finalizing AI optimization...'
    ];

    let stepIndex = 0;
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max

    setProcessingStep(steps[0]);

    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        
        // Update step for better UX - progress through steps more gradually
        if (stepIndex < steps.length - 1) {
          // Advance to next step every 3 polls (15 seconds) for more realistic progression
          if (pollCount % 3 === 0 && pollCount > 0) {
            stepIndex++;
            setProcessingStep(steps[stepIndex]);
          }
        }

        const statusResponse = await fetch(`/api/documents/status/${jobId}`);
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check processing status');
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed' && statusData.result) {
          clearInterval(pollInterval);
          setProcessingStep('Processing complete!');
          
          // Clean up the job after successful completion
          try {
            await cleanupJob(jobId);
          } catch (cleanupError) {
            // Cleanup failed, but processing was successful
          }
          
          setTimeout(() => {
            setIsProcessing(false);
            setProcessingStep('');
            loadDocuments(); // Reload documents list
            toast({
              title: "Success",
              description: "Document processed successfully!",
              variant: "default",
            });
          }, 1000);
          return;
        }

        if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          
          // Clean up failed job
          try {
            await cleanupJob(jobId);
          } catch (cleanupError) {
            // Cleanup failed, but we still need to show the error
          }
          
          setIsProcessing(false);
          setProcessingStep('');
          throw new Error(statusData.error || 'Processing failed');
        }

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          
          // Clean up timed out job
          try {
            await cleanupJob(jobId);
          } catch (cleanupError) {
            // Cleanup failed, but we still need to show the timeout error
          }
          
          setIsProcessing(false);
          setProcessingStep('');
          throw new Error('Processing timeout - please try again');
        }

      } catch (error) {
        clearInterval(pollInterval);
        setIsProcessing(false);
        setProcessingStep('');
        
        toast({
          title: "Processing Error",
          description: error instanceof Error ? error.message : "Failed to process document",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  // Helper function to clean up completed/failed jobs
  const cleanupJob = async (jobId: string) => {
    try {
  
      
      const response = await fetch(`/api/documents/status/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;

        throw new Error(errorMessage);
      }

      const result = await response.json().catch(() => ({}));
      
    } catch (error) {
      
      
      throw error;
    }
  };

  // Poll for study tools job completion
  const pollStudyToolsJobStatus = async (jobId: string, operationType: string, onComplete: (result: any) => void) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        const response = await fetch(`/api/documents/study-tools/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const data = await response.json();
        console.log(`Job ${jobId} status:`, data.status);

        if (data.status === 'completed' && data.result) {
          onComplete(data.result);
          // Don't delete the job - keep it as cache
          return;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Job failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Job timed out after 5 minutes');
        } else {
          // Continue polling
          setTimeout(poll, 5000);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        toast({
          title: "Processing Error",
          description: error instanceof Error ? error.message : "Failed to process study tools",
          variant: "destructive",
        });
      }
    };

    await poll();
  };

  // New function to check for existing cached results
  const checkForCachedResult = async (operationType: string, parameters: any): Promise<any | null> => {
    try {
      // Create a search query to find existing completed jobs with same parameters
      const searchParams = new URLSearchParams();
      searchParams.append('operation_type', operationType);
      searchParams.append('document_ids', JSON.stringify(selectedDocuments.sort())); // Sort for consistent comparison
      
      // Add operation-specific parameters
      if (operationType === 'flashcards') {
        searchParams.append('difficulty', parameters.difficulty || 'medium');
        searchParams.append('count', (parameters.count || 10).toString());
      } else if (operationType === 'quiz') {
        searchParams.append('question_count', (parameters.questionCount || 10).toString());
        searchParams.append('question_types', JSON.stringify((parameters.questionTypes || ['multiple-choice', 'true-false', 'short-answer']).sort()));
        searchParams.append('difficulty', parameters.difficulty || 'medium');
      } else if (operationType === 'notes') {
        searchParams.append('style', parameters.style || 'structured');
      }
      // summary has no additional parameters

      const response = await fetch(`/api/documents/study-tools/cached?${searchParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.cached && data.result) {
          return data.result;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for cached result:', error);
      return null;
    }
  };

  // Load cached study tools for the currently selected documents
  const loadCachedStudyTools = async () => {
    try {
      // Load default/most common cached results
      const [cachedFlashcards, cachedQuiz, cachedSummary, cachedNotes] = await Promise.all([
        checkForCachedResult('flashcards', { difficulty: 'medium', count: 10 }),
        checkForCachedResult('quiz', { questionCount: 10, questionTypes: ['multiple-choice', 'true-false', 'short-answer'], difficulty: quizDifficulty }),
        checkForCachedResult('summary', {}),
        checkForCachedResult('notes', { style: 'structured' })
      ]);

      if (cachedFlashcards) {
        setFlashcards(cachedFlashcards.flashcards);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
      }

      if (cachedQuiz) {
        setQuiz(cachedQuiz);
        setQuizAnswers({});
        setQuizSubmitted(false);
        // Update difficulty state if quiz has difficulty info
        if (cachedQuiz.difficulty && cachedQuiz.difficulty !== quizDifficulty) {
          setQuizDifficulty(cachedQuiz.difficulty);
        }
      }

      if (cachedSummary) {
        setSummary(cachedSummary);
      }

      if (cachedNotes) {
        setNotes(cachedNotes);
      }

      // Optional: Show a toast if any cached content was loaded
      const loadedItems = [
        cachedFlashcards && 'Flashcards',
        cachedQuiz && 'Quiz',
        cachedSummary && 'Summary', 
        cachedNotes && 'Notes'
      ].filter(Boolean);

      if (loadedItems.length > 0) {
        toast({
          title: "Cached Content Loaded",
          description: `Previously generated: ${loadedItems.join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Error loading cached study tools:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Check file type before upload to show error immediately
      const file = files[0];
      if (!validateFile(file)) {
        return; // Error message already set by validateFile
      }
      handleFileUpload(files);
    }
  };

  const generateSessionTitle = async (documentNames: string[]): Promise<string> => {
    try {
      const response = await fetch('/api/documents/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentNames
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const result = await response.json();
      return result.title || `Chat with ${documentNames[0]}`;
    } catch (error) {
      return `Chat with ${documentNames.slice(0, 2).join(', ')}${documentNames.length > 2 ? ' and others' : ''}`;
    }
  };

  const createNewSession = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select at least one document to start chatting.",
        variant: "destructive",
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    const documentNames = selectedDocs.map(doc => doc.name);
    
    const title = await generateSessionTitle(documentNames);

    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      name: stripQuotes(title), // Ensure no quotes in new session names
      documentIds: [...selectedDocuments],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setMessages([]);
    setActiveTab("chat");
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSession(session);
    // Ensure all message timestamps are Date objects
    const messagesWithDates = session.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
    }));
    setMessages(messagesWithDates);
    setSelectedDocuments(session.documentIds);
    setActiveTab("chat");
  };

  const saveCurrentSession = async () => {
    if (!currentSession) return;
    await saveSessionWithMessages(messages);
  };

  const saveSessionWithMessages = async (messagesToSave: ChatMessage[]) => {
    if (!currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionData = {
        ...currentSession,
        messages: messagesToSave,
        updatedAt: new Date()
      };



      const { error } = await supabase
        .from('document_chat_sessions')
        .upsert({
          id: sessionData.id,
          user_id: user.id,
          name: sessionData.name,
          document_ids: sessionData.documentIds,
          messages: sessionData.messages,
          created_at: sessionData.createdAt.toISOString(),
          updated_at: sessionData.updatedAt.toISOString()
        });

      if (error) {
        throw error;
      }

      // Update local state
      setChatSessions(prev => 
        prev.map(s => s.id === sessionData.id ? sessionData : s)
      );

      // Update current session state
      setCurrentSession(sessionData);

    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save chat session. Your messages may be lost on refresh.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Update messages with user message
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await fetch('/api/documents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          documentIds: currentSession.documentIds,
          sessionId: currentSession.id,
          messageHistory: messages.slice(-10) // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        sources: result.sources || []
      };

      // Update messages with both user and assistant messages
      const finalMessages = [...updatedMessagesWithUser, assistantMessage];
      setMessages(finalMessages);
      
      // Save session with the updated messages immediately
      await saveSessionWithMessages(finalMessages);

    } catch (error) {
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const deleteDocument = async (document: UploadedDocument) => {
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(d => d.id !== document.id));
      setSelectedDocuments(prev => prev.filter(id => id !== document.id));
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (session: ChatSession) => {
    try {
      const { error } = await supabase
        .from('document_chat_sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      setChatSessions(prev => prev.filter(s => s.id !== session.id));
      
      if (currentSession?.id === session.id) {
        setCurrentSession(null);
        setMessages([]);
      }

      toast({
        title: "Success",
        description: "Chat session deleted successfully",
        variant: "default",
      });
    } catch (error) {

      toast({
        title: "Delete Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return Image;
    return File;
  };

  const formatTimestamp = (timestamp: Date | string): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Helper function to format names for dialog display
  const formatNameForDialog = (name: string): string => {
    // If the name already has quotes, don't add more
    if ((name.startsWith('"') && name.endsWith('"')) ||
        (name.startsWith("'") && name.endsWith("'"))) {
      return name;
    }
    // Add quotes around the name for better readability
    return `"${name}"`;
  };

  // Helper function to strip quotes from session/document names
  const stripQuotes = (name: string): string => {
    if ((name.startsWith('"') && name.endsWith('"')) ||
        (name.startsWith("'") && name.endsWith("'"))) {
      return name.slice(1, -1).trim();
    }
    return name;
  };

  // Clean quiz options that might have letter prefixes
  const cleanQuizOption = (option: string): string => {
    // Remove letter prefixes like "A. ", "B. ", "C. ", "D. " from the beginning
    return option.replace(/^[A-Z]\.\s*/, '').trim();
  };

  // New generation functions
  const generateFlashcards = async (difficulty = 'medium', count = 10) => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select documents to generate flashcards.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('flashcards');
    try {
      // Check for cached result first
      const cachedResult = await checkForCachedResult('flashcards', { difficulty, count });
      if (cachedResult) {
        setFlashcards(cachedResult.flashcards);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
        setActiveTab("flashcards");
        setIsGenerating(null);

        toast({
          title: "Flashcards Loaded",
          description: `Loaded ${cachedResult.flashcards.length} previously generated flashcards.`,
        });
        return;
      }
      // Start the flashcards generation job
      const response = await fetch('/api/documents/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          difficulty,
          count
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start flashcards generation');
      }

      const result = await response.json();
      const jobId = result.jobId;

      // Immediately switch to the tab and show loading state
      setActiveTab("flashcards");
      setLoadingStudyTools(prev => ({ ...prev, flashcards: true }));
      setFlashcards([]); // Clear existing flashcards

      toast({
        title: "Flashcards Generation Started",
        description: "Your flashcards are being generated...",
      });

      // Poll for job completion
      await pollStudyToolsJobStatus(jobId, 'flashcards', (result) => {
        setFlashcards(result.flashcards);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
        setLoadingStudyTools(prev => ({ ...prev, flashcards: false }));

        toast({
          title: "Flashcards Generated",
          description: `Successfully generated ${result.flashcards.length} flashcards.`,
        });
      });

    } catch (error) {
      setLoadingStudyTools(prev => ({ ...prev, flashcards: false }));
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const generateQuiz = async (questionCount = 10, questionTypes = ['multiple-choice', 'true-false', 'short-answer'], difficulty = quizDifficulty) => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select documents to generate a quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('quiz');
    try {
      // Check for cached result first
      const cachedResult = await checkForCachedResult('quiz', { questionCount, questionTypes, difficulty });
      if (cachedResult) {
        setQuiz(cachedResult);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setActiveTab("quiz");
        setIsGenerating(null);

        toast({
          title: "Quiz Loaded",
          description: `Loaded previously generated ${cachedResult.questions.length}-question quiz.`,
        });
        return;
      }
      // Start the quiz generation job
      const response = await fetch('/api/documents/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          questionCount,
          questionTypes,
          difficulty
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start quiz generation');
      }

      const result = await response.json();
      const jobId = result.jobId;

      // Immediately switch to the tab and show loading state
      setActiveTab("quiz");
      setLoadingStudyTools(prev => ({ ...prev, quiz: true }));
      setQuiz(null); // Clear existing quiz

      toast({
        title: "Quiz Generation Started",
        description: "Your quiz is being generated...",
      });

      // Poll for job completion
      await pollStudyToolsJobStatus(jobId, 'quiz', (result) => {
        setQuiz(result);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setLoadingStudyTools(prev => ({ ...prev, quiz: false }));

        toast({
          title: "Quiz Generated",
          description: `Successfully generated a ${result.questions.length}-question quiz.`,
        });
      });

    } catch (error) {
      setLoadingStudyTools(prev => ({ ...prev, quiz: false }));
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const generateSummary = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select documents to generate a summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('summary');
    try {
      // Check for cached result first
      const cachedResult = await checkForCachedResult('summary', {});
      if (cachedResult) {
        setSummary(cachedResult);
        setActiveTab("summary");
        setIsGenerating(null);

        toast({
          title: "Summary Loaded",
          description: "Loaded previously generated comprehensive summary.",
        });
        return;
      }
      // Start the summary generation job
      const response = await fetch('/api/documents/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocuments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start summary generation');
      }

      const result = await response.json();
      const jobId = result.jobId;

      // Immediately switch to the tab and show loading state
      setActiveTab("summary");
      setLoadingStudyTools(prev => ({ ...prev, summary: true }));
      setSummary(null); // Clear existing summary

      toast({
        title: "Summary Generation Started",
        description: "Your summary is being generated...",
      });

      // Poll for job completion
      await pollStudyToolsJobStatus(jobId, 'summary', (result) => {
        setSummary(result);
        setLoadingStudyTools(prev => ({ ...prev, summary: false }));

        toast({
          title: "Summary Generated",
          description: "Successfully generated comprehensive summary.",
        });
      });

    } catch (error) {
      setLoadingStudyTools(prev => ({ ...prev, summary: false }));
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const generateNotes = async (style = 'structured') => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select documents to generate notes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('notes');
    try {
      // Check for cached result first
      const cachedResult = await checkForCachedResult('notes', { style });
      if (cachedResult) {
        setNotes(cachedResult);
        setActiveTab("notes");
        setIsGenerating(null);

        toast({
          title: "Notes Loaded",
          description: "Loaded previously generated study notes.",
        });
        return;
      }
      // Start the notes generation job
      const response = await fetch('/api/documents/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          style
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start notes generation');
      }

      const result = await response.json();
      const jobId = result.jobId;

      // Immediately switch to the tab and show loading state
      setActiveTab("notes");
      setLoadingStudyTools(prev => ({ ...prev, notes: true }));
      setNotes(null); // Clear existing notes

      toast({
        title: "Notes Generation Started",
        description: "Your notes are being generated...",
      });

      // Poll for job completion
      await pollStudyToolsJobStatus(jobId, 'notes', (result) => {
        setNotes(result);
        setLoadingStudyTools(prev => ({ ...prev, notes: false }));

        toast({
          title: "Notes Generated",
          description: "Successfully generated study notes.",
        });
      });

    } catch (error) {
      setLoadingStudyTools(prev => ({ ...prev, notes: false }));
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const downloadPDF = async (content: any, title: string, type: string) => {
    try {
      const response = await fetch('/api/documents/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title,
          type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const result = await response.json();
      
      // Create a blob from the HTML content and trigger download
      const blob = new Blob([result.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename.replace('.pdf', '.html');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Ready",
        description: "HTML file downloaded. You can convert it to PDF using your browser's print function.",
      });

    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to prepare download",
        variant: "destructive",
      });
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex gap-3 justify-start animate-in fade-in duration-300">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="bg-muted rounded-lg p-4 max-w-[80%]">
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            <div 
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" 
              style={{animationDelay: '0ms', animationDuration: '1.4s'}}
            ></div>
            <div 
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" 
              style={{animationDelay: '200ms', animationDuration: '1.4s'}}
            ></div>
            <div 
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" 
              style={{animationDelay: '400ms', animationDuration: '1.4s'}}
            ></div>
          </div>
          <span className="text-sm text-muted-foreground">AI is thinking...</span>
        </div>
      </div>
    </div>
  );

  return (
    <ClientSubscriptionCheck redirectTo="/pricing">
      <div className="container mx-auto px-4 py-8 pb-15 md:pb-8">
        <DynamicPageTitle title="UniShare | AI Document Chat" />

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">AI Document Chat</h1>
          </div>
          <p className="text-muted-foreground">
            Upload documents and have intelligent conversations about their content
          </p>
        </header>

      <Tabs value={activeTab} className="space-y-6">
        <MobileTabs
          tabs={[
            { value: "documents", label: "Documents" },
            { value: "chat", label: "Chat" },
            { value: "flashcards", label: "Flashcards" },
            { value: "quiz", label: "Quiz" },
            { value: "summary", label: "Summary" },
            { value: "notes", label: "Notes" },
            { value: "sessions", label: "Sessions" },
          ]}
          activeTab={activeTab}
          className="mb-6"
          onTabChange={setActiveTab}
        />

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                Upload PDFs, Word documents, text files, or images to chat with AI about their content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
                <p className="text-muted-foreground mb-4">
                  Supports PDF and Word documents (.pdf, .docx) - max 25MB each
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isProcessing}
                >
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      if (!validateFile(file)) {
                        return; // Error message already set by validateFile
                      }
                      handleFileUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                />
                {uploadError && (
                  <p className="text-sm text-red-500 mt-2">{uploadError}</p>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Upload progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                </div>
              )}

              {/* Processing Progress */}
              {isProcessing && !isUploading && (
                <div className="mt-6 space-y-4">
                  {/* Processing Progress Indicator */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Processing document</span>
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        AI Analysis
                      </span>
                    </div>
                    {/* Indeterminate progress bar for processing */}
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
                    </div>
                  </div>
                  
                  {/* Processing Step Details */}
                  {processingStep && (
                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {processingStep}
                        </p>
                      </div>
                      {isProcessing && !isUploading && (
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-2">
                          This may take 30-60 seconds depending on document size and complexity.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Documents Uploaded</h3>
                  <p className="text-muted-foreground">
                    Upload your first document to start chatting with AI
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const FileIcon = getFileIcon(doc.type);
                    const isSelected = selectedDocuments.includes(doc.id);
                    
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          if (doc.status === 'ready') {
                            setSelectedDocuments(prev => 
                              isSelected 
                                ? prev.filter(id => id !== doc.id)
                                : [...prev, doc.id]
                            );
                          }
                        }}
                      >
                        <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base line-clamp-2 sm:truncate mb-1 sm:mb-0">{doc.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <span>{formatFileSize(doc.size)}</span>
                              {doc.pageCount && <span>{doc.pageCount} pages</span>}
                            </div>
                            <span className="hidden sm:inline">{doc.uploadedAt.toLocaleDateString()}</span>
                            <span className="sm:hidden text-xs">{doc.uploadedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <Badge 
                            variant={
                              doc.status === 'ready' ? 'default' : 
                              doc.status === 'processing' ? 'secondary' : 
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {doc.status === 'ready' ? 'Ready' : 
                             doc.status === 'processing' ? 'Processing' : 
                             'Error'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocumentToDelete(doc);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Documents Summary */}
          {selectedDocuments.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Ready to Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected for AI chat
                  </p>
                  <Button onClick={createNewSession} className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start New Chat Session
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    AI Study Tools
                  </CardTitle>
                  <CardDescription>
                    Generate study materials from your selected documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => generateFlashcards('medium', 10)}
                      disabled={isGenerating === 'flashcards'}
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                    >
                      {isGenerating === 'flashcards' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">Flashcards</div>
                        <div className="text-xs text-muted-foreground">Study key concepts</div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => generateQuiz(10, ['multiple-choice', 'true-false', 'short-answer'], quizDifficulty)}
                      disabled={isGenerating === 'quiz'}
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                    >
                      {isGenerating === 'quiz' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <HelpCircle className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">Practice Quiz</div>
                        <div className="text-xs text-muted-foreground">Test your knowledge</div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => generateSummary()}
                      disabled={isGenerating === 'summary'}
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                    >
                      {isGenerating === 'summary' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Target className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">Smart Summary</div>
                        <div className="text-xs text-muted-foreground">Key points & test topics</div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => generateNotes('structured')}
                      disabled={isGenerating === 'notes'}
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                    >
                      {isGenerating === 'notes' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <BookOpenCheck className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">Study Notes</div>
                        <div className="text-xs text-muted-foreground">Downloadable PDF</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          {!currentSession ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Active Chat Session</h3>
                <p className="text-muted-foreground mb-4">
                  Select documents and start a new chat session to begin
                </p>
                <Button onClick={() => setActiveTab("documents")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Messages */}
              <div className="lg:col-span-3">
                <Card className="h-[600px] md:h-[700px] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {currentSession.name}
                    </CardTitle>
                    <CardDescription>
                      Chatting with {currentSession.documentIds.length} document{currentSession.documentIds.length > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Messages Area */}
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-4 min-h-full">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-2">Start Your Conversation</h3>
                            <p className="text-muted-foreground">
                              Ask questions about your documents, request summaries, or get insights
                            </p>
                          </div>
                        ) : (
                          <>
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex gap-3 ${
                                  message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                {message.role === 'assistant' && (
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                      <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                  </div>
                                )}
                                
                                <div
                                  className={`max-w-[80%] rounded-lg p-4 break-words ${
                                    message.role === 'user'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                                  
                                  {/* Sources */}
                                  {message.sources && message.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                        <Quote className="h-3 w-3" />
                                        Sources:
                                      </div>
                                      <div className="space-y-1">
                                        {message.sources.map((source, idx) => (
                                          <div key={idx} className="text-xs bg-background/50 rounded p-2 break-words">
                                            {source.page && <span className="font-medium">Page {source.page}: </span>}
                                            {source.section && <span className="font-medium">{source.section}: </span>}
                                            <span className="text-muted-foreground">{source.content.slice(0, 100)}...</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {formatTimestamp(message.timestamp)}
                                  </div>
                                </div>
                                
                                {message.role === 'user' && (
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                      <User className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {/* Typing Indicator */}
                            {isSending && <TypingIndicator />}
                          </>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                    
                    {/* Message Input */}
                    <div className={`sticky bottom-0 px-2 sm:px-4 md:px-6 ${isMobile ? 'py-3' : 'py-4'} w-full transition-all duration-100 relative border-t`}>
                      <div className="w-full space-y-2">
                        {/* Input container */}
                        <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'} items-center w-full transition-all duration-100 relative`}>
                          <div className="relative flex-1">
                            <Input
                              placeholder="Ask a question about your documents..."
                              value={inputMessage}
                              className={`rounded-full bg-muted/50 focus-visible:ring-primary/50 w-full ${isMobile ? 'h-10 py-2 pr-10' : 'h-10 py-2 pr-28'}`}
                              onChange={(e) => setInputMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                              disabled={isSending}
                              maxLength={2000}
                            />
                            
                            {/* Character counter inside input - desktop only */}
                            {inputMessage.length > 0 && (
                              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70 hidden md:block pointer-events-none bg-muted/50 px-1 rounded">
                                {inputMessage.length}/2000
                              </div>
                            )}
                            
                            <Button
                              onClick={sendMessage}
                              disabled={isSending || !inputMessage.trim() || inputMessage.length > 2000}
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-6 w-6 flex items-center justify-center p-0 bg-transparent hover:bg-muted/80"
                            >
                              {isSending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              ) : (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Session Info Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Session Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Documents</Label>
                      <div className="mt-1 space-y-1">
                        {currentSession.documentIds.map(docId => {
                          const doc = documents.find(d => d.id === docId);
                          return doc ? (
                            <div key={docId} className="text-sm p-2 bg-muted rounded">
                              {doc.name}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Messages</Label>
                      <div className="text-sm mt-1">{messages.length} messages</div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Created</Label>
                      <div className="text-sm mt-1">{currentSession.createdAt.toLocaleDateString()}</div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSessionToDelete(currentSession);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Session
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                AI Generated Flashcards
              </CardTitle>
              <CardDescription>
                Study key concepts with interactive flashcards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudyTools.flashcards ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Generating Flashcards</h3>
                  <p className="text-muted-foreground mb-4">
                    AI is creating personalized flashcards from your documents...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span>This usually takes 30-60 seconds</span>
                  </div>
                </div>
              ) : flashcards.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Flashcards Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Select documents and generate flashcards to start studying
                  </p>
                  <Button onClick={() => setActiveTab("documents")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Go to Documents
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Flashcard Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Card {currentFlashcardIndex + 1} of {flashcards.length}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => downloadPDF(flashcards, `Flashcards - ${selectedDocuments.length} documents`, 'flashcards')}
                        variant="outline"
                        size="sm"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Current Flashcard */}
                  <div className="relative min-h-[280px] md:min-h-[320px] perspective-1000">
                    <div 
                      className={`relative w-full h-full transition-transform duration-300 transform-style-preserve-3d ${
                        showFlashcardAnswer ? 'rotate-y-180' : ''
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        perspective: '1000px'
                      }}
                    >
                      {/* Question Side (Front) */}
                      <Card 
                        className="absolute inset-0 min-h-[280px] md:min-h-[320px] backface-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <CardContent className="p-4 md:p-8 h-full">
                          <div className="text-center space-y-4 md:space-y-6 h-full flex flex-col justify-center">
                            <div className="text-base md:text-lg font-medium text-blue-600">
                              Question:
                            </div>
                            <div className="text-lg md:text-xl leading-relaxed flex-1 flex items-center justify-center px-2 md:px-4 overflow-y-auto">
                              <div className="max-w-full break-words">
                                {flashcards[currentFlashcardIndex]?.question}
                              </div>
                            </div>
                            <Button 
                              onClick={() => setShowFlashcardAnswer(true)}
                              variant="outline"
                              className="w-fit mx-auto"
                              size={isMobile ? "sm" : "default"}
                            >
                              Show Answer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Answer Side (Back) */}
                      <Card 
                        className="absolute inset-0 min-h-[280px] md:min-h-[320px] backface-hidden rotate-y-180"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <CardContent className="p-4 md:p-8 h-full">
                          <div className="text-center space-y-4 md:space-y-6 h-full flex flex-col justify-center">
                            <div className="text-base md:text-lg font-medium text-green-600">
                              Answer:
                            </div>
                            <div className="text-lg md:text-xl leading-relaxed flex-1 flex items-center justify-center px-2 md:px-4 overflow-y-auto">
                              <div className="max-w-full break-words">
                                {flashcards[currentFlashcardIndex]?.answer}
                              </div>
                            </div>
                            <Button 
                              onClick={() => setShowFlashcardAnswer(false)}
                              variant="outline"
                              className="w-fit mx-auto"
                              size={isMobile ? "sm" : "default"}
                            >
                              Show Question
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="space-y-4">
                    {/* Primary Navigation - Mobile Optimized */}
                    <div className="flex justify-between items-center gap-2">
                      <Button 
                        onClick={() => {
                          if (currentFlashcardIndex > 0) {
                            setCurrentFlashcardIndex(currentFlashcardIndex - 1);
                            setShowFlashcardAnswer(false);
                          }
                        }}
                        disabled={currentFlashcardIndex === 0}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="flex-1 max-w-[120px]"
                      >
                        Previous
                      </Button>
                      
                      {/* Center Controls */}
                      <div className="flex flex-col items-center gap-2">
                        <Button 
                          onClick={() => {
                            setShowFlashcardAnswer(false);
                            setCurrentFlashcardIndex(0);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset All
                        </Button>
                      </div>

                      <Button 
                        onClick={() => {
                          if (currentFlashcardIndex < flashcards.length - 1) {
                            setCurrentFlashcardIndex(currentFlashcardIndex + 1);
                            setShowFlashcardAnswer(false);
                          }
                        }}
                        disabled={currentFlashcardIndex === flashcards.length - 1}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="flex-1 max-w-[120px]"
                      >
                        Next
                      </Button>
                    </div>

                    {/* Quick Jump Controls - Hidden on mobile */}
                    {!isMobile && flashcards.length > 5 && (
                      <div className="flex justify-center gap-2">
                        <Button 
                          onClick={() => {
                            setCurrentFlashcardIndex(0);
                            setShowFlashcardAnswer(false);
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={currentFlashcardIndex === 0}
                        >
                          First
                        </Button>
                        <Button 
                          onClick={() => {
                            setCurrentFlashcardIndex(flashcards.length - 1);
                            setShowFlashcardAnswer(false);
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={currentFlashcardIndex === flashcards.length - 1}
                        >
                          Last
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Practice Quiz
              </CardTitle>
              <CardDescription>
                Test your knowledge with AI-generated questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudyTools.quiz ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Generating Practice Quiz</h3>
                  <p className="text-muted-foreground mb-4">
                    AI is creating custom questions to test your knowledge...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span>This usually takes 30-60 seconds</span>
                  </div>
                </div>
              ) : !quiz ? (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Quiz Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Select documents and generate a quiz to test your knowledge
                  </p>
                  <Button onClick={() => setActiveTab("documents")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Go to Documents
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quiz Header */}
                  <div className="flex flex-col gap-4">
                    {/* Title Row */}
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-semibold">{quiz.title}</h3>
                      {quiz.difficulty && (
                        <Badge variant="secondary" className="capitalize w-fit">
                          {quiz.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Controls Row */}
                    <div className="flex flex-col xs:flex-row gap-3">
                      {/* Difficulty Selector */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-full xs:w-auto">
                        <Label htmlFor="quiz-difficulty" className="text-sm whitespace-nowrap">
                          Difficulty:
                        </Label>
                        <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                          <SelectTrigger className="flex-1 xs:w-[100px] h-9">
                            <SelectValue>
                              {quizDifficulty === 'easy' && 'Easy'}
                              {quizDifficulty === 'medium' && 'Medium'}
                              {quizDifficulty === 'hard' && 'Hard'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="w-[220px]">
                            <SelectItem value="easy">
                              <div className="flex flex-col items-start">
                                <span>Easy</span>
                                <span className="text-xs text-muted-foreground">Basic recall & definitions</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex flex-col items-start">
                                <span>Medium</span>
                                <span className="text-xs text-muted-foreground">Analysis & application</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="hard">
                              <div className="flex flex-col items-start">
                                <span>Hard</span>
                                <span className="text-xs text-muted-foreground">Critical thinking & synthesis</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-1 xs:flex-none">
                        <Button 
                          onClick={() => generateQuiz(10, ['multiple-choice', 'true-false', 'short-answer'], quizDifficulty)}
                          disabled={isGenerating === 'quiz'}
                          variant="secondary"
                          className="h-9 flex-1 xs:flex-none"
                          size="sm"
                        >
                          {isGenerating === 'quiz' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 xs:mr-2 animate-spin" />
                              <span className="hidden xs:inline">Regenerate</span>
                              <span className="xs:hidden">Regen</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 xs:mr-2" />
                              <span className="hidden xs:inline">Regenerate</span>
                              <span className="xs:hidden">Regen</span>
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => downloadPDF(quiz, quiz.title, 'quiz')}
                          variant="outline"
                          className="h-9 flex-1 xs:flex-none"
                          size="sm"
                        >
                          <FileDown className="h-4 w-4 mr-1 xs:mr-2" />
                          <span className="hidden xs:inline">Download</span>
                          <span className="xs:hidden">PDF</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Quiz Questions */}
                  <div className="space-y-6">
                    {quiz.questions.map((question: any, index: number) => (
                      <Card key={question.id} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="secondary">{index + 1}</Badge>
                            <div className="flex-1">
                              <h4 className="font-medium mb-3">{question.question}</h4>
                              
                              {question.type === 'multiple-choice' && question.options && (
                                <div className="space-y-2">
                                  {question.options.map((option: string, optIndex: number) => (
                                    <div key={optIndex} className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`q${question.id}_${optIndex}`}
                                        name={`question_${question.id}`}
                                        value={String.fromCharCode(65 + optIndex)}
                                        onChange={(e) => setQuizAnswers(prev => ({
                                          ...prev,
                                          [question.id]: e.target.value
                                        }))}
                                        disabled={quizSubmitted}
                                        className="w-4 h-4"
                                      />
                                      <label htmlFor={`q${question.id}_${optIndex}`} className="text-sm">
                                        {String.fromCharCode(65 + optIndex)}. {cleanQuizOption(option)}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {question.type === 'true-false' && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`q${question.id}_true`}
                                      name={`question_${question.id}`}
                                      value="true"
                                      onChange={(e) => setQuizAnswers(prev => ({
                                        ...prev,
                                        [question.id]: e.target.value
                                      }))}
                                      disabled={quizSubmitted}
                                      className="w-4 h-4"
                                    />
                                    <label htmlFor={`q${question.id}_true`} className="text-sm">True</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`q${question.id}_false`}
                                      name={`question_${question.id}`}
                                      value="false"
                                      onChange={(e) => setQuizAnswers(prev => ({
                                        ...prev,
                                        [question.id]: e.target.value
                                      }))}
                                      disabled={quizSubmitted}
                                      className="w-4 h-4"
                                    />
                                    <label htmlFor={`q${question.id}_false`} className="text-sm">False</label>
                                  </div>
                                </div>
                              )}

                              {question.type === 'short-answer' && (
                                <Textarea
                                  placeholder="Enter your answer here..."
                                  value={quizAnswers[question.id] || ''}
                                  onChange={(e) => setQuizAnswers(prev => ({
                                    ...prev,
                                    [question.id]: e.target.value
                                  }))}
                                  disabled={quizSubmitted}
                                  rows={3}
                                />
                              )}

                              {/* Show answers after submission */}
                              {quizSubmitted && (
                                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                  <div className="font-medium text-green-600 mb-2">
                                    Correct Answer: {question.correctAnswer}
                                  </div>
                                  {question.explanation && (
                                    <div className="text-sm text-muted-foreground">
                                      <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Submit Button */}
                  {!quizSubmitted && (
                    <div className="text-center">
                      <Button 
                        onClick={() => setQuizSubmitted(true)}
                        size="lg"
                      >
                        Submit Quiz
                      </Button>
                    </div>
                  )}

                  {quizSubmitted && (
                    <div className="text-center">
                      <Button 
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake Quiz
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Study Summary
              </CardTitle>
              <CardDescription>
                Comprehensive overview with key points and test topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudyTools.summary ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Generating Study Summary</h3>
                  <p className="text-muted-foreground mb-4">
                    AI is analyzing your documents to create comprehensive insights...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span>This usually takes 30-60 seconds</span>
                  </div>
                </div>
              ) : !summary ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Summary Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Select documents and generate a summary to see key insights
                  </p>
                  <Button onClick={() => setActiveTab("documents")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Go to Documents
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{summary.title}</h3>
                    <Button 
                      onClick={() => downloadPDF(summary, summary.title, 'summary')}
                      variant="outline"
                      size="sm"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  {/* Overview Section */}
                  {summary.overview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed">{summary.overview}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Points Section */}
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Key Points</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {summary.keyPoints.map((point: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Likely Test Topics Section */}
                  {summary.likelyTestTopics && summary.likelyTestTopics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Likely Test Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {summary.likelyTestTopics.map((topic: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Common Mistakes Section */}
                  {summary.commonMistakes && summary.commonMistakes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Common Mistakes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {summary.commonMistakes.map((mistake: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                              <span>{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Study Tips Section */}
                  {summary.studyTips && summary.studyTips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Study Tips</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {summary.studyTips.map((tip: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5" />
                Study Notes
              </CardTitle>
              <CardDescription>
                Comprehensive study notes ready for download
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudyTools.notes ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Generating Study Notes</h3>
                  <p className="text-muted-foreground mb-4">
                    AI is organizing your documents into structured study notes...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span>This usually takes 30-60 seconds</span>
                  </div>
                </div>
              ) : !notes ? (
                <div className="text-center py-8">
                  <BookOpenCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Notes Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Select documents and generate notes for structured study material
                  </p>
                  <Button onClick={() => setActiveTab("documents")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Go to Documents
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Notes Header */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">{notes.title}</h3>
                    <Button 
                      onClick={() => downloadPDF(notes, notes.title, 'notes')}
                      variant="outline"
                      size="sm"
                      className="w-fit"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>

                  {/* Notes Sections */}
                  {notes.sections && notes.sections.map((section: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{section.heading}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.content && (
                          <div className="prose max-w-none">
                            <p>{section.content}</p>
                          </div>
                        )}
                        
                        {section.subsections && section.subsections.map((subsection: any, subIndex: number) => (
                          <div key={subIndex} className="border-l-2 border-muted pl-4">
                            <h4 className="font-medium mb-2">{subsection.subheading}</h4>
                            <ul className="space-y-1">
                              {subsection.points.map((point: string, pointIndex: number) => (
                                <li key={pointIndex} className="flex items-start gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Key Terms Section */}
                  {notes.keyTerms && notes.keyTerms.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Key Terms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {notes.keyTerms.map((term: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="font-medium text-primary">{term.term}</div>
                              <div className="text-sm text-muted-foreground mt-1">{term.definition}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Summary Section */}
                  {notes.summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed">{notes.summary}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chat Sessions ({chatSessions.length})
              </CardTitle>
              <CardDescription>
                Manage your previous chat sessions with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Chat Sessions</h3>
                  <p className="text-muted-foreground">
                    Start your first chat session to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => loadSession(session)}
                    >
                      <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base line-clamp-2 sm:truncate mb-1 sm:mb-0">{session.name}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span>{session.messages.length} messages</span>
                            <span>{session.documentIds.length} documents</span>
                          </div>
                          <span className="hidden sm:inline">{session.updatedAt.toLocaleDateString()}</span>
                          <span className="sm:hidden text-xs">{session.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
            <DialogTitle>
              {documentToDelete ? 'Delete Document' : 'Delete Chat Session'}
            </DialogTitle>
            <DialogDescription>
              {documentToDelete 
                ? `This action cannot be undone. This will permanently delete ${formatNameForDialog(documentToDelete.name)} and all associated data.`
                : sessionToDelete
                ? `This action cannot be undone. This will permanently delete the chat session ${formatNameForDialog(sessionToDelete.name)} and all its messages.`
                : ''
              }
            </DialogDescription>
          </DialogHeaderNoBorder>
          <DialogFooterNoBorder>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDocumentToDelete(null);
                setSessionToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (documentToDelete) {
                  deleteDocument(documentToDelete);
                  setDocumentToDelete(null);
                } else if (sessionToDelete) {
                  deleteSession(sessionToDelete);
                  setSessionToDelete(null);
                }
                setShowDeleteDialog(false);
              }}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
            >
              Delete
            </Button>
          </DialogFooterNoBorder>
        </DialogContent>
      </Dialog>

      {/* This component will only show if the user doesn't have an active subscription */}
      <SubscriptionRequiredNotice />
      </div>
    </ClientSubscriptionCheck>
  );
}