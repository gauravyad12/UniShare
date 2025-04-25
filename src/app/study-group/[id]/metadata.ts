import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const groupId = params.id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Fetch study group data
  const supabase = createClient();
  const { data: studyGroup } = await supabase
    .from('study_groups')
    .select('id, name, description, course_code, created_by, university')
    .eq('id', groupId)
    .single();

  if (!studyGroup) {
    return {
      title: 'Study Group | UniShare',
      description: 'Join study groups with university peers on UniShare.',
    };
  }

  // Get the creator's information
  let creatorName = 'UniShare User';
  if (studyGroup.created_by) {
    const { data: creatorData } = await supabase
      .from('user_profiles')
      .select('full_name, username')
      .eq('id', studyGroup.created_by)
      .single();

    if (creatorData) {
      creatorName = creatorData.full_name || creatorData.username || 'UniShare User';
    }
  }

  const title = studyGroup.name;
  const description = studyGroup.description
    ? `${studyGroup.description.substring(0, 150)}${studyGroup.description.length > 150 ? '...' : ''}`
    : `A study group on UniShare for university students.`;
  const courseCode = studyGroup.course_code ? `${studyGroup.course_code} - ` : '';
  const university = studyGroup.university ? `at ${studyGroup.university}` : '';

  return {
    title: `${courseCode}${title} | Study Group ${university} on UniShare`,
    description,
    openGraph: {
      type: 'website',
      title: `${courseCode}${title} | Study Group ${university} on UniShare`,
      description,
      url: `${baseUrl}/study-group/${groupId}`,
      images: [{
        url: `${baseUrl}/study-group/${groupId}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${title} - Study Group created by ${creatorName}`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${courseCode}${title} | Study Group ${university} on UniShare`,
      description,
      images: [`${baseUrl}/study-group/${groupId}/opengraph-image`],
    },
    alternates: {
      canonical: `${baseUrl}/study-group/${groupId}`,
    },
  };
}
