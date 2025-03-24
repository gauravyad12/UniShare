// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/runtime/manual/getting_started

interface EmailPayload {
  to: string;
  inviteCode: string;
  inviteUrl: string;
  senderName: string;
}

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { to, inviteCode, inviteUrl, senderName } =
      (await req.json()) as EmailPayload;

    // Validate inputs
    if (!to || !inviteCode || !inviteUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        },
      );
    }

    // HTML email template
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .invite-code { background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; text-align: center; font-size: 18px; letter-spacing: 2px; margin: 20px 0; }
          .button { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UniShare</div>
          </div>
          <p>Hello,</p>
          <p>${senderName} has invited you to join UniShare, an exclusive platform for university students to collaborate, share academic resources, and form study groups.</p>
          <p>Your personal invite code is:</p>
          <div class="invite-code">${inviteCode}</div>
          <p>You can use this code to sign up on our platform:</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Join UniShare</a>
          </div>
          <p>Or visit <a href="${inviteUrl}">${inviteUrl}</a> and enter the code manually.</p>
          <p>This invite code will expire in 30 days.</p>
          <p>We're excited to have you join our community!</p>
          <p>Best regards,<br>The UniShare Team</p>
          <div class="footer">
            <p>If you received this email by mistake, please ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text version as fallback
    const textBody = `
      Hello,

      ${senderName} has invited you to join UniShare, an exclusive platform for university students to collaborate, share academic resources, and form study groups.

      Your personal invite code is: ${inviteCode}

      You can use this code to sign up on our platform by visiting: ${inviteUrl}

      This invite code will expire in 30 days.

      We're excited to have you join our community!

      Best regards,
      The UniShare Team

      If you received this email by mistake, please ignore it.
    `;

    // For now, just return success without actually sending an email
    // This is a temporary solution until email sending is properly configured
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email would be sent in production",
        to: to,
        inviteCode: inviteCode,
        inviteUrl: inviteUrl,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({
        error: `Failed to process email request: ${error.message}`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      },
    );
  }
});
