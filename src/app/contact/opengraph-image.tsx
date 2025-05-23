export const runtime = 'edge';

export const alt = 'UniShare Contact Us';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                 (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://unishare.app');

  // Redirect to the default API endpoint with page title
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/api/og/default?title=Contact%20Us`
    },
  });
}
