"use client";

export const dynamic = "force-dynamic";

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
import {
  Copy,
  RefreshCw,
  Share2,
  Users,
  Loader2,
  Mail,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function InvitePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteUsage, setInviteUsage] = useState({ current: 0, max: 5 });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    successfulInvites: 0,
    requiredInvites: 5,
    hasReachedMaxInvites: false,
    totalInviteUses: 0
  });
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [inviteCodesCount, setInviteCodesCount] = useState(0);
  const [maxInviteCodesReached, setMaxInviteCodesReached] = useState(false);
  const MAX_INVITE_CODES = 3;

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

        // Get all invite codes created by the user to count them
        const { data: allInviteCodes, error: countError } = await supabase
          .from("invite_codes")
          .select("id")
          .eq("created_by", userData.user.id);

        if (countError) {
          console.error("Error counting invite codes:", countError);
        } else {
          const count = allInviteCodes?.length || 0;
          setInviteCodesCount(count);
          setMaxInviteCodesReached(count >= MAX_INVITE_CODES);
        }

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

        // Fetch sent invitations
        await fetchSentInvitations();
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

  const fetchSentInvitations = async () => {
    try {
      const response = await fetch("/api/invite/list");
      const data = await response.json();

      if (data.success) {
        setSentInvitations(data.invitations || []);
        setVerificationStatus(
          data.verificationStatus || {
            isVerified: false,
            successfulInvites: 0,
            requiredInvites: 5,
          },
        );

        // Check if user should be verified
        if (data.verificationStatus?.successfulInvites >= data.verificationStatus?.requiredInvites &&
            !data.verificationStatus?.isVerified) {
          // Call the verify API to update verification status
          verifyProfile();
        }
      } else {
        console.error("Error fetching invitations:", data.error);
      }
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    }
  };

  const verifyProfile = async () => {
    try {
      const response = await fetch("/api/profile/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.verified) {
        // Update local state
        setVerificationStatus(prev => ({
          ...prev,
          isVerified: true
        }));

        toast({
          title: "Congratulations!",
          description: "Your profile has been verified!",
        });
      }
    } catch (error) {
      console.error("Error verifying profile:", error);
    }
  };

  const generateInviteCode = async () => {
    // Check if the user has already reached the maximum number of invite codes
    if (maxInviteCodesReached) {
      toast({
        title: "Limit Reached",
        description: `You have reached the maximum limit of ${MAX_INVITE_CODES} invite codes.`,
        variant: "destructive",
      });
      return;
    }

    // Check if the user has already reached the maximum number of successful invites
    if (verificationStatus.hasReachedMaxInvites) {
      toast({
        title: "Limit Reached",
        description: `You have already reached the maximum limit of 5 successful invites.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      // Use the API endpoint to generate a new invite code
      const response = await fetch("/api/invite/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is the max invite codes error
        if (data.maxReached) {
          setMaxInviteCodesReached(true);
          setInviteCodesCount(MAX_INVITE_CODES);
        }
        throw new Error(data.error || "Failed to generate invite code");
      }

      const newCode = data.inviteCode.code;
      setInviteCode(newCode);
      setInviteUsage({ current: 0, max: 5 });
      setInviteUrl(`${window.location.origin}/verify-invite?code=${newCode}`);

      // Increment the invite codes count
      setInviteCodesCount(prevCount => {
        const newCount = prevCount + 1;
        if (newCount >= MAX_INVITE_CODES) {
          setMaxInviteCodesReached(true);
        }
        return newCount;
      });

      toast({
        title: "Success",
        description: "New invite code generated successfully",
      });
    } catch (error) {
      console.error("Error generating invite code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const sendInviteEmail = async () => {
    if (!emailInput || !inviteCode) return;

    try {
      setSending(true);

      const response = await fetch("/api/invite/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode,
          email: emailInput,
          senderName: userProfile?.full_name || "A fellow student",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation email");
      }

      toast({
        title: "Success",
        description: "Invitation email sent successfully",
      });

      // Clear email input and close dialog
      setEmailInput("");
      setIsEmailDialogOpen(false);

      // Refresh sent invitations list
      await fetchSentInvitations();
    } catch (error) {
      console.error("Error sending invitation email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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
        // Handle AbortError (user cancelled) and NotAllowedError (permission denied)
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fall back to clipboard copy only for non-abort errors
          copyToClipboard(inviteUrl);
        }
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

      {/* Verification Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Verification Progress
          </CardTitle>
          <CardDescription>
            Invite 5 friends who sign up to get verified status on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Progress to Verification
              </span>
              <span className="text-sm font-medium">
                {verificationStatus.successfulInvites} /{" "}
                {verificationStatus.requiredInvites} successful invites
              </span>
            </div>
            <Progress
              value={
                (verificationStatus.successfulInvites /
                  verificationStatus.requiredInvites) *
                100
              }
              className="h-2"
            />
            <div className="flex items-center gap-2 text-sm">
              {verificationStatus.isVerified ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Your profile is verified!</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  {verificationStatus.successfulInvites >=
                  verificationStatus.requiredInvites ? (
                    <div className="flex flex-col gap-2">
                      <span>
                        You've reached the required invites! Your profile will be
                        verified soon.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={verifyProfile}
                        className="self-start"
                      >
                        Verify Now
                      </Button>
                    </div>
                  ) : (
                    <span>
                      Invite{" "}
                      {verificationStatus.requiredInvites -
                        verificationStatus.successfulInvites}{" "}
                      more friends to get verified.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Invite Code
              </CardTitle>
              <CardDescription>
                Share this code with friends from your university to invite them
                to join. You can create up to {MAX_INVITE_CODES} invite codes.
              </CardDescription>
              <div className="text-xs text-muted-foreground mt-1">
                You have created {inviteCodesCount} of {MAX_INVITE_CODES} possible invite codes
              </div>
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
                  <p className="mb-4">
                    You don't have an active invite code yet
                  </p>
                  <Button
                    onClick={generateInviteCode}
                    disabled={generating || maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                    title={maxInviteCodesReached
                      ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                      : verificationStatus.hasReachedMaxInvites
                      ? "You have already reached the maximum limit of 5 successful invites"
                      : ""}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>Generate Invite Code</>
                    )}
                  </Button>
                  {(maxInviteCodesReached || verificationStatus.hasReachedMaxInvites) && (
                    <p className="text-xs text-destructive mt-2">
                      {maxInviteCodesReached
                        ? `You have reached the maximum limit of ${MAX_INVITE_CODES} invite codes.`
                        : verificationStatus.hasReachedMaxInvites
                        ? "You have already reached the maximum limit of 5 successful invites."
                        : ""}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            {inviteCode && (
              <CardFooter className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={generateInviteCode}
                  disabled={generating || maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                  className="flex-1"
                  title={maxInviteCodesReached
                    ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                    : verificationStatus.hasReachedMaxInvites
                    ? "You have already reached the maximum limit of 5 successful invites"
                    : ""}
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  New Code
                </Button>
                <Button
                  onClick={() => setIsEmailDialogOpen(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                  title={maxInviteCodesReached
                    ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                    : verificationStatus.hasReachedMaxInvites
                    ? "You have already reached the maximum limit of 5 successful invites"
                    : ""}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Invite
                </Button>
                <Button
                  onClick={shareInvite}
                  className="flex-1"
                  disabled={maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                  title={maxInviteCodesReached
                    ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                    : verificationStatus.hasReachedMaxInvites
                    ? "You have already reached the maximum limit of 5 successful invites"
                    : ""}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Email Invitation Dialog */}
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Invitation Email</DialogTitle>
                <DialogDescription>
                  Send an invitation email to a friend with your invite code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Friend's Email</Label>
                  <Input
                    id="email"
                    placeholder="friend@university.edu"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p>
                    We'll send an email with your invite code and a link to sign
                    up.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendInviteEmail}
                  disabled={sending || !emailInput || maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                  title={maxInviteCodesReached
                    ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                    : verificationStatus.hasReachedMaxInvites
                    ? "You have already reached the maximum limit of 5 successful invites"
                    : sending || !emailInput
                    ? "Please enter a valid email"
                    : ""}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>Send Invitation</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                      Connect with more classmates to expand your academic
                      network
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <GraduationCap className="h-5 w-5 text-primary" />
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
                    <Sparkles className="h-5 w-5 text-primary" />
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

        {/* Sent Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sent Invitations
            </CardTitle>
            <CardDescription>
              Track the status of invitations you've sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="all">All Invitations</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {sentInvitations.length > 0 ? (
                  <div className="space-y-4">
                    {sentInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {invitation.sent_to_email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Sent{" "}
                              {new Date(
                                invitation.sent_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            {invitation.status === "used" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Signed Up
                              </span>
                            ) : invitation.status === "failed" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <p>
                            Invite code:{" "}
                            <span className="font-mono">
                              {invitation.invite_codes?.code}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>You haven't sent any invitations yet</p>
                    {inviteCode && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsEmailDialogOpen(true)}
                        disabled={maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                        title={maxInviteCodesReached
                          ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                          : verificationStatus.hasReachedMaxInvites
                          ? "You have already reached the maximum limit of 5 successful invites"
                          : ""}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Your First Invitation
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {sentInvitations.filter((inv) => inv.status === "sent").length >
                0 ? (
                  <div className="space-y-4">
                    {sentInvitations
                      .filter((inv) => inv.status === "sent")
                      .map((invitation) => (
                        <div
                          key={invitation.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {invitation.sent_to_email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Sent{" "}
                                {new Date(
                                  invitation.sent_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <p>
                              Invite code:{" "}
                              <span className="font-mono">
                                {invitation.invite_codes?.code}
                              </span>
                            </p>
                          </div>
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setEmailInput(invitation.sent_to_email);
                                setIsEmailDialogOpen(true);
                              }}
                              disabled={maxInviteCodesReached || verificationStatus.hasReachedMaxInvites}
                              title={maxInviteCodesReached
                                ? "Maximum limit of " + MAX_INVITE_CODES + " invite codes reached"
                                : verificationStatus.hasReachedMaxInvites
                                ? "You have already reached the maximum limit of 5 successful invites"
                                : ""}
                            >
                              <Mail className="mr-1 h-3 w-3" />
                              Resend
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pending invitations</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
