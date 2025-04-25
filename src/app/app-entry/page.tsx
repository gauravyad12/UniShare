"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Sparkles, BookOpen, Users, CheckCircle2, Clock, Shield } from "lucide-react";

export default function AppEntryPage() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Check if the user is on desktop and redirect if needed
  useEffect(() => {
    const checkDevice = () => {
      const isDesktopDevice = window.innerWidth >= 768; // md breakpoint in Tailwind
      setIsDesktop(isDesktopDevice);

      if (isDesktopDevice) {
        router.push('/');
      }
    };

    // Check if the app is already installed
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsInstalled(isInStandaloneMode());

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    });

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [router]);

  // Handle app installation
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  // If we're on desktop, don't render anything (we'll redirect)
  if (isDesktop) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-12 overflow-hidden relative">
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

      {/* Header */}
      <motion.div
        className="flex flex-col items-center text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative mb-4">
          {/* Outer glow effect - smaller size */}
          <motion.div
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 blur-md z-0"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Middle glow layer - smaller size */}
          <motion.div
            className="absolute -inset-3 rounded-full bg-gradient-to-r from-primary/30 to-primary/20 blur-sm z-0"
            animate={{
              scale: [1.1, 0.95, 1.1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />

          {/* Inner glow - closest to logo - smaller size */}
          <motion.div
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/25 via-primary/40 to-primary/25 blur-[2px] z-0"
            animate={{
              scale: [0.95, 1.05, 0.95],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />

          {/* Logo image with very subtle floating animation - smaller size */}
          <motion.div
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10"
          >
            <Image
              src="/android-chrome-512x512.png"
              alt="UniShare Logo"
              width={90}
              height={90}
              className="drop-shadow-md"
            />
          </motion.div>
        </div>
        <motion.h1
          className="text-3xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          UniShare
        </motion.h1>

        <motion.div
          className="bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-xs font-medium text-primary">
            Study smarter, not harder
          </p>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground mb-3 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Your academic resource sharing platform for university students
        </motion.p>

        <motion.p
          className="text-xs text-muted-foreground/80 mb-3 max-w-[250px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Join thousands of students boosting their grades through collaborative learning
        </motion.p>

        {/* Quick benefits */}
        <motion.div
          className="flex justify-center gap-4 mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="flex items-center">
            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs">Verified</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 text-blue-500 mr-1" />
            <span className="text-xs">2 min setup</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-3 w-3 text-purple-500 mr-1" />
            <span className="text-xs">Private</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Features */}
      <motion.div
        className="w-full max-w-xs space-y-4 my-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <div className="text-center mb-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            How UniShare helps you succeed
          </span>
        </div>

        <motion.div
          className="flex items-start gap-4 p-3 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/10 shadow-sm"
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-2 rounded-full">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-sm flex items-center">
              <span>Find Quality Resources</span>
              <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                Save time
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Never hunt for study materials again. Get verified resources from peers.</p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-start gap-4 p-3 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/10 shadow-sm"
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-2 rounded-full">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-medium text-sm flex items-center">
              <span>Collaborate Effectively</span>
              <span className="ml-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                Connect
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">End isolation with study groups that actually help you learn and stay motivated.</p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-start gap-4 p-3 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/10 shadow-sm"
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-sm flex items-center">
              <span>Improve Your Grades</span>
              <span className="ml-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                Results
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Track your progress and see real improvement in your academic performance.</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="w-full max-w-xs space-y-4 mt-auto z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        {!isInstalled && deferredPrompt && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="w-full py-6 text-lg gap-2 group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              onClick={handleInstallClick}
            >
              <Download className="h-5 w-5 group-hover:animate-bounce" />
              Install App
            </Button>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href="/verify-invite" className="w-full block">
            <Button
              variant={isInstalled || !deferredPrompt ? "default" : "outline"}
              className={`w-full py-6 text-lg gap-2 group ${isInstalled || !deferredPrompt ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary' : ''}`}
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <div className="text-center pt-2">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Already have an account? Sign in
          </Link>
        </div>
      </motion.div>

      {/* Social Proof */}
      <motion.div
        className="w-full max-w-xs flex flex-col items-center z-10 mt-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="flex items-center justify-center mb-2">
          <div className="flex -space-x-2">
            {/* Simulated user avatars */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 border border-background"></div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 border border-background"></div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 border border-background"></div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 border border-background"></div>
            <div className="w-6 h-6 rounded-full bg-background border border-background flex items-center justify-center text-xs">
              <span>+</span>
            </div>
          </div>
          <div className="ml-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">1,200+</span> students joined this month
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-muted-foreground ml-1">4.8/5 from 300+ reviews</span>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="w-full text-center mt-2 text-xs text-muted-foreground z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        <p className="backdrop-blur-sm bg-background/30 py-2 rounded-full inline-block px-4">
          © {new Date().getFullYear()} UniShare
        </p>
      </motion.div>
    </div>
  );
}
