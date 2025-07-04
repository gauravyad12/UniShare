"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  RefreshCw, 
  Save, 
  X,
  Coins,
  Clock,
  Award
} from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import AdminAccessGuard from "@/components/admin-access-guard";

interface IQPointsConfig {
  id: string;
  action_type: string;
  points_awarded: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ScholarPlusPricing {
  id: string;
  duration_hours: number;
  points_cost: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function IQPointsAdminPage() {
  const [pointsConfig, setPointsConfig] = useState<IQPointsConfig[]>([]);
  const [pricingConfig, setPricingConfig] = useState<ScholarPlusPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingConfig, setEditingConfig] = useState<IQPointsConfig | null>(null);
  const [editingPricing, setEditingPricing] = useState<ScholarPlusPricing | null>(null);
  const [editedConfigData, setEditedConfigData] = useState<Partial<IQPointsConfig>>({});
  const [editedPricingData, setEditedPricingData] = useState<Partial<ScholarPlusPricing>>({});
  const [isSaving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editType, setEditType] = useState<"config" | "pricing">("config");

  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/sign-in?error=Please sign in to access this page");
          return;
        }

        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!userProfile || userProfile.role !== "admin") {
          setError("You do not have permission to access this page");
          router.push(
            "/dashboard?error=You do not have permission to access the IQ points admin page",
          );
          return;
        }

        setIsAdmin(true);
        fetchData();
      } catch (err) {
        console.error("Error checking admin access:", err);
        setError("Failed to verify access permissions");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      
      // Fetch IQ points configuration
      const { data: configData, error: configError } = await supabase
        .from("iq_points_config")
        .select("*")
        .order("action_type");

      if (configError) {
        throw new Error(`Failed to fetch IQ points config: ${configError.message}`);
      }

      // Fetch Scholar+ pricing
      const { data: pricingData, error: pricingError } = await supabase
        .from("scholar_plus_pricing")
        .select("*")
        .order("duration_hours");

      if (pricingError) {
        throw new Error(`Failed to fetch pricing config: ${pricingError.message}`);
      }

      setPointsConfig(configData || []);
      setPricingConfig(pricingData || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfig = (config: IQPointsConfig) => {
    setEditingConfig(config);
    setEditedConfigData({ ...config });
    setEditType("config");
    setIsDialogOpen(true);
  };

  const handleEditPricing = (pricing: ScholarPlusPricing) => {
    setEditingPricing(pricing);
    setEditedPricingData({ ...pricing });
    setEditType("pricing");
    setIsDialogOpen(true);
  };

  const handleConfigInputChange = (field: keyof IQPointsConfig, value: any) => {
    setEditedConfigData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePricingInputChange = (field: keyof ScholarPlusPricing, value: any) => {
    setEditedPricingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveResult(null);

      const supabase = createClient();
      
      if (editType === "config" && editingConfig) {
        const { error } = await supabase
          .from("iq_points_config")
          .update({
            points_awarded: editedConfigData.points_awarded,
            description: editedConfigData.description,
            is_active: editedConfigData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingConfig.id);

        if (error) {
          throw new Error(`Failed to update config: ${error.message}`);
        }
      } else if (editType === "pricing" && editingPricing) {
        const { error } = await supabase
          .from("scholar_plus_pricing")
          .update({
            points_cost: editedPricingData.points_cost,
            description: editedPricingData.description,
            is_active: editedPricingData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPricing.id);

        if (error) {
          throw new Error(`Failed to update pricing: ${error.message}`);
        }
      }

      setSaveResult({
        success: true,
        message: "Configuration updated successfully",
      });

      setIsDialogOpen(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      setSaveResult({
        success: false,
        message: err.message || "Failed to save configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    } else if (hours < 168) {
      return `${Math.floor(hours / 24)} days`;
    } else if (hours < 720) {
      return `${Math.floor(hours / 168)} weeks`;
    } else {
      return `${Math.floor(hours / 720)} months`;
    }
  };

  if (loading) {
    return (
      <AdminAccessGuard>
        <LoadingSpinner />
      </AdminAccessGuard>
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessGuard>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. This page is
              restricted to administrators only.
            </AlertDescription>
          </Alert>
        </div>
      </AdminAccessGuard>
    );
  }

  return (
    <AdminAccessGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            IQ Points Configuration
          </h1>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveResult && (
          <Alert
            variant={saveResult.success ? "default" : "destructive"}
            className="mb-6"
          >
            {saveResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{saveResult.success ? "Success" : "Failed"}</AlertTitle>
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="points-config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points-config" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Points Configuration
            </TabsTrigger>
            <TabsTrigger value="pricing-config" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Access Pricing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points-config">
            <Card>
              <CardHeader>
                <CardTitle>IQ Points Configuration</CardTitle>
                <CardDescription>
                  Configure how many points users earn for different actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pointsConfig.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">
                            {config.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            ({config.points_awarded} points)
                          </span>
                          {!config.is_active && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {config.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditConfig(config)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing-config">
            <Card>
              <CardHeader>
                <CardTitle>Scholar+ Access Pricing</CardTitle>
                <CardDescription>
                  Configure how many points are required for temporary Scholar+ access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingConfig.map((pricing) => (
                    <div
                      key={pricing.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">
                            {formatDuration(pricing.duration_hours)}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            ({pricing.points_cost} points)
                          </span>
                          {!pricing.is_active && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pricing.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPricing(pricing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>
                Edit {editType === "config" ? "Points Configuration" : "Access Pricing"}
              </DialogTitle>
              <DialogDescription>
                {editType === "config" 
                  ? "Modify the points awarded for this action"
                  : "Modify the points cost for this access duration"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-4">
              {editType === "config" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="points_awarded">Points Awarded</Label>
                    <Input
                      id="points_awarded"
                      type="number"
                      value={editedConfigData.points_awarded || 0}
                      onChange={(e) => handleConfigInputChange("points_awarded", parseInt(e.target.value) || 0)}
                      min="0"
                      autoFocus={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedConfigData.description || ""}
                      onChange={(e) => handleConfigInputChange("description", e.target.value)}
                      rows={3}
                      autoFocus={false}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editedConfigData.is_active || false}
                      onCheckedChange={(checked) => handleConfigInputChange("is_active", checked)}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="points_cost">Points Cost</Label>
                    <Input
                      id="points_cost"
                      type="number"
                      value={editedPricingData.points_cost || 0}
                      onChange={(e) => handlePricingInputChange("points_cost", parseInt(e.target.value) || 0)}
                      min="0"
                      autoFocus={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedPricingData.description || ""}
                      onChange={(e) => handlePricingInputChange("description", e.target.value)}
                      rows={3}
                      autoFocus={false}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editedPricingData.is_active || false}
                      onCheckedChange={(checked) => handlePricingInputChange("is_active", checked)}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminAccessGuard>
  );
} 