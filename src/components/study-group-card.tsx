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
import { Calendar, Users, Lock, Unlock } from "lucide-react";

interface StudyGroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    course_code?: string;
    is_private: boolean;
    max_members: number;
    created_at: string;
    _count?: {
      members: number;
      meetings: number;
    };
  };
  onJoin?: (id: string) => void;
  onView?: (id: string) => void;
}

export default function StudyGroupCard({
  group,
  onJoin,
  onView,
}: StudyGroupCardProps) {
  // Format date
  const formattedDate = new Date(group.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Member count with default
  const memberCount = group._count?.members || 0;
  const meetingCount = group._count?.meetings || 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
      <CardContent>
        <p className="text-gray-600 line-clamp-2">{group.description}</p>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {memberCount} / {group.max_members} members
            </span>
          </div>

          {meetingCount > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{meetingCount} upcoming</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2 border-t gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView && onView(group.id)}
        >
          View Details
        </Button>
        <Button size="sm" onClick={() => onJoin && onJoin(group.id)}>
          Join Group
        </Button>
      </CardFooter>
    </Card>
  );
}
