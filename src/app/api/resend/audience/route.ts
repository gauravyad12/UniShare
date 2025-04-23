import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Get audience ID from environment variable
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

// Add a contact to the Resend audience
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!AUDIENCE_ID) {
      console.error("RESEND_AUDIENCE_ID environment variable is not set");
      return NextResponse.json(
        { error: "Resend audience ID is not configured" },
        { status: 500 }
      );
    }

    // Get request body
    const { email, fullName, userId, fromServer, unsubscribe } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // If fromServer is true, we don't need to check if the user is the authenticated user
    if (!fromServer && user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 401 }
      );
    }

    try {
      // First get all contacts in the audience
      const listResponse = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      let allContacts = [];
      try {
        const listData = await listResponse.json();
        allContacts = listData.data || [];
      } catch (error) {
        console.error('Error parsing contacts list:', error);
      }

      // Check if the contact already exists in the list
      const existingContact = allContacts.find(contact =>
        contact && contact.email && contact.email.toLowerCase() === email.toLowerCase()
      );

      // Set checkResponse.ok based on whether the contact exists
      const checkResponse = {
        ok: !!existingContact,
        status: existingContact ? 200 : 404
      };

      // Parse the full name into first and last name
      const firstName = fullName?.split(' ')[0] || '';
      const lastName = fullName?.split(' ').slice(1).join(' ') || '';

      let responseData;
      let response;

      // If contact exists, update subscription status
      if (checkResponse.ok) {
        // Update the contact's subscription status
        response = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            unsubscribed: unsubscribe === true ? true : false,
          }),
        });

        try {
          responseData = await response.json();
        } catch (error) {
          console.error('Error parsing response JSON:', error);
          responseData = { message: await response.text() || 'No response body' };
        }
      }
      // If contact doesn't exist, create it
      else {
        // Create the contact
        response = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            unsubscribed: unsubscribe === true ? true : false,
          }),
        });

        try {
          responseData = await response.json();
        } catch (error) {
          console.error('Error parsing response JSON:', error);
          responseData = { message: await response.text() || 'No response body' };
        }
      }

      // Check if the response indicates success
      if (response && response.ok) {
        return NextResponse.json({
          success: true,
          message: checkResponse.ok ? "Contact updated in audience successfully" : "Contact added to audience successfully",
          data: responseData,
        });
      }
      // Check if the error is because the contact already exists
      else if (response && response.status === 409 || (responseData && responseData.message && responseData.message.includes('already exists'))) {
        return NextResponse.json({
          success: true,
          message: "Contact already exists in audience",
          alreadyExists: true,
        });
      }
      // Check if we're being rate limited
      else if (response && response.status === 429 || (responseData && responseData.message && responseData.message.includes('rate limit'))) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      // Some other error occurred
      else {
        return NextResponse.json(
          { error: `Failed to ${checkResponse.ok ? 'update' : 'add'} contact in audience: ${responseData && responseData.message ? responseData.message : 'Unknown error'}` },
          { status: response ? response.status : 500 }
        );
      }
    } catch (error) {
      console.error("Error adding contact to Resend audience:", error);
      return NextResponse.json(
        { error: "Failed to add contact to audience" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check if a user is in the Resend audience
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!AUDIENCE_ID) {
      console.error("RESEND_AUDIENCE_ID environment variable is not set");
      return NextResponse.json(
        { error: "Resend audience ID is not configured" },
        { status: 500 }
      );
    }

    // Get user email from Supabase
    const email = user.email;
    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    try {
      // Get all contacts in the audience
      const response = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      // Parse the response
      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        return NextResponse.json(
          { error: 'Error parsing response from Resend API' },
          { status: 500 }
        );
      }

      // Check if the response is valid
      if (!response.ok) {
        // Check if we're being rate limited
        if (response.status === 429 || (responseData.message && responseData.message.includes('rate limit'))) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429 }
          );
        }

        // Some other error occurred
        return NextResponse.json(
          { error: `Failed to get contacts from audience: ${responseData.message || 'Unknown error'}` },
          { status: response.status || 500 }
        );
      }

      // Extract the contacts from the response
      const contacts = responseData.data || [];

      // Check if the user's email is in the list
      const existingContact = contacts.find(contact =>
        contact && contact.email && contact.email.toLowerCase() === email.toLowerCase()
      );

      if (existingContact) {
        return NextResponse.json({
          exists: true,
          message: "Contact found in audience",
          data: existingContact
        });
      } else {
        return NextResponse.json({
          exists: false,
          message: "Contact not found in audience"
        });
      }
    } catch (error) {
      console.error("Error checking contact in Resend audience:", error);
      return NextResponse.json(
        { error: "Failed to check contact in audience" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
