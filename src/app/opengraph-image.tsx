import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'UniShare - Academic Resource Sharing Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
export default async function Image() {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'}/api/og/default`;
  
  // Redirect to the API endpoint
  return new Response(null, {
    status: 302,
    headers: {
      Location: apiUrl,
    },
  });
}
