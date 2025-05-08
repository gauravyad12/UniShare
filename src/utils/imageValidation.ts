// Utility functions for validating image files

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * Maximum file size for avatar images (2MB)
 */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB in bytes

/**
 * Validates if a file is an allowed image type
 * @param file The file to validate
 * @returns True if the file is an allowed image type, false otherwise
 */
export function isValidImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Validates if a file is within the allowed size limit
 * @param file The file to validate
 * @param maxSize Maximum file size in bytes (defaults to MAX_AVATAR_SIZE)
 * @returns True if the file is within the size limit, false otherwise
 */
export function isValidFileSize(file: File, maxSize: number = MAX_AVATAR_SIZE): boolean {
  return file.size <= maxSize;
}

/**
 * Validates an image file for both type and size
 * @param file The file to validate
 * @param maxSize Maximum file size in bytes (defaults to MAX_AVATAR_SIZE)
 * @returns An object with validation result and error message if any
 */
export function validateImageFile(file: File, maxSize: number = MAX_AVATAR_SIZE): {
  valid: boolean;
  error?: string;
} {
  if (!isValidImageType(file)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.map(type => type.replace('image/', '')).join(', ')}`,
    };
  }

  if (!isValidFileSize(file, maxSize)) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size (${(maxSize / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Formats bytes into a human-readable string
 * @param bytes Number of bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
