import { MetadataRoute } from 'next';
import { createClient } from "../utils/supabase/server";

// Force dynamic generation
export const dynamic = 'force-dynamic';

// Define types for the database entities used in sitemap generation
type PublicProfile = {
  username: string;
  updated_at: string | null;
};

type PublicResource = {
  id: string;
  updated_at: string | null;
};

type PublicStudyGroup = {
  id: string;
  updated_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
  const currentDate = new Date();

  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/universities`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/academic-integrity`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/copyright-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ai-tools`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },

    {
      url: `${baseUrl}/community-guidelines`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/unblock-websites`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Get dynamic routes from database
  const supabase = createClient();
  let profileRoutes: MetadataRoute.Sitemap = [];
  let resourceRoutes: MetadataRoute.Sitemap = [];
  let studyGroupRoutes: MetadataRoute.Sitemap = [];

  try {
    // Get public user profiles using a two-step approach
    // Step 1: Get user IDs with profile_visibility = true
    const { data: publicSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('profile_visibility', true)
      .limit(1000);

    if (settingsError) {
      console.error('Error fetching public settings for sitemap:', settingsError);
    } else if (publicSettings && publicSettings.length > 0) {
      // Step 2: Get user profiles for those user IDs
      const userIds = publicSettings.map((setting: { user_id: string }) => setting.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('username, updated_at')
        .in('id', userIds)
        .eq('is_verified', true)
        .not('username', 'is', null)
        .limit(1000);

      if (profilesError) {
        console.error('Error fetching profiles for sitemap:', profilesError);
      } else {
        profileRoutes = (profiles || []).map((profile: PublicProfile) => ({
          url: `${baseUrl}/u/${profile.username}`,
          lastModified: new Date(profile.updated_at || currentDate),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      }
    }

    // Get public resources (limit to 1000)
    const { data: publicResources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, updated_at')
      .eq('is_approved', true)
      .limit(1000);

    if (resourcesError) {
      console.error('Error fetching public resources for sitemap:', resourcesError);
    } else {
      resourceRoutes = (publicResources || []).map((resource: PublicResource) => ({
        // Use the public resource route instead of dashboard route
        url: `${baseUrl}/resource/${resource.id}`,
        lastModified: new Date(resource.updated_at || currentDate),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }

    // Get public study groups (limit to 1000)
    const { data: publicStudyGroups, error: groupsError } = await supabase
      .from('study_groups')
      .select('id, updated_at')
      .eq('is_private', false)
      .limit(1000);

    if (groupsError) {
      console.error('Error fetching public study groups for sitemap:', groupsError);
    } else {
      studyGroupRoutes = (publicStudyGroups || []).map((group: PublicStudyGroup) => ({
        url: `${baseUrl}/dashboard/study-groups?view=${group.id}`,
        lastModified: new Date(group.updated_at || currentDate),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error generating dynamic routes for sitemap:', error);
  }

  return [...staticRoutes, ...profileRoutes, ...resourceRoutes, ...studyGroupRoutes];
}
