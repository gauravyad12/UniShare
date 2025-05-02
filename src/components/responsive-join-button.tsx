"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ResponsiveJoinButton() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we're on desktop or mobile
    const checkDevice = () => {
      const isDesktopDevice = window.innerWidth >= 768; // md breakpoint in Tailwind
      setIsDesktop(isDesktopDevice);
    };

    // Initial check
    checkDevice();

    // Add event listener for window resize
    window.addEventListener("resize", checkDevice);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Function to handle joining a group with an invitation code
  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      console.error("Please enter an invitation code");
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

      console.log(data.message || "You have successfully joined the study group");

      // Close the dialog
      setJoinDialogOpen(false);
      setInviteCode("");

      // Redirect to the study group page
      router.push(`/dashboard/study-groups?view=${data.studyGroupId}`);
    } catch (error) {
      console.error("Error joining study group:", error instanceof Error ? error.message : "Failed to join study group");
    } finally {
      setJoiningGroup(false);
    }
  };

  // For desktop: show dialog popup
  if (isDesktop) {
    return (
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex-1 sm:flex-auto">
            <LinkIcon className="mr-2 h-4 w-4" /> Join with Code
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Private Study Group</DialogTitle>
            <DialogDescription>
              Enter an invitation code to join a private study group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-4 items-center gap-4">
              <label htmlFor="inviteCode" className="sm:text-right">
                Invitation Code
              </label>
              <Input
                id="inviteCode"
                placeholder="Enter code"
                className="sm:col-span-3"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleJoinGroup} disabled={joiningGroup || !inviteCode.trim()}>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // For mobile: link to full page
  return (
    <Button variant="outline" asChild className="flex-1 sm:flex-auto">
      <Link href="/dashboard/study-groups/join">
        <LinkIcon className="mr-2 h-4 w-4" /> Join with Code
      </Link>
    </Button>
  );
}
