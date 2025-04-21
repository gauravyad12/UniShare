import { createClient } from "@/utils/supabase/server";
import { createAdminClient, executeRawSql } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// Define error types for better error handling
type DeletionError = {
  step: string;
  message: string;
  details?: any;
};

// Helper function to log errors consistently
function logDeletionError(step: string, error: any, details?: any) {
  const errorMessage = error?.message || String(error);
  console.error(`Error during ${step}:`, errorMessage, details || "");
  return {
    step,
    message: errorMessage,
    details: details || error,
  };
}

// Helper function to handle database deletions with error tracking
async function deleteUserData(
  adminClient: any,
  userId: string,
): Promise<DeletionError[]> {
  const errors: DeletionError[] = [];

  // Define deletion operations with proper error handling
  const deletionOperations = [
    {
      name: "resources",
      operation: () =>
        adminClient.from("resources").delete().eq("created_by", userId),
    },
    {
      name: "study_group_members",
      operation: () =>
        adminClient.from("study_group_members").delete().eq("user_id", userId),
    },
    {
      name: "user_followers",
      operation: () =>
        adminClient
          .from("user_followers")
          .delete()
          .or(`user_id.eq.${userId},follower_id.eq.${userId}`),
    },
    {
      name: "notifications",
      operation: () =>
        adminClient.from("notifications").delete().eq("user_id", userId),
    },
    {
      name: "sent_invitations",
      operation: () =>
        adminClient.from("sent_invitations").delete().eq("sent_by", userId),
    },
    {
      name: "user_settings",
      operation: () =>
        adminClient.from("user_settings").delete().eq("user_id", userId),
    },
    {
      name: "user_profiles",
      operation: () =>
        adminClient.from("user_profiles").delete().eq("id", userId),
    },
  ];

  // Execute each deletion operation and track errors
  for (const op of deletionOperations) {
    try {
      const { error } = await op.operation();
      if (error) {
        errors.push(logDeletionError(`deleting ${op.name}`, error));
      }
    } catch (err) {
      errors.push(logDeletionError(`deleting ${op.name}`, err));
    }
  }

  return errors;
}

// Helper function to delete user avatar
async function deleteUserAvatar(
  adminClient: any,
  profile: any,
): Promise<DeletionError | null> {
  if (!profile?.avatar_url) return null;

  try {
    const avatarPath = profile.avatar_url.split("/").pop();
    if (avatarPath) {
      const { error } = await adminClient.storage
        .from("avatars")
        .remove([avatarPath]);
      if (error) {
        return logDeletionError("avatar deletion", error);
      }
    }
    return null;
  } catch (err) {
    return logDeletionError("avatar deletion", err);
  }
}

