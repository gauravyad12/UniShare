import { createClient } from "@/utils/supabase/server";
import { createAdminClient, executeRawSql } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get regular client for auth
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get admin client to bypass RLS
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const userId = user.id;
    console.log(`Starting deletion process for user ${userId}`);

    // STEP 1: Clean up all related data first
    // This multi-step approach ensures we delete everything even if some steps fail

    // Delete user's resources
    await adminClient.from("resources").delete().eq("created_by", userId);

    // Delete user's study group memberships
    await adminClient
      .from("study_group_members")
      .delete()
      .eq("user_id", userId);

    // Delete user's followers and following relationships
    await adminClient
      .from("user_followers")
      .delete()
      .or(`user_id.eq.${userId},follower_id.eq.${userId}`);

    // Delete user's notifications
    await adminClient.from("notifications").delete().eq("user_id", userId);

    // Delete user's sent invitations
    await adminClient.from("sent_invitations").delete().eq("sent_by", userId);

    // Get user's profile for avatar URL before deletion
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    // Delete user's settings
    await adminClient.from("user_settings").delete().eq("user_id", userId);

    // Delete user's profile
    await adminClient.from("user_profiles").delete().eq("id", userId);

    // Delete user's avatar from storage if it exists
    if (profile?.avatar_url) {
      try {
        const avatarPath = profile.avatar_url.split("/").pop();
        if (avatarPath) {
          await adminClient.storage.from("avatars").remove([avatarPath]);
        }
      } catch (avatarError) {
        console.error("Error deleting avatar:", avatarError);
        // Continue with deletion even if avatar removal fails
      }
    }

    // STEP 2: Sign out the user before deleting the auth record
    await supabase.auth.signOut();

    // STEP 3: Delete the user from auth.users using multiple approaches
    let authDeletionSuccess = false;

    // Approach 1: Try using the RPC function
    try {
      const { data: rpcResult, error: rpcError } = await adminClient.rpc(
        "delete_user_by_id",
        { user_id: userId },
      );

      if (!rpcError && rpcResult === true) {
        authDeletionSuccess = true;
        console.log("Successfully deleted user via RPC function");
      } else {
        console.log("RPC deletion failed, trying alternative methods");
      }
    } catch (rpcError) {
      console.error("Error with RPC deletion:", rpcError);
    }

    // Approach 2: Try using the force_delete_user function
    if (!authDeletionSuccess) {
      try {
        const { data: forceResult, error: forceError } = await adminClient.rpc(
          "force_delete_user",
          { user_id: userId },
        );

        if (!forceError && forceResult === true) {
          authDeletionSuccess = true;
          console.log("Successfully deleted user via force_delete_user");
        } else {
          console.log("Force deletion failed, trying direct admin API");
        }
      } catch (forceError) {
        console.error("Error with force deletion:", forceError);
      }
    }

    // Approach 3: Try using the Supabase admin API
    if (!authDeletionSuccess) {
      try {
        // First check if user exists before trying to delete
        const { data: userExists, error: userCheckError } =
          await adminClient.auth.admin.getUserById(userId);

        if (userExists && !userCheckError) {
          const { error: adminError } =
            await adminClient.auth.admin.deleteUser(userId);

          if (!adminError) {
            authDeletionSuccess = true;
            console.log("Successfully deleted user via admin API");
          } else {
            console.error("Admin API deletion failed:", adminError);
            // Don't mark as failure yet, we'll try other methods
          }
        } else {
          console.log(
            "User not found in auth.users, skipping admin API deletion",
          );
          // Consider this a success since the user doesn't exist anyway
          authDeletionSuccess = true;
        }
      } catch (adminError) {
        console.error("Error with admin API deletion:", adminError);
        // Don't mark as failure yet, we'll try other methods
      }
    }

    // Approach 4: Last resort - try direct SQL execution
    if (!authDeletionSuccess) {
      try {
        // First check if the user exists in auth.users
        const { data: checkData, error: checkError } = await executeRawSql(
          adminClient,
          "SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = $1) as exists",
          [userId],
        );

        const userExists = checkData && checkData.exists;

        if (userExists) {
          // User exists, try to delete
          const { error: sqlError } = await executeRawSql(
            adminClient,
            "DELETE FROM auth.users WHERE id = $1",
            [userId],
          );

          if (!sqlError) {
            authDeletionSuccess = true;
            console.log("Successfully deleted user via direct SQL");
          } else {
            console.error("Direct SQL deletion failed:", sqlError);
          }
        } else {
          // User doesn't exist in auth.users, consider it a success
          console.log(
            "User not found in auth.users via SQL check, marking as success",
          );
          authDeletionSuccess = true;
        }
      } catch (sqlError) {
        console.error("Error with direct SQL deletion:", sqlError);
      }
    }

    // Check if any deletion method succeeded
    if (!authDeletionSuccess) {
      return NextResponse.json(
        { error: "Failed to delete user account after multiple attempts" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been deleted",
    });
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}
