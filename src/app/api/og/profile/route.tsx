import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { searchParams } = url;
    const origin = url.origin;
    const username = searchParams.get('username');

    if (!username) {
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
            <h1>UniShare Profile</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    // Fetch user profile data
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, username, avatar_url, university:universities(name), is_verified')
      .eq('username', username)
      .single();

    if (!profile) {
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
            <h1>UniShare Profile</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    const displayName = profile.full_name || profile.username;
    const universityName = profile.university?.name || 'University Student';
    const isVerified = profile.is_verified;

    // Determine if user has a profile image
    const hasProfileImage = !!profile.avatar_url;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            color: 'white',
            background: 'linear-gradient(to right, #000000, #333333)',
            width: '100%',
            height: '100%',
            padding: '50px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              marginTop: 20,
            }}
          >
{hasProfileImage ? (
              <img
                src={profile.avatar_url}
                width={180}
                height={179}
                style={{
                  borderRadius: '50%',
                  border: '4px solid white',
                  marginBottom: 20,
                  objectFit: 'cover',
                }}
                alt={displayName}
              />
            ) : (
              // Render a circle with the user's initials for users without a profile image
              <div
                style={{
                  width: '180px',
                  height: '179px',
                  borderRadius: '50%',
                  border: '4px solid white',
                  marginBottom: 20,
                  backgroundColor: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 70,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <h1 style={{ margin: 0, fontSize: 60 }}>{displayName}</h1>
              {isVerified && (
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginLeft: 16 }}
                >
                  <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
                  <path
                    d="M8 12L11 15L16 9"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 30, opacity: 0.8 }}>@{profile.username}</p>
            <p style={{ margin: '10px 0 0', fontSize: 24, opacity: 0.7 }}>{universityName}</p>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 50,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              fontSize: 24,
              opacity: 0.7,
            }}
          >
            unishare.app/u/{profile.username}
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
          <h1>UniShare Profile</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