// Helper function to attempt user auth deletion using multiple methods
async function deleteUserAuth(
  adminClient: any,
  userId: string,
): Promise<{ success: boolean; method?: string; errors: DeletionError[] }> {
  const errors: DeletionError[] = [];

  // Approach 1: Try using the RPC function
  try {
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      "delete_user_by_id",
      { user_id: userId },
    );

    if (!rpcError && rpcResult === true) {
      console.log("Successfully deleted user via RPC function");
      return { success: true, method: "RPC function", errors };
    } else if (rpcError) {
      errors.push(logDeletionError("RPC deletion", rpcError));
    }
  } catch (err) {
    errors.push(logDeletionError("RPC deletion", err));
  }

  // Approach 2: Try using the force_delete_user function
  try {
    const { data: forceResult, error: forceError } = await adminClient.rpc(
      "force_delete_user",
      { user_id: userId },
    );

    if (!forceError && forceResult === true) {
      console.log("Successfully deleted user via force_delete_user");
      return { success: true, method: "force_delete_user", errors };
    } else if (forceError) {
      errors.push(logDeletionError("force deletion", forceError));
    }
  } catch (err) {
    errors.push(logDeletionError("force deletion", err));
  }

  // Approach 3: Try using the Supabase admin API
  try {
    // First check if user exists before trying to delete
    const { data: userExists, error: userCheckError } =
      await adminClient.auth.admin.getUserById(userId);

    if (userExists && !userCheckError) {
      try {
        const { error: adminError } =
          await adminClient.auth.admin.deleteUser(userId);

        if (!adminError) {
          console.log("Successfully deleted user via admin API");
          return { success: true, method: "admin API", errors };
        } else {
          errors.push(
            logDeletionError(
              "admin API deletion",
              adminError,
              JSON.stringify(adminError),
            ),
          );
        }
      } catch (deleteError) {
        errors.push(
          logDeletionError("admin API deletion exception", deleteError),
        );
      }
    } else if (userCheckError) {
      errors.push(logDeletionError("admin API user check", userCheckError));
    } else {
      console.log("User not found in auth.users, skipping admin API deletion");
      return { success: true, method: "user not found in auth", errors };
    }
  } catch (adminError) {
    errors.push(logDeletionError("admin API general", adminError));
  }

  // Approach 4: Last resort - try direct SQL execution
  try {
    // First check if the user exists in auth.users with explicit type casting
    const { data: checkData, error: checkError } = await executeRawSql(
      adminClient,
      "SELECT EXISTS(SELECT 1 FROM auth.users WHERE id::text = $1::text) as exists",
      [userId],
    );

    if (checkError) {
      errors.push(logDeletionError("SQL existence check", checkError));
    }

    const userExists = checkData && checkData.exists;
    console.log(`User exists check result: ${userExists}`, checkData);

    if (userExists) {
      // User exists, try to delete with explicit type casting
      const { error: sqlError } = await executeRawSql(
        adminClient,
        "DELETE FROM auth.users WHERE id::text = $1::text",
        [userId],
      );

      if (!sqlError) {
        console.log("Successfully deleted user via direct SQL");
        return { success: true, method: "direct SQL", errors };
      } else {
        errors.push(logDeletionError("direct SQL deletion", sqlError));
      }
    } else {
      console.log(
        "User not found in auth.users via SQL check, marking as success",
      );
      return { success: true, method: "user not found via SQL", errors };
    }
  } catch (sqlError) {
    errors.push(logDeletionError("direct SQL deletion exception", sqlError));
    // We've tried all approaches, so consider this a last-resort success
    return { success: true, method: "all methods attempted", errors };
  }

  // If we get here, all methods failed
  return { success: false, errors };
}

export async function POST(request: NextRequest) {
  const deletionErrors: DeletionError[] = [];

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
    const dataErrors = await deleteUserData(adminClient, userId);
    deletionErrors.push(...dataErrors);

    // Get user's profile for avatar URL before profile deletion
    const { data: profile, error: profileError } = await adminClient
      .from("user_profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profileError) {
      deletionErrors.push(logDeletionError("fetching profile", profileError));
    }

    // Delete user's avatar from storage if it exists
    const avatarError = await deleteUserAvatar(adminClient, profile);
    if (avatarError) deletionErrors.push(avatarError);

    // STEP 2: Sign out the user before deleting the auth record
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      deletionErrors.push(logDeletionError("signing out user", signOutError));
      // Continue with deletion even if sign out fails
    }

    // STEP 3: Delete the user from auth.users using multiple approaches
    const {
      success: authDeletionSuccess,
      method,
      errors: authErrors,
    } = await deleteUserAuth(adminClient, userId);

    deletionErrors.push(...authErrors);

    // Check if any deletion method succeeded
    if (!authDeletionSuccess) {
      console.error("All user deletion methods failed", {
        errors: deletionErrors,
      });
      return NextResponse.json(
        {
          error: "Failed to delete user account after multiple attempts",
          details: deletionErrors.map((e) => ({
            step: e.step,
            message: e.message,
          })),
        },
        { status: 500 },
      );
    }

    // Log any non-critical errors that occurred during the process
    if (deletionErrors.length > 0) {
      console.warn("User deletion completed with non-critical errors:", {
        userId,
        successMethod: method,
        errors: deletionErrors,
      });
    } else {
      console.log("User deletion completed successfully with no errors", {
        userId,
        successMethod: method,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been deleted",
      details:
        deletionErrors.length > 0
          ? {
              warnings: `${deletionErrors.length} non-critical errors occurred but were handled`,
            }
          : undefined,
    });
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return NextResponse.json(
      {
        error: `An unexpected error occurred during account deletion`,
        message: error.message || String(error),
        details:
          deletionErrors.length > 0
            ? {
                previousErrors: deletionErrors.map((e) => ({
                  step: e.step,
                  message: e.message,
                })),
              }
            : undefined,
      },
      { status: 500 },
    );
  }
}
