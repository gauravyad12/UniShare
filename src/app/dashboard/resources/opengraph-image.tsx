import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'UniShare Resources';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ searchParams }: { searchParams: { view?: string } }) {
  console.log('🔍 Resources OG Image Redirect - Request received with params:', searchParams);

  const viewParam = searchParams.view;

  // If viewing a specific resource, generate a dynamic OG image
  if (viewParam) {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'}/api/og/resource?id=${viewParam}`;
    console.log('🔍 Resources OG Image Redirect - Redirecting to resource OG image:', apiUrl);

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
  console.log('🔍 Resources OG Image Redirect - Redirecting to default OG image:', defaultApiUrl);

  return new Response(null, {
    status: 302,
    headers: {
      Location: defaultApiUrl,
    },
  });
}
