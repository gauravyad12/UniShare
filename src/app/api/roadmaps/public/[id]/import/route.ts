import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roadmapId = params.id;

    // Fetch the public roadmap with all its data
    const { data: sourceRoadmap, error: fetchError } = await supabase
      .from('degree_roadmaps')
      .select(`
        id,
        name,
        major,
        university_id,
        total_credits,
        expected_graduation,
        roadmap_semesters (
          id,
          name,
          year,
          season,
          roadmap_courses (
            course_code,
            course_name,
            credits,
            status,
            grade,
            prerequisites,
            description,
            difficulty_rating,
            professor,
            professor_data,
            professor_rating
          )
        )
      `)
      .eq('id', roadmapId)
      .eq('is_public', true)
      .single();

    if (fetchError || !sourceRoadmap) {
      return NextResponse.json({ error: 'Roadmap not found or not public' }, { status: 404 });
    }

    // Create a new roadmap for the current user
    const { data: newRoadmap, error: createError } = await supabase
      .from('degree_roadmaps')
      .insert({
        user_id: user.id,
        name: `${sourceRoadmap.name} (Imported)`,
        major: sourceRoadmap.major,
        university_id: sourceRoadmap.university_id,
        total_credits: sourceRoadmap.total_credits,
        expected_graduation: sourceRoadmap.expected_graduation,
        completed_credits: 0,
        current_gpa: '0.0',
        is_public: false
      })
      .select()
      .single();

    if (createError || !newRoadmap) {
      console.error('Error creating roadmap:', createError);
      return NextResponse.json({ error: 'Failed to create roadmap' }, { status: 500 });
    }

    // Import semesters and courses
    for (const semester of sourceRoadmap.roadmap_semesters) {
      // Create semester
      const { data: newSemester, error: semesterError } = await supabase
        .from('roadmap_semesters')
        .insert({
          roadmap_id: newRoadmap.id,
          name: semester.name,
          year: semester.year,
          season: semester.season
        })
        .select()
        .single();

      if (semesterError || !newSemester) {
        console.error('Error creating semester:', semesterError);
        continue;
      }

      // Create courses for this semester
      const coursesToInsert = semester.roadmap_courses.map((course: any) => ({
        roadmap_id: newRoadmap.id,
        semester_id: newSemester.id,
        course_code: course.course_code,
        course_name: course.course_name,
        credits: course.credits,
        status: 'planned', // Reset all courses to planned status
        grade: null, // Clear grades
        prerequisites: course.prerequisites,
        description: course.description,
        difficulty_rating: course.difficulty_rating,
        professor: course.professor,
        professor_data: course.professor_data,
        professor_rating: course.professor_rating
      }));

      if (coursesToInsert.length > 0) {
        const { error: coursesError } = await supabase
          .from('roadmap_courses')
          .insert(coursesToInsert);

        if (coursesError) {
          console.error('Error creating courses:', coursesError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      roadmap: newRoadmap,
      message: 'Roadmap imported successfully'
    });

  } catch (error) {
    console.error('Error importing roadmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 