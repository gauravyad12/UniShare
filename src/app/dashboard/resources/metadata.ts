import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

type Props = {
  searchParams: { view?: string };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // We can't get the origin from the request in metadata.ts, so we'll use the environment variable
  // This is a limitation of Next.js metadata API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // If viewing a specific resource
  if (searchParams.view) {
    const resourceId = searchParams.view;

    // Fetch resource data
    const supabase = createClient();
    const { data: resource } = await supabase
      .from('resources')
      .select('title, description, resource_type, course_code, author:user_profiles(username, full_name)')
      .eq('id', resourceId)
      .single();

    if (!resource) {
      return {
        title: 'Resource | UniShare',
        description: 'Access academic resources shared by university students on UniShare.',
      };
    }

    const title = resource.title;
    const description = resource.description
      ? `${resource.description.substring(0, 150)}${resource.description.length > 150 ? '...' : ''}`
      : `A ${resource.resource_type} shared on UniShare for university students.`;
    const courseCode = resource.course_code ? `${resource.course_code} - ` : '';
    const resourceType = resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1);
    const authorName = resource.author?.full_name || resource.author?.username || 'UniShare User';

    return {
      title: `${courseCode}${title} | ${resourceType} on UniShare`,
      description,
      openGraph: {
        type: 'article',
        title: `${courseCode}${title} | ${resourceType} on UniShare`,
        description,
        url: `${baseUrl}/resource/${resourceId}`,
        images: [{
          url: `${baseUrl}/resource/${resourceId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} - ${resourceType} shared by ${authorName}`,
        }],
        authors: [authorName],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${courseCode}${title} | ${resourceType} on UniShare`,
        description,
        images: [`${baseUrl}/resource/${resourceId}/opengraph-image`],
      },
      alternates: {
        canonical: `${baseUrl}/resource/${resourceId}`,
      },
    };
  }

  // Default metadata for the resources page
  return {
    title: 'Resources | UniShare',
    description: 'Browse and share academic resources with your university peers.',
    openGraph: {
      type: 'website',
      title: 'Resources | UniShare',
      description: 'Browse and share academic resources with your university peers.',
      url: `${baseUrl}/dashboard/resources`,
      images: [{
        url: `${baseUrl}/api/og/default`,
        width: 1200,
        height: 630,
        alt: 'UniShare Resources',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Resources | UniShare',
      description: 'Browse and share academic resources with your university peers.',
      images: [`${baseUrl}/api/og/default`],
    },
    alternates: {
      canonical: `${baseUrl}/dashboard/resources`,
    },
  };
}
