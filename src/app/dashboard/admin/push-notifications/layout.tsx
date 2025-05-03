import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Push Notifications",
  description: "Send push notifications to users",
};

export default function PushNotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
