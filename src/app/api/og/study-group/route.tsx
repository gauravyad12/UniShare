import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  console.log('🔍 Study Group OG Image Generation - Request received:', request.url);

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    console.log('🔍 Study Group OG Image - Group ID:', groupId);

    if (!groupId) {
      console.log('⚠️ Study Group OG Image - No group ID provided, returning default image');
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              color: 'black',
              background: 'white',
              width: '100%',
              height: '100%',
              padding: '50px 200px',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <h1>UniShare Study Group</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    // Fetch study group data
    console.log('🔍 Study Group OG Image - Fetching group data from Supabase');
    const supabase = createClient();

    const { data: group, error } = await supabase
      .from('study_groups')
      .select('name, description, course_code, created_by, created_at')
      .eq('id', groupId)
      .single();

    console.log('🔍 Study Group OG Image - Supabase response:', { group, error });

    if (error) {
      console.error('❌ Study Group OG Image - Supabase error:', error);
      throw error;
    }

    if (!group) {
      console.log('⚠️ Study Group OG Image - No group found with ID:', groupId);
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              color: 'black',
              background: 'white',
              width: '100%',
              height: '100%',
              padding: '50px 200px',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <h1>UniShare Study Group</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    // Get creator info
    console.log('🔍 Study Group OG Image - Fetching creator info');
    const { data: creator, error: creatorError } = await supabase
      .from('user_profiles')
      .select('username, full_name')
      .eq('id', group.created_by)
      .single();

    if (creatorError) {
      console.error('⚠️ Study Group OG Image - Error fetching creator:', creatorError);
    }

    console.log('🔍 Study Group OG Image - Creator data:', creator);

    const creatorName = creator?.full_name || creator?.username || 'UniShare User';
    const courseCode = group.course_code || 'General Study';
    const createdDate = new Date(group.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    console.log('🔍 Study Group OG Image - Generating image with data:', {
      title: group.name,
      description: group.description,
      courseCode,
      creatorName,
      createdDate
    });

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            color: 'white',
            background: 'linear-gradient(to right, #000000, #333333)',
            width: '100%',
            height: '100%',
            padding: '50px',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 50,
              left: 50,
              alignItems: 'center',
            }}
          >
            <img
              src={`${process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'}/android-chrome-512x512.png`}
              width="40"
              height="40"
              alt="UniShare Logo"
              style={{ objectFit: 'contain' }}
            />
            <span style={{ marginLeft: 16, fontSize: 30 }}>UniShare</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              textAlign: 'center',
              padding: '0 100px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 30,
              }}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                style={{ marginRight: 20 }}
              >
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21v-2a4 4 0 0 0-3-3.87"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  display: 'flex',
                  padding: '8px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                Study Group
              </div>
            </div>

            <h1
              style={{
                margin: '0 0 20px 0',
                fontSize: 70,
                lineHeight: 1.2,
              }}
            >
              {group.name}
            </h1>

            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: 30,
                marginBottom: 30,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {courseCode}
            </div>

            <p
              style={{
                margin: '0 0 40px 0',
                fontSize: 30,
                opacity: 0.8,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '800px',
              }}
            >
              {group.description}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                opacity: 0.7,
              }}
            >
              <span>Created by {creatorName} • {createdDate}</span>
            </div>
          </div>

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
      },
    );
  } catch (error: any) {
    console.error('❌ Study Group OG Image - Error generating image:', error);
    console.error('❌ Study Group OG Image - Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });

    // Return a fallback image
    console.log('🔍 Study Group OG Image - Returning fallback image');
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            color: 'black',
            background: 'white',
            width: '100%',
            height: '100%',
            padding: '50px 200px',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <h1>UniShare Study Group</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
