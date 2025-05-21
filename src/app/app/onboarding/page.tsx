"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, ArrowRight, Sparkles } from "lucide-react";
import DynamicPageTitle from "@/components/dynamic-page-title";

// Import the standalone pages
import UniversityStep from "./steps/university-step";
import GPAStep from "./steps/gpa-step";
import ResourcesStep from "./steps/resources-step";
import StudyGroupsStep from "./steps/study-groups-step";
import ScholarPlusStep from "./steps/scholar-plus-step";
import GetStartedStep from "./steps/get-started-step";

// Define the onboarding steps
const steps = [
  {
    id: 1,
    title: "Your University",
    description: "Connect with your academic community",
    component: UniversityStep,
  },
  {
    id: 2,
    title: "Your Goals",
    description: "Set your academic targets",
    component: GPAStep,
  },
  {
    id: 3,
    title: "Share & Access Resources",
    description: "Notes, textbooks, study guides, and more",
    component: ResourcesStep,
  },
  {
    id: 4,
    title: "Join Study Groups",
    description: "Collaborate with classmates",
    component: StudyGroupsStep,
  },
  {
    id: 5,
    title: "Scholar+ Features",
    description: "Premium tools for academic excellence",
    component: ScholarPlusStep,
    hasCustomButtons: true,
  },
  {
    id: 6,
    title: "Get Started",
    description: "Ready to begin your academic journey?",
    component: GetStartedStep,
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [currentGPA, setCurrentGPA] = useState("3.0");
  const [targetGPA, setTargetGPA] = useState("3.5");
  const [gpaError, setGpaError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const router = useRouter();

  // Function to determine if the continue button should be disabled
  useEffect(() => {
    if (currentStep === 1 && !selectedUniversity) {
      setIsButtonDisabled(true);
    } else if (currentStep === 2 && isStudent && (!currentGPA || !targetGPA || gpaError)) {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, [currentStep, selectedUniversity, isStudent, currentGPA, targetGPA, gpaError]);

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

  // Get the current step component
  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-12 overflow-hidden relative">
      <DynamicPageTitle title="Onboarding | UniShare App" />

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

        {/* Second wave */}
        <motion.div
          className="absolute w-[200%] h-[40vh] bottom-0 left-0"
          initial={{ x: "-50%" }}
          animate={{
            x: ["0%", "-50%", "0%"]
          }}
          transition={{
            duration: 15,
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
              d="M0,30 C150,10 350,50 500,20 C650,0 700,60 850,40 C1000,20 1100,60 1200,30 L1200,120 L0,120 Z"
              className="fill-primary/5"
            />
          </svg>
        </motion.div>

        {/* Third wave */}
        <motion.div
          className="absolute w-[200%] h-[30vh] bottom-0 left-0"
          initial={{ x: "0%" }}
          animate={{
            x: ["-50%", "0%", "-50%"]
          }}
          transition={{
            duration: 18,
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
              d="M0,60 C150,30 350,90 500,60 C650,30 700,90 850,60 C1000,30 1100,90 1200,60 L1200,120 L0,120 Z"
              className="fill-primary/8"
            />
          </svg>
        </motion.div>
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-md mb-8 px-4">
        <div className="flex flex-col items-center gap-3">
          {/* Dots for progress */}
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

          <div className="text-center">
            <span className="text-xs text-muted-foreground">
              Step {currentStep} of {steps.length}: <span className="text-foreground font-medium">{steps[currentStep - 1].title}</span>
            </span>
          </div>
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
            <CurrentStepComponent
              selectedUniversity={selectedUniversity}
              setSelectedUniversity={setSelectedUniversity}
              isStudent={isStudent}
              setIsStudent={setIsStudent}
              currentGPA={currentGPA}
              setCurrentGPA={setCurrentGPA}
              targetGPA={targetGPA}
              setTargetGPA={setTargetGPA}
              gpaError={gpaError}
              setGpaError={setGpaError}
              nextStep={nextStep}
              prevStep={prevStep}
              goToSignUp={goToSignUp}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="w-full max-w-xs space-y-4 mt-8">
        {/* Custom buttons for Scholar+ page */}
        {currentStep === 5 && steps[currentStep - 1].hasCustomButtons ? (
          <div className="w-full max-w-xs space-y-4">
            <Button
              className="w-full py-6 text-lg gap-2 group bg-amber-500 hover:bg-amber-600 text-white"
              asChild
            >
              <Link href="/pricing">
                Upgrade Now
                <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full py-6 text-lg gap-2 group border-amber-200 dark:border-amber-800/30"
              onClick={nextStep}
            >
              Continue Free
            </Button>
          </div>
        ) : currentStep === steps.length ? (
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
            disabled={isButtonDisabled}
          >
            Continue
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}

        {/* Back button - don't show on Scholar+ page since it has its own buttons */}
        {currentStep > 1 && currentStep !== 5 && (
          <Button
            variant="outline"
            className="w-full py-6 text-lg gap-2 group"
            onClick={prevStep}
          >
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
        )}

        {/* Skip intro button - don't show on Scholar+ page */}
        {currentStep < steps.length && currentStep !== 5 && (
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
