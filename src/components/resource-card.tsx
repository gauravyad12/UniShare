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
import { Download, Eye, Star, ThumbsUp } from "lucide-react";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    resource_type: string;
    course_code?: string;
    professor?: string;
    view_count: number;
    download_count: number;
    created_at: string;
    tags?: { tag_name: string }[];
    ratings?: { rating: number }[];
  };
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export default function ResourceCard({
  resource,
  onView,
  onDownload,
}: ResourceCardProps) {
  // Calculate average rating if available
  const averageRating =
    resource.ratings && resource.ratings.length > 0
      ? resource.ratings.reduce((sum, item) => sum + item.rating, 0) /
        resource.ratings.length
      : 0;

  // Format date
  const formattedDate = new Date(resource.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  // Get resource type color
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "notes":
        return "bg-blue-100 text-blue-800";
      case "textbook":
        return "bg-purple-100 text-purple-800";
      case "solution":
        return "bg-green-100 text-green-800";
      case "study guide":
        return "bg-yellow-100 text-yellow-800";
      case "practice exam":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={getTypeColor(resource.resource_type)}>
              {resource.resource_type}
            </Badge>
            {resource.course_code && (
              <Badge variant="outline" className="ml-2">
                {resource.course_code}
              </Badge>
            )}
          </div>
          {averageRating > 0 && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm ml-1">{averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <CardTitle className="mt-2 text-xl">{resource.title}</CardTitle>
        {resource.professor && (
          <CardDescription className="text-sm">
            Prof. {resource.professor}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 line-clamp-2">{resource.description}</p>

        <div className="flex flex-wrap gap-1 mt-3">
          {resource.tags?.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag.tag_name}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="flex items-center text-sm text-gray-500">
          <div className="flex items-center mr-3">
            <Eye className="h-4 w-4 mr-1" />
            <span>{resource.view_count}</span>
          </div>
          <div className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            <span>{resource.download_count}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView && onView(resource.id)}
          >
            View
          </Button>
          <Button
            size="sm"
            onClick={() => onDownload && onDownload(resource.id)}
          >
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
