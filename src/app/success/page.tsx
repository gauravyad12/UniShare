export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "UniShare | Registration Successful",
  description: "Your registration has been completed successfully",
};

export default function SuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Registration Successful!
            </CardTitle>
            <CardDescription>
              Thank you for signing up. Please check your email for a
              verification link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground">
              Once verified, you'll have full access to all platform features.
            </p>
            <div className="flex gap-4 w-full">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
