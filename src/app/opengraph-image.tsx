export const runtime = 'edge';

export const alt = 'UniShare - Academic Resource Sharing Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // For the landing page, use the static image directly
  const baseUrl = process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`;

  // Redirect to the static image
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/default-social.png`,
    },
  });
}
