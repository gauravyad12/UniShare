"use client";

import { Loader2 } from "lucide-react";
import MobileAwareNavbar from "@/components/mobile-aware-navbar";
import GradientWaveBackground from "@/components/gradient-wave-background";
import AnimatedLogo from "@/components/animated-logo";

export default function SignUpLoading() {
  return (
    <>
      <MobileAwareNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
        <GradientWaveBackground />

        <div className="w-full max-w-md rounded-2xl border-0 bg-card/95 backdrop-blur-sm p-7 shadow-lg relative z-10 overflow-hidden">
          {/* Subtle gradient overlay for card */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-70 pointer-events-none"></div>

          <div className="relative">
            <div className="space-y-3 text-center">
              <AnimatedLogo />
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">Join UniShare</h1>
            </div>
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-center text-muted-foreground">
                Validating invite code...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
