import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Get regular client for auth
    const supabase = createClient();
    // Get admin client for database operations
    const adminClient = createAdminClient();

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    // Get request data
    const { templateId, templateName, variables, recipient } = await request.json();

    if (!templateId || !recipient) {
      return NextResponse.json(
        { error: "Template ID and recipient email are required" },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient email format" },
        { status: 400 }
      );
    }

    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Replace variables in subject, html_content, and text_content
    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content;

    // Replace all variables in the template
    if (variables && typeof variables === 'object') {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value as string);
        htmlContent = htmlContent.replace(regex, value as string);
        textContent = textContent.replace(regex, value as string);
      });
    }

    // Send test email using Resend
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: "UniShare <test@unishare.app>",
      to: [recipient],
      subject: `[TEST] ${subject}`,
      html: htmlContent,
      text: textContent,
    });

    if (resendError) {
      console.error("Resend API error:", resendError);
      return NextResponse.json(
        { error: `Failed to send test email: ${resendError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailDetails: emailData,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
