"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Users, Lock, Unlock, MessageSquare } from "lucide-react";
import Link from "next/link";

interface StudyGroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    course_code?: string;
    is_private: boolean;
    max_members: number;
    created_at: string;
    member_count?: number;
    message_count?: number;
    last_message_at?: string;
    _count?: {
      members: number;
      meetings: number;
    };
  };
  isMember?: boolean;
  onJoin?: (id: string) => void;
  onView?: (id: string) => void;
  isPublicView?: boolean;
}

export default function StudyGroupCard({
  group,
  isMember = false,
  onJoin,
  onView,
  isPublicView = false,
}: StudyGroupCardProps) {
  // Log the group data for debugging
  useEffect(() => {
    console.log('Study group card rendered:', {
      id: group.id,
      name: group.name,
      is_private: group.is_private,
      isMember
    });
  }, [group, isMember]);
  // Format date
  const formattedDate = new Date(group.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Member count with default
  const memberCount = group.member_count || 0;
  const meetingCount = group._count?.meetings || 0;
  const messageCount = group.message_count || 0;

  // Log the member count for debugging
  useEffect(() => {
    console.log('Member count for group', group.id, ':', memberCount);
  }, [group.id, memberCount]);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-[280px]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            {group.course_code && (
              <Badge variant="outline">{group.course_code}</Badge>
            )}
          </div>
          <Badge variant={group.is_private ? "secondary" : "outline"}>
            {group.is_private ? (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Private
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3 mr-1" />
                Open
              </>
            )}
          </Badge>
        </div>
        <CardTitle className="mt-2 text-xl">{group.name}</CardTitle>
        <CardDescription className="text-sm">
          Created {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-600 line-clamp-2">{group.description}</p>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {memberCount} / {group.max_members || "∞"} members
            </span>
          </div>

          {messageCount > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{messageCount}</span>
            </div>
          )}

          {meetingCount > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{meetingCount} upcoming</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end items-center py-3 border-t gap-2 mt-auto">
        {isPublicView ? (
          // Public view (signed-out) - redirect to sign-in
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              asChild
            >
              <Link href={`/sign-in?redirect=/dashboard/study-groups?view=${group.id}`}>
                View Details
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-8"
              asChild
            >
              <Link href={`/sign-in?redirect=/dashboard/study-groups?view=${group.id}`}>
                Join Group
              </Link>
            </Button>
          </>
        ) : isMember ? (
          // Signed-in member view
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              asChild
            >
              <Link href={`/dashboard/study-groups?view=${group.id}`}>
                View Details
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-8"
              asChild
            >
              <Link href={`/dashboard/study-groups?view=${group.id}&chat=true`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Link>
            </Button>
          </>
        ) : (
          // Signed-in non-member view
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              asChild
            >
              <Link href={`/dashboard/study-groups?view=${group.id}`}>
                View Details
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={() => onJoin && onJoin(group.id)}
            >
              Join Group
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
