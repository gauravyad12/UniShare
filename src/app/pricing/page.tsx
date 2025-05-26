import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Sparkles,
  BookMarked,
  Globe,
  BarChart3,
  FileText,
  MessageSquare,
  Mic,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UniShare | Pricing Plans",
  description: "Choose the perfect subscription plan for your academic needs",
  openGraph: {
    type: "website",
    title: "UniShare | Pricing Plans",
    description: "Choose the perfect subscription plan for your academic needs",
    images: [
      {
        url: "/scholar-plus-social.png",
        width: 1200,
        height: 630,
        alt: "UniShare Scholar+ Premium Plan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UniShare | Pricing Plans",
    description: "Choose the perfect subscription plan for your academic needs",
    images: ["/scholar-plus-social.png"],
  },
};

// Check if user agent contains 'Appilix' or URL contains localhost/192.
function isAppilixEnvironment(userAgent: string, host: string): boolean {
  return userAgent.includes('Appilix') || host.includes('localhost') || host.includes('192.');
}

export default async function Pricing() {
  const supabase = await createClient();
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const host = headersList.get('host') || '';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check for active subscription
  let hasActiveSubscription = false;
  if (user) {
    try {
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });

      const currentTime = Math.floor(Date.now() / 1000);

      if (subscriptions && subscriptions.length > 0) {
        const latestSubscription = subscriptions[0];
        if (latestSubscription.status === "active" &&
            (!latestSubscription.current_period_end ||
             latestSubscription.current_period_end > currentTime)) {
          hasActiveSubscription = true;
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }

  const isAppilix = isAppilixEnvironment(userAgent, host);

  return <PricingPage user={user} hasActiveSubscription={hasActiveSubscription} isAppilix={isAppilix} />;
}

function PricingPage({ user, hasActiveSubscription, isAppilix }: { user: any; hasActiveSubscription: boolean; isAppilix: boolean }) {
  // Show redirect message for users with active subscriptions
  if (hasActiveSubscription) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <div className="container mx-auto px-4 py-8 md:py-16 flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">You're Already a Scholar+ Member!</h1>
            <p className="text-muted-foreground mb-6">
              You already have an active Scholar+ subscription. Access your premium features below.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Go to Dashboard
              </Link>
              <Link href="/dashboard/tools" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Access Scholar+ Tools
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="container mx-auto px-4 py-8 md:py-16 flex-1">
        <div className="md:hidden mb-6">
          <Link href="/app" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Elevate Your Academic Experience
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful tools designed to help you excel in your studies
          </p>
        </div>

        {/* Hero banner for Scholar+ */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background mb-12 p-6 md:p-8 max-w-5xl mx-auto">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 md:w-40 md:h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold">Introducing Scholar+</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Our premium suite of AI-powered tools and resources designed to transform how you study, research, and learn.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Tools</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                  <BookMarked className="h-3.5 w-3.5" />
                  <span>Textbook Solutions</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Proxy Browser</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Roadmap Sharing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <PricingCards user={user} isAppilix={isAppilix} />

        {/* Feature comparison */}
        <div className="mt-16 md:mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6 md:mb-8">Compare Plans</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="py-4 px-4 md:px-6 text-left">Features</th>
                  <th className="py-4 px-3 md:px-6 text-center">Free</th>
                  <th className="py-4 px-3 md:px-6 text-center bg-primary/5">
                    Scholar+
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">
                    Access to public resources
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Join study groups</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Resource uploads</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">5/month</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    Unlimited
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Create study groups</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">2 max</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    Unlimited
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Priority support</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">AI Essay Writer</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">AI Document Chat & Analysis</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">AI Lecture Note Taker</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Textbook Solutions</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Proxy Browser</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 md:py-4 px-4 md:px-6 font-medium">Degree Roadmap Sharing</td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

function PricingCards({ user, isAppilix }: { user: any; isAppilix: boolean }) {
  const pricingPlans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      interval: "forever",
      description: "Perfect for getting started",
      features: [
        "Access to public resources",
        "Join study groups",
        "5 resource uploads per month",
        "Create up to 2 study groups",
        "Basic community support",
      ],
    },
    {
      id: "scholar-plus",
      name: "Scholar+",
      price: "$4.99",
      interval: "month",
      yearlyPrice: "$49.99",
      description: "Everything you need to excel academically",
      features: [
        "Everything in Free",
        "Unlimited resource uploads",
        "Unlimited study groups",
        "Priority support",
        "AI Essay Writer",
        "AI Document Chat & Analysis",
        "AI Lecture Note Taker",
        "Textbook Solutions",
        "Proxy Browser",
        "Degree Roadmap Sharing",
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {pricingPlans.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-lg border border-border p-6 md:p-8 ${
            plan.name === "Scholar+" ? "border-primary bg-primary/5" : "bg-card"
          }`}
        >
          {plan.name === "Scholar+" && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most Popular
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-muted-foreground mb-4">{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl md:text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">/{plan.interval}</span>
              {plan.yearlyPrice && (
                <div className="text-sm text-muted-foreground mt-1">
                  or {plan.yearlyPrice}/year (save 17%)
                </div>
              )}
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="relative">
            {plan.name === "Scholar+" && isAppilix ? (
              // For Appilix, render button with onclick directly in HTML using dangerouslySetInnerHTML
              <div
                dangerouslySetInnerHTML={{
                  __html: `
                    <button
                      class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full py-5 md:py-6 text-base md:text-lg font-medium"
                      onclick="appilixPurchaseProduct('com.unishare.app.scholarplusonemonth', 'consumable', window.location.origin + '/dashboard/success')"
                    >
                      Upgrade to Scholar+
                    </button>
                  `
                }}
              />
            ) : (
              <Link
                href={plan.name === "Free" ? "/dashboard" : "/pricing"}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full py-5 md:py-6 text-base md:text-lg font-medium ${
                  plan.name === "Free"
                    ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {plan.name === "Free" ? "Get Started" : "Upgrade to Scholar+"}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
