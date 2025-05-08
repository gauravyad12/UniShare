import { createClient } from "@/utils/supabase/server";
import { UserProfileClient } from "./user-profile-client";

/**
 * Server component that securely fetches user profile data
 * This component handles the sensitive data fetching on the server side
 * and passes only the necessary data to the client component
 */
export async function UserProfileServer() {
  const supabase = createClient();
  
  try {
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return a placeholder component if no user is authenticated
      return <UserProfileClient isLoading={false} userData={null} />;
    }
    
    // Fetch the user profile with a secure server-side query
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, avatar_url, username, full_name, role")
      .eq("id", user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return <UserProfileClient isLoading={false} userData={null} error="Failed to load profile" />;
    }
    
    // Verify that the profile belongs to the authenticated user
    if (profile && profile.id === user.id) {
      // Only pass necessary data to the client component
      const userData = {
        id: profile.id,
        avatarUrl: profile.avatar_url,
        username: profile.username,
        fullName: profile.full_name,
        email: user.email,
        role: profile.role,
      };
      
      return <UserProfileClient isLoading={false} userData={userData} />;
    } else {
      console.error("Profile ID mismatch - security issue detected");
      return <UserProfileClient isLoading={false} userData={null} error="Security validation failed" />;
    }
  } catch (error) {
    console.error("Error in UserProfileServer:", error);
    return <UserProfileClient isLoading={false} userData={null} error="An error occurred" />;
  }
}
