"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  TrendingUp,
  Award
} from "lucide-react";

interface DashboardStatisticsCardProps {
  resourceCount: number;
  studyGroupCount: number;
  userGroupCount: number;
}

export default function DashboardStatisticsCard({
  resourceCount,
  studyGroupCount,
  userGroupCount
}: DashboardStatisticsCardProps) {
  return (
    <Card className="col-span-2 flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          University Statistics
        </CardTitle>
        <CardDescription>
          Community activity and your participation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {/* University Resources */}
            <div className="text-center space-y-2">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{resourceCount}</p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Total Resources
                  </p>
                </div>
              </div>
              {resourceCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Community library
                </Badge>
              )}
            </div>

            {/* Public Study Groups */}
            <div className="text-center space-y-2">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{studyGroupCount}</p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Study Groups
                  </p>
                </div>
              </div>
              {studyGroupCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Active community
                </Badge>
              )}
            </div>

            {/* My Groups */}
            <div className="text-center space-y-2">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{userGroupCount}</p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    My Groups
                  </p>
                </div>
              </div>
              {userGroupCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Active member
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 