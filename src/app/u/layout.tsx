import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile | UniShare",
  description: "View user profile, resources, and study groups",
};

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
