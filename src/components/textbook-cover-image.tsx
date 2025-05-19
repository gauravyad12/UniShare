"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BookMarked } from "lucide-react";

interface TextbookCoverImageProps {
  isbn: string;
  title: string;
  primaryImageUrl?: string;
  className?: string;
}

export default function TextbookCoverImage({
  isbn,
  title,
  primaryImageUrl,
  className = "",
}: TextbookCoverImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(primaryImageUrl || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isGoogleApi, setIsGoogleApi] = useState(false);

  // Function to fetch Google Books API
  const fetchGoogleBooksImage = async (isbn: string) => {
    try {
      // Get API key from environment variable
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

      if (!apiKey) {
        return null;
      }

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Books API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const book = data.items[0];

      if (!book.volumeInfo || !book.volumeInfo.imageLinks) {
        return null;
      }

      // Get the image links from the response
      const imageLinks = book.volumeInfo.imageLinks;

      // Simply use the thumbnail URL as provided by the API
      // This is the most reliable approach
      let imageUrl = imageLinks.thumbnail || imageLinks.smallThumbnail;

      // If we found an image URL
      if (imageUrl) {
        // Only convert http to https if needed (for security)
        if (imageUrl.startsWith('http:')) {
          imageUrl = imageUrl.replace('http:', 'https:');
        }

        return imageUrl;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Function to check if image is too small (likely a 1x1 pixel placeholder)
  const isTinyImage = (width: number, height: number) => {
    // Consider images smaller than 20x20 pixels as "tiny"
    return width < 20 || height < 20;
  };

  // Function to handle image load errors including CORS and CSP issues
  const handleImageLoadError = async () => {
    // If we're already using Google Books API or have no ISBN, just show placeholder
    if (!isbn) {
      setImageUrl(null);
      setError(true);
      setIsLoading(false);
      setIsGoogleApi(false);
      return;
    }

    // If we're already using Google Books API but it failed, try again with a direct approach
    if (imageUrl?.includes('books.google')) {
      // Try a direct approach with a simplified URL
      const directUrl = `https://books.google.com/books/content?id=${imageUrl.split('id=')[1]?.split('&')[0]}&printsec=frontcover&img=1&zoom=1`;

      if (directUrl && directUrl !== imageUrl) {
        setImageUrl(directUrl);
        return; // Let the image load event handle the rest
      } else {
        setImageUrl(null);
        setError(true);
        setIsLoading(false);
        setIsGoogleApi(false);
        return;
      }
    }

    // Try Google Books API as fallback
    await handleImageError();
  };

  // Handle image error
  const handleImageError = async () => {
    // Only try Google Books if we haven't already and we have an ISBN
    if (imageUrl !== null && isbn) {
      setIsLoading(true);
      setError(true);

      // Try to get image from Google Books API
      const googleBooksImage = await fetchGoogleBooksImage(isbn);

      if (googleBooksImage) {
        setImageUrl(googleBooksImage);
        setIsGoogleApi(true);
        setError(false);
      } else {
        setImageUrl(null);
        setIsGoogleApi(false);
      }

      setIsLoading(false);
    } else {
      setImageUrl(null);
      setError(true);
      setIsLoading(false);
    }
  };

  // Set initial image URL from props
  useEffect(() => {
    // Always start with the primary image URL
    setImageUrl(primaryImageUrl || null);
    setIsLoading(true);
    setError(false);
    setIsGoogleApi(false);

    // If we know this is an archive.org URL (which often has CORS issues)
    // or if we don't have a primary URL but do have an ISBN, try Google Books API directly
    if ((primaryImageUrl && (primaryImageUrl.includes('archive.org') || primaryImageUrl.includes('olcovers'))) ||
        (!primaryImageUrl && isbn)) {

      if (isbn) {
        fetchGoogleBooksImage(isbn).then(googleUrl => {
          if (googleUrl) {
            setImageUrl(googleUrl);
            setIsGoogleApi(true);
            setError(false);
            setIsLoading(false);
          }
          // If Google Books API fails, we'll stick with the primary URL
          // which was already set above
        }).catch(() => {
          // Keep using the primary URL which was already set
        });
      }
    }
  }, [primaryImageUrl, isbn]);

  // Handle image load success
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    // If the image is too small (like a 1x1 pixel), treat it as an error
    if (isTinyImage(width, height)) {
      handleImageError();
    } else {
      setIsLoading(false);
      setError(false);
    }
  };

  // If we have no image URL or there was an error, show placeholder
  if (!imageUrl || error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-md ${className}`}>
        <BookMarked className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  // Show image with error handling
  return (
    <div className={`relative overflow-hidden rounded-md border ${className}`}>
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 90px, 120px"
        onError={handleImageLoadError}
        onLoad={handleImageLoad}
        priority
        unoptimized={true} // Disable Next.js image optimization to get accurate dimensions
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <BookMarked className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      )}
      {/* Google API indicator bubble */}
      {isGoogleApi && !isLoading && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-sm" title="Image from Google Books API">
          <span className="text-white text-[10px] font-bold">G</span>
        </div>
      )}
    </div>
  );
}
