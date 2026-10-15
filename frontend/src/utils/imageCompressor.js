/**
 * Automatically optimizes and downsizes images on the client side before upload.
 * Ensures uploads stay well below Vercel's 4.5MB Serverless request payload limit
 * and keeps MongoDB Atlas storage lean and fast.
 */
export async function optimizeImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  if (!file || typeof file !== 'object' || !file.type || !file.type.startsWith('image/')) {
    return file;
  }
  // If already under 300 KB, no need to downscale
  if (file.size <= 300 * 1024) {
    return file;
  }

  // Ensure DOM is available (e.g. not in SSR / unit test environment without canvas)
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          URL.revokeObjectURL(url);
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                resolve(file);
              } else {
                const optimized = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                resolve(optimized);
              }
            },
            mimeType,
            quality
          );
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => {
        try { URL.revokeObjectURL(url); } catch {}
        resolve(file);
      };
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}
