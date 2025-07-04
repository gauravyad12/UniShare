import { createClient } from "@/utils/supabase/server";

export interface SubscriptionStatus {
  hasScholarPlus: boolean;
  subscriptionType: 'regular' | 'temporary' | 'none';
  temporaryAccess?: {
    expires_at: string;
    points_spent: number;
    access_duration_hours: number;
  };
  remainingHours?: number;
}

export async function checkScholarPlusAccess(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient();
  
  try {
    // Check for regular subscription first
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subscription) {
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = subscription.status === "active" &&
                      (!subscription.current_period_end ||
                       subscription.current_period_end > currentTime);

      if (isValid) {
        return {
          hasScholarPlus: true,
          subscriptionType: 'regular'
        };
      }
    }

    // Check for temporary access
    const { data: temporaryAccess } = await supabase
      .from("temporary_scholar_access")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (temporaryAccess) {
      const expiresAt = new Date(temporaryAccess.expires_at);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

      return {
        hasScholarPlus: true,
        subscriptionType: 'temporary',
        temporaryAccess: {
          expires_at: temporaryAccess.expires_at,
          points_spent: temporaryAccess.points_spent,
          access_duration_hours: temporaryAccess.access_duration_hours
        },
        remainingHours
      };
    }

    return {
      hasScholarPlus: false,
      subscriptionType: 'none'
    };

  } catch (error) {
    console.error("Error checking Scholar+ access:", error);
    return {
      hasScholarPlus: false,
      subscriptionType: 'none'
    };
  }
}

// Helper function that returns just a boolean for simpler API checks
export async function hasScholarPlusAccess(userId: string): Promise<boolean> {
  const result = await checkScholarPlusAccess(userId);
  return result.hasScholarPlus;
}

// For use with custom supabase instances (like in edge functions)
export async function hasScholarPlusAccessWithCustomSupabase(supabase: any, userId: string): Promise<boolean> {
  try {
    // Check for regular subscription first
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subscription) {
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = subscription.status === "active" &&
                      (!subscription.current_period_end ||
                       subscription.current_period_end > currentTime);

      if (isValid) {
        return true;
      }
    }

    // Check for temporary access
    const { data: temporaryAccess } = await supabase
      .from("temporary_scholar_access")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    return !!temporaryAccess;

  } catch (error) {
    console.error("Error checking Scholar+ access:", error);
    return false;
  }
}

// Alternative function using the stored procedure for better performance
export async function checkScholarPlusAccessStoredProc(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data: hasAccess } = await supabase
      .rpc('has_scholar_plus_access', { p_user_id: userId });

    return hasAccess || false;
  } catch (error) {
    console.error("Error checking Scholar+ access:", error);
    return false;
  }
} 