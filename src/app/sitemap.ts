import { MetadataRoute } from 'next';
import { createClient } from "@/utils/supabase/server";

// Force dynamic generation
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app';
  const currentDate = new Date();

  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/universities`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/academic-integrity`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/copyright-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ai-tools`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    {
      url: `${baseUrl}/community-guidelines`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/unblock-websites`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Get dynamic routes from database
  const supabase = createClient();
  let profileRoutes = [];
  let resourceRoutes = [];
  let studyGroupRoutes = [];

  try {
    // Get public user profiles (limit to 1000 to prevent sitemap from becoming too large)
    const { data: publicProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('username, updated_at')
      .eq('is_verified', true)
      .join('user_settings', { 'user_profiles.id': 'user_settings.user_id' })
      .eq('user_settings.profile_visibility', true)
      .limit(1000);

    if (profilesError) {
      console.error('Error fetching public profiles for sitemap:', profilesError);
    } else {
      profileRoutes = (publicProfiles || []).map(profile => ({
        url: `${baseUrl}/u/${profile.username}`,
        lastModified: new Date(profile.updated_at || currentDate),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
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
      resourceRoutes = (publicResources || []).map(resource => ({
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
      studyGroupRoutes = (publicStudyGroups || []).map(group => ({
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
