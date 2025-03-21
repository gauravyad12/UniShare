"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy, RefreshCw, Share2, Users, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function InvitePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteUsage, setInviteUsage] = useState({ current: 0, max: 5 });
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Get user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single();

        setUserProfile(profileData);

        // Check if user already has an invite code
        const { data: inviteData } = await supabase
          .from("invite_codes")
          .select("*")
          .eq("created_by", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (inviteData && inviteData.length > 0) {
          setInviteCode(inviteData[0].code);
          setInviteUsage({
            current: inviteData[0].current_uses || 0,
            max: inviteData[0].max_uses || 5,
          });
          setInviteUrl(
            `${window.location.origin}/verify-invite?code=${inviteData[0].code}`,
          );
        }
      } catch (error) {
        console.error("Error fetching invite code:", error);
        toast({
          title: "Error",
          description: "Failed to load invite code",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInviteCode();
  }, [supabase, toast]);

  const generateInviteCode = async () => {
    try {
      setGenerating(true);

      // Generate a new invite code
      const newCode = uuidv4().substring(0, 8).toUpperCase();

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get user's university ID
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("university_id")
        .eq("id", userData.user.id)
        .single();

      if (!profileData?.university_id) {
        toast({
          title: "Error",
          description:
            "Your profile must have a university assigned to generate invite codes",
          variant: "destructive",
        });
        return;
      }

      // Create new invite code in database
      const { data: inviteData, error } = await supabase
        .from("invite_codes")
        .insert({
          code: newCode,
          created_by: userData.user.id,
          university_id: profileData.university_id,
          is_active: true,
          max_uses: 5,
          current_uses: 0,
          created_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 30 days from now
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setInviteCode(newCode);
      setInviteUsage({ current: 0, max: 5 });
      setInviteUrl(`${window.location.origin}/verify-invite?code=${newCode}`);

      toast({
        title: "Success",
        description: "New invite code generated successfully",
      });
    } catch (error) {
      console.error("Error generating invite code:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join UniShare",
          text: `Join me on UniShare with this invite code: ${inviteCode}`,
          url: inviteUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        copyToClipboard(inviteUrl);
      }
    } else {
      copyToClipboard(inviteUrl);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Invite Friends</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Invite Code
            </CardTitle>
            <CardDescription>
              Share this code with friends from your university to invite them
              to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteCode ? (
              <>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <div className="flex">
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      readOnly
                      className="rounded-r-none font-mono text-center text-lg tracking-wider"
                    />
                    <Button
                      onClick={() => copyToClipboard(inviteCode)}
                      className="rounded-l-none"
                      variant="secondary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="inviteLink">Invite Link</Label>
                  <div className="flex">
                    <Input
                      id="inviteLink"
                      value={inviteUrl}
                      readOnly
                      className="rounded-r-none text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(inviteUrl)}
                      className="rounded-l-none"
                      variant="secondary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Usage</span>
                    <span className="text-sm">
                      {inviteUsage.current} / {inviteUsage.max} uses
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{
                        width: `${(inviteUsage.current / inviteUsage.max) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This invite code expires in 30 days or after{" "}
                    {inviteUsage.max} uses
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="mb-4">You don't have an active invite code yet</p>
                <Button onClick={generateInviteCode} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Invite Code</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          {inviteCode && (
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={generateInviteCode}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate New Code
              </Button>
              <Button onClick={shareInvite}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Benefits</CardTitle>
            <CardDescription>
              Why you should invite your classmates to join UniShare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Build Your Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with more classmates to expand your academic network
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                    <path d="M12 7c1-.56 2.78-2 5-2 .97 0 1.94.27 2.76.79" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Exclusive Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Invite-only system ensures a trusted community of verified
                    students
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.95 1 4.8a.2.2 0 0 1-.2.2H2a.2.2 0 0 1-.2-.2C1.255 11.455 0 9.2 0 6a6 6 0 0 1 11.8-1.4A5.4 5.4 0 0 1 22 8.5c0 2.3-1.5 4.3-3.8 5l-2 .5" />
                    <path d="M13 19c1.1 0 2 .9 2 2v1h-4v-1a2 2 0 0 1 2-2z" />
                    <path d="M8 15v-2.5A2.5 2.5 0 0 1 10.5 10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Better Study Groups</h3>
                  <p className="text-sm text-muted-foreground">
                    More members means more diverse study groups and resources
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
