"use client";

import { useState, useRef, useEffect } from "react";
import { GraduationCap } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  placeholder,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const defaultPlaceholder = (
    <div className={`w-full h-full flex items-center justify-center bg-muted ${className.includes('rounded-full') ? 'rounded-full' : ''}`}>
      <GraduationCap className="h-8 w-8 text-muted-foreground animate-pulse" />
    </div>
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {!isInView && (placeholder || defaultPlaceholder)}

      {isInView && (
        <>
          {!isLoaded && !hasError && (placeholder || defaultPlaceholder)}

          <img
            ref={imgRef}
            src={hasError && fallbackSrc ? fallbackSrc : src}
            alt={alt}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              position: isLoaded ? "static" : "absolute",
              top: isLoaded ? "auto" : 0,
              left: isLoaded ? "auto" : 0,
            }}
          />
        </>
      )}
    </div>
  );
}
