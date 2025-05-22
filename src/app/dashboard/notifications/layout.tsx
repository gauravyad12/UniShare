import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Notifications",
  description: "View and manage your UniShare notifications",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
