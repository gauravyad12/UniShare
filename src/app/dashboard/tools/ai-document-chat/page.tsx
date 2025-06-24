"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowUp
} from 'lucide-react';
import DynamicPageTitle from '@/components/dynamic-page-title';
import { createClient } from '@/utils/supabase/client';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogHeaderNoBorder, DialogFooterNoBorder, DialogTitle } from '@/components/ui/dialog';
import { ClientSubscriptionCheck } from '@/components/client-subscription-check';
import { SubscriptionRequiredNotice } from '@/components/subscription-required-notice';

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
    // Check file type - PDFs now supported with advanced processing
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload PDFs, Word documents, text files, or images (PNG, JPEG, GIF, WebP).",
        variant: "destructive",
      });
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

    // Special note for PDFs
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "PDF Processing",
        description: "PDF processing uses advanced text extraction. Complex layouts or scanned PDFs may require additional processing time.",
        variant: "default",
      });
    }

    return true;
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (!validateFile(file)) continue;
      
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingStep('Uploading file...');

      try {
        const formData = new FormData();
        formData.append('document', file);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

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
                  Supports PDF, Word, text files, and images (max 25MB each)
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
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Upload & Processing Progress */}
              {(isUploading || isProcessing) && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">
                      {isUploading ? 'Uploading...' : 'Processing document...'}
                    </span>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Upload progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                  
                  {/* Processing Progress Indicator */}
                  {isProcessing && !isUploading && (
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
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                      </div>
                    </div>
                  )}
                  
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