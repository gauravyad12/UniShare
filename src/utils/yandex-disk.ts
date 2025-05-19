/**
 * Utility functions for working with Yandex Disk API
 */

interface YandexDiskSize {
  url: string;
  name: string;
}

interface YandexDiskResponse {
  file?: string;
  sizes?: YandexDiskSize[];
  type?: string;
  mime_type?: string;
  name?: string;
  preview?: string;
  error?: string;
  message?: string;
}

interface YandexDiskResult {
  imageUrl: string | null;
  originalUrl: string | null;
}

/**
 * Fetch the original image URL from Yandex Disk API
 * @param publicKey The full Yandex Disk share URL (e.g., https://yadi.sk/i/4Tqq3pzgG9DMJg)
 * @returns Object containing both the proxied image URL and original preview URL
 */
export async function fetchYandexDiskImageUrl(publicKey: string): Promise<YandexDiskResult> {
  try {
    if (!publicKey || !publicKey.includes('yadi.sk')) {
      return { imageUrl: null, originalUrl: null };
    }

    // Try first with the full URL as the public_key parameter
    let apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(publicKey)}`;
    let response = await fetch(apiUrl);

    // If the first attempt fails, try with just the ID part
    if (!response.ok) {
      // Extract the ID from the URL (the last part after the last slash)
      const urlParts = publicKey.split('/');
      const id = urlParts[urlParts.length - 1];

      // Try with just the ID
      apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${id}`;
      response = await fetch(apiUrl);

      if (!response.ok) {
        // Try a third approach with a different API endpoint
        // Some users reported success with this format
        apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicKey)}`;
        response = await fetch(apiUrl);

        if (!response.ok) {
          return { imageUrl: null, originalUrl: null };
        }

        // This endpoint returns a different format with a direct download URL
        const downloadData = await response.json();

        if (downloadData && downloadData.href) {
          // Use our proxy endpoint to avoid CORS and CSP issues
          return {
            imageUrl: `/api/proxy/yandex?url=${encodeURIComponent(downloadData.href)}`,
            originalUrl: downloadData.href
          };
        }

        return { imageUrl: null, originalUrl: null };
      }
    }

    const data: YandexDiskResponse = await response.json();

    // Store the original URL for direct viewing
    let originalUrl: string | null = null;

    // Check if it's an image file
    if (data.mime_type?.startsWith('image/')) {
      // Save the preview URL for direct viewing (usually higher quality)
      if (data.preview) {
        originalUrl = data.preview;
      }

      // First try to get the original file URL
      if (data.file) {
        // Use our proxy endpoint to avoid CORS and CSP issues
        return {
          imageUrl: `/api/proxy/image?url=${encodeURIComponent(data.file)}`,
          originalUrl: originalUrl || data.file
        };
      }

      // If no direct file URL, try to get the original size from sizes array
      if (data.sizes && data.sizes.length > 0) {
        const originalSize = data.sizes.find(size => size.name === 'ORIGINAL');
        if (originalSize) {
          // Use our proxy endpoint to avoid CORS and CSP issues
          return {
            imageUrl: `/api/proxy/image?url=${encodeURIComponent(originalSize.url)}`,
            originalUrl: originalUrl || originalSize.url
          };
        }

        // If no ORIGINAL size, try to get the largest available size
        const sizeNames = ['XXXL', 'XXL', 'XL', 'L', 'M', 'S', 'XS', 'XXS', 'XXXS'];
        for (const sizeName of sizeNames) {
          const size = data.sizes.find(s => s.name === sizeName);
          if (size) {
            // Use our proxy endpoint to avoid CORS and CSP issues
            return {
              imageUrl: `/api/proxy/image?url=${encodeURIComponent(size.url)}`,
              originalUrl: originalUrl || size.url
            };
          }
        }
      }

      // If no sizes found, try to use the preview
      if (data.preview) {
        // Use our proxy endpoint to avoid CORS and CSP issues
        return {
          imageUrl: `/api/proxy/image?url=${encodeURIComponent(data.preview)}`,
          originalUrl: data.preview
        };
      }
    }

    // If it's not an image or no suitable URL found
    return { imageUrl: null, originalUrl: null };
  } catch (error) {
    return { imageUrl: null, originalUrl: null };
  }
}
