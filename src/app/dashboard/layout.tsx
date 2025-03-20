import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in?error=Please sign in to access the dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
