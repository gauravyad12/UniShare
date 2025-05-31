import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import RoadmapThumbnail from '@/components/roadmap-thumbnail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, GraduationCap, BookOpen, CheckCircle, Target, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/back-button';

interface RoadmapPageProps {
  params: { id: string };
}

// Generate metadata for the roadmap page
export async function generateMetadata({ params }: RoadmapPageProps): Promise<Metadata> {
  const roadmapId = params.id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://unishare.app');

  try {
    // Fetch roadmap data
    const supabase = createClient();
    const { data: roadmap } = await supabase
      .from('degree_roadmaps')
      .select(`
        *,
        universities(name),
        roadmap_semesters(
          *,
          roadmap_courses(*)
        )
      `)
      .eq('id', roadmapId)
      .eq('is_public', true)
      .single();

    if (!roadmap) {
      return {
        title: 'UniShare | Roadmap Not Found',
        description: 'The requested roadmap could not be found.',
      };
    }

    const title = `UniShare | ${roadmap.name}`;
    const description = `${roadmap.major} degree roadmap at ${roadmap.universities?.name || 'University'}. ${roadmap.total_credits} total credits, expected graduation: ${roadmap.expected_graduation}.`;

    return {
      title,
      description,
      openGraph: {
        type: 'article',
        title,
        description,
        url: `${baseUrl}/roadmap/${roadmapId}`,
        images: [{
          url: `${baseUrl}/roadmap/${roadmapId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${roadmap.name} - ${roadmap.major} degree roadmap`,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${baseUrl}/roadmap/${roadmapId}/opengraph-image`],
      },
      alternates: {
        canonical: `${baseUrl}/roadmap/${roadmapId}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'UniShare | Roadmap',
      description: 'View this degree roadmap on UniShare.',
    };
  }
}

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const supabase = createClient();

  // Fetch roadmap data
  const { data: roadmap, error } = await supabase
    .from('degree_roadmaps')
    .select(`
      *,
      universities(name),
      roadmap_semesters(
        *,
        roadmap_courses(*)
      )
    `)
    .eq('id', params.id)
    .eq('is_public', true)
    .single();

  if (error || !roadmap) {
    notFound();
  }

  // Transform data to match the expected format
  const transformedRoadmap = {
    id: roadmap.id,
    name: roadmap.name,
    major: roadmap.major,
    university: roadmap.universities?.name || 'Unknown University',
    totalCredits: roadmap.total_credits,
    completedCredits: roadmap.completed_credits,
    expectedGraduation: roadmap.expected_graduation,
    gpa: parseFloat(roadmap.current_gpa || '0'),
    isPublic: roadmap.is_public,
    showGpa: roadmap.show_gpa,
    createdBy: roadmap.user_id,
    createdAt: roadmap.created_at,
    updatedAt: roadmap.updated_at,
    semesters: (roadmap.roadmap_semesters || []).map((semester: any) => ({
      id: semester.id,
      name: semester.name,
      year: semester.year,
      season: semester.season,
      totalCredits: (semester.roadmap_courses || []).reduce((sum: number, course: any) => sum + (course.credits || 0), 0),
      courses: (semester.roadmap_courses || []).map((course: any) => ({
        id: course.id,
        code: course.course_code,
        name: course.course_name,
        credits: course.credits,
        semester: semester.name,
        year: semester.year,
        status: course.status,
        grade: course.grade,
        prerequisites: course.prerequisites ? JSON.parse(course.prerequisites) : [],
        description: course.description,
        difficulty: course.difficulty_rating,
        professor: course.professor,
        professor_data: course.professor_data ? JSON.parse(course.professor_data) : null,
        rating: course.rating
      }))
    }))
  };

  // Calculate progress statistics
  const progressStats = {
    totalCredits: transformedRoadmap.totalCredits,
    completedCredits: transformedRoadmap.completedCredits,
    progressPercentage: transformedRoadmap.totalCredits > 0 ? (transformedRoadmap.completedCredits / transformedRoadmap.totalCredits) * 100 : 0,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold truncate">{transformedRoadmap.name}</h1>
        </div>
        <p className="text-muted-foreground">
          {transformedRoadmap.major} • {transformedRoadmap.university}
        </p>
      </div>

      {/* Progress Overview */}
      <div className={`grid grid-cols-1 gap-4 mb-8 ${transformedRoadmap.showGpa ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progressStats.completedCredits} / {progressStats.totalCredits} credits</span>
                <span className="font-medium">{progressStats.progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressStats.progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {transformedRoadmap.showGpa && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{transformedRoadmap.gpa.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/ 4.0</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected Graduation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-medium">{transformedRoadmap.expectedGraduation}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transformedRoadmap.semesters.reduce((total: number, semester: any) => total + semester.courses.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flowchart Visualization */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Roadmap Flowchart
          </CardTitle>
          <CardDescription>
            Visual representation of the degree roadmap with course connections and prerequisites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoadmapThumbnail 
            roadmap={{
              ...transformedRoadmap,
              courses: transformedRoadmap.semesters.flatMap((s: any) => s.courses.map((c: any) => ({
                ...c,
                semester_id: s.id
              })))
            }} 
            className="w-full h-full"
          />
        </CardContent>
      </Card>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transformedRoadmap.semesters.reduce((total: number, semester: any) => 
                total + semester.courses.filter((c: any) => c.status === 'completed').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">courses completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transformedRoadmap.semesters.reduce((total: number, semester: any) => 
                total + semester.courses.filter((c: any) => c.status === 'in-progress').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">courses in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              Planned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {transformedRoadmap.semesters.reduce((total: number, semester: any) => 
                total + semester.courses.filter((c: any) => c.status === 'planned').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">courses planned</p>
          </CardContent>
        </Card>
      </div>

      {/* Semester Breakdown */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Course Schedule</h2>
        <div className="grid gap-6">
          {transformedRoadmap.semesters
            .sort((a: any, b: any) => {
              // Sort by year first, then by season
              if (a.year !== b.year) return a.year - b.year;
              const seasonOrder: { [key: string]: number } = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
              return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
            })
            .map((semester: any) => (
            <Card key={semester.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5" />
                      {semester.name}
                    </CardTitle>
                    <CardDescription>
                      {semester.courses.length} courses • {semester.totalCredits} credits
                    </CardDescription>
                  </div>
                  {transformedRoadmap.showGpa && (
                    <div className="text-left sm:text-right">
                      <div className="text-sm text-muted-foreground">Semester GPA</div>
                      <div className="text-lg font-semibold">
                        {semester.courses.filter((c: any) => c.status === 'completed' && c.grade).length > 0
                          ? (semester.courses
                              .filter((c: any) => c.status === 'completed' && c.grade)
                              .reduce((sum: number, course: any) => {
                                const gradePoints = getGradePoints(course.grade);
                                return sum + (gradePoints * course.credits);
                              }, 0) / 
                              semester.courses
                                .filter((c: any) => c.status === 'completed' && c.grade)
                                .reduce((sum: number, course: any) => sum + course.credits, 0)
                            ).toFixed(2)
                          : 'N/A'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {semester.courses.map((course: any) => (
                    <div key={course.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-card gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          course.status === 'completed' ? 'bg-green-500' :
                          course.status === 'in-progress' ? 'bg-blue-500' :
                          course.status === 'failed' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base">{course.code}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{course.name}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm ml-6 sm:ml-0 sm:flex-shrink-0">
                        <span className="text-muted-foreground whitespace-nowrap">{course.credits} credits</span>
                        {transformedRoadmap.showGpa && course.grade && (
                          <Badge variant="outline" className="text-xs">{course.grade}</Badge>
                        )}
                        <Badge 
                          variant={
                            course.status === 'completed' ? 'default' :
                            course.status === 'in-progress' ? 'secondary' :
                            course.status === 'failed' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {course.status === 'in-progress' ? 'In Progress' : 
                           course.status === 'completed' ? 'Completed' :
                           course.status === 'failed' ? 'Failed' : 'Planned'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert letter grades to grade points
function getGradePoints(grade: string): number {
  const gradeMap: { [key: string]: number } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  return gradeMap[grade] || 0.0;
} 