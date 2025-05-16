"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PricingCard from "@/components/pricing-card";
import { Check, X, Sparkles, BookMarked, Globe, BarChart3, FileText, MessageSquare, Mic, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function PricingClient() {
  const [user, setUser] = useState<User | null>(null);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Define fallback plans
  const fallbackPlans = [
    {
      id: "price_free",
      name: "Free",
      amount: 0,
      interval: "month",
      popular: false,
      features: [
        { name: "Access to public resources", included: true },
        { name: "Join study groups", included: true },
        { name: "Limited resource uploads (5/month)", included: true },
        { name: "Create up to 2 study groups", included: true },
        { name: "Limited AI Tools (3 uses/month)", included: true, iconName: "Sparkles" },
        { name: "Textbook Solutions", included: false },
        { name: "Proxy Browser", included: false },
        { name: "Degree Roadmap Sharing", included: false },
      ],
    },
    {
      id: "price_scholar_plus",
      name: "Scholar+",
      amount: 299,
      interval: "month",
      popular: true,
      badge: "Recommended",
      yearlyPrice: 2499,
      yearlyInterval: "year",
      features: [
        { name: "Everything in Free plan", included: true },
        { name: "Unlimited resource uploads", included: true },
        { name: "Create unlimited study groups", included: true },
        { name: "Priority support", included: true },
        { name: "AI Essay Writer", included: true, iconName: "FileText" },
        { name: "AI Document Chat & Analysis", included: true, iconName: "MessageSquare" },
        { name: "AI Lecture Note Taker", included: true, iconName: "Mic" },
        { name: "Textbook Solutions", included: true, iconName: "BookMarked" },
        { name: "Proxy Browser", included: true, iconName: "Globe" },
        { name: "Degree Roadmap Sharing", included: true, iconName: "BarChart3" },
      ],
    }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const supabase = createClient();

        // Get the current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Try to get plans from edge function
        const { data: plans, error } = await supabase.functions.invoke(
          "supabase-functions-get-plans",
        );

        if (error) {
          console.error("Error fetching plans:", error);
          setPricingPlans(fallbackPlans);
        } else {
          setPricingPlans(plans || fallbackPlans);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        setPricingPlans(fallbackPlans);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <div className="container mx-auto px-4 py-8 md:py-16 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading pricing plans...</p>
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
          <Link href="/app-entry" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((item: any) => (
            <PricingCard key={item.id} item={item} user={user} />
          ))}
        </div>

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

        {/* Scholar+ features showcase */}
        <div className="mt-16 md:mt-24 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Scholar+ Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Essay Writer</h3>
              <p className="text-muted-foreground text-sm">
                Generate well-structured essays with customizable prompts, rubrics, and writing styles tailored to your academic level.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Document Chat</h3>
              <p className="text-muted-foreground text-sm">
                Upload PDFs, notes, or text and chat with an AI about the content. Generate summaries, notes, flashcards, and practice quizzes.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Lecture Note Taker</h3>
              <p className="text-muted-foreground text-sm">
                Record lectures and get AI-generated notes, summaries, and study materials. Re-listen to recordings and chat with AI about the content.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <BookMarked className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Textbook Solutions</h3>
              <p className="text-muted-foreground text-sm">
                Access comprehensive solutions to popular textbooks and study materials with LitSolutions integration.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Proxy Browser</h3>
              <p className="text-muted-foreground text-sm">
                Browse the web securely and privately within UniShare, accessing content that might be restricted on your network.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Degree Roadmap</h3>
              <p className="text-muted-foreground text-sm">
                Plan and share your academic journey with integrated resources and RateMyProfessor integration for informed course selection.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-16 md:mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto mt-8 grid gap-4 md:gap-6 text-left">
            <div className="bg-card p-5 md:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-2">
                How does Scholar+ billing work?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Scholar+ is billed monthly or yearly. You can cancel anytime, and your subscription will remain active until the end of your current billing period.
              </p>
            </div>
            <div className="bg-card p-5 md:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-2">
                Do you offer student discounts?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                UniShare is already designed with student budgets in mind. Our pricing is specifically tailored for university students.
              </p>
            </div>
            <div className="bg-card p-5 md:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                We accept all major credit cards, debit cards, and digital wallets through our secure payment processor.
              </p>
            </div>
            <div className="bg-card p-5 md:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-2">
                Can I share my Scholar+ account?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Scholar+ subscriptions are for individual use only. Our terms of service prohibit sharing accounts. Each student should have their own account.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
