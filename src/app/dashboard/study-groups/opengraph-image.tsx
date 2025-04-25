import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'UniShare Study Groups';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ searchParams }: { searchParams: { view?: string } }) {
  console.log('🔍 Study Groups OG Image Redirect - Request received with params:', searchParams);

  const viewParam = searchParams.view;

  // If viewing a specific study group, generate a dynamic OG image
  if (viewParam) {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'}/api/og/study-group?id=${viewParam}`;
    console.log('🔍 Study Groups OG Image Redirect - Redirecting to study group OG image:', apiUrl);

    // Redirect to the API endpoint
    return new Response(null, {
      status: 302,
      headers: {
        Location: apiUrl,
      },
    });
  }

  // Otherwise, use the default OG image
  const defaultApiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'}/api/og/default`;
  console.log('🔍 Study Groups OG Image Redirect - Redirecting to default OG image:', defaultApiUrl);

  return new Response(null, {
    status: 302,
    headers: {
      Location: defaultApiUrl,
    },
  });
}
