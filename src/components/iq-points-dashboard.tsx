"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Coins,
  Sparkles,
  Clock,
  TrendingUp,
  Gift,
  Users,
  FileText,
  Star,
  ShoppingCart,
  History,
  Timer,
  Crown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IQPointsData {
  iq_points: number;
  subscription_status: 'none' | 'regular' | 'temporary';
  temporary_access?: {
    expires_at: string;
    points_spent: number;
    access_duration_hours: number;
    remaining_hours: number;
  };
  recent_transactions: Transaction[];
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'earn' | 'spend';
  source_type: string;
  description: string;
  created_at: string;
}

interface PricingOption {
  id: string;
  duration_hours: number;
  points_cost: number;
  description: string;
  formatted_duration: string;
  discount_percentage: number;
  is_best_value: boolean;
  points_per_hour: number;
}

export default function IQPointsDashboard() {
  const [data, setData] = useState<IQPointsData | null>(null);
  const [pricing, setPricing] = useState<PricingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PricingOption | null>(null);

  useEffect(() => {
    fetchData();
    fetchPricing();
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

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/iq-points/pricing');
      const result = await response.json();
      if (result.success) {
        setPricing(result.pricing);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handlePurchaseClick = (option: PricingOption) => {
    setSelectedOption(option);
    setPurchaseDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedOption) return;
    
    try {
      setPurchasing(true);
      const response = await fetch('/api/iq-points/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration_hours: selectedOption.duration_hours }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success message
        alert(`Success! You now have Scholar+ access for ${selectedOption.duration_hours} hours!`);
        
        // Refresh data
        await fetchData();
        setPurchaseDialogOpen(false);
        setSelectedOption(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error purchasing access:', error);
      alert('An error occurred while processing your purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const getPointsForNextGoal = () => {
    if (!data || !pricing.length) return null;
    
    const cheapestOption = pricing.reduce((min, option) => 
      option.points_cost < min.points_cost ? option : min
    );
    
    if (data.iq_points >= cheapestOption.points_cost) {
      return null; // User can already afford something
    }
    
    return {
      needed: cheapestOption.points_cost - data.iq_points,
      total: cheapestOption.points_cost,
      option: cheapestOption
    };
  };

  const getTransactionIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'successful_invite':
      case 'invite':
        return <Users className="h-4 w-4" />;
      case 'resource_upload':
      case 'first_resource_upload':
        return <FileText className="h-4 w-4" />;
      case 'study_group_creation':
      case 'first_study_group_creation':
        return <Users className="h-4 w-4" />;
      case 'scholar_plus_purchase':
        return <Crown className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.transaction_type === 'earn') {
      return 'text-green-600 dark:text-green-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load IQ Points data</p>
      </div>
    );
  }

  const nextGoal = getPointsForNextGoal();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            {data.iq_points.toLocaleString()}
            <span className="text-lg font-normal text-muted-foreground">IQ Points</span>
          </CardTitle>
          <CardDescription>
            Earn points by contributing to the UniShare community
          </CardDescription>
        </CardHeader>
        
        {/* Current Access Status */}
        {data.subscription_status !== 'none' && (
          <CardContent className="pt-0">
            <div className="text-center">
              {data.subscription_status === 'regular' ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <Crown className="h-4 w-4 mr-1" />
                  Scholar+ Active (Subscription)
                </Badge>
              ) : data.temporary_access && (
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">
                    <Timer className="h-4 w-4 mr-1" />
                    Scholar+ Active (Points)
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Expires in {data.temporary_access.remaining_hours} hours
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Progress to Next Goal */}
      {nextGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress to Scholar+ Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Points</span>
                <span>{data.iq_points} / {nextGoal.total}</span>
              </div>
              <Progress 
                value={(data.iq_points / nextGoal.total) * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {nextGoal.needed} more points needed for {nextGoal.option.formatted_duration} of Scholar+ access
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Earn IQ Points
          </CardTitle>
          <CardDescription>
            Contribute to the community and earn points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Invite Friends</p>
                <p className="text-sm text-muted-foreground">50 points per signup</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Upload Resources</p>
                <p className="text-sm text-muted-foreground">25 points per resource</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="font-medium">Create Study Groups</p>
                <p className="text-sm text-muted-foreground">75 points per group</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Scholar+ Access */}
      {data.subscription_status === 'none' && pricing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Scholar+ Access
            </CardTitle>
            <CardDescription>
              Use your IQ Points to unlock premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricing.map((option) => (
                <div
                  key={option.id}
                  className={`relative p-4 border rounded-lg transition-colors ${
                    data.iq_points >= option.points_cost
                      ? 'border-primary bg-primary/5 hover:bg-primary/10'
                      : 'border-muted bg-muted/20'
                  } ${option.is_best_value ? 'ring-2 ring-primary' : ''}`}
                >
                  {option.is_best_value && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  )}
                  
                  {option.discount_percentage > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 bg-green-500">
                      -{option.discount_percentage}%
                    </Badge>
                  )}

                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">{option.formatted_duration}</h3>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">
                        {option.points_cost}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.points_per_hour.toFixed(1)} pts/hour
                      </p>
                    </div>
                    
                    <Button
                      variant={data.iq_points >= option.points_cost ? "default" : "outline"}
                      size="sm"
                      disabled={data.iq_points < option.points_cost}
                      className="w-full"
                      onClick={() => handlePurchaseClick(option)}
                    >
                      {data.iq_points >= option.points_cost ? 'Purchase' : 'Not Enough Points'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No transactions yet. Start earning points by contributing to the community!
            </p>
          ) : (
            <div className="space-y-3">
              {data.recent_transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-background ${getTransactionColor(transaction)}`}>
                      {getTransactionIcon(transaction.source_type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction)}`}>
                    {transaction.transaction_type === 'earn' ? '+' : '-'}{Math.abs(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              {selectedOption && 
                `You are about to purchase ${selectedOption.formatted_duration} of Scholar+ access for ${selectedOption.points_cost} IQ Points.`
              }
            </DialogDescription>
          </DialogHeader>
          {selectedOption && data && (
            <div className="space-y-4 px-6 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{selectedOption.formatted_duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">{selectedOption.points_cost} IQ Points</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Points:</span>
                  <span className="font-medium">{data.iq_points} IQ Points</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className="font-medium">{data.iq_points - selectedOption.points_cost} IQ Points</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPurchaseDialogOpen(false);
                setSelectedOption(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 