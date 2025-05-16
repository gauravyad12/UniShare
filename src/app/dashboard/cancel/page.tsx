"use client";

import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Subscription Cancelled</h1>
          
          <p className="text-muted-foreground mb-8">
            Your subscription process was cancelled. No charges have been made to your account.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button asChild size="lg">
              <Link href="/pricing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Pricing
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
