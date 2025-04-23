"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function JoinStudyGroupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invitation code",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoiningGroup(true);

      const response = await fetch("/api/study-groups/invitations/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join study group");
      }

      toast({
        title: "Success!",
        description: data.message || "You have successfully joined the study group",
      });

      // Redirect to the study group page
      router.push(`/dashboard/study-groups?view=${data.studyGroupId}`);
    } catch (error) {
      console.error("Error joining study group:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join study group",
        variant: "destructive",
      });
    } finally {
      setJoiningGroup(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard/study-groups">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Study Groups
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Join Private Study Group</CardTitle>
          <CardDescription>
            Enter an invitation code to join a private study group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="inviteCode">Invitation Code</label>
              <Input
                id="inviteCode"
                placeholder="Enter code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleJoinGroup} 
            disabled={joiningGroup || !inviteCode.trim()}
            className="w-full"
          >
            {joiningGroup ? (
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
    </div>
  );
}
