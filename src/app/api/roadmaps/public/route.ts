import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch public roadmaps with their semesters and courses
    const { data: roadmaps, error } = await supabase
      .from('degree_roadmaps')
      .select(`
        id,
        name,
        major,
        total_credits,
        completed_credits,
        expected_graduation,
        current_gpa,
        show_gpa,
        is_public,
        user_id,
        created_at,
        updated_at,
        universities (
          name
        ),
        roadmap_semesters (
          id,
          name,
          year,
          season,
          roadmap_courses (
            id,
            course_code,
            course_name,
            credits,
            status,
            grade,
            prerequisites,
            description,
            difficulty_rating,
            professor,
            professor_data
          )
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public roadmaps:', error);
      return NextResponse.json({ error: 'Failed to fetch public roadmaps' }, { status: 500 });
    }

    // Transform the data to match frontend format
    const transformedRoadmaps = (roadmaps || []).map((roadmap: any) => ({
      id: roadmap.id,
      name: roadmap.name,
      major: roadmap.major,
      university: roadmap.universities?.name || 'Unknown University',
      totalCredits: roadmap.total_credits,
      completedCredits: roadmap.completed_credits,
      expectedGraduation: roadmap.expected_graduation,
      gpa: roadmap.show_gpa ? parseFloat(roadmap.current_gpa || '0') : 0,
      showGpa: roadmap.show_gpa,
      isPublic: roadmap.is_public,
      createdBy: roadmap.user_id,
      createdAt: roadmap.created_at,
      updatedAt: roadmap.updated_at,
      semesters: (roadmap.roadmap_semesters || []).map((semester: any) => ({
        id: semester.id,
        name: semester.name,
        year: semester.year,
        season: semester.season as 'Fall' | 'Spring' | 'Summer',
        totalCredits: (semester.roadmap_courses || []).reduce((sum: number, course: any) => sum + (course.credits || 0), 0),
        courses: (semester.roadmap_courses || []).map((course: any) => ({
          id: course.id,
          code: course.course_code,
          name: course.course_name,
          credits: course.credits,
          semester: semester.name,
          year: semester.year,
          status: course.status as 'planned' | 'in-progress' | 'completed' | 'failed',
          grade: course.grade,
          prerequisites: course.prerequisites ? JSON.parse(course.prerequisites) : [],
          description: course.description,
          difficulty: course.difficulty_rating,
          professor: course.professor,
          professor_data: course.professor_data ? JSON.parse(course.professor_data) : null
        }))
      }))
    }));

    return NextResponse.json({ 
      success: true, 
      roadmaps: transformedRoadmaps 
    });

  } catch (error) {
    console.error('Error in public roadmaps API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 