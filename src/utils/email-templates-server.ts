import { createClient } from "@/utils/supabase/server";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  description: string;
  variables: { variables: string[] };
  created_at: string;
  updated_at: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Fetches an email template from the database and renders it with the provided variables
 * Server-side version that uses the server Supabase client
 *
 * @param templateName The name of the template to fetch
 * @param variables An object containing the variables to replace in the template
 * @returns The rendered email template with variables replaced
 */
export async function renderEmailTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<RenderedEmail | null> {
  try {
    // Create a direct database query to fetch the template
    // This bypasses any potential issues with the Supabase client
    const supabase = createClient();

    // Use a raw SQL query to fetch the template
    console.log(`Fetching email template "${templateName}" via RPC...`);
    const { data, error } = await supabase.rpc('get_email_template_by_name', {
      template_name: templateName
    });

    // Log the result for debugging
    console.log("RPC result:", {
      success: !error,
      hasData: !!data,
      dataType: data ? typeof data : 'undefined',
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 0
    });

    if (error) {
      console.error(`Error fetching email template "${templateName}" via RPC:`, error);

      // Fallback to direct query
      console.log("Attempting fallback to direct query...");
      try {
        const { data: directData, error: directError } = await supabase
          .from("email_templates")
          .select("*")
          .eq("name", templateName);

        console.log("Direct query result:", {
          success: !directError,
          hasData: !!directData,
          isArray: Array.isArray(directData),
          length: Array.isArray(directData) ? directData.length : 0
        });

        if (directError || !directData || directData.length === 0) {
          console.error(`Error in fallback query for template "${templateName}":`, directError);

          // Try one more direct SQL query as a last attempt
          console.log("Attempting direct SQL query...");
          const { data: sqlData, error: sqlError } = await supabase.rpc('get_template_by_name_sql', {
            p_template_name: templateName
          });

          if (sqlError || !sqlData || (Array.isArray(sqlData) && sqlData.length === 0)) {
            console.error(`Error in SQL query for template "${templateName}":`, sqlError);

            // Last resort: hardcoded template for invite_email
            if (templateName === "invite_email") {
              console.log("Using hardcoded invite_email template as last resort");
              return renderHardcodedInviteTemplate(variables);
            }

            return null;
          }

          // Use the SQL query result
          const template = Array.isArray(sqlData) ? sqlData[0] : sqlData;
          console.log(`Using template from SQL query: ${template.name}`);
          return renderTemplateWithVariables(template, variables);
        }

        // Use the first template from direct query
        const template = directData[0];
        console.log(`Using template from direct query: ${template.name}`);
        return renderTemplateWithVariables(template, variables);
      } catch (fallbackError) {
        console.error("Error in fallback query:", fallbackError);

        // Last resort: hardcoded template for invite_email
        if (templateName === "invite_email") {
          console.log("Using hardcoded invite_email template after fallback error");
          return renderHardcodedInviteTemplate(variables);
        }

        return null;
      }
    }

    if (!data) {
      console.error(`No template found with name "${templateName}"`);

      // Last resort: hardcoded template for invite_email
      if (templateName === "invite_email") {
        console.log("Using hardcoded invite_email template as last resort");
        return renderHardcodedInviteTemplate(variables);
      }

      return null;
    }

    // Handle the case where data is an array (from the RPC function)
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.error(`No template found with name "${templateName}" (empty array)`);

        // Last resort: hardcoded template for invite_email
        if (templateName === "invite_email") {
          console.log("Using hardcoded invite_email template as last resort (empty array)");
          return renderHardcodedInviteTemplate(variables);
        }

        return null;
      }

      // Use the first template from the array
      console.log(`Using template from array: ${data[0].name}`);
      return renderTemplateWithVariables(data[0], variables);
    }

    // Handle the case where data is a single object
    console.log(`Using template: ${data.name}`);
    return renderTemplateWithVariables(data, variables);
  } catch (error) {
    console.error("Error rendering email template:", error);

    // Last resort: hardcoded template for invite_email
    if (templateName === "invite_email") {
      console.log("Using hardcoded invite_email template after error");
      return renderHardcodedInviteTemplate(variables);
    }

    return null;
  }
}

