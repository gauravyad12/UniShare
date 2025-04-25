import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { searchParams } = url;
    const origin = url.origin;
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

    // First, get the resource data
    const { data: resource, error } = await supabase
      .from('resources')
      .select('title, description, resource_type, thumbnail_url, created_by, author_id')
      .eq('id', resourceId)
      .single();

    // Process the resource data

    if (error) {
      throw error;
    }

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

    // Get the author information using the author_id or created_by field
    const authorId = resource.author_id || resource.created_by;
    let authorName = 'UniShare User';

    if (authorId) {
      try {
        const { data: authorData, error: authorError } = await supabase
          .from('user_profiles')
          .select('full_name, username')
          .eq('id', authorId)
          .single();

        if (authorData && !authorError) {
          authorName = authorData.full_name || authorData.username || 'UniShare User';
        }
      } catch (authorFetchError: any) {
        // Silently continue with default author name
      }
    }

    const title = resource.title;
    const description = resource.description || 'A shared academic resource on UniShare';
    const thumbnailUrl = resource.thumbnail_url || `${origin}/og-assets/default-resource.png`;
    const resourceType = resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1);

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
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 40,
              left: 40,
              alignItems: 'center',
            }}
          >
            {/* Use the logo from the og-assets folder that's excluded from middleware */}
            <img
              src={`${origin}/og-assets/logo.png`}
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
              }}
            >
              <img
                src={thumbnailUrl}
                style={{
                  width: '100%',
                  marginTop: resource.resource_type === 'link' ? '0px' : '-60px',
                }}
                alt={title}
              />
            </div>
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
                display: 'flex',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: 24,
                marginBottom: 20,
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '200px',
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
  } catch (error: any) {
    // Return a fallback image
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
