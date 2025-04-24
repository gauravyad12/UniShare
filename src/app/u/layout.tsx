import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile | UniShare",
  description: "View user profile, resources, and study groups",
  openGraph: {
    type: "profile",
    title: "User Profile | UniShare",
    description: "View user profile, resources, and study groups on UniShare",
  },
  twitter: {
    card: "summary_large_image",
    title: "User Profile | UniShare",
    description: "View user profile, resources, and study groups on UniShare",
  },
};

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
