"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Sparkles,
  BookMarked,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  ArrowRight,
  GraduationCap,
  Target,
  Lightbulb,
  FileCheck,
  FileQuestion,
  Link2,
  Calendar,
  Share,
  Send,
  Download,
  Mic
} from "lucide-react";
import Link from "next/link";
import DynamicPageTitle from "@/components/dynamic-page-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the onboarding steps
const steps = [
  {
    id: 1,
    title: "Welcome to UniShare",
    description: "Your all-in-one platform for academic success",
    icon: BookOpen,
    color: "blue",
    content: () => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 relative">
          <Image
            src="/android-chrome-512x512.png"
            alt="UniShare Logo"
            width={120}
            height={120}
            className="drop-shadow-md"
          />
          <motion.div
            className="absolute -right-2 -top-2 bg-primary text-white rounded-full p-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Check className="h-5 w-5" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to UniShare</h2>
        <p className="text-muted-foreground mb-4 max-w-xs">
          Join thousands of students who are already enhancing their academic journey with UniShare.
        </p>
      </div>
    )
  },
  {
    id: 2,
    title: "Your University",
    description: "Connect with your academic community",
    icon: BookOpen,
    color: "blue",
    content: ({ universities, selectedUniversity, setSelectedUniversity, universityStats, setIsStudent }) => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
          <GraduationCap className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Select Your University</h2>
        <p className="text-muted-foreground mb-4 max-w-xs">
          Join your university's community on UniShare and connect with fellow students.
        </p>

        <div className="w-full max-w-xs mb-4">
          <Select
            value={selectedUniversity}
            onValueChange={setSelectedUniversity}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            <SelectContent>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUniversity && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs"
          >
            <div className="bg-background rounded-lg p-4 border border-border mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{universities.find(u => u.id === selectedUniversity)?.name}</span>
                <Badge variant="outline" className="bg-primary/5 text-primary">
                  {universityStats[selectedUniversity] || 0} Students
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {universityStats[selectedUniversity] > 50
                  ? "Join a thriving community of students sharing resources and knowledge!"
                  : "Be among the first to build your university's community on UniShare!"}
              </p>
            </div>

            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsStudent(false)}
            >
              I'm not a student
            </Button>
          </motion.div>
        )}
      </div>
    )
  },
  {
    id: 3,
    title: "Your Goals",
    description: "Set your academic targets",
    icon: Target,
    color: "green",
    content: ({ currentGPA, setCurrentGPA, targetGPA, setTargetGPA }) => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
          <Target className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Set Your GPA Goals</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          UniShare can help you achieve your academic goals through collaboration and resource sharing.
        </p>

        <div className="w-full max-w-xs space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-gpa">Current GPA</Label>
            <div className="relative">
              <Input
                id="current-gpa"
                type="number"
                min="0"
                max="4.0"
                step="0.1"
                value={currentGPA}
                onChange={(e) => setCurrentGPA(e.target.value)}
                className="w-full pr-12"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-muted-foreground">/4.0</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-gpa">Target GPA</Label>
            <div className="relative">
              <Input
                id="target-gpa"
                type="number"
                min="0"
                max="4.0"
                step="0.1"
                value={targetGPA}
                onChange={(e) => setTargetGPA(e.target.value)}
                className="w-full pr-12"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-muted-foreground">/4.0</span>
              </div>
            </div>
          </div>
        </div>

        {currentGPA && targetGPA && parseFloat(targetGPA) > parseFloat(currentGPA) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-primary/10 p-4 rounded-lg w-full max-w-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">We'll help you get there!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              UniShare's collaborative tools and resources can help you boost your GPA from {currentGPA} to {targetGPA}.
            </p>
          </motion.div>
        )}
      </div>
    )
  },
  {
    id: 4,
    title: "Share & Access Resources",
    description: "Notes, textbooks, study guides, and more",
    icon: BookOpen,
    color: "green",
    content: () => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
          <BookOpen className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Share & Access Resources</h2>
        <p className="text-muted-foreground mb-4 max-w-xs">
          Upload and discover class notes, textbooks, study guides, and more from your university peers.
        </p>

        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-2">
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <FileText className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-[10px] font-medium">Notes</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <BookMarked className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-[10px] font-medium">Textbooks</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <FileCheck className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-[10px] font-medium">Solutions</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Lightbulb className="h-5 w-5 text-yellow-500 mb-1" />
            <span className="text-[10px] font-medium">Study Guides</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <FileQuestion className="h-5 w-5 text-red-500 mb-1" />
            <span className="text-[10px] font-medium">Practice Exams</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link2 className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-[10px] font-medium">External Links</span>
          </motion.div>
        </div>

        <motion.div
          className="mt-6 w-full max-w-xs bg-background rounded-lg border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Calculus II Notes</div>
                <div className="text-[10px] text-muted-foreground">Uploaded by Sarah</div>
              </div>
              <Badge variant="outline" className="text-[10px] h-5">PDF</Badge>
            </div>
          </div>
          <div className="p-2 bg-muted/30 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Downloaded 24 times</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]">
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: 5,
    title: "Join Study Groups",
    description: "Collaborate with classmates",
    icon: Users,
    color: "purple",
    content: () => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full">
          <Users className="h-12 w-12 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Join Study Groups</h2>
        <p className="text-muted-foreground mb-4 max-w-xs">
          Connect with classmates, schedule study sessions, and collaborate on assignments in real-time.
        </p>

        <motion.div
          className="w-full max-w-xs bg-background rounded-lg border border-border overflow-hidden mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Physics 101 Study Group</span>
              <Badge className="bg-purple-100 text-purple-800 text-[10px]">8 members</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Weekly study sessions for Physics 101 with Prof. Johnson</p>
          </div>

          <div className="p-3 bg-muted/20 border-b border-border">
            <div className="flex gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-800">JD</div>
              <div className="flex-1 p-2 bg-blue-100 rounded-lg text-left">
                <p className="text-xs">Hey everyone! Who's joining the study session tomorrow?</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <div className="flex-1 p-2 bg-purple-100 rounded-lg text-left">
                <p className="text-xs">I'll be there! Bringing my notes from last lecture.</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-medium text-purple-800">ME</div>
            </div>
          </div>

          <div className="p-2 flex">
            <Input className="text-xs h-8" placeholder="Type a message..." />
            <Button size="sm" className="ml-2 h-8 w-8 p-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background rounded-lg p-3 border border-border flex flex-col items-center">
              <Calendar className="h-5 w-5 text-purple-500 mb-1" />
              <span className="text-xs font-medium">Schedule Meetings</span>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border flex flex-col items-center">
              <Share className="h-5 w-5 text-purple-500 mb-1" />
              <span className="text-xs font-medium">Share Resources</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: 6,
    title: "Scholar+ Features",
    description: "Premium tools for academic excellence",
    icon: Sparkles,
    color: "amber",
    content: () => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
          <Sparkles className="h-12 w-12 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Scholar+ Features</h2>
        <p className="text-muted-foreground mb-4 max-w-xs">
          Unlock premium tools to enhance your academic success.
        </p>

        <motion.div
          className="w-full max-w-xs bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800/30 p-4 mb-4 overflow-hidden relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200 dark:bg-amber-700/20 rounded-full -mr-10 -mt-10 opacity-50"></div>

          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-amber-200 dark:bg-amber-700/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Scholar+</h3>
              <p className="text-xs text-muted-foreground">Premium academic tools</p>
            </div>
            <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-700/30 dark:text-amber-300">Premium</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">Textbook Answers</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">AI Essay Writer</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                          <span className="text-xs">AI Study Assistant</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <Mic className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">AI Lecture Notes</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs h-8 border-amber-200 dark:border-amber-800/30">
              Continue Free
            </Button>
            <Button className="flex-1 text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white">
              Upgrade
            </Button>
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: 7,
    title: "Get Started",
    description: "Ready to begin your academic journey?",
    icon: ArrowRight,
    color: "primary",
    content: () => (
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-primary/10 rounded-full">
          <ArrowRight className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Join your university community on UniShare and elevate your academic experience today.
        </p>

        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-primary/10 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">Join Your Community</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect with fellow students, share resources, and collaborate on assignments.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [currentGPA, setCurrentGPA] = useState("3.0");
  const [targetGPA, setTargetGPA] = useState("3.5");
  const router = useRouter();

  // Mock data for universities
  const universities = [
    { id: "harvard", name: "Harvard University" },
    { id: "mit", name: "Massachusetts Institute of Technology" },
    { id: "stanford", name: "Stanford University" },
    { id: "berkeley", name: "UC Berkeley" },
    { id: "yale", name: "Yale University" },
    { id: "princeton", name: "Princeton University" },
    { id: "columbia", name: "Columbia University" },
    { id: "cornell", name: "Cornell University" },
    { id: "uchicago", name: "University of Chicago" },
    { id: "upenn", name: "University of Pennsylvania" },
    { id: "other", name: "Other University" },
    { id: "standard", name: "Standard User (Not a Student)" }
  ];

  // Mock data for university stats
  const universityStats = {
    "harvard": 245,
    "mit": 189,
    "stanford": 210,
    "berkeley": 178,
    "yale": 156,
    "princeton": 132,
    "columbia": 167,
    "cornell": 143,
    "uchicago": 98,
    "upenn": 121,
    "other": 87,
    "standard": 342
  };

  // Check if the user is on desktop
  useEffect(() => {
    const checkDevice = () => {
      const isDesktopDevice = window.innerWidth >= 768; // md breakpoint in Tailwind
      setIsDesktop(isDesktopDevice);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Handle non-student selection
  useEffect(() => {
    if (!isStudent) {
      setSelectedUniversity("standard");
    }
  }, [isStudent]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToSignUp = () => {
    router.push('/verify-invite');
  };

  // Get the current step content with props
  const CurrentStepContent = () => {
    const StepContent = steps[currentStep - 1].content;
    return (
      <StepContent
        universities={universities}
        selectedUniversity={selectedUniversity}
        setSelectedUniversity={setSelectedUniversity}
        universityStats={universityStats}
        setIsStudent={setIsStudent}
        currentGPA={currentGPA}
        setCurrentGPA={setCurrentGPA}
        targetGPA={targetGPA}
        setTargetGPA={setTargetGPA}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-12 overflow-hidden relative">
      <DynamicPageTitle title="Get Started | UniShare" />

      {/* Gradient Wave Background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-background" />

        {/* First wave */}
        <motion.div
          className="absolute w-[200%] h-[50vh] bottom-0 left-0"
          initial={{ x: "-100%" }}
          animate={{
            x: ["0%", "-50%", "0%"]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
          >
            <path
              d="M0,0 C150,90 350,0 500,30 C650,60 700,120 850,90 C1000,60 1100,30 1200,60 L1200,120 L0,120 Z"
              className="fill-primary/10"
            />
          </svg>
        </motion.div>
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-md mb-8 px-4">
        <div className="flex justify-between items-center mb-2">
          {/* We'll show dots instead of numbers for better mobile experience */}
          <div className="flex gap-1.5 mx-auto">
            {steps.map((step) => (
              <motion.div
                key={step.id}
                className={`w-2.5 h-2.5 rounded-full ${
                  step.id === currentStep
                    ? 'bg-primary'
                    : step.id < currentStep
                      ? 'bg-primary/40'
                      : 'bg-muted'
                }`}
                initial={{ scale: step.id === currentStep ? 1.2 : 1 }}
                animate={{ scale: step.id === currentStep ? 1.2 : 1 }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        </div>
        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {steps.length}: <span className="text-foreground font-medium">{steps[currentStep - 1].title}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <CurrentStepContent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="w-full max-w-xs space-y-4 mt-8">
        {currentStep === steps.length ? (
          <Button
            className="w-full py-6 text-lg gap-2 group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            onClick={goToSignUp}
          >
            Get Started
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        ) : (
          <Button
            className="w-full py-6 text-lg gap-2 group"
            onClick={nextStep}
            disabled={(currentStep === 2 && !selectedUniversity) || (currentStep === 3 && isStudent && (!currentGPA || !targetGPA))}
          >
            Continue
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}

        {currentStep > 1 && (
          <Button
            variant="outline"
            className="w-full py-6 text-lg gap-2 group"
            onClick={prevStep}
          >
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
        )}

        {currentStep < steps.length && (
          <div className="text-center pt-2">
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={goToSignUp}
            >
              Skip Intro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
