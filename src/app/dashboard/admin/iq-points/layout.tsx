import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | IQ Points Configuration",
  description: "Manage IQ points configuration and pricing",
};

export default function IQPointsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 