import { Metadata } from "next";
import PricingClient from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UniShare | Pricing Plans",
  description: "Choose the perfect subscription plan for your academic needs",
};

export default function Pricing() {
  return <PricingClient />;
}
