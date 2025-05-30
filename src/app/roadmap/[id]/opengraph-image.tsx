import { ImageResponse } from 'next/og';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export const alt = 'UniShare Roadmap';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface CourseNode {
  id: string;
  code: string;
  credits: number;
  status: string;
  semester_id: string;
  x: number;
  y: number;
}

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const roadmapId = params.id;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://unishare.app');

    // Fetch roadmap data
    const supabase = createClient();
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
      .eq('id', roadmapId)
      .eq('is_public', true)
      .single();

    // Default values for fallback
    let title = 'Degree Roadmap';
    let major = 'Academic Planning';
    let university = 'University';
    let totalCredits = 0;
    let completedCredits = 0;
    let expectedGraduation = '';
    let totalCourses = 0;
    let courses: any[] = [];

    if (roadmap && !error) {
      title = roadmap.name || 'Degree Roadmap';
      major = roadmap.major || 'Academic Planning';
      university = roadmap.universities?.name || 'University';
      totalCredits = roadmap.total_credits || 0;
      completedCredits = roadmap.completed_credits || 0;
      expectedGraduation = roadmap.expected_graduation || '';
      
      // Flatten courses from all semesters
      courses = roadmap.roadmap_semesters?.flatMap((semester: any) => 
        semester.roadmap_courses?.map((course: any) => ({
          id: course.id,
          code: course.course_code,
          credits: course.credits,
          status: course.status,
          semester_id: semester.id
        })) || []
      ) || [];
      
      totalCourses = courses.length;
    }

    const progressPercentage = totalCredits > 0 ? Math.round((completedCredits / totalCredits) * 100) : 0;

    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'completed': return '#10b981';
        case 'in-progress': return '#3b82f6';
        case 'failed': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            color: 'white',
            background: 'linear-gradient(to right, #000000, #222222)',
            width: '100%',
            height: '100%',
            padding: '40px',
            flexDirection: 'row',
            position: 'relative',
          }}
        >
          {/* UniShare Logo */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 40,
              left: 40,
              alignItems: 'center',
            }}
          >
            <img
              src={`${baseUrl}/og-assets/logo.png`}
              width="40"
              height="40"
              alt="UniShare Logo"
              style={{ objectFit: 'contain' }}
            />
            <span style={{ marginLeft: 16, fontSize: 30, fontWeight: 'bold' }}>UniShare</span>
          </div>

          {/* Left side - Roadmap Flowchart */}
          <div
            style={{
              display: 'flex',
              width: '50%',
              height: '100%',
              justifyContent: 'flex-start',
              alignItems: 'center',
              padding: '80px 20px 20px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '350px',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden',
                backgroundColor: '#000000',
                position: 'relative',
                padding: '20px',
              }}
            >
              {/* Grid background */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              
              {/* Course nodes */}
              {/* Connecting lines */}
              {/* Horizontal lines for top row */}
              <div
                style={{
                  position: 'absolute',
                  left: 170,
                  top: 129,
                  width: '40px',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 230,
                  top: 129,
                  width: '40px',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 290,
                  top: 129,
                  width: '40px',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              
              {/* Vertical lines connecting rows */}
              <div
                style={{
                  position: 'absolute',
                  left: 149,
                  top: 150,
                  width: '2px',
                  height: '40px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 209,
                  top: 150,
                  width: '2px',
                  height: '40px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 269,
                  top: 150,
                  width: '2px',
                  height: '40px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 329,
                  top: 150,
                  width: '2px',
                  height: '40px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              
              {/* Horizontal lines for bottom row */}
              <div
                style={{
                  position: 'absolute',
                  left: 170,
                  top: 209,
                  width: '40px',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 230,
                  top: 209,
                  width: '40px',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 290,
                  top: 209,
                  width: '40px',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 130,
                  top: 110,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#10b981',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>CS101</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 190,
                  top: 110,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#10b981',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>MATH</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>4cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 250,
                  top: 110,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>CS201</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 310,
                  top: 110,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#6b7280',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>CS202</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 130,
                  top: 190,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#6b7280',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>CS301</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 190,
                  top: 190,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#6b7280',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>CS302</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 250,
                  top: 190,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#6b7280',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>CS401</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>
              
              <div
                style={{
                  position: 'absolute',
                  left: 310,
                  top: 190,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#6b7280',
                  borderRadius: '6px',
                  border: '2px solid rgba(255,255,255,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '6px', lineHeight: 1 }}>ELEC</div>
                <div style={{ fontSize: '5px', opacity: 0.8 }}>3cr</div>
              </div>

              {/* Title overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                {title}
              </div>

              {/* Legend */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '15px',
                  display: 'flex',
                  gap: '15px',
                  fontSize: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                  <span>Done</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
                  <span>Current</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#6b7280', borderRadius: '2px' }} />
                  <span>Planned</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Roadmap Details */}
          <div
            style={{
              display: 'flex',
              width: '50%',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '20px 40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: 22,
                marginBottom: 20,
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '250px',
                whiteSpace: 'nowrap',
              }}
            >
              Degree Roadmap
            </div>
            
            <h1
              style={{
                margin: '0 0 20px 0',
                fontSize: 48,
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>
            
            <p
              style={{
                margin: '0 0 30px 0',
                fontSize: 24,
                opacity: 0.8,
                lineHeight: 1.4,
              }}
            >
              {major} • {university}
            </p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: 20,
                opacity: 0.9,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Progress:</span>
                <span style={{ fontWeight: 'bold' }}>{progressPercentage}% ({completedCredits}/{totalCredits} credits)</span>
              </div>
              {expectedGraduation && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Graduation:</span>
                  <span style={{ fontWeight: 'bold' }}>{expectedGraduation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom right URL */}
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              right: 50,
              display: 'flex',
              justifyContent: 'center',
              fontSize: 24,
              opacity: 0.7,
            }}
          >
            unishare.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a simple fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          <div style={{ marginBottom: 20 }}>🎓</div>
          <div>UniShare Roadmap</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
} 