/**
 * Helper function to render a template with variables
 */
function renderTemplateWithVariables(
  template: EmailTemplate,
  variables: Record<string, string>
): RenderedEmail {
  // Replace variables in the template
  let subject = template.subject;
  let htmlContent = template.html_content;
  let textContent = template.text_content;

  // Make sure all template parts exist
  subject = subject || 'Invitation to join UniShare';

  // Ensure we have at least one content type
  if (!htmlContent && !textContent) {
    // If both are missing, use a default template
    htmlContent = `
      <html>
        <body>
          <h1>You've been invited to join UniShare!</h1>
          <p>Someone has invited you to join UniShare, the academic resource sharing platform for university students.</p>
          <p>Use invite code: <strong>{{inviteCode}}</strong></p>
          <p><a href="{{inviteUrl}}">Click here to join</a></p>
        </body>
      </html>
    `;
    textContent = 'You\'ve been invited to join UniShare! Use invite code: {{inviteCode}}. Join here: {{inviteUrl}}';
  } else if (!htmlContent) {
    // If HTML is missing but text exists, create HTML from text
    htmlContent = `<html><body><pre>${textContent}</pre></body></html>`;
  } else if (!textContent) {
    // If text is missing but HTML exists, create text from HTML
    textContent = htmlContent.replace(/<[^>]*>/g, '');
  }

  // Replace all variables in the template
  Object.entries(variables || {}).forEach(([key, value]) => {
    if (key && value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const safeValue = String(value || '');
      subject = subject.replace(regex, safeValue);
      htmlContent = htmlContent.replace(regex, safeValue);
      textContent = textContent.replace(regex, safeValue);
    }
  });

  // Final validation to ensure non-empty content
  if (!htmlContent.trim()) {
    htmlContent = `<p>You've been invited to join UniShare!</p>`;
  }

  if (!textContent.trim()) {
    textContent = `You've been invited to join UniShare!`;
  }

  return {
    subject,
    html: htmlContent,
    text: textContent
  };
}

/**
 * Hardcoded invite email template as a last resort
 */
function renderHardcodedInviteTemplate(variables: Record<string, string> = {}): RenderedEmail {
  // Safely extract variables with fallbacks
  const senderName = variables?.senderName || 'Someone';
  const universityName = variables?.universityName || 'their university';
  const inviteCode = variables?.inviteCode || '[Invite Code]';
  const inviteUrl = variables?.inviteUrl || `https://${process.env.NEXT_PUBLIC_DOMAIN}`;

  const subject = `${senderName} has invited you to join UniShare!`;

  const text = `
You've been invited to UniShare!

${senderName} from ${universityName} has invited you to join UniShare, the academic resource sharing platform for university students.

Your personal invite code is: ${inviteCode}

Join UniShare now: ${inviteUrl}

This invite link will expire in 7 days.

If you have any questions, please contact support@unishare.app
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>UniShare Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #4f46e5;">UniShare</h1>
    <p>Connect. Share. Succeed.</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2>You've been invited to UniShare!</h2>
    <p>${senderName} from ${universityName} has invited you to join UniShare, the academic resource sharing platform for university students.</p>
    <p>Your personal invite code is: <strong>${inviteCode}</strong></p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join UniShare Now</a>
    </div>
  </div>

  <div style="margin-bottom: 20px;">
    <h3>Unlock these exclusive benefits:</h3>
    <ul>
      <li><strong>Study Materials</strong> - Access and share course notes, study guides, and past exams</li>
      <li><strong>Study Groups</strong> - Connect with peers to discuss course topics and assignments</li>
      <li><strong>Resource Sharing</strong> - Share and discover academic resources with students from your university</li>
    </ul>
    <p>This invite link will expire in 7 days.</p>
  </div>

  <div style="font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
    <p>&copy; 2025 UniShare. All rights reserved.</p>
    <p>If you have any questions, please contact support@unishare.app</p>
  </div>
</body>
</html>
  `.trim();

  return {
    subject,
    text,
    html
  };
}
