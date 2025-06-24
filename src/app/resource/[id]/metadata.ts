import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resourceId = params.id;
  const baseUrl = process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`;

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
