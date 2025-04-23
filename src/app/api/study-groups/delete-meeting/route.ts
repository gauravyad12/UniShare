import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    console.log(`Deleting meeting ${meetingId} by user ${user.id}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('delete_study_session_raw', {
        p_session_id: meetingId,
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error deleting meeting: ${sqlError.message}`
      }, { status: 500 });
    }

    // Parse the JSON result
    let result;
    try {
      if (rawResult) {
        result = JSON.parse(rawResult);
        console.log('Parsed result:', result);
      } else {
        console.error('No result returned from SQL function');
        return NextResponse.json({
          error: "No result returned from SQL function"
        }, { status: 500 });
      }
    } catch (parseError) {
      console.error("Error parsing SQL result:", parseError);
      console.log("Raw result:", rawResult);
      return NextResponse.json({
        error: `Failed to parse result: ${parseError.message}`
      }, { status: 500 });
    }

    // Check for errors
    if (!result.success) {
      console.error("Error from SQL function:", result.message);

      if (result.message.includes("not found")) {
        return NextResponse.json({
          error: result.message
        }, { status: 404 });
      }

      if (result.message.includes("Only the creator")) {
        return NextResponse.json({
          error: result.message
        }, { status: 403 });
      }

      return NextResponse.json({
        error: result.message
      }, { status: 500 });
    }

    // Get meeting details for the notification before it's deleted
    // We need to do this before the delete operation, but the SQL function already deleted it
    // So we'll use the data from the result if available
    if (result.meeting_data) {
      try {
        const meetingData = result.meeting_data;

        // Get the study group details
        const { data: studyGroup } = await supabase
          .from('study_groups')
          .select('name')
          .eq('id', meetingData.study_group_id)
          .single();

        // Get the deleter's username for the notification
        const { data: deleterProfile } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        const groupName = studyGroup?.name || 'a study group';
        const deleterUsername = deleterProfile?.username || 'Someone';
        const meetingTitle = meetingData.title || 'a meeting';

        // Get all members of the study group except the deleter
        const { data: groupMembers } = await supabase
          .from('study_group_members')
          .select('user_id')
          .eq('study_group_id', meetingData.study_group_id)
          .neq('user_id', user.id);

        if (groupMembers && groupMembers.length > 0) {
          // Get members who have study group notifications enabled
          const memberIds = groupMembers.map(member => member.user_id);

          // Get user settings to check notification preferences
          const { data: userSettings } = await supabase
            .from('user_settings')
            .select('user_id, study_group_notifications')
            .in('user_id', memberIds)
            .eq('study_group_notifications', true);

          // Create notifications for members with notifications enabled
          if (userSettings && userSettings.length > 0) {
            const notifications = userSettings.map(setting => ({
              user_id: setting.user_id,
              title: 'Meeting Cancelled',
              message: `@${deleterUsername} cancelled the meeting "${meetingTitle}" in ${groupName}`,
              type: 'meeting',
              link: `/dashboard/study-groups?view=${meetingData.study_group_id}&tab=meetings`,
              created_at: new Date().toISOString(),
              is_read: false,
              actor_id: user.id
            }));

            // Insert notifications
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert(notifications);

            if (notificationError) {
              console.error('Error creating notifications:', notificationError);
              // Continue even if notification creation fails
            }
          }
        }
      } catch (notificationError) {
        console.error('Error in notification process:', notificationError);
        // Continue even if notification process fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: result.message || 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}
