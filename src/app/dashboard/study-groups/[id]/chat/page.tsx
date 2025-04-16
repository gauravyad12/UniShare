import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import RealtimeGroupChatWrapper from "@/components/realtime-group-chat-wrapper";
import { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "UniShare | Study Group Chat",
  description: "Chat with your study group members",
};

export default async function StudyGroupChatPage({ params }: PageProps) {
  const supabase = await createClient();
  const groupId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if the study group exists
  const { data: studyGroup, error: groupError } = await supabase
    .from("study_groups")
    .select("*, universities(name)")
    .eq("id", groupId)
    .single();

  if (groupError || !studyGroup) {
    return notFound();
  }

  // Check if the user is a member of the study group
  const { data: membership, error: membershipError } = await supabase
    .from("study_group_members")
    .select("role")
    .eq("study_group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    // User is not a member of this study group
    console.log('User is not a member of this study group, redirecting to group page');
    return redirect(`/dashboard/study-groups/${groupId}?error=You must be a member to access the chat`);
  }

  const isAdmin = membership.role === "admin";

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/study-groups/${groupId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{studyGroup.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/study-groups/${groupId}/members`}>
              <Users className="mr-2 h-4 w-4" />
              Members
            </Link>
          </Button>
        </div>
      </header>

      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Group Chat</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)]">
          <RealtimeGroupChatWrapper
            groupId={groupId}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
