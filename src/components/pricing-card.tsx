"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Check,
  Sparkles,
  FileText,
  MessageSquare,
  Mic,
  BookMarked,
  Globe,
  BarChart3
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "./ui/badge";
import { isAppilixOrDevelopment } from "@/utils/appilix-detection";

// Helper function to render the appropriate icon based on the iconName
const renderIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case "FileText":
      return <FileText className={className} />;
    case "MessageSquare":
      return <MessageSquare className={className} />;
    case "Mic":
      return <Mic className={className} />;
    case "BookMarked":
      return <BookMarked className={className} />;
    case "Globe":
      return <Globe className={className} />;
    case "BarChart3":
      return <BarChart3 className={className} />;
    default:
      return <Check className={className} />;
  }
};

export default function PricingCard({
  item,
  user,
}: {
  item: any;
  user: User | null;
}) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isAppilix, setIsAppilix] = useState(false);

  // Check if we're in Appilix or development environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAppilix(isAppilixOrDevelopment());

      // Check if we're in a real Appilix app or development
      const isRealAppilix = navigator.userAgent.includes('Appilix');
      const isDevelopment = (window.location.hostname.includes('localhost') ||
                           window.location.hostname.includes('192.')) &&
                           window.innerWidth < 768;

      // Only create mock function in development, not in real Appilix app
      if (isDevelopment && !isRealAppilix && typeof (window as any).appilixPurchaseProduct !== 'function') {
        (window as any).appilixPurchaseProduct = function(productId: string, type: string, redirectUrl: string) {
          console.log('Mock Appilix Purchase:', { productId, type, redirectUrl });
          // Simulate successful purchase by redirecting with a test code
          const testCode = 'test_purchase_code_' + Date.now();
          window.location.href = redirectUrl + '?code=' + testCode;
        };
        console.log('Mock appilixPurchaseProduct function created for testing');
      }
    }
  }, []);



  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = "/sign-in";
      return;
    }

    if (priceId === "free" || priceId === "price_free") {
      // For free tier, just redirect to sign up
      window.location.href = "/sign-up";
      return;
    }

    try {
      const supabase = createClient();
      // Get the session to include the access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error("No access token available");
        alert("Authentication error. Please try logging in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard`,
          },
          headers: {
            "X-Customer-Email": user.email || "",
            "Authorization": `Bearer ${accessToken}`,
          },
        },
      );

      if (error) {
        console.error("Error creating checkout session:", error);
        console.error("Error details:", JSON.stringify(error));

        // Show a more detailed error message
        let errorMessage = "Error creating checkout session. ";

        if (error.message) {
          errorMessage += error.message;
        } else if (error.error) {
          errorMessage += error.error;
        } else {
          errorMessage += "Please try again later.";
        }

        alert(errorMessage);
        return;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        alert("Error creating checkout session. Please try again later.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <Card
      className={`w-full relative overflow-hidden ${
        item.popular
          ? "border-2 border-primary shadow-lg md:shadow-xl md:scale-105"
          : "border border-border"
      }`}
    >
      {item.popular && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 opacity-50" />
      )}
      <CardHeader className="relative">
        {item.popular && item.badge && (
          <div className="flex justify-start mb-4">
            <Badge variant="default" className="px-3 py-1 rounded-full text-xs font-medium bg-primary hover:bg-primary w-auto inline-flex">
              {item.badge}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-2">
          {item.name === "Scholar+" && <Sparkles className="h-5 w-5 text-primary" />}
          <CardTitle className="text-2xl font-bold tracking-tight">
            {item.name}
          </CardTitle>
        </div>
        <div className="flex flex-col mt-2 text-sm text-muted-foreground">
          {item.amount > 0 ? (
            <>
              {item.yearlyPrice && (
                <div className="flex justify-start mb-4">
                  <div className="inline-flex items-center gap-2 p-1 rounded-full border border-border">
                    <div
                      className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        billingInterval === "monthly"
                          ? "bg-primary/90 text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setBillingInterval("monthly")}
                    >
                      Monthly
                    </div>
                    <div
                      className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        billingInterval === "yearly"
                          ? "bg-primary/90 text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setBillingInterval("yearly")}
                    >
                      Yearly
                      <span className={`text-xs font-semibold ml-1 ${
                        billingInterval === "yearly"
                          ? "text-primary-foreground"
                          : "text-primary"
                      }`}>
                        Save 30%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  ${billingInterval === "yearly" && item.yearlyPrice ? item.yearlyPrice / 100 : item.amount / 100}
                </span>
                <span className="text-muted-foreground">
                  /{billingInterval === "yearly" ? "year" : item.interval}
                </span>
              </div>

              {billingInterval === "monthly" && item.yearlyPrice && (
                <div className="mt-1 text-sm text-muted-foreground">
                  ${(item.amount * 12) / 100}/year if paying monthly
                </div>
              )}
            </>
          ) : (
            <span className="text-3xl md:text-4xl font-bold text-foreground">Free</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {item.features?.map((feature: any, index: number) => (
            <li key={index} className="flex items-start gap-2">
              {feature.included ? (
                feature.iconName ? (
                  renderIcon(feature.iconName, "h-5 w-5 text-primary shrink-0 mt-0.5")
                ) : (
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                )
              ) : (
                <span className="h-5 w-5 shrink-0"></span>
              )}
              <span
                className={
                  feature.included
                    ? feature.iconName ? "font-medium text-primary" : ""
                    : "text-muted-foreground"
                }
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="relative">
        <Button
          {...(item.name === "Scholar+" && isAppilix ? {
            // For Appilix, add onclick attribute directly to DOM
            onClick: undefined,
            dangerouslySetInnerHTML: undefined,
            // Use a custom prop that we'll handle
          } : {
            onClick: async () => {
              // If this is the Scholar+ plan, use the appropriate method based on environment
              if (item.name === "Scholar+") {
                // Use Stripe checkout
                const monthlyPriceId = "price_1RPHHtDcATCY5VhWO6vyle1i"; // Your existing monthly price ID
                const yearlyPriceId = "price_1RPHnIDcATCY5VhWM5Tyceq6"; // Replace with your actual yearly price ID from Stripe

                // Use the appropriate price ID based on the selected billing interval
                const selectedPriceId = billingInterval === "yearly" ? yearlyPriceId : monthlyPriceId;

                await handleCheckout(selectedPriceId);
              } else {
                await handleCheckout(item.id);
              }
            }
          })}
          variant={item.name === "Free" ? "outline" : "default"}
          className={`w-full py-5 md:py-6 text-base md:text-lg font-medium ${
            item.name === "Scholar+" ? "bg-primary hover:bg-primary/90" : ""
          }`}
          {...(item.name === "Scholar+" && isAppilix ? {
            // Add onclick attribute directly to the DOM
            'data-onclick': `
              if (!${!!user}) {
                window.location.href = "/sign-in";
                return;
              }

              try {
                // Debug: Log what's available in window
                console.log('Debugging Appilix environment:');
                console.log('User agent:', navigator.userAgent);
                console.log('All window properties with "appilix":', Object.keys(window).filter(key => key.toLowerCase().includes('appilix')));
                console.log('All window functions with "purchase":', Object.keys(window).filter(key => key.toLowerCase().includes('purchase') && typeof window[key] === 'function'));
                console.log('appilixPurchaseProduct type:', typeof window.appilixPurchaseProduct);
                console.log('appilixPurchaseProduct exists:', 'appilixPurchaseProduct' in window);

                const productId = "${billingInterval === "yearly" ? "com.unishare.app.scholarplusoneyear" : "com.unishare.app.scholarplusonemonth"}";
                localStorage.setItem('appilix_product_id', productId);
                const redirectUrl = window.location.origin + "/dashboard/success";

                if (typeof window.appilixPurchaseProduct === 'function') {
                  console.log('Calling appilixPurchaseProduct with:', productId, "consumable", redirectUrl);
                  window.appilixPurchaseProduct(productId, "consumable", redirectUrl);
                } else {
                  console.log('appilixPurchaseProduct is not a function. Type:', typeof window.appilixPurchaseProduct);

                  // Find all Appilix-related functions
                  const appilixFunctions = Object.keys(window).filter(key =>
                    key.toLowerCase().includes('appilix') && typeof window[key] === 'function'
                  );

                  const purchaseFunctions = Object.keys(window).filter(key =>
                    key.toLowerCase().includes('purchase') && typeof window[key] === 'function'
                  );

                  const allRelevantFunctions = [...new Set([...appilixFunctions, ...purchaseFunctions])];

                  console.log('Available Appilix-related functions:', appilixFunctions);
                  console.log('Available purchase-related functions:', purchaseFunctions);

                  // Show alert with available functions
                  let alertMessage = 'appilixPurchaseProduct function not found!\\n\\n';
                  alertMessage += 'User Agent: ' + navigator.userAgent + '\\n\\n';

                  if (appilixFunctions.length > 0) {
                    alertMessage += 'Available Appilix functions:\\n' + appilixFunctions.join('\\n') + '\\n\\n';
                  } else {
                    alertMessage += 'No Appilix functions found\\n\\n';
                  }

                  if (purchaseFunctions.length > 0) {
                    alertMessage += 'Available purchase functions:\\n' + purchaseFunctions.join('\\n') + '\\n\\n';
                  } else {
                    alertMessage += 'No purchase functions found\\n\\n';
                  }

                  alertMessage += 'All relevant functions: ' + allRelevantFunctions.length;

                  alert(alertMessage);
                }
              } catch (error) {
                console.error('Error in onclick handler:', error);
              }
            `,
            ref: (el: HTMLButtonElement | null) => {
              if (el && el.getAttribute('data-onclick')) {
                const onclickCode = el.getAttribute('data-onclick');
                el.setAttribute('onclick', onclickCode || '');
                el.removeAttribute('data-onclick');
              }
            }
          } : {})}
        >
          {item.name === "Free" ? "Get Started" : "Upgrade to Scholar+"}
        </Button>
      </CardFooter>
    </Card>
  );
}
