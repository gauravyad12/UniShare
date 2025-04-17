import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MoreHorizontal, UserPlus, UserMinus, Shield, Trash2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

interface StudyGroupManagementProps {
  groupId: string;
  isAdmin: boolean;
  isCreator: boolean;
  members: Member[];
  group: any;
  onMembersUpdated?: () => void;
}

export default function StudyGroupManagement({
  groupId,
  isAdmin,
  isCreator,
  members,
  group,
  onMembersUpdated,
}: StudyGroupManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);
      const supabase = createClient();

      const response = await fetch(`/api/study-groups/${groupId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete study group");
      }

      toast({
        title: "Success",
        description: "Study group has been deleted",
      });

      // Redirect to the study groups page
      router.push("/dashboard/study-groups");
      router.refresh();
    } catch (error) {
      console.error("Error deleting study group:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete study group",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePromoteMember = async (userId: string) => {
    try {
      setIsUpdatingMember(true);
      setActionUserId(userId);

      const response = await fetch(`/api/study-groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to promote member");
      }

      toast({
        title: "Success",
        description: "Member has been promoted to admin",
      });

      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error("Error promoting member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote member",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMember(false);
      setActionUserId(null);
    }
  };

  const handleDemoteMember = async (userId: string) => {
    try {
      setIsUpdatingMember(true);
      setActionUserId(userId);

      const response = await fetch(`/api/study-groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "member" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to demote admin");
      }

      toast({
        title: "Success",
        description: "Admin has been demoted to member",
      });

      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to demote admin",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMember(false);
      setActionUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setIsUpdatingMember(true);
      setActionUserId(userId);

      const response = await fetch(`/api/study-groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      toast({
        title: "Success",
        description: "Member has been removed from the group",
      });

      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMember(false);
      setActionUserId(null);
    }
  };

  // Only show the management options if the user is an admin or creator
  if (!isAdmin && !isCreator) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Group Management</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsMembersDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Manage Members</span>
          </DropdownMenuItem>
          {isCreator && (
            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Group</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the study group
              and all of its data, including messages, resources, and member information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Management Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Promote members to admins, demote admins to members, or remove members from the group.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4">
            {members.map((member) => (
              <div key={member.user_id} className="mb-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {(member.full_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">@{member.username || 'user'}</p>
                    </div>
                    {member.role === "admin" && (
                      <Badge variant="outline" className="ml-2">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    {isCreator && member.role !== "admin" && member.user_id !== actionUserId && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePromoteMember(member.user_id)}
                        disabled={isUpdatingMember}
                        title="Promote to Admin"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    )}
                    {isCreator && member.role === "admin" && member.user_id !== actionUserId &&
                     member.user_id !== group.created_by && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDemoteMember(member.user_id)}
                        disabled={isUpdatingMember}
                        title="Demote to Member"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {((isCreator && member.user_id !== actionUserId && member.user_id !== group.created_by) ||
                      (isAdmin && member.role !== "admin" && member.user_id !== actionUserId)) && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={isUpdatingMember}
                        className="text-destructive hover:text-destructive"
                        title="Remove from Group"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                    {member.user_id === actionUserId && (
                      <Button variant="outline" size="sm" disabled>
                        Processing...
                      </Button>
                    )}
                  </div>
                </div>
                {/* Only add separator if not the last item */}
                {members.indexOf(member) < members.length - 1 && (
                  <Separator className="mt-2" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
