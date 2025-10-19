import { createClient } from '@/lib/supabase/client';

/**
 * Upload an image to Supabase Storage
 */
export async function uploadLocationImage(
  file: File,
  locationId: string
): Promise<{ url: string; publicId: string } | { error: string }> {
  try {
    const supabase = createClient();

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { error: 'File size too large. Maximum size is 5MB.' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${locationId}-${Date.now()}.${fileExt}`;
    const filePath = `${locationId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('location-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message || 'Failed to upload image' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('location-images')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      publicId: filePath,
    };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return { error: error.message || 'Failed to upload image' };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteLocationImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from('location-images')
      .remove([publicId]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
}): string {
  if (!url) return '';

  // If it's a Supabase storage URL, we can add transformations
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (options?.width) params.set('width', options.width.toString());
    if (options?.height) params.set('height', options.height.toString());
    if (options?.quality) params.set('quality', options.quality.toString());

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  return url;
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  minWidth = 400,
  minHeight = 300
): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          error: `Image must be at least ${minWidth}x${minHeight}px. Current: ${img.width}x${img.height}px`,
          width: img.width,
          height: img.height,
        });
      } else {
        resolve({
          valid: true,
          width: img.width,
          height: img.height,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Failed to load image',
      });
    };

    img.src = url;
  });
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

