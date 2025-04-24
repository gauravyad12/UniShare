import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app';

  // Fetch user profile to get the full name if available
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, username, bio")
    .eq("username", username)
    .single();

  const displayName = profile?.full_name || profile?.username || username;
  const description = profile?.bio 
    ? `${displayName}'s profile on UniShare. ${profile.bio.substring(0, 100)}${profile.bio.length > 100 ? '...' : ''}`
    : `View ${displayName}'s profile, resources, and study groups on UniShare.`;

  return {
    title: `${displayName} (@${username}) | UniShare`,
    description,
    openGraph: {
      type: "profile",
      title: `${displayName} (@${username}) | UniShare`,
      description,
      url: `${baseUrl}/u/${username}`,
      images: [{
        url: `${baseUrl}/api/og/profile?username=${username}`,
        width: 1200,
        height: 630,
        alt: `${displayName}'s profile on UniShare`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} (@${username}) | UniShare`,
      description,
      images: [`${baseUrl}/api/og/profile?username=${username}`],
    },
    alternates: {
      canonical: `${baseUrl}/u/${username}`,
    },
  };
}
