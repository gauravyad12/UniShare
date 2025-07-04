"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Timer,
  Crown,
  ShoppingCart,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface IQPointsData {
  iq_points: number;
  subscription_status: 'none' | 'regular' | 'temporary';
  temporary_access?: {
    expires_at: string;
    points_spent: number;
    access_duration_hours: number;
    remaining_hours: number;
  };
}

export default function IQPointsCard() {
  const [data, setData] = useState<IQPointsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/iq-points/status');
      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching IQ points data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[200px] p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[200px] p-6">
          <p className="text-muted-foreground">Failed to load IQ Points</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-primary/20">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          {data.iq_points.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">IQ Points</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Access Status */}
        <div className="text-center">
          {data.subscription_status === 'regular' ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <Crown className="h-3 w-3 mr-1" />
              Scholar+ Active
            </Badge>
          ) : data.subscription_status === 'temporary' && data.temporary_access ? (
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">
                <Timer className="h-3 w-3 mr-1" />
                Scholar+ (Points)
              </Badge>
              <p className="text-xs text-muted-foreground">
                {data.temporary_access.remaining_hours}h remaining
              </p>
            </div>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Free Plan
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Link href="/dashboard/shop" className="w-full">
            <Button variant="default" size="sm" className="w-full">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Visit Shop
            </Button>
          </Link>
          <p className="text-xs text-center text-muted-foreground">
            Earn points by contributing to the community
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 