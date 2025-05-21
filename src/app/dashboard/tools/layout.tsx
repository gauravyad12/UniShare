import { Metadata } from "next";

export const metadata: Metadata = {
  description: "Access premium Scholar+ tools and features",
};

export default function ScholarPlusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We don't need a special layout here since the dashboard layout will be applied
  // from the parent dashboard layout.tsx
  return children;
}
