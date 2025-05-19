"use client";

import { CheckCircle, BookText, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TextbookStatsProps {
  className?: string;
  loading?: boolean;
}

export default function TextbookStats({ className, loading = false }: TextbookStatsProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {loading ? (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </>
      ) : (
        <>
          <StatCard
            icon={<BookText className="h-5 w-5 text-primary" />}
            title="Textbooks"
            value="5,000+"
            description="Browse thousands of popular textbooks"
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            title="Chapters"
            value="50,000+"
            description="Comprehensive coverage across subjects"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            title="Solutions"
            value="500,000+"
            description="Step-by-step answers to problems"
          />
        </>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-primary/10">
      <CardContent className="p-4 flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-7 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

function StatCard({ icon, title, value, description }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-primary/10 hover:border-primary/20 transition-colors">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-md flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
