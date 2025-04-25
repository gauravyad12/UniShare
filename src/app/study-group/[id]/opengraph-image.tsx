export const runtime = 'edge';

export const alt = 'UniShare Study Group';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const groupId = params.id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                 (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://unishare.app');

  // Redirect to the study group-specific OG image API
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/api/og/study-group?id=${groupId}`,
    },
  });
}
