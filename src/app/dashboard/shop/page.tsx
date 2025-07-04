import { Metadata } from "next";
import IQPointsDashboard from "@/components/iq-points-dashboard";
import { ShoppingCart } from "lucide-react";

export const metadata: Metadata = {
  title: "UniShare | Shop",
  description: "Use your IQ Points to unlock Scholar+ features and premium access.",
};

export default function ShopPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          Shop
        </h1>
        <p className="text-muted-foreground">
          Use your IQ Points to unlock Scholar+ features and premium access. Earn points by contributing to the UniShare community.
        </p>
      </div>
      
      <IQPointsDashboard />
    </div>
  );
} 