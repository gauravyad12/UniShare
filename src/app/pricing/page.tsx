import { Metadata } from "next";
import PricingClientWithData from "./page-client-with-data";

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

export default function Pricing() {
  return <PricingClientWithData />;
}
