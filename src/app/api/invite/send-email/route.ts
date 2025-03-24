import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

// Initialize Resend with API key
// You'll need to add RESEND_API_KEY to your environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { inviteCode, email, senderName } = await request.json();

    // Validate inputs
    if (!inviteCode || !email) {
      return NextResponse.json(
        { error: "Invite code and email are required" },
        { status: 400 },
      );
    }

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Resend API key is not configured" },
        { status: 500 },
      );
    }

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the invite code exists and belongs to the user
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode)
      .eq("created_by", userData.user.id)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 },
      );
    }

    // Create a record of this invitation in the database
    const { data: invitationData, error: invitationError } = await supabase
      .from("sent_invitations")
      .insert({
        invite_code_id: inviteData.id,
        sent_by: userData.user.id,
        sent_to_email: email,
        sent_at: new Date().toISOString(),
        status: "sent",
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error recording invitation:", invitationError);
      return NextResponse.json(
        { error: "Failed to record invitation" },
        { status: 500 },
      );
    }

    // Generate the invitation URL
    const inviteUrl = `${request.headers.get("origin")}/verify-invite?code=${inviteCode}`;

    // Get user profile for sender information
    const { data: senderProfile } = await supabase
      .from("user_profiles")
      .select("full_name, university_name")
      .eq("user_id", userData.user.id)
      .single();

    const displayName =
      senderName || senderProfile?.full_name || "A fellow student";
    const universityName = senderProfile?.university_name || "their university";

    // Send email using Resend
    try {
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: "UniShare <invites@unishare.app>", // Update with your verified domain
        to: [email],
        subject: `${displayName} has invited you to join UniShare!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to UniShare!</h2>
            <p>${displayName} from ${universityName} has invited you to join UniShare, the academic resource sharing platform for university students.</p>
            <p>Your personal invite code is: <strong>${inviteCode}</strong></p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join UniShare Now</a>
            </div>
            <p>This invite link will expire in 7 days.</p>
            <p>If you have any questions, please contact support@unishare.app</p>
          </div>
        `,
      });

      if (resendError) {
        throw new Error(`Failed to send email: ${resendError.message}`);
      }

      return NextResponse.json({
        success: true,
        message: "Invitation email sent successfully",
        invitation: invitationData,
        emailDetails: emailData,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);

      // Update the invitation status to failed
      await supabase
        .from("sent_invitations")
        .update({ status: "failed" })
        .eq("id", invitationData.id);

      return NextResponse.json(
        {
          error:
            "Failed to send invitation email: " +
            (emailError instanceof Error
              ? emailError.message
              : String(emailError)),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in send invitation email API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
