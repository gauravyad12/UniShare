import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'UniShare User Profile';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
export default async function Image({ params }: { params: { username: string } }) {
  const username = params.username;
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'}/api/og/profile?username=${username}`;
  
  // Redirect to the API endpoint
  return new Response(null, {
    status: 302,
    headers: {
      Location: apiUrl,
    },
  });
}
