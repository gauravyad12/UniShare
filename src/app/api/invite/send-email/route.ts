import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { renderEmailTemplate } from "@/utils/email-templates-server";

export const dynamic = "force-dynamic";


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

    // Prepare variables for template
    const templateVariables = {
      senderName: displayName,
      universityName: universityName,
      inviteCode: inviteCode,
      inviteUrl: inviteUrl
    };

    // Render the email template and send it
    try {
      const renderedEmail = await renderEmailTemplate("invite_email", templateVariables);

      if (!renderedEmail) {
        console.error("Error rendering email template: Template not found or rendering failed");
        return NextResponse.json(
          { error: "Failed to render email template" },
          { status: 500 }
        );
      }

      // Log the rendered email for debugging
      console.log("Rendered email:", {
        subject: renderedEmail.subject,
        htmlLength: renderedEmail.html?.length || 0,
        textLength: renderedEmail.text?.length || 0,
        subjectContent: renderedEmail.subject
      });

      // Process the subject to ensure variables are replaced
      let emailSubject = renderedEmail.subject;
      if (emailSubject && emailSubject.includes('{{')) {
        // If variables weren't replaced in the template, do it manually here
        emailSubject = emailSubject
          .replace(/{{senderName}}/g, displayName)
          .replace(/{{universityName}}/g, universityName)
          .replace(/{{inviteCode}}/g, inviteCode)
          .replace(/{{inviteUrl}}/g, inviteUrl);
      }

      // Ensure we have either html or text content
      const emailHtml = renderedEmail.html || `<p>${renderedEmail.text || 'You have been invited to join UniShare!'}</p>`;
      const emailText = renderedEmail.text || renderedEmail.html?.replace(/<[^>]*>/g, '') || 'You have been invited to join UniShare!';

      // Final subject fallback
      const finalSubject = emailSubject || `${displayName} has invited you to join UniShare!`;

      console.log("Final email details:", {
        subject: finalSubject,
        to: email,
        htmlLength: emailHtml.length,
        textLength: emailText.length
      });

      // Send email using Resend
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: "UniShare <invites@unishare.app>", // Update with your verified domain
        to: [email],
        subject: finalSubject,
        html: emailHtml,
        text: emailText
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
