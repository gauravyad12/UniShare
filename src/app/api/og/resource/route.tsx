import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');

    if (!resourceId) {
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
            <h1>UniShare Resource</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    // Fetch resource data
    const supabase = createClient();
    const { data: resource } = await supabase
      .from('resources')
      .select('title, description, resource_type, thumbnail_url, author:user_profiles(username, full_name)')
      .eq('id', resourceId)
      .single();

    if (!resource) {
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
            <h1>UniShare Resource</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    const title = resource.title;
    const description = resource.description || 'A shared academic resource on UniShare';
    const thumbnailUrl = resource.thumbnail_url || 'https://unishare.app/default-resource.png';
    const authorName = resource.author?.full_name || resource.author?.username || 'UniShare User';
    const resourceType = resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1);

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
            flexDirection: 'row',
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ marginLeft: 16, fontSize: 30 }}>UniShare</span>
          </div>

          <div
            style={{
              display: 'flex',
              width: '50%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}
          >
            <img
              src={thumbnailUrl}
              style={{
                width: '100%',
                height: '70%',
                objectFit: 'cover',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
              alt={title}
            />
          </div>

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
                display: 'inline-block',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: 24,
                marginBottom: 20,
                width: 'fit-content',
              }}
            >
              {resourceType}
            </div>
            <h1
              style={{
                margin: '0 0 20px 0',
                fontSize: 60,
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
                fontSize: 30,
                opacity: 0.8,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {description}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 24,
                opacity: 0.7,
              }}
            >
              <span>Shared by {authorName}</span>
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
  } catch (error) {
    console.error('Error generating OG image:', error);
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
          <h1>UniShare Resource</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
