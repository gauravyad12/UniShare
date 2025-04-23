import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Email Templates",
  description: "Manage email templates",
};

export default function EmailTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
