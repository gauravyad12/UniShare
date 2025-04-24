import { MetadataRoute } from 'next';
import { createClient } from "@/utils/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app';
  
  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/universities`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/academic-integrity`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/copyright-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ai-tools`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Get dynamic routes from database
  const supabase = createClient();
  
  // Get public user profiles
  const { data: publicProfiles } = await supabase
    .from('user_profiles')
    .select('username, updated_at')
    .eq('is_verified', true)
    .join('user_settings', { 'user_profiles.id': 'user_settings.user_id' })
    .eq('user_settings.profile_visibility', true);
  
  const profileRoutes = (publicProfiles || []).map(profile => ({
    url: `${baseUrl}/u/${profile.username}`,
    lastModified: new Date(profile.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Get public resources
  const { data: publicResources } = await supabase
    .from('resources')
    .select('id, updated_at')
    .eq('is_approved', true);
  
  const resourceRoutes = (publicResources || []).map(resource => ({
    url: `${baseUrl}/dashboard/resources?view=${resource.id}`,
    lastModified: new Date(resource.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // Get public study groups
  const { data: publicStudyGroups } = await supabase
    .from('study_groups')
    .select('id, updated_at')
    .eq('is_private', false);
  
  const studyGroupRoutes = (publicStudyGroups || []).map(group => ({
    url: `${baseUrl}/dashboard/study-groups?view=${group.id}`,
    lastModified: new Date(group.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  return [...staticRoutes, ...profileRoutes, ...resourceRoutes, ...studyGroupRoutes];
}
