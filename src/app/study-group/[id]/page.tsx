'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function StudyGroupRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;

  useEffect(() => {
    // Simple redirect to the dashboard study groups page with the view parameter
    router.push(`/dashboard/study-groups?view=${groupId}`);
  }, [groupId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
