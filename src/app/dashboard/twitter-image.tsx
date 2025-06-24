export const runtime = 'edge';

export const alt = 'UniShare Dashboard';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`;

  // Redirect to the default API endpoint with page title
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/api/og/default?title=Dashboard`
    },
  });
}
