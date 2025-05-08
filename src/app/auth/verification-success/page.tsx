import { Suspense } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import VerificationSuccessClient from "@/components/verification-success-client";

// Fallback component while the main content is loading
function VerificationSuccessLoading() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
          <CardDescription>
            Your email has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Thank you for verifying your email address. You can now access all features of UniShare.
          </p>
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button disabled>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function VerificationSuccessPage() {
  return (
    <Suspense fallback={<VerificationSuccessLoading />}>
      <VerificationSuccessClient />
    </Suspense>
  );
}
