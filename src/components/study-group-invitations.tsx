"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Link as LinkIcon, Clock, Users, RefreshCw, Trash } from "lucide-react";
import CopyButton from "@/components/copy-button";
import { formatDistanceToNow } from "date-fns";

interface StudyGroupInvitationsProps {
  groupId: string;
  isAdmin: boolean;
}

interface Invitation {
  id: string;
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  created_by_name: string;
}

export default function StudyGroupInvitations({
  groupId,
  isAdmin,
}: StudyGroupInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiresIn, setExpiresIn] = useState("24");
  const [maxUses, setMaxUses] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/study-groups/invitations?studyGroupId=${groupId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [groupId]);

  const handleCreateInvitation = async () => {
    try {
      // Validate max uses input
      if (maxUses && (isNaN(parseInt(maxUses)) || parseInt(maxUses) < 1)) {
        console.error("Invalid Input: Max uses must be a positive number");
        return;
      }

      setCreating(true);

      const response = await fetch("/api/study-groups/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyGroupId: groupId,
          expiresInHours: expiresIn ? parseInt(expiresIn) : null,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invitation");
      }

      const data = await response.json();
      setInvitations([data.invitation, ...invitations]);

      // Reset form
      setExpiresIn("24");
      setMaxUses("");
    } catch (error) {
      console.error("Error creating invitation:", error instanceof Error ? error.message : "Failed to create invitation");
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvitations();
    setRefreshing(false);
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  const getExpiryText = (expiresAt: string | null) => {
    if (!expiresAt) return "Never expires";

    const expiry = new Date(expiresAt);
    const now = new Date();

    if (expiry < now) {
      return "Expired";
    }

    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`;
  };

  const getUsesText = (maxUses: number | null, currentUses: number) => {
    if (maxUses === null) return `${currentUses} uses`;
    return `${currentUses} / ${maxUses} uses`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Invitations</h3>
        <div className="flex flex-wrap gap-2 self-end xs:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>

          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Create Invitation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invitation Link</DialogTitle>
                  <DialogDescription>
                    Create a link to invite people to join this study group.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="expires" className="sm:text-right">
                      Expires in
                    </Label>
                    <div className="sm:col-span-3">
                      <Select
                        value={expiresIn}
                        onValueChange={setExpiresIn}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expiration time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">2 days</SelectItem>
                          <SelectItem value="168">7 days</SelectItem>
                          <SelectItem value="720">30 days</SelectItem>
                          <SelectItem value="0">Never expires</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="maxUses" className="sm:text-right">
                      Max uses
                    </Label>
                    <div className="sm:col-span-3">
                      <Input
                        id="maxUses"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={maxUses}
                        onChange={(e) => {
                          // Only allow numeric input
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setMaxUses(value);
                          }
                        }}
                        onKeyPress={(e) => {
                          // Prevent non-numeric characters from being entered
                          if (!/\d/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button
                    onClick={handleCreateInvitation}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>Create Invitation</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : invitations.length > 0 ? (
        <>
          {/* Desktop view */}
          <div className="border rounded-md hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitation Code</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        {getExpiryText(invitation.expires_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {getUsesText(invitation.max_uses, invitation.current_uses)}
                      </div>
                    </TableCell>
                    <TableCell>{invitation.created_by_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <CopyButton
                          text={invitation.code}
                          variant="ghost"
                          size="sm"
                          title="Copy code"
                        />
                        <CopyButton
                          text={`${window.location.origin}/join?code=${invitation.code}`}
                          variant="ghost"
                          size="sm"
                          title="Copy link"
                          iconOnly={true}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </CopyButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="space-y-4 sm:hidden">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium mb-1">{invitation.code}</div>
                    <div className="text-sm text-muted-foreground">
                      Created by {invitation.created_by_name}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <CopyButton
                      text={invitation.code}
                      variant="ghost"
                      size="sm"
                      title="Copy code"
                      className="h-8 w-8 p-0"
                    />
                    <CopyButton
                      text={`${window.location.origin}/join?code=${invitation.code}`}
                      variant="ghost"
                      size="sm"
                      title="Copy link"
                      className="h-8 w-8 p-0"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </CopyButton>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    {getExpiryText(invitation.expires_at)}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                    {getUsesText(invitation.max_uses, invitation.current_uses)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Card className="bg-muted/40">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
            <LinkIcon className="h-8 w-8 text-muted-foreground" />
            <CardTitle>No Invitations</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Create an invitation link to invite people to this group."
                : "No invitation links have been created for this group yet."}
            </CardDescription>
            {isAdmin && (
              <Button
                className="mt-2"
                onClick={() => setOpen(true)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Create Invitation
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
