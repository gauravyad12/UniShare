import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppilixEntryIdentity from "@/components/appilix-entry-identity";

export const metadata: Metadata = {
  title: "UniShare App - Get Started",
  description: "Welcome to UniShare - Your academic resource sharing platform for university students",
};

export default async function AppEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-entry-layout">
      {/* Add Appilix identity for push notifications */}
      {user && <AppilixEntryIdentity />}
      {children}
    </div>
  );
}
