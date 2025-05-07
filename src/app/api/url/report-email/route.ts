import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { url, resourceId, reason } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, username, university_id')
      .eq('id', user.id)
      .single();

    // Get resource details
    const { data: resource } = await supabase
      .from('resources')
      .select('title')
      .eq('id', resourceId)
      .single();

    // Get university name if available
    let universityName = "Unknown University";
    if (profile?.university_id) {
      const { data: university } = await supabase
        .from('universities')
        .select('name')
        .eq('id', profile.university_id)
        .single();
      
      if (university) {
        universityName = university.name;
      }
    }

    // Prepare email content
    const userName = profile?.full_name || user.email;
    const userUsername = profile?.username || 'N/A';
    const resourceTitle = resource?.title || 'Unknown Resource';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e11d48;">Malicious URL Report</h2>
        <p><strong>Resource:</strong> ${resourceTitle} (ID: ${resourceId})</p>
        <p><strong>Reported URL:</strong> <a href="${url}" style="color: #e11d48;">${url}</a></p>
        <p><strong>Reported by:</strong> ${userName} (${userUsername})</p>
        <p><strong>User Email:</strong> ${user.email}</p>
        <p><strong>University:</strong> ${universityName}</p>
        
        ${reason ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
          <p><strong>Reason for reporting:</strong></p>
          <p style="white-space: pre-line;">${reason}</p>
        </div>
        ` : ''}
        
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          This report was sent from the UniShare URL reporting system.
        </p>
      </div>
    `;

    const emailText = `
Malicious URL Report

Resource: ${resourceTitle} (ID: ${resourceId})
Reported URL: ${url}
Reported by: ${userName} (${userUsername})
User Email: ${user.email}
University: ${universityName}

${reason ? `Reason for reporting:
${reason}` : ''}

This report was sent from the UniShare URL reporting system.
    `.trim();

    // Send email using Resend
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: "UniShare <reports@unishare.app>",
      to: ["kiprasvitas@icloud.com"], // Admin email
      subject: `Malicious URL Report: ${resourceTitle}`,
      html: emailHtml,
      text: emailText,
      reply_to: user.email,
    });

    if (resendError) {
      console.error("Resend API error:", resendError);
      return NextResponse.json(
        { error: "Failed to send report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "URL reported successfully",
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
