'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { isAppilixOrDevelopment } from '@/utils/appilix-detection';

interface BackButtonProps {
  href?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function BackButton({
  href = '/dashboard/tools/degree-roadmap',
  label = 'Back to Degree Roadmap',
  variant = 'outline',
  size = 'sm',
  className = ''
}: BackButtonProps) {
  const router = useRouter();
  const [isAppilixEnv, setIsAppilixEnv] = useState(false);

  useEffect(() => {
    setIsAppilixEnv(isAppilixOrDevelopment());
  }, []);

  const handleBack = () => {
    if (isAppilixEnv) {
      // In Appilix or development environment, use same tab navigation
      window.location.href = href;
    } else {
      // In regular web browsers, use router navigation
      router.push(href);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleBack}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
} 