import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Detects university from email domain
 * @param {string} email - The email address to check
 * @returns {Promise<{id: string, name: string} | null>} - University info or null if not found
 */
export async function detectUniversityFromEmail(email: string) {
  try {
    const emailDomain = email.split("@")[1];
    if (!emailDomain) return null;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("universities")
      .select("id, name, domain");

    if (error || !data) return null;

    // Find a university with a matching domain (handling comma-separated domains, case-insensitive)
    const matchedUniversity = data.find((university) => {
      const domains = university.domain
        .split(",")
        .map((d) => d.trim().toLowerCase());
      return domains.includes(emailDomain.toLowerCase());
    });

    return matchedUniversity || null;
  } catch (error) {
    console.error("Error detecting university:", error);
    return null;
  }
}
