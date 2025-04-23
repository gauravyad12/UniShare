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

    const {
      groupId,
      title,
      description,
      startTime,
      endTime,
      location,
      isOnline,
      meetingLink
    } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    console.log(`Scheduling meeting for group ${groupId} by user ${user.id}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('schedule_study_session_raw', {
        p_study_group_id: groupId,
        p_title: title,
        p_description: description || '',
        p_start_time: startTime,
        p_end_time: endTime,
        p_location: location || '',
        p_is_online: isOnline || false,
        p_meeting_link: meetingLink || '',
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error scheduling meeting: ${sqlError.message}`
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

      if (result.message.includes("must be a member")) {
        return NextResponse.json({
          error: result.message
        }, { status: 403 });
      }

      return NextResponse.json({
        error: result.message
      }, { status: 500 });
    }

    // Get the study group name for the notification
    const { data: studyGroup } = await supabase
      .from('study_groups')
      .select('name')
      .eq('id', groupId)
      .single();

    // Get the creator's username for the notification
    const { data: creatorProfile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const groupName = studyGroup?.name || 'a study group';
    const creatorUsername = creatorProfile?.username || 'Someone';

    try {
      // Get all members of the study group except the creator
      const { data: groupMembers } = await supabase
        .from('study_group_members')
        .select('user_id')
        .eq('study_group_id', groupId)
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
            title: 'New Meeting Scheduled',
            message: `@${creatorUsername} scheduled a new meeting in ${groupName}: "${title}"`,
            type: 'meeting',
            link: `/dashboard/study-groups?view=${groupId}&tab=meetings`,
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

    // Return success response
    return NextResponse.json({
      success: true,
      id: result.id,
      message: result.message || 'Meeting scheduled successfully'
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}
