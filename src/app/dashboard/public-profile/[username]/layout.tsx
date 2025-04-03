import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";

type Props = {
  children: React.ReactNode;
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;

  // Fetch user profile to get the full name if available
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, username")
    .eq("username", username)
    .single();

  const displayName = profile?.full_name || profile?.username || username;

  return {
    title: `UniShare | ${displayName}'s Profile`,
    description: `View ${displayName}'s profile, resources, and study groups on UniShare.`,
  };
}

export default function PublicProfileLayout({ children }: Props) {
  return children;
}
