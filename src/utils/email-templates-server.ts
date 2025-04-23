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
    const supabase = createClient();
    
    // Fetch the template from the database
    const { data: template, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", templateName)
      .single();
    
    if (error || !template) {
      console.error(`Error fetching email template "${templateName}":`, error);
      return null;
    }
    
    // Replace variables in the template
    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content;
    
    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
      textContent = textContent.replace(regex, value);
    });
    
    return {
      subject,
      html: htmlContent,
      text: textContent
    };
  } catch (error) {
    console.error("Error rendering email template:", error);
    return null;
  }
}
