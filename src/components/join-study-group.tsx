"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users, ArrowRight } from "lucide-react";

interface JoinStudyGroupProps {
  code?: string;
}

export default function JoinStudyGroup({ code: initialCode }: JoinStudyGroupProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode || "");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) {
      console.error("Please enter an invitation code");
      return;
    }

    try {
      setLoading(true);

      if (!isAuthenticated) {
        // Redirect to sign in page with return URL
        router.push(`/sign-in?returnUrl=/join?code=${code}`);
        return;
      }

      const response = await fetch("/api/study-groups/invitations/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join study group");
      }

      console.log(data.message || "You have successfully joined the study group");

      // Redirect to the study group page
      router.push(`/dashboard/study-groups?view=${data.studyGroupId}`);
    } catch (error) {
      console.error("Error joining study group:", error instanceof Error ? error.message : "Failed to join study group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join Study Group</CardTitle>
        <CardDescription>
          Enter an invitation code to join a private study group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="code">Invitation Code</Label>
            <Input
              id="code"
              placeholder="Enter invitation code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/study-groups")}>
          Cancel
        </Button>
        <Button onClick={handleJoin} disabled={loading || !code.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Join Group
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
