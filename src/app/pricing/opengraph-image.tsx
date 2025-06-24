export const runtime = 'edge';

export const alt = 'UniShare Scholar+ Premium Plan';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`;

  // Redirect to the Scholar+ social image
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/scholar-plus-social.png`,
    },
  });
}
