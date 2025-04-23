import { createClient } from "@/utils/supabase/client";

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

/**
 * Fetches all email templates from the database
 * 
 * @returns An array of email templates
 */
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Error fetching email templates:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return [];
  }
}

/**
 * Updates an email template in the database
 * 
 * @param templateId The ID of the template to update
 * @param updates The fields to update
 * @returns Whether the update was successful
 */
export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<EmailTemplate>
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("email_templates")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", templateId);
    
    if (error) {
      console.error("Error updating email template:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating email template:", error);
    return false;
  }
}
