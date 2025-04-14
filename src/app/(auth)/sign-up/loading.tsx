"use client";

import { GraduationCap, Loader2 } from "lucide-react";
import Navbar from "@/components/navbar";

export default function SignUpLoading() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2 text-center">
            <GraduationCap className="h-12 w-12 text-primary mx-auto mb-2" />
            <h1 className="text-3xl font-semibold tracking-tight">Join UniShare</h1>
          </div>
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-center text-muted-foreground">
              Validating invite code...
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
