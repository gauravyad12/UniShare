'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ResourceRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const resourceId = params.id;

  useEffect(() => {
    // Simple redirect to the dashboard resources page with the view parameter
    router.push(`/dashboard/resources?view=${resourceId}`);
  }, [resourceId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
