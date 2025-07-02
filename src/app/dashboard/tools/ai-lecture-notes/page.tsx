"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Loader2,
  RefreshCw,
  Brain,
  Sparkles,
  BookOpen,
  ArrowUp,
  CreditCard,
  HelpCircle,
  FileDown,
  RotateCcw,
  GraduationCap,
  Target,
  BookOpenCheck,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Clock,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Archive
} from 'lucide-react';
import DynamicPageTitle from '@/components/dynamic-page-title';
import { createClient } from '@/utils/supabase/client';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogHeaderNoBorder, DialogFooterNoBorder, DialogTitle } from '@/components/ui/dialog';
import { ClientSubscriptionCheck } from '@/components/client-subscription-check';
import { SubscriptionRequiredNotice } from '@/components/subscription-required-notice';
import MobileTabs from '@/components/mobile-tabs';
import jsPDF from 'jspdf';

// Types
interface LectureRecording {
  id: string;
  name: string;
  duration: number;
  recordedAt: Date;
  status: 'recording' | 'processing' | 'ready' | 'error';
  transcript?: string;
  audioBlob?: Blob;
  audioFilePath?: string; // Path to audio file in Supabase Storage
  error?: string;
}

export default function AILectureNotesPage() {
  const [activeTab, setActiveTab] = useState("recorder");
  const [recordings, setRecordings] = useState<LectureRecording[]>([]);
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<LectureRecording | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentRecordingName, setCurrentRecordingName] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  
  // Study tools states
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
  const [userChangedQuizDifficulty, setUserChangedQuizDifficulty] = useState(false);
  const [showFlashcardRegenDialog, setShowFlashcardRegenDialog] = useState(false);
  const [flashcardDifficulty, setFlashcardDifficulty] = useState<string>('medium');
  const [flashcardCount, setFlashcardCount] = useState<number>(10);
  const [loadingStudyTools, setLoadingStudyTools] = useState<{[key: string]: boolean}>({});
  
  // Audio playback states
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [lastPlayedRecordingId, setLastPlayedRecordingId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  
  // Audio/Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelAnimationRef = useRef<number | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const finalRecordingDurationRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>('');
  
  const { toast } = useToast();
  const isMobile = useMobileDetection();
  const supabase = createClient();

  // Helper function to scroll to top smoothly when switching tabs
  const scrollToTopAndSetTab = (tabName: string) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load saved data on mount
  useEffect(() => {
    loadRecordings();
    checkMicrophonePermission();
  }, []);

  // Load cached study tools when selected recordings change
  useEffect(() => {
    if (selectedRecordings.length > 0) {
      loadCachedStudyTools();
    } else {
      // Clear study tools when no recordings are selected
      setFlashcards([]);
      setQuiz(null);
      setSummary(null);
      setNotes(null);
    }
    // Reset difficulty change tracking when recordings change
    setUserChangedQuizDifficulty(false);
  }, [selectedRecordings, quizDifficulty]);

  // Recording timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop speech recognition
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      
      // Stop audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Stop audio level animation
      if (audioLevelAnimationRef.current) {
        cancelAnimationFrame(audioLevelAnimationRef.current);
      }
      
      // Stop audio playback
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current.src = '';
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicPermissionStatus(result.state);
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setMicPermissionStatus('unknown');
    }
  };

  const loadRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('lecture_recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRecordings: LectureRecording[] = data.map((recording: any) => ({
        id: recording.id,
        name: recording.title,
        duration: recording.duration,
        recordedAt: new Date(recording.created_at),
        status: 'ready',
        transcript: recording.transcript,
        audioFilePath: recording.audio_url || recording.audio_file_path
      }));

      setRecordings(formattedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast({
        title: "Error",
        description: "Failed to load recordings",
        variant: "destructive",
      });
    }
  };

  const loadCachedStudyTools = async () => {
    try {
      // Load cached results (no parameters for flashcards and quiz - they match any cached result)
      const [cachedFlashcards, cachedQuiz, cachedSummary, cachedNotes] = await Promise.all([
        checkForCachedResult('flashcards', {}),
        checkForCachedResult('quiz', {}),
        checkForCachedResult('summary', {}),
        checkForCachedResult('notes', { style: 'structured' })
      ]);

      if (cachedFlashcards) {
        setFlashcards(cachedFlashcards.flashcards || cachedFlashcards);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
      }

      if (cachedQuiz) {
        setQuiz(cachedQuiz);
        setQuizAnswers({});
        setQuizSubmitted(false);
        // Update difficulty state if quiz has difficulty info (only if user hasn't manually changed it)
        if (cachedQuiz.difficulty && cachedQuiz.difficulty !== quizDifficulty && !userChangedQuizDifficulty) {
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

  const checkForCachedResult = async (operationType: string, parameters: any): Promise<any | null> => {
    try {
      if (selectedRecordings.length === 0) {
        return null;
      }

      const queryParams = new URLSearchParams({
        operation_type: operationType,
        recording_ids: JSON.stringify(selectedRecordings),
        // Only add parameters for operations that still use parameter matching
        ...(operationType === 'notes' ? Object.entries(parameters).reduce((acc, [key, value]) => {
          if (typeof value === 'object') {
            acc[key] = JSON.stringify(value);
          } else {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>) : {})
      });

      const response = await fetch(`/api/lectures/study-tools/cached?${queryParams}`);
      
      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking for cached result:', error);
      return null;
    }
  };

  const formatRecordingTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeAudioAnalyzer = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255);
          audioLevelAnimationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
    }
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      toast({
        title: "Speech Recognition Not Supported",
        description: "Live transcription is not available in this browser. You can still record audio and manually add transcripts later.",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };

      speechRecognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result:', event.results.length, 'results');
        let interimTranscript = '';
        
        // Process all results from the last index
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`Result ${i}:`, {
            transcript,
            confidence,
            isFinal: event.results[i].isFinal
          });
          
          if (event.results[i].isFinal) {
            // Only add final results to avoid repetition
            finalTranscriptRef.current += transcript + ' ';
            console.log('Added to final transcript. Total length:', finalTranscriptRef.current.length);
          } else {
            // Show interim results separately
            interimTranscript += transcript;
          }
        }
        
        // Update the live transcript with final + interim
        const fullTranscript = finalTranscriptRef.current + interimTranscript;
        setLiveTranscript(fullTranscript);
        console.log('Live transcript updated. Length:', fullTranscript.length);
      };

      speechRecognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);
        
        if (event.error === 'no-speech') {
          console.log('No speech detected, restarting recognition...');
          // Restart recognition if no speech detected
          setTimeout(() => {
            if (isRecording && speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.start();
              } catch (err) {
                console.error('Failed to restart speech recognition:', err);
              }
            }
          }, 1000);
        } else if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access for speech recognition to work.",
            variant: "destructive",
          });
        } else if (event.error === 'network') {
          toast({
            title: "Network Error",
            description: "Speech recognition requires an internet connection.",
            variant: "destructive",
          });
        }
      };

      speechRecognitionRef.current.onend = () => {
        console.log('Speech recognition ended. Current recording state:', { isRecording, isPaused });
        // Restart recognition if recording is still active
        if (isRecording && !isPaused) {
          console.log('Restarting speech recognition...');
          try {
            speechRecognitionRef.current.start();
          } catch (err) {
            console.error('Failed to restart speech recognition:', err);
          }
        }
      };

      console.log('Starting speech recognition...');
      speechRecognitionRef.current.start();
      
      // Show user that speech recognition is active
      toast({
        title: "Speech Recognition Active",
        description: "Speak clearly for live transcription. Your speech will appear below.",
      });
      
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      toast({
        title: "Transcription Error",
        description: "Could not start live transcription. You can still record audio.",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      audioStreamRef.current = stream;
      
      // Initialize audio analyzer for visual feedback
      initializeAudioAnalyzer(stream);
      
      // Initialize speech recognition for live transcription
      initializeSpeechRecognition();
      
      // Initialize MediaRecorder with proper audio format
      const options = { mimeType: 'audio/webm' };
      
      // Check if the browser supports the preferred format
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/wav';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = ''; // Use default
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options.mimeType ? options : undefined);
      const audioChunks: Blob[] = [];
      
      console.log('MediaRecorder initialized with MIME type:', mediaRecorderRef.current.mimeType);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('MediaRecorder stopped. Total chunks:', audioChunks.length);
        
        if (audioChunks.length === 0) {
          console.error('No audio data recorded');
          toast({
            title: "Recording Error",
            description: "No audio data was captured. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const totalSize = audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('Total audio size:', totalSize, 'bytes');
        
        if (totalSize === 0) {
          console.error('Audio data is empty');
          toast({
            title: "Recording Error", 
            description: "Recorded audio is empty. Please check your microphone.",
            variant: "destructive",
          });
          return;
        }
        
        // Use the actual MIME type from MediaRecorder
        const audioBlob = new Blob(audioChunks, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        console.log('Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        // Use the stored duration from when stop was called
        await saveRecordingWithTranscript(audioBlob, finalRecordingDurationRef.current);
      };
      
      // Start recording with timeslice to ensure regular data events
      mediaRecorderRef.current.start(1000); // Request data every 1 second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setLiveTranscript("");
      finalTranscriptRef.current = ""; // Reset the transcript ref for new recording
      
      console.log('Recording started. Transcript state reset.');
      
      toast({
        title: "Recording Started",
        description: "Your lecture is being recorded with live transcription",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.start();
        }
        setIsPaused(false);
        toast({
          title: "Recording Resumed",
          description: "Lecture recording has been resumed",
        });
      } else {
        mediaRecorderRef.current.pause();
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }
        setIsPaused(true);
        toast({
          title: "Recording Paused",
          description: "Lecture recording has been paused",
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Store the current recording time before stopping
      finalRecordingDurationRef.current = recordingTime;
      
      // Capture the current live transcript (includes both final and interim results)
      const currentTranscript = liveTranscript.trim();
      
      console.log('Stopping recording. Transcript sources:', {
        finalTranscriptRefLength: finalTranscriptRef.current?.length || 0,
        finalTranscriptRefContent: finalTranscriptRef.current || '[EMPTY]',
        liveTranscriptLength: currentTranscript.length,
        liveTranscriptContent: currentTranscript || '[EMPTY]'
      });
      
      // Use the live transcript as the final transcript if it's more complete
      if (currentTranscript.length > finalTranscriptRef.current.length) {
        console.log('Using live transcript as final transcript (more complete)');
        finalTranscriptRef.current = currentTranscript;
      }
      
      console.log('Final transcript to save:', {
        length: finalTranscriptRef.current.length,
        preview: finalTranscriptRef.current.substring(0, 100)
      });
      
      mediaRecorderRef.current.stop();
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioLevelAnimationRef.current) {
        cancelAnimationFrame(audioLevelAnimationRef.current);
      }
      
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      
      toast({
        title: "Recording Stopped",
        description: "Processing your lecture recording...",
      });
    }
  };

  const saveRecordingWithTranscript = async (audioBlob: Blob, duration?: number) => {
    try {
      const recordingName = currentRecordingName?.trim() || `Lecture ${new Date().toLocaleDateString()}`;
      const cleanTranscript = finalTranscriptRef.current?.trim() || "";
      const recordingDuration = Math.max(0, duration || recordingTime || 0);
      
      console.log('Saving recording with data:', {
        name: recordingName,
        transcriptLength: cleanTranscript.length,
        transcript: cleanTranscript.length > 0 ? cleanTranscript.substring(0, 100) + (cleanTranscript.length > 100 ? '...' : '') : '[NO TRANSCRIPT]',
        duration: recordingDuration,
        passedDuration: duration,
        currentRecordingTime: recordingTime,
        finalTranscriptRefLength: finalTranscriptRef.current?.length || 0,
        finalTranscriptRefContent: finalTranscriptRef.current || '[EMPTY]',
        liveTranscriptLength: liveTranscript.length,
        liveTranscriptContent: liveTranscript || '[EMPTY]'
      });
      
      if (cleanTranscript.length === 0) {
        console.warn('No transcript captured during recording. Speech recognition may not have detected any speech.');
        console.warn('Current live transcript state:', liveTranscript);
      } else {
        console.log('SUCCESS: Transcript captured and will be sent to API:', cleanTranscript.substring(0, 200));
      }
      
      // Prepare FormData for audio upload
      const formData = new FormData();
      formData.append('name', recordingName);
      formData.append('transcript', cleanTranscript);
      formData.append('duration', recordingDuration.toString());
      if (audioBlob) {
        // Determine proper filename extension based on blob type
        let fileName = 'recording.webm'; // Default
        if (audioBlob.type.includes('wav')) {
          fileName = 'recording.wav';
        } else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
          fileName = 'recording.mp3';
        } else if (audioBlob.type.includes('mp4')) {
          fileName = 'recording.mp4';
        } else if (audioBlob.type.includes('ogg')) {
          fileName = 'recording.ogg';
        }
        
        console.log('Appending audio file to FormData:', {
          size: audioBlob.size,
          type: audioBlob.type,
          fileName: fileName
        });
        
        formData.append('audioFile', audioBlob, fileName);
      }

      // Log FormData contents before sending
      console.log('FormData being sent to API:');
      console.log('name:', formData.get('name'));
      console.log('transcript:', formData.get('transcript'));
      console.log('duration:', formData.get('duration'));
      const audioFile = formData.get('audioFile') as File;
      if (audioFile) {
        console.log('audioFile:', { type: audioFile.type, size: audioFile.size, name: audioFile.name });
      }

      // Save to database via API
      const response = await fetch('/api/lectures/upload', {
        method: 'POST',
        body: formData, // Send as FormData instead of JSON
      });

      console.log('API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save recording failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to save recording (${response.status}): ${errorData.error || response.statusText}`);
      }

      const { recording } = await response.json();
      console.log('API Response Data:', recording);
      
      // Add to local state
      const newRecording: LectureRecording = {
        id: recording.id,
        name: recording.title, // Map database 'title' field to interface 'name' field
        duration: recording.duration,
        recordedAt: new Date(recording.created_at),
        status: 'ready' as 'recording' | 'processing' | 'ready' | 'error',
        transcript: recording.transcript,
        audioBlob: audioBlob, // Keep the blob for immediate playback
        audioFilePath: recording.audio_url, // Map database 'audio_url' to interface 'audioFilePath'
      };
      
      setRecordings(prev => [...prev, newRecording]);
      
      toast({
        title: "Recording Saved",
        description: "Your lecture recording is ready for study tools generation",
      });
      
      // Reset recording state after successful save
      setCurrentRecordingName("");
      setRecordingTime(0);
      setLiveTranscript("");
      finalTranscriptRef.current = "";
      
      console.log('Recording state reset after successful save');
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the recording",
        variant: "destructive",
      });
    }
  };

  // Audio playback functions
  const createAudioFromBlob = (audioBlob: Blob): string => {
    return URL.createObjectURL(audioBlob);
  };

  const playRecording = async (recording: LectureRecording) => {
    try {
      // Stop any currently playing audio
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }

      // Check if we have audio available (either blob or file path)
      if (!recording.audioBlob && !recording.audioFilePath) {
        toast({
          title: "Audio Not Available",
          description: "No audio data available for this recording.",
          variant: "destructive",
        });
        return;
      }

      setIsLoadingAudio(recording.id);
      
      // Create audio element
      const audio = new Audio();
      audioPlaybackRef.current = audio;
      
      let audioUrl: string;
      let shouldRevokeUrl = false;
      
      if (recording.audioBlob) {
        // Use blob for current session recordings
        audioUrl = createAudioFromBlob(recording.audioBlob);
        shouldRevokeUrl = true;
      } else if (recording.audioFilePath) {
        // Get public URL from Supabase Storage for saved recordings
        const { data } = supabase.storage
          .from('lecture-audio')
          .getPublicUrl(recording.audioFilePath);
        
        // Add cache-busting parameter to prevent browser caching issues
        const url = new URL(data.publicUrl);
        url.searchParams.set('t', Date.now().toString());
        audioUrl = url.toString();
        shouldRevokeUrl = false;
        
        console.log('Loading audio from storage:', {
          path: recording.audioFilePath,
          url: audioUrl
        });
      } else {
        throw new Error('No audio source available');
      }
      
      audio.src = audioUrl;
      
      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setPlaybackDuration(audio.duration);
        setIsLoadingAudio(null);
      });
      
      audio.addEventListener('timeupdate', () => {
        setPlaybackTime(audio.currentTime);
      });
      
      audio.addEventListener('ended', () => {
        setPlayingRecordingId(null);
        setPlaybackTime(0);
        if (audioPlaybackRef.current === audio) {
          audioPlaybackRef.current = null;
        }
        if (shouldRevokeUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsLoadingAudio(null);
        setPlayingRecordingId(null);
        toast({
          title: "Playback Error",
          description: "Failed to play the recording. Please try again.",
          variant: "destructive",
        });
      });
      
      // Start playback
      await audio.play();
      setPlayingRecordingId(recording.id);
      setLastPlayedRecordingId(recording.id);
      
    } catch (error) {
      console.error('Error playing recording:', error);
      setIsLoadingAudio(null);
      setPlayingRecordingId(null);
      toast({
        title: "Playback Failed",
        description: "Could not play the recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pausePlayback = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      setPlayingRecordingId(null);
    }
  };

  const resumePlayback = (recordingId: string) => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.play();
      setPlayingRecordingId(recordingId);
    }
  };

  const stopPlayback = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current.currentTime = 0;
      setPlayingRecordingId(null);
      setLastPlayedRecordingId(null);
      setPlaybackTime(0);
    }
  };

  const seekTo = (time: number) => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.currentTime = time;
      setPlaybackTime(time);
    }
  };

  // Study tools generation functions
  const pollStudyToolsJobStatus = async (jobId: string, operationType: string, onComplete: (result: any) => void) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        const response = await fetch(`/api/lectures/study-tools/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const data = await response.json();
        console.log(`Job ${jobId} status:`, data.status);

        if (data.status === 'completed' && data.result) {
          onComplete(data.result);
          return;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Job failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Job timed out after 5 minutes');
        } else {
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

  const generateFlashcards = async (difficulty = 'medium', count = 10) => {
    if (selectedRecordings.length === 0) {
      toast({
        title: "No Recordings Selected",
        description: "Please select recordings to generate flashcards.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('flashcards');
    try {
      const cachedResult = await checkForCachedResult('flashcards', { difficulty, count });
      if (cachedResult) {
        setFlashcards(cachedResult.flashcards || cachedResult);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
        scrollToTopAndSetTab("flashcards");
        setIsGenerating(null);
        return;
      }

      const response = await fetch('/api/lectures/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingIds: selectedRecordings, difficulty, count }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to start flashcards generation');
      }

      const result = await response.json();
      setActiveTab("flashcards");
      setLoadingStudyTools(prev => ({ ...prev, flashcards: true }));

      await pollStudyToolsJobStatus(result.jobId, 'flashcards', (result) => {
        setFlashcards(result.flashcards);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
        setLoadingStudyTools(prev => ({ ...prev, flashcards: false }));
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
    if (selectedRecordings.length === 0) {
      toast({
        title: "No Recordings Selected",
        description: "Please select recordings to generate a quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('quiz');
    try {
      const cachedResult = await checkForCachedResult('quiz', { questionCount, questionTypes, difficulty });
      if (cachedResult) {
        setQuiz(cachedResult);
        setQuizAnswers({});
        setQuizSubmitted(false);
        scrollToTopAndSetTab("quiz");
        setIsGenerating(null);
        return;
      }

      const response = await fetch('/api/lectures/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingIds: selectedRecordings, questionCount, questionTypes, difficulty }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to start quiz generation');
      }

      const result = await response.json();
      setActiveTab("quiz");
      setLoadingStudyTools(prev => ({ ...prev, quiz: true }));

      await pollStudyToolsJobStatus(result.jobId, 'quiz', (result) => {
        setQuiz(result);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setLoadingStudyTools(prev => ({ ...prev, quiz: false }));
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
    if (selectedRecordings.length === 0) {
      toast({
        title: "No Recordings Selected",
        description: "Please select recordings to generate a summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('summary');
    try {
      const cachedResult = await checkForCachedResult('summary', {});
      if (cachedResult) {
        setSummary(cachedResult);
        scrollToTopAndSetTab("summary");
        setIsGenerating(null);
        return;
      }

      const response = await fetch('/api/lectures/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingIds: selectedRecordings }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to start summary generation');
      }

      const result = await response.json();
      setActiveTab("summary");
      setLoadingStudyTools(prev => ({ ...prev, summary: true }));

      await pollStudyToolsJobStatus(result.jobId, 'summary', (result) => {
        setSummary(result);
        setLoadingStudyTools(prev => ({ ...prev, summary: false }));
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
    if (selectedRecordings.length === 0) {
      toast({
        title: "No Recordings Selected",
        description: "Please select recordings to generate notes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('notes');
    try {
      const cachedResult = await checkForCachedResult('notes', { style });
      if (cachedResult) {
        setNotes(cachedResult);
        scrollToTopAndSetTab("notes");
        setIsGenerating(null);
        return;
      }

      const response = await fetch('/api/lectures/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingIds: selectedRecordings, style }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to start notes generation');
      }

      const result = await response.json();
      setActiveTab("notes");
      setLoadingStudyTools(prev => ({ ...prev, notes: true }));

      await pollStudyToolsJobStatus(result.jobId, 'notes', (result) => {
        setNotes(result);
        setLoadingStudyTools(prev => ({ ...prev, notes: false }));
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

  const cleanQuizOption = (option: string): string => {
    // Remove letter prefixes like "A. ", "B. ", "C. ", "D. " from the beginning
    return option.replace(/^[A-Z]\.\s*/, '').trim();
  };

  const deleteCachedStudyTool = async (operationType: string, parameters: any): Promise<boolean> => {
    try {
      if (selectedRecordings.length === 0) {
        return false;
      }

      const queryParams = new URLSearchParams({
        operation_type: operationType,
        recording_ids: JSON.stringify(selectedRecordings),
        // Only add parameters for operations that still use parameter matching
        ...(operationType === 'notes' ? Object.entries(parameters).reduce((acc, [key, value]) => {
          if (typeof value === 'object') {
            acc[key] = JSON.stringify(value);
          } else {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>) : {})
      });

      const response = await fetch(`/api/lectures/study-tools/cached?${queryParams}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Deleted ${result.deletedCount || 0} cached ${operationType} result(s)`);
        return result.deletedCount > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting cached result:', error);
      return false;
    }
  };

  const regenerateFlashcards = async (difficulty = 'medium', count = 10) => {
    if (selectedRecordings.length === 0) {
      toast({
        title: "No Recordings Selected",
        description: "Please select recordings to regenerate flashcards.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('flashcards');
    
    try {
      // Clear current flashcards to show loading state
      setFlashcards([]);
      setCurrentFlashcardIndex(0);
      setShowFlashcardAnswer(false);
      
      // Delete cached flashcards first (no parameters - deletes all flashcards for selected recordings)
      console.log('Deleting cached flashcards...');
      const deleteSuccess = await deleteCachedStudyTool('flashcards', {});
      console.log('Cache deletion result:', deleteSuccess);
      
      if (deleteSuccess) {
        toast({
          title: "Cache Cleared",
          description: "Removed previous flashcards to generate fresh content.",
        });
      }
      
      // Call the API directly instead of generateFlashcards to avoid cache check
      const response = await fetch('/api/lectures/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingIds: selectedRecordings, difficulty, count }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to start flashcards generation');
      }

      const result = await response.json();
      setActiveTab("flashcards");
      setLoadingStudyTools(prev => ({ ...prev, flashcards: true }));

      await pollStudyToolsJobStatus(result.jobId, 'flashcards', (result) => {
        setFlashcards(result.flashcards);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
        setLoadingStudyTools(prev => ({ ...prev, flashcards: false }));
      });
    } catch (error) {
      setLoadingStudyTools(prev => ({ ...prev, flashcards: false }));
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to regenerate flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const regenerateQuiz = async (questionCount = 10, questionTypes = ['multiple-choice', 'true-false', 'short-answer'], difficulty = quizDifficulty) => {
    if (selectedRecordings.length === 0) {
      toast({
        title: "No Recordings Selected",
        description: "Please select recordings to regenerate quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('quiz');
    
    try {
      // Clear current quiz to show loading state
      setQuiz(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      // Reset difficulty change tracking since we're regenerating with chosen difficulty
      setUserChangedQuizDifficulty(false);
      
      // Delete cached quiz first (no parameters - deletes all quizzes for selected recordings)
      console.log('Deleting cached quiz...');
      const deleteSuccess = await deleteCachedStudyTool('quiz', {});
      console.log('Cache deletion result:', deleteSuccess);
      
      if (deleteSuccess) {
        toast({
          title: "Cache Cleared",
          description: "Removed previous quiz to generate fresh content.",
        });
      }
      
      // Call the API directly instead of generateQuiz to avoid cache check
      const response = await fetch('/api/lectures/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingIds: selectedRecordings, questionCount, questionTypes, difficulty }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to start quiz generation');
      }

      const result = await response.json();
      setActiveTab("quiz");
      setLoadingStudyTools(prev => ({ ...prev, quiz: true }));

      await pollStudyToolsJobStatus(result.jobId, 'quiz', (result) => {
        setQuiz(result);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setLoadingStudyTools(prev => ({ ...prev, quiz: false }));
      });
    } catch (error) {
      setLoadingStudyTools(prev => ({ ...prev, quiz: false }));
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to regenerate quiz",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const regenerateSummary = async () => {
    // Delete cached summary first
    await deleteCachedStudyTool('summary', {});
    
    // Clear current summary to show loading state
    setSummary(null);
    
    // Generate new summary
    await generateSummary();
  };

  const regenerateNotes = async (style = 'structured') => {
    // Delete cached notes first
    await deleteCachedStudyTool('notes', { style });
    
    // Clear current notes to show loading state
    setNotes(null);
    
    // Generate new notes
    await generateNotes(style);
  };

  const downloadPDF = async (content: any, title: string, type: string) => {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text(title, 20, 30);
      
      let yPosition = 50;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      
      if (type === 'flashcards') {
        content.forEach((flashcard: any, index: number) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Card ${index + 1}`, margin, yPosition);
          yPosition += lineHeight * 2;
          
          pdf.setFont('helvetica', 'bold');
          pdf.text('Q:', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          const questionLines = pdf.splitTextToSize(flashcard.front || flashcard.question, 170);
          pdf.text(questionLines, margin + 10, yPosition);
          yPosition += questionLines.length * lineHeight + 5;
          
          pdf.setFont('helvetica', 'bold');
          pdf.text('A:', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          const answerLines = pdf.splitTextToSize(flashcard.back || flashcard.answer, 170);
          pdf.text(answerLines, margin + 10, yPosition);
          yPosition += answerLines.length * lineHeight + 15;
        });
      } else if (type === 'summary') {
        // Add overview section
        if (content.overview) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Overview', margin, yPosition);
          yPosition += lineHeight * 2;
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          const overviewLines = pdf.splitTextToSize(content.overview, 170);
          pdf.text(overviewLines, margin, yPosition);
          yPosition += overviewLines.length * lineHeight + 15;
        }
        
        // Add key points
        if (content.keyPoints && content.keyPoints.length > 0) {
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Key Points', margin, yPosition);
          yPosition += lineHeight * 2;
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          content.keyPoints.forEach((point: string) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 30;
            }
            const pointLines = pdf.splitTextToSize(`• ${point}`, 170);
            pdf.text(pointLines, margin, yPosition);
            yPosition += pointLines.length * lineHeight + 5;
          });
          yPosition += 10;
        }
        
        // Add likely test topics
        if (content.likelyTestTopics && content.likelyTestTopics.length > 0) {
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Likely Test Topics', margin, yPosition);
          yPosition += lineHeight * 2;
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          content.likelyTestTopics.forEach((topic: string) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 30;
            }
            const topicLines = pdf.splitTextToSize(`• ${topic}`, 170);
            pdf.text(topicLines, margin, yPosition);
            yPosition += topicLines.length * lineHeight + 5;
          });
        }
      } else if (type === 'notes') {
        if (content.sections && content.sections.length > 0) {
          content.sections.forEach((section: any) => {
            if (yPosition > pageHeight - 60) {
              pdf.addPage();
              yPosition = 30;
            }
            
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(section.title, margin, yPosition);
            yPosition += lineHeight * 2;
            
            if (section.content) {
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'normal');
              const contentLines = pdf.splitTextToSize(section.content, 170);
              pdf.text(contentLines, margin, yPosition);
              yPosition += contentLines.length * lineHeight + 10;
            }
            
            if (section.keyPoints && section.keyPoints.length > 0) {
              pdf.setFontSize(14);
              pdf.setFont('helvetica', 'bold');
              pdf.text('Key Points:', margin, yPosition);
              yPosition += lineHeight;
              
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'normal');
              section.keyPoints.forEach((point: string) => {
                if (yPosition > pageHeight - 20) {
                  pdf.addPage();
                  yPosition = 30;
                }
                const pointLines = pdf.splitTextToSize(`• ${point}`, 170);
                pdf.text(pointLines, margin, yPosition);
                yPosition += pointLines.length * lineHeight + 3;
              });
              yPosition += 10;
            }
          });
        } else if (content.content) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          const contentLines = pdf.splitTextToSize(content.content, 170);
          pdf.text(contentLines, margin, yPosition);
        }
      }
      
      pdf.save(`${title}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `${title} has been downloaded successfully`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <ClientSubscriptionCheck redirectTo="/pricing">
      <div className="container mx-auto px-4 py-8 pb-15 md:pb-8">
        <DynamicPageTitle title="UniShare | AI Lecture Notes" />

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">AI Lecture Notes</h1>
          </div>
          <p className="text-muted-foreground">
            Record lectures and generate AI-powered study materials
          </p>
        </header>

        <Tabs value={activeTab} className="space-y-6">
          <MobileTabs
            tabs={[
              { value: "recorder", label: "Recorder" },
              { value: "summary", label: "Summary" },
              { value: "notes", label: "Notes" },
              { value: "flashcards", label: "Flashcards" },
              { value: "quiz", label: "Quiz" },
            ]}
            activeTab={activeTab}
            className="mb-6"
            onTabChange={setActiveTab}
          />

          {/* Recorder Tab */}
          <TabsContent value="recorder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Lecture Recorder
                </CardTitle>
                <CardDescription>
                  Record lectures with real-time transcription and AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {micPermissionStatus === 'denied' && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <MicOff className="h-4 w-4" />
                      <span className="font-medium">Microphone Access Denied</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please enable microphone access in your browser settings to record lectures.
                    </p>
                  </div>
                )}

                {/* Recording Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recording-name">Recording Name (Optional)</Label>
                    <Input
                      id="recording-name"
                      value={currentRecordingName}
                      onChange={(e) => setCurrentRecordingName(e.target.value)}
                      placeholder={`Lecture ${new Date().toLocaleDateString()}`}
                      disabled={isRecording}
                    />
                  </div>

                  {/* Recording Status */}
                  <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <div className="text-center space-y-4">
                      {isRecording ? (
                        <>
                          <div className="relative flex items-center justify-center">
                            <div className={`w-20 h-20 rounded-full bg-red-500 flex items-center justify-center animate-pulse`}>
                              <Mic className="h-8 w-8 text-white" />
                            </div>
                            {audioLevel > 0 && (
                              <div 
                                className="absolute inset-0 rounded-full border-4 border-red-300"
                                style={{
                                  transform: `scale(${1 + audioLevel * 0.5})`,
                                  transition: 'transform 0.1s ease-out'
                                }}
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="text-2xl font-mono font-bold text-red-500">
                              {formatRecordingTime(recordingTime)}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              {isPaused ? 'Paused' : 'Recording'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                            <Mic className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <div className="text-lg font-medium">Ready to Record</div>
                            <div className="text-sm text-muted-foreground">
                              Start recording to capture your lecture with live transcription
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex justify-center gap-4">
                    {!isRecording ? (
                      <Button 
                        onClick={startRecording}
                        disabled={micPermissionStatus === 'denied'}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        size="lg"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={pauseRecording}
                          variant="outline"
                          size="lg"
                        >
                          {isPaused ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={stopRecording}
                          variant="destructive"
                          size="lg"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Live Transcription */}
                {isRecording && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Live Transcription
                        {!liveTranscript && (
                          <div className="flex items-center gap-1 ml-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-muted-foreground">Listening...</span>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32 w-full">
                        {liveTranscript ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {liveTranscript}
                          </p>
                        ) : (
                          <div className="text-center py-4">
                            <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
                            <p className="text-sm text-muted-foreground">
                              Speak clearly and your words will appear here...
                            </p>
                            {!isMobile && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Make sure your microphone is working and you have a good internet connection
                              </p>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Recordings List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Recordings ({recordings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recordings.length === 0 ? (
                  <div className="text-center py-8">
                    <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Recordings Yet</h3>
                    <p className="text-muted-foreground">
                      Start recording lectures to build your study material library
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recordings.map((recording) => {
                      const isCurrentlyPlaying = playingRecordingId === recording.id;
                      const isLoading = isLoadingAudio === recording.id;
                      
                      return (
                        <div key={recording.id} className="border rounded-lg">
                          <div className="flex items-center space-x-4 p-4">
                            <input
                              type="checkbox"
                              checked={selectedRecordings.includes(recording.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecordings([...selectedRecordings, recording.id]);
                                } else {
                                  setSelectedRecordings(selectedRecordings.filter(id => id !== recording.id));
                                }
                              }}
                              className="rounded"
                            />
                            
                            {/* Audio playback controls */}
                            <div className="flex items-center gap-1">
                              {(recording.audioBlob || recording.audioFilePath) ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (isCurrentlyPlaying) {
                                        pausePlayback();
                                      } else if (audioPlaybackRef.current && playingRecordingId && playingRecordingId !== recording.id) {
                                        // If another recording is playing, stop it and play this one
                                        stopPlayback();
                                        playRecording(recording);
                                      } else if (audioPlaybackRef.current && playingRecordingId === recording.id) {
                                        // Resume this recording
                                        resumePlayback(recording.id);
                                      } else {
                                        playRecording(recording);
                                      }
                                    }}
                                    disabled={isLoading}
                                    title={isCurrentlyPlaying ? "Pause" : "Play"}
                                  >
                                    {isLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isCurrentlyPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>

                                </>
                              ) : (
                                <div className="w-8 h-8 flex items-center justify-center" title="No audio available">
                                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{recording.name}</h4>
                            {isCurrentlyPlaying && (
                              <Badge variant="secondary">
                                <Volume2 className="h-3 w-3 mr-1" />
                                Playing
                              </Badge>
                            )}
                            <Badge 
                              variant={
                                recording.status === 'ready' ? 'default' : 
                                recording.status === 'processing' ? 'secondary' : 
                                recording.status === 'recording' ? 'destructive' : 
                                'destructive'
                              }
                              className="hidden md:inline-flex"
                            >
                              {recording.status}
                            </Badge>
                          </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatRecordingTime(recording.duration)}
                                </div>
                                <span>{recording.recordedAt.toLocaleDateString()}</span>
                              </div>
                              {recording.transcript ? (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {recording.transcript.substring(0, 100)}...
                                </p>
                              ) : (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <p className="text-xs text-yellow-600">
                                    No transcript - study tools unavailable
                                  </p>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRecordingToDelete(recording);
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

            {/* AI Study Tools */}
            {selectedRecordings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    AI Study Tools
                  </CardTitle>
                  <CardDescription>
                    Generate study materials from your selected recordings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => {
                        if (flashcards.length > 0) {
                          scrollToTopAndSetTab("flashcards");
                        } else {
                          generateFlashcards('medium', 10);
                        }
                      }}
                      disabled={isGenerating === 'flashcards'}
                      className="h-20 flex flex-col gap-2 relative"
                      variant="outline"
                    >
                      {flashcards.length > 0 && (
                        <Archive className="h-3 w-3 absolute top-2 right-2 text-muted-foreground" />
                      )}
                      {isGenerating === 'flashcards' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">
                          {flashcards.length > 0 ? "View Flashcards" : "Generate Flashcards"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {flashcards.length > 0 ? `${flashcards.length} cards ready` : "Study key concepts"}
                        </div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => {
                        if (quiz) {
                          scrollToTopAndSetTab("quiz");
                        } else {
                          generateQuiz(10, ['multiple-choice', 'true-false', 'short-answer'], quizDifficulty);
                        }
                      }}
                      disabled={isGenerating === 'quiz'}
                      className="h-20 flex flex-col gap-2 relative"
                      variant="outline"
                    >
                      {quiz && (
                        <Archive className="h-3 w-3 absolute top-2 right-2 text-muted-foreground" />
                      )}
                      {isGenerating === 'quiz' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <HelpCircle className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">
                          {quiz ? "View Quiz" : "Generate Quiz"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quiz ? `${quiz.questions?.length || 0} questions ready` : "Test your knowledge"}
                        </div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => {
                        if (summary) {
                          scrollToTopAndSetTab("summary");
                        } else {
                          generateSummary();
                        }
                      }}
                      disabled={isGenerating === 'summary'}
                      className="h-20 flex flex-col gap-2 relative"
                      variant="outline"
                    >
                      {summary && (
                        <Archive className="h-3 w-3 absolute top-2 right-2 text-muted-foreground" />
                      )}
                      {isGenerating === 'summary' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Target className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">
                          {summary ? "View Summary" : "Generate Summary"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {summary ? "Summary ready" : "Key points & test topics"}
                        </div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => {
                        if (notes) {
                          scrollToTopAndSetTab("notes");
                        } else {
                          generateNotes('structured');
                        }
                      }}
                      disabled={isGenerating === 'notes'}
                      className="h-20 flex flex-col gap-2 relative"
                      variant="outline"
                    >
                      {notes && (
                        <Archive className="h-3 w-3 absolute top-2 right-2 text-muted-foreground" />
                      )}
                      {isGenerating === 'notes' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <BookOpenCheck className="h-5 w-5" />
                      )}
                      <div className="text-center">
                        <div className="font-medium">
                          {notes ? "View Notes" : "Generate Notes"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notes ? "Notes ready" : "Structured study notes"}
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  Study key concepts from your lecture recordings
                </CardDescription>
              </CardHeader>
              <CardContent>
                              {loadingStudyTools.flashcards ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Generating Flashcards</h3>
                    <p className="text-muted-foreground mb-4">
                      AI is creating personalized flashcards from your lecture recordings...
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
                      Select recordings and generate flashcards to start studying
                    </p>
                    <Button onClick={() => setActiveTab("recorder")}>
                      <Mic className="h-4 w-4 mr-2" />
                      Go to Recorder
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
                          onClick={() => setShowFlashcardRegenDialog(true)}
                          variant="outline"
                          size="sm"
                          disabled={isGenerating === 'flashcards'}
                          className={isMobile ? "px-2" : ""}
                        >
                          {isGenerating === 'flashcards' ? (
                            <Loader2 className={`h-4 w-4 ${isMobile ? "" : "mr-2"} animate-spin`} />
                          ) : (
                            <RefreshCw className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                          )}
                          {!isMobile && "Regenerate"}
                        </Button>
                        <Button 
                          onClick={() => downloadPDF(flashcards, `Flashcards - ${selectedRecordings.length} recordings`, 'flashcards')}
                          variant="outline"
                          size="sm"
                          className={isMobile ? "px-2" : ""}
                        >
                          <FileDown className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                          {!isMobile && "Download"}
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
                                  {flashcards[currentFlashcardIndex]?.front || flashcards[currentFlashcardIndex]?.question}
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
                                  {flashcards[currentFlashcardIndex]?.back || flashcards[currentFlashcardIndex]?.answer}
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
                  Test your knowledge with AI-generated questions from your lectures
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudyTools.quiz ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Generating Quiz</h3>
                    <p className="text-muted-foreground mb-4">
                      AI is creating practice questions from your lecture recordings...
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
                      Select recordings and generate a quiz to test your knowledge
                    </p>
                    <Button onClick={() => setActiveTab("recorder")}>
                      <Mic className="h-4 w-4 mr-2" />
                      Go to Recorder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Quiz Header */}
                    <div className={`${isMobile ? "space-y-3" : "flex items-center justify-between"}`}>
                      <div>
                        <h3 className="text-xl font-semibold">{quiz.title}</h3>
                        {isMobile && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {quiz.questions?.length || 0} questions
                          </div>
                        )}
                      </div>
                      <div className={`${isMobile ? "flex flex-col gap-3" : "flex items-center gap-3"}`}>
                        {!isMobile && (
                          <div className="text-sm text-muted-foreground">
                            {quiz.questions?.length || 0} questions
                          </div>
                        )}
                        
                        {/* Quiz Controls */}
                        <div className={`flex items-center gap-2 ${isMobile ? "justify-between" : ""}`}>
                          {/* Difficulty Selector */}
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">
                              Difficulty:
                            </Label>
                            <Select value={quizDifficulty} onValueChange={(value) => {
                              setQuizDifficulty(value);
                              setUserChangedQuizDifficulty(true);
                            }}>
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
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => regenerateQuiz(10, ['multiple-choice', 'true-false', 'short-answer'], quizDifficulty)}
                              variant="outline"
                              size="sm"
                              disabled={isGenerating === 'quiz'}
                              className={isMobile ? "px-2" : ""}
                            >
                              {isGenerating === 'quiz' ? (
                                <Loader2 className={`h-4 w-4 ${isMobile ? "" : "mr-2"} animate-spin`} />
                              ) : (
                                <RefreshCw className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                              )}
                              {!isMobile && "Regenerate"}
                            </Button>
                            <Button 
                              onClick={() => downloadPDF(quiz, quiz.title, 'quiz')}
                              variant="outline"
                              size="sm"
                              className={isMobile ? "px-2" : ""}
                            >
                              <FileDown className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                              {!isMobile && "Download"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quiz Questions */}
                    <div className="space-y-6">
                      {quiz.questions?.map((question: any, index: number) => (
                        <Card key={question.id || index} className="p-6">
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
                                          id={`q${question.id || index}_${optIndex}`}
                                          name={`question_${question.id || index}`}
                                          value={String.fromCharCode(65 + optIndex)}
                                          onChange={(e) => setQuizAnswers(prev => ({
                                            ...prev,
                                            [question.id || index]: e.target.value
                                          }))}
                                          disabled={quizSubmitted}
                                          className="w-4 h-4"
                                        />
                                        <label htmlFor={`q${question.id || index}_${optIndex}`} className="text-sm">
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
                                        id={`q${question.id || index}_true`}
                                        name={`question_${question.id || index}`}
                                        value="true"
                                        onChange={(e) => setQuizAnswers(prev => ({
                                          ...prev,
                                          [question.id || index]: e.target.value
                                        }))}
                                        disabled={quizSubmitted}
                                        className="w-4 h-4"
                                      />
                                      <label htmlFor={`q${question.id || index}_true`} className="text-sm">True</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`q${question.id || index}_false`}
                                        name={`question_${question.id || index}`}
                                        value="false"
                                        onChange={(e) => setQuizAnswers(prev => ({
                                          ...prev,
                                          [question.id || index]: e.target.value
                                        }))}
                                        disabled={quizSubmitted}
                                        className="w-4 h-4"
                                      />
                                      <label htmlFor={`q${question.id || index}_false`} className="text-sm">False</label>
                                    </div>
                                  </div>
                                )}

                                {question.type === 'short-answer' && (
                                  <Textarea
                                    placeholder="Enter your answer here..."
                                    value={quizAnswers[question.id || index] || ''}
                                    onChange={(e) => setQuizAnswers(prev => ({
                                      ...prev,
                                      [question.id || index]: e.target.value
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

                    {/* Quiz Actions */}
                    <div className="flex justify-center gap-4">
                      {!quizSubmitted ? (
                        <Button 
                          onClick={() => setQuizSubmitted(true)}
                          disabled={Object.keys(quizAnswers).length === 0}
                        >
                          Submit Quiz
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                          }}
                          variant="outline"
                        >
                          Retake Quiz
                        </Button>
                      )}
                    </div>
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
                  AI Lecture Summary
                </CardTitle>
                <CardDescription>
                  Comprehensive overview with key points from your lectures
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudyTools.summary ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Generating Study Summary</h3>
                    <p className="text-muted-foreground mb-4">
                      AI is analyzing your lecture recordings to create comprehensive insights...
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
                      Select recordings and generate a summary to see key insights
                    </p>
                    <Button onClick={() => setActiveTab("recorder")}>
                      <Mic className="h-4 w-4 mr-2" />
                      Go to Recorder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold flex-1 pr-4">{summary.title}</h3>
                      <Button 
                        onClick={() => downloadPDF(summary, `Summary - ${selectedRecordings.length} recordings`, 'summary')}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className={isMobile ? "px-2" : ""}
                      >
                        <FileDown className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                        {!isMobile && "Download"}
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
                  Lecture Notes
                </CardTitle>
                <CardDescription>
                  Comprehensive study notes from your lecture recordings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudyTools.notes ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Generating Study Notes</h3>
                    <p className="text-muted-foreground mb-4">
                      AI is creating comprehensive study notes from your lecture recordings...
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
                      Select recordings and generate notes for structured study material
                    </p>
                    <Button onClick={() => setActiveTab("recorder")}>
                      <Mic className="h-4 w-4 mr-2" />
                      Go to Recorder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Notes Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold flex-1 pr-4">{notes.title}</h3>
                      <Button 
                        onClick={() => downloadPDF(notes, `Notes - ${selectedRecordings.length} recordings`, 'notes')}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className={isMobile ? "px-2" : ""}
                      >
                        <FileDown className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                        {!isMobile && "Download"}
                      </Button>
                    </div>

                    {/* Notes Content */}
                    {notes.sections && notes.sections.length > 0 ? (
                      <div className="space-y-6">
                        {notes.sections.map((section: any, index: number) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {section.content && (
                                  <div className="prose prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap">{section.content}</div>
                                  </div>
                                )}
                                {section.keyPoints && section.keyPoints.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Key Points:</h4>
                                    <ul className="space-y-1">
                                      {section.keyPoints.map((point: string, pointIndex: number) => (
                                        <li key={pointIndex} className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                          <span className="text-sm">{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {section.examples && section.examples.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Examples:</h4>
                                    <div className="space-y-2">
                                      {section.examples.map((example: string, exampleIndex: number) => (
                                        <div key={exampleIndex} className="bg-muted/50 p-3 rounded text-sm">
                                          {example}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : notes.content ? (
                      <Card>
                        <CardContent className="p-6">
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap">{notes.content}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Flashcard Regeneration Dialog */}
        <Dialog open={showFlashcardRegenDialog} onOpenChange={setShowFlashcardRegenDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Regenerate Flashcards</DialogTitle>
              <DialogDescription>
                Choose the difficulty level and number of flashcards to generate from your selected recordings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="flashcard-difficulty">Difficulty Level</Label>
                <Select value={flashcardDifficulty} onValueChange={setFlashcardDifficulty}>
                  <SelectTrigger id="flashcard-difficulty">
                    <SelectValue>
                      {flashcardDifficulty === 'easy' && 'Easy'}
                      {flashcardDifficulty === 'medium' && 'Medium'}
                      {flashcardDifficulty === 'hard' && 'Hard'}
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
              <div className="space-y-2">
                <Label>Number of Cards</Label>
                <Select value={flashcardCount.toString()} onValueChange={(value) => setFlashcardCount(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 cards</SelectItem>
                    <SelectItem value="10">10 cards</SelectItem>
                    <SelectItem value="15">15 cards</SelectItem>
                    <SelectItem value="20">20 cards</SelectItem>
                    <SelectItem value="25">25 cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFlashcardRegenDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowFlashcardRegenDialog(false);
                  regenerateFlashcards(flashcardDifficulty, flashcardCount);
                }}
                disabled={isGenerating === 'flashcards'}
              >
                {isGenerating === 'flashcards' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Recording</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{recordingToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                onClick={async () => {
                  if (recordingToDelete) {
                    try {
                      const response = await fetch(`/api/lectures/${recordingToDelete.id}`, {
                        method: 'DELETE',
                      });
                      
                      if (response.ok) {
                        // Stop playback if this recording is currently playing
                        if (playingRecordingId === recordingToDelete.id || lastPlayedRecordingId === recordingToDelete.id) {
                          stopPlayback();
                        }
                        
                        const updatedRecordings = recordings.filter(r => r.id !== recordingToDelete.id);
                        setRecordings(updatedRecordings);
                        setSelectedRecordings(selectedRecordings.filter(id => id !== recordingToDelete.id));
                        
                        toast({
                          title: "Recording Deleted",
                          description: "Your lecture recording has been deleted",
                        });
                      } else {
                        throw new Error('Failed to delete recording');
                      }
                    } catch (error) {
                      console.error('Error deleting recording:', error);
                      toast({
                        title: "Delete Failed",
                        description: "Could not delete the recording",
                        variant: "destructive",
                      });
                    }
                  }
                  setShowDeleteDialog(false);
                  setRecordingToDelete(null);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientSubscriptionCheck>
  );
} 