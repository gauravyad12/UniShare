import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Your Profile",
  description: "Manage your personal information and profile settings",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
