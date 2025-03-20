import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all related data first
    // This is important to do before deleting the user to maintain referential integrity

    // 1. Delete user's resources
    const { error: resourcesError } = await supabase
      .from("resources")
      .delete()
      .eq("author_id", user.id);

    if (resourcesError) {
      console.error("Error deleting user resources:", resourcesError);
    }

    // 2. Delete user's study group memberships
    const { error: membershipError } = await supabase
      .from("study_group_members")
      .delete()
      .eq("user_id", user.id);

    if (membershipError) {
      console.error("Error deleting study group memberships:", membershipError);
    }

    // 3. Get study groups created by the user
    const { data: userStudyGroups } = await supabase
      .from("study_groups")
      .select("id")
      .eq("creator_id", user.id);

    // 4. Delete members of user's study groups
    if (userStudyGroups && userStudyGroups.length > 0) {
      const groupIds = userStudyGroups.map((group) => group.id);

      const { error: groupMembersError } = await supabase
        .from("study_group_members")
        .delete()
        .in("study_group_id", groupIds);

      if (groupMembersError) {
        console.error("Error deleting study group members:", groupMembersError);
      }

      // 5. Delete the study groups created by the user
      const { error: studyGroupsError } = await supabase
        .from("study_groups")
        .delete()
        .eq("creator_id", user.id);

      if (studyGroupsError) {
        console.error("Error deleting study groups:", studyGroupsError);
      }
    }

    // 6. Delete user's followers relationships
    const { error: followersError } = await supabase
      .from("user_followers")
      .delete()
      .eq("user_id", user.id);

    if (followersError) {
      console.error("Error deleting user followers:", followersError);
    }

    // 7. Delete user's following relationships
    const { error: followingError } = await supabase
      .from("user_followers")
      .delete()
      .eq("follower_id", user.id);

    if (followingError) {
      console.error("Error deleting user following:", followingError);
    }

    // 8. Delete user's settings
    const { error: settingsError } = await supabase
      .from("user_settings")
      .delete()
      .eq("user_id", user.id);

    if (settingsError) {
      console.error("Error deleting user settings:", settingsError);
    }

    // 9. Delete user's profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
    }

    // 10. Delete user's avatar from storage if it exists
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract the file path from the URL
      const avatarPath = profile.avatar_url.split("/").pop();
      if (avatarPath) {
        const { error: storageError } = await supabase.storage
          .from("avatars")
          .remove([avatarPath]);

        if (storageError) {
          console.error("Error deleting avatar from storage:", storageError);
        }
      }
    }

    // 11. Finally, delete the user from auth using the custom function
    // This uses the SQL function we created that has the necessary permissions
    const { error: authError } = await supabase.rpc("delete_user_by_id", {
      user_id: user.id,
    });

    if (authError) {
      console.error("Error deleting user from auth:", authError);
      return NextResponse.json(
        { error: `Failed to delete user: ${authError.message}` },
        { status: 500 },
      );
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}
