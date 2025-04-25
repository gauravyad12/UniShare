import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

type Props = {
  searchParams: { view?: string };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app';
  
  // If viewing a specific study group
  if (searchParams.view) {
    const groupId = searchParams.view;
    
    // Fetch study group data
    const supabase = createClient();
    const { data: group } = await supabase
      .from('study_groups')
      .select('title, description, course_code, created_by')
      .eq('id', groupId)
      .single();
    
    if (!group) {
      return {
        title: 'Study Group | UniShare',
        description: 'Join study groups on UniShare to collaborate with fellow students.',
      };
    }
    
    const title = group.title;
    const description = group.description 
      ? `${group.description.substring(0, 150)}${group.description.length > 150 ? '...' : ''}`
      : `Join this study group on UniShare to collaborate with fellow students.`;
    const courseCode = group.course_code ? `${group.course_code} - ` : '';
    
    return {
      title: `${courseCode}${title} | UniShare Study Group`,
      description,
      openGraph: {
        type: 'website',
        title: `${courseCode}${title} | UniShare Study Group`,
        description,
        url: `${baseUrl}/dashboard/study-groups?view=${groupId}`,
        images: [{
          url: `${baseUrl}/api/og/study-group?id=${groupId}`,
          width: 1200,
          height: 630,
          alt: `${title} Study Group on UniShare`,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${courseCode}${title} | UniShare Study Group`,
        description,
        images: [`${baseUrl}/api/og/study-group?id=${groupId}`],
      },
      alternates: {
        canonical: `${baseUrl}/dashboard/study-groups?view=${groupId}`,
      },
    };
  }
  
  // Default metadata for the study groups page
  return {
    title: 'Study Groups | UniShare',
    description: 'Join or create study groups to collaborate with fellow students at your university.',
    openGraph: {
      type: 'website',
      title: 'Study Groups | UniShare',
      description: 'Join or create study groups to collaborate with fellow students at your university.',
      url: `${baseUrl}/dashboard/study-groups`,
      images: [{
        url: `${baseUrl}/api/og/default`,
        width: 1200,
        height: 630,
        alt: 'UniShare Study Groups',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Study Groups | UniShare',
      description: 'Join or create study groups to collaborate with fellow students at your university.',
      images: [`${baseUrl}/api/og/default`],
    },
    alternates: {
      canonical: `${baseUrl}/dashboard/study-groups`,
    },
  };
}
