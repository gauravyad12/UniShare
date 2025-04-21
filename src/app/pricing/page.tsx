import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PricingCard from "@/components/pricing-card";
import { createClient } from "../../../supabase/server";
import { Metadata } from "next";
import { Check, X } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "UniShare | Pricing Plans",
  description: "Choose the perfect subscription plan for your academic needs",
};

export default async function Pricing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define fallback plans in case the edge function fails
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
        { name: "Basic profile customization", included: true },
        { name: "Priority support", included: false },
        { name: "Unlimited resource uploads", included: false },
        { name: "Advanced analytics", included: false },
      ],
    },
    {
      id: "price_standard",
      name: "Standard",
      amount: 499,
      interval: "month",
      popular: true,
      features: [
        { name: "Access to public resources", included: true },
        { name: "Join study groups", included: true },
        { name: "Unlimited resource uploads", included: true },
        { name: "Advanced profile customization", included: true },
        { name: "Priority support", included: true },
        { name: "Create unlimited study groups", included: true },
        { name: "Advanced analytics", included: false },
      ],
    },
    {
      id: "price_premium",
      name: "Premium",
      amount: 999,
      interval: "month",
      popular: false,
      features: [
        { name: "Access to public resources", included: true },
        { name: "Join study groups", included: true },
        { name: "Unlimited resource uploads", included: true },
        { name: "Advanced profile customization", included: true },
        { name: "Priority support", included: true },
        { name: "Create unlimited study groups", included: true },
        { name: "Advanced analytics", included: true },
      ],
    },
  ];

  // Try to get plans from edge function, fall back to predefined plans if it fails
  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );
  const pricingPlans = plans || fallbackPlans;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the perfect plan for your academic journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((item: any) => (
            <PricingCard key={item.id} item={item} user={user} />
          ))}
        </div>

        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-6 text-left">Features</th>
                  <th className="py-4 px-6 text-center">Free</th>
                  <th className="py-4 px-6 text-center bg-primary/5">
                    Standard
                  </th>
                  <th className="py-4 px-6 text-center">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">
                    Access to public resources
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">Join study groups</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">Resource uploads</td>
                  <td className="py-4 px-6 text-center">5/month</td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    Unlimited
                  </td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">
                    Profile customization
                  </td>
                  <td className="py-4 px-6 text-center">Basic</td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    Advanced
                  </td>
                  <td className="py-4 px-6 text-center">Advanced</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">Priority support</td>
                  <td className="py-4 px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">Create study groups</td>
                  <td className="py-4 px-6 text-center">2 max</td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    Unlimited
                  </td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6 font-medium">Advanced analytics</td>
                  <td className="py-4 px-6 text-center">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-4 px-6 text-center bg-primary/5">
                    <X className="mx-auto h-5 w-5 text-red-500" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto mt-8 grid gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can change your subscription plan at any time. Changes
                will be applied at the start of your next billing cycle.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                Do you offer student discounts?
              </h3>
              <p className="text-muted-foreground">
                UniShare is already designed with student budgets in mind. Our
                pricing is specifically tailored for university students.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and digital
                wallets through our secure payment processor.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
