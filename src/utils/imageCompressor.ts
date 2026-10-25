export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

export async function compressImageFile(
  file: File,
  maxDimension: number = 1280,
  quality: number = 0.72
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const originalDataUrl = e.target?.result as string;
      const originalSize = file.size;

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If already small enough, no resize needed
        if (width <= maxDimension && height <= maxDimension && originalSize < 250 * 1024) {
          resolve({
            dataUrl: originalDataUrl,
            originalSize,
            compressedSize: originalSize,
            savedPercentage: 0,
          });
          return;
        }

        // Maintain aspect ratio
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: originalDataUrl,
            originalSize,
            compressedSize: originalSize,
            savedPercentage: 0,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl.indexOf('image/png') === 0) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const compressedSize = Math.round(dataUrl.length * 0.75);
        const savedPercentage = Math.max(
          0,
          Math.round((1 - compressedSize / originalSize) * 100)
        );

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          savedPercentage,
        });
      };

      img.onerror = () => {
        resolve({
          dataUrl: originalDataUrl,
          originalSize,
          compressedSize: originalSize,
          savedPercentage: 0,
        });
      };

      img.src = originalDataUrl;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
